type LoadProgressProps = {
  label: string;
  state: "idle" | "loading" | "ready" | "failed";
  progress: number;
  error: string | null;
  fallbackNote?: string;
};

export function LoadProgress({ label, state, progress, error, fallbackNote }: LoadProgressProps) {
  if (state === "idle" || state === "ready") return null;

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
            Downloading {label}… {Math.round(progress * 100)}%
          </span>
        </div>
      )}
      {state === "failed" && (
        <p role="alert" className="text-warning">
          Could not load {label}
          {error ? `: ${error}` : "."}
          {fallbackNote && <span className="block text-text/60">{fallbackNote}</span>}
        </p>
      )}
    </div>
  );
}
