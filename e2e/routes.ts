import { DEFAULT_LOCALE, localizedPath, type Locale } from "../src/features/localization/domain";

/**
 * Addresses for the end-to-end suite, built from the same path functions the
 * application uses. Twelve literal "/tool/chunks" strings used to live across
 * three spec files; a locale change now touches this file only
 * (contracts/localization.md).
 *
 * The host is not here — `playwright.config.ts` already sets `baseURL`. Only
 * the path prefix ever needed centralising.
 */
export const routes = {
  chunks: (locale: Locale = DEFAULT_LOCALE) => localizedPath("/tool/chunks", locale),
  compare: (locale: Locale = DEFAULT_LOCALE) => localizedPath("/tool/compare", locale),
  queries: (locale: Locale = DEFAULT_LOCALE) => localizedPath("/tool/queries", locale),
  confusable: (locale: Locale = DEFAULT_LOCALE) => localizedPath("/tool/confusable", locale),
  landing: (locale: Locale = DEFAULT_LOCALE) => localizedPath("/", locale),
};
