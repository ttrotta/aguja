import { describe, expect, it } from "vitest";
import { composite, contrastRatio, parseColor, relativeLuminance } from "./contrast";

/**
 * Calibration.
 *
 * These cases exist to prove the measuring instrument before anything is
 * measured with it. Every expected value is a published WCAG/WebAIM reference,
 * not a number produced by this implementation and then frozen — a test that
 * asserts whatever the code already does would pass just as happily with the
 * formula wrong, and every contrast claim built on it would be worthless.
 */
describe("relativeLuminance", () => {
  it("puts black at 0 and white at 1", () => {
    expect(relativeLuminance(parseColor("#000000"))).toBe(0);
    expect(relativeLuminance(parseColor("#FFFFFF"))).toBe(1);
  });

  it("applies the sRGB linearisation rather than using the raw channel", () => {
    // Mid grey is 0.5 in channel terms but far darker in light terms. A
    // implementation that skipped linearisation would land near 0.5.
    const midGrey = relativeLuminance(parseColor("#808080"));
    expect(midGrey).toBeGreaterThan(0.21);
    expect(midGrey).toBeLessThan(0.22);
  });
});

describe("contrastRatio", () => {
  it.each([
    ["#000000", "#FFFFFF", 21.0, "black on white — the maximum"],
    ["#FFFFFF", "#FFFFFF", 1.0, "white on white — the minimum"],
    ["#000000", "#000000", 1.0, "black on black — the minimum"],
    ["#767676", "#FFFFFF", 4.54, "the smallest grey that clears AA on white"],
    ["#595959", "#FFFFFF", 7.0, "the AAA threshold grey on white"],
    ["#0000FF", "#FFFFFF", 8.59, "pure blue on white"],
    ["#FF0000", "#FFFFFF", 4.0, "pure red on white"],
  ])("%s on %s is %f:1 (%s)", (fg, bg, expected) => {
    expect(contrastRatio(parseColor(fg), parseColor(bg))).toBeCloseTo(expected, 2);
  });

  it("is symmetric — order of arguments cannot change the answer", () => {
    const a = parseColor("#767676");
    const b = parseColor("#FFFFFF");
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });
});

describe("composite", () => {
  it("returns the foreground unchanged at full opacity", () => {
    const fg = { r: 255, g: 0, b: 0, a: 1 };
    const bg = { r: 0, g: 0, b: 255, a: 1 };
    expect(composite(fg, bg)).toMatchObject({ r: 255, g: 0, b: 0 });
  });

  it("returns the background unchanged at zero opacity", () => {
    const fg = { r: 255, g: 0, b: 0, a: 0 };
    const bg = { r: 0, g: 0, b: 255, a: 1 };
    expect(composite(fg, bg)).toMatchObject({ r: 0, g: 0, b: 255 });
  });

  it("blends linearly in channel space at half opacity", () => {
    const fg = { r: 255, g: 255, b: 255, a: 0.5 };
    const bg = { r: 0, g: 0, b: 0, a: 1 };
    expect(composite(fg, bg)).toMatchObject({ r: 128, g: 128, b: 128 });
  });

  it("is what makes an rgba text colour measurable at all", () => {
    // A translucent foreground and the surface behind it are not two
    // independent colours. Measuring them as if they were is exactly how the
    // light theme shipped below AA — see research.md R-001.
    const translucentBlack = { r: 0, g: 0, b: 0, a: 0.62 };
    const white = { r: 255, g: 255, b: 255, a: 1 };

    const naive = contrastRatio(translucentBlack, white);
    const honest = contrastRatio(composite(translucentBlack, white), white);

    expect(naive).toBeCloseTo(21, 1);
    expect(honest).toBeLessThan(naive);
  });
});

describe("parseColor", () => {
  it("reads six-digit hex", () => {
    expect(parseColor("#A970FF")).toEqual({ r: 169, g: 112, b: 255, a: 1 });
  });

  it("is case-insensitive", () => {
    expect(parseColor("#a970ff")).toEqual(parseColor("#A970FF"));
  });

  it("reads rgba with a fractional alpha", () => {
    expect(parseColor("rgba(242, 239, 245, 0.62)")).toEqual({
      r: 242,
      g: 239,
      b: 245,
      a: 0.62,
    });
  });

  it("reads rgb without an alpha as fully opaque", () => {
    expect(parseColor("rgb(14, 11, 20)")).toEqual({ r: 14, g: 11, b: 20, a: 1 });
  });

  it("refuses anything it does not understand rather than guessing", () => {
    expect(() => parseColor("rebeccapurple")).toThrow();
    expect(() => parseColor("#abc")).toThrow();
    expect(() => parseColor("")).toThrow();
  });
});
