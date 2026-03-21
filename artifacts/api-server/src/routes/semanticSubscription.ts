/**
 * routes/semanticSubscription.ts
 * --------------------------------
 * Subscription & Recurring Revenue tier for the Semantic Product Layer.
 *
 * GET /api/semantic/subscriptions         — list all recurring/subscription products
 * GET /api/semantic/store/membership      — hosted membership landing page (HTML)
 * GET /api/semantic/checkout/subscribe/:priceId — create Stripe subscription checkout
 * GET /api/semantic/subscriptions/plans   — membership plan definitions
 *
 * Architecture: Detects Stripe recurring prices in the existing product catalog.
 * If no recurring products exist yet, surfaces the membership concept + points
 * users to create them in the Stripe Dashboard.
 *
 * To activate real subscriptions:
 *   1. Go to Stripe Dashboard → Products → Add Product → set Pricing as "Recurring"
 *   2. The registry will auto-detect it on next refresh and serve it here
 */

import { Router, type Request, type Response } from "express";
import { getRegistry }                      from "../semantic/registry.js";
import { getUncachableStripeClient }        from "../services/integrations/stripeClient.js";
import { getPublicBaseUrl }                 from "../utils/publicUrl.js";
import { getOrCreateSubscriptionPrices }   from "../services/subscriptionPrices.js";

const router = Router();

const STORE_URL = getPublicBaseUrl();

// ── Membership plan definitions ───────────────────────────────────────────────
const MEMBERSHIP_PLANS = [
  {
    id:          "starter",
    name:        "CreateAI Brain Starter",
    priceMonthly: 2900,
    priceAnnual:  29000,
    description: "Access to all ebooks and templates in the catalog",
    features: [
      "Unlimited ebook access",
      "All template downloads",
      "Monthly new product drops",
      "Email support",
      "Commercial use rights",
    ],
    highlight: false,
  },
  {
    id:          "pro",
    name:        "CreateAI Brain Pro",
    priceMonthly: 7900,
    priceAnnual:  79000,
    description: "Full catalog access + priority content generation",
    features: [
      "Everything in Starter",
      "All courses + audiobooks + videos",
      "Priority AI content generation",
      "Plugin + software access",
      "Advanced analytics API access",
      "Affiliate commission dashboard",
      "Priority email support",
    ],
    highlight: true,
  },
  {
    id:          "enterprise",
    name:        "CreateAI Brain Enterprise",
    priceMonthly: 29900,
    priceAnnual:  299000,
    description: "Unlimited everything + white-label + API access",
    features: [
      "Everything in Pro",
      "White-label product rights",
      "Full API access for all channels",
      "Custom product generation requests",
      "Dedicated account manager",
      "Custom Stripe checkout branding",
      "SLA support",
    ],
    highlight: false,
  },
];

// ── GET /plans ────────────────────────────────────────────────────────────────
router.get("/plans", async (_req: Request, res: Response) => {
  let prices: Record<string, { priceId: string; productId: string; amount: number }> = {};
  try {
    prices = await getOrCreateSubscriptionPrices();
  } catch {
    // Non-fatal — plans still show without checkout links
  }

  const tierId: Record<string, string> = { starter: "solo", pro: "business", premium: "enterprise" };

  res.json({
    ok:    true,
    plans: MEMBERSHIP_PLANS.map(p => {
      const tierKey = tierId[p.id] ?? p.id;
      const price = prices[tierKey];
      return {
        ...p,
        monthlyUSD:   `$${(p.priceMonthly / 100).toFixed(0)}/mo`,
        annualUSD:    `$${(p.priceAnnual  / 100).toFixed(0)}/yr`,
        annualSavings:`Save $${((p.priceMonthly * 12 - p.priceAnnual) / 100).toFixed(0)}/yr`,
        priceId:      price?.priceId ?? null,
        checkoutUrl:  price?.priceId ? `${STORE_URL}/join/checkout/${price.priceId}` : null,
        stripeReady:  !!price?.priceId,
      };
    }),
    stripeReady: Object.keys(prices).length >= 3,
  });
});

// ── GET / — list recurring products from registry ─────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    // Look for products that have recurring metadata (Stripe recurring prices)
    const recurring = products.filter(p =>
      p.tags.some(t => ["subscription", "recurring", "membership", "monthly", "annual"].includes(t.toLowerCase())) ||
      p.format === "subscription" ||
      p.title.toLowerCase().includes("subscription") ||
      p.title.toLowerCase().includes("membership")
    );

    res.json({
      ok: true,
      recurringProductCount: recurring.length,
      recurringProducts: recurring,
      membershipPlans: MEMBERSHIP_PLANS,
      membershipPageUrl: `${STORE_URL}/api/semantic/store/membership`,
      setupInstructions: recurring.length === 0
        ? "No recurring products detected. Create a recurring-priced product in Stripe Dashboard to activate this tier."
        : null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /store/membership — hosted membership landing page ─────────────────────
// Note: This is handled via the membership route separately registered in semanticStore.ts
// but we also expose it here for completeness.
router.get("/landing", (_req: Request, res: Response) => {
  const plansHtml = MEMBERSHIP_PLANS.map(plan => {
    const monthly = (plan.priceMonthly / 100).toFixed(0);
    const annual  = (plan.priceAnnual  / 100).toFixed(0);
    const savings = ((plan.priceMonthly * 12 - plan.priceAnnual) / 100).toFixed(0);
    const featHtml = plan.features.map(f => `<li style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;font-size:0.9rem;line-height:1.5;"><span style="color:#6366f1;font-weight:700;flex-shrink:0;">✓</span>${f}</li>`).join("");

    return `
    <div style="background:white;border-radius:20px;padding:32px;border:${plan.highlight ? "2px solid #6366f1" : "1px solid #f1f5f9"};box-shadow:${plan.highlight ? "0 8px 32px rgba(99,102,241,0.15)" : "0 2px 12px rgba(0,0,0,0.06)"};position:relative;">
      ${plan.highlight ? `<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:#6366f1;color:white;border-radius:999px;padding:4px 16px;font-size:0.75rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;white-space:nowrap;">Most Popular</div>` : ""}
      <h3 style="font-size:1.1rem;font-weight:800;color:#1e293b;margin-bottom:8px;">${plan.name}</h3>
      <p style="font-size:0.85rem;color:#64748b;margin-bottom:20px;line-height:1.5;">${plan.description}</p>
      <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
        <span style="font-size:2.5rem;font-weight:900;color:#6366f1;">$${monthly}</span>
        <span style="color:#94a3b8;font-size:0.9rem;">/month</span>
      </div>
      <p style="font-size:0.8rem;color:#94a3b8;margin-bottom:24px;">or $${annual}/year — save $${savings}</p>
      <ul style="list-style:none;margin:0;padding:0 0 24px;">${featHtml}</ul>
      <a href="${STORE_URL}/api/semantic/store" style="display:block;text-align:center;background:${plan.highlight ? "#6366f1" : "white"};color:${plan.highlight ? "white" : "#6366f1"};border:${plan.highlight ? "none" : "2px solid #6366f1"};text-decoration:none;border-radius:12px;padding:14px;font-size:0.95rem;font-weight:700;">
        Get Started →
      </a>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CreateAI Brain Membership — Unlimited AI Product Access</title>
  <meta name="description" content="Get unlimited access to all AI-generated digital products in the CreateAI Brain catalog. Ebooks, courses, templates, software, and more.">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;margin:0;">
  <div style="background:linear-gradient(135deg,#1e293b,#334155);padding:80px 24px;text-align:center;color:white;">
    <div style="display:inline-block;background:rgba(99,102,241,0.3);color:#a5b4fc;border-radius:999px;padding:6px 18px;font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:20px;">Membership Plans</div>
    <h1 style="font-size:clamp(2rem,4vw,3.5rem);font-weight:900;line-height:1.2;margin-bottom:16px;">Unlimited AI Product Access</h1>
    <p style="font-size:1.1rem;opacity:0.8;max-width:560px;margin:0 auto 32px;">One membership. Access to every ebook, course, template, software, plugin, video, and audio product in the catalog — with new products added every week.</p>
    <div style="display:flex;justify-content:center;gap:32px;flex-wrap:wrap;">
      <div style="text-align:center;"><div style="font-size:2rem;font-weight:800;color:#a5b4fc;">100+</div><div style="font-size:0.8rem;opacity:0.7;margin-top:4px;">Products</div></div>
      <div style="text-align:center;"><div style="font-size:2rem;font-weight:800;color:#a5b4fc;">11</div><div style="font-size:0.8rem;opacity:0.7;margin-top:4px;">Formats</div></div>
      <div style="text-align:center;"><div style="font-size:2rem;font-weight:800;color:#a5b4fc;">∞</div><div style="font-size:0.8rem;opacity:0.7;margin-top:4px;">Downloads</div></div>
    </div>
  </div>
  <div style="max-width:1100px;margin:64px auto;padding:0 24px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:28px;align-items:start;">
      ${plansHtml}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:0.85rem;margin-top:40px;">
      All plans include a 30-day satisfaction guarantee · Secure checkout via Stripe · Cancel anytime<br>
      <a href="${STORE_URL}/api/semantic/store" style="color:#6366f1;">← Browse individual products instead</a>
    </p>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ── GET /checkout/subscribe/:priceId ─────────────────────────────────────────
router.get("/checkout/:priceId", async (req: Request, res: Response) => {
  try {
    const priceId = String(req.params["priceId"] ?? "");
    if (!priceId.startsWith("price_")) {
      res.status(400).json({ ok: false, error: "Invalid price ID — must start with 'price_'" });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${STORE_URL}/api/semantic/portal/me?subscribed=1`,
      cancel_url:  `${STORE_URL}/api/semantic/subscriptions/landing`,
      metadata: { channel: "membership-page", type: "subscription" },
    });
    if (session.url) res.redirect(303, session.url);
    else res.status(500).json({ ok: false, error: "Stripe returned no checkout URL" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

export default router;
