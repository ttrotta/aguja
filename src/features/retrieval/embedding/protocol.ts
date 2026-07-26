import type { TokenSpan } from "../../chunking/domain/tokens";

export type Embedding = {
  vector: Float32Array;
  truncated: boolean;
  tokenCount: number;
  totalTokens: number;
};

/** Main thread → worker (contracts/domain-api.md §4). */
export type Request =
  | { type: "load-tokenizer" }
  | { type: "load-model" }
  | { type: "tokenize"; id: string; text: string }
  | { type: "embed"; id: string; texts: string[] };

/** Worker → main thread (contracts/domain-api.md §4). */
export type Response =
  | { type: "tokenizer-ready" }
  | { type: "model-ready" }
  | { type: "progress"; target: "tokenizer" | "model"; loaded: number; total: number }
  | { type: "tokenized"; id: string; spans: TokenSpan[] }
  | { type: "embedded"; id: string; embeddings: Embedding[] }
  | { type: "error"; target: "tokenizer" | "model"; message: string };
