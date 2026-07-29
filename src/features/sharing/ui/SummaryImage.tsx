"use client";

import { useRef } from "react";
import type { Chunk } from "../../chunking/domain/chunk";
import type { ChunkingStrategy } from "../../chunking/domain/strategy";
import { useTranslations } from "next-intl";
import { useStrategyLabels } from "../../chunking/ui/StrategyControls";
import type { RankedResult } from "../../retrieval/domain/ranking";

type SummaryImageProps = {
  strategy: ChunkingStrategy;
  query: string;
  chunks: Chunk[];
  results: RankedResult[];
};

// A shareable image has to fit in a reasonable frame, unlike RankedResults'
// full no-top-N-cut list, so it is deliberately capped here.
const TOP_N = 5;
const WIDTH = 800;
const ROW_HEIGHT = 44;
const TOP_MARGIN = 170;

// Exported at the product's default (dark) register regardless of the
// viewer's current theme toggle — a consistent artifact beats one that
// silently changes look depending on when it was captured.
const PAGE_BG = "#0e0b14";
const TEXT = "#f2eff5";
const TEXT_MUTED = "rgba(242, 239, 245, 0.65)";
const VIOLET = "#9d5cff";
const TRACK = "rgba(242, 239, 245, 0.15)";

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
  const t = useTranslations("sharing");
  const labels = useStrategyLabels();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayFontRef = useRef<HTMLSpanElement>(null);
  const bodyFontRef = useRef<HTMLSpanElement>(null);

  function draw(): HTMLCanvasElement | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const top = results.slice(0, TOP_N);

    // Reads the browser's already-resolved font-family (the obfuscated name
    // next/font registers) instead of guessing a string that might not match
    // what the document actually loaded.
    const displayFont = displayFontRef.current
      ? getComputedStyle(displayFontRef.current).fontFamily
      : "serif";
    const bodyFont = bodyFontRef.current
      ? getComputedStyle(bodyFontRef.current).fontFamily
      : "sans-serif";

    canvas.width = WIDTH;
    canvas.height = TOP_MARGIN + top.length * ROW_HEIGHT + 20;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = PAGE_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = TEXT;
    ctx.font = `900 28px ${displayFont}`;
    ctx.fillText("Aguja", 24, 44);

    ctx.font = `500 13px ${bodyFont}`;
    ctx.fillStyle = TEXT_MUTED;
    ctx.fillText(t("imageSubtitle"), 24, 62);

    ctx.font = `15px ${bodyFont}`;
    ctx.fillStyle = TEXT;
    ctx.fillText(
      t("imageStrategy", { name: labels[strategy.type], parameters: formatParameters(strategy) }),
      24,
      92,
    );
    ctx.fillText(t("imageQuery", { query: truncate(query, 80) }), 24, 114);

    ctx.font = `500 14px ${bodyFont}`;
    ctx.fillStyle = TEXT_MUTED;
    ctx.fillText(t("imageTopN", { shown: top.length, total: results.length }), 24, 144);

    top.forEach((result, i) => {
      const chunk = chunks[result.chunkIndex];
      const y = TOP_MARGIN + i * ROW_HEIGHT;
      const displayScore = (result.score + 1) / 2;
      const scoreText = displayScore.toFixed(3);

      ctx.font = `500 14px ${bodyFont}`;
      ctx.fillStyle = TEXT;
      ctx.fillText(
        `#${result.rank} · chunk ${chunk?.index ?? "?"}${result.truncated ? t("imageTruncatedSuffix") : ""}`,
        24,
        y,
      );

      // The same thread-bar-as-score reading used in the live ranked list.
      const barX = WIDTH - 180;
      const barWidth = 100;
      ctx.fillStyle = TRACK;
      ctx.fillRect(barX, y - 8, barWidth, 2);
      ctx.fillStyle = VIOLET;
      ctx.fillRect(barX, y - 8, barWidth * Math.max(0, Math.min(1, displayScore)), 2);
      ctx.font = `14px ${bodyFont}`;
      ctx.fillStyle = TEXT;
      ctx.fillText(scoreText, barX + barWidth + 12, y);

      ctx.font = `13px ${bodyFont}`;
      ctx.fillStyle = TEXT_MUTED;
      ctx.fillText(truncate(chunk?.text ?? "", 78), 24, y + 18);
    });

    return canvas;
  }

  // Rendered and downloaded entirely on-device via a Blob object URL — the
  // image never touches a network request.
  async function handleDownload() {
    await document.fonts.ready;
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
        className="self-start rounded-sm border border-text/30 px-3 py-2 text-sm text-text transition-colors hover:border-violet"
      >
        {t("download")}
      </button>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <span ref={displayFontRef} className="font-display hidden" aria-hidden="true">
        .
      </span>
      <span ref={bodyFontRef} className="font-sans hidden" aria-hidden="true">
        .
      </span>
    </div>
  );
}
