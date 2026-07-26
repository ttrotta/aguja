import { describe, expect, it } from "vitest";
import { chunkFixedSizeOverlap } from "./fixed-size-overlap";

describe("chunkFixedSizeOverlap", () => {
  it("first chunk starts at 0 and spans exactly size characters", () => {
    const content = "0123456789".repeat(3);
    const chunks = chunkFixedSizeOverlap(content, 10, 3);
    expect(chunks[0]).toEqual({
      index: 0,
      start: 0,
      end: 10,
      text: content.slice(0, 10),
      length: 10,
    });
  });

  it("every consecutive pair overlaps by exactly `overlap` characters", () => {
    const content = "x".repeat(97);
    const chunks = chunkFixedSizeOverlap(content, 20, 5);
    for (let i = 0; i < chunks.length - 1; i++) {
      expect(chunks[i + 1].start).toBe(chunks[i].end - 5);
    }
  });

  it("returns [] for empty content", () => {
    expect(chunkFixedSizeOverlap("", 10, 2)).toEqual([]);
  });

  it("returns [] for whitespace-only content", () => {
    expect(chunkFixedSizeOverlap("  \n ", 10, 2)).toEqual([]);
  });

  it("returns one chunk when content is shorter than size", () => {
    const content = "short";
    expect(chunkFixedSizeOverlap(content, 500, 100)).toEqual([
      { index: 0, start: 0, end: 5, text: content, length: 5 },
    ]);
  });

  it("rejects overlap >= size", () => {
    expect(() => chunkFixedSizeOverlap("hello world", 10, 10)).toThrow();
    expect(() => chunkFixedSizeOverlap("hello world", 10, 15)).toThrow();
  });

  it("last chunk always reaches content.length", () => {
    const content = "y".repeat(53);
    const chunks = chunkFixedSizeOverlap(content, 12, 4);
    expect(chunks.at(-1)?.end).toBe(content.length);
  });

  it("every chunk's text matches its own offsets", () => {
    const content = "The quick brown fox jumps over the lazy dog, again and again.";
    const chunks = chunkFixedSizeOverlap(content, 15, 5);
    for (const c of chunks) {
      expect(c.text).toBe(content.slice(c.start, c.end));
    }
  });
});
