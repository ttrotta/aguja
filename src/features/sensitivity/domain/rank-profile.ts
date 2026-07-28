import { rankChunks } from "../../retrieval/domain/ranking";
import type { Embedding } from "../../retrieval/domain/embedding";

export type ChunkRankProfile = {
  chunkIndex: number;
  ranksByPhrasing: number[];
  bestRank: number;
  worstRank: number;
  rankSpread: number;
  truncated: boolean;
};

/**
 * Ranks every chunk against every phrasing of one question and reports how
 * much each chunk's rank moves — the retrieval failure that a single query
 * can never reveal, because one ranking always looks decisive (FR-039).
 *
 * Delegates each phrasing's own ranking to the existing rankChunks rather
 * than reimplementing its tie-break, so a tied similarity score within one
 * phrasing resolves identically to v1: ascending chunkIndex.
 */
export function rankAcrossPhrasings(
  phrasingEmbeddings: readonly Embedding[],
  chunkEmbeddings: readonly Embedding[],
): ChunkRankProfile[] {
  if (phrasingEmbeddings.length < 2) {
    throw new Error("Comparing phrasings needs at least two.");
  }

  const rankedPerPhrasing = phrasingEmbeddings.map((phrasing) =>
    rankChunks(phrasing, chunkEmbeddings),
  );

  const profiles: ChunkRankProfile[] = chunkEmbeddings.map((embedding, chunkIndex) => {
    const ranksByPhrasing = rankedPerPhrasing.map((results) => {
      const result = results.find((r) => r.chunkIndex === chunkIndex);
      if (!result) {
        throw new Error(`No rank computed for chunk ${chunkIndex}.`);
      }
      return result.rank;
    });
    const bestRank = Math.min(...ranksByPhrasing);
    const worstRank = Math.max(...ranksByPhrasing);
    return {
      chunkIndex,
      ranksByPhrasing,
      bestRank,
      worstRank,
      rankSpread: worstRank - bestRank,
      truncated: embedding.truncated,
    };
  });

  return profiles.sort((a, b) => b.rankSpread - a.rankSpread || a.chunkIndex - b.chunkIndex);
}
