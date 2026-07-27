"use client";

import { useEffect, useMemo, useState } from "react";
import { chunk, chunkByTokens, validateStrategy, type Chunk, type ChunkingStrategy } from "../domain";
import type { TokenSpan } from "../domain/tokens";

type TokenizerReadiness = "idle" | "loading" | "ready" | "failed";

/**
 * Chunks content under a strategy, live. The three model-free strategies are
 * pure derived state (FR-011, FR-007); only "tokens" needs an effect, since
 * it awaits the worker. Shared by the single-strategy view and both sides of
 * the comparison view (US3) rather than duplicated per caller.
 */
export function useChunks(
  content: string,
  strategy: ChunkingStrategy,
  tokenizerReady: TokenizerReadiness,
  tokenize: (text: string) => Promise<TokenSpan[]>,
): Chunk[] {
  const [tokenChunks, setTokenChunks] = useState<Chunk[]>([]);

  const syncChunks = useMemo(() => {
    if (strategy.type === "tokens" || !validateStrategy(strategy).valid) return [];
    return chunk(content, strategy);
  }, [content, strategy]);

  useEffect(() => {
    if (strategy.type !== "tokens" || !validateStrategy(strategy).valid) return;
    if (tokenizerReady !== "ready") return;

    let cancelled = false;
    const size = strategy.size;
    tokenize(content).then((spans) => {
      if (!cancelled) setTokenChunks(chunkByTokens(content, spans, size));
    });
    return () => {
      cancelled = true;
    };
  }, [content, strategy, tokenizerReady, tokenize]);

  return strategy.type === "tokens" && tokenizerReady === "ready" && validateStrategy(strategy).valid
    ? tokenChunks
    : syncChunks;
}
