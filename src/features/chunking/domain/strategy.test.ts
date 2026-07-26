import { describe, expect, it } from "vitest";
import { validateStrategy } from "./strategy";

describe("validateStrategy", () => {
  it("accepts valid fixed-size parameters", () => {
    expect(validateStrategy({ type: "fixed-size", size: 500 })).toEqual({ valid: true });
  });

  it("accepts valid fixed-size-overlap parameters", () => {
    expect(validateStrategy({ type: "fixed-size-overlap", size: 500, overlap: 100 })).toEqual({
      valid: true,
    });
  });

  it("accepts paragraphs unconditionally — it takes no parameters", () => {
    expect(validateStrategy({ type: "paragraphs" })).toEqual({ valid: true });
  });

  it("accepts valid tokens parameters", () => {
    expect(validateStrategy({ type: "tokens", size: 128 })).toEqual({ valid: true });
  });

  it("rejects size <= 0 for fixed-size, naming the violated constraint", () => {
    const zero = validateStrategy({ type: "fixed-size", size: 0 });
    expect(zero.valid).toBe(false);
    expect((zero as { reason: string }).reason).toMatch(/size/i);

    const negative = validateStrategy({ type: "fixed-size", size: -5 });
    expect(negative.valid).toBe(false);
  });

  it("rejects size <= 0 for tokens, naming the violated constraint", () => {
    const result = validateStrategy({ type: "tokens", size: 0 });
    expect(result.valid).toBe(false);
    expect((result as { reason: string }).reason).toMatch(/size/i);
  });

  it("rejects overlap >= size for fixed-size-overlap, naming the violated constraint", () => {
    const equal = validateStrategy({ type: "fixed-size-overlap", size: 100, overlap: 100 });
    expect(equal.valid).toBe(false);
    expect((equal as { reason: string }).reason).toMatch(/overlap/i);

    const greater = validateStrategy({ type: "fixed-size-overlap", size: 100, overlap: 150 });
    expect(greater.valid).toBe(false);
  });

  it("rejects negative overlap even when less than size", () => {
    const result = validateStrategy({ type: "fixed-size-overlap", size: 100, overlap: -1 });
    expect(result.valid).toBe(false);
  });
});
