import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Reads the theme colour tokens out of the stylesheet that actually ships.
 *
 * The stylesheet stays the single source of truth on purpose. Copying the
 * values into TypeScript would let the two drift, and the copy is what the
 * tests would then be measuring — green while the real page fails.
 */

export type ThemeName = "dark" | "light";
export type TokenMap = Record<string, string>;

const STYLESHEET = join(process.cwd(), "src/app/globals.css");

/**
 * The tokens every theme must declare. Listed explicitly so that a token
 * silently disappearing from one theme is a failure rather than an absence
 * nobody notices.
 */
export const REQUIRED_TOKENS = [
  "--color-page-bg",
  "--color-panel-bg",
  "--color-panel-inset-bg",
  "--color-card-bg",
  "--color-text",
  "--color-text-muted",
  "--color-violet",
  "--color-violet-deep",
  "--color-warning",
  "--color-dot",
] as const;

/**
 * Matches one rule block by its exact selector.
 *
 * `:root` and `:root.light` are anchored with `\s*\{` immediately after the
 * selector, which is what stops `:root` from also matching `:root.light` and
 * `:root.light` from matching `:root.light .theme-logo-dark`. Reading the
 * wrong block is the failure this pattern is shaped to avoid.
 */
function blockFor(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, "m").exec(css);
  if (!match) throw new Error(`No rule block found for selector "${selector}"`);
  return match[1];
}

function declarationsIn(block: string): TokenMap {
  const tokens: TokenMap = {};
  for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

export function readThemeTokens(
  options: { requiredTokens?: readonly string[] } = {},
): Record<ThemeName, TokenMap> {
  const required = options.requiredTokens ?? REQUIRED_TOKENS;
  const css = readFileSync(STYLESHEET, "utf8");

  const themes: Record<ThemeName, TokenMap> = {
    dark: declarationsIn(blockFor(css, ":root")),
    light: declarationsIn(blockFor(css, ":root.light")),
  };

  for (const theme of ["dark", "light"] as const) {
    for (const token of required) {
      const value = themes[theme][token];
      if (!value) {
        throw new Error(`Token ${token} is not declared for the ${theme} theme in ${STYLESHEET}`);
      }
      if (value.includes("var(")) {
        throw new Error(
          `Token ${token} in the ${theme} theme resolves to ${value}, not a literal colour. ` +
            `The reader has picked up an indirection block instead of the declaration.`,
        );
      }
    }
  }

  return themes;
}

/** The surfaces any text colour has to be legible against. */
export const SURFACE_TOKENS = [
  "--color-page-bg",
  "--color-panel-bg",
  "--color-panel-inset-bg",
  "--color-card-bg",
] as const;
