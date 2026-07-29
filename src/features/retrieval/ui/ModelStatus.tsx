"use client";

import { useTranslations } from "next-intl";
import { LoadProgress } from "./LoadProgress";
import type { useEmbedder } from "../embedding/useEmbedder";

type ModelStatusProps = {
  embedder: ReturnType<typeof useEmbedder>;
};

// Tokenizer and model load independently, so each gets its own progress
// banner rather than being folded into one.
//
// The English-only disclaimer used to live here, behind a small "i" button.
// It moved to a persistent notice in the tool shell: a tooltip was adequate
// while every word on screen was already English, and stopped being adequate
// the moment the interface could be read in another language (D-013, FR-062).
export function ModelStatus({ embedder }: ModelStatusProps) {
  const t = useTranslations("model");

  return (
    <div className="flex flex-col gap-2">
      <LoadProgress
        label="targetTokenizer"
        state={embedder.tokenizerReady}
        progress={embedder.tokenizerProgress}
        error={embedder.tokenizerError}
        fallbackNote={t("tokenizerFallback")}
      />
      <LoadProgress
        label="targetModel"
        state={embedder.modelReady}
        progress={embedder.modelProgress}
        error={embedder.modelError}
        fallbackNote={t("modelFallback")}
      />
    </div>
  );
}
