"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  embed,
  ensureWorker,
  getEmbedderSnapshot,
  getServerEmbedderSnapshot,
  subscribeToEmbedder,
  tokenize,
} from "./embedderStore";

/**
 * Reads the module-scope embedder (see `embedderStore`). The worker, its
 * readiness, and its pending requests all live outside the React tree so that a
 * remount — which a language switch causes, since the locale segment sits above
 * the tool layout — does not tear down the loaded model (FR-056).
 *
 * `tokenize` and `embed` are module-level and therefore already stable, so
 * callers depending on them in a dependency array never re-run for a new
 * identity.
 */
export function useEmbedder() {
  const snapshot = useSyncExternalStore(
    subscribeToEmbedder,
    getEmbedderSnapshot,
    getServerEmbedderSnapshot,
  );

  // Mounting a tool is what starts the download — not importing this module,
  // which would charge every landing-page visitor 23 MB for a tool they have
  // not opened. Calling it again after the first time is a no-op.
  useEffect(() => {
    ensureWorker();
  }, []);

  return {
    tokenizerReady: snapshot.tokenizerReady,
    tokenizerProgress: snapshot.tokenizerProgress,
    tokenizerError: snapshot.tokenizerError,
    tokenize,
    modelReady: snapshot.modelReady,
    modelProgress: snapshot.modelProgress,
    modelError: snapshot.modelError,
    embed,
  };
}
