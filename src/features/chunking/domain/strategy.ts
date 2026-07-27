export type FixedSize = { type: "fixed-size"; size: number };
export type FixedSizeOverlap = { type: "fixed-size-overlap"; size: number; overlap: number };
export type Paragraphs = { type: "paragraphs" };
export type Tokens = { type: "tokens"; size: number };

export type ChunkingStrategy = FixedSize | FixedSizeOverlap | Paragraphs | Tokens;

/** The three strategies that need no tokenizer. */
export type NonTokenStrategy = FixedSize | FixedSizeOverlap | Paragraphs;

type ValidationResult = { valid: true } | { valid: false; reason: string };

/** Rejects invalid parameters before any chunking occurs. */
export function validateStrategy(strategy: ChunkingStrategy): ValidationResult {
  switch (strategy.type) {
    case "fixed-size":
    case "tokens":
      if (strategy.size < 1) {
        return { valid: false, reason: "size must be at least 1" };
      }
      return { valid: true };

    case "fixed-size-overlap":
      if (strategy.size < 1) {
        return { valid: false, reason: "size must be at least 1" };
      }
      if (strategy.overlap < 0) {
        return { valid: false, reason: "overlap must not be negative" };
      }
      if (strategy.overlap >= strategy.size) {
        return { valid: false, reason: "overlap must be less than size" };
      }
      return { valid: true };

    case "paragraphs":
      return { valid: true };
  }
}
