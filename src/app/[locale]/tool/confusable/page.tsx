"use client";

import { useTranslations } from "next-intl";
import { isEmpty } from "@/features/documents/domain/document";
import { StrategyControls } from "@/features/chunking/ui/StrategyControls";
import { ModelStatus } from "@/features/retrieval/ui/ModelStatus";
import { QueryError } from "@/features/retrieval/ui/QueryError";
import { ThresholdControl } from "@/features/confusability/ui/ThresholdControl";
import { ConfusablePairs } from "@/features/confusability/ui/ConfusablePairs";
import { useConfusabilityQuery } from "@/features/confusability/ui/useConfusabilityQuery";
import { useToolSession } from "../_components/ToolSession";
import { ToolEmptyState } from "../_components/ToolEmptyState";

export default function ConfusableChunksPage() {
  const t = useTranslations("confusability");
  const { documentContent, embedder, getOrEmbedChunks } = useToolSession();
  const confusability = useConfusabilityQuery(documentContent, embedder, getOrEmbedChunks);

  const hasDocument = !isEmpty(documentContent);
  const hasRun = confusability.state.status === "idle" && confusability.state.run !== null;
  const canRun = embedder.modelReady === "ready" && confusability.chunks.length >= 2;

  function handleThresholdChange(next: number) {
    // Once a comparison has run, dragging the slider re-runs it live —
    // getOrEmbedChunks is already cached, so this costs only the pair scan.
    // Before that, it just moves the value.
    if (hasRun) {
      void confusability.run(next);
    } else {
      confusability.setThreshold(next);
    }
  }

  return (
    <div className="grid flex-1 grid-cols-1 md:min-h-0 md:grid-cols-[300px_1fr]">
      {/* Left: strategy, model status, threshold, and the run action. Its
          own scroll region on desktop. */}
      <div className="flex flex-col gap-6 border-b border-text/10 bg-panel-inset-bg p-5 md:min-h-0 md:overflow-y-auto md:border-r md:border-b-0">
        <StrategyControls
          strategy={confusability.strategy}
          onChange={confusability.changeStrategy}
          tokenizerReady={embedder.tokenizerReady === "ready"}
        />

        <ModelStatus embedder={embedder} />

        <ThresholdControl threshold={confusability.threshold} onChange={handleThresholdChange} />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => confusability.run()}
            disabled={!canRun}
            className="w-full rounded-full bg-violet px-4 py-2 text-sm text-page-bg transition-colors hover:bg-violet-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("compare")}
          </button>
          {!canRun && confusability.disabledReason && (
            <p className="text-sm text-text/60">{confusability.disabledReason}</p>
          )}
        </div>
        <QueryError
          message={confusability.state.status === "error" ? confusability.state.error : null}
        />
      </div>

      {/* Content: pairs the retriever cannot separate. */}
      <div className="scrollbar-hide min-w-0 p-5 md:min-h-0 md:overflow-y-auto md:p-6">
        {!hasDocument ? (
          <ToolEmptyState reason="no-document" />
        ) : confusability.state.status === "running" ? (
          <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-text-muted">
            {t("running")}
          </div>
        ) : hasRun && confusability.state.run ? (
          <ConfusablePairs run={confusability.state.run} chunks={confusability.chunks} />
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center text-center text-sm text-text-muted">
            {t("prompt")}
          </div>
        )}
      </div>
    </div>
  );
}
