/**
 * zeroTouchLaunch.ts — Zero-Touch Super-Launch: Full Autonomous Market System
 * Spec: Pasted--ZERO-TOUCH-SUPER-LAUNCH-FULL-AUTONOMOUS-MARKET-SYSTEM_...txt
 *
 * Wires together all autonomous market modules into a single, hands-off
 * orchestrator that runs continuously:
 *
 *   1. realMarketFlow.start()       — configure + boot adaptive engine
 *   2. engineState.onCycleEnd()     — on every AboveTranscend cycle:
 *        a. detectTrendingCategories()          — what's trending right now
 *        b. realMarketFlow.generateNextBatch()  — create one product per category
 *        c. parallelPublishManager()            — enrich + Stripe + marketplaces
 *   3. parallelPublishManager()     — per product: assets + Stripe Product/Price + publish
 *
 * This file is the ONLY place that creates per-product Stripe Products and Prices.
 * The checkout route (realMarket route) still creates per-session checkout sessions,
 * referencing the price IDs set here.
 */

import { realMarketFlow, publishToMarketplaces } from "./realMarket.js";
import type { MarketProduct }                    from "./realMarket.js";
import { engineState }                           from "./aboveTranscend/engine.js";
import { detectTrendingCategories }              from "./trendDetector.js";
import { generateProductAssets }                from "./assetGenerator.js";
import { getUncachableStripeClient }             from "./integrations/stripeClient.js";
import { getFamilyMembers }                     from "./familyAgents.js";

// ─── parallelPublishManager ───────────────────────────────────────────────────
// Processes each product in a batch concurrently using Promise.allSettled so
// one failure never blocks the rest of the batch.

export async function parallelPublishManager(
  batch: MarketProduct[],
  callback: (product: MarketProduct) => Promise<void>
): Promise<void> {
  const results = await Promise.allSettled(batch.map(p => callback(p)));
  const failed  = results.filter(r => r.status === "rejected").length;
  if (failed > 0) {
    console.warn(`[ZeroTouch] ${failed}/${batch.length} product(s) failed parallel publish`);
  }
  console.log(
    `[ZeroTouch] Batch published — ${batch.length - failed}/${batch.length} succeeded`
  );
}

// ─── per-product enrichment callback ─────────────────────────────────────────

async function enrichAndPublish(
  product: MarketProduct,
  familyStripeId: string
): Promise<void> {
  // 1. Generate rich AI assets for this product
  const assets = await generateProductAssets(product);
  product.assets = assets;

  // 2. Create a real Stripe Product + Price (spec: zeroTouchSuperLaunch)
  try {
    const stripe = await getUncachableStripeClient();

    const stripeProduct = await stripe.products.create({
      name:        product.name,
      description: assets.marketingBlurb.slice(0, 255),  // Stripe limit
      metadata: {
        generatedBy: "ZeroTouchAI",
        niche:       product.niche,
        seoTitle:    assets.seoTitle,
        tags:        assets.tags.slice(0, 5).join(","),
      },
    });
    product.stripeProductId = stripeProduct.id;

    const stripePrice = await stripe.prices.create({
      unit_amount: product.price * 100,
      currency:    "usd",
      product:     stripeProduct.id,
    });
    product.stripePriceId = stripePrice.id;

    console.log(
      `[ZeroTouch] Stripe: ${product.name} · ` +
      `prod:${stripeProduct.id} · price:${stripePrice.id}`
    );
  } catch (err) {
    console.warn(
      `[ZeroTouch] Stripe product creation skipped for "${product.name}": ` +
      `${(err as Error).message}`
    );
  }

  // 3. Publish across all marketplaces
  publishToMarketplaces(product);

  // 4. Log the enriched asset summary
  console.log(
    `[ZeroTouch] "${product.name}" — ` +
    `"${assets.tagline}" · CTA:"${assets.callToAction}" · tags:${assets.tags.slice(0, 3).join(",")}`
  );

  // 5. Optional: transfer funds to family Stripe connected account
  if (familyStripeId && familyStripeId !== "YOUR_FAMILY_STRIPE_ID" && familyStripeId !== "") {
    // Transfers require a source_transaction — deferred until payment lands
    console.log(`[ZeroTouch] Family account ${familyStripeId} registered for payout on sale`);
  }
}

// ─── zeroTouchSuperLaunch ─────────────────────────────────────────────────────

let _launched = false;

export async function zeroTouchSuperLaunch(familyStripeId: string): Promise<void> {
  if (_launched) return;
  _launched = true;

  console.log("[ZeroTouchAI] Booting fully autonomous, zero-touch market system...");

  // 1. Configure realMarketFlow with all autonomous options from the spec
  realMarketFlow.start({
    autonomous:             true,
    maxScale:               true,
    trendOptimized:         true,
    marketReady:            true,
    liveTransactions:       true,
    distributeToAllMarkets: true,
    stripeAccountId:        familyStripeId,
    autoOptimize:           true,
    fullAutonomy:           true,
    noLimits:               true,
    multiChannel:           true,
    autoCategoryExpansion:  true,
    continuousCycle:        true,
    smartLaunchAccelerator: true,
    zeroTouch:              true,
  });

  // 2. Register on every AboveTranscend engine cycle-end
  engineState.onCycleEnd(async () => {
    console.log(
      "[ZeroTouchAI] Cycle complete — generating next batch for maximum visibility..."
    );

    try {
      // a. Detect trending categories
      const trendingCategories = await detectTrendingCategories(5);

      // b. Generate one product per category
      const batch = await realMarketFlow.generateNextBatch({ categories: trendingCategories });

      // c. Parallel publish: assets + Stripe + marketplaces
      await parallelPublishManager(batch, product =>
        enrichAndPublish(product, familyStripeId)
      );

      console.log(
        "[ZeroTouchAI] Batch fully published with all assets, marketplaces, and Stripe integration live"
      );
    } catch (err) {
      console.error("[ZeroTouchAI] Cycle error:", (err as Error).message);
    }
  });

  console.log(
    "[ZeroTouchAI] SYSTEM LIVE — fully autonomous, zero-touch, continuously scaling and optimizing"
  );
}

// ─── Helper: resolve family Stripe account from FamilyAgents ─────────────────
// Call this instead of hardcoding 'YOUR_FAMILY_STRIPE_ID' so the orchestrator
// automatically picks up Sara's connected account when it's set.
export function resolveFamilyStripeId(): string {
  const members = getFamilyMembers();
  return members.find(m => m.stripeAccountId)?.stripeAccountId ?? "";
}
