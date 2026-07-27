import type { Chunk } from "./chunk";

// A paragraph break is a run of one or more blank lines. Interior matches
// mark a boundary; a match touching either end of the document is leading
// or trailing whitespace and gets absorbed into the paragraph next to it —
// this is what keeps chunks[0].start at 0 and the last chunk's end at
// content.length, without ever producing an empty chunk.
const PARAGRAPH_SEPARATOR = /\n[ \t]*\n[ \t\n]*/g;

export function chunkParagraphs(content: string): Chunk[] {
  if (content.trim().length === 0) return [];

  const starts = [0];
  for (const match of content.matchAll(PARAGRAPH_SEPARATOR)) {
    const boundary = match.index + match[0].length;
    if (match.index === 0 || boundary >= content.length) continue;
    starts.push(boundary);
  }

  return starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : content.length;
    return { index, start, end, text: content.slice(start, end), length: end - start };
  });
}
