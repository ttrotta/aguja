import { describe, expect, it } from "vitest";
import { MAX_DOCUMENT_LENGTH, isEmpty, validateDocument } from "./document";

describe("MAX_DOCUMENT_LENGTH", () => {
  it("is 50,000 characters (FR-003)", () => {
    expect(MAX_DOCUMENT_LENGTH).toBe(50_000);
  });
});

describe("isEmpty", () => {
  it("is true for an empty string", () => {
    expect(isEmpty("")).toBe(true);
  });

  it("is true for whitespace-only content", () => {
    expect(isEmpty("   \n\t  \n  ")).toBe(true);
  });

  it("is false for content with any non-whitespace character", () => {
    expect(isEmpty("a")).toBe(false);
    expect(isEmpty("  a  ")).toBe(false);
  });
});

describe("validateDocument", () => {
  it("accepts content at or under the cap", () => {
    expect(validateDocument("hello")).toEqual({ valid: true });
    expect(validateDocument("a".repeat(MAX_DOCUMENT_LENGTH))).toEqual({ valid: true });
  });

  it("accepts empty content — emptiness is not a length violation", () => {
    expect(validateDocument("")).toEqual({ valid: true });
  });

  it("rejects content over the cap, naming the length and the max", () => {
    const content = "a".repeat(MAX_DOCUMENT_LENGTH + 1);
    expect(validateDocument(content)).toEqual({
      valid: false,
      reason: "too-long",
      length: MAX_DOCUMENT_LENGTH + 1,
      max: MAX_DOCUMENT_LENGTH,
    });
  });

  it("never throws", () => {
    expect(() => validateDocument("")).not.toThrow();
    expect(() => validateDocument("a".repeat(MAX_DOCUMENT_LENGTH * 2))).not.toThrow();
  });

  it("never modifies the input it validates", () => {
    const content = "  padded  ";
    validateDocument(content);
    expect(content).toBe("  padded  ");
  });
});
