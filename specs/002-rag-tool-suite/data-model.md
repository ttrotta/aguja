# Phase 1 Data Model: RAG Tool Suite

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Every type here is plain data. Nothing carries a method, a framework type, or a promise.
Embeddings appear as `Float32Array` because that is what the worker already returns and what
`retrieval/domain` already consumes.

## Existing types reused unchanged

| Type | Source | Why it matters here |
|---|---|---|
| `Chunk` | `chunking/domain/chunk.ts` | `{ index, start, end, text, length }` — both analyses report positions using `index`. |
| `Embedding` | `retrieval/domain/embedding.ts` | `{ vector, truncated, tokenCount, totalTokens }` — `truncated` is what FR-042 surfaces. |
| `RankedResult` | `retrieval/domain/ranking.ts` | Query Sensitivity ranks with the existing `rankChunks`, once per phrasing. |

No existing type is modified. Both analyses are additive.

## Session state (application layer, not domain)

Held by the tool layout for the lifetime of the page. Never serialized, never persisted (FR-033).

| Field | Type | Notes |
|---|---|---|
| `documentContent` | `string` | The pasted text. Shared by every tool (FR-030). |
| `embedder` | embedder handle | One worker per session (FR-031). Already implemented as `useEmbedder`. |
| `embeddingCache` | `Map<string, Embedding>` | Keyed by **chunk text**, not index (FR-032). |

**Validation**: the cache is only read for text that hashes to an exact match. A partial match is
never a hit; identical inputs must yield identical vectors (FR-052), and a near-match would break
that silently.

**Lifecycle**: cleared when the document changes, because chunk text from a previous document can
never be requested again and holding it only grows memory.

## Query Sensitivity

### `PhrasingSet`

Two to five non-empty phrasings of one question (FR-037, FR-041), in the order the user entered
them. Order is part of the value: results reference phrasings positionally, so a stable order is
what makes a run reproducible.

**Validation rules**

- Blank entries are dropped before validation, not treated as empty queries (Edge Cases).
- Fewer than two surviving entries is a refusal, not an empty result (FR-041).
- Duplicate phrasings are permitted; identical text necessarily produces identical ranks, which
  is a valid observation rather than an error (Edge Cases).

### `ChunkRankProfile`

One per chunk, for the whole run.

| Field | Type | Meaning |
|---|---|---|
| `chunkIndex` | `number` | Position in the chunk list. |
| `ranksByPhrasing` | `number[]` | Rank under each phrasing, positionally aligned to the `PhrasingSet`. 1-based, as v1 displays ranks. |
| `bestRank` | `number` | Minimum of `ranksByPhrasing`. |
| `worstRank` | `number` | Maximum of `ranksByPhrasing`. |
| `rankSpread` | `number` | `worstRank - bestRank` (FR-039). |
| `truncated` | `boolean` | True if this chunk's embedding was cut at the token ceiling (FR-042). |

**Derived, not stored**: `rankSpread` is always `worstRank - bestRank`. It is materialized because
it is the sort key and the headline number, not because it is independent state.

**Ordering** (FR-040, FR-053): `rankSpread` descending, then `chunkIndex` ascending. Never left to
sort stability.

## Confusable Chunks

### `ConfusablePair`

One per surfaced pair. Only pairs at or above the threshold exist (FR-043).

| Field | Type | Meaning |
|---|---|---|
| `firstChunkIndex` | `number` | Always the lower of the two indices. |
| `secondChunkIndex` | `number` | Always the higher. |
| `similarity` | `number` | Cosine on `[-1, 1]`, as the domain computes it. Display conversion is the UI's job. |
| `lexicalOverlap` | `number` | Shared wording on `[0, 1]` (FR-044). |

**Why both measures**: similarity alone cannot separate duplication from confusion — measured
contradictions score 0.93–0.96 while genuine 75%-overlap duplicates score 0.64–0.76
([research.md](./research.md), D-011). `lexicalOverlap` is what distinguishes them, and FR-045
forbids calling a pair duplicated without it.

**Invariants**

- `firstChunkIndex < secondChunkIndex`. A pair is unordered, so it is stored canonically and each
  pair appears once. Self-pairs do not exist.
- Similarity is symmetric because vectors are L2-normalized, so only the upper triangle is
  computed.

**Ordering** (FR-053): `similarity` descending, then `firstChunkIndex` ascending, then
`secondChunkIndex` ascending. Fully specified, never sort-stability dependent.

### `ConfusabilityRun`

Wraps the pairs with what the user must be told about the run itself.

| Field | Type | Meaning |
|---|---|---|
| `pairs` | `ConfusablePair[]` | Ordered as above. May be empty. |
| `chunksCompared` | `number` | How many chunks were actually compared. |
| `chunksTotal` | `number` | How many the document produced. |
| `threshold` | `number` | The threshold this run used. |

**Why the counts are in the result**: when `chunksCompared < chunksTotal` the cap was hit, and
FR-049 forbids that being silent. Carrying both numbers in the result makes the disclosure
structural rather than something the UI has to remember to render.

**Empty is not failure**: `pairs: []` with `chunksTotal >= 2` means nothing met the threshold, and
`chunksTotal < 2` means there was nothing to compare. FR-051 requires these read differently, so
the counts distinguish them without a separate status flag.

## State transitions

Neither analysis has internal state. Each is a pure function from inputs to an ordered result, run
once per submission. The only transitions are in the application layer:

```text
no document        → document pasted        → chunks derived
chunks derived     → embeddings requested   → embeddings cached
embeddings cached  → analysis submitted     → ordered result
document changed   → cache cleared          → back to "chunks derived"
```

Leaving a tool discards that tool's result but not the document, the embedder, or the cache
(Assumptions). Reload discards everything (FR-033).
