/**
 * platform100Enforcer.ts — Full Platform 100% Enforcement
 * Spec: FULL-PLATFORM-100-ENFORCEMENT
 *
 * Runs every 2 minutes. Ensures maximum operational throughput:
 *   1. Live audit — current state snapshot
 *   2. globalTranscend — max-scale push for all products
 *   3. generatePremiumProducts + autoAdCampaign + optimizeRevenue
 *   4. Trigger Meta Transcendent cycle
 *   5. Final audit confirmation
 *
 * No simulated growth boosts. No fake projections.
 * All operations are real engine actions.
 */

import { getWealthSnapshot }    from "./wealthMultiplier.js";
import { getHybridStats }       from "./hybridEngine.js";
import { runFullAudit }         from "./platformAudit.js";
import { globalTranscend }      from "./realMarket.js";
import {
  generatePremiumProducts,
  autoAdCampaign,
  optimizeRevenue,
}                               from "./wealthTools.js";
import { startMetaTranscendentLaunch } from "./metaTranscend.js";

// ─── Enforcer Stats ───────────────────────────────────────────────────────────

export interface EnforcerStats {
  cycleCount:     number;
  lastCycleTs:    string;
  transcendFires: number;
  premiumBatches: number;
  campaignsFired: number;
  errors:         number;
}

const stats: EnforcerStats = {
  cycleCount:     0,
  lastCycleTs:    "",
  transcendFires: 0,
  premiumBatches: 0,
  campaignsFired: 0,
  errors:         0,
};

// ─── enforce100Percent ────────────────────────────────────────────────────────

export async function enforce100Percent(): Promise<void> {
  stats.cycleCount++;
  stats.lastCycleTs = new Date().toISOString();

  console.log(`[Enforcer100] ⚡ Starting full enforcement cycle #${stats.cycleCount}…`);

  try {
    // 1. Run live audit to get current state
    const audit  = await runFullAudit();
    const wealth = getWealthSnapshot();
    const hybrid = getHybridStats();

    const metrics = {
      products:       audit.products,
      batches:        audit.batches,
      marketplaces:   audit.marketplaces,
      liveRevenue:    audit.liveRevenue,
      paymentsQueued: (hybrid["Payments Queued"] as number) ?? 0,
      messagesQueued: (hybrid["Messages Queued"] as number) ?? 0,
      messagesSent:   (hybrid["Messages Sent"]   as number) ?? 0,
    };

    console.table(metrics);

    // 2. Trigger globalTranscend for max-scale push
    await globalTranscend({ categories: ["all"], batchSize: metrics.products || 1 });
    stats.transcendFires++;
    console.log("[Enforcer100] 🚀 globalTranscend fired for max-scale deployment");

    // 3. Premium products + ad campaigns + revenue optimization
    const premiumProducts = await generatePremiumProducts({ batchSize: 25 });
    await autoAdCampaign(premiumProducts, { channels: "all", budgetScale: "maxROI" });
    await optimizeRevenue(premiumProducts);
    stats.premiumBatches++;
    stats.campaignsFired++;
    console.log("[Enforcer100] 🎯 Premium products, campaigns, and revenue optimization applied");

    // 4. Ensure Meta Transcendent cycle is active (idempotent)
    startMetaTranscendentLaunch();
    console.log("[Enforcer100] ⚡ Meta Transcendent cycle confirmed active");

    // 5. Final audit to confirm current status
    const finalAudit = await runFullAudit();
    console.log("[Enforcer100] ✅ Final audit after enforcement:");
    console.table({
      "Products":       finalAudit.products,
      "Marketplaces":   finalAudit.marketplaces,
      "Revenue (live)": finalAudit.liveRevenue,
      "Market Engine":  finalAudit.status.marketEngine,
      "Hybrid Engine":  finalAudit.status.hybridEngine,
      "Wealth Engine":  finalAudit.status.wealthEngine,
    });

    // Suppress unused variable warning
    void wealth;

    console.log("[Enforcer100] ✅ Full enforcement cycle completed successfully");

  } catch (err) {
    stats.errors++;
    console.error(`[Enforcer100] ❌ Cycle #${stats.cycleCount} failed:`, (err as Error).message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _started = false;

export function startEnforcer(): void {
  if (_started) return;
  _started = true;

  // Stagger after maximizer (which fires at 8 s) — use 12 s
  setTimeout(() => void enforce100Percent(), 12_000);
  setInterval(() => void enforce100Percent(), 2 * 60_000);

  console.log(
    "[Enforcer100] 🔒 FULL PLATFORM ENFORCER ACTIVE — 2-min cycles · all engines targeted"
  );
}

export function getEnforcerStats(): EnforcerStats {
  return { ...stats };
}
