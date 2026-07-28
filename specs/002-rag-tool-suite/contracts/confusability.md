# Contract: `confusability/domain`

Two modules. `lexicalOverlap` is what makes the pair list honest — without it the tool would be
reporting similarity and letting the reader infer duplication, which measurement showed to be
false in the cases that matter most ([research.md](../research.md), D-011).

## `lexicalOverlap`

```ts
function lexicalOverlap(a: string, b: string): number;
```

How much wording two chunks share, on `[0, 1]`.

**Preconditions**: none. Empty strings are valid input.

**Postconditions**

- Returns `0` when either string has no tokens, including when both are empty. Two empty chunks
  share no wording; returning `1` would report a duplicate that is not there.
- Returns `1` for identical token content.
- Symmetric: `lexicalOverlap(a, b) === lexicalOverlap(b, a)`.
- Deterministic and case-insensitive; comparison is over tokens, not raw characters, so
  whitespace and punctuation differences do not register as different wording.

**Open decision for implementation**: token-set Jaccard versus character n-gram overlap. Whichever
is chosen must satisfy every postcondition above, must be documented next to the similarity figure
it disambiguates, and must be pure. Research flagged this as owed
([research.md](../research.md), Open items).

## `findConfusablePairs`

```ts
function findConfusablePairs(
  chunks: readonly Chunk[],
  embeddings: readonly Embedding[],
  threshold: number,
  maxChunks: number,
): ConfusabilityRun;
```

Compares every chunk pair and returns those at or above `threshold`, with the counts the interface
needs to disclose what was and was not compared.

**Preconditions**

- `chunks.length === embeddings.length`. Mismatch throws.
- `threshold` on `[-1, 1]`, the raw cosine range. Converting for display is the UI's job, so the
  domain never carries two scales.
- `maxChunks >= 0`.

**Postconditions**

- Only the first `min(chunks.length, maxChunks)` chunks are compared. Truncation is by position,
  not by sampling, so a rerun compares the same set (FR-052).
- `chunksCompared` and `chunksTotal` are both returned, always — the cap disclosure is structural,
  not something the UI must remember (FR-049).
- Every pair satisfies `firstChunkIndex < secondChunkIndex`; each unordered pair appears exactly
  once; no self-pairs.
- `similarity >= threshold` for every returned pair.
- `pairs` may be empty. Empty with `chunksTotal >= 2` means nothing met the threshold; empty with
  `chunksTotal < 2` means there was nothing to compare (FR-051).
- Only the upper triangle is computed, since cosine over L2-normalized vectors is symmetric.

**Ordering** (FR-053)

`similarity` descending, then `firstChunkIndex` ascending, then `secondChunkIndex` ascending.
Fully specified; never sort-stability dependent.

**What this function must not do**

It must not label a pair. Nothing in the return value says "duplicate", and no field ranks
duplication above confusion. FR-045 puts that judgement in front of the user with both numbers
visible, because the model cannot make it: contradictions measured 0.93–0.96 while true
75%-overlap duplicates measured 0.64–0.76.

## Test obligations

Written and observed failing before implementation.

### `lexicalOverlap`

| Case | Expectation |
|---|---|
| Identical strings | `1` |
| No shared tokens | `0` |
| Either string empty | `0` |
| Both empty | `0`, not `1` |
| Same tokens, different case | `1` |
| Same tokens, different punctuation and spacing | `1` |
| Argument order swapped | Identical result |
| Partial overlap | Exact literal value asserted |

### `findConfusablePairs`

| Case | Expectation |
|---|---|
| Three chunks, one pair above threshold | Exactly that pair, exact similarity asserted |
| Pair exactly at threshold | Included — the boundary is inclusive |
| Two pairs with equal similarity | Lower `firstChunkIndex` first |
| Equal similarity and equal first index | Lower `secondChunkIndex` first |
| `chunks.length` exceeds `maxChunks` | `chunksCompared === maxChunks`, `chunksTotal` unchanged, only in-range pairs returned |
| Zero chunks | Empty `pairs`, `chunksTotal === 0`, no throw |
| One chunk | Empty `pairs`, `chunksTotal === 1`, no throw |
| Nothing meets threshold | Empty `pairs`, `chunksTotal >= 2` |
| Length mismatch | Throws |
| Same input twice | Deep-equal output (FR-052) |
| Contradiction fixture (high similarity, low overlap) | Surfaced, with `lexicalOverlap` low — the case D-011 exists for |

Assertions use exact values. Tests construct normalized vectors directly rather than invoking the
model, keeping the domain testable without a worker (Principle III).
