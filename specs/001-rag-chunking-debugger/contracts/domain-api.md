# Contract: Domain API

**Feature**: `001-rag-chunking-debugger` · **Date**: 2026-07-25

Aguja exposes no HTTP API and no CLI. Its one contract that outlives any implementation detail is
the boundary Principle III defends: **the pure functions the application layer is allowed to call,
and the plain data crossing in and out.**

Everything below is framework-free — no React, no Next, no Transformers.js, no `window`, no
`fetch`. Signatures are TypeScript for precision; types are defined in
[data-model.md](../data-model.md).

A second contract follows: the **worker message protocol**, which is where impure work is
quarantined ([R-002](../research.md)).

---

## 1. Documents

`src/features/documents/domain/`

```ts
const MAX_DOCUMENT_LENGTH = 50_000;

/** True when content is empty or entirely whitespace. */
function isEmpty(content: string): boolean;

/** Structural validation only. Never mutates or truncates the input. */
function validateDocument(content: string):
  | { valid: true }
  | { valid: false; reason: 'too-long'; length: number; max: number };
```

**Guarantees**

- Never throws.
- Never returns modified content — refusing oversized input is the caller's job (FR-003).

---

## 2. Chunking

`src/features/chunking/domain/`

```ts
/** Rejects invalid parameters before any chunking occurs (FR-009). */
function validateStrategy(strategy: ChunkingStrategy):
  | { valid: true }
  | { valid: false; reason: string };

/** Strategies needing no tokenizer. Total over valid input. */
function chunk(content: string, strategy: FixedSize | FixedSizeOverlap | Paragraphs): Chunk[];

/**
 * Token strategy. Takes token boundaries as plain data so the domain never
 * touches a tokenizer (R-004).
 * @param tokenSpans Ascending, non-overlapping offsets covering the content.
 */
function chunkByTokens(content: string, tokenSpans: TokenSpan[], size: number): Chunk[];

type TokenSpan = { start: number; end: number };

/** Collapses a chunk list into non-overlapping renderable segments (R-006). */
function toSegments(chunks: Chunk[], contentLength: number): Segment[];
```

**Guarantees** — every one of these is a test, and the first three are property tests over
arbitrary documents:

1. `chunks.map(c => c.text).join('') === content` for every non-overlap strategy (FR-010).
2. `c.text === content.slice(c.start, c.end)` for every chunk of every strategy.
3. `toSegments` output tiles `[0, contentLength)` exactly — ordered, gapless, non-overlapping.
4. Empty or whitespace-only content yields `[]`.
5. Content shorter than `size` yields exactly one chunk spanning everything.
6. `paragraphs` on content with no blank line yields exactly one chunk — the failure mode the tool
   exists to expose (SC-010).
7. Runs of consecutive blank lines never produce empty chunks.
8. Chunking is referentially transparent: same inputs, same output, always.

**Explicitly not the domain's job**: producing `tokenSpans` (the tokenizer does that, in the
worker), and trimming text for embedding (guarantee 1 would break).

---

## 3. Retrieval

`src/features/retrieval/domain/`

```ts
/** Assumes both vectors are L2-normalized, so this is a dot product. */
function cosineSimilarity(a: Float32Array, b: Float32Array): number;

/**
 * Ranks every chunk. No top-N cut — seeing a chunk at rank 34 is the diagnosis.
 * Ordering: score descending, ties broken by ascending chunkIndex (FR-015).
 */
function rankChunks(
  queryEmbedding: Embedding,
  chunkEmbeddings: readonly Embedding[],
): RankedResult[];
```

**Guarantees**

1. `rankChunks` returns exactly one result per chunk embedding.
2. `rank` values are `1..n` with no gaps or duplicates.
3. Results are ordered by descending `score`; equal scores order by ascending `chunkIndex`,
   deterministically and independently of input order or sort stability.
4. `cosineSimilarity(v, v) === 1` for any normalized `v`.
5. Identical inputs produce bit-identical outputs (FR-016, SC-007).
6. Throws on dimension mismatch rather than returning a meaningless score.

**Precondition**: vectors arrive normalized. The domain does not verify this per call — that is
the worker's guarantee, asserted once at the boundary.

---

## 4. Worker message protocol

`src/features/retrieval/embedding/`

The only impure surface in the feature. The main thread never imports Transformers.js; it posts
messages ([R-002](../research.md)).

**Main thread → worker**

```ts
type Request =
  | { type: 'load-tokenizer' }
  | { type: 'load-model' }
  | { type: 'tokenize'; id: string; text: string }
  | { type: 'embed'; id: string; texts: string[] };
```

**Worker → main thread**

```ts
type Response =
  | { type: 'tokenizer-ready' }
  | { type: 'model-ready' }
  | { type: 'progress'; target: 'tokenizer' | 'model'; loaded: number; total: number }
  | { type: 'tokenized'; id: string; spans: TokenSpan[] }
  | { type: 'embedded'; id: string; embeddings: Embedding[] }
  | { type: 'error'; target: 'tokenizer' | 'model'; message: string };
```

**Guarantees**

1. `load-tokenizer` and `load-model` are independent. The tokenizer (0.7 MB) resolves without the
   model (21.9 MB), so token chunking is usable long before querying is (FR-011, SC-003).
2. `progress` fires throughout both downloads, carrying enough to render labeled progress
   (FR-019). No silent waiting.
3. The worker issues **no network request other than fetching model assets from the Hugging Face
   CDN**. Document text and query text never leave the device (FR-013, SC-009).
4. `embed` trims each text before tokenizing, and reports `truncated`, `tokenCount` and
   `totalTokens` per input so FR-017 can surface what was cut.
5. Returned vectors are mean-pooled and L2-normalized — the precondition section 3 relies on.
6. Fixed inference configuration: WASM backend, pinned thread count, fixed quantization
   ([R-003](../research.md)). Nothing is selected by capability detection, because that would make
   scores device-dependent and break SC-007.
7. `error` never leaves the caller stuck: it names the failed target so FR-020 can state what
   still works.

---

## What this contract does not cover

Component props, hook signatures, and CSS. Those are application-layer concerns, free to change
without amending this document. Only the boundary above is stable — and it is stable because
Principle III says the domain may not import a framework, which means the framework can be
replaced without touching any of it.
