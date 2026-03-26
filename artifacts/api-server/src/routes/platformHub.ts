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
router.get("/", (_req: Request, res: Response) => {
  res.send(`
    <html><head><style>
      body { background:#050505; color:#d4af37; font-family:monospace; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; margin:0; overflow:hidden; }
      .gold-orb { width:120px; height:120px; background:radial-gradient(circle, #d4af37 0%, #000 80%); border-radius:50%; animation:p 3s infinite ease-in-out; cursor:pointer; }
      .key-input { margin-top:40px; background:transparent; border:none; border-bottom:1px solid #d4af37; color:#d4af37; text-align:center; font-size:1.2rem; width:300px; outline:none; letter-spacing:5px; text-transform:uppercase; }
      @keyframes p { 0%, 100% { opacity:0.3; transform:scale(0.9); box-shadow:0 0 20px #d4af3733; } 50% { opacity:1; transform:scale(1.1); box-shadow:0 0 80px #d4af37; } }
    </style></head><body>
      <div class="gold-orb" onclick="document.querySelector('.key-input').focus()"></div>
      <input type="text" class="key-input" placeholder="ENTER_KEY" onkeydown="if(event.key==='Enter') window.location.href='/admin/register?invite='+this.value">
      <p style="position:absolute; bottom:20px; font-size:0.6rem; opacity:0.3; letter-spacing:2px;">ESTABLISHED_2026 // CREATEAI.DIGITAL</p>
    </body></html>
  `);
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
      section: "AI Studio",
      items: [
        { label: "AI Studio Hub", url: `${BASE}/studio`, desc: "All 10 AI-native capabilities. 6 live now — Email, Docs, Analytics, CRM, Social, Content.", icon: "✦", badge: "Live" },
        { label: "AI Email Engine", url: `${BASE}/studio/email`, desc: "Write and send AI-generated newsletters, campaigns, or one-off emails. GPT-4o drafts. Resend delivers.", icon: "✉", badge: "Live" },
        { label: "AI Document Generator", url: `${BASE}/studio/docs`, desc: "Generate contracts, proposals, SOPs, intake forms, or any document from a brief in seconds.", icon: "📄", badge: "Live" },
        { label: "AI Analytics Reports", url: `${BASE}/studio/analytics`, desc: "One-click weekly business intelligence report. GPT-4o reads your live DB stats and writes a plain-English summary.", icon: "📊", badge: "Live" },
        { label: "AI CRM & Follow-up", url: `${BASE}/studio/crm`, desc: "View customers from your live DB. Generate personalized AI follow-up emails for any customer.", icon: "👥", badge: "Live" },
        { label: "AI Social Scheduler", url: `${BASE}/studio/social`, desc: "Generate 30 days of social posts from your product catalog. Captions, hashtags, and CTAs included.", icon: "📱", badge: "Live" },
        { label: "AI Content Engine", url: `${BASE}/studio/content`, desc: "Product descriptions, landing page copy, SEO meta tags, and sales emails from a single brief.", icon: "✍", badge: "Live" },
        { label: "AI Scheduling (coming)", url: `#`, desc: "Booking links, reminders, calendar management — no Calendly needed.", icon: "📅", badge: "Soon" },
        { label: "AI Training System (coming)", url: `#`, desc: "Turn any document into a training module with quiz and certificate.", icon: "🎓", badge: "Soon" },
      ],
    },
    {
      section: "Operations",
      items: [
        { label: "PULSE — Platform Awareness", url: `${BASE}/pulse`, desc: "Real-time business intelligence: revenue, customers, catalog, webhooks, and system health in one live dashboard.", icon: "◉", badge: "Live" },
        { label: "Platform Status", url: `${BASE}/status`, desc: "Infrastructure diagnostics — DB, Stripe, email, webhook, auth, OpenAI, deployment mode. Auto-refreshes every 30s.", icon: "🟢", badge: "Admin" },
        { label: "NEXUS Platform OS", url: `${BASE}/nexus`, desc: "Unified OS — identity (Presence), 5-format addressing, role-adaptive surfaces, session context. Supersedes CORE + SignalSpace.", icon: "◈", badge: "Admin" },
        { label: "Business OS Bundle", url: `${BASE}/bundle`, desc: "20-industry analysis: 140+ tools replaced, 13 AI-native capabilities, unified $29–$299/mo pricing model.", icon: "📦", badge: "Admin" },
        { label: "Live Payment Feed", url: `${BASE}/launch/payments`, desc: "Real-time Stripe sessions with delivery status", icon: "💳", badge: "Admin" },
        { label: "CRM Stats", url: `${BASE}/portal/stats`, desc: "Total customers, revenue, top products", icon: "📊", badge: "Admin" },
        { label: "Affiliate Stats", url: `${BASE}/api/semantic/affiliate/stats`, desc: "Link performance + click tracking", icon: "🔗", badge: "Admin" },
        { label: "Advertising Hub", url: `${BASE}/api/advertising/hub`, desc: "Brand assets, 12 platform profiles, 26 ad formats, funnels, hashtags, AI copy generator — all internal assets.", icon: "📣", badge: "Admin" },
        { label: "Analytics Dashboard", url: `${BASE}/api/analytics/dashboard`, desc: "Platform growth intelligence — pageviews, leads, referrals, and UTM source tracking. All data from your own DB.", icon: "📈", badge: "Admin" },
        { label: "Revenue Intelligence", url: `${BASE}/api/revenue-intel/dashboard`, desc: "MRR, ARR, LTV, churn rate, NRR — cohort tracking + 30-day trend. Record snapshots via POST.", icon: "💰", badge: "Admin" },
        { label: "Domain Engines Hub", url: `${BASE}/api/domains/hub`, desc: "Live status of all 9 domain engines: banking, insurance, real estate, talent, FP&A, compliance, subscriptions, campaigns, performance.", icon: "⚙️", badge: "Admin" },
        { label: "Platform Command Center", url: `${BASE}/api/platform/report/dashboard`, desc: "Full-stack HTML snapshot — engine readiness ring, revenue rails, identity, app coverage, traction, and next unlock steps.", icon: "🖥️", badge: "Admin" },
        { label: "Growth Path Engine", url: `${BASE}/api/growth-path/dashboard`, desc: "5 learning tracks: AI Tools Mastery, Platform Operations, Monetization, Healthcare AI, Legal AI — enrollment and completion stats.", icon: "🎓", badge: "Admin" },
        { label: "Brand Vault", url: `${BASE}/api/brand/dashboard`, desc: "Brand assets, color system (#6366f1 Indigo), typography rules, and mandatory brand guidelines. Lakeside Trinity LLC identity.", icon: "🎨", badge: "Admin" },
        { label: "Traction Dashboard", url: `${BASE}/api/traction/dashboard`, desc: "Live traction events by type and period, registry snapshot (103 engines, 37 meta-agents, 200 apps), expansion cycle status.", icon: "📡", badge: "Admin" },
        { label: "Franchise Hub", url: `${BASE}/api/franchise/dashboard`, desc: "Franchise location management — monthly revenue, staff headcount, compliance scores. Add locations via API.", icon: "🏢", badge: "Admin" },
        { label: "Max Activation", url: `${BASE}/api/activate/dashboard`, desc: "Full activation orchestrator — 3 external blockers, bypass status, Stripe/Resend/Marketplace resolution steps, execution sequence.", icon: "⚡", badge: "Admin" },
        { label: "Platform Readiness %", url: `${BASE}/api/system/percentages/dashboard`, desc: "Platform deployment % per subsystem with SVG readiness ring. OS Core, Revenue Rail, Advertising Hub, Invention Layer and more.", icon: "🎯", badge: "Admin" },
        { label: "Credentials Hub", url: `${BASE}/api/credentials/dashboard`, desc: "Enter marketplace API tokens (Shopify, Etsy, Amazon, eBay, CreativeMarket) directly — no Replit Secrets navigation required.", icon: "🔑", badge: "Admin" },
        { label: "Campaign Manager", url: `${BASE}/api/ads/dashboard`, desc: "12 ad networks, 30+ pre-built campaigns. Connect credentials to deploy Meta, Google, TikTok, LinkedIn, Snapchat campaigns.", icon: "📣", badge: "Admin" },
        { label: "Platform Identity", url: `${BASE}/api/self-host/dashboard`, desc: "NPA address, live URL, self-host engine status, internal zones, URL route map, and HMAC-signed platform proof token.", icon: "🌐", badge: "Admin" },
        { label: "CORE Console (legacy)", url: `${BASE}/core`, desc: "Legacy CORE OS — superseded by NEXUS.", icon: "◎", badge: "Legacy" },
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
    Admin:  "#6366f1",
    Public: "#059669",
    Export: "#0891b2",
    SEO:    "#7c3aed",
    System: "#94a3b8",
    Live:   "#10b981",
    Soon:   "#64748b",
    Legacy: "#475569",
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;font-size:14px;-webkit-font-smoothing:antialiased}
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
      <a href="${BASE}/pulse">PULSE</a>
      <a href="${BASE}/studio">Studio</a>
      <a href="${BASE}/status">Status</a>
      <a href="${BASE}/launch/">Launch</a>
      <a href="${BASE}/store">Store</a>
      <a href="https://dashboard.stripe.com" target="_blank">Stripe ↗</a>
      <a href="${BASE}/admin/logout" style="color:rgba(255,255,255,.4);">Logout</a>
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
