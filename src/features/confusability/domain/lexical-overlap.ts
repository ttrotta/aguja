// Token-set Jaccard, chosen over character n-grams for the same result at
// less code: split on runs of letters/digits, lowercase, compare as sets.
//
// What this measure can and cannot tell apart (D-012, measured against real
// sentence pairs): it reliably separates a paraphrase of one fact (little
// shared wording despite high similarity) from a literal duplicate (most
// wording shared). It does NOT reliably separate a literal duplicate from a
// one-word contradiction — "you must enable 2FA" vs. "you must not enable
// 2FA" differ by one token, so nearly every other word still matches, and
// both cases score high here. Resolving that case is left to the reader,
// who sees the pair's own text alongside this number — see
// ConfusablePairs.tsx and contracts/confusability.md.
function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

export function lexicalOverlap(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionSize = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersectionSize++;
  }
  const unionSize = tokensA.size + tokensB.size - intersectionSize;
  return intersectionSize / unionSize;
}
