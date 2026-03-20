/**
 * platformAudit.ts — Full Platform Audit · Zero-Touch Snapshot
 * Spec: FULL-PLATFORM-AUDIT-ZERO-TOUCH-SNAPSHOT (Pasted--FULL-PLATFORM-AUDIT...)
 *
 * Aggregates live stats from all three engines:
 *   Market Engine   → getMarketStats()
 *   Hybrid Engine   → getHybridStats()
 *   Wealth Engine   → getWealthSnapshot()
 *
 * Field-name mapping (spec → actual):
 *   marketStats.products        → marketStats["Total Products"]
 *   marketStats.batches         → marketStats["Cycle Count"]
 *   marketStats.marketplaces    → wealthStats.marketplaces (always 6)
 *   hybridStats.liveRevenue     → hybridStats["Revenue (live)"]
 *   hybridStats.paymentsQueued  → hybridStats["Payments Queued"]
 *   hybridStats.messagesSent    → hybridStats["Messages Sent"]
 *   hybridStats.messagesQueued  → hybridStats["Messages Queued"]
 *   wealthStats.projectedRevenue → wealthStats.projectedRevenueCents / 100
 *   wealthStats.growthPercent   → wealthStats.growthPercent (number)
 */

import { getMarketStats }    from "./realMarket.js";
import { getHybridStats }    from "./hybridEngine.js";
import { getWealthSnapshot } from "./wealthMultiplier.js";
import { getMetaCycleStats } from "./metaTranscend.js";

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface AuditEngineStatus {
  marketEngine: string;
  hybridEngine: string;
  wealthEngine: string;
}

export interface PlatformAuditResult {
  ts:                string;   // ISO timestamp
  products:          number;
  batches:           number;
  marketplaces:      number;
  liveRevenue:       string;   // "$X.XX"
  paymentsQueued:    number;
  messagesSent:      number;
  messagesQueued:    number;
  projectedRevenue:  string;   // "$X.XX"
  growthPercent:     string;   // "X.XX%"
  campaignReach:     number;   // from metaTranscend cumulative reach
  impressions:       number;   // from metaTranscend cumulative impressions
  status:            AuditEngineStatus;
}

// ─── Module State ─────────────────────────────────────────────────────────────

let _lastResult: PlatformAuditResult | null = null;

// ─── runFullAudit ─────────────────────────────────────────────────────────────

export async function runFullAudit(): Promise<PlatformAuditResult> {
  console.log("[PlatformAudit] 🔍 Running FULL PLATFORM AUDIT…");

  try {
    // 1. Pull all three engines in parallel
    const [marketStats, hybridStats, wealthStats] = await Promise.all([
      getMarketStats(),
      Promise.resolve(getHybridStats()),   // sync, wrapped for symmetry
      Promise.resolve(getWealthSnapshot()),
    ]);

    // 2. Map fields from actual keys to spec intent
    const products       = (marketStats["Total Products"] as number) ?? 0;
    const batches        = (marketStats["Cycle Count"]    as number) ?? 0;
    const marketplaces   = wealthStats.marketplaces;                         // always 6
    const liveRevenue    = (hybridStats["Revenue (live)"] as string) ?? "$0.00";
    const paymentsQueued = (hybridStats["Payments Queued"] as number) ?? 0;
    const messagesSent   = (hybridStats["Messages Sent"]   as number) ?? 0;
    const messagesQueued = (hybridStats["Messages Queued"] as number) ?? 0;
    const projectedRevenue =
      `$${(wealthStats.projectedRevenueCents / 100).toFixed(2)}`;
    const growthPercent = `${wealthStats.growthPercent.toFixed(2)}%`;

    // 3. Compute completion status per engine (spec: Step 4)
    const marketCompletion = products > 0
      ? "✅ 100%"
      : "⚠ 0%";
    const hybridCompletion = paymentsQueued === 0 && messagesQueued === 0
      ? "✅ 100%"
      : "⚠ Partial";
    const wealthCompletion = wealthStats.growthPercent > 0
      ? "✅ 100%"
      : "⚠ 0%";

    // 4. Pull meta-cycle stats for campaign reach / impressions (spec: FULL-PLATFORM-100-ENFORCEMENT)
    const metaStats    = getMetaCycleStats();
    const campaignReach = metaStats.totalCampaignReach;
    const impressions   = metaStats.totalImpressions;

    // 5. Build result
    const result: PlatformAuditResult = {
      ts:               new Date().toISOString(),
      products,
      batches,
      marketplaces,
      liveRevenue,
      paymentsQueued,
      messagesSent,
      messagesQueued,
      projectedRevenue,
      growthPercent,
      campaignReach,
      impressions,
      status: {
        marketEngine: marketCompletion,
        hybridEngine: hybridCompletion,
        wealthEngine: wealthCompletion,
      },
    };

    _lastResult = result;

    // 5. Print full dashboard (spec: Step 6)
    console.table({
      "Products (total)":      products,
      "Batches (total)":       batches,
      "Marketplaces (total)":  marketplaces,
      "Revenue (live)":        liveRevenue,
      "Queued Payments":       paymentsQueued,
      "Messages Sent":         messagesSent,
      "Messages Queued":       messagesQueued,
      "Projected Revenue":     projectedRevenue,
      "Growth %":              growthPercent,
      "Market Engine Status":  marketCompletion,
      "Hybrid Engine Status":  hybridCompletion,
      "Wealth Engine Status":  wealthCompletion,
    });

    console.log("[PlatformAudit] ✅ FULL AUDIT COMPLETE — all engines reported");
    return result;

  } catch (err) {
    console.error("[PlatformAudit] ❌ FULL AUDIT ERROR:", (err as Error).message);
    throw err;
  }
}

// ─── getLastAuditResult ───────────────────────────────────────────────────────

export function getLastAuditResult(): PlatformAuditResult | null {
  return _lastResult;
}

// ─── Spec aliases ─────────────────────────────────────────────────────────────
// These names are used in later specs; they delegate to the canonical functions.

/** Alias for runFullAudit() — spec: FULL-PLATFORM-100-ENFORCEMENT */
export const runLiveAudit = runFullAudit;

/** Alias for getLastAuditResult() — spec: FULL-AUTONOMOUS-TRANSCENDENT-LAUNCH */
export const getAuditSnapshot = getLastAuditResult;

// ─── startPlatformAudit ───────────────────────────────────────────────────────
// Runs once at boot (after all engines have started) to capture the initial
// platform snapshot. Results are available immediately via GET /api/audit/snapshot.

let _started = false;

export function startPlatformAudit(): void {
  if (_started) return;
  _started = true;

  // Delay first run by 3 s to let ZeroTouch + HybridEngine boot fully
  setTimeout(() => {
    void runFullAudit();
  }, 3000);

  console.log("[PlatformAudit] 🔍 Boot audit scheduled — fires in 3 s");
}
