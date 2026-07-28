# Phase 0 Research: RAG Tool Suite

**Date**: 2026-07-28 · **Feature**: [spec.md](./spec.md)

Two values in the specification were required to be measured rather than assumed: the similarity
threshold for surfacing chunk pairs (FR-047) and the cap on chunks compared (FR-049). Measuring
the first overturned the tool's design and produced [D-011](../../docs/decisions.md); measuring
the second overturned the performance risk recorded in D-010.

## Measurement method

All figures below come from `Xenova/all-MiniLM-L6-v2` at `dtype: "q8"`, with the same tokenizer
settings, mean pooling, and L2 normalization the application's worker uses
(`src/features/retrieval/embedding/embedder.worker.ts`), and the same dot-product cosine the
domain already implements (`src/features/retrieval/domain/similarity.ts`).

**One deviation, stated plainly.** The worker pins `device: "wasm"`; Node does not offer that
execution provider, so measurement ran on `cpu` against the same q8 model file. Both execute the
same quantized graph, and the differences at stake here are in the second decimal place while the
findings below turn on differences of 0.2 and more. The chosen threshold must still be confirmed
in-browser during implementation — see *Open items* at the end.

Figures are raw cosine on `[-1, 1]`. The interface displays `(score + 1) / 2` on `[0, 1]`, as v1
already does.

## Finding 1 — Cosine similarity does not mean duplication

### True duplicates score lower than expected

Adjacent chunks produced by the overlap strategy, over a synthetic support-policy document:

| Overlap | Adjacent-pair cosine |
|---|---|
| 75% (three quarters of characters shared) | 0.643, 0.699, 0.760, 0.666 |
| 50% | 0.291, 0.585, 0.727, 0.667 |
| 25% | 0.225, 0.545, 0.416 |

Paraphrases of a single fact: **0.7415** and **0.5673**.

### Contradictions score higher than any duplicate

| Pair | Cosine |
|---|---|
| "Free shipping applies to orders over $50." / "…over $100." | **0.9300** |
| "The API rate limit is 1000 requests per hour." / "…100 requests…" | **0.9567** |
| "Sessions expire after 24 hours of inactivity." / "…after 15 minutes…" | **0.9375** |
| "You must enable two-factor authentication." / "You must **not** enable…" | **0.9545** |
| "Data is retained for seven years." / "Data is deleted immediately…" | 0.5479 |

Negation is nearly invisible to this model: `must` and `must not` differ by 0.045.

### Structural similarity also outscores topical similarity

| Pair | Cosine |
|---|---|
| "This section describes how the system handles configuration." / "…authentication." | 0.5350 |
| "Step 3: click Save to persist your changes." / "Step 7: click Cancel to discard…" | 0.7692 |
| Same topic, different fact (refund method vs. return deadline) | 0.4980 |
| Same domain, unrelated fact | 0.1122 |
| Unrelated English | −0.0175 |

**Decision.** No threshold separates duplication from contradiction, because the bands invert:
every measured contradiction (0.93–0.96) outscores every measured true duplicate (≤0.76). The
tool reports *confusable chunks* — pairs the retriever cannot separate — and pairs cosine with
lexical overlap. Recorded as D-011. **Update (D-012, below): lexical overlap distinguishes
paraphrase from literal duplication, not contradiction from duplication — see "Lexical overlap:
what it actually separates" after the threshold default.**

**Rationale.** Calling a 0.95 pair "duplicated content" is false exactly where it matters most:
a corpus holding both "you must enable 2FA" and "you must not enable 2FA" has a severe retrieval
defect, and the original framing would have reported it as harmless repetition — the opposite of
Product Principle 2.

**Alternatives considered.** *Raise the threshold until only duplicates qualify*: impossible, the
bands invert. *Add a cross-encoder to re-score candidate pairs*: excluded by Principle V and by
D-010's second-model exclusion. *Drop the tool*: rejected, since the same computation is more
valuable under the honest framing than under the original one.

### Threshold default

Lexical overlap carries the duplication signal, so the cosine threshold only has to bound "worth
looking at". Setting it at raw **0.70** (displayed **0.85**) admits 75%-overlap duplicates
(0.643–0.760, most of the band), paraphrase (0.7415), and every contradiction (0.93+), while
excluding same-topic-different-fact (0.4980) and section boilerplate (0.5350). The gap between
the traps and the admitted band is roughly 0.2, so the exact value is not delicate.

### Lexical overlap: what it actually separates (D-012)

Before implementing `lexicalOverlap`, the same four sentence pairs above were checked with
token-set Jaccard, to confirm what D-011's "pairs cosine with lexical overlap" claim actually
buys:

| Pair | Jaccard |
|---|---|
| "you must enable 2FA" / "you must **not** enable 2FA" | 0.857 |
| "orders over $50" / "orders over $100" | 0.750 |
| "1000 requests per hour" / "100 requests per hour" | 0.800 |
| "we refund to the card you paid with…" / "refunds go back to your original payment method…" (paraphrase) | 0.100 |

Every contradiction scores *high*, not low — the sentences differ by one token, so nearly every
other word matches. Only the genuine paraphrase, which reuses almost none of the literal wording,
scores low. This inverts D-011's framing for exactly the case it was written to catch: a
single-word contradiction is structurally indistinguishable, on any whole-text overlap measure,
from a duplicate produced by chunk overlap. Character n-grams have the same problem for the same
structural reason — the fraction of the text that changed is small either way.

**Decision.** Lexical overlap reliably separates paraphrase from literal duplication (0.10 vs.
0.75–0.86 above); it does not reliably separate a one-word contradiction from a true duplicate.
`ConfusablePairs` shows each pair's own chunk text alongside both numbers, so the one case the
numbers cannot resolve is resolved by the reader, not by an automated label. spec.md's User Story
3, FR-044, and SC-019 are corrected accordingly. Full reasoning in D-012.

## Finding 2 — Pair comparison is not the bottleneck

Dot products over 384-dimension normalized vectors, single-threaded:

| Chunks | Pairs | Time |
|---|---|---|
| 500 | 124,750 | 72 ms |
| 1,000 | 499,500 | 272 ms |
| 2,000 | 1,999,000 | 1,069 ms |
| 3,000 | 4,498,500 | 2,450 ms |
| 5,000 | 12,497,500 | 6,798 ms |

**Decision.** The chunk cap exists to bound *embedding* work, not pair comparison. The comparison
is O(n²) but with a tiny constant; embedding 2,000 chunks through the model takes minutes, while
comparing all their pairs takes about a second.

**Rationale.** D-010 recorded the O(n²) comparison as the performance risk. Measured, that risk is
roughly three orders of magnitude smaller than the embedding step that necessarily precedes it.
Designing around the wrong bottleneck would have added complexity — streaming, chunked
comparison, progressive rendering of pairs — for no gain.

**Consequence for the cap**: it should be expressed in chunks and chosen against embedding
throughput on the target device. A cap in the low thousands leaves pair comparison comfortably
under 2 seconds, so the cap can be set by embedding cost alone.

## Finding 3 — Normalized vectors simplify the domain

The worker L2-normalizes every embedding, and `cosineSimilarity` already relies on this to reduce
cosine to a dot product. Both new analyses inherit it: no magnitude handling, no division, and
similarity is symmetric, so the pair comparison only needs the upper triangle — halving the work
in Finding 2's numbers, which were measured on the upper triangle already.

## Open items for implementation

1. **Confirm the threshold in-browser.** Measurement ran on the `cpu` provider; the application
   runs on `wasm`. Re-run two or three of the pairs above through the real worker and confirm they
   land in the same bands. If they diverge by more than ~0.02, the threshold is re-derived from the
   in-browser numbers and this document is updated.
2. **Choose the chunk cap against real embedding throughput**, measured in-browser on the target
   device, not from the pair-comparison figures above.
3. ~~Choose the lexical-overlap measure.~~ **Resolved during Phase 0**: token-set Jaccard,
   case-insensitive over alphanumeric tokens. See "Lexical overlap: what it actually separates"
   above and D-012 for what it does and does not distinguish.
