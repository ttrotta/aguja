/**
 * The shape of the documentation, shared by both locales.
 *
 * Parity is a compile-time property here, not a test: each locale exports a
 * `Record<DocSectionId, DocSection>`, so omitting a section fails `typecheck`
 * rather than surviving review (FR-069, SC-025). Order is exported once, below,
 * and both locales render from it — two files cannot disagree about sequence
 * because neither file expresses it.
 */

export type DocSectionId =
  | "rag-primer"
  | "tool-chunks"
  | "tool-compare"
  | "tool-queries"
  | "tool-confusable"
  | "troubleshooting"
  | "concepts";

/** The reading order, for both locales. */
export const DOC_SECTION_ORDER: readonly DocSectionId[] = [
  "rag-primer",
  "tool-chunks",
  "tool-compare",
  "tool-queries",
  "tool-confusable",
  "troubleshooting",
  "concepts",
];

export type DocBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  /** A worked example: specific values, not prose about values (FR-066). */
  | { kind: "example"; caption: string; rows: Array<{ label: string; value: string }> }
  /** An ordered diagnostic step, each naming the tool that answers it (FR-067). */
  | { kind: "steps"; items: Array<{ tool: string; check: string }> }
  /**
   * `warning` is reserved for the invisible failures this tool exists to
   * expose. A neutral aside rendered in warning colours would spend that
   * signal on information that carries no risk.
   */
  | { kind: "callout"; tone: "warning" | "note"; text: string };

export type DocSection = {
  title: string;
  blocks: DocBlock[];
};

export type DocContent = Record<DocSectionId, DocSection>;
