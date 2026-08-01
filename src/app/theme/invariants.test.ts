import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AA_BODY, composite, contrastRatio, effectiveContrast, parseColor, type Rgba } from "./contrast";
import { SURFACE_TOKENS, readThemeTokens, type ThemeName } from "./tokens";

/**
 * The contrast floor, as an executable invariant.
 *
 * Encodes contracts/design-tokens.md. These ran as a manual checklist before,
 * which is how four theme/surface combinations shipped below AA and stayed
 * that way for three features.
 */

const themes = readThemeTokens();
const THEME_NAMES = ["dark", "light"] as const satisfies readonly ThemeName[];

/**
 * Every production .ts/.tsx file under a directory, recursively.
 *
 * Test files are excluded, and not as a convenience: this very file contains
 * the string `text-violet-deep` inside the pattern that searches for it, so a
 * scan including tests reports itself as the violation.
 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (/\.test\.tsx?$/.test(entry.name)) return [];
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function ratio(theme: ThemeName, foregroundToken: string, surfaceToken: string): number {
  return effectiveContrast(
    parseColor(themes[theme][foregroundToken]),
    parseColor(themes[theme][surfaceToken]),
  );
}

/**
 * The dot field is itself translucent, so its effective colour depends on
 * what it sits over. This flattens one dot onto the page before anything is
 * measured against it — the same reasoning as compositing `text-muted`, one
 * layer further out.
 */
function dotOverPage(theme: ThemeName): Rgba {
  return composite(parseColor(themes[theme]["--color-dot"]), parseColor(themes[theme]["--color-page-bg"]));
}

/** Reports the measured value in the failure message, not just "expected true". */
function expectAA(theme: ThemeName, foreground: string, surface: string) {
  const measured = ratio(theme, foreground, surface);
  expect(
    measured,
    `${theme}: ${foreground} on ${surface} measured ${measured.toFixed(2)}:1, needs ${AA_BODY}:1`,
  ).toBeGreaterThanOrEqual(AA_BODY);
}

describe("C-1 — primary text clears AA on every surface", () => {
  for (const theme of THEME_NAMES) {
    for (const surface of SURFACE_TOKENS) {
      it(`${theme}: --color-text on ${surface}`, () => {
        expectAA(theme, "--color-text", surface);
      });
    }
  }
});

describe("C-2 — secondary text clears AA on every surface", () => {
  // The one that fails today. `--color-text-muted` is an rgba value, so it
  // must be composited onto the surface before measurement — measuring it as
  // an independent colour is what hid this.
  for (const theme of THEME_NAMES) {
    for (const surface of SURFACE_TOKENS) {
      it(`${theme}: --color-text-muted on ${surface}`, () => {
        expectAA(theme, "--color-text-muted", surface);
      });
    }
  }
});

describe("C-4 — violet clears AA as text", () => {
  // Includes card-bg because the research page renders its "Read abstract"
  // link in violet on exactly that surface.
  for (const theme of THEME_NAMES) {
    for (const surface of SURFACE_TOKENS) {
      it(`${theme}: --color-violet on ${surface}`, () => {
        expectAA(theme, "--color-violet", surface);
      });
    }
  }
});

describe("C-5 — violet-deep is never used as text", () => {
  it("measures below AA as text, which is why the restriction exists", () => {
    // Pins the reason rather than the rule. As text on the dark theme's inset
    // surface it lands near 3:1 — the restriction to hover and pressed fills
    // is not stylistic.
    const measured = ratio("dark", "--color-violet-deep", "--color-panel-inset-bg");
    expect(measured).toBeLessThan(AA_BODY);
  });

  it("does not appear as a text colour anywhere in src/", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(process.cwd(), "src"))) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          // `hover:text-violet-deep` and friends are the sanctioned use: the
          // restriction is on resting text, not on every appearance.
          if (/(?<![\w:-])text-violet-deep\b/.test(line)) {
            offenders.push(`${file.replace(process.cwd() + "/", "")}:${index + 1}`);
          }
        });
    }

    expect(offenders, `violet-deep used as resting text in:\n${offenders.join("\n")}`).toEqual([]);
  });
});

describe("C-3 — text clears AA against a dot (the field's worst case)", () => {
  // A glyph stroke can land squarely on a dot. The honest floor is that pixel,
  // not the average over the field.
  for (const theme of THEME_NAMES) {
    it(`${theme}: --color-text on a dot over the page`, () => {
      const surface = dotOverPage(theme);
      const measured = effectiveContrast(parseColor(themes[theme]["--color-text"]), surface);
      expect(
        measured,
        `${theme}: text on a dot measured ${measured.toFixed(2)}:1, needs ${AA_BODY}:1`,
      ).toBeGreaterThanOrEqual(AA_BODY);
    });

    it(`${theme}: --color-text-muted on a dot over the page`, () => {
      const surface = dotOverPage(theme);
      const measured = effectiveContrast(parseColor(themes[theme]["--color-text-muted"]), surface);
      expect(
        measured,
        `${theme}: muted text on a dot measured ${measured.toFixed(2)}:1, needs ${AA_BODY}:1`,
      ).toBeGreaterThanOrEqual(AA_BODY);
    });
  }
});

describe("C-6 — the dot tone derives from text, never from violet", () => {
  // The One Thread Rule as an assertion: a violet dot field would spend the
  // one colour the design system rations on decoration. Checked as exact RGB
  // equality — the dot is defined as text at low alpha, so its channels must
  // match text's exactly, alpha aside.
  for (const theme of THEME_NAMES) {
    it(`${theme}: --color-dot's RGB matches --color-text's RGB`, () => {
      const dot = parseColor(themes[theme]["--color-dot"]);
      const text = parseColor(themes[theme]["--color-text"]);
      expect({ r: dot.r, g: dot.g, b: dot.b }).toEqual({ r: text.r, g: text.g, b: text.b });
    });

    it(`${theme}: --color-dot is translucent, not opaque`, () => {
      // Guards against the token silently losing its alpha channel, which
      // would turn the "low opacity" half of the requirement into a solid
      // text-coloured tile.
      const dot = parseColor(themes[theme]["--color-dot"]);
      expect(dot.a).toBeGreaterThan(0);
      expect(dot.a).toBeLessThan(0.2);
    });
  }
});

describe("the dark theme needs no correction", () => {
  it("already clears AA for secondary text on every surface", () => {
    for (const surface of SURFACE_TOKENS) {
      expect(ratio("dark", "--color-text-muted", surface)).toBeGreaterThanOrEqual(AA_BODY);
    }
  });
});

describe("sanity — the measurements are not accidentally trivial", () => {
  it("distinguishes the two themes", () => {
    expect(ratio("dark", "--color-text", "--color-page-bg")).not.toBeCloseTo(
      ratio("light", "--color-text", "--color-page-bg"),
      3,
    );
  });

  it("produces ratios inside the possible range", () => {
    for (const theme of THEME_NAMES) {
      for (const surface of SURFACE_TOKENS) {
        const measured = ratio(theme, "--color-text", surface);
        expect(measured).toBeGreaterThan(1);
        expect(measured).toBeLessThanOrEqual(21);
      }
    }
  });

  it("agrees with a hand-checked reference pair", () => {
    // The dark theme's violet on its page background, computed independently
    // and recorded in DESIGN.md as 5.99:1.
    const measured = contrastRatio(parseColor("#a970ff"), parseColor("#0e0b14"));
    expect(measured).toBeCloseTo(5.99, 1);
  });
});
