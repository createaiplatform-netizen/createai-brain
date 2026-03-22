import { useState, useEffect } from "react";
import type { AppRole } from "@/lib/roles";

export interface UserRoleState {
  role: AppRole | null;
  isLoading: boolean;
}

// Module-level cache so we only hit the API once per session
let _cachedRole: AppRole | null = null;
let _cacheTime = 0;
let _pending: Promise<AppRole | null> | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchRole(): Promise<AppRole | null> {
  if (_cachedRole !== null && Date.now() - _cacheTime < CACHE_TTL) {
    return _cachedRole;
  }
  if (_pending) return _pending;

  _pending = fetch("/api/auth/role", { credentials: "include" })
    .then(r => r.json())
    .then((data: { role: AppRole | null }) => {
      _cachedRole = data.role ?? null;
      _cacheTime = Date.now();
      _pending = null;
      return _cachedRole;
    })
    .catch(() => {
      _pending = null;
      return null;
    });

  return _pending;
}

// Clear the cache when needed (e.g., after role assignment)
export function clearRoleCache(): void {
  _cachedRole = null;
  _cacheTime = 0;
  _pending = null;
}

export function useUserRole(): UserRoleState {
  const [role, setRole] = useState<AppRole | null>(_cachedRole);
  const [isLoading, setIsLoading] = useState(_cachedRole === null);

  useEffect(() => {
    let cancelled = false;
    fetchRole().then(r => {
      if (!cancelled) {
        setRole(r);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { role, isLoading };
}
