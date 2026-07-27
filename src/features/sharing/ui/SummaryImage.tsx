"use client";

import { useRef } from "react";
import type { Chunk } from "../../chunking/domain/chunk";
import type { ChunkingStrategy } from "../../chunking/domain/strategy";
import { STRATEGY_LABELS } from "../../chunking/ui/StrategyControls";
import type { RankedResult } from "../../retrieval/domain/ranking";

type SummaryImageProps = {
  strategy: ChunkingStrategy;
  query: string;
  chunks: Chunk[];
  results: RankedResult[];
};

// FR-024 asks for "the top-ranked chunks", not the full no-top-N-cut list
// RankedResults renders — a shareable image has to fit in a reasonable
// frame, so it is deliberately capped here.
const TOP_N = 5;
const WIDTH = 800;
const ROW_HEIGHT = 40;
const TOP_MARGIN = 170;

function formatParameters(strategy: ChunkingStrategy): string {
  switch (strategy.type) {
    case "fixed-size":
      return `size ${strategy.size} characters`;
    case "fixed-size-overlap":
      return `size ${strategy.size}, overlap ${strategy.overlap} characters`;
    case "tokens":
      return `size ${strategy.size} tokens`;
    case "paragraphs":
      return "no parameters";
  }
}

function truncate(text: string, max: number): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

export function SummaryImage({ strategy, query, chunks, results }: SummaryImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function draw(): HTMLCanvasElement | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const top = results.slice(0, TOP_N);

    canvas.width = WIDTH;
    canvas.height = TOP_MARGIN + top.length * ROW_HEIGHT + 20;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#18181b";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Aguja — retrieval summary", 24, 40);

    ctx.font = "15px sans-serif";
    ctx.fillStyle = "#3f3f46";
    ctx.fillText(
      `Strategy: ${STRATEGY_LABELS[strategy.type]} (${formatParameters(strategy)})`,
      24,
      74,
    );
    ctx.fillText(`Query: "${truncate(query, 80)}"`, 24, 98);

    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "#18181b";
    ctx.fillText(`Top ${top.length} of ${results.length} ranked chunks:`, 24, 130);

    ctx.font = "14px sans-serif";
    top.forEach((result, i) => {
      const chunk = chunks[result.chunkIndex];
      const y = 160 + i * ROW_HEIGHT;
      const score = ((result.score + 1) / 2).toFixed(3);
      ctx.fillStyle = "#3f3f46";
      ctx.fillText(
        `#${result.rank} · score ${score}${result.truncated ? " · truncated" : ""}`,
        24,
        y,
      );
      ctx.fillStyle = "#71717a";
      ctx.fillText(truncate(chunk?.text ?? "", 90), 24, y + 18);
    });

    return canvas;
  }

  // Rendered and downloaded entirely on-device via a Blob object URL — the
  // image never touches a network request (FR-025, Principle V).
  function handleDownload() {
    const canvas = draw();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "aguja-summary.png";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleDownload}
        className="self-start rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
      >
        Download summary image
      </button>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
