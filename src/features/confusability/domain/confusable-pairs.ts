import { cosineSimilarity } from "../../retrieval/domain/similarity";
import { lexicalOverlap } from "./lexical-overlap";
import type { Chunk } from "../../chunking/domain/chunk";
import type { Embedding } from "../../retrieval/domain/embedding";

export type ConfusablePair = {
  firstChunkIndex: number;
  secondChunkIndex: number;
  similarity: number;
  lexicalOverlap: number;
};

export type ConfusabilityRun = {
  pairs: ConfusablePair[];
  chunksCompared: number;
  chunksTotal: number;
};

/**
 * Compares every chunk pair in `chunks` and surfaces those at or above
 * threshold — pairs the retriever cannot separate, not "duplicates". The
 * function never labels a pair; it reports similarity and lexical overlap
 * and lets the caller show both alongside the pair's own text, since
 * neither number alone (nor the two together) reliably tells a duplicate
 * from a one-word contradiction (D-011, D-012).
 *
 * `chunks`/`embeddings` are already the capped set — the caller truncates
 * before embedding, since the cap exists to bound embedding cost, not
 * comparison cost (research.md Finding 2). `chunksTotal` is the document's
 * real chunk count, passed through only for the "compared X of Y" notice.
 */
export function findConfusablePairs(
  chunks: readonly Chunk[],
  embeddings: readonly Embedding[],
  threshold: number,
  chunksTotal: number,
): ConfusabilityRun {
  if (chunks.length !== embeddings.length) {
    throw new Error(
      `chunks and embeddings must have the same length: ${chunks.length} vs ${embeddings.length}.`,
    );
  }

  const chunksCompared = chunks.length;

  const pairs: ConfusablePair[] = [];
  // Vectors are L2-normalized (the worker's guarantee), so cosine is
  // symmetric — only the upper triangle needs computing.
  for (let i = 0; i < chunksCompared; i++) {
    for (let j = i + 1; j < chunksCompared; j++) {
      const similarity = cosineSimilarity(embeddings[i].vector, embeddings[j].vector);
      if (similarity >= threshold) {
        pairs.push({
          firstChunkIndex: i,
          secondChunkIndex: j,
          similarity,
          lexicalOverlap: lexicalOverlap(chunks[i].text, chunks[j].text),
        });
      }
    }
  }

  pairs.sort(
    (a, b) =>
      b.similarity - a.similarity ||
      a.firstChunkIndex - b.firstChunkIndex ||
      a.secondChunkIndex - b.secondChunkIndex,
  );

  return { pairs, chunksCompared, chunksTotal };
}
