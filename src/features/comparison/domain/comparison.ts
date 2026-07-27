import type { Chunk } from "../../chunking/domain/chunk";
import type { ChunkingStrategy } from "../../chunking/domain/strategy";
import type { RankedResult } from "../../retrieval/domain/ranking";

// Exactly two named sides, not a list — a list would make a third
// representable, which FR-022 forbids offering (data-model.md "Comparison").
export type Comparison = {
  left: ChunkingStrategy;
  right: ChunkingStrategy;
  leftResults: RankedResult[];
  rightResults: RankedResult[];
};

export function makeComparison(
  left: ChunkingStrategy,
  leftResults: RankedResult[],
  right: ChunkingStrategy,
  rightResults: RankedResult[],
): Comparison {
  return { left, right, leftResults, rightResults };
}

/**
 * The two sides chunk the same document differently, so a single character
 * offset can land in a different chunk — and therefore a different ranked
 * result — on each side (FR-023). Resolved independently per side.
 */
export function resultAtOffset(
  chunks: readonly Chunk[],
  results: readonly RankedResult[],
  offset: number,
): RankedResult | null {
  const chunk = chunks.find((c) => offset >= c.start && offset < c.end);
  if (!chunk) return null;
  return results.find((r) => r.chunkIndex === chunk.index) ?? null;
}
