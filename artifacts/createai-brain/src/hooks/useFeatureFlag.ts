import { useState, useEffect, useCallback } from "react";

type FlagResult = {
  enabled: boolean;
  rollout_pct: number;
  loading: boolean;
  error: string | null;
};

const cache = new Map<string, { enabled: boolean; rollout_pct: number; ts: number }>();
const TTL_MS = 30_000; // 30 second cache

/**
 * useFeatureFlag — React hook for evaluating a platform feature flag.
 *
 * Example:
 *   const { enabled, loading } = useFeatureFlag("intelligence_oracle");
 *   if (!enabled) return <div>Feature not available</div>;
 */
export function useFeatureFlag(flagKey: string): FlagResult {
  const [enabled,     setEnabled]     = useState(false);
  const [rollout_pct, setRolloutPct]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const evaluate = useCallback(async () => {
    if (!flagKey) { setLoading(false); return; }

    // Check cache
    const cached = cache.get(flagKey);
    if (cached && Date.now() - cached.ts < TTL_MS) {
      setEnabled(cached.enabled);
      setRolloutPct(cached.rollout_pct);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`/api/flags/${encodeURIComponent(flagKey)}/evaluate`, {
        credentials: "include",
      });
      if (!r.ok) { setEnabled(false); setError(`HTTP ${r.status}`); setLoading(false); return; }
      const d = await r.json() as { enabled: boolean; rollout_pct: number };
      cache.set(flagKey, { enabled: d.enabled, rollout_pct: d.rollout_pct, ts: Date.now() });
      setEnabled(d.enabled);
      setRolloutPct(d.rollout_pct);
      setError(null);
    } catch (e) {
      setError(String(e));
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [flagKey]);

  useEffect(() => { void evaluate(); }, [evaluate]);

  return { enabled, rollout_pct, loading, error };
}

/**
 * Programmatic flag evaluation (non-hook, for use outside React).
 * Uses the same 30s cache as the hook.
 */
export async function evaluateFlag(flagKey: string): Promise<boolean> {
  const cached = cache.get(flagKey);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.enabled;
  try {
    const r = await fetch(`/api/flags/${encodeURIComponent(flagKey)}/evaluate`, { credentials: "include" });
    if (!r.ok) return false;
    const d = await r.json() as { enabled: boolean; rollout_pct: number };
    cache.set(flagKey, { enabled: d.enabled, rollout_pct: d.rollout_pct, ts: Date.now() });
    return d.enabled;
  } catch { return false; }
}
