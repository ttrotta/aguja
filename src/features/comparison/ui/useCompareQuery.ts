"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useChunks } from "../../chunking/ui/useChunks";
import { type ChunkingStrategy } from "../../chunking/domain";
import { rankChunks, type RankedResult } from "../../retrieval/domain";
import type { useEmbedder } from "../../retrieval/embedding/useEmbedder";

type CompareState = {
  status: "idle" | "running" | "error";
  leftResults: RankedResult[];
  rightResults: RankedResult[];
  error: string | null;
};

const INITIAL_COMPARE_STATE: CompareState = {
  status: "idle",
  leftResults: [],
  rightResults: [],
  error: null,
};

type Embedder = ReturnType<typeof useEmbedder>;

/**
 * The comparison-mode counterpart to useSingleStrategyQuery: two independent
 * strategies over the same document, ranked against the same query in one
 * embed() batch so both sides score off an identical query embedding.
 */
export function useCompareQuery(documentContent: string, embedder: Embedder) {
  const tDisabled = useTranslations("disabled");
  const [leftStrategy, setLeftStrategy] = useState<ChunkingStrategy>({
    type: "fixed-size",
    size: 500,
  });
  const [rightStrategy, setRightStrategy] = useState<ChunkingStrategy>({ type: "paragraphs" });
  const [queryText, setQueryText] = useState("");
  const [compareState, setCompareState] = useState<CompareState>(INITIAL_COMPARE_STATE);

  const leftChunks = useChunks(documentContent, leftStrategy, embedder.tokenizerReady, embedder.tokenize);
  const rightChunks = useChunks(
    documentContent,
    rightStrategy,
    embedder.tokenizerReady,
    embedder.tokenize,
  );

  const chunkCount = Math.min(leftChunks.length, rightChunks.length);
  const disabledReason =
    embedder.modelReady === "loading"
      ? tDisabled("downloadingQuery")
      : embedder.modelReady === "failed"
        ? tDisabled("modelFailedQuery")
        : chunkCount === 0
          ? tDisabled("noChunksToSearch")
          : undefined;

  function changeLeftStrategy(next: ChunkingStrategy) {
    setLeftStrategy(next);
    setCompareState(INITIAL_COMPARE_STATE);
  }

  function changeRightStrategy(next: ChunkingStrategy) {
    setRightStrategy(next);
    setCompareState(INITIAL_COMPARE_STATE);
  }

  function reset() {
    setCompareState(INITIAL_COMPARE_STATE);
  }

  async function submitQuery(text: string) {
    setCompareState({ status: "running", leftResults: [], rightResults: [], error: null });
    try {
      const leftTexts = leftChunks.map((c) => c.text.trim());
      const rightTexts = rightChunks.map((c) => c.text.trim());
      const embeddings = await embedder.embed([text, ...leftTexts, ...rightTexts]);
      const [queryEmbedding, ...rest] = embeddings;
      const leftEmbeddings = rest.slice(0, leftTexts.length);
      const rightEmbeddings = rest.slice(leftTexts.length);
      setCompareState({
        status: "idle",
        leftResults: rankChunks(queryEmbedding, leftEmbeddings),
        rightResults: rankChunks(queryEmbedding, rightEmbeddings),
        error: null,
      });
    } catch (error) {
      setCompareState({
        status: "error",
        leftResults: [],
        rightResults: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    leftStrategy,
    rightStrategy,
    changeLeftStrategy,
    changeRightStrategy,
    leftChunks,
    rightChunks,
    chunkCount,
    queryText,
    setQueryText,
    compareState,
    disabledReason,
    submitQuery,
    reset,
  };
}

export type CompareQuery = ReturnType<typeof useCompareQuery>;
