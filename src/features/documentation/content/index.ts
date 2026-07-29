import type { Locale } from "@/features/localization/domain";
import type { DocContent } from "./types";
import { en } from "./en";
import { es } from "./es";

// Keyed by Locale, so adding a locale is a compile error here until its
// documentation exists — the same guarantee the section record gives within
// one language, one level up.
const CONTENT: Record<Locale, DocContent> = { en, es };

export function docContentFor(locale: Locale): DocContent {
  return CONTENT[locale];
}

export { DOC_SECTION_ORDER } from "./types";
export type { DocContent, DocSectionId } from "./types";
