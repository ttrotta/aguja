# Tasks: RAG Chunking Debugger

**Input**: Design documents from `/specs/001-rag-chunking-debugger/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/domain-api.md](./contracts/domain-api.md),
[quickstart.md](./quickstart.md)

**Tests**: Included and mandatory, not optional. Principle II (Test-First) is non-negotiable in
the constitution: for domain logic, a test is written, run, and observed to fail before its
implementation exists. Every implementation task below names the test task it makes pass.

**Organization**: Tasks are grouped by user story (P1–P4 from spec.md) so each ships and
demonstrates independently, per the constitution's workflow rule that a phase's suite stays green
before the next begins.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different files, no dependency on an incomplete task — safe to run in parallel.
- **[Story]**: US1–US4, mapping to spec.md's P1–P4. Setup, Foundational, and Polish carry no
  story label.
- File paths are exact, per [plan.md](./plan.md)'s Project Structure.

---

## Phase 1: Setup

**Purpose**: A running project with nothing feature-specific in it yet.

- [X] T001 Initialize the Next.js 16 project (App Router, TypeScript, Tailwind CSS 4) — `package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` (no `tailwind.config.ts`: Tailwind v4 configures via `@import "tailwindcss"` in globals.css plus `@tailwindcss/postcss`, not a JS config file)
- [X] T002 [P] Add `@huggingface/transformers` v4 as a dependency (research.md R-001)
- [X] T003 [P] Configure Vitest with two projects — domain tests in `environment: 'node'`, component tests in jsdom — `vitest.config.ts` (research.md R-007)
- [X] T004 [P] Configure ESLint `no-restricted-imports` banning `react`, `next/*`, `@huggingface/transformers`, and cross-layer imports (`**/ui/**`, `**/app/**`, `**/embedding/**`) from any `**/domain/**` folder — `eslint.config.mjs` (research.md R-007)
- [X] T005 [P] Configure Playwright for Chromium — `playwright.config.ts`
- [X] T006 [P] Add `dev`, `build`, `start`, `test`, `test:domain`, `test:watch`, `test:e2e`, `lint`, `typecheck` scripts to `package.json` per quickstart.md

**Checkpoint**: `pnpm test`, `pnpm lint`, `pnpm typecheck` all pass against an empty project.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The one entity and one UI surface every story needs before anything else can be
demoed — pasting a document. Nothing here is a story on its own.

**⚠️ CRITICAL**: No user story work starts before this phase is green.

- [X] T007 [P] Write failing tests for `validateDocument`, `isEmpty`, `MAX_DOCUMENT_LENGTH` in `src/features/documents/domain/document.test.ts` (spec.md FR-003)
- [X] T008 Implement `src/features/documents/domain/document.ts` to pass T007
- [X] T009 [P] Define the `Chunk` and `Segment` plain types (no logic — data-model.md) in `src/features/chunking/domain/chunk.ts`
- [X] T010 Wire the app shell — `src/app/layout.tsx`, `src/app/page.tsx` holding session-scoped state (document, strategy, query — D-005), `src/app/globals.css` (strategy/query state slots land in T026/T044 when their domain types exist; only document state is wired now, per the phase's own checkpoint of "no chunking yet")
- [X] T011 Implement `DocumentInput.tsx` — paste target, live character counter against the cap, refusal at the cap, `beforeunload` warning — `src/features/documents/ui/DocumentInput.tsx` (FR-001, FR-003, FR-004)

**Checkpoint**: A user can paste a document, watch the counter, get refused at 50,000 characters,
and get warned before a reload discards their work. No chunking yet.

---

## Phase 3: User Story 1 - See where the cuts land (Priority: P1) 🎯 MVP

**Goal**: Paste a document, pick any of the four chunking strategies, see boundaries drawn and
redrawn live as parameters change.

**Independent Test**: quickstart.md, "Without the model — P1 only" table. No model download
required; verify with the network throttled offline after first paint.

### Tests for User Story 1 (write first, confirm failing)

- [X] T012 [P] [US1] Write failing property tests for chunk invariants — join reproduces the source exactly; `text === content.slice(start, end)`; empty document → `[]`; document shorter than one chunk → one chunk — in `src/features/chunking/domain/invariants.test.ts` (FR-010, SC-008)
- [X] T013 [P] [US1] Write failing tests for the fixed-size strategy in `src/features/chunking/domain/fixed-size.test.ts`
- [X] T014 [P] [US1] Write failing tests for the fixed-size-overlap strategy, including `overlap >= size` rejection, in `src/features/chunking/domain/fixed-size-overlap.test.ts`
- [X] T015 [P] [US1] Write failing tests for the paragraphs strategy — no blank line → one chunk plus a notice; consecutive blank lines collapse; chunks are never empty — in `src/features/chunking/domain/paragraphs.test.ts` (SC-010)
- [X] T016 [P] [US1] Write failing tests for `validateStrategy` — `size <= 0` and `overlap >= size` rejected, each naming the violated constraint — in `src/features/chunking/domain/strategy.test.ts` (FR-009)
- [X] T017 [P] [US1] Write failing tests for `toSegments` — tiles `[0, contentLength)` exactly with no gaps; multi-chunk regions carry every covering `chunkIndex` — in `src/features/chunking/domain/segments.test.ts` (FR-008)

### Implementation for User Story 1

- [X] T018 [US1] Implement the `ChunkingStrategy` union and `validateStrategy` in `src/features/chunking/domain/strategy.ts` (passes T016)
- [X] T019 [P] [US1] Implement `fixed-size.ts` (passes T013)
- [X] T020 [P] [US1] Implement `fixed-size-overlap.ts` (passes T014)
- [X] T021 [P] [US1] Implement `paragraphs.ts` (passes T015)
- [X] T022 [US1] Implement `toSegments` in `segments.ts` (passes T017)
- [X] T023 [US1] Implement the `chunk()` dispatcher in `src/features/chunking/domain/index.ts` per contracts/domain-api.md §2 (depends on T018–T021; passes T012)
- [X] T024 [US1] Implement `StrategyControls.tsx` — strategy picker, parameter inputs, inline validation messages from `validateStrategy` — `src/features/chunking/ui/StrategyControls.tsx`
- [X] T025 [US1] Implement `ChunkedDocument.tsx` — renders `Segment`s over the pasted text, overlap regions visually distinct, chunk index and length labeled, selection shows exact text/range/count — `src/features/chunking/ui/ChunkedDocument.tsx` (FR-006, FR-008)
- [X] T026 [US1] Wire chunking state into `src/app/page.tsx` — strategy or parameter change recomputes and redraws without re-pasting (FR-007)

### Worker and tokenizer for User Story 1 (completes the fourth strategy — research.md R-004)

- [ ] T027 [P] [US1] Define the worker message protocol types (`Request`/`Response`) in `src/features/retrieval/embedding/protocol.ts` per contracts/domain-api.md §4
- [ ] T028 [P] [US1] Write failing tests for `chunkByTokens` — takes `TokenSpan[]`, never imports a tokenizer — in `src/features/chunking/domain/tokens.test.ts`
- [ ] T029 [US1] Implement `chunkByTokens` in `src/features/chunking/domain/tokens.ts` (passes T028)
- [ ] T030 [US1] Implement `embedder.worker.ts` — `load-tokenizer` and `tokenize` handlers, `tokenizer-ready`/`progress`/`error` messages — `src/features/retrieval/embedding/embedder.worker.ts` (depends on T027)
- [ ] T031 [US1] Implement the `useEmbedder.ts` hook — worker lifecycle, `tokenizerReady` state, progress — `src/features/retrieval/embedding/useEmbedder.ts` (depends on T030)
- [ ] T032 [US1] Implement `LoadProgress.tsx` for tokenizer-download progress — `src/features/retrieval/ui/LoadProgress.tsx` (FR-019, tokenizer portion)
- [ ] T033 [US1] Wire the tokens strategy into `StrategyControls`/`ChunkedDocument`, gated on `tokenizerReady`, not on the model (FR-011)

### End-to-end for User Story 1

- [ ] T034 [P] [US1] Write `e2e/chunking.spec.ts` covering SC-001, SC-002, SC-003, SC-010 per quickstart.md

**Checkpoint**: All four chunking strategies work; only "by tokenization units" waits on the
~0.7 MB tokenizer, never on the 21.9 MB model. P1 is complete and independently shippable — if the
budget collapses here, what ships is honest and whole, per the constitution.

---

## Phase 4: User Story 2 - Ask why a passage is not found (Priority: P2)

**Goal**: Submit a query and see every chunk ranked by similarity, with scores and positions.

**Independent Test**: quickstart.md, "Retrieval" and "Model loading" tables.

### Tests for User Story 2

- [ ] T035 [P] [US2] Write failing tests for `cosineSimilarity` — self-similarity is 1 for a normalized vector; dimension mismatch throws — in `src/features/retrieval/domain/similarity.test.ts`
- [ ] T036 [P] [US2] Write failing tests for `rankChunks` — every chunk gets exactly one result; `rank` is `1..n` with no gaps or duplicates; ties break by ascending `chunkIndex`; output is deterministic regardless of input order — in `src/features/retrieval/domain/ranking.test.ts` (FR-014, FR-015, FR-016, SC-007)

### Implementation for User Story 2

- [ ] T037 [P] [US2] Implement `cosineSimilarity` in `src/features/retrieval/domain/similarity.ts` (passes T035)
- [ ] T038 [US2] Implement `rankChunks` in `src/features/retrieval/domain/ranking.ts` (passes T036)
- [ ] T039 [US2] Extend `embedder.worker.ts` with `load-model` and `embed` handlers — WASM backend pinned, fixed thread count (D-007), output L2-normalized, `truncated`/`tokenCount`/`totalTokens` reported per input (depends on T030; research.md R-003, contracts/domain-api.md §4)
- [ ] T040 [US2] Extend `useEmbedder.ts` with `modelReady` state and an `embed()` method (depends on T031, T039)
- [ ] T041 [US2] Implement `QueryInput.tsx` — non-empty validation, submit — `src/features/retrieval/ui/QueryInput.tsx`
- [ ] T042 [US2] Implement `RankedResults.tsx` — the full ranked list with scores and truncation flags; selecting a result highlights its chunk in `ChunkedDocument` — `src/features/retrieval/ui/RankedResults.tsx` (FR-014, FR-017, FR-018)
- [ ] T043 [US2] Extend `LoadProgress.tsx` for model-download progress; render an explicit failed state naming what still works — `src/features/retrieval/ui/LoadProgress.tsx` (FR-019 model portion, FR-020)
- [ ] T044 [US2] Wire retrieval into `src/app/page.tsx` — a query submitted before the model is ready is queued or its control is disabled with the reason shown, never silently ignored

### End-to-end for User Story 2

- [ ] T045 [P] [US2] Write `e2e/retrieval.spec.ts` covering SC-004, SC-006, SC-007 per quickstart.md
- [ ] T046 [P] [US2] Write `e2e/no-network-leak.spec.ts` — intercept every request across a full session (paste, chunk, query, compare, export) and assert none carries document or query text (SC-009, FR-013)

**Checkpoint**: P2 complete atop P1, independently demoable. T046 is the test that must never
regress — it is the verifiable form of Principle V.

---

## Phase 5: User Story 3 - Compare two strategies side by side (Priority: P3)

**Goal**: Evaluate two chunking strategies against the same document and query at once.

**Independent Test**: spec.md US3 Independent Test.

- [ ] T047 [P] [US3] Write failing tests for the comparison domain — exactly two sides, structurally, not a list capped at two — in `src/features/comparison/domain/comparison.test.ts` (FR-022)
- [ ] T048 [US3] Implement `comparison.ts` (passes T047)
- [ ] T049 [US3] Implement `ComparisonView.tsx` — two rankings side by side; selecting a source passage shows its rank and score under both strategies — `src/features/comparison/ui/ComparisonView.tsx` (FR-022, FR-023)
- [ ] T050 [US3] Wire comparison mode into `src/app/page.tsx` — no control exists to add a third strategy

**Checkpoint**: P3 complete atop P1 and P2.

---

## Phase 6: User Story 4 - Share the finding (Priority: P4)

**Goal**: Export a single image summarizing the strategy, its parameters, the query, and the
top-ranked chunks.

**Independent Test**: spec.md US4 Independent Test.

- [ ] T051 [US4] Implement `SummaryImage.tsx` — canvas render of strategy, parameters, query, top-ranked chunks with scores; generated and downloaded on-device, never uploaded — `src/features/sharing/ui/SummaryImage.tsx` (FR-024, FR-025)
- [ ] T052 [US4] Wire the share action into `src/app/page.tsx`

**Checkpoint**: All four user stories complete and independently demoable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Requirements that span every story, closed out once everything else is green.

- [ ] T053 [P] Add the English-only notice near the query input / model status (FR-026)
- [ ] T054 Run the full quickstart.md validation checklist — every e2e suite green, the manual first-run smoke test steps 1–6 confirmed by hand
- [ ] T055 Re-run the Constitution Check from plan.md against the finished implementation; record any drift as a new entry in `docs/decisions.md`, never by editing plan.md's original check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** — no dependencies, starts immediately.
- **Foundational (Phase 2)** — depends on Setup. Blocks every user story.
- **User Story 1 (Phase 3)** — depends on Foundational only.
- **User Story 2 (Phase 4)** — depends on Foundational, and on US1's worker scaffolding
  (T027, T030, T031) which it extends rather than duplicates. Independently *testable* per
  quickstart.md once its own phase is done, but not independently *buildable* before T030–T031
  exist.
- **User Story 3 (Phase 5)** — depends on Foundational; consumes US1's chunking output and US2's
  ranking output but adds no new domain concept to either.
- **User Story 4 (Phase 6)** — depends on Foundational and US2 (needs a completed query to
  summarize).
- **Polish (Phase 7)** — depends on every story in scope being complete.

### Within Each User Story

- Tests are written and observed failing before their matching implementation task.
- Domain before UI. UI before wiring into `src/app/page.tsx`.
- A story's checkpoint is not reached until its e2e task (where present) is green.

### Parallel Opportunities

- All `[P]` tasks within Phase 1 run together.
- T007 and T009 (Phase 2) touch different files and run together.
- Within US1, T012–T017 (all tests) run together; then T019–T021 (three strategies, three files)
  run together once T018 exists.
- Within US2, T035 and T036 run together; T037 can start alongside T038's test-writing since they
  are different files.
- US3 and US4 touch disjoint files from each other and could be staffed in parallel once US2 is
  done — but per the constitution, priority order (P1 → P2 → P3 → P4) is what's cut first if the
  budget tightens, so sequential is the default plan.

---

## Parallel Example: User Story 1 tests

```bash
# All six test-writing tasks are independent files — dispatch together:
Task: "Write failing property tests for chunk invariants in src/features/chunking/domain/invariants.test.ts"
Task: "Write failing tests for the fixed-size strategy in src/features/chunking/domain/fixed-size.test.ts"
Task: "Write failing tests for the fixed-size-overlap strategy in src/features/chunking/domain/fixed-size-overlap.test.ts"
Task: "Write failing tests for the paragraphs strategy in src/features/chunking/domain/paragraphs.test.ts"
Task: "Write failing tests for validateStrategy in src/features/chunking/domain/strategy.test.ts"
Task: "Write failing tests for toSegments in src/features/chunking/domain/segments.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: User Story 1, including its worker/tokenizer slice
4. **Stop and validate** against quickstart.md's "Without the model" and "Model loading" tables
   for the tokenizer path
5. This is the constitution's floor: independently shippable, no query capability, nothing
   dishonest about what it does

### Incremental Delivery

1. Setup + Foundational → paste and see the counter
2. + User Story 1 → chunk visualization, all four strategies (MVP)
3. + User Story 2 → querying and ranking
4. + User Story 3 → side-by-side comparison
5. + User Story 4 → shareable summary

Each addition is demoable on its own and never breaks what shipped before it.

### Notes

- `[P]` tasks touch different files with no dependency on an incomplete task.
- Commit after each task or each tightly related group — see the project's git history for the
  granularity that has worked so far (one commit per logical unit, not per file).
- Stop at any checkpoint to validate a story independently before continuing.
- If T046 (`no-network-leak.spec.ts`) ever fails, treat it as a stop-the-line defect ahead of any
  other work in flight — it is the verifiable form of the constitution's strongest claim.
