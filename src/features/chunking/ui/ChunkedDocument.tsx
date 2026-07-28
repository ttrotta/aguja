"use client";

import { useEffect, useState } from "react";
import type { Chunk } from "../domain/chunk";
import { toSegments } from "../domain/segments";

const CHUNKS_PER_PAGE = 30;

type ChunkedDocumentProps = {
  content: string;
  chunks: Chunk[];
  /** Surfaced above the boundaries, e.g. paragraphs finding no separator. */
  notice?: string | null;
  /**
   * Controlled rather than internal state — selection is shared with
   * RankedResults, so choosing a result there highlights its chunk here
   * and vice versa.
   */
  selectedIndex: number | null;
  onSelectIndex: (chunkIndex: number) => void;
};

// A small needle glyph marks the start of the selected chunk's stitch —
// the same mark used in the page header, kept local since features/ must
// not import from app/.
function NeedleGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="needle-glyph thread-glow mr-0.5 inline-block -translate-y-0.5 align-middle"
    >
      <path
        d="M11.5 1 2 10.5a1.2 1.2 0 1 0 1.5 1.5L13 2.5"
        stroke="var(--color-violet)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="10.5"
        cy="1.8"
        rx="0.9"
        ry="1.4"
        transform="rotate(45 10.5 1.8)"
        stroke="var(--color-violet)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
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
        Previous
      </button>
      <span className="text-sm text-text-muted">
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page === totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="rounded-sm border border-text/30 px-3 py-1 text-sm text-text transition-colors hover:border-violet/60 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

export function ChunkedDocument({
  content,
  chunks,
  notice,
  selectedIndex,
  onSelectIndex,
}: ChunkedDocumentProps) {
  const segments = toSegments(chunks, content.length);
  const selectedChunk = selectedIndex === null ? null : (chunks[selectedIndex] ?? null);

  // Every chunk's own start gets a marker, not just the selected one — a
  // stitch is only legible as a boundary if you can see where *each* seam
  // is, not just the one you happen to have picked.
  const chunkStartIndex = new Map(chunks.map((c) => [c.start, c.index]));

  // Page resets when the chunk list itself changes (new document or
  // strategy); it jumps to whichever page holds the selection when the
  // selection changes from elsewhere (e.g. clicking a result in
  // RankedResults). Adjusted during render, per React's "storing
  // information from previous renders" pattern, rather than in an effect,
  // so the jump lands in the same commit as the click that caused it.
  const [page, setPage] = useState(0);
  const [chunksForPage, setChunksForPage] = useState(chunks);
  const [selectionForPage, setSelectionForPage] = useState(selectedIndex);

  let currentPage = page;
  if (chunks !== chunksForPage) {
    setChunksForPage(chunks);
    setSelectionForPage(selectedIndex);
    currentPage = 0;
    setPage(0);
  } else if (selectedIndex !== selectionForPage) {
    setSelectionForPage(selectedIndex);
    if (selectedIndex !== null) {
      currentPage = Math.floor(selectedIndex / CHUNKS_PER_PAGE);
      setPage(currentPage);
    }
  }

  const totalPages = Math.max(1, Math.ceil(chunks.length / CHUNKS_PER_PAGE));
  const pageChunks = chunks.slice(currentPage * CHUNKS_PER_PAGE, currentPage * CHUNKS_PER_PAGE + CHUNKS_PER_PAGE);

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsExpanded(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // The compact preview and the full-screen modal render the exact same
  // annotated markup at different sizes, so the boundary logic — overlap
  // dashing, alternating chunk-parity underlines, the needle on selection —
  // lives in one place rather than two copies drifting apart.
  function renderSegments() {
    return segments.map((segment) => {
      const isOverlap = segment.chunkIndices.length > 1;
      const isSelected = selectedIndex !== null && segment.chunkIndices.includes(selectedIndex);
      const startsChunk = chunkStartIndex.get(segment.start);
      const primaryChunk = segment.chunkIndices[0];
      return (
        <span
          key={segment.start}
          role="button"
          tabIndex={0}
          onClick={() => onSelectIndex(primaryChunk)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectIndex(primaryChunk);
            }
          }}
          title={`chunk ${segment.chunkIndices.join(", ")} — ${segment.end - segment.start} characters`}
          className={[
            "cursor-pointer pb-0.5 transition-colors",
            isSelected
              ? "border-b-2 border-solid border-violet"
              : isOverlap
                ? "border-b-2 border-dashed border-text/70 hover:border-violet/60"
                : primaryChunk % 2 === 0
                  ? "border-b border-dashed border-text/45 hover:border-violet/60"
                  : "border-b border-dashed border-text/20 hover:border-violet/60",
          ].join(" ")}
        >
          {startsChunk !== undefined &&
            (startsChunk === selectedIndex ? (
              <NeedleGlyph />
            ) : (
              <span
                aria-hidden="true"
                className="mr-1 align-middle text-[0.6875rem] font-medium tracking-wide text-text/40"
              >
                {startsChunk}
              </span>
            ))}
          {content.slice(segment.start, segment.end)}
        </span>
      );
    });
  }

  if (chunks.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p className="flex items-center gap-2 rounded-sm border border-warning/50 bg-panel-inset-bg p-2 text-sm text-text">
          <span aria-hidden="true" className="text-warning">
            ▲
          </span>
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Document preview</span>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="rounded-sm border border-text/30 px-2 py-1 text-xs text-text transition-colors hover:border-violet/60"
          >
            View full document
          </button>
        </div>
        <pre className="scrollbar-hide max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-sm border border-text/30 bg-panel-inset-bg p-4 font-sans text-sm leading-relaxed text-text">
          {renderSegments()}
        </pre>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-[1.125rem] font-medium leading-none text-text">
          {chunks.length} chunk{chunks.length === 1 ? "" : "s"}
        </h2>
        <Pager page={currentPage} totalPages={totalPages} onChange={setPage} />
        <ul className="flex flex-wrap gap-2 text-sm">
          {pageChunks.map((c) => (
            <li key={c.index}>
              <button
                type="button"
                onClick={() => onSelectIndex(c.index)}
                className={[
                  "rounded-sm border px-2 py-1 text-text transition-colors",
                  selectedIndex === c.index
                    ? "border-violet text-violet"
                    : "border-text/30 hover:border-violet/60",
                ].join(" ")}
              >
                #{c.index} · {c.length} chars
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedChunk && (
        <div className="border-t-2 border-violet bg-panel-inset-bg p-3 text-sm">
          <p className="font-medium text-text/80">
            Chunk #{selectedChunk.index} — [{selectedChunk.start}, {selectedChunk.end}) —{" "}
            {selectedChunk.length} characters
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-text">{selectedChunk.text}</p>
        </div>
      )}

      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full document"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-text/10 bg-panel-bg shadow-[0_24px_64px_-12px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-text/10 p-4">
              <h3 className="text-[1.125rem] font-medium text-text">Full document</h3>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-sm border border-text/30 text-text transition-colors hover:border-violet/60"
              >
                ✕
              </button>
            </div>
            <pre className="overflow-y-auto whitespace-pre-wrap break-words p-6 font-sans text-sm leading-relaxed text-text">
              {renderSegments()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
