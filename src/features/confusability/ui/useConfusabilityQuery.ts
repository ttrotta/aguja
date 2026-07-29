"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useChunks } from "../../chunking/ui/useChunks";
import { type ChunkingStrategy } from "../../chunking/domain";
import { findConfusablePairs, type ConfusabilityRun } from "../domain/confusable-pairs";
import type { Embedding } from "../../retrieval/domain/embedding";
import type { useEmbedder } from "../../retrieval/embedding/useEmbedder";

type Embedder = ReturnType<typeof useEmbedder>;

// research.md's measured default (raw cosine; displayed as 0.85). Confirmed
// in-browser on the wasm provider — see research.md Open Item 1 / T025.
export const DEFAULT_THRESHOLD = 0.7;

// Bounds embedding work, not pair comparison (comparison itself is cheap —
// research.md Finding 2). Measured in-browser: throughput holds at ~5s up
// to ~900 chunks, then jumps sharply past a runtime threshold around
// ~950 — 800 sits comfortably under that cliff. See research.md
// "Real embedding throughput and the final cap (T026)".
export const CHUNK_CAP = 800;

type ConfusabilityState = {
  status: "idle" | "running" | "error";
  run: ConfusabilityRun | null;
  error: string | null;
};

const INITIAL_STATE: ConfusabilityState = { status: "idle", run: null, error: null };

/**
 * Confusable Chunks' own working state — strategy, chunks, threshold, and
 * the last comparison run. Chunks are derived per-tool, not shared session
 * state: only the document and the embedder are shared (data-model.md).
 */
export function useConfusabilityQuery(
  documentContent: string,
  embedder: Embedder,
  getOrEmbedChunks: (texts: string[]) => Promise<Embedding[]>,
) {
  const tConf = useTranslations("confusability");
  const [strategy, setStrategy] = useState<ChunkingStrategy>({ type: "fixed-size", size: 500 });
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [state, setState] = useState<ConfusabilityState>(INITIAL_STATE);

  const chunks = useChunks(documentContent, strategy, embedder.tokenizerReady, embedder.tokenize);

  const disabledReason =
    embedder.modelReady === "loading"
      ? tConf("downloadingModel")
      : embedder.modelReady === "failed"
        ? tConf("modelFailed")
        : chunks.length < 2
          ? tConf("notEnoughChunks")
          : undefined;

  function changeStrategy(next: ChunkingStrategy) {
    setStrategy(next);
    setState(INITIAL_STATE);
  }

  async function run(nextThreshold: number = threshold) {
    if (nextThreshold !== threshold) setThreshold(nextThreshold);
    setState({ status: "running", run: null, error: null });
    try {
      // Truncate before embedding, not after — the cap bounds embedding
      // cost, which is what's expensive (research.md Finding 2); comparing
      // pairs afterward is cheap regardless of count.
      const cappedChunks = chunks.slice(0, CHUNK_CAP);
      const texts = cappedChunks.map((c) => c.text.trim());
      const embeddings = await getOrEmbedChunks(texts);
      const result = findConfusablePairs(cappedChunks, embeddings, nextThreshold, chunks.length);
      setState({ status: "idle", run: result, error: null });
    } catch (error) {
      setState({
        status: "error",
        run: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    strategy,
    changeStrategy,
    chunks,
    threshold,
    setThreshold,
    state,
    disabledReason,
    run,
  };
}
