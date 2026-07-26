import { AutoTokenizer } from "@huggingface/transformers";
import type { TokenSpan } from "../../chunking/domain/tokens";
import type { Request, Response } from "./protocol";

// The model repo ID is a Hugging Face Hub identifier, not an npm package —
// it stays "Xenova/..." even though the package is @huggingface/transformers
// (research.md R-001).
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

// Cast rather than adding the "webworker" lib to tsconfig, which would
// conflict with the "dom" lib the rest of the app needs. Worker's
// postMessage/addEventListener signatures match the worker global scope's.
const ctx = self as unknown as Worker;

let tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>> | null = null;

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
    case "embed":
      // Implemented in T039 (User Story 2) — the tokenizer-only slice ships
      // first so token-based chunking never waits on the 21.9 MB model (R-004).
      break;
  }
});
