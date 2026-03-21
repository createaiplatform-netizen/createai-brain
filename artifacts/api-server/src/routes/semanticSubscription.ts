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
  const yr = new Date().getFullYear();

  const plansHtml = MEMBERSHIP_PLANS.map(plan => {
    const monthly  = (plan.priceMonthly / 100).toFixed(0);
    const annual   = (plan.priceAnnual  / 100).toFixed(0);
    const savings  = ((plan.priceMonthly * 12 - plan.priceAnnual) / 100).toFixed(0);
    const featHtml = plan.features.map(f =>
      `<li class="feat-item"><span class="feat-check" aria-hidden="true">✓</span>${f}</li>`
    ).join("");

    return `
    <article class="plan-card${plan.highlight ? " plan-featured" : ""}" aria-label="${plan.name} plan">
      ${plan.highlight ? `<div class="plan-badge" aria-label="Most Popular plan">Most Popular</div>` : ""}
      <h3 class="plan-name">${plan.name}</h3>
      <p class="plan-desc">${plan.description}</p>
      <div class="plan-price">
        <span class="price-amount">$${monthly}</span>
        <span class="price-period">/month</span>
      </div>
      <p class="plan-annual">or $${annual}/year — <strong>save $${savings}</strong></p>
      <ul class="feat-list" role="list">${featHtml}</ul>
      <a href="${STORE_URL}/api/semantic/store" class="plan-cta${plan.highlight ? " plan-cta-primary" : " plan-cta-outline"}" aria-label="Get started with ${plan.name}">
        Get Started →
      </a>
    </article>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Membership — Unlimited AI Product Access · CreateAI Brain</title>
  <meta name="description" content="Get unlimited access to all AI-generated digital products in the CreateAI Brain catalog. Ebooks, courses, templates, software, and more.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;min-height:100vh;-webkit-font-smoothing:antialiased;line-height:1.5}
    .skip-link{position:absolute;top:-100%;left:8px;z-index:9999;background:#6366f1;color:#fff;padding:10px 18px;border-radius:0 0 10px 10px;font-size:13px;font-weight:700;text-decoration:none;transition:top .15s}
    .skip-link:focus{top:0}
    .nav{background:rgba(2,6,23,.97);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 28px;position:sticky;top:0;z-index:50}
    .nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;height:64px;gap:20px}
    .logo{font-size:1rem;font-weight:900;letter-spacing:-.04em;text-decoration:none;color:#e2e8f0}
    .logo span{color:#6366f1}
    .nav-links{display:flex;gap:20px;align-items:center;margin-left:auto}
    .nav-links a{font-size:.82rem;font-weight:600;color:rgba(226,232,240,.6);text-decoration:none;transition:color .15s}
    .nav-links a:hover{color:#e2e8f0}
    .nav-cta{background:linear-gradient(135deg,#6366f1,#8b5cf6)!important;color:white!important;border-radius:8px;padding:7px 16px;box-shadow:0 2px 6px rgba(99,102,241,.3)}
    .hero{background:linear-gradient(135deg,#020617,#1e1b4b 50%,#0d1228);padding:80px 28px 100px;text-align:center;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 70% at 50% 0%,rgba(99,102,241,.25) 0%,transparent 65%);pointer-events:none}
    .hero-inner{max-width:700px;margin:0 auto;position:relative}
    .hero-chip{display:inline-block;background:rgba(99,102,241,.2);color:#a5b4fc;border:1px solid rgba(99,102,241,.3);border-radius:999px;padding:5px 18px;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:24px}
    .hero h1{font-size:clamp(2rem,4vw,3.5rem);font-weight:900;color:white;letter-spacing:-.05em;line-height:1.1;margin-bottom:16px}
    .hero-sub{font-size:1.05rem;color:rgba(203,213,225,.75);line-height:1.65;max-width:560px;margin:0 auto 40px}
    .hero-stats{display:flex;justify-content:center;gap:40px;flex-wrap:wrap}
    .hero-stat-val{font-size:2rem;font-weight:900;color:#a5b4fc;letter-spacing:-.03em}
    .hero-stat-lbl{font-size:.75rem;color:rgba(203,213,225,.6);margin-top:4px;font-weight:500}
    .plans-section{max-width:1100px;margin:-60px auto 64px;padding:0 24px}
    .plans-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:24px;align-items:start}
    .plan-card{background:white;border-radius:20px;padding:32px;border:1.5px solid #e8ecf2;box-shadow:0 4px 20px rgba(0,0,0,.07);position:relative;transition:box-shadow .2s,border-color .2s}
    .plan-card:hover{box-shadow:0 12px 40px rgba(0,0,0,.12);border-color:#c4b5fd}
    .plan-featured{border-color:#6366f1;box-shadow:0 12px 48px rgba(99,102,241,.2)}
    .plan-featured:hover{box-shadow:0 20px 60px rgba(99,102,241,.3)}
    .plan-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:999px;padding:5px 18px;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;box-shadow:0 4px 12px rgba(99,102,241,.4)}
    .plan-name{font-size:1rem;font-weight:900;color:#0f172a;margin-bottom:8px;letter-spacing:-.01em}
    .plan-desc{font-size:.82rem;color:#64748b;margin-bottom:20px;line-height:1.55}
    .plan-price{display:flex;align-items:baseline;gap:4px;margin-bottom:4px}
    .price-amount{font-size:2.8rem;font-weight:900;color:#6366f1;letter-spacing:-.04em}
    .price-period{font-size:.9rem;color:#94a3b8}
    .plan-annual{font-size:.78rem;color:#94a3b8;margin-bottom:24px}
    .plan-annual strong{color:#16a34a}
    .feat-list{list-style:none;margin:0;padding:0 0 28px}
    .feat-item{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;font-size:.85rem;color:#374151;line-height:1.5}
    .feat-check{color:#6366f1;font-weight:800;flex-shrink:0;margin-top:1px}
    .plan-cta{display:block;text-align:center;text-decoration:none;border-radius:12px;padding:14px;font-size:.9rem;font-weight:800;transition:all .18s}
    .plan-cta-primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;box-shadow:0 4px 14px rgba(99,102,241,.35)}
    .plan-cta-primary:hover{box-shadow:0 8px 24px rgba(99,102,241,.5);transform:translateY(-1px);color:white}
    .plan-cta-outline{background:white;color:#6366f1;border:2px solid #e0e7ff}
    .plan-cta-outline:hover{background:#f5f3ff;border-color:#c4b5fd}
    .trust-bar{text-align:center;color:#94a3b8;font-size:.82rem;margin:32px auto;padding:0 24px;max-width:600px;line-height:1.6}
    .trust-bar a{color:#6366f1;text-decoration:none;font-weight:600}
    .trust-bar a:hover{text-decoration:underline}
    footer{background:#020617;color:rgba(255,255,255,.35);padding:32px 24px;text-align:center;font-size:.78rem;margin-top:40px}
    footer a{color:rgba(255,255,255,.45);text-decoration:none;margin:0 10px}
    footer a:hover{color:white}
    .footer-links{margin-bottom:8px}
    @media(max-width:700px){.nav{padding:0 16px;}.hero{padding:56px 16px 80px;}.plans-section{padding:0 16px;margin-top:-40px;}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;}}
  </style>
</head>
<body>

<a class="skip-link" href="#plans-main">Skip to main content</a>

<nav class="nav" aria-label="Site navigation">
  <div class="nav-inner">
    <a class="logo" href="${STORE_URL}" aria-label="CreateAI Brain home">Create<span>AI</span> Brain</a>
    <div class="nav-links">
      <a href="${STORE_URL}/api/semantic/store">Store</a>
      <a href="${STORE_URL}/api/semantic/portal/me">My Downloads</a>
      <a href="${STORE_URL}/api/semantic/store" class="nav-cta">Shop Now</a>
    </div>
  </div>
</nav>

<main id="plans-main">
  <header class="hero" aria-label="Membership plans">
    <div class="hero-inner">
      <div class="hero-chip">Membership Plans</div>
      <h1>Unlimited AI Product Access</h1>
      <p class="hero-sub">One membership. Every ebook, course, template, software, plugin, video, and audio product — with new products added weekly.</p>
      <div class="hero-stats" role="list" aria-label="Catalog stats">
        <div role="listitem">
          <div class="hero-stat-val">100+</div>
          <div class="hero-stat-lbl">Products</div>
        </div>
        <div role="listitem">
          <div class="hero-stat-val">11</div>
          <div class="hero-stat-lbl">Formats</div>
        </div>
        <div role="listitem">
          <div class="hero-stat-val">∞</div>
          <div class="hero-stat-lbl">Downloads</div>
        </div>
        <div role="listitem">
          <div class="hero-stat-val">30</div>
          <div class="hero-stat-lbl">Day Guarantee</div>
        </div>
      </div>
    </div>
  </header>

  <section class="plans-section" aria-label="Choose your membership plan">
    <div class="plans-grid" role="list">
      ${plansHtml}
    </div>
    <div class="trust-bar">
      ✓ 30-day satisfaction guarantee &nbsp;·&nbsp; ✓ Secure checkout via Stripe &nbsp;·&nbsp; ✓ Cancel anytime<br>
      <a href="${STORE_URL}/api/semantic/store">← Browse individual products instead</a>
    </div>
  </section>
</main>

<footer>
  <div class="footer-links">
    <a href="${STORE_URL}/api/semantic/store">Store</a>
    <a href="${STORE_URL}/api/semantic/portal/me">My Downloads</a>
    <a href="${STORE_URL}/portal/book">Book a Call</a>
    <a href="${STORE_URL}">Platform Home</a>
  </div>
  <div>© ${yr} CreateAI Brain · Lakeside Trinity LLC · All rights reserved</div>
</footer>

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
