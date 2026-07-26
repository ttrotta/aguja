export const MAX_DOCUMENT_LENGTH = 50_000;

/** True when content is empty or entirely whitespace. */
export function isEmpty(content: string): boolean {
  return content.trim().length === 0;
}

type ValidationResult =
  | { valid: true }
  | { valid: false; reason: "too-long"; length: number; max: number };

/** Structural validation only. Never mutates or truncates the input. */
export function validateDocument(content: string): ValidationResult {
  if (content.length > MAX_DOCUMENT_LENGTH) {
    return {
      valid: false,
      reason: "too-long",
      length: content.length,
      max: MAX_DOCUMENT_LENGTH,
    };
  }
  return { valid: true };
}
