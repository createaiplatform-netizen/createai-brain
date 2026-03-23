// ─── AppUsageTracker — client-side fire-and-forget usage tracking ────────────
// Call trackAppOpen(appId, label?, icon?) any time an app is launched.
// Posts to /api/activity — non-blocking, silent on failure.

export function trackAppOpen(appId: string, label?: string, icon?: string): void {
  fetch("/api/activity", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action:  "app_open",
      label:   label ?? appId,
      icon:    icon  ?? "📱",
      appId,
    }),
  }).catch(() => { /* silent — never block the UI */ });
}

export function trackPageView(path: string, label?: string): void {
  fetch("/api/activity", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "page_view",
      label:  label ?? path,
      icon:   "🔍",
    }),
  }).catch(() => {});
}

export function trackEvent(action: string, label: string, icon?: string, meta?: Record<string, unknown>): void {
  fetch("/api/activity", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, label, icon: icon ?? "⚡", meta }),
  }).catch(() => {});
}
