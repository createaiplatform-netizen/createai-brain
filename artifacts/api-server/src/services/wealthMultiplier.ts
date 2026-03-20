/**
 * wealthMultiplier.ts — Wealth Tracker
 *
 * Tracks real operational metrics from the market and hybrid engines.
 * No projections. No simulated numbers. Only real data from live systems.
 *
 * Fields:
 *   totalRevenueCents — real Stripe revenue (parsed from hybridStats)
 *   totalBalance      — same, in dollars
 *   batches           — real cycle count from market engine
 *   products          — real product count from market engine
 *   marketplaces      — fixed: 6 configured marketplaces
 *   paymentsQueued    — real queue count from hybrid engine
 *   messagesSent      — real sent count from hybrid engine
 *   messagesQueued    — real queued count from hybrid engine
 *   cycleTs           — ISO timestamp of last cycle
 */

import { getMarketStats }     from "./realMarket.js";
import { getHybridStats }     from "./hybridEngine.js";

// ─── Snapshot Type ────────────────────────────────────────────────────────────

export interface WealthSnapshot {
  totalRevenueCents: number;
  totalBalance:      number;
  batches:           number;
  products:          number;
  marketplaces:      number;
  paymentsQueued:    number;
  messagesSent:      number;
  messagesQueued:    number;
  cycleTs:           string;
}

// ─── Module State ─────────────────────────────────────────────────────────────

let _snapshot: WealthSnapshot = {
  totalRevenueCents: 0,
  totalBalance:      0,
  batches:           0,
  products:          0,
  marketplaces:      6,
  paymentsQueued:    0,
  messagesSent:      0,
  messagesQueued:    0,
  cycleTs:           new Date().toISOString(),
};

let _started = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _parseDollar(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const n = parseFloat((value as string).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

// ─── Cycle ────────────────────────────────────────────────────────────────────

async function _runCycle(): Promise<void> {
  try {
    const [marketStats, hybridStats] = await Promise.all([
      getMarketStats(),
      Promise.resolve(getHybridStats()),
    ]);

    const totalRevenueCents =
      _parseDollar(hybridStats["Revenue (live)"] as string) ||
      _snapshot.totalRevenueCents;

    const products       = (marketStats["Total Products"] as number) || _snapshot.products;
    const batches        = (marketStats["Cycle Count"]    as number) || _snapshot.batches;
    const paymentsQueued = (hybridStats["Payments Queued"]  as number) || 0;
    const messagesSent   = (hybridStats["Messages Sent"]    as number) || 0;
    const messagesQueued = (hybridStats["Messages Queued"]  as number) || 0;
    const totalBalance   = totalRevenueCents / 100;

    _snapshot = {
      totalRevenueCents,
      totalBalance,
      batches,
      products,
      marketplaces:  6,
      paymentsQueued,
      messagesSent,
      messagesQueued,
      cycleTs:       new Date().toISOString(),
    };

    console.log("💹 Wealth Tracker — Real Data Only");
    console.table({
      "Total Revenue":       `$${(totalRevenueCents / 100).toFixed(2)}`,
      "Batches Run":         batches,
      "Products Generated":  products,
      "Marketplaces Active": 6,
      "Payments Queued":     paymentsQueued,
      "Messages Sent":       messagesSent,
      "Messages Queued":     messagesQueued,
    });

  } catch (err) {
    console.error("[WealthTracker] ❌ Cycle error:", (err as Error).message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Starts the autonomous 2-minute wealth tracker loop. */
export function startWealthMultiplier(): void {
  if (_started) return;
  _started = true;
  void _runCycle();
  setInterval(() => void _runCycle(), 2 * 60_000);
  console.log("[WealthMultiplier] 💹 RUNNING — 2-min autonomous cycle");
}

/** Returns the current wealth snapshot (for API routes). */
export function getWealthSnapshot(): WealthSnapshot {
  return { ..._snapshot };
}
