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
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="text-zinc-500 dark:text-zinc-400">
            Downloading {label}… {Math.round(progress * 100)}%
          </span>
        </div>
      )}
      {state === "failed" && (
        <p role="alert" className="text-red-600 dark:text-red-400">
          Could not load {label}{error ? `: ${error}` : "."}
          {fallbackNote && <span className="block text-zinc-500 dark:text-zinc-400">{fallbackNote}</span>}
        </p>
      )}
    </div>
  );
}
