import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  localizedPath,
  stripLocale,
  swapLocale,
} from "./routes";

describe("SUPPORTED_LOCALES", () => {
  it("declares exactly the two locales this feature supports, English first as the default", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "es"]);
    expect(DEFAULT_LOCALE).toBe("en");
  });
});

describe("isSupportedLocale", () => {
  it("accepts every supported code", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(isSupportedLocale(locale)).toBe(true);
    }
  });

  it("rejects an unsupported language", () => {
    expect(isSupportedLocale("fr")).toBe(false);
  });

  it("rejects the empty string", () => {
    expect(isSupportedLocale("")).toBe(false);
  });

  it("is case-sensitive, so a variant spelling never becomes a second address for one page", () => {
    expect(isSupportedLocale("EN")).toBe(false);
  });
});

describe("localizedPath", () => {
  it("prefixes a nested path with the locale", () => {
    expect(localizedPath("/tool/chunks", "es")).toBe("/es/tool/chunks");
  });

  it("maps the root to a bare locale, with no trailing slash", () => {
    // "/en/" would be a second address for the same page.
    expect(localizedPath("/", "en")).toBe("/en");
  });

  it("is pure: the same inputs give the same output", () => {
    expect(localizedPath("/docs", "en")).toBe(localizedPath("/docs", "en"));
  });
});

describe("swapLocale", () => {
  it("replaces the locale segment and preserves the rest of the path exactly", () => {
    expect(swapLocale("/es/tool/confusable", "en")).toBe("/en/tool/confusable");
  });

  it("preserves a query string and a fragment", () => {
    expect(swapLocale("/es/tool/chunks?strategy=paragraphs#results", "en")).toBe(
      "/en/tool/chunks?strategy=paragraphs#results",
    );
  });

  it("prefixes rather than replaces when the path carries no locale, so a stray address heals", () => {
    expect(swapLocale("/tool/chunks", "es")).toBe("/es/tool/chunks");
  });

  it("swaps a bare locale without leaving a trailing slash", () => {
    expect(swapLocale("/es", "en")).toBe("/en");
  });
});

describe("stripLocale", () => {
  it("splits a localised path into its locale and the remainder", () => {
    expect(stripLocale("/es/tool/chunks")).toEqual({ locale: "es", path: "/tool/chunks" });
  });

  it("reports an unlocalised path honestly rather than defaulting it", () => {
    // Defaulting here would hide the very case FR-057 has to handle.
    expect(stripLocale("/tool/chunks")).toEqual({ locale: null, path: "/tool/chunks" });
  });

  it("treats a bare locale as the root", () => {
    expect(stripLocale("/es")).toEqual({ locale: "es", path: "/" });
  });

  it("does not guess when the first segment merely looks like a locale", () => {
    // Guessing would produce the half-translated page FR-058 forbids.
    expect(stripLocale("/fr/tool")).toEqual({ locale: null, path: "/fr/tool" });
  });
});

describe("round trip", () => {
  it("swapping a localised path equals localising the original directly", () => {
    const path = "/tool/queries";
    expect(swapLocale(localizedPath(path, "en"), "es")).toBe(localizedPath(path, "es"));
  });
});
