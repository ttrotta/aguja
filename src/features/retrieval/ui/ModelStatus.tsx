"use client";

import { LoadProgress } from "./LoadProgress";
import type { useEmbedder } from "../embedding/useEmbedder";

type ModelStatusProps = {
  embedder: ReturnType<typeof useEmbedder>;
};

// Tokenizer and model load independently, so each gets its own progress
// banner rather than being folded into one. The language note lives here
// too since it is only relevant once the user is about to query.
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
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        The embedding model is English-only. Scores for non-English text are not meaningful.
      </p>
    </div>
  );
}
