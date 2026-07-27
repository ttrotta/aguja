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
import { QueryInput } from "@/features/retrieval/ui/QueryInput";
import { RankedResults } from "@/features/retrieval/ui/RankedResults";
import { rankChunks, type RankedResult } from "@/features/retrieval/domain";

type QueryState = {
  status: "idle" | "running" | "error";
  query: string;
  results: RankedResult[];
  error: string | null;
};

const INITIAL_QUERY_STATE: QueryState = { status: "idle", query: "", results: [], error: null };

export default function Home() {
  // Session-scoped only (D-005) — nothing here is persisted across a reload.
  const [documentContent, setDocumentContent] = useState("");
  const [strategy, setStrategy] = useState<ChunkingStrategy>({ type: "fixed-size", size: 500 });
  const [tokenChunks, setTokenChunks] = useState<Chunk[]>([]);
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(null);
  const [queryText, setQueryText] = useState("");
  const [queryState, setQueryState] = useState<QueryState>(INITIAL_QUERY_STATE);

  const {
    tokenizerReady,
    tokenizerProgress,
    tokenizerError,
    tokenize,
    modelReady,
    modelProgress,
    modelError,
    embed,
  } = useEmbedder();

  // A ranking only means what it says for the chunk set it was computed
  // against — pasting new text or switching strategy invalidates it, so it
  // is cleared here (an event handler, not an effect) rather than left to
  // silently describe the wrong chunks (FR-018 depends on chunk indices
  // still lining up with what rankChunks saw).
  function handleDocumentChange(next: string) {
    setDocumentContent(next);
    setSelectedChunkIndex(null);
    setQueryState(INITIAL_QUERY_STATE);
  }

  function handleStrategyChange(next: ChunkingStrategy) {
    setStrategy(next);
    setSelectedChunkIndex(null);
    setQueryState(INITIAL_QUERY_STATE);
  }

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

  const queryDisabledReason =
    modelReady === "loading"
      ? "Downloading the model — querying isn't available yet."
      : modelReady === "failed"
        ? "Model failed to load, so querying is unavailable."
        : chunks.length === 0
          ? "No chunks to search yet."
          : undefined;

  // Runs entirely inside a user-triggered event handler, never inside an
  // effect — the intermediate setState calls (running → done/error) are
  // exactly the async pattern the tokens-strategy effect above had to avoid
  // doing synchronously, but here there is no effect at all to violate.
  async function handleQuerySubmit(text: string) {
    setQueryState({ status: "running", query: text, results: [], error: null });
    try {
      // Trimmed here, at the embedding boundary — not in the chunking domain,
      // where it would break the exact-reconstruction guarantee (R-005).
      const texts = [text, ...chunks.map((c) => c.text.trim())];
      const embeddings = await embed(texts);
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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Aguja</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Paste a document, see how it gets chunked, then find out which chunks a query actually
          retrieves.
        </p>
      </header>
      <DocumentInput value={documentContent} onChange={handleDocumentChange} />
      {!isEmpty(documentContent) && (
        <>
          <StrategyControls
            strategy={strategy}
            onChange={handleStrategyChange}
            tokenizerReady={tokenizerReady === "ready"}
          />
          <LoadProgress
            label="tokenizer"
            state={tokenizerReady}
            progress={tokenizerProgress}
            error={tokenizerError}
            fallbackNote="Fixed-size, fixed-size-overlap, and paragraph chunking still work without it."
          />
          <ChunkedDocument
            content={documentContent}
            chunks={chunks}
            notice={paragraphNotice}
            selectedIndex={selectedChunkIndex}
            onSelectIndex={setSelectedChunkIndex}
          />
          <LoadProgress
            label="model"
            state={modelReady}
            progress={modelProgress}
            error={modelError}
            fallbackNote="Chunk visualization above still works without it; only querying is unavailable."
          />
          <QueryInput
            value={queryText}
            onChange={setQueryText}
            onSubmit={handleQuerySubmit}
            disabled={modelReady !== "ready" || chunks.length === 0}
            disabledReason={queryDisabledReason}
          />
          {queryState.status === "error" && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              Query failed: {queryState.error}
            </p>
          )}
          <RankedResults
            results={queryState.results}
            chunks={chunks}
            selectedIndex={selectedChunkIndex}
            onSelectIndex={setSelectedChunkIndex}
          />
        </>
      )}
    </main>
  );
}
