import { describe, expect, it } from "vitest";
import { lexicalOverlap } from "./lexical-overlap";

describe("lexicalOverlap", () => {
  it("returns 1 for identical strings", () => {
    expect(lexicalOverlap("the quick brown fox", "the quick brown fox")).toBe(1);
  });

  it("returns 0 when no tokens are shared", () => {
    expect(lexicalOverlap("apples oranges bananas", "trains planes automobiles")).toBe(0);
  });

  it("returns 0 when either string is empty", () => {
    expect(lexicalOverlap("", "some text here")).toBe(0);
    expect(lexicalOverlap("some text here", "")).toBe(0);
  });

  it("returns 0 when both strings are empty, not 1", () => {
    expect(lexicalOverlap("", "")).toBe(0);
  });

  it("is case-insensitive", () => {
    expect(lexicalOverlap("Refund Policy", "REFUND policy")).toBe(1);
  });

  it("ignores punctuation and spacing differences", () => {
    expect(lexicalOverlap("refunds, returns, and exchanges!", "refunds returns and exchanges")).toBe(1);
  });

  it("is symmetric regardless of argument order", () => {
    const a = "the refund window is thirty days";
    const b = "the return window is fourteen days";
    expect(lexicalOverlap(a, b)).toBe(lexicalOverlap(b, a));
  });

  it("computes an exact literal value for partial overlap", () => {
    // {the,quick,brown,fox} vs {the,quick,red,fox}: intersection 3, union 5.
    expect(lexicalOverlap("the quick brown fox", "the quick red fox")).toBeCloseTo(3 / 5, 10);
  });
});
