# Tasks: RAG Tool Suite

**Input**: Design documents from `/specs/002-rag-tool-suite/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included for both new `domain/` modules only, per the constitution's Test-First
principle (NON-NEGOTIABLE for domain logic, deterministic exact-value assertions). No existing UI
feature component in this codebase has its own test file — that convention is kept; new UI tasks
are implementation-only, validated through quickstart.md.

**Organization**: Grouped by user story from spec.md, in priority order (P1 → P2 → P3), so each
story is a complete, independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different files, no dependency on an incomplete task — safe to run in parallel
- **[Story]**: Which user story this task belongs to (US1, US2, US3); absent for Setup,
  Foundational, and Polish

## Path Conventions

Single Next.js project. `src/app/tool/` for routes and route-local components, `src/features/*/`
for feature code, screaming-architecture folders named for the problem (Principle IV).

---

## Phase 1: Setup

**Purpose**: Confirm the existing toolchain needs no changes before new code lands.

- [ ] T001 Confirm no new dependency is needed: `@huggingface/transformers` is already a
      dependency (plan.md Technical Context) and `vitest.config.ts`'s `domain` project already
      globs `src/features/**/domain/**/*.test.ts`, so the two new feature folders need no config
      edit to be picked up by `pnpm test:domain`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared session and the route shell every tool is reached through. Nothing here
is one story's work — all three stories depend on it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Create the tool session context in `src/app/tool/_components/ToolSession.tsx`: a
      `ToolSessionProvider` that hoists `useEmbedder()` (moved out of `tool/page.tsx`, which still
      owns it today), holds `documentContent` via `useState`, wraps its setter so that changing
      the document clears the embedding cache, and exposes `getOrEmbedChunks(texts: string[]):
      Promise<Embedding[]>` backed by a `Map<string, Embedding>` keyed by exact chunk text — a
      cache hit is only an exact match, never a near-match (FR-030, FR-031, FR-032, FR-033).
      Export a `useToolSession()` hook. No persistence of any kind.
- [ ] T003 [P] Create `src/app/tool/_components/ToolEmptyState.tsx`: renders what is missing —
      "no document pasted" or "model still downloading" with its progress — instead of an empty
      or broken analysis. Props: `{ reason: "no-document" | "model-loading"; progress?: number }`
      (FR-036).
- [ ] T004 [P] Create `src/app/tool/_components/ToolSidebar.tsx`: a persistent list of the four
      tools — Chunk Inspector (`/tool/chunks`), Strategy Comparison (`/tool/compare`), Query
      Sensitivity (`/tool/queries`), Confusable Chunks (`/tool/confusable`) — using `usePathname()`
      to visually distinguish the active entry from the rest (FR-027, FR-028). All labels in
      English (FR-035).
- [ ] T005 Create `src/app/tool/layout.tsx`: wraps children in `<Navbar />` and
      `<ToolSessionProvider>` (T002), and renders the existing panel chrome from the current
      `tool/page.tsx` (`rounded-lg`, `bg-panel-bg`, `md:h-dvh md:overflow-hidden` fixed-height
      shell) as a two-region layout — `<ToolSidebar />` (T004) plus a content region for
      `children`. Depends on T002, T004.

**Checkpoint**: Session and navigation shell exist. `src/app/tool/page.tsx` is still the full v1
debugger, untouched — that is deliberate, so Phase 3 can read it intact before it is replaced.

---

## Phase 3: User Story 1 - Move between tools without losing your work (Priority: P1) 🎯 MVP

**Goal**: Chunk inspection and strategy comparison become two addressable tools under the shared
session, replacing the single screen with a mode checkbox.

**Independent Test**: Paste a document, inspect chunks, move to Strategy Comparison and back — the
document persists, no second model download happens, and each tool has its own URL.

- [ ] T006 [P] [US1] Create `src/app/tool/chunks/page.tsx` by adapting the current
      `src/app/tool/page.tsx` (still intact at this point) single-strategy branch: `DocumentInput`,
      `StrategyControls`, `ModelStatus`, `QueryInput`, `QueryError`, `ChunkedDocument`,
      `RankedResults`, `SummaryImage`. Read `documentContent` / the wrapped setter / `embedder`
      from `useToolSession()` instead of local `useState`. Drop the `compareMode` checkbox and the
      compare branch entirely. Show `<ToolEmptyState reason="no-document" />` in the center column
      when nothing is pasted, and `<ToolEmptyState reason="model-loading" progress={...} />` where
      the tool needs the model and it is not ready (FR-036).
- [ ] T007 [P] [US1] Create `src/app/tool/compare/page.tsx` by adapting the current compare-mode
      branch of `src/app/tool/page.tsx` (two `StrategyControls`, `useCompareQuery`,
      `ComparisonView`). Read `documentContent` / `embedder` from `useToolSession()`. This route
      *is* compare mode — no checkbox, and no affordance anywhere for a third strategy (FR-034).
      Translate "Estrategia A" / "Estrategia B" to "Strategy A" / "Strategy B" while moving them.
- [ ] T008 [US1] Now that T006 and T007 exist and no longer need the original content, replace
      `src/app/tool/page.tsx` with a `redirect("/tool/chunks")` (Next.js `redirect()`, not a client
      bounce) (FR-029). Depends on T006, T007.
- [ ] T009 [P] [US1] Translate remaining Spanish strings to English (FR-035):
      `src/features/chunking/ui/ChunkedDocument.tsx` — pager "Anterior" / "Siguiente" / "página
      {n} de {m}" → "Previous" / "Next" / "Page {n} of {m}", "Vista previa del documento" →
      "Document preview", "Ver documento completo" → "View full document",
      `aria-label="Cerrar"` → `"Close"`; `src/features/retrieval/ui/RankedResults.tsx` — same
      pager strings.
- [ ] T010 [US1] Translate `src/app/_components/Navbar.tsx`: "Abrir el debugger" → "Open the
      debugger" (FR-035). Link target stays `/tool` (T008 makes it redirect to `/tool/chunks`).
- [ ] T011 [US1] Fix `e2e/chunking.spec.ts`, `e2e/retrieval.spec.ts`,
      `e2e/no-network-leak.spec.ts`: every `page.goto("/")` currently opens the marketing landing
      page, not the debugger — stale since `/tool` was introduced. Change each to
      `page.goto("/tool/chunks")`. The constitution requires the full suite green before any task
      is complete; this was already broken and this move is where it gets fixed.
- [ ] T012 [US1] Manual validation: run quickstart.md's Story 1 section — redirect to
      `/tool/chunks`, sidebar active-state per route, document and model survive a tool switch
      (confirm via the network panel: no second model download) within 1 second (SC-011), Back
      button walks through visited tools, a tool opened directly by URL with nothing pasted shows
      `ToolEmptyState` rather than breaking (FR-036), no third-strategy affordance anywhere
      (FR-034). One document pasted covers all four tools in the session (SC-012).

**Checkpoint**: Chunk Inspector and Strategy Comparison work as independent routes on the shared
session. `pnpm test:e2e` green. Independently shippable MVP.

---

## Phase 4: User Story 2 - Find out whether retrieval survives rephrasing (Priority: P2)

**Goal**: Rank every chunk against several phrasings of one question and surface which chunks'
rank is unstable.

**Independent Test**: Paste a document, enter three phrasings of one question, see every chunk's
rank per phrasing and its spread, most volatile first.

### Tests for User Story 2 ⚠️

> Write these first; run them; confirm they fail for the right reason (Principle II) before T014.

- [ ] T013 [P] [US2] Write `src/features/sensitivity/domain/rank-profile.test.ts` covering every
      case in [contracts/sensitivity.md](./contracts/sensitivity.md)'s test-obligations table:
      exact ranks and spreads on a literal fixture; a chunk ranked 1st under one phrasing and last
      under another gets `rankSpread === chunkCount - 1` and sorts first; a chunk with equal rank
      everywhere gets `rankSpread === 0` and sorts last among equals; two chunks with equal spread
      break the tie by ascending `chunkIndex`; two identical phrasings is not an error; a tied
      similarity score within one phrasing inherits `rankChunks`'s own tie-break; one phrasing
      throws; zero chunks returns `[]`; the same input run twice is deep-equal; a truncated
      chunk's `truncated: true` reaches the profile.

### Implementation for User Story 2

- [ ] T014 [US2] Implement `rankAcrossPhrasings` in
      `src/features/sensitivity/domain/rank-profile.ts` per
      [contracts/sensitivity.md](./contracts/sensitivity.md): ranks each phrasing by delegating to
      the existing `rankChunks` (do not reimplement its tie-break), builds one `ChunkRankProfile`
      per chunk, orders by `rankSpread` descending then `chunkIndex` ascending. Export
      `ChunkRankProfile` and `rankAcrossPhrasings` from a new
      `src/features/sensitivity/domain/index.ts`. Makes T013 pass without editing it.
- [ ] T015 [P] [US2] Build `src/features/sensitivity/ui/PhrasingInput.tsx`: 2–5 phrasing fields
      (add/remove a row within that range), blank entries dropped before counting rather than
      submitted as empty queries, submit disabled with a stated reason below 2 non-empty entries
      (FR-037, FR-041).
- [ ] T016 [US2] Build `src/features/sensitivity/ui/SensitivityResults.tsx`: renders
      `ChunkRankProfile[]` in the order the domain already returns (no client-side sort), each row
      showing per-phrasing ranks, the spread, and a truncated marker reusing the existing badge
      pattern from `RankedResults.tsx` (FR-039, FR-040, FR-042).
- [ ] T017 [US2] Create `src/app/tool/queries/page.tsx`: its own local chunking-strategy state
      and `<StrategyControls>` plus the shared `useChunks` hook, mirroring how `/tool/chunks`
      derives chunks — chunks are per-tool derived state, not shared session state (only the
      document and the embedder are shared, per data-model.md). Reads `documentContent` /
      `embedder` from `useToolSession()`, shows `<ToolEmptyState>` when there is no document or
      the model is not ready (FR-036). On submit: embed each phrasing via `embedder.embed()`,
      embed chunk texts via `getOrEmbedChunks()`, call `rankAcrossPhrasings`, render
      `<PhrasingInput>` + `<SensitivityResults>`.
- [ ] T018 [US2] Manual validation: run quickstart.md's Story 2 section — refusal under 2
      phrasings (FR-041), full rank/spread table within 5 seconds once embeddings are cached
      (SC-013), truncated marker visible, identical rerun produces identical output (FR-052,
      SC-015).

**Checkpoint**: Query Sensitivity works independently. US1 and US2 both function together.

---

## Phase 5: User Story 3 - Find out which chunks your retriever cannot tell apart (Priority: P3)

**Goal**: Surface chunk pairs the retriever scores as near-identical, reporting similarity
alongside lexical overlap so duplication and confusion read apart — never labeling a pair
"duplicated" on similarity alone (D-011).

**Independent Test**: Paste a document containing a true reworded duplicate and a pair stating
contradictory versions of one fact; both surface, distinguishably.

### Tests for User Story 3 ⚠️

> Write these first; run them; confirm they fail for the right reason before implementing.

- [ ] T019 [P] [US3] Write `src/features/confusability/domain/lexical-overlap.test.ts` per
      [contracts/confusability.md](./contracts/confusability.md): identical strings → `1`; no
      shared tokens → `0`; either string empty → `0`; both empty → `0` (not `1`); case differences
      → `1`; punctuation/whitespace differences → `1`; argument order swapped → identical result;
      a partial-overlap case with its exact literal value asserted.
- [ ] T020 [US3] Implement `lexicalOverlap` in
      `src/features/confusability/domain/lexical-overlap.ts` — token-set Jaccard or character
      n-gram overlap, whichever is chosen must satisfy every postcondition in
      [contracts/confusability.md](./contracts/confusability.md). Document the choice in a comment
      in this file; FR-047 requires the measure to be documented where a reader can find it next
      to the similarity figure it disambiguates. Makes T019 pass.
- [ ] T021 [P] [US3] Write `src/features/confusability/domain/confusable-pairs.test.ts` per
      [contracts/confusability.md](./contracts/confusability.md): one pair above threshold with
      its exact similarity asserted; a pair exactly at threshold is included (inclusive boundary);
      two pairs with equal similarity break ties by ascending `firstChunkIndex`, then ascending
      `secondChunkIndex`; `chunks.length` exceeding `maxChunks` yields `chunksCompared ===
      maxChunks`, `chunksTotal` unchanged, and only in-range pairs; zero chunks → empty `pairs`,
      `chunksTotal === 0`, no throw; one chunk → empty `pairs`, `chunksTotal === 1`, no throw;
      nothing meets threshold → empty `pairs` with `chunksTotal >= 2`; length mismatch throws; the
      same input run twice is deep-equal; a contradiction fixture (two vectors built to be highly
      similar with deliberately low lexical overlap) is surfaced with `lexicalOverlap` low — the
      case D-011 exists for. Depends on T020 (uses `lexicalOverlap`).
- [ ] T022 [US3] Implement `findConfusablePairs` in
      `src/features/confusability/domain/confusable-pairs.ts` per
      [contracts/confusability.md](./contracts/confusability.md): upper-triangle-only comparison
      (vectors are L2-normalized, so similarity is symmetric — research.md Finding 3), canonical
      `firstChunkIndex < secondChunkIndex` pair ordering, truncation by position up to
      `maxChunks`, threshold on raw cosine. The function itself never labels a pair — it returns
      both numbers and lets the caller decide (FR-045). Export `findConfusablePairs`,
      `ConfusablePair`, and `ConfusabilityRun` from a new
      `src/features/confusability/domain/index.ts`. Makes T021 pass.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Build `src/features/confusability/ui/ThresholdControl.tsx`: an adjustable
      control for the cosine threshold, defaulting to the value confirmed in T025 below,
      re-running the pair search on change (FR-046).
- [ ] T024 [US3] Build `src/features/confusability/ui/ConfusablePairs.tsx`: renders a
      `ConfusabilityRun`. Each pair shows both similarity and lexical overlap (FR-044), with
      visibly different treatment for high-overlap (likely duplication) versus low-overlap (likely
      confusion) pairs — never describing a pair as "duplicated" or "identical" on similarity
      alone (FR-045). When `chunksCompared < chunksTotal`, a visible notice states the cap was
      reached and how many chunks were excluded (FR-049). When `pairs` is empty, distinguishes
      "nothing met the threshold" from "fewer than two chunks to compare" (FR-051).
- [ ] T025 [US3] Confirm the similarity threshold in-browser (research.md Open Item 1):
      research.md's figures were measured on Node's `cpu` execution provider; the app runs
      `wasm`. Re-embed 3–4 of the measured pairs (a 75%-overlap duplicate pair, a paraphrase pair,
      and at least one contradiction pair) through the real worker and compare. If every value is
      within roughly 0.02 of the recorded figure, keep the default (raw 0.70 / displayed 0.85);
      if not, recompute the default from the in-browser numbers and update research.md's Finding
      1 with the corrected figures and this confirmation.
- [ ] T026 [US3] Choose the chunk-comparison cap from real in-browser embedding throughput
      (research.md Open Item 2, and the D-011 correction that pair comparison itself is cheap —
      about 1 second at 2,000 chunks): embed increasing batches of chunks through the existing
      worker and time them, then pick a cap that keeps a full-cap embed within a few seconds on
      typical hardware. Record the chosen value and the measurement behind it in research.md.
- [ ] T027 [US3] Create `src/app/tool/confusable/page.tsx`: own local chunking-strategy state and
      `<StrategyControls>` plus `useChunks`, mirroring T017's pattern. Reads `documentContent` /
      `embedder` from `useToolSession()`, shows `<ToolEmptyState>` where needed (FR-036). On
      submit: embed chunk texts via `getOrEmbedChunks()` up to the cap from T026, call
      `findConfusablePairs` with the threshold from T025, render `<ThresholdControl>` +
      `<ConfusablePairs>`. Keep the interface responsive while comparing (FR-048/FR-050) — if the
      in-browser comparison at the chosen cap visibly blocks the main thread, move the comparison
      into a plain Web Worker (pure arithmetic, no model needed, so this does not touch the
      embedding worker).
- [ ] T028 [US3] Manual validation: run quickstart.md's Story 3 section — the contradiction pair
      surfaces with high similarity and low overlap, never called a duplicate (FR-045); the
      reworded-duplicate pair is distinguishable from it at a glance (SC-019); threshold changes
      update the list (FR-046); an oversized document shows the cap notice with the interface
      staying responsive throughout (FR-049, SC-014); a single-chunk and a no-match document each
      produce their distinct explicit message (FR-051).

**Checkpoint**: All three user stories independently functional. Full domain + e2e suite green.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Close out FR-035's application-wide scope and the quality gates every task in this
project owes before being called complete.

- [ ] T029 [P] Translate remaining Spanish strings on the landing page to English (FR-035 is
      application-wide, not `/tool`-only): `src/app/_components/LandingHero.tsx`,
      `src/app/_components/ProblemEvidenceBoard.tsx`,
      `src/app/_components/ProductWalkthrough.tsx`, `src/app/_components/ClosingCta.tsx`.
- [ ] T030 Update `src/app/_components/ToolDial.tsx`'s tool entries to the four shipped names —
      "Chunk Inspector", "Strategy Comparison", "Query Sensitivity", "Confusable Chunks" —
      translating "Próximamente" and the helper text to English in the same pass (FR-035). If any
      "Próximamente" slot remains, update DESIGN.md's Tool Dial component description to match
      the new real/soon balance; if none remain, note that in DESIGN.md instead of leaving it
      describing slots that no longer exist.
- [ ] T031 Run `pnpm lint` and `pnpm typecheck` across the full changed set; fix any findings.
- [ ] T032 Run the Impeccable design detector over every changed UI file — `node
      .claude/skills/impeccable/scripts/detect.mjs --json <changed files>` — and address findings,
      per CLAUDE.md's design workflow.
- [ ] T033 Run `pnpm test` (full unit suite, both Vitest projects) and `pnpm test:e2e` (full
      Playwright suite); both must be green. The constitution requires this before any task counts
      as complete, not only at the end — treat this as confirmation, not first discovery.
- [ ] T034 Run quickstart.md's full manual pass end to end, including its "Owed before this is
      done" checklist. Confirm T025 and T026 are recorded in research.md and T020's lexical-overlap
      choice is documented — none of the three are optional per research.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks every user story.
- **User Story 1 (Phase 3)**: Depends on Foundational. No dependency on US2 or US3.
- **User Story 2 (Phase 4)**: Depends on Foundational only — not on US1. Built after US1 here
  because P1 ships first, not because US2 reads anything US1 produces.
- **User Story 3 (Phase 5)**: Depends on Foundational only — not on US1 or US2, for the same
  reason.
- **Polish (Phase 6)**: Depends on whichever user stories are in scope for this pass. T033
  requires all attempted stories to exist.

### Within Each Phase

- Foundational: T002, T003, T004 are mutually independent → parallel. T005 depends on T002 + T004.
- US1: T006 and T007 both read the still-intact original `tool/page.tsx` and write to different
  new files → parallel. T008 depends on both (it deletes what they read from). T009 is
  independent of T006–T008. T010, T011 are independent small edits. T012 is last.
- US2: T013 before T014 (Test-First). T015 is independent of T013/T014. T016 depends on T014's
  types. T017 depends on T014, T015, T016. T018 is last.
- US3: T019 before T020. T021 depends on T020, then T021 before T022 (Test-First). T023 is
  independent early. T024 depends on T022's types. T025, T026 are measurement tasks, independent
  of each other, both needed before T027. T027 depends on T022, T024, T025, T026. T028 is last.

### Parallel Opportunities

- Foundational: T002, T003, T004 together.
- US1: T006, T007 together; separately, T009, T010, T011 together.
- US2: T013 alone first; then T015 can run alongside T014.
- US3: T019 alone first; after T020, T021 alone; T023 can run alongside T020–T022; T025 and T026
  can run together once T022 exists.
- Once Foundational is done, US1, US2, and US3 could in principle proceed in parallel by
  different people — but T033/T034 (full-suite green, quickstart pass) are the real gate before
  calling any of them done, so treat "parallel" as team capacity, not license to skip validation.

---

## Parallel Example: Foundational

```bash
Task: "Create ToolSession context in src/app/tool/_components/ToolSession.tsx"
Task: "Create ToolEmptyState in src/app/tool/_components/ToolEmptyState.tsx"
Task: "Create ToolSidebar in src/app/tool/_components/ToolSidebar.tsx"
```

## Parallel Example: User Story 1

```bash
Task: "Create src/app/tool/chunks/page.tsx from the current tool/page.tsx single-strategy branch"
Task: "Create src/app/tool/compare/page.tsx from the current tool/page.tsx compare branch"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational — **critical**, blocks everything after it
3. Phase 3: User Story 1
4. **Stop and validate**: T012, `pnpm test:e2e` green
5. This is a real, shippable improvement even with only the two v1 capabilities relocated

### Incremental Delivery

1. Setup + Foundational → shell exists, nothing 404s except unbuilt tools
2. Add US1 → validate → MVP
3. Add US2 → validate → phrasing sensitivity ships
4. Add US3 → validate → confusable chunks ships
5. Polish → FR-035 fully closed, both research.md open items resolved, full suite green

### Notes

- [P] tasks touch different files with no dependency on incomplete work.
- Domain tests (T013, T019, T021) must be written, run, and observed failing before their
  matching implementation task — Principle II is non-negotiable, not a style preference.
- Commit after each checkpoint, not after each task — matches how this feature's spec and plan
  were committed (per-phase, not per-file).
- Stop at any checkpoint to validate a story independently before continuing.
