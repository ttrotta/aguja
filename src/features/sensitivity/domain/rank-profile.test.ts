import { describe, expect, it } from "vitest";
import { rankAcrossPhrasings } from "./rank-profile";
import type { Embedding } from "../../retrieval/domain/embedding";

function embeddingFor(vector: number[], truncated = false): Embedding {
  return { vector: Float32Array.from(vector), truncated, tokenCount: 3, totalTokens: 3 };
}

describe("rankAcrossPhrasings", () => {
  it("computes exact ranks and spreads across two phrasings, ordered by spread then chunkIndex", () => {
    // phrasing0 = 0°, phrasing1 = 180° (opposite). chunk0 = 0°, chunk1 = 90°,
    // chunk2 = 180° — chosen so ranks fully invert between phrasings for
    // chunk0/chunk2, while chunk1 sits exactly in the middle both times.
    const phrasings = [embeddingFor([1, 0]), embeddingFor([-1, 0])];
    const chunks = [embeddingFor([1, 0]), embeddingFor([0, 1]), embeddingFor([-1, 0])];

    const profiles = rankAcrossPhrasings(phrasings, chunks);

    expect(profiles).toEqual([
      { chunkIndex: 0, ranksByPhrasing: [1, 3], bestRank: 1, worstRank: 3, rankSpread: 2, truncated: false },
      { chunkIndex: 2, ranksByPhrasing: [3, 1], bestRank: 1, worstRank: 3, rankSpread: 2, truncated: false },
      { chunkIndex: 1, ranksByPhrasing: [2, 2], bestRank: 2, worstRank: 2, rankSpread: 0, truncated: false },
    ]);
  });

  it("sorts a chunk ranked 1st under one phrasing and last under another first, with the maximum possible spread", () => {
    const phrasings = [embeddingFor([1, 0]), embeddingFor([-1, 0])];
    const chunks = [embeddingFor([1, 0]), embeddingFor([0, 1]), embeddingFor([-1, 0])];
    const profiles = rankAcrossPhrasings(phrasings, chunks);
    expect(profiles[0].rankSpread).toBe(chunks.length - 1);
  });

  it("sorts a chunk holding the same rank under every phrasing last among unequal spreads", () => {
    const phrasings = [embeddingFor([1, 0]), embeddingFor([-1, 0])];
    const chunks = [embeddingFor([1, 0]), embeddingFor([0, 1]), embeddingFor([-1, 0])];
    const profiles = rankAcrossPhrasings(phrasings, chunks);
    expect(profiles.at(-1)).toMatchObject({ chunkIndex: 1, rankSpread: 0 });
  });

  it("breaks equal-spread ties by ascending chunkIndex", () => {
    const phrasings = [embeddingFor([1, 0]), embeddingFor([-1, 0])];
    const chunks = [embeddingFor([1, 0]), embeddingFor([0, 1]), embeddingFor([-1, 0])];
    const profiles = rankAcrossPhrasings(phrasings, chunks);
    const tiedAtSpreadTwo = profiles.filter((p) => p.rankSpread === 2).map((p) => p.chunkIndex);
    expect(tiedAtSpreadTwo).toEqual([0, 2]);
  });

  it("inherits rankChunks' own tie-break (ascending chunkIndex) for a tied similarity within one phrasing", () => {
    // Both phrasings are identical, and both chunks tie exactly under each —
    // this also covers "two identical phrasings is not an error".
    const phrasings = [embeddingFor([1, 0]), embeddingFor([1, 0])];
    const chunks = [embeddingFor([0, 1]), embeddingFor([0, 1])];
    const profiles = rankAcrossPhrasings(phrasings, chunks);
    expect(profiles).toEqual([
      { chunkIndex: 0, ranksByPhrasing: [1, 1], bestRank: 1, worstRank: 1, rankSpread: 0, truncated: false },
      { chunkIndex: 1, ranksByPhrasing: [2, 2], bestRank: 2, worstRank: 2, rankSpread: 0, truncated: false },
    ]);
  });

  it("throws with fewer than two phrasings", () => {
    const phrasings = [embeddingFor([1, 0])];
    const chunks = [embeddingFor([1, 0])];
    expect(() => rankAcrossPhrasings(phrasings, chunks)).toThrow();
  });

  it("returns an empty array for zero chunks without throwing", () => {
    const phrasings = [embeddingFor([1, 0]), embeddingFor([0, 1])];
    expect(rankAcrossPhrasings(phrasings, [])).toEqual([]);
  });

  it("is referentially transparent: identical inputs produce deep-equal output", () => {
    const phrasings = [embeddingFor([1, 0]), embeddingFor([0.6, 0.8])];
    const chunks = [embeddingFor([1, 0]), embeddingFor([0, 1]), embeddingFor([0.6, 0.8])];
    const first = rankAcrossPhrasings(phrasings, chunks);
    const second = rankAcrossPhrasings(phrasings, chunks);
    expect(second).toEqual(first);
  });

  it("carries a chunk's truncated flag through to its profile (FR-042)", () => {
    const phrasings = [embeddingFor([1, 0]), embeddingFor([0, 1])];
    const chunks = [embeddingFor([1, 0], true), embeddingFor([0, 1], false)];
    const profiles = rankAcrossPhrasings(phrasings, chunks);
    expect(profiles.find((p) => p.chunkIndex === 0)?.truncated).toBe(true);
    expect(profiles.find((p) => p.chunkIndex === 1)?.truncated).toBe(false);
  });
});
