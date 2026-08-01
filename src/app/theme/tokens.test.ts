import { describe, expect, it } from "vitest";
import { REQUIRED_TOKENS, readThemeTokens } from "./tokens";

/**
 * The reader is test infrastructure, so it gets tested too. A reader that
 * silently returns the wrong value — or the same value for both themes —
 * would let every invariant below it pass while measuring nothing.
 */
describe("readThemeTokens", () => {
  const themes = readThemeTokens();

  it("finds both themes", () => {
    expect(Object.keys(themes).sort()).toEqual(["dark", "light"]);
  });

  it("reads every required token in both themes", () => {
    for (const theme of ["dark", "light"] as const) {
      for (const token of REQUIRED_TOKENS) {
        expect(themes[theme][token], `${token} missing from ${theme}`).toBeTruthy();
      }
    }
  });

  it("does not confuse the light block with the dark one", () => {
    // The light selector is `:root.light`, which starts with the dark
    // selector's text. A careless pattern reads one block twice and every
    // light assertion silently measures dark values.
    expect(themes.dark["--color-page-bg"]).not.toBe(themes.light["--color-page-bg"]);
    expect(themes.dark["--color-text"]).not.toBe(themes.light["--color-text"]);
  });

  it("reads real colour values, never a var() indirection", () => {
    // globals.css re-declares the same custom property names inside its
    // `@theme inline` block as `var(--color-x)` self-references. Picking those
    // up instead of the real declarations yields unparseable values.
    for (const theme of ["dark", "light"] as const) {
      for (const token of REQUIRED_TOKENS) {
        expect(themes[theme][token], `${token} in ${theme}`).not.toContain("var(");
      }
    }
  });

  it("reads the values actually shipped, not a copy kept in TypeScript", () => {
    // Spot-check against the stylesheet's known dark page colour. If this ever
    // fails because the stylesheet legitimately changed, that is the reader
    // working: the test is pinned to the file, not to a duplicated table.
    expect(themes.dark["--color-page-bg"]).toBe("#0e0b14");
  });

  it("throws on a missing token rather than returning undefined", () => {
    expect(() => readThemeTokens({ requiredTokens: ["--color-does-not-exist"] })).toThrow(
      /--color-does-not-exist/,
    );
  });
});
