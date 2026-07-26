import { describe, expect, it } from "vitest";
import { toSegments } from "./segments";
import type { Chunk } from "./chunk";

describe("toSegments", () => {
  it("tiles [0, contentLength) exactly with no gaps for non-overlapping chunks", () => {
    const chunks: Chunk[] = [
      { index: 0, start: 0, end: 10, text: "a".repeat(10), length: 10 },
      { index: 1, start: 10, end: 20, text: "a".repeat(10), length: 10 },
      { index: 2, start: 20, end: 25, text: "a".repeat(5), length: 5 },
    ];
    expect(toSegments(chunks, 25)).toEqual([
      { start: 0, end: 10, chunkIndices: [0] },
      { start: 10, end: 20, chunkIndices: [1] },
      { start: 20, end: 25, chunkIndices: [2] },
    ]);
  });

  it("multi-chunk regions carry every covering chunkIndex, ascending", () => {
    const chunks: Chunk[] = [
      { index: 0, start: 0, end: 10, text: "a".repeat(10), length: 10 },
      { index: 1, start: 7, end: 17, text: "a".repeat(10), length: 10 },
    ];
    expect(toSegments(chunks, 17)).toEqual([
      { start: 0, end: 7, chunkIndices: [0] },
      { start: 7, end: 10, chunkIndices: [0, 1] },
      { start: 10, end: 17, chunkIndices: [1] },
    ]);
  });

  it("returns [] for zero chunks and zero-length content", () => {
    expect(toSegments([], 0)).toEqual([]);
  });

  it("every segment has at least one covering chunk, and segments span the full content", () => {
    const chunks: Chunk[] = [
      { index: 0, start: 0, end: 5, text: "aaaaa", length: 5 },
      { index: 1, start: 3, end: 8, text: "aaaaa", length: 5 },
      { index: 2, start: 8, end: 12, text: "aaaa", length: 4 },
    ];
    const segments = toSegments(chunks, 12);
    for (const s of segments) {
      expect(s.chunkIndices.length).toBeGreaterThanOrEqual(1);
    }
    expect(segments[0].start).toBe(0);
    expect(segments.at(-1)?.end).toBe(12);
  });
});
