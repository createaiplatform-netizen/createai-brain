/**
 * routes/semanticSEO.ts
 * ---------------------
 * SEO infrastructure for the Semantic Product Layer.
 *
 * GET /api/semantic/bundles — product bundle groupings (same name, multiple formats)
 *
 * Note: sitemap.xml and robots.txt are served at domain root by app.ts
 * (not under /api/) for proper search engine discovery.
 */

import { Router, type Request, type Response } from "express";
import { getRegistry } from "../semantic/registry.js";
import { getPublicBaseUrl } from "../utils/publicUrl.js";

const router = Router();

const STORE_URL = getPublicBaseUrl();

// ── GET /bundles — product bundle groupings ──────────────────────────────────
// Groups products that share the same base name across formats.
// e.g., "AI Writing Assistant" appears as ebook + template + course → a bundle.
router.get("/bundles", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();

    // Detect base product name by stripping format suffix patterns
    const normalize = (title: string): string =>
      title
        .replace(/\s*\([^)]+\)\s*$/, "")  // remove trailing (format) suffix
        .replace(/^AI Solution:\s*/i, "")  // strip "AI Solution:" prefix
        .trim()
        .toLowerCase();

    const groups: Record<string, typeof products> = {};
    products.forEach(p => {
      const key = normalize(p.title);
      if (!groups[key]) groups[key] = [];
      groups[key]!.push(p);
    });

    const bundles = Object.entries(groups)
      .filter(([, prods]) => prods.length >= 2)
      .map(([baseName, prods]) => ({
        baseName: prods[0]!.title.replace(/\s*\([^)]+\)\s*$/, "").replace(/^AI Solution:\s*/i, "").trim(),
        productCount: prods.length,
        formats: prods.map(p => p.format),
        totalBundleValueCents: prods.reduce((s, p) => s + p.priceCents, 0),
        bundleDiscountOpportunity: `Save ${Math.round(prods.length * 0.15 * 100)}% when buying all ${prods.length} formats`,
        products: prods.map(p => ({
          id:         p.id,
          title:      p.title,
          format:     p.format,
          priceCents: p.priceCents,
          pageUrl:    `${STORE_URL}/api/semantic/store/${p.id}`,
        })),
      }))
      .sort((a, b) => b.productCount - a.productCount);

    const totalBundleValue = bundles.reduce((s, b) => s + b.totalBundleValueCents, 0);

    res.json({
      ok: true,
      bundleCount:        bundles.length,
      totalBundleValueUSD: `$${(totalBundleValue / 100).toFixed(2)}`,
      bundles: bundles.slice(0, 30),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

export default router;
