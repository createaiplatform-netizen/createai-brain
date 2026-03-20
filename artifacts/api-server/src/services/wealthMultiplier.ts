/**
 * wealthMultiplier.ts — Wealth Multiplier Add-On
 * Spec: WEALTH-MULTIPLIER-ADD-ON (Pasted--WEALTH-MULTIPLIER-ADD-ON...)
 *
 * Overlays on top of Ultimate Zero-Touch Launch:
 *  - Real-time growth multipliers per batch, product, and marketplace
 *  - Simulated projected revenue, percentage increase, and cumulative wealth
 *  - Integrated with adaptive engine + hybrid engine
 *  - Autonomous update every 2 minutes (aligned with main cycle)
 *
 * Field-name mapping (spec → actual service):
 *   marketStats.totalRevenue   → hybridStats["Revenue (live)"] (parsed)
 *   marketStats.totalProducts  → marketStats["Total Products"]
 *   marketStats.batchesRun     → marketStats["Cycle Count"]
 *   hybridStats.paymentsQueued → hybridStats["Payments Queued"]
 *   hybridStats.messagesSent   → hybridStats["Messages Sent"]
 *   hybridStats.messagesQueued → hybridStats["Messages Queued"]
 */

import { getMarketStats }     from "./realMarket.js";
import { getHybridStats }     from "./hybridEngine.js";

// ─── Snapshot Type ────────────────────────────────────────────────────────────

export interface WealthSnapshot {
  totalRevenueCents:    number;
  projectedRevenueCents: number;
  growthPercent:        number;
  batches:              number;
  products:             number;
  marketplaces:         number;
  paymentsQueued:       number;
  messagesSent:         number;
  messagesQueued:       number;
  cycleTs:              string;  // ISO timestamp of last cycle
}

// ─── Module State ─────────────────────────────────────────────────────────────

let _snapshot: WealthSnapshot = {
  totalRevenueCents:     0,
  projectedRevenueCents: 0,
  growthPercent:         0,
  batches:               0,
  products:              0,
  marketplaces:          6,  // Shopify · Etsy · WooCommerce · Amazon · eBay · CreativeMarket
  paymentsQueued:        0,
  messagesSent:          0,
  messagesQueued:        0,
  cycleTs:               new Date().toISOString(),
};

let _started = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _parseDollar(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const n = parseFloat((value as string).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

function _calculateMultiplier(baseCents: number, factor: number): number {
  return Math.round(baseCents * factor);
}

// ─── Cycle ────────────────────────────────────────────────────────────────────

async function _runCycle(): Promise<void> {
  try {
    const [marketStats, hybridStats] = await Promise.all([
      getMarketStats(),
      Promise.resolve(getHybridStats()),   // sync, wrapped for symmetry
    ]);

    // Map actual field names to spec intent
    const totalRevenueCents =
      _parseDollar(hybridStats["Revenue (live)"] as string) ||
      _snapshot.totalRevenueCents;

    const products = (marketStats["Total Products"] as number) || _snapshot.products;
    const batches  = (marketStats["Cycle Count"]    as number) || _snapshot.batches;

    const paymentsQueued  = (hybridStats["Payments Queued"]  as number) || 0;
    const messagesSent    = (hybridStats["Messages Sent"]    as number) || 0;
    const messagesQueued  = (hybridStats["Messages Queued"]  as number) || 0;

    // Growth multiplier: 0%–15% per cycle (matches spec)
    const factor = 1 + Math.random() * 0.15;
    const projectedRevenueCents = _calculateMultiplier(totalRevenueCents, factor);
    const growthPercent = +((factor - 1) * 100).toFixed(2);

    _snapshot = {
      totalRevenueCents,
      projectedRevenueCents,
      growthPercent,
      batches,
      products,
      marketplaces:  6,
      paymentsQueued,
      messagesSent,
      messagesQueued,
      cycleTs:       new Date().toISOString(),
    };

    // Console dashboard (spec: console.table format)
    console.log("💹 Live Wealth Multiplier Dashboard");
    console.table({
      "Total Revenue":       `$${(totalRevenueCents     / 100).toFixed(2)}`,
      "Projected Revenue":   `$${(projectedRevenueCents / 100).toFixed(2)}`,
      "Growth % This Cycle": `${growthPercent}%`,
      "Batches Run":         batches,
      "Products Generated":  products,
      "Marketplaces Active": 6,
      "Payments Queued":     paymentsQueued,
      "Messages Sent":       messagesSent,
      "Messages Queued":     messagesQueued,
    });

  } catch (err) {
    console.error("[WealthMultiplier] ❌ Cycle error:", (err as Error).message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Starts the autonomous 2-minute wealth multiplier loop. */
export function startWealthMultiplier(): void {
  if (_started) return;
  _started = true;

  // Run immediately, then every 2 minutes (spec: every 2 * 60_000 ms)
  void _runCycle();
  setInterval(() => void _runCycle(), 2 * 60_000);

  console.log("[WealthMultiplier] 💹 RUNNING — 2-min autonomous cycle");
}

/** Returns the current wealth snapshot (for API routes). */
export function getWealthSnapshot(): WealthSnapshot {
  return { ..._snapshot };
}
