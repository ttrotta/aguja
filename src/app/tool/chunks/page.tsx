"use client";

import { DocumentInput } from "@/features/documents/ui/DocumentInput";
import { isEmpty } from "@/features/documents/domain/document";
import { ChunkedDocument } from "@/features/chunking/ui/ChunkedDocument";
import { StrategyControls } from "@/features/chunking/ui/StrategyControls";
import { ModelStatus } from "@/features/retrieval/ui/ModelStatus";
import { QueryInput } from "@/features/retrieval/ui/QueryInput";
import { QueryError } from "@/features/retrieval/ui/QueryError";
import { RankedResults } from "@/features/retrieval/ui/RankedResults";
import { SummaryImage } from "@/features/sharing/ui/SummaryImage";
import { useSingleStrategyQuery } from "@/features/retrieval/ui/useSingleStrategyQuery";
import { useToolSession } from "../_components/ToolSession";
import { ToolEmptyState } from "../_components/ToolEmptyState";

export default function ChunkInspectorPage() {
  const { documentContent, setDocumentContent, embedder } = useToolSession();
  const single = useSingleStrategyQuery(documentContent, embedder);

  function handleDocumentChange(next: string) {
    setDocumentContent(next);
    single.reset();
  }

  const hasDocument = !isEmpty(documentContent);
  const hasResults = single.queryState.status === "idle" && single.queryState.results.length > 0;

  return (
    <div className="grid flex-1 grid-cols-1 md:min-h-0 md:grid-cols-[300px_1fr_340px]">
      {/* Left: inputs and controls. Its own scroll region on desktop. */}
      <div className="flex flex-col gap-6 border-b border-text/10 bg-panel-inset-bg p-5 md:min-h-0 md:overflow-y-auto md:border-r md:border-b-0">
        <DocumentInput value={documentContent} onChange={handleDocumentChange} />

        <StrategyControls
          strategy={single.strategy}
          onChange={single.changeStrategy}
          tokenizerReady={embedder.tokenizerReady === "ready"}
        />

        <ModelStatus embedder={embedder} />

        <QueryInput
          value={single.queryText}
          onChange={single.setQueryText}
          onSubmit={single.submitQuery}
          disabled={embedder.modelReady !== "ready" || single.chunks.length === 0}
          disabledReason={single.disabledReason}
        />
        <QueryError
          message={single.queryState.status === "error" ? single.queryState.error : null}
        />
      </div>

      {/* Center: the chunked-document canvas. Its own scroll region on desktop. */}
      <div className="min-w-0 p-5 md:min-h-0 md:overflow-y-auto md:p-6">
        {!hasDocument ? (
          <ToolEmptyState reason="no-document" />
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

      {/* Right: ranked results and export. Only the results list scrolls; the
          download action sits in a fixed footer below it. */}
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
    </div>
  );
}
