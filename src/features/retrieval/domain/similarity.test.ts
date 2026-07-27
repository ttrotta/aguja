import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "./similarity";

describe("cosineSimilarity", () => {
  it("is 1 for a normalized vector against itself", () => {
    const v = Float32Array.from([0.6, 0.8]); // already unit length
    // Float32 rounding means 0.6^2 + 0.8^2 lands a few ulps from 1, not exactly 1.
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 6);
  });

  it("is 0 for orthogonal normalized vectors", () => {
    const a = Float32Array.from([1, 0]);
    const b = Float32Array.from([0, 1]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 6);
  });

  it("is -1 for opposite normalized vectors", () => {
    const a = Float32Array.from([1, 0]);
    const b = Float32Array.from([-1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 6);
  });

  it("throws on dimension mismatch rather than returning a meaningless score", () => {
    const a = Float32Array.from([1, 0, 0]);
    const b = Float32Array.from([1, 0]);
    expect(() => cosineSimilarity(a, b)).toThrow();
  });
});
