"use client";

import { useState } from "react";
import { DocumentInput } from "@/features/documents/ui/DocumentInput";
import { isEmpty } from "@/features/documents/domain/document";
import { useEmbedder } from "@/features/retrieval/embedding/useEmbedder";
import { useSingleStrategyQuery } from "@/features/retrieval/ui/useSingleStrategyQuery";
import { useCompareQuery } from "@/features/comparison/ui/useCompareQuery";
import { PageHeader } from "./_components/PageHeader";
import { CompareModeToggle } from "./_components/CompareModeToggle";
import { SingleStrategyWorkspace } from "./_components/SingleStrategyWorkspace";
import { CompareWorkspace } from "./_components/CompareWorkspace";

export default function Home() {
  // Session-scoped only — nothing here is persisted across a reload.
  const [documentContent, setDocumentContent] = useState("");
  const [compareMode, setCompareMode] = useState(false);

  const embedder = useEmbedder();
  const single = useSingleStrategyQuery(documentContent, embedder);
  const compare = useCompareQuery(documentContent, embedder);

  // single/compare live here, not inside the workspace components, so their
  // state survives flipping the compare switch back and forth even though
  // only one workspace is ever mounted at a time — only a new document
  // invalidates either one.
  function handleDocumentChange(next: string) {
    setDocumentContent(next);
    single.reset();
    compare.reset();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <PageHeader />
      <DocumentInput value={documentContent} onChange={handleDocumentChange} />
      {!isEmpty(documentContent) && (
        <>
          <CompareModeToggle checked={compareMode} onChange={setCompareMode} />
          {compareMode ? (
            <CompareWorkspace content={documentContent} query={compare} embedder={embedder} />
          ) : (
            <SingleStrategyWorkspace content={documentContent} query={single} embedder={embedder} />
          )}
        </>
      )}
    </main>
  );
}
