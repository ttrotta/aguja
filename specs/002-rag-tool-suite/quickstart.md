# Quickstart: Validating the RAG Tool Suite

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

How to prove this feature works end to end. Types and ordering rules are in
[data-model.md](./data-model.md) and [contracts/](./contracts/) — this file is the run guide.

## Prerequisites

- `pnpm install` has been run, Node 20+
- First run downloads roughly 25 MB of model weights and caches them in the browser. A cold run
  is expected to be slow; that is the behaviour v1 already surfaces as labelled progress.

## Domain tests first

The domain is testable without a browser, a worker, or the model — that is what Principle III
buys. These must be written and observed failing before implementation exists.

```bash
pnpm test:domain          # both new modules plus every v1 domain test
pnpm test                 # full unit suite
```

**Expected**: all green, including the v1 chunking and ranking tests. A regression there means the
suite refactor reached into `retrieval/domain`, which this plan says it must not.

## Static checks

```bash
pnpm typecheck
pnpm lint
```

## Manual validation

```bash
pnpm dev                  # http://localhost:3000/tool
```

### Story 1 — the session survives a tool switch

1. Open `/tool`. **Expect** a redirect to chunk inspection with the sidebar visible (FR-029).
2. Paste a document of a few thousand characters. Wait for the model to finish loading.
3. Move to Strategy Comparison. **Expect** the document still present, and no second download
   (FR-030, FR-031). Watch the network panel to confirm.
4. Move to two more tools, then press Back three times. **Expect** to walk back through the tools,
   not out of the suite (FR-028).
5. Open a tool's URL in a new tab. **Expect** the tool to render and say it needs a document —
   nothing survives a reload (FR-033, FR-036).
6. In Strategy Comparison, look for a way to add a third strategy. **Expect** none (FR-034).

### Story 2 — phrasing sensitivity

1. Paste a document with one passage that clearly answers a specific question.
2. Open Query Sensitivity. Enter one phrasing and try to run it. **Expect** a refusal saying at
   least two are needed (FR-041).
3. Add two more phrasings of the same question, one deliberately using different vocabulary from
   the document. Run it.
4. **Expect** every chunk listed with its rank under each phrasing and its spread, most volatile
   first (FR-039, FR-040), within 5 seconds (SC-013).
5. **Expect** any chunk whose text was cut at the token ceiling to be marked (FR-042).
6. Run the identical set again. **Expect** identical output (FR-052).

### Story 3 — confusable chunks

Use a document containing **both** of these deliberately:

- a passage repeated with slight rewording (a true duplicate), and
- two passages stating contradictory versions of one fact, for example a 30-day refund window in
  one place and 14 days in another.

1. Open Confusable Chunks and run it at the default threshold.
2. **Expect** the contradictory pair to surface with high similarity and **low** shared wording,
   and to be described as chunks the retriever cannot separate — never as duplicates (FR-045).
3. **Expect** the reworded duplicate to surface with high shared wording, distinguishable from the
   contradiction at a glance (SC-019).
4. Raise the threshold until nothing qualifies. **Expect** a statement that nothing met it, not a
   blank list (FR-051).
5. Paste a document that yields a single chunk. **Expect** a statement that there is nothing to
   compare (FR-051).
6. Paste a 50,000-character document at a small chunk size to exceed the cap. **Expect** to be
   told the cap was reached and what was not compared (FR-049), with the interface responsive
   throughout (FR-050, SC-014).

### Cross-cutting

- Every string on screen is English (FR-035).
- The non-English warning still appears where scores are shown.
- Toggle the theme in each tool; both remain legible.

## End-to-end suite

```bash
pnpm test:e2e
```

Real model, real browser. Expect it to be slow. Worker concurrency is capped at 4 for the reasons
in D-009; do not raise it to make this faster.

## Owed before this is done

[research.md](./research.md) leaves three items for implementation, and this feature is not
complete while any is open:

1. Confirm the similarity threshold in-browser on the `wasm` provider — measurement ran on `cpu`.
2. Choose the chunk cap from real in-browser embedding throughput, not from pair-comparison cost.
3. Choose and document the lexical-overlap measure.
