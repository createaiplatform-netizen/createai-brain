/**
 * deploymentReadiness.ts — Deployment Readiness Checklist Dashboard
 *
 * GET  /api/deployment/checklist          — JSON checklist
 * GET  /api/deployment/checklist/dashboard — HTML visual checklist
 */

import { Router, type Request, type Response } from "express";

const router = Router();

// ─── Checklist Definition ─────────────────────────────────────────────────────

interface ChecklistItem {
  id:       string;
  category: string;
  label:    string;
  detail:   string;
  check:    () => boolean;
  action?:  string;
}

const CHECKLIST: ChecklistItem[] = [
  // Infrastructure
  {
    id:       "env-database",
    category: "Infrastructure",
    label:    "Database Connected",
    detail:   "DATABASE_URL environment variable is present",
    check:    () => Boolean(process.env["DATABASE_URL"]),
    action:   "Set DATABASE_URL in Replit Secrets",
  },
  {
    id:       "env-node",
    category: "Infrastructure",
    label:    "Node Environment Set",
    detail:   "NODE_ENV is configured",
    check:    () => Boolean(process.env["NODE_ENV"]),
  },
  {
    id:       "env-port",
    category: "Infrastructure",
    label:    "Port Configured",
    detail:   "PORT environment variable is set",
    check:    () => Boolean(process.env["PORT"]),
  },
  // Payments
  {
    id:       "stripe-key",
    category: "Payments",
    label:    "Stripe Secret Key",
    detail:   "STRIPE_SECRET_KEY present for live transactions",
    check:    () => Boolean(process.env["STRIPE_SECRET_KEY"]),
    action:   "Add STRIPE_SECRET_KEY to Replit Secrets",
  },
  {
    id:       "stripe-webhook",
    category: "Payments",
    label:    "Stripe Webhook Secret",
    detail:   "STRIPE_WEBHOOK_SECRET for secure webhook verification",
    check:    () => Boolean(process.env["STRIPE_WEBHOOK_SECRET"]),
    action:   "Add STRIPE_WEBHOOK_SECRET from Stripe dashboard",
  },
  // Communications
  {
    id:       "twilio-sid",
    category: "Communications",
    label:    "Twilio SID",
    detail:   "TWILIO_SID for SMS notifications",
    check:    () => Boolean(process.env["TWILIO_SID"]),
  },
  {
    id:       "twilio-auth",
    category: "Communications",
    label:    "Twilio Auth Token",
    detail:   "TWILIO_AUTH_TOKEN for SMS notifications",
    check:    () => Boolean(process.env["TWILIO_AUTH_TOKEN"]),
  },
  {
    id:       "twilio-phone",
    category: "Communications",
    label:    "Twilio Phone Number",
    detail:   "TWILIO_PHONE sending number — enter via Credentials Hub",
    check:    () => Boolean(process.env["TWILIO_PHONE"]),
    action:   "Enter phone number at /api/credentials/dashboard",
  },
  {
    id:       "resend-key",
    category: "Communications",
    label:    "Resend API Key",
    detail:   "RESEND_API_KEY for transactional email",
    check:    () => Boolean(process.env["RESEND_API_KEY"]),
  },
  // AI
  {
    id:       "openai-key",
    category: "AI Engine",
    label:    "OpenAI API Key",
    detail:   "OPENAI_API_KEY for all 47+ AI engine modules",
    check:    () => Boolean(process.env["OPENAI_API_KEY"]),
    action:   "Add OPENAI_API_KEY to Replit Secrets",
  },
  // Observability
  {
    id:       "sentry-dsn",
    category: "Observability",
    label:    "Sentry DSN",
    detail:   "SENTRY_DSN for production error tracking",
    check:    () => Boolean(process.env["SENTRY_DSN"]),
    action:   "Enter SENTRY_DSN at /api/credentials/dashboard",
  },
  // Security
  {
    id:       "session-secret",
    category: "Security",
    label:    "Session Secret",
    detail:   "SESSION_SECRET for secure session signing",
    check:    () => Boolean(process.env["SESSION_SECRET"]),
    action:   "Add SESSION_SECRET to Replit Secrets",
  },
  {
    id:       "cors-origin",
    category: "Security",
    label:    "CORS Origin",
    detail:   "CORS_ORIGIN env var — restricts cross-origin requests in production",
    check:    () => Boolean(process.env["CORS_ORIGIN"] || process.env["NODE_ENV"] !== "production"),
  },
  // Marketplace
  {
    id:       "shopify",
    category: "Marketplace",
    label:    "Shopify Connected",
    detail:   "SHOPIFY_ACCESS_TOKEN for autonomous product publishing",
    check:    () => Boolean(process.env["SHOPIFY_ACCESS_TOKEN"]),
    action:   "Enter token at /api/credentials/dashboard",
  },
  {
    id:       "etsy",
    category: "Marketplace",
    label:    "Etsy Connected",
    detail:   "ETSY_API_KEY for Etsy store publishing",
    check:    () => Boolean(process.env["ETSY_API_KEY"]),
    action:   "Enter token at /api/credentials/dashboard",
  },
  {
    id:       "amazon",
    category: "Marketplace",
    label:    "Amazon SP-API Connected",
    detail:   "AMAZON_SP_ACCESS_TOKEN for Amazon product listings",
    check:    () => Boolean(process.env["AMAZON_SP_ACCESS_TOKEN"]),
    action:   "Enter token at /api/credentials/dashboard",
  },
];

// ─── JSON Endpoint ─────────────────────────────────────────────────────────────

router.get("/checklist", (_req: Request, res: Response) => {
  const items = CHECKLIST.map(item => ({
    id:       item.id,
    category: item.category,
    label:    item.label,
    detail:   item.detail,
    ok:       item.check(),
    action:   item.action,
  }));
  const passed   = items.filter(i => i.ok).length;
  const total    = items.length;
  const score    = Math.round((passed / total) * 100);
  const critical = items.filter(i => !i.ok && ["Infrastructure", "Security"].includes(i.category));
  const ready    = critical.length === 0;

  res.json({
    ok:          true,
    ready,
    score,
    passed,
    total,
    critical:    critical.length,
    checkedAt:   new Date().toISOString(),
    items,
  });
});

// ─── HTML Dashboard ────────────────────────────────────────────────────────────

router.get("/checklist/dashboard", (_req: Request, res: Response) => {
  const items = CHECKLIST.map(item => ({
    id:       item.id,
    category: item.category,
    label:    item.label,
    detail:   item.detail,
    ok:       item.check(),
    action:   item.action,
  }));
  const passed   = items.filter(i => i.ok).length;
  const total    = items.length;
  const score    = Math.round((passed / total) * 100);
  const critical = items.filter(i => !i.ok && ["Infrastructure", "Security"].includes(i.category));
  const ready    = critical.length === 0;
  const now      = new Date().toISOString();

  const scoreColor = score >= 85 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const readyLabel = ready ? "🟢 READY TO DEPLOY" : "🔴 NOT READY";

  const categories = [...new Set(CHECKLIST.map(c => c.category))];
  const categoryHtml = categories.map(cat => {
    const catItems = items.filter(i => i.category === cat);
    const rows = catItems.map(item => `
      <div class="item">
        <div class="item-icon">${item.ok ? "✅" : "❌"}</div>
        <div class="item-body">
          <div class="item-label">${item.label}</div>
          <div class="item-detail">${item.detail}</div>
          ${!item.ok && item.action ? `<div class="item-action">Action: ${item.action}</div>` : ""}
        </div>
      </div>
    `).join("");
    return `
      <div class="section">
        <div class="section-hd">${cat}</div>
        ${rows}
      </div>
    `;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="30">
  <title>Deployment Readiness — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;background:#020617;color:#e2e8f0;-webkit-font-smoothing:antialiased;min-height:100vh}
    a.skip{position:absolute;top:-40px;left:0;background:#6366f1;color:#fff;padding:8px 16px;text-decoration:none;font-size:.8rem;border-radius:0 0 8px 0;transition:top .15s}
    a.skip:focus{top:0}
    header{border-bottom:1px solid rgba(255,255,255,.08);padding:0 24px;height:52px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;background:rgba(2,6,23,.97);backdrop-filter:blur(12px)}
    .logo{font-size:1rem;font-weight:900;letter-spacing:-.03em;color:#e2e8f0;text-decoration:none}
    .logo span{color:#818cf8}
    .badge{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8}
    .wrap{max-width:900px;margin:0 auto;padding:32px 24px}
    h1{font-size:1.4rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}
    .sub{font-size:.8rem;color:#64748b;margin-bottom:28px}
    .score-ring{display:flex;align-items:center;gap:32px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:24px 28px;margin-bottom:28px}
    .score-num{font-size:3rem;font-weight:900;letter-spacing:-.06em;color:${scoreColor}}
    .score-label{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin-bottom:4px}
    .ready-label{font-size:.9rem;font-weight:800;letter-spacing:-.02em}
    .stat-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:24px}
    .stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 16px}
    .stat-l{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin-bottom:4px}
    .stat-v{font-size:1.4rem;font-weight:900}
    .section{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;margin-bottom:14px;overflow:hidden}
    .section-hd{padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.06);font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8}
    .item{display:flex;align-items:flex-start;gap:12px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.04)}
    .item:last-child{border-bottom:none}
    .item-icon{font-size:1rem;flex-shrink:0;margin-top:1px}
    .item-label{font-size:.82rem;font-weight:700;color:#e2e8f0;margin-bottom:2px}
    .item-detail{font-size:.72rem;color:#64748b}
    .item-action{font-size:.68rem;color:#818cf8;margin-top:4px}
  </style>
</head>
<body>
<a href="#main" class="skip">Skip to main content</a>
<header>
  <a href="/nexus" class="logo">CreateAI <span>Brain</span></a>
  <span class="badge">Deployment Readiness · Live</span>
</header>
<main id="main" class="wrap" aria-live="polite">
  <h1>Deployment Readiness</h1>
  <p class="sub">Auto-refreshes every 30 s. Generated ${now}.</p>

  <div class="score-ring">
    <div>
      <div class="score-label">Readiness Score</div>
      <div class="score-num">${score}%</div>
    </div>
    <div>
      <div class="ready-label">${readyLabel}</div>
      <div class="item-detail" style="margin-top:8px">${passed} of ${total} checks passing · ${critical.length} critical blockers</div>
    </div>
  </div>

  <div class="stat-row">
    <div class="stat"><div class="stat-l">Passed</div><div class="stat-v" style="color:#22c55e">${passed}</div></div>
    <div class="stat"><div class="stat-l">Failed</div><div class="stat-v" style="color:#ef4444">${total - passed}</div></div>
    <div class="stat"><div class="stat-l">Critical</div><div class="stat-v" style="color:#f97316">${critical.length}</div></div>
    <div class="stat"><div class="stat-l">Total</div><div class="stat-v" style="color:#94a3b8">${total}</div></div>
  </div>

  ${categoryHtml}
</main>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export default router;
