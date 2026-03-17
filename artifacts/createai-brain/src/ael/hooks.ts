/**
 * ael/hooks.ts — Reusable React hooks for async data and abort control
 *
 * These hooks eliminate the three-state (loading / error / data) boilerplate
 * that appears in almost every App component.
 *
 * Usage:
 *   import { useAsyncData, useCancellable } from "@/ael/hooks";
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ─── useAsyncData ────────────────────────────────────────────────────────────

export interface AsyncState<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
  /** Call to manually re-trigger the fetch (e.g. after a mutation). */
  reload:  () => void;
}

/**
 * Runs `fetcher` on mount (and whenever `deps` change), manages
 * loading / error / data state, and cancels in-flight requests on unmount.
 *
 * @example
 *   const { data: user, loading, error } = useAsyncData(() => apiFetch("/api/user/me"), []);
 */
export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
): AsyncState<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetcher(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, reload };
}

// ─── useCancellable ──────────────────────────────────────────────────────────

export interface CancellableHandle {
  /** Current AbortSignal — pass to fetch / streamSSE. */
  signal: AbortSignal;
  /** Create a fresh controller, cancelling any in-flight request first. */
  reset:  () => AbortSignal;
  /** Cancel the current in-flight request (if any). */
  cancel: () => void;
}

/**
 * Manages an AbortController for streaming or long-running requests.
 * Automatically aborts on component unmount.
 *
 * @example
 *   const { signal, reset, cancel } = useCancellable();
 *
 *   const handleRun = async () => {
 *     const sig = reset();          // cancels the previous run, starts fresh
 *     try {
 *       await streamSSE(url, body, onChunk, onDone, sig);
 *     } catch (e) { if (e.name !== "AbortError") setError(e.message); }
 *   };
 */
export function useCancellable(): CancellableHandle {
  const ref = useRef<AbortController>(new AbortController());

  // Cancel on unmount
  useEffect(() => () => ref.current.abort(), []);

  const reset = useCallback((): AbortSignal => {
    ref.current.abort();
    ref.current = new AbortController();
    return ref.current.signal;
  }, []);

  const cancel = useCallback(() => {
    ref.current.abort();
    ref.current = new AbortController(); // ready for next use
  }, []);

  return {
    get signal() { return ref.current.signal; },
    reset,
    cancel,
  };
}
