/**
 * useUltraInteractionEngine.ts
 * Spec: ULTRA-GLOBAL-ZERO-LIMIT-PLATFORM-ENGINE
 *
 * Attaches throttled browser event listeners (click, mouseover, scroll,
 * keydown, touchstart) that fire a POST to /api/ultra/interaction.
 * Each interaction contributes micro-revenue ($5–$15), triggers the meta
 * cycle (server-side throttled to 1/min), enforces 100%+ growth, and logs
 * the full platform snapshot to the console.
 *
 * Throttle: at most one API call per 5 s per event TYPE to avoid
 * hammering the server on rapid mouse/scroll activity.
 */

import { useEffect } from "react";

interface InteractionEvent {
  type:    string;
  userId?: string;
  target?: string;
}

const THROTTLE_PER_TYPE_MS = 5_000; // 5 s per event type
const _lastFiredTs: Record<string, number> = {};

async function fireInteraction(event: InteractionEvent): Promise<void> {
  const now = Date.now();
  const last = _lastFiredTs[event.type] ?? 0;
  if (now - last < THROTTLE_PER_TYPE_MS) return;
  _lastFiredTs[event.type] = now;

  try {
    const res = await fetch("/api/ultra/interaction", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(event),
    });

    if (!res.ok) return;
    const data = await res.json();

    const { microRevenue, energyCredit, projections } = data;
    console.log(
      `⚡ [UltraEngine] ${event.type} · Revenue +${microRevenue} · ` +
      `Energy ${energyCredit} kWh · ` +
      `Min/day ${projections ? `$${projections.minRevenuePerDay}` : "—"}`
    );
  } catch {
    // Silent — never interrupt the user
  }
}

/**
 * Hook — attach once at the App root.
 * Pass userId so every interaction is attributed correctly.
 */
export function useUltraInteractionEngine(userId?: string) {
  useEffect(() => {
    const EVENTS = ["click", "mouseover", "scroll", "keydown", "touchstart"] as const;

    const handlers: Array<[string, EventListener]> = EVENTS.map(evtName => {
      const handler: EventListener = (e) => {
        const el = e.target as HTMLElement | null;
        const target =
          el?.id ||
          (el?.className && typeof el.className === "string"
            ? el.className.split(" ")[0]
            : undefined) ||
          el?.tagName?.toLowerCase() ||
          "unknown";
        fireInteraction({ type: evtName, userId, target });
      };
      document.addEventListener(evtName, handler, { passive: true });
      return [evtName, handler];
    });

    console.log(
      "✅ UltraInteractionEngine live — all interactions now contribute to revenue, " +
      "energy credits, products, and 100%+ growth"
    );

    return () => {
      handlers.forEach(([evtName, handler]) => {
        document.removeEventListener(evtName, handler);
      });
    };
  }, [userId]);
}
