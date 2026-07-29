"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useChunks } from "../../chunking/ui/useChunks";
import { type ChunkingStrategy } from "../../chunking/domain";
import { rankChunks, type RankedResult } from "../domain";
import type { useEmbedder } from "../embedding/useEmbedder";

type QueryState = {
  status: "idle" | "running" | "error";
  query: string;
  results: RankedResult[];
  error: string | null;
};

const INITIAL_QUERY_STATE: QueryState = { status: "idle", query: "", results: [], error: null };

type Embedder = ReturnType<typeof useEmbedder>;

/**
 * Everything a single chunking strategy needs to go from "pick a strategy"
 * to "see a ranked query result": the live chunk list, the query text and
 * its submission, and the selected-chunk highlight shared with RankedResults.
 */
export function useSingleStrategyQuery(documentContent: string, embedder: Embedder) {
  const tDisabled = useTranslations("disabled");
  const tNotices = useTranslations("notices");
  const [strategy, setStrategy] = useState<ChunkingStrategy>({ type: "fixed-size", size: 500 });
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(null);
  const [queryText, setQueryText] = useState("");
  const [queryState, setQueryState] = useState<QueryState>(INITIAL_QUERY_STATE);

  const chunks = useChunks(documentContent, strategy, embedder.tokenizerReady, embedder.tokenize);

  const notice =
    strategy.type === "paragraphs" && chunks.length === 1
      ? tNotices("noBlankLines")
      : null;

  const disabledReason =
    embedder.modelReady === "loading"
      ? tDisabled("downloadingQuery")
      : embedder.modelReady === "failed"
        ? tDisabled("modelFailedQuery")
        : chunks.length === 0
          ? tDisabled("noChunksToSearch")
          : undefined;

  // A ranking only means what it says for the chunk set it was computed
  // against, so switching strategy clears both the selection and any
  // previous result rather than leaving them pointing at the wrong chunks.
  function changeStrategy(next: ChunkingStrategy) {
    setStrategy(next);
    setSelectedChunkIndex(null);
    setQueryState(INITIAL_QUERY_STATE);
  }

  function reset() {
    setSelectedChunkIndex(null);
    setQueryState(INITIAL_QUERY_STATE);
  }

  async function submitQuery(text: string) {
    setQueryState({ status: "running", query: text, results: [], error: null });
    try {
      // Trimmed here, at the embedding boundary, not inside the chunking
      // domain, where it would break the exact-reconstruction guarantee.
      const texts = [text, ...chunks.map((c) => c.text.trim())];
      const embeddings = await embedder.embed(texts);
      const [queryEmbedding, ...chunkEmbeddings] = embeddings;
      const results = rankChunks(queryEmbedding, chunkEmbeddings);
      setQueryState({ status: "idle", query: text, results, error: null });
    } catch (error) {
      setQueryState({
        status: "error",
        query: text,
        results: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    strategy,
    changeStrategy,
    chunks,
    notice,
    selectedChunkIndex,
    setSelectedChunkIndex,
    queryText,
    setQueryText,
    queryState,
    disabledReason,
    submitQuery,
    reset,
  };
}

export type SingleStrategyQuery = ReturnType<typeof useSingleStrategyQuery>;
