import type { ChunkRankProfile } from "../domain/rank-profile";

type SensitivityResultsProps = {
  profiles: ChunkRankProfile[];
  phrasingCount: number;
};

// Renders profiles exactly as the domain returns them — already ordered by
// rank spread descending, then chunkIndex ascending (FR-040) — so the most
// phrasing-sensitive chunks read first without any client-side sort.
export function SensitivityResults({ profiles, phrasingCount }: SensitivityResultsProps) {
  if (profiles.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[1.125rem] font-medium leading-none text-text">
        {profiles.length} chunk{profiles.length === 1 ? "" : "s"}, sorted by rank spread
      </h2>
      <ol className="flex flex-col gap-1">
        {profiles.map((profile) => (
          <li
            key={profile.chunkIndex}
            className="flex flex-col gap-1.5 border border-text/30 px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span>chunk {profile.chunkIndex}</span>
                {profile.truncated && (
                  <span
                    title="This chunk's text was cut before embedding, so its ranking was decided without its tail."
                    className="rounded-full border border-warning/60 px-2 py-0.5 text-xs text-warning"
                  >
                    truncated
                  </span>
                )}
              </span>
              <span className="tabular-nums text-text-muted">
                spread {profile.rankSpread} (#{profile.bestRank}–#{profile.worstRank})
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-text-muted">
              {profile.ranksByPhrasing.map((rank, i) => (
                <span
                  key={i}
                  className="rounded-sm border border-text/20 px-2 py-0.5 tabular-nums"
                  title={`Phrasing ${i + 1} of ${phrasingCount}`}
                >
                  #{i + 1}: rank {rank}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
