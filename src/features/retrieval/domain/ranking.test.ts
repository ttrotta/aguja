import { describe, expect, it } from "vitest";
import { rankChunks } from "./ranking";
import type { Embedding } from "./embedding";

function embeddingFor(vector: number[]): Embedding {
  return { vector: Float32Array.from(vector), truncated: false, tokenCount: 3, totalTokens: 3 };
}

describe("rankChunks", () => {
  it("returns exactly one result per chunk embedding", () => {
    const query = embeddingFor([1, 0]);
    const chunks = [embeddingFor([1, 0]), embeddingFor([0, 1]), embeddingFor([-1, 0])];
    const results = rankChunks(query, chunks);
    expect(results).toHaveLength(chunks.length);
    expect(results.map((r) => r.chunkIndex).sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it("assigns rank 1..n with no gaps or duplicates", () => {
    const query = embeddingFor([1, 0]);
    const chunks = [embeddingFor([0, 1]), embeddingFor([1, 0]), embeddingFor([-1, 0])];
    const results = rankChunks(query, chunks);
    expect(results.map((r) => r.rank).sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it("orders by descending score", () => {
    const query = embeddingFor([1, 0]);
    // chunkIndex 0 is orthogonal (score 0), chunkIndex 1 matches exactly (score 1),
    // chunkIndex 2 is opposite (score -1).
    const chunks = [embeddingFor([0, 1]), embeddingFor([1, 0]), embeddingFor([-1, 0])];
    const results = rankChunks(query, chunks);
    expect(results.map((r) => r.chunkIndex)).toEqual([1, 0, 2]);
    expect(results.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("breaks ties by ascending chunkIndex, deterministically regardless of input order", () => {
    const query = embeddingFor([1, 0]);
    // Every chunk is identical, so every score ties exactly.
    const chunks = [embeddingFor([1, 0]), embeddingFor([1, 0]), embeddingFor([1, 0])];
    const results = rankChunks(query, chunks);
    expect(results.map((r) => r.chunkIndex)).toEqual([0, 1, 2]);
    expect(results.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("is referentially transparent: identical inputs produce bit-identical outputs", () => {
    const query = embeddingFor([0.6, 0.8]);
    const chunks = [embeddingFor([1, 0]), embeddingFor([0, 1]), embeddingFor([0.6, 0.8])];
    const first = rankChunks(query, chunks);
    const second = rankChunks(query, chunks);
    expect(second).toEqual(first);
  });

  it("carries truncated, tokenCount and totalTokens through from the chunk embedding (FR-017)", () => {
    const query = embeddingFor([1, 0]);
    const chunks: Embedding[] = [
      { vector: Float32Array.from([1, 0]), truncated: true, tokenCount: 256, totalTokens: 400 },
    ];
    const results = rankChunks(query, chunks);
    expect(results[0].truncated).toBe(true);
    expect(results[0].tokenCount).toBe(256);
    expect(results[0].totalTokens).toBe(400);
  });
});
