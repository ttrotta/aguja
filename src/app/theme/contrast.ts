/**
 * WCAG 2.1 contrast arithmetic.
 *
 * Plain data in, plain numbers out — no DOM, no framework, no colour library.
 * Kept deliberately small so the tests that calibrate it can cover all of it.
 */

export type Rgba = {
  r: number;
  g: number;
  b: number;
  /** 0–1. A colour with no alpha of its own parses as 1. */
  a: number;
};

const HEX = /^#([0-9a-f]{6})$/i;
const RGB_FUNC = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

/**
 * Reads the two colour notations this project's stylesheet actually uses:
 * six-digit hex and `rgb()`/`rgba()`.
 *
 * Anything else throws rather than falling back to a default. A silently
 * mis-parsed colour would make every ratio built on it wrong while the suite
 * stayed green, which is the one failure mode this whole module exists to
 * prevent.
 */
export function parseColor(input: string): Rgba {
  const value = input.trim();

  const hex = HEX.exec(value);
  if (hex) {
    const digits = hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: 1,
    };
  }

  const func = RGB_FUNC.exec(value);
  if (func) {
    return {
      r: Number(func[1]),
      g: Number(func[2]),
      b: Number(func[3]),
      a: func[4] === undefined ? 1 : Number(func[4]),
    };
  }

  throw new Error(`Unrecognised colour: ${JSON.stringify(input)}`);
}

/** sRGB channel (0–255) to its linear-light value. */
function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * WCAG relative luminance: 0 for black, 1 for white.
 *
 * The linearisation step is not optional. Averaging raw channels instead
 * overstates the lightness of mid tones badly enough to turn a failing pair
 * into a passing one.
 */
export function relativeLuminance({ r, g, b }: Rgba): number {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * Flattens a translucent foreground onto an opaque background.
 *
 * Required before measuring any `rgba` colour. A translucent text colour and
 * the surface behind it are not two independent colours, and treating them as
 * such is how this project's light theme shipped below AA against all four of
 * its surfaces.
 */
export function composite(foreground: Rgba, background: Rgba): Rgba {
  const blend = (f: number, b: number) => Math.round(foreground.a * f + (1 - foreground.a) * b);
  return {
    r: blend(foreground.r, background.r),
    g: blend(foreground.g, background.g),
    b: blend(foreground.b, background.b),
    a: 1,
  };
}

/** Contrast ratio between two colours, 1:1 to 21:1. Symmetric by construction. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The ratio a reader actually experiences: the foreground flattened onto the
 * surface, measured against that same surface.
 *
 * This is the function the invariants use. `contrastRatio` is exported for
 * calibration against published reference values, where both colours are
 * already opaque.
 */
export function effectiveContrast(foreground: Rgba, surface: Rgba): number {
  return contrastRatio(composite(foreground, surface), surface);
}

/** WCAG AA thresholds. */
export const AA_BODY = 4.5;
export const AA_LARGE = 3;
