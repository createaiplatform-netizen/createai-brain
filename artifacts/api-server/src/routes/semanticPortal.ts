/**
 * routes/semanticPortal.ts
 * ------------------------
 * Customer Self-Service Portal.
 *
 * POST /portal/lookup      — look up all purchases by email (reads PostgreSQL DB)
 * GET  /portal/me          — customer portal HTML page (email gated)
 * GET  /portal/stats       — aggregate stats (admin-only JSON)
 *
 * Auth model: email is the customer identifier — no password required.
 * Data source: PostgreSQL platform_customers table (not in-memory store).
 */

import { Router, type Request, type Response } from "express";
import {
  findCustomersByEmail,
  getCustomers,
  getCustomerStats,
} from "../lib/db.js";
import { getFromRegistry } from "../semantic/registry.js";
import { getPublicBaseUrl } from "../utils/publicUrl.js";

const router = Router();
const STORE_URL = getPublicBaseUrl();

// ── POST /lookup — return purchase history for an email ───────────────────────
router.post("/lookup", async (req: Request, res: Response) => {
  const email = String((req.body as { email?: string }).email ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    res.status(400).json({ ok: false, error: "Valid email address required" });
    return;
  }

  try {
    const purchases = await findCustomersByEmail(email);

    if (purchases.length === 0) {
      res.json({
        ok:        true,
        found:     false,
        email,
        message:   "No purchases found for this email address.",
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
        pricePaid:       "$" + (c.priceCents / 100).toFixed(2),
        purchasedAt:     c.createdAt,
        channel:         c.channel,
        isSubscription:  c.isSubscription,
        productPageUrl:  STORE_URL + "/store/" + c.productId,
        contentPreview:  STORE_URL + "/api/semantic/content/" + c.productId + "/html",
        contentDownload: STORE_URL + "/api/semantic/content/" + c.productId + "/text",
        catalog: product ? { category: product.category, tags: product.tags } : null,
      };
    });

    const totalSpent = purchases.reduce((s, c) => s + c.priceCents, 0);

    res.json({
      ok:             true,
      found:          true,
      email,
      totalPurchases: purchases.length,
      totalSpent:     "$" + (totalSpent / 100).toFixed(2),
      purchases:      enriched,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /me — self-service portal HTML page ───────────────────────────────────
router.get("/me", (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const yr = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>My Downloads — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;min-height:100vh;-webkit-font-smoothing:antialiased;line-height:1.5}
    .skip-link{position:absolute;top:-100%;left:8px;z-index:9999;background:#6366f1;color:#fff;padding:10px 18px;border-radius:0 0 10px 10px;font-size:13px;font-weight:700;text-decoration:none;transition:top .15s}
    .skip-link:focus{top:0}
    .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
    .nav{background:rgba(255,255,255,.97);backdrop-filter:blur(16px);border-bottom:1px solid #e2e8f0;padding:0 28px;position:sticky;top:0;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .nav-inner{max-width:800px;margin:0 auto;display:flex;align-items:center;height:62px;gap:20px}
    .logo{font-size:1rem;font-weight:900;letter-spacing:-.04em;text-decoration:none;color:#0f172a}
    .logo span{color:#6366f1}
    .nav-links{display:flex;gap:20px;align-items:center;margin-left:auto}
    .nav-links a{font-size:.82rem;font-weight:600;color:#64748b;text-decoration:none;transition:color .15s}
    .nav-links a:hover,.nav-links a:focus-visible{color:#6366f1}
    .nav-links a:focus-visible{outline:2px solid #6366f1;outline-offset:2px;border-radius:4px}
    .nav-cta{background:linear-gradient(135deg,#6366f1,#8b5cf6)!important;color:white!important;border-radius:8px;padding:7px 16px;box-shadow:0 2px 6px rgba(99,102,241,.3)}
    .hero{background:linear-gradient(135deg,#0c0e1a,#1e1b4b 55%,#0d1228);padding:56px 28px 72px;text-align:center;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(99,102,241,.2) 0%,transparent 65%);pointer-events:none}
    .hero-inner{max-width:600px;margin:0 auto;position:relative}
    .hero-icon{font-size:2.5rem;margin-bottom:16px}
    .hero h1{font-size:clamp(1.75rem,4vw,2.5rem);font-weight:900;color:white;letter-spacing:-.05em;margin-bottom:10px}
    .hero p{font-size:.95rem;color:rgba(203,213,225,.8);line-height:1.6}
    .container{max-width:800px;margin:0 auto;padding:0 24px 80px}
    .lookup-card{background:white;border-radius:20px;padding:36px;box-shadow:0 8px 40px rgba(0,0,0,.1),0 1px 4px rgba(0,0,0,.04);border:1.5px solid #e8ecf2;margin:-44px auto 28px;position:relative}
    .lookup-label{font-size:.72rem;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px}
    .input-row{display:flex;gap:10px;flex-wrap:wrap}
    .email-input{flex:1;min-width:180px;padding:14px 16px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:.9rem;font-family:inherit;outline:none;color:#0f172a;transition:all .15s;background:white}
    .email-input:focus{border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,.1)}
    .lookup-btn{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:12px;padding:14px 28px;font-size:.9rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all .18s;box-shadow:0 4px 12px rgba(99,102,241,.3)}
    .lookup-btn:hover,.lookup-btn:focus-visible{transform:translateY(-1px);box-shadow:0 8px 20px rgba(99,102,241,.4);outline:none}
    .lookup-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
    .status-banner{border-radius:12px;padding:14px 18px;margin-bottom:20px;font-size:.85rem;font-weight:600;display:flex;align-items:flex-start;gap:10px}
    .status-ok{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #bbf7d0;color:#15803d}
    .status-err{background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1.5px solid #fca5a5;color:#dc2626}
    .status-info{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1.5px solid #93c5fd;color:#1d4ed8}
    .summary-bar{background:linear-gradient(135deg,#ede9fe,#e0e7ff);border:1.5px solid #c4b5fd;border-radius:14px;padding:16px 20px;margin-bottom:20px;display:flex;gap:24px;flex-wrap:wrap}
    .sum-item{text-align:center}
    .sum-val{font-size:1.3rem;font-weight:900;color:#5b21b6;letter-spacing:-.02em}
    .sum-lbl{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7c3aed;margin-top:2px}
    .purchase-card{background:white;border:1.5px solid #e8ecf2;border-radius:16px;padding:22px 22px 18px;margin-bottom:14px;transition:border-color .15s,box-shadow .15s}
    .purchase-card:hover{border-color:#c4b5fd;box-shadow:0 4px 20px rgba(99,102,241,.08)}
    .pc-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
    .pc-badge{background:#ede9fe;color:#6366f1;border-radius:999px;padding:4px 12px;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;flex-shrink:0;margin-top:2px}
    .pc-title{font-size:.95rem;font-weight:800;color:#0f172a;line-height:1.35;letter-spacing:-.01em;flex:1}
    .pc-meta{font-size:.75rem;color:#94a3b8;margin-bottom:14px}
    .pc-links{display:flex;gap:8px;flex-wrap:wrap}
    .pc-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:8px;font-size:.78rem;font-weight:700;text-decoration:none;transition:all .15s;border:1.5px solid transparent}
    .pc-btn-primary{background:#6366f1;color:white;box-shadow:0 2px 6px rgba(99,102,241,.25)}
    .pc-btn-primary:hover{background:#4f46e5;color:white}
    .pc-btn-outline{background:white;color:#6366f1;border-color:#e0e7ff}
    .pc-btn-outline:hover{background:#ede9fe;border-color:#c4b5fd}
    .pc-btn-ghost{background:#f8fafc;color:#64748b;border-color:#e8ecf2}
    .pc-btn-ghost:hover{background:#f1f5f9;color:#475569}
    .empty-state{text-align:center;padding:48px 24px;color:#64748b}
    .empty-icon{font-size:3rem;margin-bottom:12px}
    .empty-title{font-size:1.05rem;font-weight:800;color:#374151;margin-bottom:8px}
    .empty-sub{font-size:.85rem;line-height:1.6}
    .empty-cta{display:inline-flex;align-items:center;gap:6px;margin-top:20px;background:#6366f1;color:white;border-radius:10px;padding:12px 22px;font-size:.85rem;font-weight:700;text-decoration:none;transition:all .18s}
    .empty-cta:hover{background:#4f46e5;color:white}
    footer{background:#0a0f1e;color:rgba(255,255,255,.35);padding:32px 24px;text-align:center;font-size:.78rem}
    footer a{color:rgba(255,255,255,.45);text-decoration:none;margin:0 10px}
    footer a:hover{color:white}
    .footer-links{margin-bottom:10px}
    @media(max-width:600px){.nav{padding:0 16px;}.hero{padding:40px 16px 60px;}.container{padding:0 16px 48px;}.lookup-card{padding:20px;}.input-row{flex-direction:column;}.lookup-btn{width:100%;}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;}}
  </style>
</head>
<body>

<a class="skip-link" href="#portal-main">Skip to main content</a>

<header>
  <nav class="nav" aria-label="Main navigation">
    <div class="nav-inner">
      <a class="logo" href="${BASE}" aria-label="CreateAI Brain home">CreateAI <span>Brain</span></a>
      <div class="nav-links">
        <a href="${BASE}/api/semantic/store">Store</a>
        <a href="${BASE}/portal/book">Book a Call</a>
        <a href="${BASE}/api/semantic/store" class="nav-cta">Shop Now</a>
      </div>
    </div>
  </nav>
</header>

<main id="portal-main">
  <div class="hero" aria-label="My Downloads">
    <div class="hero-inner">
      <div class="hero-icon" aria-hidden="true">📦</div>
      <h1>My Downloads</h1>
      <p>Enter the email you used at checkout to access all your purchased products instantly.</p>
    </div>
  </div>

  <div class="container">
    <section class="lookup-card" aria-label="Look up your purchases">
      <div class="lookup-label">Access your library</div>
      <div class="input-row" role="search">
        <label for="emailInput" class="sr-only">Email address used at checkout</label>
        <input class="email-input" type="email" id="emailInput"
          placeholder="your@email.com"
          autocomplete="email"
          aria-label="Email address used at checkout"
          aria-required="true">
        <button class="lookup-btn" id="lookupBtn" onclick="lookup()" type="button" aria-label="Look up my purchases">
          Look Up My Purchases →
        </button>
      </div>
    </section>

    <div id="result" aria-live="polite" aria-atomic="false"></div>
  </div>
</main>

<footer>
  <div class="footer-links">
    <a href="${BASE}/api/semantic/store">Browse Store</a>
    <a href="${BASE}/portal/book">Book Appointment</a>
    <a href="${BASE}">Platform Home</a>
  </div>
  <div>© ${yr} CreateAI Brain · Lakeside Trinity LLC · All purchases are yours forever</div>
</footer>

<script>
(function() {
  var emailInput = document.getElementById('emailInput');
  var lookupBtn  = document.getElementById('lookupBtn');
  var resultEl   = document.getElementById('result');

  emailInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') lookup(); });

  window.lookup = async function() {
    var email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
      showBanner('err', '⚠️ Please enter a valid email address.');
      emailInput.focus();
      return;
    }
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'Searching…';
    resultEl.innerHTML = '';

    try {
      var resp = await fetch('${BASE}/portal/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
      var data = await resp.json();

      if (!data.ok) { showBanner('err', '⚠️ Server error. Please try again in a moment.'); return; }

      if (!data.found || data.purchases.length === 0) {
        resultEl.innerHTML = \`
          <div class="empty-state" role="status">
            <div class="empty-icon" aria-hidden="true">🔍</div>
            <div class="empty-title">No purchases found</div>
            <div class="empty-sub">No orders were found for <strong>\${email}</strong>.<br>Make sure you're using the same email you checked out with.</div>
            <a class="empty-cta" href="${BASE}/api/semantic/store">Browse the Store →</a>
          </div>\`;
        return;
      }

      var html = \`<div class="summary-bar" role="status" aria-live="polite">
        <div class="sum-item"><div class="sum-val">\${data.totalPurchases}</div><div class="sum-lbl">Purchase\${data.totalPurchases !== 1 ? 's' : ''}</div></div>
        <div class="sum-item"><div class="sum-val">\${data.totalSpent}</div><div class="sum-lbl">Total Spent</div></div>
        <div class="sum-item"><div class="sum-val">∞</div><div class="sum-lbl">Lifetime Access</div></div>
      </div>\`;

      data.purchases.forEach(function(p) {
        var date = new Date(p.purchasedAt).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'});
        html += \`<article class="purchase-card" aria-label="\${p.productTitle}">
          <div class="pc-top">
            <span class="pc-badge" aria-label="Format: \${p.productFormat}">\${p.productFormat}</span>
            <div class="pc-title">\${p.productTitle}</div>
          </div>
          <div class="pc-meta">Purchased \${date} · \${p.pricePaid}\${p.isSubscription ? ' · <span style="color:#16a34a;font-weight:700;">Subscription</span>' : ''}</div>
          <div class="pc-links" role="group" aria-label="Actions for \${p.productTitle}">
            <a class="pc-btn pc-btn-primary" href="\${p.contentPreview}" target="_blank" rel="noopener" aria-label="View \${p.productTitle} content">👁 View Content</a>
            <a class="pc-btn pc-btn-outline" href="\${p.contentDownload}" aria-label="Download \${p.productTitle}">↓ Download</a>
            <a class="pc-btn pc-btn-ghost" href="\${p.productPageUrl}" aria-label="Product page for \${p.productTitle}">Product Page</a>
          </div>
        </article>\`;
      });

      resultEl.innerHTML = html;
    } catch(err) {
      showBanner('err', '⚠️ Network error. Please check your connection and try again.');
    } finally {
      lookupBtn.disabled = false;
      lookupBtn.textContent = 'Look Up My Purchases →';
    }
  };

  function showBanner(type, msg) {
    var cls = type === 'err' ? 'status-err' : type === 'ok' ? 'status-ok' : 'status-info';
    resultEl.innerHTML = '<div class="status-banner ' + cls + '" role="alert">' + msg + '</div>';
  }
})();
</script>

</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(html);
});

// ── GET /stats — portal usage stats (admin) ───────────────────────────────────
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [stats, customers] = await Promise.all([getCustomerStats(), getCustomers()]);

    const repeatBuyers = customers.reduce<Record<string, number>>((acc, c) => {
      acc[c.email] = (acc[c.email] ?? 0) + 1;
      return acc;
    }, {});

    const repeats = Object.values(repeatBuyers).filter(n => n > 1).length;

    res.json({
      ok:             true,
      totalCustomers: stats.totalCustomers,
      uniqueEmails:   stats.uniqueEmails,
      repeatBuyers:   repeats,
      totalRevenue:   "$" + (stats.totalRevenueCents / 100).toFixed(2),
      averageOrder:   "$" + (stats.averageOrderCents / 100).toFixed(2),
      ltv: stats.uniqueEmails > 0
        ? "$" + (stats.totalRevenueCents / 100 / stats.uniqueEmails).toFixed(2)
        : "$0.00",
      topFormats:   stats.topFormats,
      topProducts:  stats.topProducts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

export default router;
