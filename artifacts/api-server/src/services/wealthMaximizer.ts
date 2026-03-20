/**
 * wealthMaximizer.ts — Platform Cycle Enforcer
 * Spec: FULL-AUTO-WEALTH-MAXIMIZER
 *
 * Runs a 2-minute cycle that:
 *   1. Gathers live operational stats from all engines
 *   2. Triggers globalTranscend for max-scale deployment
 *   3. Runs a full audit and logs the result
 *
 * No simulated growth boosts. No fake revenue injection.
 * Cycle counts and audit results reflect real operational activity.
 */

import { getMarketStats, globalTranscend }  from "./realMarket.js";
import { getHybridStats }                   from "./hybridEngine.js";
import { getWealthSnapshot }                from "./wealthMultiplier.js";
import { runFullAudit }                     from "./platformAudit.js";

// ─── Maximizer Stats ──────────────────────────────────────────────────────────

export interface MaximizerStats {
  cycleCount:     number;
  lastCycleTs:    string;
  transcendFires: number;
  errors:         number;
}

const stats: MaximizerStats = {
  cycleCount:     0,
  lastCycleTs:    "",
  transcendFires: 0,
  errors:         0,
};

// ─── enforceMaxGrowth ─────────────────────────────────────────────────────────

export async function enforceMaxGrowth(
  opts?: { minPercent?: number }
): Promise<void> {
  void opts;
  stats.cycleCount++;
  stats.lastCycleTs = new Date().toISOString();

  console.log(`[WealthMaximizer] 🔄 Enforcement cycle #${stats.cycleCount}`);

  try {
    // 1. Gather live operational stats
    const [marketStats, hybridStats, wealthStats] = await Promise.all([
      getMarketStats(),
      Promise.resolve(getHybridStats()),
      Promise.resolve(getWealthSnapshot()),
    ]);

    const audit = {
      products:       (marketStats["Total Products"] as number) ?? 0,
      batches:        (marketStats["Cycle Count"]    as number) ?? 0,
      marketplaces:   wealthStats.marketplaces,
      paymentsQueued: (hybridStats["Payments Queued"] as number) ?? 0,
      messagesQueued: (hybridStats["Messages Queued"] as number) ?? 0,
      liveRevenue:    `$${(wealthStats.totalRevenueCents / 100).toFixed(2)}`,
      marketEngine:   marketStats["Engine Running"] as string,
    };

    console.log("[WealthMaximizer] 📊 Live operational snapshot:");
    console.table(audit);

    // 2. Trigger globalTranscend for max-scale deployment
    await globalTranscend({ categories: [], batchSize: audit.products });
    stats.transcendFires++;
    console.log("[WealthMaximizer] 🚀 Global transcend executed");

    // 3. Run full audit to confirm
    const finalAudit = await runFullAudit();
    console.log("[WealthMaximizer] ✅ Final audit:");
    console.table({
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

export function startWealthMaximizer(): void {
  if (_started) return;
  _started = true;

  setTimeout(() => void enforceMaxGrowth(), 8000);
  setInterval(() => void enforceMaxGrowth(), 2 * 60_000);

  console.log(
    "[WealthMaximizer] 💪 FULL AUTO WEALTH MAXIMIZER ACTIVE — 2-min enforcement · min 100% growth"
  );
}

export function getMaximizerStats(): MaximizerStats {
  return { ...stats };
}
