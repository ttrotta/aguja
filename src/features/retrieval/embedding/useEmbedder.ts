"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TokenSpan } from "../../chunking/domain/tokens";
import type { Request, Response } from "./protocol";

type ReadinessState = "idle" | "loading" | "ready" | "failed";

type PendingTokenize = {
  resolve: (spans: TokenSpan[]) => void;
  reject: (error: Error) => void;
};

let nextRequestId = 0;

export function useEmbedder() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingTokenize>>(new Map());

  // Starts at "loading", not "idle" — the mount effect below always
  // requests the tokenizer immediately, so there is no real idle period.
  // (Setting this via setState inside the effect instead would be a
  // synchronous setState-in-effect, which triggers a needless extra render.)
  const [tokenizerReady, setTokenizerReady] = useState<ReadinessState>("loading");
  const [tokenizerProgress, setTokenizerProgress] = useState(0);
  const [tokenizerError, setTokenizerError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./embedder.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.addEventListener("message", (event: MessageEvent<Response>) => {
      const response = event.data;
      switch (response.type) {
        case "tokenizer-ready":
          setTokenizerReady("ready");
          break;
        case "progress":
          if (response.target === "tokenizer" && response.total > 0) {
            setTokenizerProgress(response.loaded / response.total);
          }
          break;
        case "error":
          if (response.target === "tokenizer") {
            setTokenizerReady("failed");
            setTokenizerError(response.message);
          }
          break;
        case "tokenized": {
          const pending = pendingRef.current.get(response.id);
          if (pending) {
            pendingRef.current.delete(response.id);
            pending.resolve(response.spans);
          }
          break;
        }
        case "model-ready":
        case "embedded":
          // Wired in T039–T040 (User Story 2).
          break;
      }
    });

    const request: Request = { type: "load-tokenizer" };
    worker.postMessage(request);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const tokenize = useCallback((text: string): Promise<TokenSpan[]> => {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        reject(new Error("Worker is not available."));
        return;
      }
      const id = String(nextRequestId++);
      pendingRef.current.set(id, { resolve, reject });
      const request: Request = { type: "tokenize", id, text };
      worker.postMessage(request);
    });
  }, []);

  return { tokenizerReady, tokenizerProgress, tokenizerError, tokenize };
}
