import { describe, expect, it } from "vitest";
import { chunkByTokens, type TokenSpan } from "./tokens";

describe("chunkByTokens", () => {
  it("groups tokenSpans into chunks of up to `size` tokens", () => {
    const content = "abcdefghij";
    const spans: TokenSpan[] = Array.from({ length: 10 }, (_, i) => ({ start: i, end: i + 1 }));
    expect(chunkByTokens(content, spans, 4)).toEqual([
      { index: 0, start: 0, end: 4, text: "abcd", length: 4 },
      { index: 1, start: 4, end: 8, text: "efgh", length: 4 },
      { index: 2, start: 8, end: 10, text: "ij", length: 2 },
    ]);
  });

  it("returns [] for an empty span list", () => {
    expect(chunkByTokens("", [], 128)).toEqual([]);
  });

  it("returns one chunk when there are fewer spans than size", () => {
    const content = "hello";
    const spans: TokenSpan[] = [{ start: 0, end: 5 }];
    expect(chunkByTokens(content, spans, 128)).toEqual([
      { index: 0, start: 0, end: 5, text: content, length: 5 },
    ]);
  });

  it("every chunk's text matches its own offsets", () => {
    const content = "the quick brown fox jumps";
    const spans: TokenSpan[] = [
      { start: 0, end: 4 },
      { start: 4, end: 10 },
      { start: 10, end: 16 },
      { start: 16, end: 20 },
      { start: 20, end: 26 },
    ];
    const chunks = chunkByTokens(content, spans, 2);
    for (const c of chunks) {
      expect(c.text).toBe(content.slice(c.start, c.end));
    }
  });

  it("concatenating chunk text reproduces the source exactly when spans cover it fully (FR-010)", () => {
    const content = "abcdefghij";
    const spans: TokenSpan[] = Array.from({ length: 10 }, (_, i) => ({ start: i, end: i + 1 }));
    const chunks = chunkByTokens(content, spans, 3);
    expect(chunks.map((c) => c.text).join("")).toBe(content);
  });
});
