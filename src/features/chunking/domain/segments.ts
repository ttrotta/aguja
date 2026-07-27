import type { Chunk, Segment } from "./chunk";

/** Collapses a chunk list into non-overlapping renderable segments. */
export function toSegments(chunks: Chunk[], contentLength: number): Segment[] {
  if (chunks.length === 0) return [];

  const boundaries = new Set<number>([0, contentLength]);
  for (const c of chunks) {
    boundaries.add(c.start);
    boundaries.add(c.end);
  }
  const sorted = [...boundaries].sort((a, b) => a - b);

  const segments: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start >= end) continue;

    const chunkIndices = chunks
      .filter((c) => c.start <= start && c.end >= end)
      .map((c) => c.index)
      .sort((a, b) => a - b);
    if (chunkIndices.length === 0) continue;

    segments.push({ start, end, chunkIndices });
  }
  return segments;
}
