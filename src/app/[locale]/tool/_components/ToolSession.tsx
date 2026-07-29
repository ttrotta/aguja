"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import { useEmbedder } from "@/features/retrieval/embedding/useEmbedder";
import type { Embedding } from "@/features/retrieval/domain/embedding";
import {
  getDocumentContent,
  getEmbeddingCache,
  getServerDocumentContent,
  setDocumentContent as writeDocumentContent,
  subscribeToDocument,
} from "./sessionStore";

type Embedder = ReturnType<typeof useEmbedder>;

type ToolSessionValue = {
  documentContent: string;
  setDocumentContent: (next: string) => void;
  embedder: Embedder;
  /**
   * Returns one embedding per input text, computing only the texts not
   * already cached. Cache key is the exact chunk text — an exact match is
   * the only kind of hit, since a near-match would silently reuse the wrong
   * vector (FR-032).
   */
  getOrEmbedChunks: (texts: string[]) => Promise<Embedding[]>;
};

const ToolSessionContext = createContext<ToolSessionValue | null>(null);

/**
 * One embedder worker and one pasted document for the whole /tool suite,
 * for the lifetime of the page only — nothing here is ever persisted
 * (FR-030, FR-031, FR-033). Every tool reads this instead of owning its own
 * copy, which is what lets moving between tools cost nothing.
 *
 * The document and the embedding cache live in `sessionStore`, at module
 * scope, not in this component's state. A locale segment above this layout
 * remounts the provider on a language switch and would otherwise take the
 * pasted document with it (research.md Finding 1). The shape exposed below is
 * unchanged by that move, so no tool page had to be touched.
 */
export function ToolSessionProvider({ children }: { children: ReactNode }) {
  const documentContent = useSyncExternalStore(
    subscribeToDocument,
    getDocumentContent,
    getServerDocumentContent,
  );
  const embedder = useEmbedder();

  const setDocumentContent = useCallback((next: string) => {
    writeDocumentContent(next);
  }, []);

  const embed = embedder.embed;
  const getOrEmbedChunks = useCallback(
    async (texts: string[]): Promise<Embedding[]> => {
      const cache = getEmbeddingCache();
      const missing = new Set<string>();
      for (const text of texts) {
        if (!cache.has(text)) missing.add(text);
      }

      if (missing.size > 0) {
        const missingTexts = [...missing];
        const embeddings = await embed(missingTexts);
        missingTexts.forEach((text, i) => cache.set(text, embeddings[i]));
      }

      return texts.map((text) => {
        const embedding = cache.get(text);
        if (!embedding) {
          throw new Error(`Embedding for chunk text was not computed: "${text.slice(0, 40)}"`);
        }
        return embedding;
      });
    },
    [embed],
  );

  return (
    <ToolSessionContext.Provider
      value={{ documentContent, setDocumentContent, embedder, getOrEmbedChunks }}
    >
      {children}
    </ToolSessionContext.Provider>
  );
}

export function useToolSession(): ToolSessionValue {
  const value = useContext(ToolSessionContext);
  if (!value) {
    throw new Error("useToolSession must be used within a ToolSessionProvider");
  }
  return value;
}
