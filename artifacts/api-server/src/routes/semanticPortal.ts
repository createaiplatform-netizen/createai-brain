/**
 * routes/semanticPortal.ts
 * ------------------------
 * Customer Self-Service Portal for the Semantic Product Layer.
 *
 * POST /api/semantic/portal/lookup      — look up all purchases by email
 * GET  /api/semantic/portal/me          — customer portal HTML page (email gated)
 * GET  /api/semantic/portal/stats       — aggregate portal usage stats
 *
 * Auth model: email is the customer identifier (no password).
 * Each response includes re-download links + content preview URLs.
 * No personal data is stored beyond what was captured at purchase.
 */

import { Router, type Request, type Response } from "express";
import { findCustomerByEmail, getCustomers, getCustomerStats, type SemanticCustomer } from "../semantic/customerStore.js";
import { getFromRegistry }  from "../semantic/registry.js";

const router = Router();

const STORE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://localhost:8080";

// ── POST /lookup — return purchase history for an email ───────────────────────
router.post("/lookup", (req: Request, res: Response) => {
  const email = String((req.body as { email?: string }).email ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    res.status(400).json({ ok: false, error: "Valid email address required" });
    return;
  }

  const purchases = findCustomerByEmail(email);

  if (purchases.length === 0) {
    res.json({
      ok:       true,
      found:    false,
      email,
      message:  "No purchases found for this email address.",
      purchases: [],
    });
    return;
  }

  const enriched = purchases.map(c => {
    const product = c.productId ? getFromRegistry(c.productId) : undefined;
    return {
      purchaseId:      c.id,
      productId:       c.productId,
      productTitle:    c.productTitle,
      productFormat:   c.productFormat,
      pricePaid:       `$${(c.priceCents / 100).toFixed(2)}`,
      purchasedAt:     c.purchasedAt,
      channel:         c.channel,
      productPageUrl:  `${STORE_URL}/api/semantic/store/${c.productId}`,
      contentPreview:  `${STORE_URL}/api/semantic/content/${c.productId}/html`,
      contentDownload: `${STORE_URL}/api/semantic/content/${c.productId}/text`,
      catalog: product ? { category: product.category, tags: product.tags } : null,
    };
  }).sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());

  const totalSpent = purchases.reduce((s, c) => s + c.priceCents, 0);

  res.json({
    ok:        true,
    found:     true,
    email,
    totalPurchases: purchases.length,
    totalSpent:     `$${(totalSpent / 100).toFixed(2)}`,
    purchases:      enriched,
  });
});

// ── GET /me — self-service portal HTML page ───────────────────────────────────
router.get("/me", (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>My Purchases — CreateAI Brain</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; min-height: 100vh; }
    header { background: linear-gradient(135deg, #6366f1, #818cf8); padding: 48px 24px; text-align: center; color: white; }
    header h1 { font-size: 2rem; font-weight: 800; margin-bottom: 8px; }
    header p { opacity: 0.9; font-size: 1rem; }
    .container { max-width: 720px; margin: 40px auto; padding: 0 24px; }
    .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; margin-bottom: 24px; }
    .input-group { display: flex; gap: 12px; }
    input[type="email"] { flex: 1; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 15px; outline: none; transition: border 0.2s; }
    input[type="email"]:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    button { background: #6366f1; color: white; border: none; border-radius: 10px; padding: 14px 28px; font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    button:hover { background: #4f46e5; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    #result { display: none; }
    .purchase-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .purchase-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
    .purchase-meta { font-size: 0.8rem; color: #94a3b8; margin-bottom: 14px; }
    .badge { display: inline-block; background: #ede9fe; color: #6366f1; border-radius: 999px; padding: 3px 10px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-right: 6px; margin-bottom: 10px; }
    .link-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .link-btn { display: inline-block; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; text-decoration: none; }
    .link-btn.primary { background: #6366f1; color: white; }
    .link-btn.secondary { background: white; color: #6366f1; border: 1px solid #6366f1; }
    .link-btn.tertiary { background: white; color: #64748b; border: 1px solid #e2e8f0; }
    .error-msg { background: #fef2f2; color: #dc2626; border-radius: 10px; padding: 14px 18px; font-size: 0.9rem; }
    .empty-msg { text-align: center; color: #64748b; padding: 32px; }
    footer { text-align: center; font-size: 0.8rem; color: #94a3b8; margin: 40px 0; }
  </style>
</head>
<body>
  <header>
    <h1>My Purchases</h1>
    <p>Enter your email to access everything you've bought from CreateAI Brain</p>
  </header>
  <div class="container">
    <div class="card">
      <div class="input-group">
        <input type="email" id="emailInput" placeholder="your@email.com" autocomplete="email" />
        <button id="lookupBtn" onclick="lookup()">Look up →</button>
      </div>
    </div>
    <div id="result"></div>
  </div>
  <footer>CreateAI Brain · All purchases are yours forever</footer>

  <script>
    const input = document.getElementById('emailInput');
    input.addEventListener('keydown', e => { if (e.key === 'Enter') lookup(); });

    async function lookup() {
      const email = input.value.trim();
      if (!email || !email.includes('@')) { showError('Please enter a valid email address.'); return; }
      const btn = document.getElementById('lookupBtn');
      btn.disabled = true; btn.textContent = 'Looking up…';
      const result = document.getElementById('result');
      result.style.display = 'none';

      try {
        const resp = await fetch('/api/semantic/portal/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await resp.json();

        if (!data.ok) { showError('Server error. Please try again.'); return; }
        if (!data.found) {
          result.innerHTML = '<div class="card"><div class="empty-msg">No purchases found for <strong>' + email + '</strong>.<br><br><a href="/api/semantic/store" style="color:#6366f1;font-weight:600;">Browse the store →</a></div></div>';
        } else {
          let html = '<div class="card" style="background:#ede9fe;border:none;"><p style="font-size:0.9rem;color:#5b21b6;"><strong>' + data.totalPurchases + ' purchase' + (data.totalPurchases>1?'s':'') + '</strong> · Total spent: <strong>' + data.totalSpent + '</strong></p></div>';
          data.purchases.forEach(p => {
            html += '<div class="purchase-card">';
            html += '<div class="purchase-title">' + p.productTitle + '</div>';
            html += '<div class="purchase-meta">Purchased ' + new Date(p.purchasedAt).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'}) + ' · ' + p.pricePaid + '</div>';
            html += '<span class="badge">' + p.productFormat + '</span>';
            html += '<div class="link-row">';
            html += '<a class="link-btn primary" href="' + p.contentPreview + '">View Content ↗</a>';
            html += '<a class="link-btn secondary" href="' + p.contentDownload + '">↓ Download</a>';
            html += '<a class="link-btn tertiary" href="' + p.productPageUrl + '">Product Page</a>';
            html += '</div></div>';
          });
          result.innerHTML = html;
        }
        result.style.display = 'block';
      } catch(e) { showError('Network error. Please try again.'); }
      btn.disabled = false; btn.textContent = 'Look up →';
    }

    function showError(msg) {
      const result = document.getElementById('result');
      result.innerHTML = '<div class="card"><div class="error-msg">' + msg + '</div></div>';
      result.style.display = 'block';
    }
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ── GET /stats — portal usage stats ──────────────────────────────────────────
router.get("/stats", (_req: Request, res: Response) => {
  const stats   = getCustomerStats();
  const customers = getCustomers();

  const repeatBuyers = customers.reduce<Record<string, number>>((acc, c) => {
    acc[c.email] = (acc[c.email] ?? 0) + 1;
    return acc;
  }, {});

  const repeats = Object.values(repeatBuyers).filter(n => n > 1).length;

  res.json({
    ok: true,
    totalCustomers: stats.totalCustomers,
    uniqueEmails:   stats.uniqueEmails,
    repeatBuyers:   repeats,
    ltv: stats.uniqueEmails > 0
      ? `$${(stats.totalRevenueCents / 100 / stats.uniqueEmails).toFixed(2)}`
      : "$0.00",
    topFormats: stats.topFormats,
    topProducts: stats.topProducts,
  });
});

export default router;
