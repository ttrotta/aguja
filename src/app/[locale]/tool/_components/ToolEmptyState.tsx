import Link from "next/link";

type ToolEmptyStateProps =
  | { reason: "no-document" }
  | { reason: "model-loading"; progress: number };

// Every tool that needs a document or the model shows this instead of an
// empty or broken analysis (FR-036) — naming what's missing and where to
// fix it, rather than assuming the reader already knows.
export function ToolEmptyState(props: ToolEmptyStateProps) {
  if (props.reason === "no-document") {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center text-sm text-text-muted">
        <p>No document yet.</p>
        <p>
          Paste one in{" "}
          <Link href="/tool/chunks" className="text-violet hover:text-violet-deep">
            Chunk Inspector
          </Link>{" "}
          to use this tool.
        </p>
      </div>
    );
  }

  const percent = Math.round(props.progress * 100);
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center text-sm text-text-muted">
      <div className="h-[3px] w-32 overflow-hidden bg-text/15">
        <div className="h-full bg-violet transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p>Downloading the model… {percent}%</p>
    </div>
  );
}
