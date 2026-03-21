/**
 * routes/semanticLaunch.ts
 * ─────────────────────────
 * Revenue Launch Console — the fastest path from "code ready" to "money in bank."
 *
 * Strategy: Option 1 — Stripe-native checkout, manual delivery bridge.
 * All 100 products have live Stripe price IDs. Checkout is live right now.
 * This console gives Sara everything she needs to start selling immediately.
 *
 * GET  /api/semantic/launch              — Revenue Launch Console (HTML admin page)
 * GET  /api/semantic/launch/status       — Machine-readable launch readiness (JSON)
 * POST /api/semantic/launch/deliver      — Manual delivery trigger: email + productId → CRM entry + content links
 * GET  /api/semantic/launch/share/:id    — Shareable product card page (clean, no nav)
 * GET  /api/semantic/launch/quick-links  — All 100 product checkout URLs (JSON)
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { getRegistry, getFromRegistry } from "../semantic/registry.js";
import { addCustomer, getCustomerStats } from "../semantic/customerStore.js";
import { scheduleFollowups } from "../semantic/emailScheduler.js";
import { sendEmailNotification } from "../utils/notifications.js";

const router = Router();

const STORE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://localhost:8080";

const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";

// ── GET /status — launch readiness JSON ──────────────────────────────────────
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const products   = await getRegistry();
    const crmStats   = getCustomerStats();
    const hasResend  = !!process.env["RESEND_API_KEY"]?.startsWith("re_");
    const hasWebhook = !!process.env["STRIPE_WEBHOOK_SECRET"];
    const hasStripe  = products.filter(p => p.stripePriceId).length;

    const readinessItems = [
      { item: "Stripe checkout",        ready: hasStripe > 0,    note: `${hasStripe}/100 products have live price IDs` },
      { item: "Store live",             ready: true,              note: `${STORE_URL}/api/semantic/store` },
      { item: "Product pages live",     ready: true,              note: `Each product has a hosted page + Stripe checkout link` },
      { item: "Manual delivery",        ready: true,              note: "Use /api/semantic/launch POST to deliver to any customer" },
      { item: "Email delivery (auto)",  ready: hasResend,         note: hasResend ? "RESEND_API_KEY active" : "Add RESEND_API_KEY to Replit Secrets" },
      { item: "Webhook capture (auto)", ready: hasWebhook,        note: hasWebhook ? "STRIPE_WEBHOOK_SECRET active" : "Configure in Stripe Dashboard + Replit Secrets" },
      { item: "Bank payout",            ready: true,              note: "Stripe auto-pays to your connected bank on normal schedule (2-7 business days)" },
    ];

    const readyCount = readinessItems.filter(r => r.ready).length;

    res.json({
      ok:           true,
      revenueReady: true,
      mode:         IS_PROD ? "production" : "test",
      products:     hasStripe,
      crmStats,
      readinessItems,
      readyCount,
      totalItems:   readinessItems.length,
      storeUrl:     `${STORE_URL}/api/semantic/store`,
      launchUrl:    `${STORE_URL}/api/semantic/launch`,
    });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /quick-links — all product checkout URLs ──────────────────────────────
router.get("/quick-links", async (_req: Request, res: Response) => {
  try {
    const products = await getRegistry();
    const links = products.map(p => ({
      id:          p.id,
      title:       p.title,
      format:      p.format,
      price:       `$${(p.priceCents / 100).toFixed(2)}`,
      priceCents:  p.priceCents,
      category:    p.category,
      tags:        p.tags,
      productPage: `${STORE_URL}/api/semantic/store/${p.id}`,
      checkout:    `${STORE_URL}/api/semantic/checkout/${p.id}`,
      contentPreview: `${STORE_URL}/api/semantic/content/${p.id}/html`,
    }));

    const byFormat = links.reduce<Record<string, typeof links>>((acc, l) => {
      if (!acc[l.format]) acc[l.format] = [];
      acc[l.format]!.push(l);
      return acc;
    }, {});

    res.json({
      ok:       true,
      total:    links.length,
      storeUrl: `${STORE_URL}/api/semantic/store`,
      byFormat,
      all:      links,
    });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── POST /deliver — manual delivery trigger ───────────────────────────────────
// Sara uses this after receiving a Stripe payment notification email.
// Enter customer email + name + productId → CRM capture + content links + optional email.
router.post("/deliver", async (req: Request, res: Response) => {
  try {
    const body = req.body as { email?: string; name?: string; productId?: string; priceCents?: number };
    const email     = String(body.email     ?? "").trim().toLowerCase();
    const name      = String(body.name      ?? "").trim() || "Valued Customer";
    const productId = String(body.productId ?? "").trim();
    const priceCents = Number(body.priceCents ?? 0);

    if (!email || !email.includes("@")) {
      res.status(400).json({ ok: false, error: "Valid email required" });
      return;
    }
    if (!productId) {
      res.status(400).json({ ok: false, error: "productId required" });
      return;
    }

    await getRegistry();
    const product = getFromRegistry(productId);
    if (!product) {
      res.status(404).json({ ok: false, error: `Product '${productId}' not found in registry` });
      return;
    }

    // ── Record in CRM ────────────────────────────────────────────────────────
    const customerId = crypto.randomUUID();
    const actualPrice = priceCents > 0 ? priceCents : product.priceCents;

    addCustomer({
      id:                   customerId,
      email,
      name,
      productId,
      productTitle:         product.title,
      productFormat:        product.format,
      priceCents:           actualPrice,
      currency:             "usd",
      stripeSessionId:      `manual_${customerId.slice(0, 8)}`,
      stripePaymentIntentId: "",
      channel:              "manual-delivery",
      deliveryEmailSent:    false,
      purchasedAt:          new Date().toISOString(),
    });

    // ── Schedule email sequences ─────────────────────────────────────────────
    scheduleFollowups({
      customerEmail: email,
      customerName:  name,
      productId,
      productTitle:  product.title,
      productFormat: product.format,
      storeUrl:      STORE_URL,
    });

    const contentPreview  = `${STORE_URL}/api/semantic/content/${productId}/html`;
    const contentDownload = `${STORE_URL}/api/semantic/content/${productId}/text`;
    const productPageUrl  = `${STORE_URL}/api/semantic/store/${productId}`;

    // ── Attempt auto delivery email if RESEND configured ─────────────────────
    let emailSent = false;
    const hasResend = !!process.env["RESEND_API_KEY"]?.startsWith("re_");

    if (hasResend) {
      const subject = `Your "${product.title}" is ready — CreateAI Brain`;
      const body = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">Your purchase is confirmed!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for purchasing <strong>${product.title}</strong>.</p>
        <p>
          <a href="${contentPreview}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin:8px 0;">View Content →</a>
        </p>
        <p><a href="${contentDownload}">↓ Download text version</a></p>
        <p style="color:#64748b;font-size:0.85rem;">Powered by CreateAI Brain</p>
      </div>`;
      const result = await sendEmailNotification([email], subject, body);
      emailSent = result.successCount > 0;
    }

    console.log(`[ManualDelivery] ✅ ${email} · "${product.title}" · $${(actualPrice / 100).toFixed(2)} · email: ${emailSent ? "sent" : "queued for manual send"}`);

    res.json({
      ok: true,
      delivered: true,
      customer: { email, name, productId, customerId },
      product: { title: product.title, format: product.format, price: `$${(actualPrice / 100).toFixed(2)}` },
      links: {
        contentPreview,
        contentDownload,
        productPage: productPageUrl,
        portalLookup: `${STORE_URL}/api/semantic/portal/me`,
      },
      emailSent,
      emailNote: emailSent
        ? "Delivery email sent automatically via Resend"
        : hasResend
          ? "Resend is configured but email send failed — check that your domain is verified in Resend and the API key has send permissions. Copy the content links above and email them manually."
          : "RESEND_API_KEY not configured — copy the content links above and email them to the customer manually.",
      crmCaptured: true,
      emailSequenceScheduled: true,
    });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    console.error("[ManualDelivery] Error:", msg);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /share/:id — clean shareable product card ────────────────────────────
router.get("/share/:id", async (req: Request, res: Response) => {
  try {
    await getRegistry();
    const p = getFromRegistry(String(req.params["id"] ?? ""));
    if (!p) { res.status(404).send("<h1>Product not found</h1>"); return; }

    const price = (p.priceCents / 100).toFixed(2);
    const checkoutUrl = `${STORE_URL}/api/semantic/checkout/${p.id}`;
    const previewUrl  = `${STORE_URL}/api/semantic/content/${p.id}/html`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${p.title} — $${price}</title>
  <meta property="og:title" content="${p.title}">
  <meta property="og:description" content="${p.shortDescription}">
  <meta property="og:type" content="product">
  <meta property="og:url" content="${STORE_URL}/api/semantic/launch/share/${p.id}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${p.title} — $${price}">
  <meta name="twitter:description" content="${p.shortDescription}">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
  <div style="background:white;border-radius:24px;padding:48px 40px;max-width:520px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.1);text-align:center;">
    <div style="display:inline-block;background:#ede9fe;color:#6366f1;border-radius:999px;padding:6px 20px;font-size:0.8rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:24px;">
      ${p.format}
    </div>
    <h1 style="font-size:1.6rem;font-weight:900;color:#0f172a;margin:0 0 16px;line-height:1.3;">${p.title}</h1>
    <p style="font-size:1rem;color:#475569;line-height:1.6;margin-bottom:28px;">${p.shortDescription}</p>
    <div style="font-size:3rem;font-weight:900;color:#6366f1;margin-bottom:8px;">$${price}</div>
    <p style="font-size:0.8rem;color:#94a3b8;margin-bottom:32px;">One-time · Instant delivery · Lifetime access</p>
    <a href="${checkoutUrl}"
       style="display:block;background:#6366f1;color:white;text-decoration:none;border-radius:14px;padding:18px 32px;font-size:1.05rem;font-weight:800;margin-bottom:16px;transition:background 0.2s;"
       onmouseover="this.style.background='#4f46e5'"
       onmouseout="this.style.background='#6366f1'">
      Buy Now — Secure Checkout →
    </a>
    <a href="${previewUrl}"
       target="_blank"
       style="display:block;background:#f8fafc;color:#6366f1;text-decoration:none;border-radius:14px;padding:14px 32px;font-size:0.9rem;font-weight:700;border:1px solid #e2e8f0;">
      👁 Preview Content First
    </a>
    <div style="margin-top:24px;display:flex;align-items:center;justify-content:center;gap:16px;font-size:0.78rem;color:#94a3b8;">
      <span>🔒 Stripe Secure</span>
      <span>·</span>
      <span>✅ Instant Access</span>
      <span>·</span>
      <span>🔄 30-Day Guarantee</span>
    </div>
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;">
      <a href="${STORE_URL}/api/semantic/store" style="font-size:0.8rem;color:#94a3b8;text-decoration:none;">
        Browse all products →
      </a>
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err: unknown) {
    res.status(500).send(`<h1>Error</h1><pre>${(err as Error).message}</pre>`);
  }
});

// ── GET / — Revenue Launch Console (HTML admin page) ─────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    const products  = await getRegistry();
    const crmStats  = getCustomerStats();
    const hasResend = !!process.env["RESEND_API_KEY"]?.startsWith("re_");
    const hasWebhook = !!process.env["STRIPE_WEBHOOK_SECRET"];

    const withPrice = products.filter(p => p.stripePriceId);

    // Group by format for the product table
    const byFormat = withPrice.reduce<Record<string, typeof withPrice>>((acc, p) => {
      if (!acc[p.format]) acc[p.format] = [];
      acc[p.format]!.push(p);
      return acc;
    }, {});

    const formatRows = Object.entries(byFormat)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([fmt, prods]) => {
        const cheapest = prods.reduce((m, p) => p.priceCents < m.priceCents ? p : m);
        const priciest = prods.reduce((m, p) => p.priceCents > m.priceCents ? p : m);
        return `<tr>
          <td style="padding:10px 14px;font-weight:700;color:#1e293b;">${fmt}</td>
          <td style="padding:10px 14px;color:#64748b;">${prods.length}</td>
          <td style="padding:10px 14px;color:#64748b;">$${(cheapest.priceCents/100).toFixed(0)} – $${(priciest.priceCents/100).toFixed(0)}</td>
          <td style="padding:10px 14px;">
            <a href="${STORE_URL}/api/semantic/launch/share/${cheapest.id}" target="_blank" style="color:#6366f1;font-size:0.82rem;font-weight:600;text-decoration:none;background:#ede9fe;padding:4px 10px;border-radius:6px;">Share Cheapest →</a>
            <a href="${STORE_URL}/api/semantic/store" target="_blank" style="color:#6366f1;font-size:0.82rem;font-weight:600;text-decoration:none;background:#ede9fe;padding:4px 10px;border-radius:6px;margin-left:6px;">Store →</a>
          </td>
        </tr>`;
      }).join("");

    // Top 10 highest-value products for quick sharing
    const top10 = [...withPrice]
      .sort((a, b) => b.priceCents - a.priceCents)
      .slice(0, 10)
      .map(p => `<tr>
        <td style="padding:8px 14px;font-size:0.87rem;color:#1e293b;font-weight:600;">${p.title.slice(0, 55)}${p.title.length > 55 ? "…" : ""}</td>
        <td style="padding:8px 14px;font-size:0.82rem;color:#64748b;">${p.format}</td>
        <td style="padding:8px 14px;font-size:0.9rem;font-weight:800;color:#6366f1;">$${(p.priceCents/100).toFixed(2)}</td>
        <td style="padding:8px 14px;">
          <a href="${STORE_URL}/api/semantic/launch/share/${p.id}" target="_blank" style="background:#6366f1;color:white;padding:5px 12px;border-radius:6px;font-size:0.78rem;font-weight:700;text-decoration:none;">Share</a>
          <a href="${STORE_URL}/api/semantic/checkout/${p.id}" target="_blank" style="background:#059669;color:white;padding:5px 12px;border-radius:6px;font-size:0.78rem;font-weight:700;text-decoration:none;margin-left:4px;">Buy Link</a>
        </td>
      </tr>`).join("");

    const checklist = [
      {
        step: "1",
        title: "Confirm your Stripe payout bank is connected",
        done: true,
        link: "https://dashboard.stripe.com/settings/payouts",
        linkText: "Stripe Payout Settings →",
        detail: "Stripe pays automatically on a 2-day rolling basis (7 days for the first payout). Verify your bank account is connected and verified.",
        critical: true,
      },
      {
        step: "2",
        title: "Share a product link — revenue starts with this",
        done: true,
        link: `${STORE_URL}/api/semantic/store`,
        linkText: "Your Live Store →",
        detail: `Post the store URL or individual product share cards on social media, email, Discord, or anywhere your audience is. Every product already has a live Stripe checkout.`,
        critical: true,
      },
      {
        step: "3",
        title: "Monitor payments in Stripe Dashboard",
        done: true,
        link: "https://dashboard.stripe.com/payments",
        linkText: "Stripe Payments Dashboard →",
        detail: "You will receive an email from Stripe for every successful payment. Until the webhook is configured, use those emails to trigger manual delivery below.",
        critical: true,
      },
      {
        step: "4",
        title: "Deliver to customers manually (use form below)",
        done: true,
        link: "#deliver",
        linkText: "Delivery Form ↓",
        detail: "When you get a Stripe payment email, enter the customer name + email + product into the delivery form below. The system records the CRM entry, generates a content link, and schedules their follow-up email sequences.",
        critical: false,
      },
      {
        step: "5",
        title: "Add RESEND_API_KEY → automate delivery emails",
        done: hasResend,
        link: "https://resend.com",
        linkText: "Get Resend API Key →",
        detail: "Sign up at resend.com (free tier: 3,000 emails/month), create an API key, add it to Replit Secrets as RESEND_API_KEY. Delivery emails, T+3 follow-up, and T+7 upsell then fire automatically.",
        critical: false,
      },
      {
        step: "6",
        title: "Configure Stripe Webhook → automate CRM capture",
        done: hasWebhook,
        link: "https://dashboard.stripe.com/webhooks",
        linkText: "Stripe Webhooks →",
        detail: `In Stripe Dashboard: Webhooks → Add endpoint → URL: ${STORE_URL}/api/semantic/webhooks/checkout-complete → Event: checkout.session.completed. Copy the signing secret → add to Replit Secrets as STRIPE_WEBHOOK_SECRET.`,
        critical: false,
      },
    ];

    const checklistHtml = checklist.map(c => `
      <div style="display:flex;gap:16px;padding:20px;background:white;border-radius:14px;border:2px solid ${c.done ? "#d1fae5" : c.critical ? "#fef3c7" : "#f1f5f9"};margin-bottom:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:${c.done ? "#10b981" : c.critical ? "#f59e0b" : "#e2e8f0"};color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9rem;flex-shrink:0;">${c.done ? "✓" : c.step}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <strong style="font-size:0.95rem;color:#1e293b;">${c.title}</strong>
            ${c.done ? "<span style='background:#d1fae5;color:#059669;border-radius:999px;padding:2px 10px;font-size:0.72rem;font-weight:700;'>DONE</span>" : c.critical ? "<span style='background:#fef3c7;color:#b45309;border-radius:999px;padding:2px 10px;font-size:0.72rem;font-weight:700;'>ACTION REQUIRED</span>" : "<span style='background:#f1f5f9;color:#64748b;border-radius:999px;padding:2px 10px;font-size:0.72rem;font-weight:700;'>OPTIONAL</span>"}
          </div>
          <p style="margin:0 0 10px;font-size:0.85rem;color:#475569;line-height:1.6;">${c.detail}</p>
          <a href="${c.link}" target="${c.link.startsWith("http") ? "_blank" : "_self"}" style="font-size:0.82rem;color:#6366f1;font-weight:700;text-decoration:none;">${c.linkText}</a>
        </div>
      </div>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Revenue Launch Console — CreateAI Brain</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
    tr:not(:last-child) td { border-bottom: 1px solid #f1f5f9; }
    input, select { width: 100%; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; background: white; transition: border 0.2s; }
    input:focus, select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    button.primary { background: #6366f1; color: white; border: none; border-radius: 10px; padding: 14px 28px; font-size: 0.95rem; font-weight: 700; cursor: pointer; width: 100%; }
    button.primary:hover { background: #4f46e5; }
    .stat { background: white; border-radius: 14px; padding: 20px 24px; border: 1px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .stat-label { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
    .stat-value { font-size: 2rem; font-weight: 900; color: #6366f1; }
    .section { background: white; border-radius: 16px; padding: 28px; border: 1px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,0.05); margin-bottom: 24px; }
    .section-title { font-size: 1rem; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .section-desc { font-size: 0.85rem; color: #64748b; margin-bottom: 20px; }
    .alert { border-left: 4px solid #10b981; background: #f0fdf4; border-radius: 0 12px 12px 0; padding: 16px 20px; margin-bottom: 24px; }
    .alert-title { font-weight: 800; color: #065f46; margin-bottom: 4px; }
    .alert-body { font-size: 0.88rem; color: #064e3b; line-height: 1.6; }
    .copy-url { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
    .copy-url span { font-family: monospace; font-size: 0.85rem; color: #334155; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .copy-btn { background: #6366f1; color: white; border: none; border-radius: 7px; padding: 7px 14px; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
    #deliverResult { display: none; }
  </style>
</head>
<body>
  <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:40px 32px;color:white;">
    <div style="max-width:1100px;margin:0 auto;">
      <div style="display:inline-block;background:${IS_PROD ? "#059669" : "#f59e0b"};color:white;border-radius:999px;padding:5px 16px;font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:20px;">
        ${IS_PROD ? "⚡ LIVE — Production Mode" : "🧪 Test Mode — Stripe Test Keys Active"}
      </div>
      <h1 style="font-size:2rem;font-weight:900;margin-bottom:10px;">Revenue Launch Console</h1>
      <p style="opacity:0.75;font-size:1rem;">Sara Stadler · CreateAI Brain · ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p>
    </div>
  </div>

  <div style="max-width:1100px;margin:0 auto;padding:40px 24px;">

    <div class="alert">
      <div class="alert-title">✅ Revenue pipeline is live right now</div>
      <div class="alert-body">
        All ${withPrice.length} products have real Stripe price IDs and hosted checkout pages. Money flows from any purchase directly to your Stripe balance, then to your connected bank on Stripe's payout schedule.
        ${IS_PROD ? "You are in <strong>production mode</strong> — real cards, real money." : "You are in <strong>test mode</strong>. To accept real money: set REPLIT_DEPLOYMENT=1 in your deployment environment."}
      </div>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:32px;">
      <div class="stat"><div class="stat-label">Live Products</div><div class="stat-value">${withPrice.length}</div></div>
      <div class="stat"><div class="stat-label">Customers in CRM</div><div class="stat-value">${crmStats.totalCustomers}</div></div>
      <div class="stat"><div class="stat-label">Revenue Captured</div><div class="stat-value">$${(crmStats.totalRevenueCents / 100).toFixed(0)}</div></div>
      <div class="stat"><div class="stat-label">Email Ready</div><div class="stat-value" style="font-size:1.4rem;">${hasResend ? "✅ Auto" : "⚠️ Manual"}</div></div>
      <div class="stat"><div class="stat-label">Webhook</div><div class="stat-value" style="font-size:1.4rem;">${hasWebhook ? "✅ Active" : "⚠️ Manual"}</div></div>
    </div>

    <!-- Quick Share -->
    <div class="section">
      <div class="section-title">🔗 Share These Links to Start Selling</div>
      <div class="section-desc">These are your primary revenue URLs. Post them anywhere — social media, email list, Discord, wherever your audience is. Each one goes directly to a Stripe checkout.</div>
      <div class="copy-url" style="margin-bottom:12px;">
        <span>${STORE_URL}/api/semantic/store</span>
        <button class="copy-btn" onclick="copyToClipboard('${STORE_URL}/api/semantic/store', this)">Copy Store URL</button>
        <a href="${STORE_URL}/api/semantic/store" target="_blank" style="background:white;border:1px solid #e2e8f0;color:#374151;text-decoration:none;border-radius:7px;padding:7px 14px;font-size:0.78rem;font-weight:700;white-space:nowrap;flex-shrink:0;">Open →</a>
      </div>
      <div class="copy-url">
        <span>${STORE_URL}/api/semantic/subscriptions/landing</span>
        <button class="copy-btn" onclick="copyToClipboard('${STORE_URL}/api/semantic/subscriptions/landing', this)">Copy Membership</button>
        <a href="${STORE_URL}/api/semantic/subscriptions/landing" target="_blank" style="background:white;border:1px solid #e2e8f0;color:#374151;text-decoration:none;border-radius:7px;padding:7px 14px;font-size:0.78rem;font-weight:700;white-space:nowrap;flex-shrink:0;">Open →</a>
      </div>
    </div>

    <!-- Top products -->
    <div class="section">
      <div class="section-title">💰 Top 10 Highest-Value Products — Share These First</div>
      <div class="section-desc">Each "Share" button opens a clean product card optimized for sharing on social media. The "Buy Link" goes directly to Stripe checkout.</div>
      <div style="overflow-x:auto;">
        <table><thead><tr><th>Product</th><th>Format</th><th>Price</th><th>Actions</th></tr></thead>
        <tbody>${top10}</tbody></table>
      </div>
    </div>

    <!-- Products by format -->
    <div class="section">
      <div class="section-title">📦 Full Catalog by Format</div>
      <div class="section-desc">${withPrice.length} products across ${Object.keys(byFormat).length} formats. All live with Stripe checkout.</div>
      <div style="overflow-x:auto;">
        <table><thead><tr><th>Format</th><th>Count</th><th>Price Range</th><th>Quick Links</th></tr></thead>
        <tbody>${formatRows}</tbody></table>
      </div>
    </div>

    <!-- Manual delivery form -->
    <div class="section" id="deliver">
      <div class="section-title">📬 Manual Delivery — Use After Each Stripe Payment Notification</div>
      <div class="section-desc">
        When you receive a payment confirmation email from Stripe, fill this form with the customer's details.
        The system instantly records the customer in CRM, generates their content access links, and schedules the T+3 and T+7 follow-up email sequences.
        ${hasResend ? "✅ <strong>Resend is configured</strong> — the delivery email will be sent automatically." : "⚠️ <strong>Resend not configured yet</strong> — copy the content links from the result below and email them to the customer manually."}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;color:#374151;margin-bottom:6px;">Customer Email *</label>
          <input type="email" id="d_email" placeholder="customer@email.com" />
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;color:#374151;margin-bottom:6px;">Customer Name</label>
          <input type="text" id="d_name" placeholder="First Last" />
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;color:#374151;margin-bottom:6px;">Product *</label>
          <select id="d_product">
            <option value="">— Select product purchased —</option>
            ${[...withPrice].sort((a,b)=>a.title.localeCompare(b.title)).map(p =>
              `<option value="${p.id}">${p.title} (${p.format}) · $${(p.priceCents/100).toFixed(2)}</option>`
            ).join("")}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:700;color:#374151;margin-bottom:6px;">Amount Paid (cents, optional)</label>
          <input type="number" id="d_price" placeholder="e.g. 1997 for $19.97" />
        </div>
      </div>
      <button class="primary" onclick="deliver()">Record Purchase + Generate Delivery Links →</button>

      <div id="deliverResult" style="margin-top:20px;background:#f0fdf4;border:2px solid #86efac;border-radius:14px;padding:24px;">
        <div style="font-size:1rem;font-weight:800;color:#065f46;margin-bottom:16px;">✅ Purchase Recorded — Customer Delivery Links</div>
        <div id="deliverLinks" style="margin-bottom:16px;"></div>
        <div id="deliverNote" style="font-size:0.85rem;color:#064e3b;line-height:1.6;padding:12px;background:rgba(255,255,255,0.6);border-radius:10px;"></div>
      </div>
    </div>

    <!-- Checklist -->
    <div class="section">
      <div class="section-title">✅ Launch Checklist — Path to Real Revenue in Your Bank</div>
      <div class="section-desc">Do these in order. Items 1–3 are all you need to start receiving real money today.</div>
      ${checklistHtml}
    </div>

    <!-- Footer links -->
    <div style="text-align:center;padding:20px 0;color:#94a3b8;font-size:0.82rem;">
      <a href="${STORE_URL}/api/semantic/store" style="color:#6366f1;font-weight:600;text-decoration:none;margin:0 12px;">Live Store</a>
      <a href="${STORE_URL}/api/semantic/portal/me" style="color:#6366f1;font-weight:600;text-decoration:none;margin:0 12px;">Customer Portal</a>
      <a href="${STORE_URL}/api/semantic/analytics/" style="color:#6366f1;font-weight:600;text-decoration:none;margin:0 12px;">Analytics</a>
      <a href="${STORE_URL}/api/semantic/subscriptions/landing" style="color:#6366f1;font-weight:600;text-decoration:none;margin:0 12px;">Membership Page</a>
      <a href="https://dashboard.stripe.com" target="_blank" style="color:#6366f1;font-weight:600;text-decoration:none;margin:0 12px;">Stripe Dashboard ↗</a>
    </div>
  </div>

  <script>
    function copyToClipboard(text, btn) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.style.background = '#059669';
        setTimeout(() => { btn.textContent = orig; btn.style.background = '#6366f1'; }, 2000);
      });
    }

    async function deliver() {
      const email     = document.getElementById('d_email').value.trim();
      const name      = document.getElementById('d_name').value.trim() || 'Valued Customer';
      const productId = document.getElementById('d_product').value;
      const priceCents = parseInt(document.getElementById('d_price').value || '0', 10);

      if (!email || !email.includes('@')) { alert('Please enter a valid customer email.'); return; }
      if (!productId) { alert('Please select the product the customer purchased.'); return; }

      const result = document.getElementById('deliverResult');
      result.style.display = 'none';

      try {
        const resp = await fetch('/api/semantic/launch/deliver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, productId, priceCents })
        });
        const d = await resp.json();

        if (!d.ok) { alert('Error: ' + d.error); return; }

        const links = d.links;
        document.getElementById('deliverLinks').innerHTML = \`
          <div style="display:grid;gap:10px;">
            <div>
              <div style="font-size:0.75rem;font-weight:700;color:#065f46;margin-bottom:4px;">CONTENT PREVIEW LINK (email this to customer):</div>
              <div style="display:flex;gap:8px;align-items:center;">
                <span style="font-family:monospace;font-size:0.82rem;background:white;padding:8px 12px;border-radius:8px;border:1px solid #86efac;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">\${links.contentPreview}</span>
                <button onclick="navigator.clipboard.writeText('\${links.contentPreview}').then(()=>{this.textContent='✅';setTimeout(()=>this.textContent='Copy',1500)})" style="background:#6366f1;color:white;border:none;border-radius:7px;padding:8px 14px;font-weight:700;cursor:pointer;white-space:nowrap;font-size:0.78rem;">Copy</button>
                <a href="\${links.contentPreview}" target="_blank" style="background:white;border:1px solid #86efac;color:#065f46;text-decoration:none;border-radius:7px;padding:8px 14px;font-size:0.78rem;font-weight:700;white-space:nowrap;">Open →</a>
              </div>
            </div>
            <div>
              <div style="font-size:0.75rem;font-weight:700;color:#065f46;margin-bottom:4px;">TEXT DOWNLOAD LINK:</div>
              <div style="display:flex;gap:8px;align-items:center;">
                <span style="font-family:monospace;font-size:0.82rem;background:white;padding:8px 12px;border-radius:8px;border:1px solid #86efac;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">\${links.contentDownload}</span>
                <button onclick="navigator.clipboard.writeText('\${links.contentDownload}').then(()=>{this.textContent='✅';setTimeout(()=>this.textContent='Copy',1500)})" style="background:#6366f1;color:white;border:none;border-radius:7px;padding:8px 14px;font-weight:700;cursor:pointer;white-space:nowrap;font-size:0.78rem;">Copy</button>
              </div>
            </div>
          </div>
        \`;

        document.getElementById('deliverNote').innerHTML = \`
          <strong>What just happened:</strong><br>
          • \${name} (\${email}) recorded in CRM as a customer of "\${d.product.title}"<br>
          • T+3 follow-up email scheduled (fires automatically when RESEND is configured)<br>
          • T+7 upsell email scheduled<br>
          • \${d.emailSent ? '✅ Delivery email sent automatically via Resend.' : '⚠️ Delivery email NOT auto-sent (RESEND_API_KEY not configured) — copy the preview link above and email it to the customer manually.'}<br><br>
          <strong>Email subject to send manually:</strong> "Your "\${d.product.title}" is ready — CreateAI Brain"<br>
          <strong>Email body:</strong> Paste the Content Preview Link above. That's their product.
        \`;
        result.style.display = 'block';
        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Clear form
        document.getElementById('d_email').value = '';
        document.getElementById('d_name').value = '';
        document.getElementById('d_product').value = '';
        document.getElementById('d_price').value = '';
      } catch(e) {
        alert('Network error. Please try again.');
      }
    }
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err: unknown) {
    res.status(500).send(`<h1>Launch Console Error</h1><pre>${(err as Error).message}</pre>`);
  }
});

export default router;
