"use client";

import { useTranslations } from "next-intl";

type LoadProgressProps = {
  /** Message key for what is loading, resolved against the model catalogue. */
  label: "targetTokenizer" | "targetModel";
  state: "idle" | "loading" | "ready" | "failed";
  progress: number;
  error: string | null;
  fallbackNote?: string;
};

export function LoadProgress({ label, state, progress, error, fallbackNote }: LoadProgressProps) {
  const t = useTranslations("model");
  if (state === "idle" || state === "ready") return null;
  const target = t(label);

  return (
    <div className="flex flex-col gap-1 text-sm" role="status">
      {state === "loading" && (
        <div className="flex items-center gap-2">
          <div className="h-[3px] w-32 overflow-hidden bg-text/15">
            <div
              className="h-full bg-violet transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="text-text/60">
            {t("downloading", { target, percent: Math.round(progress * 100) })}
          </span>
        </div>
      )}
      {state === "failed" && (
        <p role="alert" className="text-warning">
          {error
            ? t("couldNotLoadWithReason", { target, reason: error })
            : t("couldNotLoad", { target })}
          {fallbackNote && <span className="block text-text/60">{fallbackNote}</span>}
        </p>
      )}
    </div>
  );
}
