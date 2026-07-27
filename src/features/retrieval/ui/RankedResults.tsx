"use client";

import type { Chunk } from "../../chunking/domain/chunk";
import type { RankedResult } from "../domain/ranking";

type RankedResultsProps = {
  results: RankedResult[];
  chunks: Chunk[];
  selectedIndex: number | null;
  onSelectIndex: (chunkIndex: number) => void;
};

// Score is cosine similarity in -1..1, but it is *displayed* on 0..1 — the
// raw sign is a domain-internal detail, not something a reader needs to
// reason about.
function toDisplayScore(score: number): number {
  return (score + 1) / 2;
}

export function RankedResults({ results, chunks, selectedIndex, onSelectIndex }: RankedResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {results.length} result{results.length === 1 ? "" : "s"}, ranked by similarity
      </h2>
      <ol className="flex flex-col gap-1">
        {results.map((result) => {
          const chunk = chunks[result.chunkIndex];
          if (!chunk) return null;
          return (
            <li key={result.chunkIndex}>
              <button
                type="button"
                onClick={() => onSelectIndex(result.chunkIndex)}
                className={[
                  "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm",
                  selectedIndex === result.chunkIndex
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-zinc-300 dark:border-zinc-700",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">
                    #{result.rank}
                  </span>
                  <span>
                    chunk {chunk.index} · [{chunk.start}, {chunk.end})
                  </span>
                  {result.truncated && (
                    <span
                      title={`${result.totalTokens - result.tokenCount} of ${result.totalTokens} tokens were not embedded`}
                      className="rounded-full bg-amber-200 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-900 dark:text-amber-100"
                    >
                      truncated — {result.tokenCount}/{result.totalTokens} tokens
                    </span>
                  )}
                </span>
                <span className="font-mono">{toDisplayScore(result.score).toFixed(3)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
