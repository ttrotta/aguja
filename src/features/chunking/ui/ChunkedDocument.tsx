"use client";

import type { Chunk } from "../domain/chunk";
import { toSegments } from "../domain/segments";

type ChunkedDocumentProps = {
  content: string;
  chunks: Chunk[];
  /** Surfaced above the boundaries, e.g. paragraphs finding no separator (SC-010). */
  notice?: string | null;
  /**
   * Controlled rather than internal state — selection is shared with
   * RankedResults, so choosing a result there highlights its chunk here
   * (FR-018) and vice versa.
   */
  selectedIndex: number | null;
  onSelectIndex: (chunkIndex: number) => void;
};

export function ChunkedDocument({
  content,
  chunks,
  notice,
  selectedIndex,
  onSelectIndex,
}: ChunkedDocumentProps) {
  const segments = toSegments(chunks, content.length);
  const selectedChunk = selectedIndex === null ? null : (chunks[selectedIndex] ?? null);

  if (chunks.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {notice}
        </p>
      )}
      <pre className="whitespace-pre-wrap break-words rounded-md border border-zinc-300 bg-white p-4 font-mono text-sm leading-relaxed text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
        {segments.map((segment) => {
          const isOverlap = segment.chunkIndices.length > 1;
          const isSelected =
            selectedIndex !== null && segment.chunkIndices.includes(selectedIndex);
          return (
            <span
              key={segment.start}
              role="button"
              tabIndex={0}
              onClick={() => onSelectIndex(segment.chunkIndices[0])}
              title={`chunk ${segment.chunkIndices.join(", ")} — ${segment.end - segment.start} characters`}
              className={[
                "cursor-pointer",
                isOverlap
                  ? "bg-amber-200 dark:bg-amber-900/60"
                  : segment.chunkIndices[0] % 2 === 0
                    ? "bg-indigo-100 dark:bg-indigo-950/60"
                    : "bg-transparent",
                isSelected ? "ring-2 ring-indigo-500" : "",
              ].join(" ")}
            >
              {content.slice(segment.start, segment.end)}
            </span>
          );
        })}
      </pre>

      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {chunks.length} chunk{chunks.length === 1 ? "" : "s"}
        </h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {chunks.map((c) => (
            <li key={c.index}>
              <button
                type="button"
                onClick={() => onSelectIndex(c.index)}
                className={[
                  "rounded-md border px-2 py-1",
                  selectedIndex === c.index
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-zinc-300 dark:border-zinc-700",
                ].join(" ")}
              >
                #{c.index} · {c.length} chars
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedChunk && (
        <div className="rounded-md border border-indigo-300 bg-indigo-50 p-3 text-sm dark:border-indigo-800 dark:bg-indigo-950">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">
            Chunk #{selectedChunk.index} — [{selectedChunk.start}, {selectedChunk.end}) —{" "}
            {selectedChunk.length} characters
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words font-mono text-zinc-900 dark:text-zinc-50">
            {selectedChunk.text}
          </p>
        </div>
      )}
    </div>
  );
}
