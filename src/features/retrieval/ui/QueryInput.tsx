"use client";

import { type FormEvent } from "react";

type QueryInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  disabled?: boolean;
  disabledReason?: string;
};

export function QueryInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  disabledReason,
}: QueryInputProps) {
  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && !disabled;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSubmit) onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text/60">Query</span>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="What are you trying to find?"
            className="min-w-0 w-full rounded-sm border border-text/30 bg-panel-inset-bg px-3 py-2 text-text placeholder:text-text/40 focus:border-violet focus:outline-none"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-violet px-4 py-2 text-sm text-page-bg transition-colors hover:bg-violet-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            Search
          </button>
        </div>
      </label>
      {disabled && disabledReason && <p className="text-sm text-text/60">{disabledReason}</p>}
    </form>
  );
}
