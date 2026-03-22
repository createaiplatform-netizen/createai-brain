/**
 * routes/emailDashboard.ts — T013: Email Fix
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/email/dashboard    — HTML live dashboard (domain verification + stats)
 * GET  /api/email/status       — JSON credential + DNS verification status
 * POST /api/email/test         — Send a test email to verify delivery
 * GET  /api/email/events       — List recent transactional email triggers
 */

import { Router, type Request, type Response } from "express";
import { emailsSentCount, smsSentCount, lastSuccessfulEmail, lastSuccessfulSMS, credentialStatus } from "../utils/notifications.js";

const router = Router();

// ─── GET /api/email/status ─────────────────────────────────────────────────────
router.get("/status", (_req: Request, res: Response) => {
  try {
    const creds = credentialStatus();
    const apiKey  = process.env["RESEND_API_KEY"]    ?? "";
    const from    = process.env["RESEND_FROM_EMAIL"] ?? "";

    const emailConfigured = apiKey.startsWith("re_") && apiKey.length > 10;
    const fromConfigured  = from.length > 3 && from.includes("@");

    res.json({
      ok:               true,
      emailConfigured,
      fromConfigured,
      resendApiKey:     emailConfigured ? "SET (re_...)" : "MISSING — set RESEND_API_KEY in Secrets",
      fromEmail:        fromConfigured  ? from           : "MISSING — set RESEND_FROM_EMAIL in Secrets",
      emailsSentTotal:  emailsSentCount,
      lastEmailSent:    lastSuccessfulEmail,
      smsConfigured:    creds.sms.configured,
      smsSentTotal:     smsSentCount,
      lastSmsSent:      lastSuccessfulSMS,
      transactionalTriggers: [
        { event: "user.signup",         status: "wired",   route: "POST /api/auth/register" },
        { event: "checkout.completed",  status: "wired",   route: "POST /api/integrations/stripe/webhook" },
        { event: "startup.boot",        status: "wired",   route: "server startup → notifyFamily()" },
        { event: "family.alert",        status: "wired",   route: "POST /api/brain/notify" },
        { event: "autonomous.execute",  status: "wired",   route: "POST /api/above-transcend/execute" },
        { event: "subscription.renew",  status: "pending", route: "Stripe webhook → email confirmation" },
        { event: "invoice.paid",        status: "pending", route: "Legal PM invoice payment confirmation" },
        { event: "appointment.reminder",status: "pending", route: "HealthOS 24h pre-appointment reminder" },
        { event: "placement.confirmed", status: "pending", route: "StaffingOS placement confirmation" },
      ],
      dnsVerification: {
        endpoint:    "/api/credentials/dns-records",
        description: "Visit /api/credentials/dns-records to fetch current Resend DNS records",
        domainTarget: "createaiplatform.com",
        actionUrl:   "https://resend.com/domains",
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── POST /api/email/test ──────────────────────────────────────────────────────
router.post("/test", async (req: Request, res: Response) => {
  try {
    const to = String((req.body as { to?: string }).to ?? "admin@LakesideTrinity.com");
    const { sendEmailNotification } = await import("../utils/notifications.js");
    const batch = await sendEmailNotification(
      [to],
      "CreateAI Brain — Email Test",
      `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h1 style="color:#6366f1">CreateAI Brain</h1>
        <p>Your email delivery is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env["NODE_ENV"] ?? "development"}</p>
        <hr style="border-color:#e2e8f0;margin:24px 0">
        <p style="color:#64748b;font-size:12px">This test was triggered via POST /api/email/test</p>
      </div>`
    );
    const success = batch.successCount > 0;
    res.json({ ok: success, to, results: batch.results, successCount: batch.successCount, failCount: batch.failCount });
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /api/email/dashboard ─────────────────────────────────────────────────
router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const apiKey = process.env["RESEND_API_KEY"]    ?? "";
    const from   = process.env["RESEND_FROM_EMAIL"] ?? "";
    const emailOk = apiKey.startsWith("re_") && apiKey.length > 10;
    const fromOk  = from.length > 3 && from.includes("@");

    const statusIcon = (ok: boolean) => ok
      ? `<span style="color:#22c55e">✓ Configured</span>`
      : `<span style="color:#ef4444">✗ Missing</span>`;

    const triggerRow = (t: { event: string; status: string; route: string }) => {
      const color = t.status === "wired" ? "#22c55e" : "#f59e0b";
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;font-family:monospace;font-size:12px;color:#a5b4fc">${t.event}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:${color};font-size:12px">${t.status}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;font-family:monospace;font-size:11px;color:#94a3b8">${t.route}</td>
      </tr>`;
    };

    const triggers = [
      { event: "user.signup",          status: "wired",   route: "POST /api/auth/register" },
      { event: "checkout.completed",   status: "wired",   route: "POST /api/integrations/stripe/webhook" },
      { event: "startup.boot",         status: "wired",   route: "server startup → notifyFamily()" },
      { event: "family.alert",         status: "wired",   route: "POST /api/brain/notify" },
      { event: "autonomous.execute",   status: "wired",   route: "POST /api/above-transcend/execute" },
      { event: "subscription.renew",   status: "pending", route: "Stripe webhook" },
      { event: "invoice.paid",         status: "pending", route: "Legal PM" },
      { event: "appointment.reminder", status: "pending", route: "HealthOS" },
      { event: "placement.confirmed",  status: "pending", route: "StaffingOS" },
    ];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Email Dashboard — CreateAI Brain</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#020617;color:#e2e8f0;min-height:100vh;padding:32px}
  a{color:#6366f1;text-decoration:none}
  a:hover{text-decoration:underline}
  .skip-link{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden}
  .skip-link:focus{position:static;width:auto;height:auto;overflow:visible}
  h1{font-size:28px;font-weight:700;color:#fff;margin-bottom:4px}
  .subtitle{color:#64748b;font-size:14px;margin-bottom:32px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:32px}
  .card{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px}
  .card h2{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:16px}
  .stat{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #1e293b}
  .stat:last-child{border-bottom:none}
  .stat-label{font-size:13px;color:#94a3b8}
  .stat-value{font-size:13px;font-weight:600;color:#e2e8f0}
  table{width:100%;border-collapse:collapse;background:#0f172a;border-radius:12px;overflow:hidden}
  th{padding:10px 12px;background:#1e293b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#64748b;text-align:left}
  .alert{border-left:3px solid #6366f1;background:#1e293b;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:13px;color:#a5b4fc}
  .tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
  .tag-ok{background:#14532d;color:#4ade80}
  .tag-miss{background:#7f1d1d;color:#fca5a5}
  footer{margin-top:32px;font-size:12px;color:#334155;text-align:center}
</style>
</head>
<body>
<a href="#main" class="skip-link">Skip to main content</a>
<main id="main" role="main">
  <h1>Email Dashboard</h1>
  <p class="subtitle">CreateAI Brain — Resend integration status &amp; transactional email tracking</p>

  <div class="alert" role="status" aria-live="polite">
    📬 DNS verification: visit <a href="/api/credentials/dns-records" target="_blank">/api/credentials/dns-records</a>
    to fetch live Resend DNS records for <strong>createaiplatform.com</strong>.
    Then add the TXT/CNAME records at your domain registrar.
  </div>

  <div class="grid">
    <div class="card" aria-label="Resend configuration status">
      <h2>Resend Configuration</h2>
      <div class="stat"><span class="stat-label">RESEND_API_KEY</span><span class="stat-value">${statusIcon(emailOk)}</span></div>
      <div class="stat"><span class="stat-label">RESEND_FROM_EMAIL</span><span class="stat-value">${fromOk ? `<span style="color:#22c55e">✓ ${from}</span>` : statusIcon(false)}</span></div>
      <div class="stat"><span class="stat-label">Domain target</span><span class="stat-value" style="color:#a5b4fc">createaiplatform.com</span></div>
      <div class="stat"><span class="stat-label">DNS wizard</span><span class="stat-value"><a href="/api/credentials/dns-records" target="_blank" style="color:#6366f1">View records →</a></span></div>
    </div>

    <div class="card" aria-label="Email send statistics">
      <h2>Send Statistics</h2>
      <div class="stat"><span class="stat-label">Emails sent (session)</span><span class="stat-value">${emailsSentCount}</span></div>
      <div class="stat"><span class="stat-label">Last email sent</span><span class="stat-value">${lastSuccessfulEmail ?? "—"}</span></div>
      <div class="stat"><span class="stat-label">SMS sent (session)</span><span class="stat-value">${smsSentCount}</span></div>
      <div class="stat"><span class="stat-label">Last SMS sent</span><span class="stat-value">${lastSuccessfulSMS ?? "—"}</span></div>
    </div>

    <div class="card" aria-label="Quick actions">
      <h2>Quick Actions</h2>
      <div class="stat">
        <span class="stat-label">Test delivery</span>
        <span class="stat-value"><code style="font-size:11px;color:#a5b4fc">POST /api/email/test</code></span>
      </div>
      <div class="stat">
        <span class="stat-label">JSON status</span>
        <span class="stat-value"><a href="/api/email/status" target="_blank" style="color:#6366f1">View →</a></span>
      </div>
      <div class="stat">
        <span class="stat-label">DNS records</span>
        <span class="stat-value"><a href="/api/credentials/dns-records" target="_blank" style="color:#6366f1">View →</a></span>
      </div>
      <div class="stat">
        <span class="stat-label">Resend dashboard</span>
        <span class="stat-value"><a href="https://resend.com/overview" target="_blank" rel="noopener" style="color:#6366f1">resend.com →</a></span>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:24px">
    <h2 style="margin-bottom:16px">Transactional Email Triggers</h2>
    <table aria-label="Transactional email event triggers">
      <thead><tr><th>Event</th><th>Status</th><th>Route</th></tr></thead>
      <tbody>${triggers.map(triggerRow).join("")}</tbody>
    </table>
  </div>

  <footer>
    Last refreshed: ${new Date().toISOString()} &nbsp;·&nbsp;
    <a href="/api/email/status">JSON</a> &nbsp;·&nbsp;
    <a href="/api/deployment/checklist/dashboard">Deployment Checklist</a>
  </footer>
</main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err: unknown) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
