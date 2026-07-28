"use client";

import { LoadProgress } from "./LoadProgress";
import type { useEmbedder } from "../embedding/useEmbedder";

type ModelStatusProps = {
  embedder: ReturnType<typeof useEmbedder>;
};

const ENGLISH_ONLY_NOTE = "The embedding model is English-only. Scores for non-English text are not meaningful.";

// Tokenizer and model load independently, so each gets its own progress
// banner rather than being folded into one. The language note is a fixed
// disclaimer rather than transient status, so it collapses into a small
// info affordance instead of a permanent line — otherwise it is the one
// thing in this column that never goes away and always eats vertical space.
export function ModelStatus({ embedder }: ModelStatusProps) {
  return (
    <div className="flex flex-col gap-2">
      <LoadProgress
        label="tokenizer"
        state={embedder.tokenizerReady}
        progress={embedder.tokenizerProgress}
        error={embedder.tokenizerError}
        fallbackNote="Fixed-size, fixed-size-overlap, and paragraph chunking still work without it."
      />
      <LoadProgress
        label="model"
        state={embedder.modelReady}
        progress={embedder.modelProgress}
        error={embedder.modelError}
        fallbackNote="Chunk visualization above still works without it; only querying is unavailable."
      />
      <button
        type="button"
        title={ENGLISH_ONLY_NOTE}
        aria-label={ENGLISH_ONLY_NOTE}
        className="flex h-5 w-5 shrink-0 items-center justify-center self-start rounded-full border border-text/30 text-xs text-text-muted transition-colors hover:border-violet/60 hover:text-violet"
      >
        i
      </button>
    </div>
  );
}
