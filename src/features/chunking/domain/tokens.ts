import type { Chunk } from "./chunk";

/** A token's character span in the source content, produced by the worker (R-004). */
export type TokenSpan = { start: number; end: number };

/**
 * Token strategy. Takes token boundaries as plain data so the domain never
 * touches a tokenizer (R-004).
 */
export function chunkByTokens(content: string, tokenSpans: TokenSpan[], size: number): Chunk[] {
  const chunks: Chunk[] = [];
  let index = 0;
  for (let i = 0; i < tokenSpans.length; i += size) {
    const group = tokenSpans.slice(i, i + size);
    const start = group[0].start;
    const end = group[group.length - 1].end;
    chunks.push({ index, start, end, text: content.slice(start, end), length: end - start });
    index += 1;
  }
  return chunks;
}
