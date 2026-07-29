import type { TokenSpan } from "../../chunking/domain/tokens";
import type { Embedding } from "../domain/embedding";
import type { Request, Response } from "./protocol";

/**
 * The embedder worker and its readiness, held at module scope.
 *
 * A locale segment above the tool layout remounts the session provider on a
 * language switch (research.md Finding 1). Previously the worker was created in
 * a mount effect and terminated on cleanup, so that remount tore down the WASM
 * session and made the visitor watch the model load again — which FR-056
 * forbids outright.
 *
 * Readiness lives here too, not just the worker. The worker announces
 * "model-ready" exactly once; a component that mounts afterwards never hears it.
 * Keeping the flags beside the worker means a remounted component reads the
 * state as it actually is instead of waiting forever on an announcement that
 * already happened.
 *
 * The worker is created on first use, never at import. Creating it at import
 * would start a 23 MB download for every visitor who only ever sees the landing
 * page — the exact cost D-002 spends its budget avoiding.
 */

type ReadinessState = "idle" | "loading" | "ready" | "failed";

export type EmbedderSnapshot = {
  tokenizerReady: ReadinessState;
  tokenizerProgress: number;
  tokenizerError: string | null;
  modelReady: ReadinessState;
  modelProgress: number;
  modelError: string | null;
};

// "loading" rather than "idle" because the first mount always requests both
// immediately, so there is no observable idle period.
const INITIAL: EmbedderSnapshot = {
  tokenizerReady: "loading",
  tokenizerProgress: 0,
  tokenizerError: null,
  modelReady: "loading",
  modelProgress: 0,
  modelError: null,
};

let snapshot: EmbedderSnapshot = INITIAL;
const subscribers = new Set<() => void>();

let worker: Worker | null = null;
let nextRequestId = 0;

type PendingTokenize = { resolve: (spans: TokenSpan[]) => void; reject: (error: Error) => void };
type PendingEmbed = { resolve: (embeddings: Embedding[]) => void; reject: (error: Error) => void };

const pendingTokenize = new Map<string, PendingTokenize>();
const pendingEmbed = new Map<string, PendingEmbed>();

// Replaced, never mutated — useSyncExternalStore compares by reference and
// would miss an in-place edit.
function update(patch: Partial<EmbedderSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  for (const notify of subscribers) notify();
}

function handleMessage(event: MessageEvent<Response>): void {
  const response = event.data;
  switch (response.type) {
    case "tokenizer-ready":
      update({ tokenizerReady: "ready" });
      break;
    case "progress":
      if (response.target === "tokenizer" && response.total > 0) {
        update({ tokenizerProgress: response.loaded / response.total });
      } else if (response.target === "model" && response.total > 0) {
        update({ modelProgress: response.loaded / response.total });
      }
      break;
    case "error":
      if (response.target === "tokenizer") {
        update({ tokenizerReady: "failed", tokenizerError: response.message });
      } else {
        update({ modelReady: "failed", modelError: response.message });
      }
      break;
    case "tokenized": {
      const pending = pendingTokenize.get(response.id);
      if (pending) {
        pendingTokenize.delete(response.id);
        pending.resolve(response.spans);
      }
      break;
    }
    case "model-ready":
      update({ modelReady: "ready" });
      break;
    case "embedded": {
      const pending = pendingEmbed.get(response.id);
      if (pending) {
        pendingEmbed.delete(response.id);
        pending.resolve(response.embeddings);
      }
      break;
    }
  }
}

/** Creates the worker on first call and starts both loads. Never terminates it. */
export function ensureWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL("./embedder.worker.ts", import.meta.url), { type: "module" });
  worker.addEventListener("message", handleMessage);

  const loadTokenizer: Request = { type: "load-tokenizer" };
  const loadModel: Request = { type: "load-model" };
  worker.postMessage(loadTokenizer);
  worker.postMessage(loadModel);

  return worker;
}

export function subscribeToEmbedder(onStoreChange: () => void): () => void {
  subscribers.add(onStoreChange);
  return () => {
    subscribers.delete(onStoreChange);
  };
}

export function getEmbedderSnapshot(): EmbedderSnapshot {
  return snapshot;
}

export function getServerEmbedderSnapshot(): EmbedderSnapshot {
  return INITIAL;
}

export function tokenize(text: string): Promise<TokenSpan[]> {
  return new Promise((resolve, reject) => {
    const activeWorker = ensureWorker();
    const id = String(nextRequestId++);
    pendingTokenize.set(id, { resolve, reject });
    const request: Request = { type: "tokenize", id, text };
    activeWorker.postMessage(request);
  });
}

export function embed(texts: string[]): Promise<Embedding[]> {
  return new Promise((resolve, reject) => {
    const activeWorker = ensureWorker();
    const id = String(nextRequestId++);
    pendingEmbed.set(id, { resolve, reject });
    const request: Request = { type: "embed", id, texts };
    activeWorker.postMessage(request);
  });
}
