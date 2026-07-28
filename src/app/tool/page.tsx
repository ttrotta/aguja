"use client";

import { useState } from "react";
import { Navbar } from "../_components/Navbar";
import { DocumentInput } from "@/features/documents/ui/DocumentInput";
import { isEmpty } from "@/features/documents/domain/document";
import { ChunkedDocument } from "@/features/chunking/ui/ChunkedDocument";
import { StrategyControls } from "@/features/chunking/ui/StrategyControls";
import { ModelStatus } from "@/features/retrieval/ui/ModelStatus";
import { QueryInput } from "@/features/retrieval/ui/QueryInput";
import { QueryError } from "@/features/retrieval/ui/QueryError";
import { RankedResults } from "@/features/retrieval/ui/RankedResults";
import { SummaryImage } from "@/features/sharing/ui/SummaryImage";
import { ComparisonView } from "@/features/comparison/ui/ComparisonView";
import { useEmbedder } from "@/features/retrieval/embedding/useEmbedder";
import { useSingleStrategyQuery } from "@/features/retrieval/ui/useSingleStrategyQuery";
import { useCompareQuery } from "@/features/comparison/ui/useCompareQuery";

export default function ToolPage() {
  // Session-scoped only — nothing here is persisted across a reload.
  const [documentContent, setDocumentContent] = useState("");
  const [compareMode, setCompareMode] = useState(false);

  const embedder = useEmbedder();
  const single = useSingleStrategyQuery(documentContent, embedder);
  const compare = useCompareQuery(documentContent, embedder);

  function handleDocumentChange(next: string) {
    setDocumentContent(next);
    single.reset();
    compare.reset();
  }

  const hasDocument = !isEmpty(documentContent);
  const hasResults = single.queryState.status === "idle" && single.queryState.results.length > 0;

  return (
    <div className="flex min-h-full flex-col md:h-dvh md:overflow-hidden">
      <Navbar />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-6 md:min-h-0 md:px-8 md:py-10">
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-text/10 bg-panel-bg shadow-[0_24px_64px_-12px_rgba(0,0,0,0.55)] md:min-h-0">
          <div
            className={`grid flex-1 grid-cols-1 md:min-h-0 ${compareMode ? "md:grid-cols-[300px_1fr]" : "md:grid-cols-[300px_1fr_340px]"}`}
          >
            {/* Left: inputs and controls. Its own scroll region on desktop —
                two stacked StrategyControls in compare mode can outgrow the
                panel's fixed height. */}
            <div className="flex flex-col gap-6 border-b border-text/10 bg-panel-inset-bg p-5 md:min-h-0 md:overflow-y-auto md:border-r md:border-b-0">
              <DocumentInput value={documentContent} onChange={handleDocumentChange} />

              <label className="flex items-center gap-2 text-sm text-text-muted">
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                  className="accent-violet"
                />
                Comparar dos estrategias
              </label>

              {compareMode ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <p className="mb-2 text-xs tracking-wide text-text-muted">Estrategia A</p>
                    <StrategyControls
                      strategy={compare.leftStrategy}
                      onChange={compare.changeLeftStrategy}
                      tokenizerReady={embedder.tokenizerReady === "ready"}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs tracking-wide text-text-muted">Estrategia B</p>
                    <StrategyControls
                      strategy={compare.rightStrategy}
                      onChange={compare.changeRightStrategy}
                      tokenizerReady={embedder.tokenizerReady === "ready"}
                    />
                  </div>
                </div>
              ) : (
                <StrategyControls
                  strategy={single.strategy}
                  onChange={single.changeStrategy}
                  tokenizerReady={embedder.tokenizerReady === "ready"}
                />
              )}

              <ModelStatus embedder={embedder} />

              <QueryInput
                value={compareMode ? compare.queryText : single.queryText}
                onChange={compareMode ? compare.setQueryText : single.setQueryText}
                onSubmit={compareMode ? compare.submitQuery : single.submitQuery}
                disabled={
                  embedder.modelReady !== "ready" ||
                  (compareMode ? compare.chunkCount === 0 : single.chunks.length === 0)
                }
                disabledReason={compareMode ? compare.disabledReason : single.disabledReason}
              />
              <QueryError
                message={
                  compareMode
                    ? compare.compareState.status === "error"
                      ? compare.compareState.error
                      : null
                    : single.queryState.status === "error"
                      ? single.queryState.error
                      : null
                }
              />
            </div>

            {/* Center: the chunked-document canvas (or, in compare mode, both
                side by side). Its own scroll region on desktop — a long
                document plus a paginated chip list is bounded now, but can
                still outgrow the panel's fixed height. */}
            <div className="min-w-0 p-5 md:min-h-0 md:overflow-y-auto md:p-6">
              {!hasDocument ? (
                <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-text-muted">
                  Pegá un documento a la izquierda para ver los cortes.
                </div>
              ) : compareMode ? (
                <ComparisonView
                  content={documentContent}
                  left={{
                    strategy: compare.leftStrategy,
                    chunks: compare.leftChunks,
                    results: compare.compareState.leftResults,
                  }}
                  right={{
                    strategy: compare.rightStrategy,
                    chunks: compare.rightChunks,
                    results: compare.compareState.rightResults,
                  }}
                />
              ) : (
                <ChunkedDocument
                  content={documentContent}
                  chunks={single.chunks}
                  notice={single.notice}
                  selectedIndex={single.selectedChunkIndex}
                  onSelectIndex={single.setSelectedChunkIndex}
                />
              )}
            </div>

            {/* Right: ranked results and export — hidden in compare mode, which
                shows results inline per side inside ComparisonView instead.
                Only the results list scrolls; the download action sits in a
                fixed footer below it so it never depends on how many
                results — or how many pages of them — there are. */}
            {!compareMode && (
              <div className="flex flex-col border-t border-text/10 bg-panel-inset-bg md:min-h-0 md:border-t-0 md:border-l">
                <div className="scrollbar-hide p-5 md:min-h-0 md:flex-1 md:overflow-y-auto">
                  <RankedResults
                    results={single.queryState.results}
                    chunks={single.chunks}
                    selectedIndex={single.selectedChunkIndex}
                    onSelectIndex={single.setSelectedChunkIndex}
                  />
                </div>
                {hasResults && (
                  <div className="border-t border-text/10 p-5">
                    <SummaryImage
                      strategy={single.strategy}
                      query={single.queryState.query}
                      chunks={single.chunks}
                      results={single.queryState.results}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

