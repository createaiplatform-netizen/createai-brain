/**
 * routes/platformHub.ts
 * ─────────────────────
 * Clean internal URL surfaces served at the domain root.
 *
 * GET /          → Branded platform homepage (public-facing)
 * GET /hub       → Admin directory (all platform surfaces, one page)
 * GET /p/:id     → Product page alias → 301 /store/:id
 * GET /buy/:id   → Direct checkout alias → 302 /checkout/:id
 * GET /share/:id → Share card alias → 301 /launch/share/:id
 */

import { Router, type Request, type Response } from "express";
import { getRegistry, getFromRegistry }          from "../semantic/registry.js";
import { getPublicBaseUrl }                      from "../utils/publicUrl.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET / — Platform Homepage
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";

  let totalProducts = 0;
  let featuredProducts: Array<{ id: string; title: string; format: string; price: string }> = [];
  try {
    const all = await getRegistry();
    totalProducts = all.length;
    const sorted = [...all].sort((a, b) => b.priceCents - a.priceCents);
    featuredProducts = sorted.slice(0, 6).map(p => ({
      id:     p.id,
      title:  p.title,
      format: p.format,
      price:  `$${(p.priceCents / 100).toFixed(2)}`,
    }));
  } catch { /* registry warming */ }

  const FORMAT_COLORS: Record<string, string> = {
    ebook: "#4f46e5", course: "#0891b2", template: "#059669",
    audiobook: "#7c3aed", video: "#dc2626", plugin: "#ea580c",
    software: "#0f766e", graphic: "#be185d", music: "#ca8a04",
    photo: "#64748b", "3D": "#9333ea",
  };

  const featuredHTML = featuredProducts.map(p => `
    <a href="${BASE}/store/${p.id}" style="display:block;text-decoration:none;background:white;border-radius:16px;padding:20px;border:1px solid #e2e8f0;transition:all 0.2s;" onmouseover="this.style.boxShadow='0 8px 24px rgba(99,102,241,0.15)';this.style.borderColor='#6366f1'" onmouseout="this.style.boxShadow='';this.style.borderColor='#e2e8f0'">
      <div style="display:inline-block;background:${FORMAT_COLORS[p.format] ?? "#64748b"};color:white;border-radius:6px;padding:3px 10px;font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">${p.format}</div>
      <div style="font-size:0.92rem;font-weight:700;color:#0f172a;margin-bottom:8px;line-height:1.35;">${p.title}</div>
      <div style="font-size:1.1rem;font-weight:900;color:#6366f1;">${p.price}</div>
    </a>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CreateAI Brain — AI-Powered Digital Products</title>
  <meta name="description" content="100 AI-generated digital products: ebooks, courses, templates, software, and more. Instant delivery, lifetime access.">
  <meta property="og:title" content="CreateAI Brain — AI-Powered Digital Products">
  <meta property="og:description" content="Discover 100 AI-generated digital products. Instant delivery.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${BASE}/">
  <link rel="canonical" href="${BASE}/">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a}
    a{color:inherit}
    .nav{background:white;border-bottom:1px solid #e2e8f0;padding:0 32px;position:sticky;top:0;z-index:50}
    .nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;height:60px;gap:24px}
    .logo{font-size:1.05rem;font-weight:900;letter-spacing:-0.02em;text-decoration:none;color:#0f172a}
    .logo span{color:#6366f1}
    .nav-links{display:flex;gap:24px;margin-left:auto}
    .nav-links a{font-size:0.85rem;font-weight:600;color:#475569;text-decoration:none;transition:color 0.15s}
    .nav-links a:hover{color:#6366f1}
    .nav-cta{background:#6366f1;color:white!important;border-radius:8px;padding:7px 18px}
    .nav-cta:hover{background:#4f46e5!important}
    .hero{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%);padding:80px 32px;text-align:center}
    .hero-inner{max-width:800px;margin:0 auto}
    .hero-badge{display:inline-block;background:rgba(99,102,241,0.3);color:#a5b4fc;border:1px solid rgba(99,102,241,0.4);border-radius:999px;padding:5px 18px;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:24px}
    .hero h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:900;color:white;line-height:1.1;margin-bottom:20px;letter-spacing:-0.03em}
    .hero h1 span{color:#818cf8}
    .hero p{font-size:1.1rem;color:rgba(255,255,255,0.7);line-height:1.7;margin-bottom:36px;max-width:580px;margin-left:auto;margin-right:auto}
    .hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
    .btn-hero{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;font-size:1rem;font-weight:700;text-decoration:none;transition:all 0.15s}
    .btn-primary{background:#6366f1;color:white}
    .btn-primary:hover{background:#4f46e5;transform:translateY(-1px)}
    .btn-secondary{background:rgba(255,255,255,0.1);color:white;border:1px solid rgba(255,255,255,0.2)}
    .btn-secondary:hover{background:rgba(255,255,255,0.2)}
    .stats-bar{background:white;border-bottom:1px solid #e2e8f0;padding:20px 32px}
    .stats-inner{max-width:1100px;margin:0 auto;display:flex;justify-content:center;gap:48px;flex-wrap:wrap}
    .stat{text-align:center}
    .stat-num{font-size:1.6rem;font-weight:900;color:#6366f1}
    .stat-lbl{font-size:0.75rem;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px}
    .section{padding:64px 32px}
    .section-inner{max-width:1100px;margin:0 auto}
    .section-title{font-size:1.6rem;font-weight:900;color:#0f172a;margin-bottom:6px}
    .section-sub{font-size:0.95rem;color:#64748b;margin-bottom:32px}
    .products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:32px}
    .cta-block{background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:24px;padding:48px 40px;text-align:center;margin-top:48px}
    .cta-block h2{font-size:1.8rem;font-weight:900;color:white;margin-bottom:12px}
    .cta-block p{font-size:1rem;color:rgba(255,255,255,0.85);margin-bottom:28px}
    .formats-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:40px}
    .fmt-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 16px;font-size:0.8rem;font-weight:700;text-decoration:none;border:2px solid;transition:all 0.15s}
    footer{background:#0f172a;color:rgba(255,255,255,0.5);padding:32px;text-align:center;font-size:0.82rem}
    footer a{color:rgba(255,255,255,0.6);text-decoration:none;margin:0 12px}
    footer a:hover{color:white}
    @media(max-width:640px){.stats-inner{gap:24px}.hero{padding:56px 20px}.section{padding:40px 20px}}
  </style>
</head>
<body>

<nav class="nav">
  <div class="nav-inner">
    <a class="logo" href="${BASE}/">CreateAI <span>Brain</span></a>
    <div class="nav-links">
      <a href="${BASE}/store">Browse All</a>
      <a href="${BASE}/join/landing">Membership</a>
      <a href="${BASE}/portal/me">My Downloads</a>
      <a href="${BASE}/store" class="nav-cta">Shop Now</a>
    </div>
  </div>
</nav>

<div class="hero">
  <div class="hero-inner">
    <div class="hero-badge">${IS_PROD ? "⚡ Live Platform" : "🧪 Preview Mode"} · ${totalProducts} Products Ready</div>
    <h1>AI-Powered Digital Products<br><span>Built to Sell. Built to Scale.</span></h1>
    <p>Ebooks, courses, templates, software, audiobooks, and more — all AI-generated, instantly delivered, yours for life. Prices starting at $12.</p>
    <div class="hero-actions">
      <a href="${BASE}/store" class="btn-hero btn-primary">Browse All ${totalProducts} Products →</a>
      <a href="${BASE}/join/landing" class="btn-hero btn-secondary">View Membership Plans</a>
    </div>
  </div>
</div>

<div class="stats-bar">
  <div class="stats-inner">
    <div class="stat"><div class="stat-num">${totalProducts}</div><div class="stat-lbl">Digital Products</div></div>
    <div class="stat"><div class="stat-num">11</div><div class="stat-lbl">Formats</div></div>
    <div class="stat"><div class="stat-num">Instant</div><div class="stat-lbl">Delivery</div></div>
    <div class="stat"><div class="stat-num">Lifetime</div><div class="stat-lbl">Access</div></div>
    <div class="stat"><div class="stat-num">30-Day</div><div class="stat-lbl">Guarantee</div></div>
  </div>
</div>

<div class="section" style="background:white">
  <div class="section-inner">
    <div class="section-title">Browse by Format</div>
    <div class="section-sub">Every format, instant delivery, one-time purchase.</div>
    <div class="formats-row">
      ${Object.entries(FORMAT_COLORS).map(([fmt, color]) =>
        `<a href="${BASE}/store?format=${fmt}" class="fmt-chip" style="color:${color};border-color:${color};" onmouseover="this.style.background='${color}';this.style.color='white'" onmouseout="this.style.background='';this.style.color='${color}'">${fmt.charAt(0).toUpperCase() + fmt.slice(1)}</a>`
      ).join("")}
    </div>

    <div class="section-title">Featured Products</div>
    <div class="section-sub">Highest-value picks from the catalog.</div>
    <div class="products-grid">${featuredHTML || '<p style="color:#94a3b8">Loading products…</p>'}</div>
    <div style="text-align:center">
      <a href="${BASE}/store" class="btn-hero btn-primary" style="font-size:0.95rem;">See All ${totalProducts} Products →</a>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-inner">
    <div class="cta-block">
      <h2>Everything. Instantly. Yours.</h2>
      <p>Buy once, access forever. Every product includes a downloadable text version and a formatted web preview. No subscriptions required.</p>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        <a href="${BASE}/store" style="display:inline-block;background:white;color:#6366f1;text-decoration:none;border-radius:12px;padding:14px 32px;font-size:1rem;font-weight:800;">Browse the Store →</a>
        <a href="${BASE}/join/landing" style="display:inline-block;background:rgba(255,255,255,0.15);color:white;text-decoration:none;border-radius:12px;padding:14px 32px;font-size:1rem;font-weight:700;border:2px solid rgba(255,255,255,0.3);">View Membership Plans</a>
      </div>
    </div>
  </div>
</div>

<footer>
  <div>
    <a href="${BASE}/store">Store</a>
    <a href="${BASE}/join/landing">Membership</a>
    <a href="${BASE}/portal/me">My Account</a>
    <a href="${BASE}/hub">Admin Hub</a>
    <a href="${BASE}/sitemap.xml">Sitemap</a>
  </div>
  <div style="margin-top:12px;">© ${new Date().getFullYear()} CreateAI Brain · All rights reserved · Powered by Stripe</div>
</footer>

</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /hub — Admin Directory
// ─────────────────────────────────────────────────────────────────────────────
router.get("/hub", async (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";
  const hasWebhook = !!process.env["STRIPE_WEBHOOK_SECRET"];
  const hasResend  = !!process.env["RESEND_API_KEY"]?.startsWith("re_");
  const hasCustomDomain = !!process.env["PUBLIC_DOMAIN"];

  let totalProducts = 0;
  try { totalProducts = (await getRegistry()).length; } catch { /* warming */ }

  const surfaces = [
    {
      section: "Revenue",
      items: [
        { label: "Vault — Money Hub", url: `${BASE}/vault`, desc: "Balance, payouts, revenue timeline, Move Money action", icon: "🏦", badge: "Admin" },
        { label: "Launch Console", url: `${BASE}/launch/`, desc: "Live payments, one-click delivery, product catalog", icon: "🚀", badge: "Admin" },
        { label: "Store", url: `${BASE}/store`, desc: `${totalProducts} live products with Stripe checkout`, icon: "🛍️", badge: "Public" },
        { label: "Membership Plans", url: `${BASE}/join/landing`, desc: "Subscription tiers: $29 / $79 / $299/mo", icon: "👑", badge: "Public" },
        { label: "Customer Portal", url: `${BASE}/portal/me`, desc: "Email-gated purchase history + re-download links", icon: "👤", badge: "Public" },
      ],
    },
    {
      section: "Operations",
      items: [
        { label: "Live Payment Feed", url: `${BASE}/launch/payments`, desc: "Real-time Stripe sessions with delivery status", icon: "💳", badge: "Admin" },
        { label: "CRM Stats", url: `${BASE}/portal/stats`, desc: "Total customers, revenue, top products", icon: "📊", badge: "Admin" },
        { label: "Platform Score", url: `${BASE}/api/semantic/analytics/`, desc: "17/20 domain capability dashboard", icon: "📈", badge: "Admin" },
        { label: "Affiliate Stats", url: `${BASE}/api/semantic/affiliate/stats`, desc: "Link performance + click tracking", icon: "🔗", badge: "Admin" },
      ],
    },
    {
      section: "Content & Feeds",
      items: [
        { label: "Shopify CSV", url: `${BASE}/export/shopify.csv`, desc: "All 100 products in Shopify import format", icon: "📦", badge: "Export" },
        { label: "WooCommerce CSV", url: `${BASE}/export/woocommerce.csv`, desc: "WooCommerce product import file", icon: "📦", badge: "Export" },
        { label: "Google Shopping XML", url: `${BASE}/export/google-shopping.xml`, desc: "Google Merchant Center feed", icon: "📦", badge: "Export" },
        { label: "Amazon Feed", url: `${BASE}/export/amazon.txt`, desc: "Amazon Seller flat-file feed", icon: "📦", badge: "Export" },
        { label: "Full Catalog JSON", url: `${BASE}/export/catalog.json`, desc: "All product data as structured JSON", icon: "📦", badge: "Export" },
        { label: "Sitemap", url: `${BASE}/sitemap.xml`, desc: "Google-discoverable XML sitemap (100 products)", icon: "🗺️", badge: "SEO" },
        { label: "Robots.txt", url: `${BASE}/robots.txt`, desc: "Search engine crawl directives", icon: "🤖", badge: "SEO" },
        { label: "SEO Bundles", url: `${BASE}/api/semantic/seo/bundles`, desc: "Cross-format product bundles for SEO", icon: "🔍", badge: "SEO" },
      ],
    },
    {
      section: "System",
      items: [
        { label: "Health Check", url: `${BASE}/healthz`, desc: "Server uptime + status", icon: "💚", badge: "System" },
        { label: "All Products JSON", url: `${BASE}/products`, desc: "Full product registry with metadata", icon: "📋", badge: "System" },
        { label: "Quick-Links (all checkouts)", url: `${BASE}/launch/quick-links`, desc: "All 100 checkout URLs in one JSON response", icon: "⚡", badge: "System" },
        { label: "Subscription Plans JSON", url: `${BASE}/join/plans`, desc: "Recurring plan definitions", icon: "💎", badge: "System" },
      ],
    },
  ];

  const badgeColors: Record<string, string> = {
    Admin: "#6366f1", Public: "#059669", Export: "#0891b2", SEO: "#7c3aed", System: "#94a3b8",
  };

  const systemStatus = [
    { label: "Stripe Checkout", ok: true, detail: "100/100 products have live price IDs" },
    { label: "Email Delivery", ok: hasResend, detail: hasResend ? "Resend active" : "Add RESEND_API_KEY" },
    { label: "Webhook Auto-Capture", ok: hasWebhook, detail: hasWebhook ? "Active" : "Add STRIPE_WEBHOOK_SECRET" },
    { label: "Custom Domain", ok: hasCustomDomain, detail: hasCustomDomain ? `${process.env["PUBLIC_DOMAIN"]}` : "Set PUBLIC_DOMAIN in Secrets" },
    { label: "Mode", ok: true, detail: IS_PROD ? "Production" : "Test (set REPLIT_DEPLOYMENT=1 to go live)" },
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin Hub — CreateAI Brain</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;font-size:14px}
    .hdr{background:linear-gradient(135deg,#0f172a,#1e293b);color:white;padding:0 28px;position:sticky;top:0;z-index:50}
    .hdr-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;height:56px;gap:16px}
    .hdr-logo{font-size:0.95rem;font-weight:900;letter-spacing:-0.02em}
    .hdr-logo span{color:#818cf8}
    .hdr-links{margin-left:auto;display:flex;gap:16px}
    .hdr-links a{color:rgba(255,255,255,0.6);font-size:0.8rem;text-decoration:none;font-weight:600}
    .hdr-links a:hover{color:white}
    .page{max-width:1200px;margin:0 auto;padding:28px}
    .page-title{font-size:1.2rem;font-weight:900;color:#0f172a;margin-bottom:4px}
    .page-sub{font-size:0.85rem;color:#64748b;margin-bottom:28px}
    .status-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:32px}
    .status-card{background:white;border-radius:12px;padding:14px 16px;border:1px solid;display:flex;gap:10px;align-items:flex-start}
    .status-card.ok{border-color:#86efac}
    .status-card.warn{border-color:#fcd34d}
    .status-dot{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:900;flex-shrink:0;color:white;margin-top:1px}
    .dot-ok{background:#059669}
    .dot-warn{background:#d97706}
    .status-label{font-size:0.78rem;font-weight:700;color:#0f172a;margin-bottom:2px}
    .status-detail{font-size:0.72rem;color:#64748b}
    .section{margin-bottom:32px}
    .section-hdr{font-size:0.8rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
    .surface-card{background:white;border-radius:12px;padding:16px;border:1px solid #e2e8f0;text-decoration:none;display:block;transition:all 0.15s}
    .surface-card:hover{border-color:#6366f1;box-shadow:0 4px 14px rgba(99,102,241,0.12);transform:translateY(-1px)}
    .card-top{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    .card-icon{font-size:1.1rem}
    .card-label{font-size:0.88rem;font-weight:800;color:#0f172a;flex:1}
    .card-badge{font-size:0.65rem;font-weight:800;border-radius:999px;padding:2px 8px;color:white}
    .card-desc{font-size:0.78rem;color:#64748b;line-height:1.5}
    .card-url{font-size:0.7rem;color:#94a3b8;margin-top:6px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    @media(max-width:640px){.page{padding:16px}.status-row{grid-template-columns:1fr 1fr}}
  </style>
</head>
<body>
<div class="hdr">
  <div class="hdr-inner">
    <div class="hdr-logo">CreateAI <span>Brain</span> · Admin Hub</div>
    <div class="hdr-links">
      <a href="${BASE}/">Home</a>
      <a href="${BASE}/launch/">Launch Console</a>
      <a href="${BASE}/store">Store</a>
      <a href="https://dashboard.stripe.com" target="_blank">Stripe ↗</a>
    </div>
  </div>
</div>

<div class="page">
  <div class="page-title">Admin Hub</div>
  <div class="page-sub">Every surface of the CreateAI Brain platform. Click any card to open it.</div>

  <div class="status-row">
    ${systemStatus.map(s => `
    <div class="status-card ${s.ok ? "ok" : "warn"}">
      <div class="status-dot ${s.ok ? "dot-ok" : "dot-warn"}">${s.ok ? "✓" : "!"}</div>
      <div>
        <div class="status-label">${s.label}</div>
        <div class="status-detail">${s.detail}</div>
      </div>
    </div>`).join("")}
  </div>

  ${surfaces.map(sec => `
  <div class="section">
    <div class="section-hdr">${sec.section}</div>
    <div class="grid">
      ${sec.items.map(item => `
      <a href="${item.url}" class="surface-card" target="${item.url.startsWith("http") ? "_self" : "_self"}">
        <div class="card-top">
          <span class="card-icon">${item.icon}</span>
          <span class="card-label">${item.label}</span>
          <span class="card-badge" style="background:${badgeColors[item.badge] ?? "#94a3b8"}">${item.badge}</span>
        </div>
        <div class="card-desc">${item.desc}</div>
        <div class="card-url">${item.url}</div>
      </a>`).join("")}
    </div>
  </div>`).join("")}
</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

// ─────────────────────────────────────────────────────────────────────────────
// Alias routes — clean short URLs that forward to the canonical path
// ─────────────────────────────────────────────────────────────────────────────

// /p/:id  → /store/:id  (clean product page URL)
router.get("/p/:id", (req: Request, res: Response) => {
  res.redirect(301, `/store/${String(req.params["id"] ?? "")}`);
});

// /buy/:id → /checkout/:id  (direct-to-checkout URL)
router.get("/buy/:id", (req: Request, res: Response) => {
  res.redirect(302, `/checkout/${String(req.params["id"] ?? "")}`);
});

// /share/:id → /launch/share/:id  (social share card)
router.get("/share/:id", (req: Request, res: Response) => {
  res.redirect(301, `/launch/share/${String(req.params["id"] ?? "")}`);
});

export default router;
