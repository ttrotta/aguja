import { cosineSimilarity } from "./similarity";
import type { Embedding } from "./embedding";

export type RankedResult = {
  chunkIndex: number;
  score: number;
  rank: number;
  truncated: boolean;
  // Carried through from Embedding so the UI can state *how much* was cut,
  // not just that it was (FR-017: "indicate how much of the chunk was not
  // embedded" — a plain truncated flag alone doesn't satisfy that).
  tokenCount: number;
  totalTokens: number;
};

/**
 * Ranks every chunk against the query — no top-N cut, since a chunk ranking
 * 34th is the diagnosis (contracts/domain-api.md §3). Ties break by ascending
 * chunkIndex, not by sort stability, so the ordering is deterministic
 * regardless of input order (FR-015, FR-016, SC-007).
 */
export function rankChunks(
  queryEmbedding: Embedding,
  chunkEmbeddings: readonly Embedding[],
): RankedResult[] {
  const scored = chunkEmbeddings.map((embedding, chunkIndex) => ({
    chunkIndex,
    score: cosineSimilarity(queryEmbedding.vector, embedding.vector),
    truncated: embedding.truncated,
    tokenCount: embedding.tokenCount,
    totalTokens: embedding.totalTokens,
  }));

  scored.sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex);

  return scored.map((entry, i) => ({ ...entry, rank: i + 1 }));
}
