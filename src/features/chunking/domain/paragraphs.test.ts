import { describe, expect, it } from "vitest";
import { chunkParagraphs } from "./paragraphs";

describe("chunkParagraphs", () => {
  it("splits on blank-line-separated paragraphs; each chunk runs to the next paragraph's start", () => {
    const content = "First paragraph.\n\nSecond paragraph.\n\nThird.";
    const chunks = chunkParagraphs(content);
    expect(chunks).toHaveLength(3);
    expect(chunks.map((c) => c.text).join("")).toBe(content);
  });

  it("no blank line anywhere yields exactly one chunk (SC-010)", () => {
    const content = "Just one long paragraph with no breaks at all, only sentences.";
    expect(chunkParagraphs(content)).toEqual([
      { index: 0, start: 0, end: content.length, text: content, length: content.length },
    ]);
  });

  it("consecutive blank lines collapse rather than producing empty chunks", () => {
    const content = "First.\n\n\n\n\nSecond.";
    const chunks = chunkParagraphs(content);
    for (const c of chunks) {
      expect(c.start).toBeLessThan(c.end);
    }
    expect(chunks.map((c) => c.text).join("")).toBe(content);
  });

  it("returns [] for empty content", () => {
    expect(chunkParagraphs("")).toEqual([]);
  });

  it("returns [] for whitespace-only content", () => {
    expect(chunkParagraphs("   \n\n   ")).toEqual([]);
  });

  it("chunks are never empty", () => {
    const content = "A.\n\nB.\n\n\n\nC.\n\nD.";
    const chunks = chunkParagraphs(content);
    for (const c of chunks) {
      expect(c.text.length).toBeGreaterThan(0);
    }
  });
});
