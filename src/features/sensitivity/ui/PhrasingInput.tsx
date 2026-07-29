"use client";

import { useTranslations } from "next-intl";

const MIN_PHRASINGS = 2;
const MAX_PHRASINGS = 5;

type PhrasingInputProps = {
  phrasings: string[];
  onChange: (phrasings: string[]) => void;
  onSubmit: (phrasings: string[]) => void;
  disabled?: boolean;
  disabledReason?: string;
};

export function PhrasingInput({
  phrasings,
  onChange,
  onSubmit,
  disabled = false,
  disabledReason,
}: PhrasingInputProps) {
  const t = useTranslations("sensitivity");
  // Blank entries are dropped before counting, not submitted as empty
  // queries — a row left empty among filled ones isn't a phrasing.
  const nonBlank = phrasings.map((p) => p.trim()).filter((p) => p.length > 0);
  const canSubmit = nonBlank.length >= MIN_PHRASINGS && !disabled;

  function updateAt(index: number, value: string) {
    onChange(phrasings.map((p, i) => (i === index ? value : p)));
  }

  function addRow() {
    if (phrasings.length >= MAX_PHRASINGS) return;
    onChange([...phrasings, ""]);
  }

  function removeRow(index: number) {
    if (phrasings.length <= MIN_PHRASINGS) return;
    onChange(phrasings.filter((_, i) => i !== index));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (canSubmit) onSubmit(nonBlank);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <span className="text-sm text-text/60">{t("phrasingsLabel")}</span>
      <div className="flex flex-col gap-2">
        {phrasings.map((phrasing, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={phrasing}
              onChange={(event) => updateAt(index, event.target.value)}
              placeholder={t("phrasingPlaceholder", { number: index + 1 })}
              aria-label={t("phrasingPlaceholder", { number: index + 1 })}
              className="min-w-0 w-full rounded-sm border border-text/30 bg-panel-inset-bg px-3 py-2 text-text placeholder:text-text/40 focus:border-violet focus:outline-none"
            />
            {phrasings.length > MIN_PHRASINGS && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label={t("removePhrasing", { number: index + 1 })}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-text/30 text-text transition-colors hover:border-violet/60"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {phrasings.length < MAX_PHRASINGS && (
        <button
          type="button"
          onClick={addRow}
          className="self-start rounded-sm border border-text/30 px-3 py-1 text-sm text-text transition-colors hover:border-violet/60"
        >
          {t("addPhrasing")}
        </button>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-violet px-4 py-2 text-sm text-page-bg transition-colors hover:bg-violet-deep disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("submit")}
      </button>
      {!disabled && nonBlank.length < MIN_PHRASINGS && (
        <p className="text-sm text-text/60">{t("needTwo")}</p>
      )}
      {disabled && disabledReason && <p className="text-sm text-text/60">{disabledReason}</p>}
    </form>
  );
}
