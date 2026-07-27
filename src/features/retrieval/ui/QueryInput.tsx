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
        <span className="text-zinc-600 dark:text-zinc-400">Query</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="What are you trying to find?"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md border border-indigo-500 bg-indigo-500 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>
        </div>
      </label>
      {disabled && disabledReason && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{disabledReason}</p>
      )}
    </form>
  );
}
