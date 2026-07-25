# Implementation Plan: RAG Chunking Debugger

**Branch**: `001-rag-chunking-debugger` | **Date**: 2026-07-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-rag-chunking-debugger/spec.md`

## Summary

Build a browser-only debugger that shows how a document is split into chunks under four
strategies, then ranks those chunks against a query so the user can see why a passage is or is not
retrieved.

The technical approach follows from two constraints that turn out to reinforce each other. All
inference runs in a Web Worker (Principle V, [R-002](./research.md)), which means chunks and
embeddings cross a thread boundary as plain serializable data — exactly the shape Principle III
already demands of domain inputs. The architecture therefore has one impure surface, the worker,
and everything worth testing sits outside it as pure functions over plain data.

Two findings from Phase 0 shape the build:

- **The tokenizer is a 0.7 MB download, separate from the 21.9 MB model** ([R-004](./research.md)).
  That dissolves the tension the spec flagged between FR-011 and FR-005: all four strategies are
  usable almost immediately, so P1 genuinely ships without the model.
- **Chunks are covering spans, not extracted text** ([R-005](./research.md)). Paragraph chunks
  carry their trailing separators, which is what makes FR-010's exact-reconstruction property true
  by construction rather than approximately true.

## Technical Context

**Language/Version**: TypeScript 5.x, targeting ES2022. Node 24 for tooling.

**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS 4,
`@huggingface/transformers` v4 ([R-001](./research.md)) running `Xenova/all-MiniLM-L6-v2`
quantized (21.9 MB, 384 dimensions, 256-token input limit).

**Storage**: None. Session-scoped React state only (D-005). Model assets cached by the browser's
Cache API, which Transformers.js manages ([R-008](./research.md)).

**Testing**: Vitest — two projects, domain tests in `environment: 'node'`, component tests in
jsdom ([R-007](./research.md)). Playwright for end-to-end, including the network-leak test that
enforces FR-013.

**Target Platform**: Desktop browsers with WASM and Web Worker support. Mobile layout is not a v1
goal.

**Project Type**: Single-page web application. No backend, no database, no auth.

**Performance Goals**: Boundary redraw under 100 ms at the 50,000-character cap (SC-002). Complete
ranking of a 100-chunk document within 15 s (SC-006). Model queryable within 30 s on 10 Mbps
(SC-004).

**Constraints**: No network request may carry document or query text (FR-013, SC-009). Scores must
be bit-identical across runs on a given browser (FR-016, SC-007), which is why the execution
backend is pinned rather than capability-detected ([R-003](./research.md)).

**Scale/Scope**: Documents up to 50,000 characters. Four chunking strategies, four prioritized user
stories, 26 functional requirements. Single user, no concurrency.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| **I. Specification-Driven Change** | Every element here traces to an FR/SC or a recorded decision | **PASS** — no capability appears in this plan that is absent from the spec |
| **II. Test-First** | Design permits tests written and failing before implementation | **PASS** — the domain is pure functions over plain data; no mocks, no DOM, no worker needed to test it |
| **II. Test-First** | Exact assertions, not tolerances | **PASS** — [R-003](./research.md) pins the backend and thread count, so scores are reproducible |
| **II. Test-First** | Tie behavior specified | **PASS** — [contract §3](./contracts/domain-api.md) makes ascending `chunkIndex` part of the contract |
| **III. Framework-Free Domain** | No `domain/` file imports a framework | **PASS** — enforced twice over by ESLint and a DOM-less test environment ([R-007](./research.md)) |
| **III. Framework-Free Domain** | No layer ceremony added | **PASS** — no interfaces at boundaries, no mappers, no DI container |
| **IV. Screaming Architecture** | Features named for the problem | **PASS** — `documents`, `chunking`, `retrieval`, `comparison`, `sharing` |
| **IV. Screaming Architecture** | No role-named folders inside a feature | **PASS** — see the structure note below on `embedding/` |
| **V. Local-Only Inference** | Inference in-browser, no API key | **PASS** — worker-hosted Transformers.js, no server route in the tree |
| **V. Local-Only Inference** | Download progress surfaced | **PASS** — `progress` messages for both tokenizer and model ([contract §4](./contracts/domain-api.md)) |
| **Tech Constraints** | Stack matches the constitution | **PASS** — one addition recorded as D-007 |
| **Priority** | P1 independently shippable | **PASS** — [R-004](./research.md) removes P1's dependency on the model |

**One point worth defending.** `retrieval/embedding/` is a folder inside a feature whose name is
not a problem-domain noun, which brushes against Principle IV. It is kept because it names *what
is impure* — the quarantine boundary for Transformers.js — and collapsing it into `retrieval/`
would scatter the one place a reader must look to verify Principle V. This is a naming choice in
service of a stronger principle, not the `utils/` pattern Principle IV bans: it holds one
cohesive thing, not leftovers.

**Post-Phase 1 re-check**: no gate changed status. No violation requires justification, so
Complexity Tracking below is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-rag-chunking-debugger/
├── spec.md              # What it does (complete)
├── plan.md              # This file
├── research.md          # Phase 0 — R-001…R-008 (complete)
├── data-model.md        # Phase 1 — entities and invariants (complete)
├── contracts/
│   └── domain-api.md    # Phase 1 — the boundary Principle III defends (complete)
├── quickstart.md        # Phase 1 — how to run and how to prove it works (complete)
└── tasks.md             # Phase 2 — NOT created by /speckit-plan
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # composes the features; holds session state
│   └── globals.css
│
├── features/
│   ├── documents/
│   │   ├── domain/
│   │   │   ├── document.ts             # validateDocument, isEmpty, MAX_DOCUMENT_LENGTH
│   │   │   └── document.test.ts
│   │   └── ui/
│   │       └── DocumentInput.tsx       # paste target, character counter, unload warning
│   │
│   ├── chunking/
│   │   ├── domain/
│   │   │   ├── chunk.ts                # Chunk, Segment types
│   │   │   ├── strategy.ts             # ChunkingStrategy union, validateStrategy
│   │   │   ├── fixed-size.ts
│   │   │   ├── fixed-size-overlap.ts
│   │   │   ├── paragraphs.ts
│   │   │   ├── tokens.ts               # takes TokenSpan[], never a tokenizer
│   │   │   ├── segments.ts             # toSegments — makes overlap renderable
│   │   │   ├── invariants.test.ts      # property tests: FR-010, SC-008
│   │   │   └── *.test.ts
│   │   └── ui/
│   │       ├── StrategyControls.tsx
│   │       └── ChunkedDocument.tsx     # renders Segments, not Chunks
│   │
│   ├── retrieval/
│   │   ├── domain/
│   │   │   ├── similarity.ts           # cosineSimilarity
│   │   │   ├── ranking.ts              # rankChunks, tie-break by position
│   │   │   └── *.test.ts
│   │   ├── embedding/                  # the only impure code in the feature
│   │   │   ├── embedder.worker.ts      # Transformers.js lives here and nowhere else
│   │   │   ├── protocol.ts             # Request/Response message types
│   │   │   └── useEmbedder.ts          # worker lifecycle, readiness, progress
│   │   └── ui/
│   │       ├── QueryInput.tsx
│   │       ├── RankedResults.tsx       # all chunks, scores, truncation flags
│   │       └── LoadProgress.tsx        # tokenizer and model, independently
│   │
│   ├── comparison/
│   │   ├── domain/
│   │   │   ├── comparison.ts           # exactly two sides, structurally
│   │   │   └── comparison.test.ts
│   │   └── ui/
│   │       └── ComparisonView.tsx
│   │
│   └── sharing/
│       └── ui/
│           └── SummaryImage.tsx        # canvas render, download, never uploaded
│
└── ui/                                 # presentational primitives, no logic, not a feature
    └── ...

e2e/
├── chunking.spec.ts                    # SC-001, SC-002, SC-003, SC-010
├── retrieval.spec.ts                   # SC-006, SC-007
└── no-network-leak.spec.ts             # SC-009 — the one that must never regress
```

**Structure Decision**: Screaming architecture per Principle IV — top-level folders under
`src/features/` are named for the problem, and a reader opening `src/` learns what Aguja does
before learning it is a Next.js app.

Each feature owns its `domain/` (pure, framework-free, where the tests live) and its `ui/`
(React, free to couple to the framework). `retrieval` additionally owns `embedding/`, the
quarantine for Transformers.js discussed above.

`src/ui/` sits outside `features/` and holds presentational primitives only. It is not a `utils/`
bucket: anything with logic belongs to a feature's domain, and anything that accumulates there
without a clear presentational purpose is a signal the boundary is being eroded.

## Implementation Sequencing

Follows the spec's priorities. Each stage leaves the suite green and is independently
demonstrable, per the constitution's workflow rule.

1. **Scaffold** — Next.js + TS + Tailwind + Vitest two-project config + ESLint domain-import ban +
   Playwright. Done when `pnpm test` and `pnpm lint` pass on an empty suite.
2. **P1 chunking, model-free** — `documents` and `chunking` domains test-first, then the render
   path through `toSegments`. Delivers three of four strategies with nothing downloaded.
3. **Worker and tokenizer** — worker scaffolding, `load-tokenizer`, `tokenize`. Completes P1 by
   adding the token strategy at a 0.7 MB cost.
4. **P2 retrieval** — `load-model` with progress, `embed`, then the `retrieval` domain test-first.
   Ranking, scores, truncation flags.
5. **P3 comparison** — two strategies, one document, one query.
6. **P4 sharing** — canvas summary, downloaded locally.

Stages 1–3 are the constitutional commitment: if the budget collapses after stage 3, what ships
is a complete, honest P1.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified.

No violations. The one naming tension is argued in the Constitution Check above rather than
recorded as a violation, since Principle IV's target is role-named grab-bags and `embedding/` is
a cohesive quarantine boundary.
