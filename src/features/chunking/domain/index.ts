import { chunkFixedSize } from "./fixed-size";
import { chunkFixedSizeOverlap } from "./fixed-size-overlap";
import { chunkParagraphs } from "./paragraphs";
import type { NonTokenStrategy } from "./strategy";
import type { Chunk } from "./chunk";

export type { Chunk, Segment } from "./chunk";
export type {
  ChunkingStrategy,
  FixedSize,
  FixedSizeOverlap,
  Paragraphs,
  Tokens,
  NonTokenStrategy,
} from "./strategy";
export { validateStrategy } from "./strategy";
export { toSegments } from "./segments";
export { chunkByTokens } from "./tokens";
export type { TokenSpan } from "./tokens";

/** Strategies needing no tokenizer. Total over valid input. */
export function chunk(content: string, strategy: NonTokenStrategy): Chunk[] {
  switch (strategy.type) {
    case "fixed-size":
      return chunkFixedSize(content, strategy.size);
    case "fixed-size-overlap":
      return chunkFixedSizeOverlap(content, strategy.size, strategy.overlap);
    case "paragraphs":
      return chunkParagraphs(content);
  }
}
