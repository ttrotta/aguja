"use client";

import { useTranslations } from "next-intl";
import { isEmpty } from "@/features/documents/domain/document";
import { StrategyControls } from "@/features/chunking/ui/StrategyControls";
import { ModelStatus } from "@/features/retrieval/ui/ModelStatus";
import { QueryError } from "@/features/retrieval/ui/QueryError";
import { PhrasingInput } from "@/features/sensitivity/ui/PhrasingInput";
import { SensitivityResults } from "@/features/sensitivity/ui/SensitivityResults";
import { useSensitivityQuery } from "@/features/sensitivity/ui/useSensitivityQuery";
import { useToolSession } from "../_components/ToolSession";
import { ToolEmptyState } from "../_components/ToolEmptyState";

export default function QuerySensitivityPage() {
  const t = useTranslations("sensitivity");
  const { documentContent, embedder, getOrEmbedChunks } = useToolSession();
  const sensitivity = useSensitivityQuery(documentContent, embedder, getOrEmbedChunks);

  const hasDocument = !isEmpty(documentContent);
  const hasResults = sensitivity.state.status === "idle" && sensitivity.state.profiles.length > 0;

  return (
    <div className="grid flex-1 grid-cols-1 md:min-h-0 md:grid-cols-[300px_1fr]">
      {/* Left: strategy, model status, and the phrasing set. Its own scroll
          region on desktop. */}
      <div className="flex flex-col gap-6 border-b border-text/10 bg-panel-inset-bg p-5 md:min-h-0 md:overflow-y-auto md:border-r md:border-b-0">
        <StrategyControls
          strategy={sensitivity.strategy}
          onChange={sensitivity.changeStrategy}
          tokenizerReady={embedder.tokenizerReady === "ready"}
        />

        <ModelStatus embedder={embedder} />

        <PhrasingInput
          phrasings={sensitivity.phrasings}
          onChange={sensitivity.setPhrasings}
          onSubmit={sensitivity.submitPhrasings}
          disabled={embedder.modelReady !== "ready" || sensitivity.chunks.length === 0}
          disabledReason={sensitivity.disabledReason}
        />
        <QueryError
          message={sensitivity.state.status === "error" ? sensitivity.state.error : null}
        />
      </div>

      {/* Content: every chunk's rank under every phrasing, most volatile
          first. */}
      <div className="scrollbar-hide min-w-0 p-5 md:min-h-0 md:overflow-y-auto md:p-6">
        {!hasDocument ? (
          <ToolEmptyState reason="no-document" />
        ) : sensitivity.state.status === "running" ? (
          <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-text-muted">
            {t("running")}
          </div>
        ) : hasResults ? (
          <SensitivityResults
            profiles={sensitivity.state.profiles}
            phrasingCount={sensitivity.state.phrasingCount}
          />
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center text-center text-sm text-text-muted">
            {t("prompt")}
          </div>
        )}
      </div>
    </div>
  );
}
