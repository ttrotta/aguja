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
        className="min-h-64 w-full resize-y rounded-sm border border-text/30 bg-panel-inset-bg p-4 text-sm leading-relaxed text-text placeholder:text-text/40 focus:border-violet focus:outline-none"
      />
      <div className="flex items-center justify-between text-sm">
        <span className={value.length >= MAX_DOCUMENT_LENGTH ? "text-warning" : "text-text/60"}>
          {value.length.toLocaleString()} / {MAX_DOCUMENT_LENGTH.toLocaleString()} characters
        </span>
        {refused && (
          <span role="alert" className="text-warning">
            That would go over the limit — the extra text was not accepted.
          </span>
        )}
      </div>
    </div>
  );
}
