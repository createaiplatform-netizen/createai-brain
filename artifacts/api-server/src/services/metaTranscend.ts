/**
 * metaTranscend.ts — Meta-Zero-Touch Transcendent Launch
 * Spec: META-ZERO-TOUCH-TRANSCENDENT-LAUNCH (Pasted--META-ZERO-TOUCH...)
 *
 * Fully autonomous 1-min meta-cycle:
 *   1. Snapshot all engines (wealth + market)
 *   2. Generate premium batch (25 products)
 *   3. Fire multi-channel ad campaign
 *   4. Optimize revenue per product
 *   5. Trigger globalTranscend for max-scale push
 *
 * "ultimateZeroTouchLaunch" in the spec maps to zeroTouchSuperLaunch(),
 * which is already called at boot from index.ts.  The meta-cycle here is the
 * 1-minute expansion loop that runs on top of it.
 */

import { getWealthSnapshot }                          from "./wealthMultiplier.js";
import { getMarketStats, globalTranscend }            from "./realMarket.js";
import {
  generatePremiumProducts,
  autoAdCampaign,
  optimizeRevenue,
}                                                     from "./wealthTools.js";

// ─── Meta-Cycle Stats ─────────────────────────────────────────────────────────

export interface MetaCycleStats {
  cycleCount:           number;
  lastCycleTs:          string;
  totalPremiumProducts: number;
  transcendFires:       number;
  errors:               number;
}

const stats: MetaCycleStats = {
  cycleCount:           0,
  lastCycleTs:          "",
  totalPremiumProducts: 0,
  transcendFires:       0,
  errors:               0,
};

// ─── Single Cycle ─────────────────────────────────────────────────────────────

async function runMetaCycle(): Promise<void> {
  stats.cycleCount++;
  stats.lastCycleTs = new Date().toISOString();

  console.log(`[MetaTranscend] 🚀 Meta-cycle #${stats.cycleCount} starting…`);

  try {
    // 1. Snapshot all engines
    const [snapshot, marketStats] = await Promise.all([
      Promise.resolve(getWealthSnapshot()),
      getMarketStats(),
    ]);

    console.log("📊 Meta Transcend Dashboard");
    console.table({
      // Wealth snapshot fields (numbers → formatted)
      "Total Revenue":      `$${(snapshot.totalRevenueCents / 100).toFixed(2)}`,
      "Batches":            snapshot.batches,
      "Products":           snapshot.products,
      "Marketplaces":       snapshot.marketplaces,
      "Payments Queued":    snapshot.paymentsQueued,
      "Messages Sent":      snapshot.messagesSent,
      // Market stats
      "Market Products":    marketStats["Total Products"],
      "Market Cycles":      marketStats["Cycle Count"],
      "Engine Running":     marketStats["Engine Running"],
      "Top Product":        marketStats["Top Product"],
    });

    // 2. Generate premium batch
    const premiumBatch = await generatePremiumProducts({ batchSize: 25 });
    stats.totalPremiumProducts += premiumBatch.length;

    // 3. Multi-channel ad campaign
    await autoAdCampaign(premiumBatch, {
      channels:    "all",
      budgetScale: "maxROI",
    });

    // 4. Dynamic revenue optimization
    await optimizeRevenue(premiumBatch);

    // 5. Global transcend — max-scale push for this batch
    const categories = [...new Set(premiumBatch.map(p => p.category))];
    await globalTranscend({ categories, batchSize: premiumBatch.length });
    stats.transcendFires++;

    console.log(
      `[MetaTranscend] ⚡ Meta cycle #${stats.cycleCount} complete — ` +
      `max-scale deployment fired · products:${premiumBatch.length} · transcendFires:${stats.transcendFires}`
    );

  } catch (err) {
    stats.errors++;
    console.error(
      `[MetaTranscend] ❌ Meta cycle #${stats.cycleCount} error:`,
      (err as Error).message
    );
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _started = false;

/**
 * Starts the 1-minute meta-transcendent cycle loop.
 * The first run fires after a 5-second settle delay so ZeroTouch + Hybrid
 * have fully initialized before the meta-layer begins expanding.
 */
export function startMetaTranscendentLaunch(): void {
  if (_started) return;
  _started = true;

  // Slight delay so all boot engines are settled
  setTimeout(() => void runMetaCycle(), 5000);
  setInterval(() => void runMetaCycle(), 60_000);

  console.log(
    "[MetaTranscend] 🌌 META-ZERO-TOUCH TRANSCENDENT LAUNCH ACTIVE — 1-min cycles"
  );
}

/** Returns a snapshot of cumulative meta-cycle statistics. */
export function getMetaCycleStats(): MetaCycleStats {
  return { ...stats };
}

// ─── Spec aliases (ULTIMATE-ZERO-TOUCH-TRANSCENDENT-LAUNCH) ───────────────────

/** Alias for getMetaCycleStats() — spec import name */
export const getMetaStats = getMetaCycleStats;

/** Makes the internal runMetaCycle function callable from the ultimate cycle */
export async function triggerMetaCycle(): Promise<void> {
  return runMetaCycle();
}

// getMetaProjections removed — no projections in this system.
// Only real operational stats are exposed. See getMetaCycleStats().
