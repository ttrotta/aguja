"use client";

import { StrategyControls } from "@/features/chunking/ui/StrategyControls";
import { ChunkedDocument } from "@/features/chunking/ui/ChunkedDocument";
import { ModelStatus } from "@/features/retrieval/ui/ModelStatus";
import { QueryInput } from "@/features/retrieval/ui/QueryInput";
import { QueryError } from "@/features/retrieval/ui/QueryError";
import { RankedResults } from "@/features/retrieval/ui/RankedResults";
import { SummaryImage } from "@/features/sharing/ui/SummaryImage";
import type { SingleStrategyQuery } from "@/features/retrieval/ui/useSingleStrategyQuery";
import type { useEmbedder } from "@/features/retrieval/embedding/useEmbedder";

type SingleStrategyWorkspaceProps = {
  content: string;
  query: SingleStrategyQuery;
  embedder: ReturnType<typeof useEmbedder>;
};

export function SingleStrategyWorkspace({ content, query, embedder }: SingleStrategyWorkspaceProps) {
  const hasResults = query.queryState.status === "idle" && query.queryState.results.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <StrategyControls
        strategy={query.strategy}
        onChange={query.changeStrategy}
        tokenizerReady={embedder.tokenizerReady === "ready"}
      />
      <ChunkedDocument
        content={content}
        chunks={query.chunks}
        notice={query.notice}
        selectedIndex={query.selectedChunkIndex}
        onSelectIndex={query.setSelectedChunkIndex}
      />
      <ModelStatus embedder={embedder} />
      <QueryInput
        value={query.queryText}
        onChange={query.setQueryText}
        onSubmit={query.submitQuery}
        disabled={embedder.modelReady !== "ready" || query.chunks.length === 0}
        disabledReason={query.disabledReason}
      />
      <QueryError message={query.queryState.status === "error" ? query.queryState.error : null} />
      <RankedResults
        results={query.queryState.results}
        chunks={query.chunks}
        selectedIndex={query.selectedChunkIndex}
        onSelectIndex={query.setSelectedChunkIndex}
      />
      {hasResults && (
        <SummaryImage
          strategy={query.strategy}
          query={query.queryState.query}
          chunks={query.chunks}
          results={query.queryState.results}
        />
      )}
    </div>
  );
}
