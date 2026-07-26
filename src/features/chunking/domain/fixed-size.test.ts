import { describe, expect, it } from "vitest";
import { chunkFixedSize } from "./fixed-size";

describe("chunkFixedSize", () => {
  it("splits content into equal-size chunks, last chunk shorter", () => {
    const content = "a".repeat(25);
    expect(chunkFixedSize(content, 10)).toEqual([
      { index: 0, start: 0, end: 10, text: "a".repeat(10), length: 10 },
      { index: 1, start: 10, end: 20, text: "a".repeat(10), length: 10 },
      { index: 2, start: 20, end: 25, text: "a".repeat(5), length: 5 },
    ]);
  });

  it("returns [] for empty content", () => {
    expect(chunkFixedSize("", 10)).toEqual([]);
  });

  it("returns [] for whitespace-only content", () => {
    expect(chunkFixedSize("   \n  ", 10)).toEqual([]);
  });

  it("returns exactly one chunk when content is shorter than size", () => {
    const content = "short";
    expect(chunkFixedSize(content, 500)).toEqual([
      { index: 0, start: 0, end: 5, text: content, length: 5 },
    ]);
  });

  it("returns exactly one chunk when content length equals size", () => {
    const content = "a".repeat(10);
    expect(chunkFixedSize(content, 10)).toEqual([
      { index: 0, start: 0, end: 10, text: content, length: 10 },
    ]);
  });

  it("concatenating chunk text reproduces the source exactly (FR-010)", () => {
    const content = "The quick brown fox jumps over the lazy dog. ".repeat(5);
    const chunks = chunkFixedSize(content, 17);
    expect(chunks.map((c) => c.text).join("")).toBe(content);
  });
});
