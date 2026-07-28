# Contract: `sensitivity/domain`

The interface this feature exposes is a domain module, not a network endpoint. This file is the
contract its tests are written against, before implementation (Principle II).

## `rankAcrossPhrasings`

```ts
function rankAcrossPhrasings(
  phrasingEmbeddings: readonly Embedding[],
  chunkEmbeddings: readonly Embedding[],
): ChunkRankProfile[];
```

Ranks every chunk against every phrasing and returns one profile per chunk, ordered by how much
each chunk's rank moved.

**Preconditions**

- `phrasingEmbeddings.length >= 2`. Fewer is a caller error; the domain throws rather than
  returning a degenerate result, because "spread across one phrasing" is meaningless (FR-041).
- All vectors share a dimension. Mismatch throws, matching `cosineSimilarity`'s existing behaviour.
- `chunkEmbeddings` may be empty; the result is then empty.

**Postconditions**

- Returns exactly `chunkEmbeddings.length` profiles — every chunk appears, including ones that
  rank last under every phrasing. A debugger that hides low-ranking chunks hides the diagnosis
  (D-003).
- `ranksByPhrasing[i]` is the chunk's rank under `phrasingEmbeddings[i]`, positionally aligned.
- Ranks are 1-based and dense: for each phrasing, ranks run `1..chunkEmbeddings.length` with no
  gaps and no repeats.
- `rankSpread === worstRank - bestRank`.
- `truncated` is carried through from the chunk's own embedding, untouched.

**Ordering**

`rankSpread` descending, then `chunkIndex` ascending (FR-040, FR-053).

**Ranking within one phrasing**

Delegates to the existing `rankChunks`, so tie-breaking is v1's: score descending, then chunk
index ascending. Reimplementing it here would let the two diverge.

## Test obligations

Written and observed failing before implementation.

| Case | Expectation |
|---|---|
| Two phrasings, three chunks, distinct scores | Exact ranks and spreads asserted as literal values |
| Chunk ranks 1st under one phrasing, last under another | `rankSpread === chunkCount - 1`, sorted first |
| Chunk holds the same rank under every phrasing | `rankSpread === 0`, sorted last among equals |
| Two chunks with equal spread | Lower `chunkIndex` first — tie broken explicitly |
| Two identical phrasings | Both rank columns identical; not an error |
| Tied similarity scores within one phrasing | Lower `chunkIndex` gets the better rank, inherited from `rankChunks` |
| One phrasing | Throws |
| Zero chunks | Empty array, no throw |
| Same input twice | Deep-equal output (FR-052) |
| Truncated chunk | `truncated: true` reaches the profile |

Assertions use exact values, not tolerances — local inference is deterministic (Principle II).
Where a test needs embeddings, it constructs plain normalized vectors directly rather than
invoking the model, so the domain stays testable without a worker.
