// Plain data — no methods, no framework types. Produced by the worker,
// consumed here by ranking.
export type Embedding = {
  vector: Float32Array;
  truncated: boolean;
  tokenCount: number;
  totalTokens: number;
};
