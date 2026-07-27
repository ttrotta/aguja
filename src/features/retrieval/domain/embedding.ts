// Plain data — no methods, no framework types (data-model.md "Embedding").
// Produced by the worker (retrieval/embedding/), consumed here by ranking.
export type Embedding = {
  vector: Float32Array;
  truncated: boolean;
  tokenCount: number;
  totalTokens: number;
};
