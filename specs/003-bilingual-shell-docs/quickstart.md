# Quickstart: Validating the Bilingual Shell and Documentation

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Types and ordering rules live in [data-model.md](./data-model.md) and [contracts/](./contracts/).
This file is the run guide.

## Prerequisites

- `pnpm install` has been run, Node 20+
- First run downloads roughly 23 MB of model weights and caches them in the browser

## Domain tests first

The locale path functions are pure and testable without a browser, a worker, or the model. They
must be written and observed failing before implementation exists (Principle II).

```bash
pnpm test:domain          # locale path functions plus every v1/v2 domain test
pnpm test                 # full unit suite, including catalogue parity
```

**Expected**: all green, including the v1 chunking and ranking tests. A regression there means the
session refactor reached into domain code, which it must not.

## Static checks

```bash
pnpm typecheck            # also enforces documentation section parity
pnpm lint
```

Documentation parity is a compile-time property, not a test — a section missing from one locale
fails `typecheck` (research.md Finding 3). If `typecheck` passes and a section is absent, the
section-id union was widened without the content being written.

## Manual validation

```bash
pnpm dev
```

### Story 1 — the interface is bilingual and honest about what it analyses

1. Open the English address of chunk inspection. **Expect** every visible string in English.
2. Paste a document of a few thousand characters and wait for the model to finish loading.
3. Switch the interface to Spanish. **Expect** the equivalent Spanish page, **the pasted document
   still present**, and no repeated model load — watch the network panel and the loading indicator
   (FR-055, FR-056). This is the requirement research.md Finding 1 was written to make possible;
   if the document is gone, the session refactor is incomplete.
4. Run an analysis, then switch language again. **Expect** the completed analysis to survive.
5. On both locales, look for the English-only notice. **Expect** it legible without hovering,
   expanding, or opening anything, in the language being read (FR-061, FR-062).
6. Paste a Spanish document while reading the Spanish interface. **Expect** the interface to say,
   in Spanish, that these scores are not trustworthy — this is the case the notice exists for.
7. Request an unsupported language, for example `/fr/tool/chunks`. **Expect** no half-translated
   or empty page (FR-058).
8. Request the site root with no language, and an address bookmarked from v2 such as
   `/tool/chunks`. **Expect** both to resolve to a valid localised page (FR-057).

### Story 2 — the documentation teaches the tool

1. Open the documentation in English. **Expect** the primer, one section per tool, the
   troubleshooting path, and the concepts section.
2. Read the primer cold. **Expect** to be able to say what RAG is and why chunk boundaries decide
   whether a passage is found, without prior knowledge (FR-065).
3. Read any tool section. **Expect** what it measures, how to read its output, and a worked example
   carrying specific values (FR-066).
4. Follow the troubleshooting path start to finish. **Expect** an ordered sequence of checks, each
   naming the tool that answers it, with no step requiring outside knowledge (FR-067, SC-024).
5. Read the concepts section. **Expect** to be able to explain why a chunk past the token ceiling
   contributes nothing from its tail (FR-068).
6. Switch to Spanish. **Expect** the same sections in the same order (FR-069, SC-025).

### Story 3 — navigation and provenance

1. From any page, open the tools menu. **Expect** all four tools, each navigating to that tool in
   the language currently being read (FR-070).
2. Operate the menu by keyboard alone. **Expect** it to open, move, and select without a pointer.
3. **Expect** the navigation to also offer the documentation, the language switch, the theme
   control, and the primary call to action (FR-071).
4. Reach the footer. **Expect** the statement that everything runs in the visitor's browser and no
   document leaves the device (FR-072), the model and stack named with licences, and the repository
   linked (FR-073).
5. **Expect** the footer not to repeat the tool navigation (FR-074).

### Cross-cutting

- Toggle the theme in both locales; both remain legible.
- Confirm no request carries document or query text, in either locale — the existing network test
  covers this, but the locale segment is new surface.

## End-to-end suite

```bash
pnpm test:e2e
```

Real model, real browser. Every path in the suite comes from the locale helper rather than a
literal, so a future locale change touches one file (contracts/localization.md).

## Owed before this is done

All three are settled.

1. ~~The RAG primer must be checked against current sources~~ — checked while writing it (T053).
   Two figures came from that search rather than from memory and changed what the primer says:
   chunking moves recall by around 9% on the same corpus, more than swapping the embedding model;
   and the 256-token ceiling is low even against older models, which typically stop at 512.
2. ~~Confirm the real worker survives a locale switch~~ — confirmed against the running
   application, not the probe: the pasted document survived and model requests stayed at 15 across
   the switch rather than growing.
3. ~~Read both languages against each other~~ — done. Structural parity is exact (same block kinds
   in the same order, same example-row, step and list counts, matching callout tones), and every
   numeric claim appears in both with locale-appropriate formatting. Meaning was reviewed by
   reading; that part has no automated substitute and never will.
