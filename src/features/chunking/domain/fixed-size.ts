import type { Chunk } from "./chunk";

export function chunkFixedSize(content: string, size: number): Chunk[] {
  if (content.trim().length === 0) return [];

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;
  while (start < content.length) {
    const end = Math.min(start + size, content.length);
    chunks.push({ index, start, end, text: content.slice(start, end), length: end - start });
    start = end;
    index += 1;
  }
  return chunks;
}
