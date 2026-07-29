export type FixedSize = { type: "fixed-size"; size: number };
export type FixedSizeOverlap = { type: "fixed-size-overlap"; size: number; overlap: number };
export type Paragraphs = { type: "paragraphs" };
export type Tokens = { type: "tokens"; size: number };

export type ChunkingStrategy = FixedSize | FixedSizeOverlap | Paragraphs | Tokens;

/** The three strategies that need no tokenizer. */
export type NonTokenStrategy = FixedSize | FixedSizeOverlap | Paragraphs;

/**
 * A code, not a sentence. The domain names which constraint was violated and
 * the interface decides how to say it — otherwise this file would be the one
 * place a visible string exists in only one language, which is both a
 * localisation bug (FR-059) and a framework-free-domain smell. `validateDocument`
 * already worked this way; this brings strategy validation into line.
 */
export type StrategyValidationReason =
  | "size-too-small"
  | "overlap-negative"
  | "overlap-not-less-than-size";

type ValidationResult = { valid: true } | { valid: false; reason: StrategyValidationReason };

/** Rejects invalid parameters before any chunking occurs. */
export function validateStrategy(strategy: ChunkingStrategy): ValidationResult {
  switch (strategy.type) {
    case "fixed-size":
    case "tokens":
      if (strategy.size < 1) {
        return { valid: false, reason: "size-too-small" };
      }
      return { valid: true };

    case "fixed-size-overlap":
      if (strategy.size < 1) {
        return { valid: false, reason: "size-too-small" };
      }
      if (strategy.overlap < 0) {
        return { valid: false, reason: "overlap-negative" };
      }
      if (strategy.overlap >= strategy.size) {
        return { valid: false, reason: "overlap-not-less-than-size" };
      }
      return { valid: true };

    case "paragraphs":
      return { valid: true };
  }
}
