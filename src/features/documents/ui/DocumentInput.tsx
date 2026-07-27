"use client";

import { useEffect, useState } from "react";
import { MAX_DOCUMENT_LENGTH, isEmpty, validateDocument } from "../domain/document";

type DocumentInputProps = {
  value: string;
  onChange: (content: string) => void;
};

export function DocumentInput({ value, onChange }: DocumentInputProps) {
  const [refused, setRefused] = useState(false);

  // Nothing is persisted — a reload silently discards the pasted document,
  // so warn while there is anything to lose.
  useEffect(() => {
    if (isEmpty(value)) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value;
    const result = validateDocument(next);
    if (!result.valid) {
      setRefused(true);
      return;
    }
    setRefused(false);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder="Paste a document to debug how it gets chunked..."
        aria-label="Document"
        className="min-h-64 w-full resize-y rounded-md border border-zinc-300 bg-white p-4 font-mono text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <div className="flex items-center justify-between text-sm">
        <span
          className={
            value.length >= MAX_DOCUMENT_LENGTH
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-500 dark:text-zinc-400"
          }
        >
          {value.length.toLocaleString()} / {MAX_DOCUMENT_LENGTH.toLocaleString()} characters
        </span>
        {refused && (
          <span role="alert" className="text-red-600 dark:text-red-400">
            That would go over the limit — the extra text was not accepted.
          </span>
        )}
      </div>
    </div>
  );
}
