/**
 * aiMarketTools.ts — Convenience re-export aggregating all AI market utilities
 * Spec: ULTIMATE-ZERO-TOUCH-TRANSCENDENT-LAUNCH (Pasted--ULTIMATE-ZERO-TOUCH...)
 *
 * The spec imports from "./aiMarketTools" — this module consolidates:
 *   generateVisualAssets  ← aiAssetGenerator.ts
 *   dynamicPrice          ← aiAssetGenerator.ts
 *   detectTrendingCategories ← trendDetector.ts
 *   publishToMarketplaces ← realMarket.ts
 *
 * All underlying implementations already exist; this file is the single import
 * surface the Ultimate cycle uses so callers don't need 4 separate import paths.
 */

export { generateVisualAssets, dynamicPrice } from "./aiAssetGenerator.js";
export { detectTrendingCategories }           from "./trendDetector.js";
export { publishToMarketplaces }              from "./realMarket.js";
