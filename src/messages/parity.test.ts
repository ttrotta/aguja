import { describe, expect, it } from "vitest";
import en from "./en.json";
import es from "./es.json";

/**
 * The only thing enforcing FR-059.
 *
 * next-intl's typed keys catch a reference to a key that exists in no
 * catalogue. They do not catch a key present in English and missing in
 * Spanish, because the types are generated from one catalogue treated as the
 * source — so that case type-checks, falls back at runtime, and ships a page
 * that is mostly Spanish with stray English (research.md Finding 2).
 */

type Nested = { [key: string]: string | Nested };

function flatten(value: Nested, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === "string" ? [path] : flatten(entry, path);
  });
}

const enKeys = flatten(en as Nested).sort();
const esKeys = flatten(es as Nested).sort();

describe("message catalogue parity", () => {
  it("has no key in English that is missing from Spanish", () => {
    const missing = enKeys.filter((key) => !esKeys.includes(key));
    expect(missing).toEqual([]);
  });

  it("has no key in Spanish that is missing from English", () => {
    const missing = esKeys.filter((key) => !enKeys.includes(key));
    expect(missing).toEqual([]);
  });

  it("has identical key sets, so neither locale can silently fall back", () => {
    expect(esKeys).toEqual(enKeys);
  });

  it("has no empty message in either catalogue", () => {
    // A key present but blank passes the parity checks above while still
    // rendering nothing, which reads as a missing translation to the user.
    const blanks = [
      ...flattenEntries(en as Nested).filter(([, v]) => v.trim() === ""),
      ...flattenEntries(es as Nested).filter(([, v]) => v.trim() === ""),
    ].map(([k]) => k);
    expect(blanks).toEqual([]);
  });
});

function flattenEntries(value: Nested, prefix = ""): Array<[string, string]> {
  return Object.entries(value).flatMap(([key, entry]): Array<[string, string]> => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === "string" ? [[path, entry]] : flattenEntries(entry, path);
  });
}
