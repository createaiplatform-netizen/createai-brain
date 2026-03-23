// ═══════════════════════════════════════════════════════════════════════════
// useSessionGuard — Global 401 interceptor for the OS shell.
//
// Patches window.fetch exactly once (singleton). Any 401 from the API fires
// a "cai:session-expired" CustomEvent. Components call useSessionGuard() to
// react: show a banner, redirect to login, or run a custom callback.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useCallback } from "react";

const EVENT = "cai:session-expired";
let _patched = false;

// ── Singleton fetch patch ──────────────────────────────────────────────────
// Installed once, the moment any component mounts useSessionGuard.
function installFetchInterceptor() {
  if (_patched || typeof window === "undefined") return;
  _patched = true;

  const _native = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const res = await _native(...args);

    if (res.status === 401) {
      // Clone so the caller can still read the body if they want.
      const url = typeof args[0] === "string"
        ? args[0]
        : args[0] instanceof Request ? args[0].url : String(args[0]);

      // Skip auth-check endpoints themselves to avoid infinite loops.
      const isAuthEndpoint = url.includes("/api/auth") || url.includes("/login");
      if (!isAuthEndpoint) {
        window.dispatchEvent(new CustomEvent(EVENT, { detail: { url } }));
      }
    }

    return res;
  };

  console.log("[SessionGuard] Fetch interceptor installed");
}

// ── Hook ──────────────────────────────────────────────────────────────────
interface SessionGuardOptions {
  /** Called when a 401 is detected. Defaults to redirect to /login. */
  onExpired?: (detail: { url: string }) => void;
  /** If true, auto-redirect to /login. Default: true. */
  autoRedirect?: boolean;
}

export function useSessionGuard(options: SessionGuardOptions = {}) {
  const { onExpired, autoRedirect = true } = options;

  const handleExpired = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent<{ url: string }>).detail ?? { url: "" };

      if (onExpired) {
        onExpired(detail);
        return;
      }

      if (autoRedirect) {
        // Preserve the current path so we can redirect back after re-auth.
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnTo=${returnTo}`;
      }
    },
    [onExpired, autoRedirect],
  );

  useEffect(() => {
    installFetchInterceptor();
    window.addEventListener(EVENT, handleExpired);
    return () => window.removeEventListener(EVENT, handleExpired);
  }, [handleExpired]);
}
