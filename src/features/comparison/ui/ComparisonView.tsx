"use client";

import { useState } from "react";
import type { Chunk } from "../../chunking/domain/chunk";
import type { ChunkingStrategy } from "../../chunking/domain/strategy";
import { STRATEGY_LABELS } from "../../chunking/ui/StrategyControls";
import { ChunkedDocument } from "../../chunking/ui/ChunkedDocument";
import { RankedResults } from "../../retrieval/ui/RankedResults";
import type { RankedResult } from "../../retrieval/domain/ranking";
import { resultAtOffset } from "../domain/comparison";

export type ComparisonSide = {
  strategy: ChunkingStrategy;
  chunks: Chunk[];
  results: RankedResult[];
};

type ComparisonViewProps = {
  content: string;
  left: ComparisonSide;
  right: ComparisonSide;
};

function formatScore(score: number): string {
  return ((score + 1) / 2).toFixed(3);
}

// A single shared passage position drives both columns — selecting a chunk
// on either side resolves the same offset's chunk on the other. The two
// strategies cut the document differently, so this is never just "the same
// chunkIndex on both sides".
export function ComparisonView({ content, left, right }: ComparisonViewProps) {
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);

  const leftResult = selectedOffset === null ? null : resultAtOffset(left.chunks, left.results, selectedOffset);
  const rightResult =
    selectedOffset === null ? null : resultAtOffset(right.chunks, right.results, selectedOffset);

  function selectViaSide(side: ComparisonSide, chunkIndex: number) {
    setSelectedOffset(side.chunks[chunkIndex]?.start ?? null);
  }

  return (
    <div className="flex flex-col gap-3">
      {selectedOffset !== null && (
        <p className="border-t-2 border-violet bg-panel-inset-bg p-2 text-sm text-text">
          Selected passage —{" "}
          <strong>{STRATEGY_LABELS[left.strategy.type]}</strong>:{" "}
          {leftResult ? `rank ${leftResult.rank} (${formatScore(leftResult.score)})` : "no chunk here"}
          {" · "}
          <strong>{STRATEGY_LABELS[right.strategy.type]}</strong>:{" "}
          {rightResult
            ? `rank ${rightResult.rank} (${formatScore(rightResult.score)})`
            : "no chunk here"}
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {(
          [
            ["left" as const, left],
            ["right" as const, right],
          ] as const
        ).map(([key, side]) => {
          const selectedIndex =
            selectedOffset === null
              ? null
              : (resultAtOffset(side.chunks, side.results, selectedOffset)?.chunkIndex ?? null);
          return (
            <div key={key} className="flex flex-col gap-3">
              <h3 className="text-base font-medium leading-none text-text">
                {STRATEGY_LABELS[side.strategy.type]}
              </h3>
              <ChunkedDocument
                content={content}
                chunks={side.chunks}
                selectedIndex={selectedIndex}
                onSelectIndex={(chunkIndex) => selectViaSide(side, chunkIndex)}
              />
              <RankedResults
                results={side.results}
                chunks={side.chunks}
                selectedIndex={selectedIndex}
                onSelectIndex={(chunkIndex) => selectViaSide(side, chunkIndex)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
