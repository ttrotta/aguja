import type { Embedding } from "@/features/retrieval/domain/embedding";

/**
 * The tool session, held at module scope rather than in React state.
 *
 * This is not a style preference. A locale segment sits above the tool layout,
 * so switching language changes a dynamic segment above the provider and
 * remounts it — measured, not assumed (research.md Finding 1). Anything in
 * `useState` or `useRef` is destroyed by that remount; module scope survives it,
 * which is what lets FR-056 promise the pasted document outlives a language
 * switch.
 *
 * Still page-lifetime only. A reload builds a fresh module context, so the
 * no-persistence decision (D-005) is untouched: this survives navigation, not
 * refreshes.
 */

let documentContent = "";
const subscribers = new Set<() => void>();

// One Map for the lifetime of the page, cleared in place rather than replaced,
// so nothing can hold a reference to a cache that is no longer the cache.
const embeddingCache = new Map<string, Embedding>();

export function subscribeToDocument(onStoreChange: () => void): () => void {
  subscribers.add(onStoreChange);
  return () => {
    subscribers.delete(onStoreChange);
  };
}

export function getDocumentContent(): string {
  return documentContent;
}

/**
 * Always "" on the server. The document only ever exists because someone pasted
 * it into this browser, so there is nothing to hydrate from.
 */
export function getServerDocumentContent(): string {
  return "";
}

export function setDocumentContent(next: string): void {
  if (next === documentContent) return;
  documentContent = next;

  // A new document invalidates every cached embedding. Chunk text from the old
  // document can never be requested again, and keeping it would let a stale
  // vector answer for text that happens to match — the exact-text cache key
  // exists to prevent precisely that (FR-032).
  embeddingCache.clear();

  for (const notify of subscribers) notify();
}

export function getEmbeddingCache(): Map<string, Embedding> {
  return embeddingCache;
}
