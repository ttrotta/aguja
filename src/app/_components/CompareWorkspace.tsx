"use client";

import { StrategyControls } from "@/features/chunking/ui/StrategyControls";
import { ModelStatus } from "@/features/retrieval/ui/ModelStatus";
import { QueryInput } from "@/features/retrieval/ui/QueryInput";
import { QueryError } from "@/features/retrieval/ui/QueryError";
import { ComparisonView } from "@/features/comparison/ui/ComparisonView";
import type { CompareQuery } from "@/features/comparison/ui/useCompareQuery";
import type { useEmbedder } from "@/features/retrieval/embedding/useEmbedder";

type CompareWorkspaceProps = {
  content: string;
  query: CompareQuery;
  embedder: ReturnType<typeof useEmbedder>;
};

export function CompareWorkspace({ content, query, embedder }: CompareWorkspaceProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StrategyControls
          strategy={query.leftStrategy}
          onChange={query.changeLeftStrategy}
          tokenizerReady={embedder.tokenizerReady === "ready"}
        />
        <StrategyControls
          strategy={query.rightStrategy}
          onChange={query.changeRightStrategy}
          tokenizerReady={embedder.tokenizerReady === "ready"}
        />
      </div>
      <ModelStatus embedder={embedder} />
      <QueryInput
        value={query.queryText}
        onChange={query.setQueryText}
        onSubmit={query.submitQuery}
        disabled={embedder.modelReady !== "ready" || query.chunkCount === 0}
        disabledReason={query.disabledReason}
      />
      <QueryError message={query.compareState.status === "error" ? query.compareState.error : null} />
      <ComparisonView
        content={content}
        left={{ strategy: query.leftStrategy, chunks: query.leftChunks, results: query.compareState.leftResults }}
        right={{
          strategy: query.rightStrategy,
          chunks: query.rightChunks,
          results: query.compareState.rightResults,
        }}
      />
    </div>
  );
}
