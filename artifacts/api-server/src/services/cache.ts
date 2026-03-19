// ─────────────────────────────────────────────────────────────────────────────
// In-process TTL Cache — lightweight key/value store with per-entry expiry.
// No external dependencies; clears on server restart.
// Suitable for caching read-heavy DB queries (project lists, templates, etc.)
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value:     T;
  expiresAt: number;
}

class TTLCache {
  private _store = new Map<string, CacheEntry<unknown>>();

  /**
   * Get a value from cache. Returns undefined if missing or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this._store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Set a value with a TTL in milliseconds (default: 30 s).
   */
  set<T>(key: string, value: T, ttlMs = 30_000): void {
    // Evict oldest entry if store is getting large (>500 keys)
    if (this._store.size >= 500) {
      const oldest = this._store.keys().next().value;
      if (oldest) this._store.delete(oldest);
    }
    this._store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Delete a specific key (call after mutations to keep data fresh).
   */
  del(key: string): void {
    this._store.delete(key);
  }

  /**
   * Delete all keys that start with a given prefix.
   * Useful for invalidating a whole namespace (e.g. "projects:userId:*").
   */
  delPrefix(prefix: string): void {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) this._store.delete(key);
    }
  }

  /**
   * Return cache stats for observability.
   */
  stats(): { size: number; keys: string[] } {
    // Prune expired entries first
    const now = Date.now();
    for (const [k, e] of this._store.entries()) {
      if (now > e.expiresAt) this._store.delete(k);
    }
    return { size: this._store.size, keys: [...this._store.keys()] };
  }

  /**
   * Clear everything (useful in tests or on admin reset).
   */
  clear(): void {
    this._store.clear();
  }
}

// Module-level singleton — shared across all route handlers in this process.
export const cache = new TTLCache();
