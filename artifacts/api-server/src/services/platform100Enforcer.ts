/**
 * platform100Enforcer.ts — Full Platform 100% Enforcement
 * Spec: FULL-PLATFORM-100-ENFORCEMENT (Pasted--FULL-PLATFORM-100-ENFORCEMENT...)
 *
 * Runs every 2 minutes. Ensures every tracked metric reaches target:
 *   1. Live audit — current state snapshot
 *   2. Apply growth multiplier boost if growthPercent < 100
 *   3. globalTranscend — max-scale push for all products
 *   4. generatePremiumProducts + autoAdCampaign + optimizeRevenue
 *   5. Trigger Meta Transcendent cycle
 *   6. Final audit confirmation
 *
 * Field-name mapping (spec → actual):
 *   hybrid.paymentsQueued → hybridStats["Payments Queued"]
 *   hybrid.messagesQueued → hybridStats["Messages Queued"]
 *   hybrid.messagesSent   → hybridStats["Messages Sent"]
 *   audit.campaignReach   → metaStats.totalCampaignReach
 *   audit.impressions     → metaStats.totalImpressions
 */

import { getWealthSnapshot, applyGrowthMultiplier } from "./wealthMultiplier.js";
import { getHybridStats }                           from "./hybridEngine.js";
import { runFullAudit }                             from "./platformAudit.js";
import { globalTranscend }                          from "./realMarket.js";
import {
  generatePremiumProducts,
  autoAdCampaign,
  optimizeRevenue,
}                                                   from "./wealthTools.js";
import { startMetaTranscendentLaunch, getMetaCycleStats } from "./metaTranscend.js";

// ─── Enforcer Stats ───────────────────────────────────────────────────────────

export interface EnforcerStats {
  cycleCount:      number;
  lastCycleTs:     string;
  growthBoosts:    number;
  transcendFires:  number;
  premiumBatches:  number;
  campaignsFired:  number;
  errors:          number;
}

const stats: EnforcerStats = {
  cycleCount:     0,
  lastCycleTs:    "",
  growthBoosts:   0,
  transcendFires: 0,
  premiumBatches: 0,
  campaignsFired: 0,
  errors:         0,
};

// ─── enforce100Percent ────────────────────────────────────────────────────────

export async function enforce100Percent(): Promise<void> {
  stats.cycleCount++;
  stats.lastCycleTs = new Date().toISOString();

  console.log(`[Enforcer100] ⚡ Starting full 100% enforcement cycle #${stats.cycleCount}…`);

  try {
    // 1. Run live audit to get current state (spec: Step 1)
    const audit  = await runFullAudit();
    const wealth = getWealthSnapshot();
    const hybrid = getHybridStats();
    const meta   = getMetaCycleStats();

    // 2. Calculate deficits per metric (spec: Step 2)
    const metrics = {
      products:        audit.products,
      batches:         audit.batches,
      marketplaces:    audit.marketplaces,
      liveRevenue:     parseFloat(audit.liveRevenue.replace(/[$,]/g, "")),
      growthPercent:   parseFloat(audit.growthPercent),
      paymentsQueued:  (hybrid["Payments Queued"] as number) ?? 0,
      messagesQueued:  (hybrid["Messages Queued"] as number) ?? 0,
      messagesSent:    (hybrid["Messages Sent"]   as number) ?? 0,
      campaignReach:   meta.totalCampaignReach,
      impressions:     meta.totalImpressions,
    };

    console.table(metrics);

    // 3. Apply growth multiplier to reach 100% (spec: Step 3)
    const deficit = 100 - metrics.growthPercent;
    if (deficit > 0) {
      console.log(`[Enforcer100] 💹 Applying growth boost: +${deficit.toFixed(2)}pp`);
      applyGrowthMultiplier(deficit);
      stats.growthBoosts++;
    } else {
      console.log(
        `[Enforcer100] ✅ Growth already at ${metrics.growthPercent.toFixed(2)}% — no boost needed`
      );
    }

    // 4. Trigger globalTranscend for max-scale push (spec: Step 4)
    await globalTranscend({ categories: ["all"], batchSize: metrics.products });
    stats.transcendFires++;
    console.log("[Enforcer100] 🚀 globalTranscend fired for max-scale deployment");

    // 5. Premium products + ad campaigns + revenue optimization (spec: Step 5)
    const premiumProducts = await generatePremiumProducts({ batchSize: 25 });
    await autoAdCampaign(premiumProducts, { channels: "all", budgetScale: "maxROI" });
    await optimizeRevenue(premiumProducts);
    stats.premiumBatches++;
    stats.campaignsFired++;
    console.log("[Enforcer100] 🎯 Premium products, campaigns, and revenue optimization applied");

    // 6. Ensure Meta Transcendent cycle is active (spec: Step 6)
    startMetaTranscendentLaunch();  // idempotent — no-op if already running
    console.log("[Enforcer100] ⚡ Meta Transcendent cycle confirmed active");

    // 7. Final audit to confirm 100% status (spec: Step 7)
    const finalAudit = await runFullAudit();
    console.log("[Enforcer100] ✅ Final audit after enforcement:");
    console.table({
      "Growth %":       finalAudit.growthPercent,
      "Products":       finalAudit.products,
      "Marketplaces":   finalAudit.marketplaces,
      "Revenue (live)": finalAudit.liveRevenue,
      "Market Engine":  finalAudit.status.marketEngine,
      "Hybrid Engine":  finalAudit.status.hybridEngine,
      "Wealth Engine":  finalAudit.status.wealthEngine,
    });

    console.log("[Enforcer100] ✅ Full 100% enforcement cycle completed successfully");

  } catch (err) {
    stats.errors++;
    console.error(`[Enforcer100] ❌ Cycle #${stats.cycleCount} failed:`, (err as Error).message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _started = false;

/**
 * Starts the 2-minute full-platform 100% enforcement loop.
 * Fires immediately, then repeats every 2 minutes.
 */
export function startEnforcer(): void {
  if (_started) return;
  _started = true;

  // Stagger after maximizer (which fires at 8 s) — use 12 s
  setTimeout(() => void enforce100Percent(), 12_000);
  setInterval(() => void enforce100Percent(), 2 * 60_000);

  console.log(
    "[Enforcer100] 🔒 FULL PLATFORM 100% ENFORCER ACTIVE — 2-min cycles · all metrics targeted"
  );
}

/** Returns cumulative enforcer statistics. */
export function getEnforcerStats(): EnforcerStats {
  return { ...stats };
}
