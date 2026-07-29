"use client";

import { useTranslations } from "next-intl";

type ThresholdControlProps = {
  /** Raw cosine, [-1, 1] — the domain's own scale. */
  threshold: number;
  onChange: (threshold: number) => void;
};

// Displayed on the same 0..1 scale the rest of the app uses for scores
// (RankedResults' (score + 1) / 2), so this number reads consistently next
// to every other similarity figure on screen.
function toDisplay(raw: number): number {
  return (raw + 1) / 2;
}

function toRaw(display: number): number {
  return display * 2 - 1;
}

export function ThresholdControl({ threshold, onChange }: ThresholdControlProps) {
  const t = useTranslations("confusability");
  const display = toDisplay(threshold);
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center justify-between text-sm text-text/60">
        <span>{t("threshold")}</span>
        <span className="tabular-nums text-text">{display.toFixed(2)}</span>
      </label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={display}
        onChange={(event) => onChange(toRaw(Number(event.target.value)))}
        aria-label={t("threshold")}
        className="accent-violet"
      />
    </div>
  );
}
