/**
 * ultimateTranscend.ts — Ultimate Zero-Touch Transcendent Launch
 * Spec: ULTIMATE-ZERO-TOUCH-TRANSCENDENT-LAUNCH (Pasted--ULTIMATE-ZERO-TOUCH...)
 *
 * The full orchestration cycle: every 60 s it:
 *   1. Detects trending categories
 *   2. Generates ALL 11 product formats × N categories (with visual assets + dynamic pricing)
 *   3. Publishes the batch to all 6 marketplaces
 *   4. Triggers the Meta Transcendent sub-cycle (ads, optimization, globalTranscend)
 *   5. Enforces 100% wealth growth via wealthMaximizer
 *   6. Fires globalTranscend for the complete batch
 *   7. Logs a full cross-engine dashboard snapshot
 *
 * Key difference from runMetaCycle:
 *   → Uses ALL 11 digital formats (spec's complete list)
 *   → Calls generateVisualAssets + dynamicPrice per product
 *   → Chains meta-cycle + enforceMaxGrowth + globalTranscend in one sequence
 */

import { randomUUID }                          from "crypto";
import { detectTrendingCategories }            from "./trendDetector.js";
import { generateVisualAssets, dynamicPrice }  from "./aiAssetGenerator.js";
import {
  publishToMarketplaces,
  globalTranscend,
  getMarketStats,
  type MarketProduct,
}                                              from "./realMarket.js";
import { getHybridStats }                      from "./hybridEngine.js";
import { getWealthSnapshot }                   from "./wealthMultiplier.js";
import { triggerMetaCycle, getMetaStats }      from "./metaTranscend.js";
import { enforceMaxGrowth, getMaximizerStats } from "./wealthMaximizer.js";
import { getAuditSnapshot }                    from "./platformAudit.js";

// ─── Constants ────────────────────────────────────────────────────────────────

/** All 11 digital product formats from the spec */
const ALL_FORMATS = [
  "ebook", "audiobook", "video", "pdf", "slides",
  "templates", "software", "graphic", "music", "ai-script", "course",
] as const;

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface UltimateStats {
  cycleCount:       number;
  lastCycleTs:      string;
  totalProducts:    number;
  totalFormats:     number;
  totalCategories:  number;
  metaCyclesFired:  number;
  growthEnforced:   number;
  transcendFires:   number;
  errors:           number;
}

const stats: UltimateStats = {
  cycleCount:      0,
  lastCycleTs:     "",
  totalProducts:   0,
  totalFormats:    ALL_FORMATS.length,
  totalCategories: 0,
  metaCyclesFired: 0,
  growthEnforced:  0,
  transcendFires:  0,
  errors:          0,
};

// ─── Ultimate Cycle ───────────────────────────────────────────────────────────

export async function runUltimateCycle(): Promise<void> {
  stats.cycleCount++;
  stats.lastCycleTs = new Date().toISOString();

  console.log(`[UltimateTranscend] 🔥 Ultimate cycle #${stats.cycleCount} — ALL 11 formats × trending niches`);

  try {
    // 1. Detect trending categories (spec: Step 1)
    const categories = detectTrendingCategories(5);
    stats.totalCategories = categories.length;

    // 2. Generate ALL 11 formats × N categories in parallel (spec: Step 2)
    const batch = await Promise.all(
      categories.flatMap(category =>
        ALL_FORMATS.map(async format => {
          const title = `${category} ${format} Solution`;

          // Build a minimal MarketProduct so dynamicPrice + generateVisualAssets can use it
          const product: MarketProduct = {
            id:          randomUUID(),
            name:        title,
            description: `Automated AI-powered ${format} for ${category}. Powered by CreateAI Brain.`,
            price:       19,        // base price $19; dynamicPrice adjusts below
            views:       0,
            sales:       0,
            published:   false,
            createdAt:   new Date(),
            niche:       category,
            format,
          };

          // Attach visual assets and dynamic price (spec: product.assets, product.price)
          product.images    = await generateVisualAssets(title, category);
          product.priceCents = dynamicPrice(product);

          return product;
        })
      )
    );

    console.log(`[UltimateTranscend] 📦 Generated ${batch.length} products (${categories.length} niches × ${ALL_FORMATS.length} formats)`);

    // 3. Publish batch to all marketplaces (spec: Step 3)
    publishToMarketplaces(batch);
    stats.totalProducts += batch.length;

    // 4. Trigger Meta Transcendent sub-cycle (spec: Step 4)
    await triggerMetaCycle();
    stats.metaCyclesFired++;
    console.log("[UltimateTranscend] ⚡ Meta cycle triggered");

    // 5. Enforce 100% wealth growth (spec: Step 5)
    await enforceMaxGrowth();
    stats.growthEnforced++;
    console.log("[UltimateTranscend] 💹 enforceMaxGrowth applied");

    // 6. Fire globalTranscend for the full batch (spec: Step 6)
    await globalTranscend({ categories, batchSize: batch.length });
    stats.transcendFires++;
    console.log("[UltimateTranscend] 🚀 globalTranscend fired");

    // 7. Log full cross-engine dashboard snapshot (spec: Step 7)
    console.table({
      market:    await getMarketStats(),
      hybrid:    getHybridStats(),
      wealth:    getWealthSnapshot(),
      audit:     getAuditSnapshot() ?? "(pending first audit)",
      meta:      getMetaStats(),
      maximizer: getMaximizerStats(),
    });

    console.log(`[UltimateTranscend] ✅ Ultimate cycle #${stats.cycleCount} complete — ${batch.length} products across all channels`);

  } catch (err) {
    stats.errors++;
    console.error(`[UltimateTranscend] ❌ Cycle #${stats.cycleCount} error:`, (err as Error).message);
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

let _started = false;

/**
 * Starts the 1-min ultimate cycle.
 * Fires first at 15 s (after all other engines have settled), then every 60 s.
 * Idempotent — safe to call multiple times.
 */
export function startUltimateLaunch(): void {
  if (_started) return;
  _started = true;

  // Stagger after enforcer (12 s) — use 15 s
  setTimeout(() => void runUltimateCycle(), 15_000);
  setInterval(() => void runUltimateCycle(), 60_000);

  console.log(
    "[UltimateTranscend] 🔥 ULTIMATE ZERO-TOUCH TRANSCENDENT LAUNCH ACTIVE" +
    " — 1-min cycles · 11 formats · all channels · 100% enforced"
  );
}

/** Returns a snapshot of cumulative ultimate-cycle statistics. */
export function getUltimateStats(): UltimateStats {
  return { ...stats };
}
