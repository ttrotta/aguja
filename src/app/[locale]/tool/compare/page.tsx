"use client";

import { DocumentInput } from "@/features/documents/ui/DocumentInput";
import { isEmpty } from "@/features/documents/domain/document";
import { StrategyControls } from "@/features/chunking/ui/StrategyControls";
import { ModelStatus } from "@/features/retrieval/ui/ModelStatus";
import { QueryInput } from "@/features/retrieval/ui/QueryInput";
import { QueryError } from "@/features/retrieval/ui/QueryError";
import { ComparisonView } from "@/features/comparison/ui/ComparisonView";
import { useCompareQuery } from "@/features/comparison/ui/useCompareQuery";
import { useToolSession } from "../_components/ToolSession";
import { ToolEmptyState } from "../_components/ToolEmptyState";

export default function StrategyComparisonPage() {
  const { documentContent, setDocumentContent, embedder } = useToolSession();
  const compare = useCompareQuery(documentContent, embedder);

  function handleDocumentChange(next: string) {
    setDocumentContent(next);
    compare.reset();
  }

  const hasDocument = !isEmpty(documentContent);

  return (
    <div className="grid flex-1 grid-cols-1 md:min-h-0 md:grid-cols-[300px_1fr]">
      {/* Left: inputs and controls, two strategies stacked. Its own scroll
          region on desktop — two StrategyControls can outgrow the panel's
          fixed height. */}
      <div className="flex flex-col gap-6 border-b border-text/10 bg-panel-inset-bg p-5 md:min-h-0 md:overflow-y-auto md:border-r md:border-b-0">
        <DocumentInput value={documentContent} onChange={handleDocumentChange} />

        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-xs tracking-wide text-text-muted">Strategy A</p>
            <StrategyControls
              strategy={compare.leftStrategy}
              onChange={compare.changeLeftStrategy}
              tokenizerReady={embedder.tokenizerReady === "ready"}
            />
          </div>
          <div>
            <p className="mb-2 text-xs tracking-wide text-text-muted">Strategy B</p>
            <StrategyControls
              strategy={compare.rightStrategy}
              onChange={compare.changeRightStrategy}
              tokenizerReady={embedder.tokenizerReady === "ready"}
            />
          </div>
        </div>

        <ModelStatus embedder={embedder} />

        <QueryInput
          value={compare.queryText}
          onChange={compare.setQueryText}
          onSubmit={compare.submitQuery}
          disabled={embedder.modelReady !== "ready" || compare.chunkCount === 0}
          disabledReason={compare.disabledReason}
        />
        <QueryError
          message={compare.compareState.status === "error" ? compare.compareState.error : null}
        />
      </div>

      {/* Content: both strategies' chunked documents side by side, results
          rendered inline per side inside ComparisonView. */}
      <div className="min-w-0 p-5 md:min-h-0 md:overflow-y-auto md:p-6">
        {!hasDocument ? (
          <ToolEmptyState reason="no-document" />
        ) : (
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
        )}
      </div>
    </div>
  );
}
