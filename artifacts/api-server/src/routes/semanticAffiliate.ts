/**
 * routes/semanticAffiliate.ts
 * ---------------------------
 * Affiliate and referral link system for the Semantic Product Layer.
 *
 * POST /api/semantic/affiliate/links       — generate affiliate link for a product (or the whole store)
 * GET  /api/semantic/affiliate/links       — list all generated affiliate links
 * GET  /api/semantic/affiliate/track       — record a click (called when ?ref= parameter is present)
 * GET  /api/semantic/affiliate/stats       — aggregate affiliate performance stats
 *
 * Architecture: in-memory. Every generated link gets a unique code (e.g. SARA-A1B2C3D4).
 * Commission calculation is the next layer — currently tracks attribution for manual payout.
 *
 * UTM convention injected into every link:
 *   utm_source=affiliate&utm_medium=referral&utm_campaign={code}&utm_content={productId}
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { getRegistry, getFromRegistry } from "../semantic/registry.js";

const router = Router();

// ── Types ─────────────────────────────────────────────────────────────────────

interface AffiliateLink {
  id: string;
  code: string;
  affiliateName: string;
  affiliateEmail: string;
  productId: string | null;
  productTitle: string | null;
  url: string;
  clicks: number;
  conversions: number;
  estimatedRevenueCents: number;
  createdAt: string;
  lastClickAt?: string;
}

interface ClickEvent {
  code: string;
  productId: string | null;
  referrer: string;
  userAgent: string;
  recordedAt: string;
}

const _links: AffiliateLink[] = [];
const _clicks: ClickEvent[]   = [];

const STORE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://localhost:8080";

function generateCode(): string {
  return "SARA-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function buildAffiliateUrl(code: string, productId: string | null, storeUrl: string): string {
  const base = productId
    ? `${storeUrl}/api/semantic/store/${productId}`
    : `${storeUrl}/api/semantic/store`;

  const params = new URLSearchParams({
    ref:          code,
    utm_source:   "affiliate",
    utm_medium:   "referral",
    utm_campaign: code,
  });
  if (productId) params.set("utm_content", productId);

  return `${base}?${params.toString()}`;
}

// ── POST /links — generate affiliate link ─────────────────────────────────────
router.post("/links", async (req: Request, res: Response) => {
  try {
    const { affiliateName, affiliateEmail, productId } = req.body as {
      affiliateName?: string;
      affiliateEmail?: string;
      productId?: string;
    };

    const name  = String(affiliateName ?? "Affiliate").trim();
    const email = String(affiliateEmail ?? "").trim();

    let resolvedProductId: string | null = null;
    let resolvedProductTitle: string | null = null;

    if (productId) {
      await getRegistry();
      const product = getFromRegistry(String(productId));
      if (!product) {
        res.status(404).json({ ok: false, error: `Product ${productId} not found in registry` });
        return;
      }
      resolvedProductId    = product.id;
      resolvedProductTitle = product.title;
    }

    const code = generateCode();
    const url  = buildAffiliateUrl(code, resolvedProductId, STORE_URL);

    const link: AffiliateLink = {
      id:                    crypto.randomUUID(),
      code,
      affiliateName:         name,
      affiliateEmail:        email,
      productId:             resolvedProductId,
      productTitle:          resolvedProductTitle,
      url,
      clicks:                0,
      conversions:           0,
      estimatedRevenueCents: 0,
      createdAt:             new Date().toISOString(),
    };

    _links.push(link);
    console.log(`[Affiliate] Link generated: ${code} → ${name} (${email}) → ${url}`);

    res.json({
      ok: true,
      link,
      instructions: {
        shareUrl: url,
        setup: "Share this URL with your affiliate. Clicks are tracked automatically via the ?ref= parameter.",
        commission: "Commission is tracked per click and conversion. Payout is manual — export /stats and settle via Stripe.",
        stripeWebhook: "To auto-record conversions: ensure Stripe checkout metadata includes ref code. Pass ?ref=CODE in checkout URL.",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /links — list all affiliate links ─────────────────────────────────────
router.get("/links", (_req: Request, res: Response) => {
  const sorted = [..._links].sort((a, b) => b.clicks - a.clicks);
  res.json({ ok: true, total: sorted.length, links: sorted });
});

// ── GET /track — record a click ───────────────────────────────────────────────
// Called automatically when a visitor arrives with ?ref=CODE in the URL.
// Typically invoked client-side or via a redirect shim.
router.get("/track", (req: Request, res: Response) => {
  const code      = String(req.query["ref"] ?? "").toUpperCase().trim();
  const productId = String(req.query["product"] ?? "").trim() || null;

  if (!code) { res.status(400).json({ ok: false, error: "ref parameter required" }); return; }

  const link = _links.find(l => l.code === code);
  if (link) {
    link.clicks++;
    link.lastClickAt = new Date().toISOString();
  }

  _clicks.push({
    code,
    productId,
    referrer:   String(req.headers["referer"] ?? ""),
    userAgent:  String(req.headers["user-agent"] ?? ""),
    recordedAt: new Date().toISOString(),
  });

  res.json({ ok: true, tracked: true, code, clicks: link?.clicks ?? 1 });
});

// ── POST /conversion — record a conversion from checkout webhook ──────────────
// Called by the checkout webhook when metadata.refCode is present.
export function recordAffiliateConversion(refCode: string, priceCents: number): void {
  const link = _links.find(l => l.code === refCode.toUpperCase());
  if (!link) return;
  link.conversions++;
  link.estimatedRevenueCents += priceCents;
  console.log(`[Affiliate] Conversion recorded: ${refCode} · +$${(priceCents / 100).toFixed(2)}`);
}

// ── GET /stats — aggregate affiliate performance ──────────────────────────────
router.get("/stats", (_req: Request, res: Response) => {
  const totalClicks       = _links.reduce((s, l) => s + l.clicks, 0);
  const totalConversions  = _links.reduce((s, l) => s + l.conversions, 0);
  const totalRevenue      = _links.reduce((s, l) => s + l.estimatedRevenueCents, 0);
  const avgConvRate       = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : "—";

  const byAffiliate = Object.values(
    _links.reduce<Record<string, {
      name: string; email: string;
      clicks: number; conversions: number; revenueCents: number; links: number;
    }>>((acc, l) => {
      const key = l.affiliateEmail || l.affiliateName;
      if (!acc[key]) acc[key] = { name: l.affiliateName, email: l.affiliateEmail, clicks: 0, conversions: 0, revenueCents: 0, links: 0 };
      acc[key]!.clicks      += l.clicks;
      acc[key]!.conversions += l.conversions;
      acc[key]!.revenueCents += l.estimatedRevenueCents;
      acc[key]!.links++;
      return acc;
    }, {})
  ).sort((a, b) => b.revenueCents - a.revenueCents);

  res.json({
    ok: true,
    summary: {
      totalLinks:       _links.length,
      totalClicks,
      totalConversions,
      totalRevenueUSD:  `$${(totalRevenue / 100).toFixed(2)}`,
      avgConversionRate: `${avgConvRate}%`,
    },
    byAffiliate,
    recentClicks: [..._clicks].reverse().slice(0, 20),
    links: [..._links].sort((a, b) => b.estimatedRevenueCents - a.estimatedRevenueCents),
  });
});

export default router;
