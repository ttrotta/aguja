import { AutoModel, AutoTokenizer, env, mean_pooling } from "@huggingface/transformers";
import type { TokenSpan } from "../../chunking/domain/tokens";
import type { Embedding } from "../domain/embedding";
import type { Request, Response } from "./protocol";

// The model repo ID is a Hugging Face Hub identifier, not an npm package —
// it stays "Xenova/..." even though the package is @huggingface/transformers
// (research.md R-001).
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

// sentence-transformers/all-MiniLM-L6-v2's own encode default truncates at
// 256 word pieces even though the underlying BERT tower supports 512
// (its tokenizer_config.json carries model_max_length: 512, inherited from
// bert-base-uncased — the 256 figure is a sentence-transformers convention
// this ONNX port does not carry over, so it must be enforced here explicitly
// rather than left to the tokenizer's default `truncation: true`). This is
// the fixed 256-token ceiling CLAUDE.md and D-006 describe.
const MAX_MODEL_TOKENS = 256;

// D-007 / R-003: pin WASM, not WebGPU, and a fixed thread count. Capability
// detection would make scores device-dependent and break SC-007/FR-016.
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}

// Cast rather than adding the "webworker" lib to tsconfig, which would
// conflict with the "dom" lib the rest of the app needs. Worker's
// postMessage/addEventListener signatures match the worker global scope's.
const ctx = self as unknown as Worker;

let tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>> | null = null;
let model: Awaited<ReturnType<typeof AutoModel.from_pretrained>> | null = null;

function post(message: Response) {
  ctx.postMessage(message);
}

async function loadTokenizer() {
  try {
    tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, {
      progress_callback: (info: { status: string; loaded?: number; total?: number }) => {
        if (info.status === "progress" && info.loaded !== undefined && info.total !== undefined) {
          post({ type: "progress", target: "tokenizer", loaded: info.loaded, total: info.total });
        }
      },
    });
    post({ type: "tokenizer-ready" });
  } catch (error) {
    post({
      type: "error",
      target: "tokenizer",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// The JS tokenizer has no offset-mapping API (unlike Python's "fast"
// tokenizers), so spans are reconstructed by matching each wordpiece against
// the source text in order. A run of blank/unmatched input degrades to a
// zero-width span at the cursor rather than throwing. Interior gaps between
// matched pieces (whitespace, punctuation) are absorbed into the preceding
// span, and the first/last spans are forced to [0, text.length) — the same
// covering-span technique paragraphs.ts uses (R-005).
function computeTokenSpans(text: string, tokens: string[]): TokenSpan[] {
  const lowerText = text.toLowerCase();
  const raw: TokenSpan[] = [];
  let cursor = 0;
  for (const token of tokens) {
    const piece = (token.startsWith("##") ? token.slice(2) : token).toLowerCase();
    let start = piece.length > 0 ? lowerText.indexOf(piece, cursor) : -1;
    if (start === -1) start = cursor;
    const end = start + piece.length;
    raw.push({ start, end });
    cursor = end;
  }

  return raw.map((span, i) => ({
    start: i === 0 ? 0 : span.start,
    end: i === raw.length - 1 ? text.length : raw[i + 1].start,
  }));
}

function tokenize(id: string, text: string) {
  if (!tokenizer) {
    post({ type: "error", target: "tokenizer", message: "Tokenizer is not loaded yet." });
    return;
  }
  const tokens = tokenizer.tokenize(text, { add_special_tokens: false });
  post({ type: "tokenized", id, spans: computeTokenSpans(text, tokens) });
}

async function loadModel() {
  try {
    // R-003/D-007: device/dtype are pinned explicitly rather than left to
    // capability-based defaults, for the same determinism reason as the
    // WASM thread count above.
    model = await AutoModel.from_pretrained(MODEL_ID, {
      device: "wasm",
      dtype: "q8",
      progress_callback: (info: { status: string; loaded?: number; total?: number }) => {
        if (info.status === "progress" && info.loaded !== undefined && info.total !== undefined) {
          post({ type: "progress", target: "model", loaded: info.loaded, total: info.total });
        }
      },
    });
    post({ type: "model-ready" });
  } catch (error) {
    post({
      type: "error",
      target: "model",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Word-piece count including the [CLS]/[SEP] special tokens the model
// actually sees — this is what MAX_MODEL_TOKENS caps, not the raw piece count.
function countTokens(text: string): number {
  if (!tokenizer) return 0;
  return tokenizer.tokenize(text, { add_special_tokens: false }).length + 2;
}

async function embed(id: string, texts: string[]) {
  if (!tokenizer || !model) {
    post({ type: "error", target: "model", message: "Model is not loaded yet." });
    return;
  }
  try {
    const totalTokensPerText = texts.map(countTokens);
    const modelInputs = tokenizer(texts, {
      padding: true,
      truncation: true,
      max_length: MAX_MODEL_TOKENS,
    });
    const outputs = await model(modelInputs);
    const pooled = mean_pooling(outputs.last_hidden_state, modelInputs.attention_mask).normalize(
      2,
      -1,
    );
    const rows = pooled.tolist() as number[][];

    const embeddings: Embedding[] = rows.map((row, i) => {
      const totalTokens = totalTokensPerText[i];
      return {
        vector: Float32Array.from(row),
        truncated: totalTokens > MAX_MODEL_TOKENS,
        tokenCount: Math.min(totalTokens, MAX_MODEL_TOKENS),
        totalTokens,
      };
    });
    post({ type: "embedded", id, embeddings });
  } catch (error) {
    post({
      type: "error",
      target: "model",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

ctx.addEventListener("message", (event: MessageEvent<Request>) => {
  const request = event.data;
  switch (request.type) {
    case "load-tokenizer":
      void loadTokenizer();
      break;
    case "tokenize":
      tokenize(request.id, request.text);
      break;
    case "load-model":
      void loadModel();
      break;
    case "embed":
      void embed(request.id, request.texts);
      break;
  }
});
