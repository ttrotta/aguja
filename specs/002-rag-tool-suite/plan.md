# Implementation Plan: RAG Tool Suite

**Branch**: `002-rag-tool-suite` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-rag-tool-suite/spec.md`

## Summary

Turn `/tool` from one screen into four addressable tools sharing a single pasted document, a
single loaded model, and a cache of chunk embeddings for the lifetime of a session. Two of the
tools already exist and move as they are; two are new analyses computed from embeddings the
current model already produces.

The approach is a route group with a layout that owns session state, plus two new framework-free
domain modules. Nothing about the inference path changes: same model, same worker, same
determinism guarantees. Phase 0 measurement changed one of the two new tools before any code was
written — see [research.md](./research.md) and [D-011](../../docs/decisions.md).

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 (App Router)

**Primary Dependencies**: `@huggingface/transformers` 4.2 (already present, no new dependency),
Tailwind CSS 4

**Storage**: None. Session state is in-memory and dies with the page (FR-033, D-005).

**Testing**: Vitest for domain logic (`pnpm test:domain`), Playwright for end-to-end
(`pnpm test:e2e`)

**Target Platform**: Desktop browsers. Mobile is explicitly not a target (PRODUCT.md).

**Project Type**: Web application, single Next.js project

**Performance Goals**: Tool switch under 1 s with no model download (SC-011); five-phrasing
sensitivity analysis under 5 s once embeddings are cached (SC-013); confusable-chunks analysis at
the cap without blocking the interface (SC-014)

**Constraints**: All inference in-browser, no API key, no server (Principle V); no persistence
across reloads; identical inputs must produce identical output (FR-052)

**Scale/Scope**: 4 tools, 2 new domain modules, 1 shared session layer. Documents up to 50,000
characters, up to roughly 2,500 chunks at the smallest useful chunk sizes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against constitution 1.1.0.

| Principle | Status | Evidence |
|---|---|---|
| I. Specification-Driven Change | **PASS** | spec.md written and reviewed before this plan. Phase 0 measurement contradicted the spec; work stopped and the spec was amended (FR-043…FR-051, User Story 3) with the reasoning recorded in D-011 before planning resumed — which is the procedure this principle prescribes. |
| II. Test-First | **PASS** | Both new analyses are pure functions over plain arrays, so tests come first and assert exact values. Ranking ties and pair ordering are specified in FR-053, satisfying the requirement that tie behaviour be covered explicitly. |
| III. Framework-Free Domain | **PASS** | New logic lives in `sensitivity/domain/` and `confusability/domain/`, taking plain numbers and strings. Embeddings arrive as `Float32Array` from an outer layer, exactly as `retrieval/domain` already receives them. |
| IV. Screaming Architecture | **PASS** | New folders are named for the problem (`sensitivity`, `confusability`), not for a technical role. No `utils`, `services`, or `helpers` is introduced. |
| V. Local-Only Inference | **PASS** | No new model, no network call, no API key. Both analyses are arithmetic over embeddings the existing worker already produces. D-010 makes the exclusion of generative and second-model tools explicit, and this feature stays inside it. |

**Technology Constraints**: no stack substitution. `@huggingface/transformers` is already a
dependency; nothing is added.

**Scope**: every item is inside the "Added in v2" list of constitution 1.1.0. Comparing more than
two strategies at once stays out, and the sidebar must not become a workaround for it (FR-034).

**Gate result: PASS.** No violations, so Complexity Tracking is not needed.

### Post-design re-check

Re-evaluated after the Phase 1 artifacts below. Still **PASS**. The design adds one shared session
holder and two domain modules; it introduces no interface-per-boundary, no mapper layer, and no
dependency-injection container, all of which Principle III forbids without an amendment. The
embedding cache lives in the application layer, not the domain, so domain functions stay pure.

## Project Structure

### Documentation (this feature)

```text
specs/002-rag-tool-suite/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — threshold and cost measurements
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output — domain function contracts
│   ├── sensitivity.md
│   └── confusability.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx                      # landing (unchanged)
│   ├── _components/                  # landing + chrome (unchanged except Navbar)
│   └── tool/
│       ├── layout.tsx                # NEW — sidebar + ToolSessionProvider
│       ├── page.tsx                  # CHANGED — redirect to ./chunks
│       ├── _components/
│       │   ├── ToolSidebar.tsx       # NEW
│       │   └── ToolSession.tsx       # NEW — context: document, embedder, embedding cache
│       ├── chunks/page.tsx           # MOVED from tool/page.tsx, compare mode removed
│       ├── compare/page.tsx          # NEW route, existing compare behaviour
│       ├── queries/page.tsx          # NEW — Query Sensitivity
│       └── confusable/page.tsx       # NEW — Confusable Chunks
└── features/
    ├── chunking/                     # unchanged
    ├── comparison/                   # unchanged
    ├── documents/                    # unchanged
    ├── retrieval/                    # unchanged
    ├── sharing/                      # unchanged
    ├── sensitivity/                  # NEW
    │   ├── domain/
    │   │   ├── rank-profile.ts       # rank across phrasings, spread, ordering
    │   │   └── rank-profile.test.ts
    │   └── ui/
    │       ├── PhrasingInput.tsx
    │       └── SensitivityResults.tsx
    └── confusability/                # NEW
        ├── domain/
        │   ├── lexical-overlap.ts    # deterministic shared-wording measure
        │   ├── lexical-overlap.test.ts
        │   ├── confusable-pairs.ts   # pair selection + ordering
        │   └── confusable-pairs.test.ts
        └── ui/
            ├── ThresholdControl.tsx
            └── ConfusablePairs.tsx
```

**Structure Decision**: The existing single-project layout is kept. Tools become sibling routes
under `src/app/tool/`, because a layout in the App Router persists across navigation between its
children — which is what lets one embedder worker and one pasted document survive a tool switch
(FR-030, FR-031) without persisting anything to disk (FR-033). Two new feature folders are added
under `src/features/`, named for the problem they solve per Principle IV. The `retrieval` feature
is left untouched: the new analyses consume its embeddings rather than extending it, so v1's
ranking behaviour cannot regress.

## Phase 1 design notes

The detailed artifacts are in [data-model.md](./data-model.md),
[contracts/](./contracts/), and [quickstart.md](./quickstart.md). Three decisions worth stating
here because they shape the task list:

1. **The embedding cache is keyed by chunk text, not by chunk index.** Two strategies that produce
   the same text for different indices share the cached vector, and a strategy change that
   reproduces some chunks unchanged pays nothing to re-embed them (FR-032).

2. **Both new analyses take embeddings as input and never request them.** Fetching is the
   application layer's job, so the domain stays framework-free and its tests need no worker
   (Principle III). This is the same shape `rankChunks` already has.

3. **Order is part of the contract, not a rendering detail.** Both modules return fully ordered
   output with ties broken as FR-053 specifies, so the UI never sorts and determinism is testable
   without a browser.

## Complexity Tracking

Not applicable. The Constitution Check passed with no violations, before and after design.
