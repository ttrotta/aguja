"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TokenSpan } from "../../chunking/domain/tokens";
import type { Embedding } from "../domain/embedding";
import type { Request, Response } from "./protocol";

type ReadinessState = "idle" | "loading" | "ready" | "failed";

type PendingTokenize = {
  resolve: (spans: TokenSpan[]) => void;
  reject: (error: Error) => void;
};

type PendingEmbed = {
  resolve: (embeddings: Embedding[]) => void;
  reject: (error: Error) => void;
};

let nextRequestId = 0;

export function useEmbedder() {
  const workerRef = useRef<Worker | null>(null);
  const pendingTokenizeRef = useRef<Map<string, PendingTokenize>>(new Map());
  const pendingEmbedRef = useRef<Map<string, PendingEmbed>>(new Map());

  // Starts at "loading", not "idle" — the mount effect below always
  // requests the tokenizer immediately, so there is no real idle period.
  // (Setting this via setState inside the effect instead would be a
  // synchronous setState-in-effect, which triggers a needless extra render.)
  const [tokenizerReady, setTokenizerReady] = useState<ReadinessState>("loading");
  const [tokenizerProgress, setTokenizerProgress] = useState(0);
  const [tokenizerError, setTokenizerError] = useState<string | null>(null);

  // The model (21.9 MB) loads independently of the tokenizer (0.7 MB) — R-004 —
  // so it gets its own readiness state rather than folding into tokenizerReady.
  const [modelReady, setModelReady] = useState<ReadinessState>("loading");
  const [modelProgress, setModelProgress] = useState(0);
  const [modelError, setModelError] = useState<string | null>(null);

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
          } else if (response.target === "model" && response.total > 0) {
            setModelProgress(response.loaded / response.total);
          }
          break;
        case "error":
          if (response.target === "tokenizer") {
            setTokenizerReady("failed");
            setTokenizerError(response.message);
          } else {
            setModelReady("failed");
            setModelError(response.message);
          }
          break;
        case "tokenized": {
          const pending = pendingTokenizeRef.current.get(response.id);
          if (pending) {
            pendingTokenizeRef.current.delete(response.id);
            pending.resolve(response.spans);
          }
          break;
        }
        case "model-ready":
          setModelReady("ready");
          break;
        case "embedded": {
          const pending = pendingEmbedRef.current.get(response.id);
          if (pending) {
            pendingEmbedRef.current.delete(response.id);
            pending.resolve(response.embeddings);
          }
          break;
        }
      }
    });

    const loadTokenizer: Request = { type: "load-tokenizer" };
    const loadModel: Request = { type: "load-model" };
    worker.postMessage(loadTokenizer);
    worker.postMessage(loadModel);

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
      pendingTokenizeRef.current.set(id, { resolve, reject });
      const request: Request = { type: "tokenize", id, text };
      worker.postMessage(request);
    });
  }, []);

  const embed = useCallback((texts: string[]): Promise<Embedding[]> => {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        reject(new Error("Worker is not available."));
        return;
      }
      const id = String(nextRequestId++);
      pendingEmbedRef.current.set(id, { resolve, reject });
      const request: Request = { type: "embed", id, texts };
      worker.postMessage(request);
    });
  }, []);

  return {
    tokenizerReady,
    tokenizerProgress,
    tokenizerError,
    tokenize,
    modelReady,
    modelProgress,
    modelError,
    embed,
  };
}
