"use client";

import { useState } from "react";
import type { Chunk } from "../../chunking/domain/chunk";
import type { RankedResult } from "../domain/ranking";

const RESULTS_PER_PAGE = 5;

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

// The thread's length and tension stand in for the score: a bar chart would
// say the same thing in the wrong vocabulary for this world.
function ThreadBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, toDisplayScore(score))) * 100;
  return (
    <span className="relative inline-block h-[2px] w-24 bg-text/15" aria-hidden="true">
      <span
        className="absolute inset-y-0 left-0 bg-violet"
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="rounded-sm border border-text/30 px-3 py-1 text-sm text-text transition-colors hover:border-violet/60 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-sm text-text-muted">
        página {page + 1} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page === totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="rounded-sm border border-text/30 px-3 py-1 text-sm text-text transition-colors hover:border-violet/60 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

export function RankedResults({ results, chunks, selectedIndex, onSelectIndex }: RankedResultsProps) {
  // Page resets when the ranking itself changes (new query or strategy); it
  // jumps to whichever page holds the selection when the selection changes
  // from elsewhere (e.g. clicking a chunk in the document). Adjusted during
  // render, per React's "storing information from previous renders"
  // pattern, rather than in an effect, so the jump lands in the same commit
  // as the click that caused it.
  const [page, setPage] = useState(0);
  const [resultsForPage, setResultsForPage] = useState(results);
  const [selectionForPage, setSelectionForPage] = useState(selectedIndex);

  let currentPage = page;
  if (results !== resultsForPage) {
    setResultsForPage(results);
    setSelectionForPage(selectedIndex);
    currentPage = 0;
    setPage(0);
  } else if (selectedIndex !== selectionForPage) {
    setSelectionForPage(selectedIndex);
    const result = selectedIndex === null ? null : results.find((r) => r.chunkIndex === selectedIndex);
    if (result) {
      currentPage = Math.floor((result.rank - 1) / RESULTS_PER_PAGE);
      setPage(currentPage);
    }
  }

  if (results.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const pageResults = results.slice(currentPage * RESULTS_PER_PAGE, currentPage * RESULTS_PER_PAGE + RESULTS_PER_PAGE);
  const selectedChunk = selectedIndex === null ? null : (chunks[selectedIndex] ?? null);
  const PREVIEW_LENGTH = 280;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[1.125rem] font-medium leading-none text-text">
        {results.length} result{results.length === 1 ? "" : "s"}, ranked by similarity
      </h2>
      <Pager page={currentPage} totalPages={totalPages} onChange={setPage} />
      <ol className="flex flex-col gap-1">
        {pageResults.map((result) => {
          const chunk = chunks[result.chunkIndex];
          if (!chunk) return null;
          const isSelected = selectedIndex === result.chunkIndex;
          return (
            <li key={result.chunkIndex}>
              <button
                type="button"
                onClick={() => onSelectIndex(result.chunkIndex)}
                className={[
                  "flex w-full items-center justify-between gap-3 border px-3 py-2 text-left text-sm transition-colors",
                  isSelected
                    ? "border-violet text-violet"
                    : "border-text/30 text-text hover:border-violet/60",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <span className="text-text/50">#{result.rank}</span>
                  <span>
                    chunk {chunk.index} · [{chunk.start}, {chunk.end})
                  </span>
                  {result.truncated && (
                    <span
                      title={`${result.totalTokens - result.tokenCount} of ${result.totalTokens} tokens were not embedded`}
                      className="rounded-full border border-warning/60 px-2 py-0.5 text-xs text-warning"
                    >
                      truncated — {result.tokenCount}/{result.totalTokens} tokens
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <ThreadBar score={result.score} />
                  <span className="tabular-nums">{toDisplayScore(result.score).toFixed(3)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {selectedChunk && (
        <div className="border-t-2 border-violet pt-3 text-sm">
          <p className="font-medium text-text/80">
            Chunk #{selectedChunk.index} — [{selectedChunk.start}, {selectedChunk.end}) —{" "}
            {selectedChunk.length} characters
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-text">
            {selectedChunk.text.length > PREVIEW_LENGTH
              ? `${selectedChunk.text.slice(0, PREVIEW_LENGTH)}…`
              : selectedChunk.text}
          </p>
        </div>
      )}
    </div>
  );
}
