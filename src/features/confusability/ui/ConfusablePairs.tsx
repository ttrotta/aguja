import type { ConfusabilityRun } from "../domain/confusable-pairs";
import type { Chunk } from "../../chunking/domain/chunk";

type ConfusablePairsProps = {
  run: ConfusabilityRun;
  chunks: Chunk[];
};

// Same 0..1 scale the rest of the app displays scores on.
function toDisplayScore(raw: number): number {
  return (raw + 1) / 2;
}

const PREVIEW_LENGTH = 200;

function preview(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > PREVIEW_LENGTH ? `${trimmed.slice(0, PREVIEW_LENGTH)}…` : trimmed;
}

// Renders both numbers AND both chunks' own text for every pair. The
// numbers alone separate a paraphrase from a literal duplicate, but not a
// duplicate from a one-word contradiction — both score high on similarity
// and shared wording (D-012) — so the text is not decoration, it is what
// resolves that case. Never labels a pair "duplicated" or "identical"
// (FR-045).
export function ConfusablePairs({ run, chunks }: ConfusablePairsProps) {
  if (run.chunksTotal < 2) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center text-center text-sm text-text-muted">
        Not enough chunks to compare — need at least two.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {run.chunksCompared < run.chunksTotal && (
        <p className="flex items-center gap-2 rounded-sm border border-warning/50 bg-panel-inset-bg p-2 text-sm text-text">
          <span aria-hidden="true" className="text-warning">
            ▲
          </span>
          Compared the first {run.chunksCompared} of {run.chunksTotal} chunks — the rest were left
          out to keep this responsive.
        </p>
      )}

      {run.pairs.length === 0 ? (
        <div className="flex h-full min-h-[200px] items-center justify-center text-center text-sm text-text-muted">
          No pairs met the threshold.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.125rem] font-medium leading-none text-text">
            {run.pairs.length} pair{run.pairs.length === 1 ? "" : "s"} the retriever cannot
            separate
          </h2>
          <ol className="flex flex-col gap-2">
            {run.pairs.map((pair) => {
              const first = chunks[pair.firstChunkIndex];
              const second = chunks[pair.secondChunkIndex];
              return (
                <li
                  key={`${pair.firstChunkIndex}-${pair.secondChunkIndex}`}
                  className="flex flex-col gap-2 border border-text/30 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      chunk {pair.firstChunkIndex} ↔ chunk {pair.secondChunkIndex}
                    </span>
                    <span className="flex items-center gap-3 tabular-nums text-text-muted">
                      <span title="Similarity">sim {toDisplayScore(pair.similarity).toFixed(3)}</span>
                      <span title="Shared wording">overlap {pair.lexicalOverlap.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <p className="border-t-2 border-violet bg-panel-inset-bg p-2 text-text/80">
                      {preview(first?.text ?? "")}
                    </p>
                    <p className="border-t-2 border-violet bg-panel-inset-bg p-2 text-text/80">
                      {preview(second?.text ?? "")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
