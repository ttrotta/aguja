"use client";

import type { ChangeEvent } from "react";
import { validateStrategy, type NonTokenStrategy } from "../domain/strategy";

type StrategyControlsProps = {
  strategy: NonTokenStrategy;
  onChange: (strategy: NonTokenStrategy) => void;
};

const STRATEGY_LABELS: Record<NonTokenStrategy["type"], string> = {
  "fixed-size": "Fixed size",
  "fixed-size-overlap": "Fixed size with overlap",
  paragraphs: "Paragraphs",
};

const FIELD_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function StrategyControls({ strategy, onChange }: StrategyControlsProps) {
  const validation = validateStrategy(strategy);

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const type = event.target.value as NonTokenStrategy["type"];
    if (type === "fixed-size") {
      onChange({ type, size: 500 });
    } else if (type === "fixed-size-overlap") {
      onChange({ type, size: 500, overlap: 100 });
    } else {
      onChange({ type: "paragraphs" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Strategy</span>
        <select value={strategy.type} onChange={handleTypeChange} className={FIELD_CLASS}>
          {Object.entries(STRATEGY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {strategy.type === "fixed-size" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Size (characters)</span>
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
            <span className="text-zinc-600 dark:text-zinc-400">Size (characters)</span>
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
            <span className="text-zinc-600 dark:text-zinc-400">Overlap (characters)</span>
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

      {!validation.valid && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {validation.reason}
        </p>
      )}
    </div>
  );
}
