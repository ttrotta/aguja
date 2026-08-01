import { useTranslations } from "next-intl";
import { MAX_DOCUMENT_LENGTH } from "@/features/documents/domain/document";

// English-only by design: a sample of the kind of document the tool analyses,
// and the analysis is English-only (D-013) — same rationale as the evidence
// board's excerpt. CHUNKS below slice THIS text at fixed-size-500 boundaries,
// so editing it means recomputing the offsets.
const SAMPLE_DOCUMENT = `4.2 Refunds

Once a returned item passes inspection, refunds are issued to the original payment method within 5-7 business days. Store credit is issued immediately at the time of inspection, before the refund itself completes, and can be used on any future order regardless of the original payment method or the refund's processing status.

4.3 Shipping costs

Shipping costs are refunded when the item was defective or damaged in transit, provided the carrier's claim was accepted. If the order used free shipping, only the item's price is refunded; if shipping was paid, the full amount is returned. Reimbursement covers the original method of payment only, and never exceeds the amount actually paid for the order.

4.4 Customs and duties

International orders may require an additional customs clearance period of up to 14 days before refund processing begins. Customs and import duties are not refundable, and delivery carriers outside the continental service area are not covered by the standard refund window described above. Refund processing begins only after the returned item has passed inspection.`;

const CHUNKS = [
  { index: 0, start: 0, end: 500 },
  { index: 1, start: 500, end: 1000 },
  { index: 2, start: 1000, end: SAMPLE_DOCUMENT.length },
] as const;

const SELECTED_INDEX = 1;

// A query about the "free shipping" sentence that chunk 0's cut splits across.
const RESULTS = [
  { chunkIndex: 1, rank: 1, score: 0.82 },
  { chunkIndex: 0, rank: 2, score: 0.58 },
  { chunkIndex: 2, rank: 3, score: 0.34 },
] as const;

const TOOLS = [
  { key: "chunks", active: true },
  { key: "compare", active: false },
  { key: "queries", active: false },
  { key: "confusable", active: false },
] as const;

// Score is cosine similarity in -1..1, displayed on 0..1 (same rule as
// RankedResults).
function toDisplayScore(score: number): number {
  return (score + 1) / 2;
}

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

function ToolPanelSidebar() {
  const t = useTranslations("tools");
  return (
    <nav
      aria-hidden="true"
      className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-text/10 bg-panel-inset-bg p-2 md:w-24 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-2.5"
    >
      {TOOLS.map((tool) => (
        <span
          key={tool.key}
          className={[
            "shrink-0 whitespace-nowrap rounded-sm border px-2 py-1.5 text-[11px] transition-colors",
            tool.active
              ? "border-violet text-violet"
              : "border-transparent text-text-muted",
          ].join(" ")}
        >
          {t(tool.key)}
        </span>
      ))}
    </nav>
  );
}

function DocumentField() {
  const t = useTranslations("document");
  return (
    <div className="flex flex-col gap-1.5">
      <pre
        aria-hidden="true"
        className="h-[104px] resize-none overflow-hidden whitespace-pre-wrap break-words rounded-sm border border-text/30 bg-panel-inset-bg p-3 font-sans text-[11px] leading-relaxed text-text"
      >
        {SAMPLE_DOCUMENT}
      </pre>
      <span className="text-[10px] text-text/60">
        {t("counter", { used: SAMPLE_DOCUMENT.length, max: MAX_DOCUMENT_LENGTH })}
      </span>
    </div>
  );
}

function StrategyField() {
  const t = useTranslations("strategy");
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1 text-[11px]">
        <span className="text-text/60">{t("label")}</span>
        <span className="flex items-center justify-between rounded-sm border border-text/30 bg-panel-inset-bg px-3 py-2 text-text">
          {t("fixedSize")}
          <span aria-hidden="true" className="text-[9px] text-text/40">
            ▾
          </span>
        </span>
      </label>
      <label className="flex flex-col gap-1 text-[11px]">
        <span className="text-text/60">{t("sizeCharacters")}</span>
        <span className="rounded-sm border border-text/30 bg-panel-inset-bg px-3 py-2 tabular-nums text-text">
          500
        </span>
      </label>
    </div>
  );
}

function QueryField() {
  const t = useTranslations("query");
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1 text-[11px]">
        <span className="text-text/60">{t("label")}</span>
        <span className="rounded-sm border border-text/30 bg-panel-inset-bg px-3 py-2 text-text">
          free shipping refund
        </span>
      </label>
      <span className="w-full rounded-full bg-violet px-4 py-1.5 text-center text-[11px] font-medium text-page-bg">
        {t("submit")}
      </span>
    </div>
  );
}

function LeftColumn() {
  return (
    <div className="flex flex-col gap-4 border-b border-text/10 bg-panel-inset-bg p-4 md:border-b-0 md:border-r">
      <DocumentField />
      <StrategyField />
      <QueryField />
    </div>
  );
}

function CenterColumn() {
  const t = useTranslations("chunkedDocument");
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b border-text/10 p-4 md:border-b-0 md:border-l">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-muted">{t("preview")}</span>
        <span className="rounded-sm border border-text/30 px-2 py-0.5 text-[10px] text-text">
          {t("viewFull")}
        </span>
      </div>
      <pre
        aria-hidden="true"
        className="scrollbar-hide h-44 overflow-hidden whitespace-pre-wrap break-words rounded-sm border border-text/30 bg-panel-inset-bg p-3 font-sans text-[11px] leading-relaxed text-text"
      >
        {CHUNKS.map((chunk) => {
          const isSelected = chunk.index === SELECTED_INDEX;
          return (
            <span
              key={chunk.index}
              className={[
                "pb-0.5",
                isSelected
                  ? "border-b-2 border-solid border-violet"
                  : chunk.index % 2 === 0
                    ? "border-b border-dashed border-text/45"
                    : "border-b border-dashed border-text/20",
              ].join(" ")}
            >
              {isSelected ? (
                <NeedleGlyph />
              ) : (
                <span
                  aria-hidden="true"
                  className="mr-1 align-middle text-[0.6875rem] font-medium tracking-wide text-text/40"
                >
                  {chunk.index}
                </span>
              )}
              {SAMPLE_DOCUMENT.slice(chunk.start, chunk.end)}
            </span>
          );
        })}
      </pre>
      <p className="text-[13px] font-medium leading-none text-text">
        {t("chunkCount", { count: CHUNKS.length })}
      </p>
      <ul className="flex flex-wrap gap-1.5 text-[11px]">
        {CHUNKS.map((chunk) => (
          <li key={chunk.index}>
            <span
              className={[
                "rounded-sm border px-2 py-1 text-text",
                chunk.index === SELECTED_INDEX
                  ? "border-violet text-violet"
                  : "border-text/30",
              ].join(" ")}
            >
              {t("chunkChip", { index: chunk.index, length: chunk.end - chunk.start })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RightColumn() {
  const t = useTranslations("results");
  const tChunk = useTranslations("chunkedDocument");
  return (
    <div className="flex flex-col bg-panel-inset-bg p-4">
      <p className="text-[13px] font-medium leading-none text-text">
        {t("heading", { count: RESULTS.length })}
      </p>
      <ol className="mt-3 flex flex-col gap-1.5">
        {RESULTS.map((result) => {
          const chunk = CHUNKS.find((c) => c.index === result.chunkIndex);
          if (!chunk) return null;
          const isSelected = result.chunkIndex === SELECTED_INDEX;
          const pct = toDisplayScore(result.score) * 100;
          return (
            <li key={result.chunkIndex}>
              <div
                aria-hidden="true"
                className={[
                  "flex w-full items-center justify-between gap-2 border px-2.5 py-1.5 text-[10px]",
                  isSelected
                    ? "border-violet text-violet"
                    : "border-text/30 text-text",
                ].join(" ")}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="text-text/50">#{result.rank}</span>
                  <span className="truncate">
                    {t("chunkLabel", { index: chunk.index, start: chunk.start, end: chunk.end })}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="relative inline-block h-[2px] w-12 bg-text/15" aria-hidden="true">
                    <span
                      className="absolute inset-y-0 left-0 bg-violet"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="tabular-nums">{toDisplayScore(result.score).toFixed(3)}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 border-t-2 border-violet pt-2 text-[10px]">
        <p className="font-medium text-text/80">
          {tChunk("chunkDetail", {
            index: SELECTED_INDEX,
            start: CHUNKS[SELECTED_INDEX].start,
            end: CHUNKS[SELECTED_INDEX].end,
            length: CHUNKS[SELECTED_INDEX].end - CHUNKS[SELECTED_INDEX].start,
          })}
        </p>
        <p className="mt-1 truncate whitespace-pre-wrap break-words text-text">
          {SAMPLE_DOCUMENT.slice(CHUNKS[SELECTED_INDEX].start, CHUNKS[SELECTED_INDEX].end)}
        </p>
      </div>
    </div>
  );
}

/**
 * A faithful, miniature replica of the real tool panel (`ToolLayout`) — the
 * same sidebar, input columns, chunked document, and ranked results the four
 * tools share, rebuilt as static markup over the design tokens. It replaces
 * the old Tool Dial in the hero: a landing visitor sees the instrument itself
 * doing its job, tilted a few degrees and resting on a breathing violet glow,
 * instead of an abstract dial cycling previews.
 *
 * Deliberately a static illustration, not the live UI: the real tool is bound
 * to the session store and the embedder worker, and the hero is a server
 * component. Everything inside is aria-hidden — the navbar's Tools menu
 * already provides the real navigation, so the panel is decoration, not a
 * second set of controls.
 */
export function ToolPanelPreview() {
  return (
    <div
      aria-hidden="true"
      className="hero-float relative w-full max-w-[660px] min-w-0 md:w-[50%]"
    >
      <div className="relative md:rotate-2">
        <div
          aria-hidden="true"
          className="tool-glow pointer-events-none absolute inset-0 rounded-lg border border-violet/30"
        />
        <div className="overflow-hidden rounded-lg border border-text/10 bg-panel-bg shadow-[0_24px_64px_-12px_rgba(0,0,0,0.55)]">
          <div className="flex flex-col md:flex-row md:min-h-[440px]">
            <ToolPanelSidebar />
            <div className="grid min-w-0 flex-1 grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)_184px]">
              <LeftColumn />
              <CenterColumn />
              <RightColumn />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
