/**
 * routes/platformStatus.ts — Platform Self-Diagnostics
 * ──────────────────────────────────────────────────────
 * Real-time health, status, and self-diagnostics for the entire platform.
 *
 * GET /status        → Full platform status dashboard (HTML)
 * GET /status/json   → Machine-readable health (JSON)
 */

import { Router, type Request, type Response } from "express";
import { getUncachableStripeClient } from "../services/integrations/stripeClient.js";
import { getCustomerStats, getSql } from "../lib/db.js";
import { getPublicBaseUrl } from "../utils/publicUrl.js";

const router = Router();
const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";
const BASE    = getPublicBaseUrl();
const START   = Date.now();

async function runDiagnostics() {
  const checks: Array<{ name: string; status: "ok" | "warn" | "fail"; detail: string }> = [];

  // 1. Database
  try {
    const sql = getSql();
    await sql`SELECT 1 AS ping`;
    const stats = await getCustomerStats();
    checks.push({ name: "PostgreSQL Database", status: "ok", detail: `Connected. ${stats.totalCustomers} customers, $${(stats.totalRevenueCents / 100).toFixed(2)} total revenue` });
  } catch (e) {
    checks.push({ name: "PostgreSQL Database", status: "fail", detail: e instanceof Error ? e.message : String(e) });
  }

  // 2. Stripe
  try {
    const stripe = await getUncachableStripeClient();
    const balance = await stripe.balance.retrieve();
    const avail = balance.available[0];
    checks.push({ name: "Stripe Integration", status: "ok", detail: "Connected. Balance: $" + ((avail?.amount ?? 0) / 100).toFixed(2) + " " + (avail?.currency?.toUpperCase() ?? "USD") });
  } catch (e) {
    checks.push({ name: "Stripe Integration", status: "fail", detail: e instanceof Error ? e.message : String(e) });
  }

  // 3. Resend / Email
  {
    const hasKey = !!process.env["RESEND_API_KEY"];
    checks.push({
      name: "Resend Email",
      status: hasKey ? "ok" : "warn",
      detail: hasKey
        ? "RESEND_API_KEY present. Sends from " + (process.env["RESEND_FROM_EMAIL"] ?? "onboarding@resend.dev") + ". Domain verification required for custom sender."
        : "RESEND_API_KEY not set — email delivery disabled",
    });
  }

  // 4. Twilio / SMS
  {
    const hasSid   = !!process.env["TWILIO_SID"];
    const hasToken = !!process.env["TWILIO_AUTH_TOKEN"];
    checks.push({
      name: "Twilio SMS",
      status: hasSid && hasToken ? "ok" : "warn",
      detail: hasSid && hasToken
        ? "TWILIO_SID and TWILIO_AUTH_TOKEN present"
        : "Missing: " + (!hasSid ? "TWILIO_SID " : "") + (!hasToken ? "TWILIO_AUTH_TOKEN" : ""),
    });
  }

  // 5. Webhook secret
  const hasWebhookSecret = !!process.env["STRIPE_WEBHOOK_SECRET"];
  checks.push({
    name: "Stripe Webhook Secret",
    status: hasWebhookSecret ? "ok" : "warn",
    detail: hasWebhookSecret ? "STRIPE_WEBHOOK_SECRET is set — signature verification active" : "STRIPE_WEBHOOK_SECRET not set — webhooks will be accepted without signature verification",
  });

  // 6. Admin auth
  const hasOwnerPass = !!(process.env["CORE_OWNER_PASS"] ?? "createai2024");
  checks.push({ name: "Admin Authentication", status: "ok", detail: "Cookie-based auth active. 24-hour session TTL." + (process.env["CORE_OWNER_PASS"] ? " Custom password set." : " Using default password — set CORE_OWNER_PASS to change.") });

  // 7. OpenAI
  const hasOpenAI = !!process.env["REPLIT_CONNECTORS_HOSTNAME"];
  checks.push({ name: "OpenAI / GPT-4o", status: hasOpenAI ? "ok" : "warn", detail: hasOpenAI ? "Replit connector active — GPT-4o available" : "REPLIT_CONNECTORS_HOSTNAME not set" });

  // 8. Deployment mode
  checks.push({ name: "Deployment Mode", status: IS_PROD ? "ok" : "warn", detail: IS_PROD ? "Production (REPLIT_DEPLOYMENT=1)" : "Development — Stripe test mode active" });

  return checks;
}

router.get("/json", async (_req: Request, res: Response) => {
  try {
    const checks = await runDiagnostics();
    const stats = await getCustomerStats().catch(() => null);
    const uptimeMs = Date.now() - START;
    res.json({
      ok: checks.every(c => c.status !== "fail"),
      uptime: Math.round(uptimeMs / 1000) + "s",
      checks,
      customers: stats?.totalCustomers ?? null,
      revenue: stats ? "$" + (stats.totalRevenueCents / 100).toFixed(2) : null,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

router.get("/", async (_req: Request, res: Response) => {
  const checks = await runDiagnostics();
  const stats = await getCustomerStats().catch(() => ({ totalCustomers: 0, uniqueEmails: 0, totalRevenueCents: 0, averageOrderCents: 0, topProducts: [], topFormats: [] }));
  const uptimeMs = Date.now() - START;
  const uptimeStr = uptimeMs < 60000 ? Math.round(uptimeMs / 1000) + "s" : uptimeMs < 3600000 ? Math.round(uptimeMs / 60000) + "m" : Math.round(uptimeMs / 3600000) + "h";

  const allOk  = checks.every(c => c.status !== "fail");
  const hasWarn = checks.some(c => c.status === "warn");
  const overallStatus = allOk && !hasWarn ? "Operational" : allOk ? "Degraded" : "Fault";
  const overallColor  = allOk && !hasWarn ? "#10b981" : allOk ? "#f59e0b" : "#f87171";

  const checkRowsHtml = checks.map(c => {
    const dot = c.status === "ok" ? "#10b981" : c.status === "warn" ? "#f59e0b" : "#f87171";
    const label = c.status === "ok" ? "OK" : c.status === "warn" ? "WARN" : "FAIL";
    return `<tr>
      <td style="width:200px;font-weight:700;color:#e2e8f0;padding:10px 14px;">${c.name}</td>
      <td style="padding:10px 8px;"><span style="font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;border-radius:99px;padding:2px 9px;color:${dot};background:${dot}15;border:1px solid ${dot}30;">${label}</span></td>
      <td style="padding:10px 14px;font-size:0.78rem;color:#94a3b8;">${c.detail}</td>
    </tr>`;
  }).join("");

  const topProdsHtml = stats.topProducts.length
    ? stats.topProducts.map(p => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b;font-size:0.75rem;"><span style="color:#94a3b8;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.productTitle}</span><span style="color:#e2e8f0;font-weight:700;margin-left:12px;">${p.count}</span></div>`).join("")
    : `<div style="color:#475569;font-size:0.78rem;padding:8px 0;">No purchases yet</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Platform Status — CreateAI Brain</title>
  <meta http-equiv="refresh" content="30">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#020617;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;}
    a{color:inherit;text-decoration:none;}
    .hdr{border-bottom:1px solid #1e293b;padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;}
    .hdr-inner{max-width:1100px;margin:0 auto;height:48px;display:flex;align-items:center;gap:14px;}
    .logo{font-size:1rem;font-weight:900;letter-spacing:-.03em;}
    .logo span{color:#6366f1;}
    .hdr-links{margin-left:auto;display:flex;gap:18px;}
    .hl{font-size:.72rem;font-weight:600;color:#475569;}
    .hl:hover{color:#e2e8f0;}
    .main{max-width:1100px;margin:0 auto;padding:40px 24px;}
    .status-hero{display:flex;align-items:center;gap:16px;margin-bottom:32px;}
    .status-dot{width:18px;height:18px;border-radius:50%;flex-shrink:0;box-shadow:0 0 12px currentColor;}
    .status-label{font-size:1.8rem;font-weight:900;letter-spacing:-.04em;}
    .status-sub{font-size:.82rem;color:#64748b;margin-top:3px;}
    .kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:32px;}
    .kpi{background:#111827;border:1px solid #1e293b;border-radius:12px;padding:16px;}
    .kpi-v{font-size:1.8rem;font-weight:900;letter-spacing:-.04em;color:#e2e8f0;}
    .kpi-l{font-size:.62rem;color:#475569;margin-top:4px;text-transform:uppercase;letter-spacing:.07em;}
    h2{font-size:1rem;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px;}
    .checks-table{width:100%;border-collapse:collapse;background:#111827;border:1px solid #1e293b;border-radius:12px;overflow:hidden;margin-bottom:28px;}
    .checks-table thead th{text-align:left;padding:10px 14px;font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#475569;border-bottom:1px solid #1e293b;}
    .checks-table tbody tr:hover{background:#0d1526;}
    .meta-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
    .meta-card{background:#111827;border:1px solid #1e293b;border-radius:12px;padding:18px;}
    .meta-h{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:10px;}
    .refresh-note{font-size:.65rem;color:#475569;text-align:right;margin-top:12px;}
    @media(max-width:640px){.meta-row{grid-template-columns:1fr;}.kpi-row{grid-template-columns:1fr 1fr;}}
  </style>
</head>
<body>
<header class="hdr">
  <div class="hdr-inner">
    <div class="logo">Create<span>AI</span> Brain</div>
    <div class="hdr-links">
      <a class="hl" href="${BASE}/hub">Hub</a>
      <a class="hl" href="${BASE}/studio">Studio</a>
      <a class="hl" href="${BASE}/status/json">JSON</a>
    </div>
  </div>
</header>
<div class="main">
  <div class="status-hero">
    <div class="status-dot" style="background:${overallColor};color:${overallColor};"></div>
    <div>
      <div class="status-label" style="color:${overallColor};">${overallStatus}</div>
      <div class="status-sub">All platform systems · Auto-refresh every 30s · Uptime this session: ${uptimeStr}</div>
    </div>
  </div>
  <div class="kpi-row">
    <div class="kpi"><div class="kpi-v">${stats.totalCustomers}</div><div class="kpi-l">Total Customers</div></div>
    <div class="kpi"><div class="kpi-v">$${(stats.totalRevenueCents / 100).toFixed(2)}</div><div class="kpi-l">Total Revenue</div></div>
    <div class="kpi"><div class="kpi-v">${stats.uniqueEmails}</div><div class="kpi-l">Unique Emails</div></div>
    <div class="kpi"><div class="kpi-v">$${(stats.averageOrderCents / 100).toFixed(2)}</div><div class="kpi-l">Avg Order Value</div></div>
    <div class="kpi"><div class="kpi-v">${checks.filter(c=>c.status==="ok").length}/${checks.length}</div><div class="kpi-l">Systems Healthy</div></div>
    <div class="kpi"><div class="kpi-v">${IS_PROD?"Live":"Dev"}</div><div class="kpi-l">Environment</div></div>
  </div>
  <h2>System Checks</h2>
  <table class="checks-table">
    <thead><tr><th>System</th><th>Status</th><th>Detail</th></tr></thead>
    <tbody>${checkRowsHtml}</tbody>
  </table>
  <div class="meta-row">
    <div class="meta-card">
      <div class="meta-h">Top Products</div>
      ${topProdsHtml}
    </div>
    <div class="meta-card">
      <div class="meta-h">Quick Links</div>
      ${[
        ["Hub", "/hub"], ["Store", "/store"], ["NEXUS", "/nexus"], ["Bundle", "/bundle"],
        ["Vault", "/vault"], ["Studio", "/studio"], ["Launch", "/launch/"],
      ].map(([l, p]) => `<div style="margin-bottom:6px;"><a href="${BASE + p}" style="color:#818cf8;font-size:.78rem;font-weight:600;">→ ${l}</a></div>`).join("")}
    </div>
  </div>
  <div class="refresh-note">Auto-refreshes every 30 seconds · <a href="${BASE}/status/json" style="color:#475569;">View as JSON</a></div>
</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

/**
 * GET /status/signals — Real outbound + activity signals from live DB tables
 * Returns 24h/7d aggregated signal counts per channel and recent errors.
 */
router.get("/signals", async (_req: Request, res: Response) => {
  const sql = getSql();
  try {
    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [sent24, sent7d, errors24, byChannel24, recent] = await Promise.all([
      sql<[{ c: string }]>`SELECT COUNT(*)::text AS c FROM platform_outbound_log WHERE created_at >= ${h24.toISOString()} AND status = 'sent'`,
      sql<[{ c: string }]>`SELECT COUNT(*)::text AS c FROM platform_outbound_log WHERE created_at >= ${d7.toISOString()} AND status = 'sent'`,
      sql<[{ c: string }]>`SELECT COUNT(*)::text AS c FROM platform_outbound_log WHERE created_at >= ${h24.toISOString()} AND status != 'sent'`,
      sql<Array<{ channel: string; c: string }>>`SELECT channel, COUNT(*)::text AS c FROM platform_outbound_log WHERE created_at >= ${h24.toISOString()} GROUP BY channel ORDER BY c DESC`,
      sql<Array<{ id: number; channel: string; type: string; recipient: string; status: string; created_at: string }>>`SELECT id, channel, type, recipient, status, created_at FROM platform_outbound_log ORDER BY created_at DESC LIMIT 20`,
    ]);

    res.json({
      ok: true,
      signals: {
        sent24h:    parseInt(sent24[0]?.c ?? "0"),
        sent7d:     parseInt(sent7d[0]?.c ?? "0"),
        errors24h:  parseInt(errors24[0]?.c ?? "0"),
        byChannel24h: Object.fromEntries(byChannel24.map(r => [r.channel, parseInt(r.c)])),
      },
      recent,
      generatedAt: now.toISOString(),
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

export default router;
