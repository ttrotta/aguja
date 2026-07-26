"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentInput } from "@/features/documents/ui/DocumentInput";
import { isEmpty } from "@/features/documents/domain/document";
import { StrategyControls } from "@/features/chunking/ui/StrategyControls";
import { ChunkedDocument } from "@/features/chunking/ui/ChunkedDocument";
import {
  chunk,
  chunkByTokens,
  validateStrategy,
  type Chunk,
  type ChunkingStrategy,
} from "@/features/chunking/domain";
import { useEmbedder } from "@/features/retrieval/embedding/useEmbedder";
import { LoadProgress } from "@/features/retrieval/ui/LoadProgress";

export default function Home() {
  // Session-scoped only (D-005) — nothing here is persisted across a reload.
  const [documentContent, setDocumentContent] = useState("");
  const [strategy, setStrategy] = useState<ChunkingStrategy>({ type: "fixed-size", size: 500 });
  const [tokenChunks, setTokenChunks] = useState<Chunk[]>([]);

  const { tokenizerReady, tokenizerProgress, tokenizerError, tokenize } = useEmbedder();

  // The three model-free strategies are pure derived state (FR-011, FR-007).
  // Only the tokens strategy needs an effect below, because it awaits the
  // worker — everything else recomputes synchronously on every keystroke.
  const syncChunks = useMemo(() => {
    if (strategy.type === "tokens" || !validateStrategy(strategy).valid) return [];
    return chunk(documentContent, strategy);
  }, [documentContent, strategy]);

  useEffect(() => {
    if (strategy.type !== "tokens" || !validateStrategy(strategy).valid) return;
    if (tokenizerReady !== "ready") return;

    let cancelled = false;
    const size = strategy.size;
    tokenize(documentContent).then((spans) => {
      if (!cancelled) setTokenChunks(chunkByTokens(documentContent, spans, size));
    });
    return () => {
      cancelled = true;
    };
  }, [documentContent, strategy, tokenizerReady, tokenize]);

  const chunks =
    strategy.type === "tokens" && tokenizerReady === "ready" && validateStrategy(strategy).valid
      ? tokenChunks
      : syncChunks;

  // Acceptance scenario 4 (spec.md): a document with no blank lines under
  // "paragraphs" must explain itself, not just render one silent chunk.
  const paragraphNotice =
    strategy.type === "paragraphs" && chunks.length === 1
      ? "No blank lines found — the whole document is treated as one paragraph."
      : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Aguja</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Paste a document, see how it gets chunked, then find out which chunks a query actually
          retrieves.
        </p>
      </header>
      <DocumentInput value={documentContent} onChange={setDocumentContent} />
      {!isEmpty(documentContent) && (
        <>
          <StrategyControls
            strategy={strategy}
            onChange={setStrategy}
            tokenizerReady={tokenizerReady === "ready"}
          />
          <LoadProgress
            label="tokenizer"
            state={tokenizerReady}
            progress={tokenizerProgress}
            error={tokenizerError}
            fallbackNote="Fixed-size, fixed-size-overlap, and paragraph chunking still work without it."
          />
          <ChunkedDocument content={documentContent} chunks={chunks} notice={paragraphNotice} />
        </>
      )}
    </main>
  );
}
