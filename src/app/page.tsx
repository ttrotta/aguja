"use client";

import { useState } from "react";
import { DocumentInput } from "@/features/documents/ui/DocumentInput";
import { isEmpty } from "@/features/documents/domain/document";
import { StrategyControls } from "@/features/chunking/ui/StrategyControls";
import { ChunkedDocument } from "@/features/chunking/ui/ChunkedDocument";
import { useChunks } from "@/features/chunking/ui/useChunks";
import { type ChunkingStrategy } from "@/features/chunking/domain";
import { useEmbedder } from "@/features/retrieval/embedding/useEmbedder";
import { LoadProgress } from "@/features/retrieval/ui/LoadProgress";
import { QueryInput } from "@/features/retrieval/ui/QueryInput";
import { RankedResults } from "@/features/retrieval/ui/RankedResults";
import { rankChunks, type RankedResult } from "@/features/retrieval/domain";
import { ComparisonView } from "@/features/comparison/ui/ComparisonView";
import { SummaryImage } from "@/features/sharing/ui/SummaryImage";

type QueryState = {
  status: "idle" | "running" | "error";
  query: string;
  results: RankedResult[];
  error: string | null;
};

type CompareQueryState = {
  status: "idle" | "running" | "error";
  leftResults: RankedResult[];
  rightResults: RankedResult[];
  error: string | null;
};

const INITIAL_QUERY_STATE: QueryState = { status: "idle", query: "", results: [], error: null };
const INITIAL_COMPARE_STATE: CompareQueryState = {
  status: "idle",
  leftResults: [],
  rightResults: [],
  error: null,
};

export default function Home() {
  // Session-scoped only (D-005) — nothing here is persisted across a reload.
  const [documentContent, setDocumentContent] = useState("");
  const [strategy, setStrategy] = useState<ChunkingStrategy>({ type: "fixed-size", size: 500 });
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(null);
  const [queryText, setQueryText] = useState("");
  const [queryState, setQueryState] = useState<QueryState>(INITIAL_QUERY_STATE);

  // US3 (P3): comparing exactly two strategies. Two fixed slots, not a list —
  // there is structurally no control anywhere below that could add a third
  // (FR-022).
  const [compareMode, setCompareMode] = useState(false);
  const [leftStrategy, setLeftStrategy] = useState<ChunkingStrategy>({
    type: "fixed-size",
    size: 500,
  });
  const [rightStrategy, setRightStrategy] = useState<ChunkingStrategy>({ type: "paragraphs" });
  const [compareState, setCompareState] = useState<CompareQueryState>(INITIAL_COMPARE_STATE);

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
    setCompareState(INITIAL_COMPARE_STATE);
  }

  function handleStrategyChange(next: ChunkingStrategy) {
    setStrategy(next);
    setSelectedChunkIndex(null);
    setQueryState(INITIAL_QUERY_STATE);
  }

  function handleLeftStrategyChange(next: ChunkingStrategy) {
    setLeftStrategy(next);
    setCompareState(INITIAL_COMPARE_STATE);
  }

  function handleRightStrategyChange(next: ChunkingStrategy) {
    setRightStrategy(next);
    setCompareState(INITIAL_COMPARE_STATE);
  }

  const chunks = useChunks(documentContent, strategy, tokenizerReady, tokenize);
  const leftChunks = useChunks(documentContent, leftStrategy, tokenizerReady, tokenize);
  const rightChunks = useChunks(documentContent, rightStrategy, tokenizerReady, tokenize);

  // Acceptance scenario 4 (spec.md): a document with no blank lines under
  // "paragraphs" must explain itself, not just render one silent chunk.
  const paragraphNotice =
    strategy.type === "paragraphs" && chunks.length === 1
      ? "No blank lines found — the whole document is treated as one paragraph."
      : null;

  const activeChunkCount = compareMode
    ? Math.min(leftChunks.length, rightChunks.length)
    : chunks.length;

  const queryDisabledReason =
    modelReady === "loading"
      ? "Downloading the model — querying isn't available yet."
      : modelReady === "failed"
        ? "Model failed to load, so querying is unavailable."
        : activeChunkCount === 0
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

  // Same document, same query, scored under both strategies at once — one
  // embed() batch covers the query plus every chunk from both sides, then
  // each side is ranked independently against its own slice (FR-022).
  async function handleCompareQuerySubmit(text: string) {
    setCompareState({ status: "running", leftResults: [], rightResults: [], error: null });
    try {
      const leftTexts = leftChunks.map((c) => c.text.trim());
      const rightTexts = rightChunks.map((c) => c.text.trim());
      const embeddings = await embed([text, ...leftTexts, ...rightTexts]);
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

  const activeQueryState = compareMode ? compareState : queryState;

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
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(event) => setCompareMode(event.target.checked)}
            />
            Compare two strategies
          </label>

          {compareMode ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <StrategyControls
                strategy={leftStrategy}
                onChange={handleLeftStrategyChange}
                tokenizerReady={tokenizerReady === "ready"}
              />
              <StrategyControls
                strategy={rightStrategy}
                onChange={handleRightStrategyChange}
                tokenizerReady={tokenizerReady === "ready"}
              />
            </div>
          ) : (
            <StrategyControls
              strategy={strategy}
              onChange={handleStrategyChange}
              tokenizerReady={tokenizerReady === "ready"}
            />
          )}

          <LoadProgress
            label="tokenizer"
            state={tokenizerReady}
            progress={tokenizerProgress}
            error={tokenizerError}
            fallbackNote="Fixed-size, fixed-size-overlap, and paragraph chunking still work without it."
          />

          {!compareMode && (
            <ChunkedDocument
              content={documentContent}
              chunks={chunks}
              notice={paragraphNotice}
              selectedIndex={selectedChunkIndex}
              onSelectIndex={setSelectedChunkIndex}
            />
          )}

          <LoadProgress
            label="model"
            state={modelReady}
            progress={modelProgress}
            error={modelError}
            fallbackNote="Chunk visualization above still works without it; only querying is unavailable."
          />
          {/* D-006/FR-026: non-English text is not blocked, but its scores are not
              trustworthy — the model was picked for a small download, not language
              coverage, and that trade-off has to be said outright, not discovered. */}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The embedding model is English-only. Scores for non-English text are not meaningful.
          </p>
          <QueryInput
            value={queryText}
            onChange={setQueryText}
            onSubmit={compareMode ? handleCompareQuerySubmit : handleQuerySubmit}
            disabled={modelReady !== "ready" || activeChunkCount === 0}
            disabledReason={queryDisabledReason}
          />
          {activeQueryState.status === "error" && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              Query failed: {activeQueryState.error}
            </p>
          )}

          {compareMode ? (
            <ComparisonView
              content={documentContent}
              left={{ strategy: leftStrategy, chunks: leftChunks, results: compareState.leftResults }}
              right={{
                strategy: rightStrategy,
                chunks: rightChunks,
                results: compareState.rightResults,
              }}
            />
          ) : (
            <>
              <RankedResults
                results={queryState.results}
                chunks={chunks}
                selectedIndex={selectedChunkIndex}
                onSelectIndex={setSelectedChunkIndex}
              />
              {queryState.status === "idle" && queryState.results.length > 0 && (
                <SummaryImage
                  strategy={strategy}
                  query={queryState.query}
                  chunks={chunks}
                  results={queryState.results}
                />
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
