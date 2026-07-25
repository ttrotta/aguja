# Phase 0 Research: RAG Chunking Debugger

**Feature**: `001-rag-chunking-debugger` · **Date**: 2026-07-25

Resolves the technical unknowns left open by [spec.md](./spec.md) and the constitution. Every
decision here is bounded by Principle V (local-only inference) and Principle III (framework-free
domain) — neither is up for renegotiation at this layer.

---

## R-001 — Use `@huggingface/transformers` v4, not `@xenova/transformers`

**Decision.** Depend on `@huggingface/transformers` (v4.2.0 at time of writing).

**Rationale.** Transformers.js moved from `@xenova/transformers` to `@huggingface/transformers`
at v3. The old package is frozen at 2.17.2 and no longer receives model-format or runtime
updates. The model repository name `Xenova/all-MiniLM-L6-v2` is unaffected — it is a Hugging Face
repo ID, not a package name, and stays valid.

**Alternatives considered.** `@xenova/transformers` v2 — rejected as abandoned.

**Verified.** The model repo exists, is public and ungated, declares
`library_name: transformers.js`, and carries the `feature-extraction` pipeline tag.

---

## R-002 — Run inference in a Web Worker

**Decision.** All model loading, tokenization and embedding happens in a dedicated Web Worker.
The main thread never touches Transformers.js.

**Rationale.** Embedding 100 chunks takes seconds. On the main thread that freezes the UI,
which breaks SC-002 (100 ms redraw on parameter change) whenever a query is in flight, and makes
the labeled progress required by FR-019 impossible to render — the very thread that must paint
progress would be blocked producing it.

The worker boundary also enforces Principle III for free: domain code cannot reach the model
even by accident, because the model lives in another thread and is reachable only by message.

**Consequences.** Chunks cross the worker boundary as plain serializable data, and embeddings
come back as plain arrays. That is exactly the shape Principle III demands of domain inputs, so
the constraint and the architecture agree rather than fight.

**Alternatives considered.** Main-thread inference with `await` yields — rejected; it does not
actually keep the UI responsive under sustained matmul work.

---

## R-003 — Pin the WASM execution backend; do not enable WebGPU in v1

**Decision.** Configure ONNX Runtime to use the WASM backend with a fixed thread count. WebGPU
stays off in v1.

**Rationale.** FR-016 and SC-007 require identical scores across runs. Backend choice changes
numerical results: WebGPU produces different rounding than WASM, and would silently make scores
device-dependent. Worse, a backend selected by capability detection means the *same user* can get
different scores after a browser update.

The performance cost is affordable. Quantized MiniLM over short chunks runs in the low tens of
milliseconds per chunk on WASM, so a 100-chunk document lands well inside the 15-second budget of
SC-006. WebGPU would be faster than necessary to meet a requirement already met.

A fixed thread count matters as much as the backend: thread partitioning determines reduction
order in matmul, and a thread count derived from `navigator.hardwareConcurrency` would reintroduce
the device-dependence this decision exists to remove.

**Consequences.** Determinism is guaranteed for a given browser and build. It is not guaranteed
across browsers, and the specification should not be read as promising that. Revisit WebGPU only
if SC-006 is missed on real hardware.

**Alternatives considered.** WebGPU with WASM fallback — rejected, it makes scores a function of
hardware. Accepting tolerance-based assertions instead — rejected, it contradicts Principle II.

**Escalation.** This constrains the stack, so per the constitution's amendment procedure it is
recorded as D-007 in `docs/decisions.md`.

---

## R-004 — Load the tokenizer independently of the model

**Decision.** Load the tokenizer as a separate step from the embedding model. Token-based
chunking becomes available as soon as the tokenizer is ready, without waiting for the model.

**Rationale.** This resolves the tension the specification flagged between FR-011 (three
strategies must work with no model) and FR-005 (four strategies exist, one of which needs a
tokenizer). Measured sizes from the model repository:

| Asset | Size |
|---|---|
| `tokenizer.json` | 0.7 MB |
| `onnx/model_quantized.onnx` | 21.9 MB |

The tokenizer is 3% of the download. Fetching it alone is effectively instantaneous, so the
fourth strategy joins the other three almost immediately rather than being gated behind the full
21.9 MB.

**Consequences.** Two independent readiness states, not one: `tokenizerReady` and `modelReady`.
The UI reflects both. P1 (all four strategies) is genuinely shippable without the model, which is
what the constitution demands of P1.

**Alternatives considered.** Gating token chunking behind full model load — rejected; it would
have made a P1 feature depend on a P2 asset. Approximating tokens as `characters / 4` — rejected;
the entire value of this strategy is showing what the model *actually* sees.

---

## R-005 — Chunks are covering spans, so concatenation is exact

**Decision.** A chunk is a half-open offset range `[start, end)` into the source. For every
strategy without overlap, consecutive chunks satisfy `chunk[i].end === chunk[i+1].start`,
`chunk[0].start === 0`, and `last.end === source.length`. `chunk.text` is exactly
`source.slice(start, end)`.

**Rationale.** FR-010 requires that concatenating chunks reproduces the source exactly. The naive
paragraph implementation — split on blank lines, keep the paragraphs — violates this, because the
separators are discarded. Under this decision a paragraph chunk runs from the start of its
paragraph to the start of the next, carrying its trailing blank lines, and reconstruction is
exact by construction.

**Consequences.** Chunk text may carry leading or trailing whitespace. Text is therefore trimmed
at the embedding boundary, not in the domain, so that FR-010's property stays true of the domain
output. Trimming for display is a UI concern and must not mutate offsets.

This makes FR-010 a cheap property test — generate arbitrary documents, chunk, join, compare —
rather than a set of hand-written cases.

**Alternatives considered.** Storing separators as non-chunk gaps — rejected; it complicates every
consumer to serve one requirement. Narrowing FR-010 to exclude paragraphs — rejected; the property
is the guarantee that no text was lost at a boundary, which is the tool's whole subject.

---

## R-006 — Render overlaps by deriving segments, not by stacking chunks

**Decision.** A pure domain function converts a chunk list into an ordered list of
non-overlapping **segments**, each carrying the indices of every chunk covering it. The UI renders
segments, never chunks directly.

**Rationale.** FR-008 requires overlapping regions to be visually distinguished. Rendering chunks
as nested or absolutely-positioned spans over text is fragile and effectively untestable. Segments
turn the visual problem into a data problem: a region covered by two chunks is simply a segment
whose `chunkIndices` has length 2, which the UI styles differently and a unit test asserts
directly.

For non-overlap strategies the segment list is the chunk list, so one rendering path serves all
four strategies.

**Consequences.** Overlap rendering is covered by domain tests with no DOM involved, which is
Principle III paying off exactly where it was supposed to.

---

## R-007 — Enforce the domain rule mechanically, not by discipline

**Decision.** Two independent enforcement mechanisms:

1. **ESLint `no-restricted-imports`** scoped to `**/domain/**`, banning `react`, `next/*`,
   `@huggingface/transformers`, and relative escapes into non-domain folders.
2. **A separate Vitest project for domain tests running in `environment: 'node'`**, with no DOM
   globals present. Any accidental use of `window`, `document` or `fetch` fails the test run
   rather than passing silently under jsdom.

**Rationale.** Principle III is the load-bearing rule of the architecture and the only one
borrowed from Clean Architecture. A rule enforced only by review is a rule that decays. The Node
environment is the stronger of the two, because it catches runtime reach-through that a static
import check cannot see.

**Consequences.** Domain tests are also the fastest tests in the suite — no jsdom startup — which
keeps the test-first loop of Principle II genuinely cheap.

---

## R-008 — Rely on the browser Cache API for model persistence

**Decision.** Leave Transformers.js default caching enabled; do not implement custom caching.

**Rationale.** SC-005 requires repeat visits to avoid re-downloading. Transformers.js already
stores fetched model files in the Cache API keyed by repo and revision. Reimplementing this in
IndexedDB would add a failure mode to satisfy a requirement already met.

**Consequences.** Cache eviction is the browser's decision, so a repeat visit can occasionally
re-download. The progress UI required by FR-019 covers that case without special handling, since
it is the same code path as a first visit.

---

## Open items carried into implementation

None blocking. Two to verify empirically once code exists:

- **SC-006 on real hardware.** The 15-second budget for 100 chunks is estimated, not measured. If
  WASM misses it, R-003 is the decision to revisit — and revisiting it costs the cross-run
  determinism guarantee, so measure before trading.
- **Next.js worker bundling.** Instantiating a worker with `new Worker(new URL(...), { type: 'module' })`
  under Turbopack needs confirmation in this specific Next version; if it misbehaves, the fallback
  is a plain worker file served from `public/`.
