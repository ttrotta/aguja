# Phase 1 Data Model: RAG Chunking Debugger

**Feature**: `001-rag-chunking-debugger` · **Date**: 2026-07-25

Entities from [spec.md](./spec.md), given concrete shape. Everything here is plain data —
serializable, no methods, no framework types — because all of it crosses either the domain
boundary (Principle III) or the Web Worker boundary ([R-002](./research.md)), and those two
boundaries demand the same thing.

There is no persistence layer. All state is session-scoped by decision D-005.

---

## Document

The pasted text. Modeled as content plus length rather than as a file, so that adding file upload
later does not reshape the model (D-005).

| Field | Type | Notes |
|---|---|---|
| `content` | `string` | The raw pasted text, never normalized or trimmed |
| `length` | `number` | `content.length`; derived, carried for display against the cap |

**Validation** (FR-003):

- `length <= 50_000`. Input at the cap is refused, never silently truncated.
- A document whose `content` is empty or entirely whitespace is **empty**: strategies return zero
  chunks and the UI says nothing has been pasted rather than rendering an empty result.

---

## ChunkingStrategy

A named method plus its parameters. A discriminated union — the parameter set differs per method,
and modeling it as one bag of optional fields would make invalid combinations representable.

| Variant | Parameters | Needs tokenizer |
|---|---|---|
| `fixed-size` | `size: number` | no |
| `fixed-size-overlap` | `size: number`, `overlap: number` | no |
| `paragraphs` | *(none)* | no |
| `tokens` | `size: number` (in tokens) | **yes** |

**Validation** (FR-009), checked before chunking, each failure naming the constraint violated:

- `size >= 1`
- `overlap >= 0`
- `overlap < size` — equal or greater either duplicates content indefinitely or fails to advance

**Defaults**: `size = 500` characters, `overlap = 100` characters, `size = 128` tokens.

The `tokens` variant is the only one gated on tokenizer readiness. Per [R-004](./research.md) the
tokenizer is a 0.7 MB download independent of the 21.9 MB model, so this gate lifts almost
immediately and FR-011 still holds for the other three.

---

## Chunk

A contiguous span of the document. **Half-open offset range `[start, end)`.**

| Field | Type | Notes |
|---|---|---|
| `index` | `number` | Position in the chunk list, 0-based |
| `start` | `number` | Inclusive offset into `Document.content` |
| `end` | `number` | Exclusive offset |
| `text` | `string` | Exactly `content.slice(start, end)` |
| `length` | `number` | `end - start` |

**Invariants** — these are the property tests, not prose ([R-005](./research.md)):

1. `text === content.slice(start, end)` for every chunk, every strategy.
2. `start < end` — empty chunks are never produced, including for runs of blank lines.
3. For strategies without overlap: `chunks[0].start === 0`, `chunks[i].end === chunks[i+1].start`,
   and `chunks.at(-1).end === content.length`. Concatenating `text` in order therefore reproduces
   the document exactly (FR-010).
4. For `fixed-size-overlap`: `chunks[i+1].start === chunks[i].end - overlap`, so ranges overlap by
   exactly `overlap` and invariant 3 deliberately does not apply.

Chunk text carries whatever leading or trailing whitespace the span contains. It is trimmed at the
embedding boundary, never in the domain — trimming in the domain would break invariant 1.

---

## Segment

A maximal region of the document covered by an identical set of chunks. Derived from a chunk list
by a pure function; exists so the UI renders one flat list instead of reasoning about overlap
([R-006](./research.md)).

| Field | Type | Notes |
|---|---|---|
| `start` | `number` | Inclusive offset |
| `end` | `number` | Exclusive offset |
| `chunkIndices` | `number[]` | Every chunk covering this region, ascending |

**Invariants**:

1. Segments are ordered, non-overlapping, and tile the document exactly: they start at 0, end at
   `content.length`, and leave no gaps.
2. `chunkIndices.length >= 1`.
3. `chunkIndices.length > 1` marks an overlap region — this is what FR-008 renders differently.
4. For a strategy without overlap, segments correspond one-to-one with chunks.

---

## Embedding

A fixed-length vector derived from text. Plain data with no knowledge of how it was produced,
which is what lets ranking live in the domain.

| Field | Type | Notes |
|---|---|---|
| `vector` | `Float32Array` | 384 dimensions for all-MiniLM-L6-v2 |
| `truncated` | `boolean` | True when the source text exceeded the model's input limit |
| `tokenCount` | `number` | Tokens actually embedded, capped at 256 |
| `totalTokens` | `number` | Tokens the text would have needed |

**Normalization**: vectors are mean-pooled and L2-normalized at production time. Ranking therefore
assumes unit length and cosine similarity reduces to a dot product.

`truncated`, `tokenCount` and `totalTokens` exist to serve FR-017. The model's 256-token ceiling
means a chunk beyond roughly 1,000 characters loses its tail silently — precisely the invisible
failure this tool exists to expose, so the data model carries the evidence rather than discarding
it.

---

## Query

The user's search text, embedded exactly as a chunk is.

| Field | Type | Notes |
|---|---|---|
| `text` | `string` | Non-empty after trimming, or not submittable |

---

## RankedResult

A chunk paired with how it scored.

| Field | Type | Notes |
|---|---|---|
| `chunkIndex` | `number` | Reference into the chunk list, not a copy |
| `score` | `number` | Cosine similarity, `-1..1`, displayed on `0..1` |
| `rank` | `number` | 1-based position after ordering |
| `truncated` | `boolean` | Carried up from the embedding, for FR-017 |

**Ordering** (FR-014, FR-015): descending `score`; ties broken by ascending `chunkIndex`. The
tie-break is part of the contract, not an artifact of sort stability — two chunks with identical
scores must always order the same way for SC-007 to hold.

**Completeness**: every chunk gets a result. No top-N cut — seeing that the expected chunk ranked
34th *is* the diagnosis.

---

## Comparison

Two strategies evaluated against one document and one query (FR-022).

| Field | Type | Notes |
|---|---|---|
| `left` | `ChunkingStrategy` | |
| `right` | `ChunkingStrategy` | |
| `leftResults` | `RankedResult[]` | Ranked against `left`'s chunks |
| `rightResults` | `RankedResult[]` | Ranked against `right`'s chunks |

Exactly two sides, structurally. A list would make three representable, and FR-022 forbids
offering it.

---

## Model readiness

Not a spec entity, but application state the UI depends on, and two independent states rather than
one ([R-004](./research.md)).

| Field | Type | Notes |
|---|---|---|
| `tokenizer` | `'idle' \| 'loading' \| 'ready' \| 'failed'` | Gates the `tokens` strategy |
| `model` | `'idle' \| 'loading' \| 'ready' \| 'failed'` | Gates querying |
| `progress` | `number` | 0–1, for the labeled progress FR-019 requires |
| `error` | `string \| null` | Populated on `failed`, for FR-020 |

`failed` must state what remains available: chunking under the three model-free strategies keeps
working when the model cannot be fetched.

---

## What is deliberately absent

- **No `id` fields.** Nothing outlives the session, so nothing needs identity beyond array
  position.
- **No timestamps.** Nothing is persisted or ordered by time.
- **No user or session entity.** No accounts (FR-021), no persistence (D-005).
- **No file entity.** Upload is out of v1 scope (FR-002), and `Document` is shaped so adding one
  later is additive.
