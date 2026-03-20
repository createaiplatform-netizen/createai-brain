/**
 * wealthMaximizer.ts — Full Auto Wealth Maximizer
 * Spec: FULL-AUTO-WEALTH-MAXIMIZER (Pasted--FULL-AUTO-WEALTH-MAXIMIZER...)
 *
 * Enforces minimum 100% growthPercent every 2 minutes:
 *   1. Gather live stats from all three engines
 *   2. If growthPercent < 100, inject boost via applyGrowthMultiplier()
 *   3. Trigger globalTranscend for max-scale deployment
 *   4. Run full platform audit to confirm
 *
 * Field-name mapping (spec → actual):
 *   marketStats.totalProducts     → marketStats["Total Products"]
 *   marketStats.batches           → marketStats["Cycle Count"]
 *   hybridStats.paymentsQueued    → hybridStats["Payments Queued"]
 *   hybridStats.messagesQueued    → hybridStats["Messages Queued"]
 *   wealthStats.totalRevenue      → wealthStats.totalRevenueCents / 100
 *   wealthStats.growthPercent     → wealthStats.growthPercent (number)
 *   runAudit                      → runFullAudit
 */

import { getMarketStats, globalTranscend }  from "./realMarket.js";
import { getHybridStats }                   from "./hybridEngine.js";
import { getWealthSnapshot, applyGrowthMultiplier } from "./wealthMultiplier.js";
import { runFullAudit }                     from "./platformAudit.js";

// ─── Maximizer Stats ──────────────────────────────────────────────────────────

export interface MaximizerStats {
  cycleCount:    number;
  lastCycleTs:   string;
  boostsApplied: number;
  totalBoostPct: number;   // cumulative pp added across all cycles
  transcendFires: number;
  errors:        number;
  lastGrowthPct: number;
}

const stats: MaximizerStats = {
  cycleCount:    0,
  lastCycleTs:   "",
  boostsApplied: 0,
  totalBoostPct: 0,
  transcendFires: 0,
  errors:        0,
  lastGrowthPct: 0,
};

// ─── enforceMaxGrowth ─────────────────────────────────────────────────────────

// Spec: ultimateColdBoxEnergyLaunch — optional minPercent param accepted;
// the engine always enforces 100%+ regardless, so this is additive metadata.
export async function enforceMaxGrowth(
  opts?: { minPercent?: number }
): Promise<void> {
  void opts; // minPercent is noted; engine already enforces ≥100% by design
  stats.cycleCount++;
  stats.lastCycleTs = new Date().toISOString();

  console.log(`[WealthMaximizer] 🔄 Enforcement cycle #${stats.cycleCount}`);

  try {
    // 1. Gather live stats (spec: Step 1)
    const [marketStats, hybridStats, wealthStats] = await Promise.all([
      getMarketStats(),
      Promise.resolve(getHybridStats()),
      Promise.resolve(getWealthSnapshot()),
    ]);

    // 2. Aggregate into unified audit view (spec: Step 2)
    const audit = {
      products:       (marketStats["Total Products"] as number) ?? 0,
      batches:        (marketStats["Cycle Count"]    as number) ?? 0,
      marketplaces:   wealthStats.marketplaces,
      paymentsQueued: (hybridStats["Payments Queued"] as number) ?? 0,
      messagesQueued: (hybridStats["Messages Queued"] as number) ?? 0,
      liveRevenue:    `$${(wealthStats.totalRevenueCents / 100).toFixed(2)}`,
      growthPercent:  wealthStats.growthPercent,
      marketEngine:   marketStats["Engine Running"] as string,
      hybridRailStripe: hybridStats["Rail: Stripe"]  as string,
    };

    console.log("[WealthMaximizer] 📊 Live audit snapshot:");
    console.table(audit);

    stats.lastGrowthPct = audit.growthPercent;

    // 3. Enforce 100% minimum growth (spec: Step 3)
    if (audit.growthPercent < 100) {
      const boost = +(100 - audit.growthPercent).toFixed(4);
      applyGrowthMultiplier(boost);
      stats.boostsApplied++;
      stats.totalBoostPct = +(stats.totalBoostPct + boost).toFixed(4);
      console.log(
        `[WealthMaximizer] ⚡ Growth multiplier applied: +${boost.toFixed(2)}% → target 100% achieved`
      );
    } else {
      console.log(
        `[WealthMaximizer] ✅ Growth already ≥ 100% (${audit.growthPercent.toFixed(2)}%) — no boost needed`
      );
    }

    // 4. Trigger globalTranscend for max-scale deployment (spec: Step 4)
    await globalTranscend({ categories: [], batchSize: audit.products });
    stats.transcendFires++;
    console.log("[WealthMaximizer] 🚀 Global transcend executed — max-scale deployment active");

    // 5. Run full audit to confirm (spec: Step 5)
    const finalAudit = await runFullAudit();
    console.log("[WealthMaximizer] ✅ Final audit after enforcement:");
    console.table({
      "Growth %":       finalAudit.growthPercent,
      "Products":       finalAudit.products,
      "Batches":        finalAudit.batches,
      "Revenue (live)": finalAudit.liveRevenue,
      "Market Engine":  finalAudit.status.marketEngine,
      "Hybrid Engine":  finalAudit.status.hybridEngine,
      "Wealth Engine":  finalAudit.status.wealthEngine,
    });

  } catch (err) {
    stats.errors++;
    console.error(
      `[WealthMaximizer] ❌ Enforcement cycle #${stats.cycleCount} error:`,
      (err as Error).message
    );
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _started = false;

/**
 * Starts the 2-minute wealth maximizer loop.
 * Runs immediately, then every 2 minutes (aligned with wealthMultiplier cycle).
 */
export function startWealthMaximizer(): void {
  if (_started) return;
  _started = true;

  // Small stagger so it fires after wealthMultiplier's first cycle completes
  setTimeout(() => void enforceMaxGrowth(), 8000);
  setInterval(() => void enforceMaxGrowth(), 2 * 60_000);

  console.log(
    "[WealthMaximizer] 💪 FULL AUTO WEALTH MAXIMIZER ACTIVE — 2-min enforcement · min 100% growth"
  );
}

/** Returns cumulative maximizer statistics for the API route. */
export function getMaximizerStats(): MaximizerStats {
  return { ...stats };
}
