// ═══════════════════════════════════════════════════════════════════════════
// useCachedFetch — localStorage-backed API cache with configurable TTL.
// Eliminates redundant network calls on rapid navigation.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";

const PREFIX = "cai_cache_";

interface CacheEntry<T> {
  data:       T;
  fetchedAt:  number;   // unix ms
  ttlMs:      number;
}

function cacheKey(url: string): string {
  // URL-safe base64-lite key (no external deps)
  return PREFIX + url.replace(/[^a-z0-9]/gi, "_").slice(0, 80);
}

function readCache<T>(url: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(cacheKey(url));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch { return null; }
}

function writeCache<T>(url: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { data, fetchedAt: Date.now(), ttlMs };
    localStorage.setItem(cacheKey(url), JSON.stringify(entry));
  } catch { /* quota — silent */ }
}

function isFresh<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.fetchedAt < entry.ttlMs;
}

/**
 * One-shot cached fetch (non-hook). Returns cached data if fresh, else fetches.
 * Useful inside existing useEffect / Promise.all patterns.
 */
export async function cachedFetch<T>(
  url: string,
  ttlMs: number,
  opts?: RequestInit,
): Promise<T | null> {
  const cached = readCache<T>(url);
  if (cached && isFresh(cached)) return cached.data;

  const res = await fetch(url, { credentials: "include", ...opts });
  if (!res.ok) return null;
  const data = await res.json() as T;
  writeCache(url, data, ttlMs);
  return data;
}

/**
 * React hook wrapping cachedFetch. Re-fetches when url changes.
 * Stale data is returned immediately, then refreshed in background.
 */
export function useCachedFetch<T>(
  url: string | null,
  ttlMs: number,
  opts?: RequestInit,
): { data: T | null; loading: boolean; error: boolean; refresh: () => void } {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);
  const optsRef = useRef(opts);

  const load = useCallback(async (forceRefresh = false) => {
    if (!url) return;
    // Serve stale immediately for speed
    const cached = readCache<T>(url);
    if (cached) setData(cached.data);
    if (cached && isFresh(cached) && !forceRefresh) return;

    setLoading(true);
    setError(false);
    try {
      const res  = await fetch(url, { credentials: "include", ...optsRef.current });
      if (!res.ok) { setError(true); return; }
      const fresh = await res.json() as T;
      writeCache(url, fresh, ttlMs);
      setData(fresh);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [url, ttlMs]);

  useEffect(() => { void load(); }, [load]);

  const refresh = useCallback(() => { void load(true); }, [load]);

  return { data, loading, error, refresh };
}

/** Remove all cached entries. */
export function clearAPICache(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
}

/** How old is the cached entry for a URL (ms), or -1 if not cached. */
export function cacheAge(url: string): number {
  const entry = readCache<unknown>(url);
  if (!entry) return -1;
  return Date.now() - entry.fetchedAt;
}
