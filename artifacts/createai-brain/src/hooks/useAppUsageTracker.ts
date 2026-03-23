/**
 * useAppUsageTracker — fire-and-forget hook for recording app open events.
 * ─────────────────────────────────────────────────────────────────────────
 * Calls POST /api/app-usage and also logs the activityLog action.
 * Non-blocking — failures are silently swallowed to never interrupt the user.
 *
 * Usage:
 *   const { track } = useAppUsageTracker();
 *   track("strategist", "Business Strategist", "🧠");
 */

import { useCallback } from "react";

interface TrackOptions {
  appId:   string;
  label?:  string;
  icon?:   string;
}

export function useAppUsageTracker() {
  const track = useCallback(({ appId, label, icon }: TrackOptions) => {
    // Fire-and-forget — no await, never throws
    fetch("/api/app-usage", {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ appId, label, icon }),
    }).catch(() => {});
  }, []);

  return { track };
}

/** One-shot version — just call it, no hook needed. */
export function trackAppUsage(appId: string, label?: string, icon?: string) {
  fetch("/api/app-usage", {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ appId, label, icon }),
  }).catch(() => {});
}
