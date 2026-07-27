import { describe, expect, it } from "vitest";
import { makeComparison, resultAtOffset } from "./comparison";
import type { Chunk } from "../../chunking/domain/chunk";
import type { RankedResult } from "../../retrieval/domain/ranking";

function result(chunkIndex: number, rank: number, score: number): RankedResult {
  return { chunkIndex, rank, score, truncated: false, tokenCount: 3, totalTokens: 3 };
}

describe("makeComparison", () => {
  it("holds exactly two named sides, not a list (FR-022)", () => {
    const left = { type: "fixed-size", size: 500 } as const;
    const right = { type: "paragraphs" } as const;
    const comparison = makeComparison(left, [], right, []);

    expect(comparison).toEqual({ left, right, leftResults: [], rightResults: [] });
    expect(Object.keys(comparison).sort()).toEqual(
      ["left", "leftResults", "right", "rightResults"].sort(),
    );
  });
});

describe("resultAtOffset", () => {
  it("finds the chunk covering an offset and returns its ranked result", () => {
    const chunks: Chunk[] = [
      { index: 0, start: 0, end: 5, text: "hello", length: 5 },
      { index: 1, start: 5, end: 10, text: "world", length: 5 },
    ];
    const results = [result(0, 2, 0.4), result(1, 1, 0.9)];

    expect(resultAtOffset(chunks, results, 2)).toEqual(result(0, 2, 0.4));
    expect(resultAtOffset(chunks, results, 7)).toEqual(result(1, 1, 0.9));
  });

  it("resolves independently on each side when the two strategies chunk differently", () => {
    // Same document, but "left" cuts every 4 characters and "right" cuts
    // every 6 — offset 5 lands in a different chunk on each side.
    const leftChunks: Chunk[] = [
      { index: 0, start: 0, end: 4, text: "abcd", length: 4 },
      { index: 1, start: 4, end: 8, text: "efgh", length: 4 },
    ];
    const rightChunks: Chunk[] = [{ index: 0, start: 0, end: 6, text: "abcdef", length: 6 }];
    const leftResults = [result(0, 2, 0.1), result(1, 1, 0.8)];
    const rightResults = [result(0, 1, 0.5)];

    expect(resultAtOffset(leftChunks, leftResults, 5)).toEqual(result(1, 1, 0.8));
    expect(resultAtOffset(rightChunks, rightResults, 5)).toEqual(result(0, 1, 0.5));
  });

  it("returns null for an offset outside every chunk", () => {
    const chunks: Chunk[] = [{ index: 0, start: 0, end: 5, text: "hello", length: 5 }];
    const results = [result(0, 1, 1)];

    expect(resultAtOffset(chunks, results, -1)).toBeNull();
    expect(resultAtOffset(chunks, results, 5)).toBeNull();
  });
});
