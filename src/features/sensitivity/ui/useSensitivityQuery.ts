"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useChunks } from "../../chunking/ui/useChunks";
import { type ChunkingStrategy } from "../../chunking/domain";
import { rankAcrossPhrasings, type ChunkRankProfile } from "../domain/rank-profile";
import type { Embedding } from "../../retrieval/domain/embedding";
import type { useEmbedder } from "../../retrieval/embedding/useEmbedder";

type Embedder = ReturnType<typeof useEmbedder>;

type SensitivityState = {
  status: "idle" | "running" | "error";
  profiles: ChunkRankProfile[];
  phrasingCount: number;
  error: string | null;
};

const INITIAL_STATE: SensitivityState = {
  status: "idle",
  profiles: [],
  phrasingCount: 0,
  error: null,
};

/**
 * Query Sensitivity's own working state — strategy, chunks, phrasings, and
 * the last comparison run. Chunks are derived per-tool, not shared session
 * state: only the document and the embedder are shared (data-model.md).
 */
export function useSensitivityQuery(
  documentContent: string,
  embedder: Embedder,
  getOrEmbedChunks: (texts: string[]) => Promise<Embedding[]>,
) {
  const tDisabled = useTranslations("disabled");
  const [strategy, setStrategy] = useState<ChunkingStrategy>({ type: "fixed-size", size: 500 });
  const [phrasings, setPhrasings] = useState<string[]>(["", ""]);
  const [state, setState] = useState<SensitivityState>(INITIAL_STATE);

  const chunks = useChunks(documentContent, strategy, embedder.tokenizerReady, embedder.tokenize);

  const disabledReason =
    embedder.modelReady === "loading"
      ? tDisabled("downloadingPhrasings")
      : embedder.modelReady === "failed"
        ? tDisabled("modelFailedPhrasings")
        : chunks.length === 0
          ? tDisabled("noChunksToCompare")
          : undefined;

  function changeStrategy(next: ChunkingStrategy) {
    setStrategy(next);
    setState(INITIAL_STATE);
  }

  function reset() {
    setState(INITIAL_STATE);
  }

  async function submitPhrasings(nonBlankPhrasings: string[]) {
    setState({
      status: "running",
      profiles: [],
      phrasingCount: nonBlankPhrasings.length,
      error: null,
    });
    try {
      // Trimmed here, at the embedding boundary, not inside the chunking
      // domain, mirroring useSingleStrategyQuery.
      const [phrasingEmbeddings, chunkEmbeddings] = await Promise.all([
        embedder.embed(nonBlankPhrasings),
        getOrEmbedChunks(chunks.map((c) => c.text.trim())),
      ]);
      const profiles = rankAcrossPhrasings(phrasingEmbeddings, chunkEmbeddings);
      setState({ status: "idle", profiles, phrasingCount: nonBlankPhrasings.length, error: null });
    } catch (error) {
      setState({
        status: "error",
        profiles: [],
        phrasingCount: nonBlankPhrasings.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    strategy,
    changeStrategy,
    chunks,
    phrasings,
    setPhrasings,
    state,
    disabledReason,
    submitPhrasings,
    reset,
  };
}
