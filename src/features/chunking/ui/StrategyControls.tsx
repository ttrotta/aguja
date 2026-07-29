"use client";

import type { ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import {
  validateStrategy,
  type ChunkingStrategy,
  type StrategyValidationReason,
} from "../domain/strategy";

type StrategyControlsProps = {
  strategy: ChunkingStrategy;
  onChange: (strategy: ChunkingStrategy) => void;
  /** Gates the "tokens" option — never gated on the (much larger) model. */
  tokenizerReady: boolean;
};

/**
 * Strategy names, translated. A hook rather than a constant because the copy
 * now lives in the catalogues — the comparison view and the summary image read
 * it from here so all three stay in step.
 */
export function useStrategyLabels(): Record<ChunkingStrategy["type"], string> {
  const t = useTranslations("strategy");
  return {
    "fixed-size": t("fixedSize"),
    "fixed-size-overlap": t("fixedSizeOverlap"),
    paragraphs: t("paragraphs"),
    tokens: t("tokens"),
  };
}

const VALIDATION_KEYS: Record<StrategyValidationReason, "errorSizeTooSmall" | "errorOverlapNegative" | "errorOverlapNotLessThanSize"> = {
  "size-too-small": "errorSizeTooSmall",
  "overlap-negative": "errorOverlapNegative",
  "overlap-not-less-than-size": "errorOverlapNotLessThanSize",
};

const FIELD_CLASS =
  "rounded-sm border border-text/30 bg-panel-inset-bg px-3 py-2 text-sm text-text focus:border-violet focus:outline-none";

export function StrategyControls({ strategy, onChange, tokenizerReady }: StrategyControlsProps) {
  const t = useTranslations("strategy");
  const labels = useStrategyLabels();
  const validation = validateStrategy(strategy);

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const type = event.target.value as ChunkingStrategy["type"];
    if (type === "fixed-size") {
      onChange({ type, size: 500 });
    } else if (type === "fixed-size-overlap") {
      onChange({ type, size: 500, overlap: 100 });
    } else if (type === "tokens") {
      onChange({ type, size: 128 });
    } else {
      onChange({ type: "paragraphs" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text/60">{t("label")}</span>
        <select value={strategy.type} onChange={handleTypeChange} className={FIELD_CLASS}>
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value} disabled={value === "tokens" && !tokenizerReady}>
              {label}
              {value === "tokens" && !tokenizerReady ? t("tokenizerLoadingSuffix") : ""}
            </option>
          ))}
        </select>
      </label>

      {strategy.type === "fixed-size" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text/60">{t("sizeCharacters")}</span>
          <input
            type="number"
            value={strategy.size}
            onChange={(event) =>
              onChange({ type: "fixed-size", size: Number(event.target.value) })
            }
            className={FIELD_CLASS}
          />
        </label>
      )}

      {strategy.type === "fixed-size-overlap" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text/60">{t("sizeCharacters")}</span>
            <input
              type="number"
              value={strategy.size}
              onChange={(event) =>
                onChange({
                  type: "fixed-size-overlap",
                  size: Number(event.target.value),
                  overlap: strategy.overlap,
                })
              }
              className={FIELD_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text/60">{t("overlapCharacters")}</span>
            <input
              type="number"
              value={strategy.overlap}
              onChange={(event) =>
                onChange({
                  type: "fixed-size-overlap",
                  size: strategy.size,
                  overlap: Number(event.target.value),
                })
              }
              className={FIELD_CLASS}
            />
          </label>
        </>
      )}

      {strategy.type === "tokens" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text/60">{t("sizeTokens")}</span>
          <input
            type="number"
            value={strategy.size}
            onChange={(event) => onChange({ type: "tokens", size: Number(event.target.value) })}
            className={FIELD_CLASS}
          />
        </label>
      )}

      {!validation.valid && (
        <p role="alert" className="text-sm text-warning">
          {t(VALIDATION_KEYS[validation.reason])}
        </p>
      )}
    </div>
  );
}
