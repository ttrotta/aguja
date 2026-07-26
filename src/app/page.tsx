"use client";

import { useState } from "react";
import { DocumentInput } from "@/features/documents/ui/DocumentInput";

export default function Home() {
  // Session-scoped only (D-005) — nothing here is persisted across a reload.
  const [documentContent, setDocumentContent] = useState("");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Aguja</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Paste a document, see how it gets chunked, then find out which chunks a query actually
          retrieves.
        </p>
      </header>
      <DocumentInput value={documentContent} onChange={setDocumentContent} />
    </main>
  );
}
