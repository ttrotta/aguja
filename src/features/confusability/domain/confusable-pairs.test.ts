import { describe, expect, it } from "vitest";
import { findConfusablePairs } from "./confusable-pairs";
import type { Chunk } from "../../chunking/domain/chunk";
import type { Embedding } from "../../retrieval/domain/embedding";

function embeddingFor(vector: number[]): Embedding {
  return { vector: Float32Array.from(vector), truncated: false, tokenCount: 3, totalTokens: 3 };
}

function chunkFor(index: number, text: string): Chunk {
  return { index, start: 0, end: text.length, text, length: text.length };
}

describe("findConfusablePairs", () => {
  it("surfaces exactly the pair above threshold, with its exact similarity", () => {
    // chunk0=(1,0), chunk1=(0.5,0.75), chunk2=(0,1) — none normalized to
    // unit length, which cosineSimilarity's raw dot product doesn't
    // require. Values are diadic fractions (exact in float32).
    // sim(0,1)=0.5, sim(0,2)=0.0, sim(1,2)=0.75 — only (1,2) clears 0.7.
    const chunks = [chunkFor(0, "a"), chunkFor(1, "b"), chunkFor(2, "c")];
    const embeddings = [embeddingFor([1, 0]), embeddingFor([0.5, 0.75]), embeddingFor([0, 1])];

    const run = findConfusablePairs(chunks, embeddings, 0.7, 3);

    expect(run.pairs).toEqual([
      { firstChunkIndex: 1, secondChunkIndex: 2, similarity: 0.75, lexicalOverlap: 0 },
    ]);
    expect(run.chunksCompared).toBe(3);
    expect(run.chunksTotal).toBe(3);
  });

  it("includes a pair exactly at the threshold (inclusive boundary)", () => {
    const chunks = [chunkFor(0, "a"), chunkFor(1, "b")];
    const embeddings = [embeddingFor([1, 0]), embeddingFor([0.5, 0.75])];
    const run = findConfusablePairs(chunks, embeddings, 0.5, 2);
    expect(run.pairs).toHaveLength(1);
    expect(run.pairs[0].similarity).toBe(0.5);
  });

  it("breaks equal-similarity ties by ascending firstChunkIndex, then ascending secondChunkIndex", () => {
    // Three identical vectors -> all three pairs tie at similarity 1.
    const chunks = [chunkFor(0, "a"), chunkFor(1, "b"), chunkFor(2, "c")];
    const embeddings = [embeddingFor([1, 0]), embeddingFor([1, 0]), embeddingFor([1, 0])];
    const run = findConfusablePairs(chunks, embeddings, 0.5, 3);
    expect(run.pairs.map((p) => [p.firstChunkIndex, p.secondChunkIndex])).toEqual([
      [0, 1],
      [0, 2],
      [1, 2],
    ]);
  });

  it("reports a chunksTotal larger than what was actually compared, without touching which pairs are found", () => {
    // The caller is responsible for capping chunks/embeddings before calling
    // (bounding embedding cost, not just comparison) — this function just
    // compares what it's given and passes the true total through untouched.
    // chunk3 is deliberately left out of the input entirely: if it had been
    // included it would add no qualifying pairs anyway, so its absence here
    // confirms it was excluded, not merely uninteresting.
    const chunks = [chunkFor(0, "a"), chunkFor(1, "b"), chunkFor(2, "c")];
    const embeddings = [embeddingFor([1, 0]), embeddingFor([1, 0]), embeddingFor([1, 0])];
    const run = findConfusablePairs(chunks, embeddings, 0.5, 4);
    expect(run.chunksCompared).toBe(3);
    expect(run.chunksTotal).toBe(4);
    expect(run.pairs.some((p) => p.firstChunkIndex === 3 || p.secondChunkIndex === 3)).toBe(false);
  });

  it("returns no pairs for zero chunks, without throwing", () => {
    const run = findConfusablePairs([], [], 0.5, 0);
    expect(run.pairs).toEqual([]);
    expect(run.chunksTotal).toBe(0);
  });

  it("returns no pairs for one chunk, without throwing", () => {
    const run = findConfusablePairs([chunkFor(0, "a")], [embeddingFor([1, 0])], 0.5, 1);
    expect(run.pairs).toEqual([]);
    expect(run.chunksTotal).toBe(1);
  });

  it("returns no pairs when nothing meets the threshold, distinct from having too few chunks", () => {
    const chunks = [chunkFor(0, "a"), chunkFor(1, "b")];
    const embeddings = [embeddingFor([1, 0]), embeddingFor([0, 1])]; // orthogonal, sim 0
    const run = findConfusablePairs(chunks, embeddings, 0.5, 2);
    expect(run.pairs).toEqual([]);
    expect(run.chunksTotal).toBe(2);
  });

  it("throws when chunks and embeddings lengths mismatch", () => {
    const chunks = [chunkFor(0, "a"), chunkFor(1, "b")];
    const embeddings = [embeddingFor([1, 0]), embeddingFor([1, 0]), embeddingFor([1, 0])];
    expect(() => findConfusablePairs(chunks, embeddings, 0.5, 2)).toThrow();
  });

  it("is referentially transparent: identical inputs produce deep-equal output", () => {
    const chunks = [chunkFor(0, "a"), chunkFor(1, "b"), chunkFor(2, "c")];
    const embeddings = [embeddingFor([1, 0]), embeddingFor([0.6, 0.8]), embeddingFor([0, 1])];
    const first = findConfusablePairs(chunks, embeddings, 0.5, 3);
    const second = findConfusablePairs(chunks, embeddings, 0.5, 3);
    expect(second).toEqual(first);
  });

  it("surfaces a paraphrase-like pair (high similarity, low lexical overlap) honestly, without upgrading it to a duplicate label", () => {
    const chunks = [
      chunkFor(0, "we refund to the card you paid with within thirty days"),
      chunkFor(1, "your money returns to the original payment method inside 30 days"),
    ];
    const embeddings = [embeddingFor([1, 0]), embeddingFor([1, 0])];
    const run = findConfusablePairs(chunks, embeddings, 0.5, 2);
    expect(run.pairs[0].similarity).toBe(1);
    expect(run.pairs[0].lexicalOverlap).toBeCloseTo(3 / 19, 10);
  });

  it("surfaces a contradiction-like pair (high similarity, HIGH lexical overlap) with the same shape a true duplicate would have — the domain does not try to tell them apart (D-012)", () => {
    const chunks = [
      chunkFor(0, "the refund window is thirty days"),
      chunkFor(1, "the refund window is fourteen days"),
    ];
    const embeddings = [embeddingFor([1, 0]), embeddingFor([1, 0])];
    const run = findConfusablePairs(chunks, embeddings, 0.5, 2);
    expect(run.pairs[0].similarity).toBe(1);
    expect(run.pairs[0].lexicalOverlap).toBeCloseTo(5 / 7, 10);
  });
});
