# Implementation Plan: Bilingual Shell and Documentation

**Branch**: `003-bilingual-shell-docs` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-bilingual-shell-docs/spec.md`

## Summary

Serve the interface in Spanish and English at separate addresses, over an analysis that stays
English-only, and say so visibly rather than in a tooltip. Add a documentation page covering RAG,
each tool, a troubleshooting path, and the concepts underneath, in both languages. Restructure the
navbar around a grouped tools menu and add a footer carrying the privacy guarantee and provenance.

The approach is shaped by one measured finding: putting a locale segment above the tool session
remounts it, destroying the pasted document and tearing down the embedder worker
([research.md](./research.md) Finding 1). Session state therefore moves out of the React tree into
module scope, which the same experiment confirms survives. Everything else follows from that.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 (App Router), React 19

**Primary Dependencies**: next-intl (interface copy only, D-014); Transformers.js with
`Xenova/all-MiniLM-L6-v2` quantized, unchanged

**Storage**: None. Module-scope, page-lifetime only — no persistence across reloads (D-005)

**Testing**: Vitest (`domain` project in Node, `component` project in jsdom), Playwright for e2e

**Target Platform**: Desktop browsers with WASM

**Project Type**: Single Next.js application

**Performance Goals**: No repeated model load on a language switch; no model download for visitors
who only see the landing page

**Constraints**: No server-side inference, no API key, no document text leaving the device;
framework-free domain; locale awareness must not reach `domain/`

**Scale/Scope**: Two locales, four tools, one documentation page, ~10 components carrying copy

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Constitution 1.2.0, amended for this feature before planning began.

| Principle | Status | Notes |
|---|---|---|
| I. Specification-Driven Change | **Pass** | FR-035 conflict resolved by D-013 before any code. Constitution amended 1.1.0 → 1.2.0. D-013 and D-014 recorded, as Technology Constraints was touched. |
| II. Test-First | **Pass** | Locale path functions are pure; tests written and observed failing first. Catalogue parity is a test. Documentation parity is a compile-time type check. |
| III. Framework-Free Domain | **Pass** | `localization/domain` holds string functions only — no next-intl import, no router, no `window`. The library is confined to `ui/` and the app shell. |
| IV. Screaming Architecture | **Pass** | New feature folders named for problems: `localization`, `documentation`. No `lib/`, `utils/`, or `helpers/` introduced. |
| V. Local-Only Inference | **Pass** | Untouched. The worker's lifetime changes; what it does and where it runs does not. No text leaves the device in either locale. |

**Technology Constraints**: next-intl is now listed in the fixed stack for interface copy only. The
analysis stays on the same model — this feature translates the interface and nothing else.

**Post-design re-check**: still passing. The session refactor moves state out of React but not out
of the browser, and touches no `domain/` file. The one design decision that could have violated
Principle III — putting locale into the session or into chunking — was avoided by keeping locale in
its own feature and out of every existing type ([data-model.md](./data-model.md), final section).

## Project Structure

### Documentation (this feature)

```text
specs/003-bilingual-shell-docs/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — five findings, one measured
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── localization.md  # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── [locale]/                      # every route moves under this segment
│   │   ├── layout.tsx                 # locale provider + navbar + footer
│   │   ├── page.tsx                   # landing
│   │   ├── docs/
│   │   │   └── page.tsx               # documentation
│   │   └── tool/
│   │       ├── layout.tsx             # tool shell + English-only notice
│   │       ├── page.tsx               # redirect to chunk inspection
│   │       ├── chunks/page.tsx
│   │       ├── compare/page.tsx
│   │       ├── queries/page.tsx
│   │       └── confusable/page.tsx
│   ├── _components/                   # Navbar, Footer, ToolDial, ThemeToggle
│   └── layout.tsx                     # root: html/body only
├── features/
│   ├── localization/
│   │   ├── domain/                    # framework-free: locales, path functions
│   │   └── ui/                        # LocaleSwitcher
│   ├── documentation/
│   │   ├── content/                   # en.ts, es.ts — typed section records
│   │   └── ui/                        # section rendering
│   ├── retrieval/embedding/           # useEmbedder — worker becomes a singleton
│   └── …                              # chunking, comparison, sensitivity,
│                                      # confusability, documents, sharing — unchanged
├── messages/
│   ├── en.json
│   └── es.json
└── e2e/                               # paths come from the locale helper
```

**Structure Decision**: Single Next.js application, unchanged in kind. Two feature folders are
added — `localization` and `documentation` — both named for their problem rather than their
mechanism, per Principle IV. The locale segment is introduced at the top of `src/app/`, which is
what forces the session refactor below it.

## Phased Approach

Ordered by the specification's priorities, which were themselves ordered by dependency rather than
by the order the work was requested.

**Foundational** — the session refactor and the locale feature. Move `documentContent`, the
embedding cache, and the worker to module scope; build and test the locale path functions. Nothing
user-visible ships here, but P1 cannot work without it and the twelve `e2e` paths cannot be
rewritten without the helper.

**P1 — bilingual interface.** Route restructure, message catalogues, parity test, locale switcher,
and the English-only notice moved from tooltip to persistent copy in the tool shell.

**P2 — documentation.** Typed section records per locale, the page, and the content itself. The RAG
primer is written against current sources rather than from memory.

**P3 — navigation shell.** Grouped tools menu, documentation link, footer. Last because its
documentation link needs the documentation to exist.

## Complexity Tracking

No constitutional violations to justify.

One judgement call worth recording, since it adds work rather than avoiding it: FR-056 could have
been satisfied by the specification's own fallback — warn the visitor, then discard their document
on a language switch. The measured alternative costs a bounded refactor of two files and preserves
the session instead. Losing a pasted document because someone changed the interface language is a
bad trade in a tool whose premise is that you paste something and study it, and it would fire on an
action with no reason to be destructive. Reasoning and evidence in [research.md](./research.md)
Finding 1.
