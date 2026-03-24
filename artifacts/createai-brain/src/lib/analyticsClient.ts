// src/lib/analyticsClient.ts
// Fire-and-forget analytics — never throws, never blocks the UI.

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export async function trackAnalyticsEvent(params: {
  route: string;
  event_type: "view" | "click";
  metadata?: Record<string, unknown>;
  user_id?: string;
}): Promise<void> {
  try {
    await fetch(`${BASE}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    // silent — analytics must never break the UI
  }
}
