/**
 * Locale-aware path arithmetic, as plain string functions.
 *
 * These are the single source of truth for which locales exist and for how an
 * address is built, swapped, or read. The router, the switcher, the middleware,
 * and the end-to-end suite all go through here rather than assembling paths
 * themselves — otherwise a third locale would mean finding every literal.
 *
 * Framework-free on purpose (Principle III): no next-intl, no router, no
 * `window`. That is what lets these be tested with plain assertions.
 */

export type Locale = "en" | "es";

export const SUPPORTED_LOCALES = ["en", "es"] as const satisfies readonly Locale[];

/** Served when a request names no locale, or one that does not exist. */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Case-sensitive by design. Accepting "EN" would give one page two addresses,
 * and the pair would drift the moment anything links to only one of them.
 */
export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Splits an address into its locale and the rest. An unlocalised path reports
 * `null` rather than defaulting, because the caller — routing, a redirect, a
 * switcher — needs to know the difference to act correctly.
 */
export function stripLocale(path: string): { locale: Locale | null; path: string } {
  const [, first = "", ...rest] = path.split("/");
  if (!isSupportedLocale(first)) return { locale: null, path };

  const remainder = rest.join("/");
  return { locale: first, path: remainder === "" ? "/" : `/${remainder}` };
}

/** Builds the address of an unlocalised application path in a given locale. */
export function localizedPath(path: string, locale: Locale): string {
  // "/" would otherwise produce "/en/", a second address for one page.
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * The same page in another language. Anything after the pathname — a query
 * string, a fragment — is carried across untouched, so switching language does
 * not silently drop the state the address was carrying.
 *
 * A path with no recognised locale is prefixed rather than having its first
 * segment replaced, so a stray unlocalised address heals instead of losing a
 * segment.
 */
export function swapLocale(path: string, target: Locale): string {
  const boundary = path.search(/[?#]/);
  const pathname = boundary === -1 ? path : path.slice(0, boundary);
  const suffix = boundary === -1 ? "" : path.slice(boundary);

  const { path: withoutLocale } = stripLocale(pathname);
  return localizedPath(withoutLocale, target) + suffix;
}
