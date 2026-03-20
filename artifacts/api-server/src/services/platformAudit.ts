/**
 * platformAudit.ts — Full Platform Audit · Real Data Snapshot
 * Spec: FULL-PLATFORM-AUDIT-ZERO-TOUCH-SNAPSHOT
 *
 * Aggregates live stats from all three engines:
 *   Market Engine   → getMarketStats()
 *   Hybrid Engine   → getHybridStats()
 *   Wealth Engine   → getWealthSnapshot()
 *
 * All fields are real operational data. No projections. No simulated values.
 */

import { getMarketStats }    from "./realMarket.js";
import { getHybridStats }    from "./hybridEngine.js";
import { getWealthSnapshot } from "./wealthMultiplier.js";

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface AuditEngineStatus {
  marketEngine: string;
  hybridEngine: string;
  wealthEngine: string;
}

export interface PlatformAuditResult {
  ts:             string;
  products:       number;
  batches:        number;
  marketplaces:   number;
  liveRevenue:    string;
  paymentsQueued: number;
  messagesSent:   number;
  messagesQueued: number;
  status:         AuditEngineStatus;
}

// ─── Module State ─────────────────────────────────────────────────────────────

let _lastResult: PlatformAuditResult | null = null;

// ─── runFullAudit ─────────────────────────────────────────────────────────────

export async function runFullAudit(): Promise<PlatformAuditResult> {
  console.log("[PlatformAudit] 🔍 Running FULL PLATFORM AUDIT…");

  try {
    const [marketStats, hybridStats, wealthStats] = await Promise.all([
      getMarketStats(),
      Promise.resolve(getHybridStats()),
      Promise.resolve(getWealthSnapshot()),
    ]);

    const products       = (marketStats["Total Products"] as number) ?? 0;
    const batches        = (marketStats["Cycle Count"]    as number) ?? 0;
    const marketplaces   = wealthStats.marketplaces;
    const liveRevenue    = (hybridStats["Revenue (live)"] as string) ?? "$0.00";
    const paymentsQueued = (hybridStats["Payments Queued"] as number) ?? 0;
    const messagesSent   = (hybridStats["Messages Sent"]   as number) ?? 0;
    const messagesQueued = (hybridStats["Messages Queued"] as number) ?? 0;

    const marketCompletion = products > 0  ? "✅ Running" : "⚠ 0 products";
    const hybridCompletion = paymentsQueued === 0 && messagesQueued === 0
      ? "✅ Queue clear"
      : "⚠ Items queued";
    const wealthCompletion = wealthStats.totalRevenueCents > 0
      ? "✅ Revenue recorded"
      : "⏳ No revenue yet";

    const result: PlatformAuditResult = {
      ts: new Date().toISOString(),
      products,
      batches,
      marketplaces,
      liveRevenue,
      paymentsQueued,
      messagesSent,
      messagesQueued,
      status: {
        marketEngine: marketCompletion,
        hybridEngine: hybridCompletion,
        wealthEngine: wealthCompletion,
      },
    };

    _lastResult = result;

    console.table({
      "Products (total)":     products,
      "Batches (total)":      batches,
      "Marketplaces (total)": marketplaces,
      "Revenue (live)":       liveRevenue,
      "Queued Payments":      paymentsQueued,
      "Messages Sent":        messagesSent,
      "Messages Queued":      messagesQueued,
      "Market Engine":        marketCompletion,
      "Hybrid Engine":        hybridCompletion,
      "Wealth Engine":        wealthCompletion,
    });

    console.log("[PlatformAudit] ✅ FULL AUDIT COMPLETE — all engines reported");
    return result;

  } catch (err) {
    console.error("[PlatformAudit] ❌ FULL AUDIT ERROR:", (err as Error).message);
    throw err;
  }
}

export function getLastAuditResult(): PlatformAuditResult | null {
  return _lastResult;
}

export const runLiveAudit    = runFullAudit;
export const getAuditSnapshot = getLastAuditResult;

let _started = false;

export function startPlatformAudit(): void {
  if (_started) return;
  _started = true;
  setTimeout(() => { void runFullAudit(); }, 3000);
  console.log("[PlatformAudit] 🔍 Boot audit scheduled — fires in 3 s");
}
