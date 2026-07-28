"use client";

import { useEffect, useState } from "react";

type Tool = {
  id: string;
  label: string;
  kind: "real" | "soon";
};

// The four tools the app actually ships today, plus generic unnamed slots —
// a visible "there's more coming" without promising a specific roadmap item
// PRODUCT.md hasn't confirmed.
const TOOLS: Tool[] = [
  { id: "chunks", label: "Chunk Inspector", kind: "real" },
  { id: "compare", label: "Strategy Comparison", kind: "real" },
  { id: "queries", label: "Query Sensitivity", kind: "real" },
  { id: "confusable", label: "Confusable Chunks", kind: "real" },
  { id: "soon-1", label: "Coming soon", kind: "soon" },
  { id: "soon-2", label: "Coming soon", kind: "soon" },
];

const AUTO_ADVANCE_MS = 3500;

function ComparePreview() {
  const a = [80, 62, 45];
  const b = [80, 62, 40, 28];
  return (
    <div className="flex w-full items-start justify-center gap-3">
      <div className="flex flex-col gap-1.5">
        {a.map((w, i) => (
          <span
            key={i}
            className={`h-1 rounded-full ${i === 1 ? "bg-violet" : "bg-text/20"}`}
            style={{ width: `${w * 0.5}px` }}
          />
        ))}
      </div>
      <div className="mt-3 h-8 w-px bg-text/15" />
      <div className="flex flex-col gap-1.5">
        {b.map((w, i) => (
          <span
            key={i}
            className={`h-1 rounded-full ${i === 2 ? "bg-violet" : "bg-text/20"}`}
            style={{ width: `${w * 0.5}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function BoundariesPreview() {
  return (
    <div className="flex w-full max-w-[160px] flex-col gap-1.5 text-left">
      <span className="border-b border-dashed border-text/40 pb-1 text-[11px] leading-tight text-text/70">
        chunk boundary cut the
      </span>
      <span className="border-b-2 border-violet pb-1 text-[11px] leading-tight text-text/70">
        passage in half, the
      </span>
      <span className="border-b border-dashed border-text/20 pb-1 text-[11px] leading-tight text-text/70">
        chunk is so large
      </span>
    </div>
  );
}

function RankingPreview() {
  const rows = [0.82, 0.51, 0.24];
  return (
    <div className="flex w-full max-w-[150px] flex-col gap-2">
      {rows.map((score, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">#{i + 1}</span>
          <span className="relative h-[2px] flex-1 bg-text/15">
            <span className="absolute inset-y-0 left-0 bg-violet" style={{ width: `${score * 100}%` }} />
          </span>
          <span className="text-[10px] tabular-nums text-text-muted">{score.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function ConfusablePreview() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-1 w-10 rounded-full bg-violet" />
      <span className="text-[11px] text-text-muted">&asymp;</span>
      <span className="h-1 w-10 rounded-full bg-violet" />
    </div>
  );
}

function SoonPreview() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="h-8 w-8 rounded-full border border-dashed border-text/25" />
      <span className="text-[10px] text-text-muted">Coming soon</span>
    </div>
  );
}

function ToolPreview({ tool }: { tool: Tool }) {
  if (tool.kind === "soon") return <SoonPreview />;
  switch (tool.id) {
    case "chunks":
      return <BoundariesPreview />;
    case "compare":
      return <ComparePreview />;
    case "queries":
      return <RankingPreview />;
    case "confusable":
      return <ConfusablePreview />;
    default:
      return null;
  }
}

export function ToolDial() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    if (userInteracted) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % TOOLS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [userInteracted]);

  function stopAuto() {
    setUserInteracted(true);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      stopAuto();
      setActiveIndex((i) => (i + 1) % TOOLS.length);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      stopAuto();
      setActiveIndex((i) => (i - 1 + TOOLS.length) % TOOLS.length);
    }
  }

  const activeTool = TOOLS[activeIndex];

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="listbox"
        aria-label="Aguja tools"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex h-[520px] w-[520px] shrink-0 flex-col gap-3 rounded-3xl border border-text/10 bg-panel-bg/40 p-4 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet focus-visible:outline-offset-4"
      >
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-text/10 bg-[radial-gradient(circle_at_50%_28%,color-mix(in_srgb,var(--color-violet)_55%,transparent)_0%,transparent_60%),var(--color-panel-inset-bg)] px-8 text-center shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)]">
          <span
            className="absolute inset-0 m-auto aspect-square w-[76%] rounded-full border border-dashed border-[color-mix(in_srgb,var(--color-violet)_40%,transparent)]"
            aria-hidden="true"
          />
          <span
            className="absolute inset-0 m-auto aspect-square w-[56%] rounded-full border border-dashed border-[color-mix(in_srgb,var(--color-violet)_40%,transparent)] opacity-60"
            aria-hidden="true"
          />
          <div className="relative scale-[1.8]">
            <ToolPreview tool={activeTool} />
          </div>
          <p
            className={`relative text-2xl font-semibold tracking-wide ${activeTool.kind === "soon" ? "text-text-muted" : "text-text"}`}
          >
            {activeTool.label}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          {TOOLS.map((tool, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={tool.id}
                type="button"
                tabIndex={-1}
                aria-label={tool.label}
                aria-selected={isActive}
                role="option"
                onClick={() => {
                  stopAuto();
                  setActiveIndex(i);
                }}
                className={[
                  "flex h-11 w-11 items-center justify-center rounded-xl border text-[10px] font-medium transition-colors",
                  isActive
                    ? "border-violet bg-violet text-page-bg"
                    : tool.kind === "soon"
                      ? "border-dashed border-text/25 text-text-muted"
                      : "border-text/25 bg-panel-bg text-text hover:border-violet/60",
                ].join(" ")}
              >
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-page-bg" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-text-muted">Choose a tool, or use the arrow keys.</p>
    </div>
  );
}
