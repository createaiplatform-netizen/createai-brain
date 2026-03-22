/**
 * credentialsBridge.ts — In-OS Credential Bridge API
 *
 * GET  /api/credentials/status         — which tokens are connected, source (bridge/env/none)
 * POST /api/credentials/set            — enter a token from the OS (owner only)
 * DELETE /api/credentials/clear/:key   — remove a stored token
 * GET  /api/credentials/dns-records    — fetch Resend DNS records for domain verification
 * GET  /api/credentials/defs           — full credential definitions (labels, help URLs)
 */

import { Router, type Request, type Response } from "express";
import {
  setCredential,
  clearCredential,
  getCredentialStatus,
  CREDENTIAL_DEFS,
} from "../services/credentialsBridge.js";

const router = Router();

// ─── GET /api/credentials/status ─────────────────────────────────────────────

router.get("/status", (_req: Request, res: Response) => {
  const status = getCredentialStatus();
  const live   = status.filter(s => s.set).length;

  res.json({
    ok:         true,
    checkedAt:  new Date().toISOString(),
    live,
    total:      status.length,
    summary:    live === 0
      ? "No marketplace tokens connected yet. Enter them here — no Replit Secrets navigation required."
      : `${live} of ${status.length} marketplace channels connected.`,
    credentials: status,
  });
});

// ─── GET /api/credentials/defs ────────────────────────────────────────────────

router.get("/defs", (_req: Request, res: Response) => {
  res.json({ ok: true, defs: CREDENTIAL_DEFS });
});

// ─── POST /api/credentials/set ────────────────────────────────────────────────

router.post("/set", (req: Request, res: Response) => {
  const { key, value } = req.body as { key?: string; value?: string };

  if (!key || typeof key !== "string" || key.trim().length === 0) {
    res.status(400).json({ ok: false, error: "key is required" });
    return;
  }

  if (!value || typeof value !== "string" || value.trim().length === 0) {
    res.status(400).json({ ok: false, error: "value is required" });
    return;
  }

  const allowed = CREDENTIAL_DEFS.map(d => d.key);
  if (!allowed.includes(key.trim())) {
    res.status(400).json({ ok: false, error: "Unknown credential key. Must be one of: " + allowed.join(", ") });
    return;
  }

  setCredential(key.trim(), value.trim());

  res.json({
    ok:      true,
    key:     key.trim(),
    message: `${key.trim()} saved and injected — ${CREDENTIAL_DEFS.find(d => d.key === key.trim())?.channel ?? key} is now active.`,
    note:    "This credential persists across server restarts. No Replit Secrets navigation required.",
  });
});

// ─── DELETE /api/credentials/clear/:key ──────────────────────────────────────

router.delete("/clear/:key", (req: Request, res: Response) => {
  const key = String(req.params["key"] ?? "").trim();

  if (!key) {
    res.status(400).json({ ok: false, error: "key is required" });
    return;
  }

  clearCredential(key);
  res.json({ ok: true, key, message: `${key} cleared from bridge store and process.env.` });
});

// ─── GET /api/credentials/dns-records ────────────────────────────────────────
// Fetches Resend domain verification records and formats them for all major registrars.

router.get("/dns-records", async (_req: Request, res: Response) => {
  const apiKey = process.env["RESEND_API_KEY"];
  const domain = "createaiplatform.com";

  if (!apiKey) {
    res.json({
      ok:      false,
      domain,
      error:   "RESEND_API_KEY not set",
      records: [],
    });
    return;
  }

  try {
    const r = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: "Bearer " + apiKey },
    });

    if (!r.ok) {
      throw new Error("Resend API returned " + r.status);
    }

    const data = await r.json() as { data?: Array<{ name: string; status: string; records?: unknown[] }> };
    const domains = data.data ?? [];

    const match = domains.find(d => d.name?.toLowerCase().includes("lakesidetrinity") || d.name?.toLowerCase().includes("createai"));

    if (match && match.records && Array.isArray(match.records) && match.records.length > 0) {
      const records = match.records as Array<Record<string, string>>;

      const formatted = records.map((rec: Record<string, string>) => ({
        type:     rec["type"]   ?? "TXT",
        name:     rec["name"]   ?? "@",
        value:    rec["value"]  ?? "",
        ttl:      rec["ttl"]    ?? "Auto",
        verified: rec["status"] === "verified",
        godaddy: {
          type:  rec["type"]  ?? "TXT",
          host:  rec["name"]  ?? "@",
          value: rec["value"] ?? "",
          ttl:   "1 Hour",
        },
        namecheap: {
          type:  rec["type"]  ?? "TXT",
          host:  rec["name"]  ?? "@",
          value: rec["value"] ?? "",
          ttl:   "Automatic",
        },
        cloudflare: {
          type:    rec["type"]  ?? "TXT",
          name:    rec["name"]  ?? "@",
          content: rec["value"] ?? "",
          proxy:   false,
          ttl:     "Auto",
        },
      }));

      res.json({
        ok:           true,
        domain:       match.name,
        status:       match.status,
        verified:     match.status === "verified",
        recordCount:  records.length,
        records:      formatted,
        instructions: match.status === "verified"
          ? "Domain is already verified. Email delivery is active."
          : "Add each record to your domain registrar DNS settings. Verification typically completes within 48 hours.",
        registrars: ["GoDaddy", "Namecheap", "Cloudflare", "Google Domains", "Route 53"],
      });
      return;
    }

    // Domain exists but no records array, or domain not found
    // Return generic Resend TXT format for manual entry
    res.json({
      ok:           true,
      domain,
      status:       match?.status ?? "not_found",
      verified:     false,
      recordCount:  0,
      records:      [],
      instructions: match
        ? "Domain found but DNS records could not be retrieved from Resend API. Visit resend.com/domains to view your verification records."
        : "Domain not found in Resend account. Add " + domain + " at resend.com/domains first, then return here to copy the DNS records.",
      actionUrl:    "https://resend.com/domains",
    });

  } catch (err) {
    res.json({
      ok:           false,
      domain,
      error:        (err as Error).message,
      instructions: "Could not reach Resend API. Visit resend.com/domains to copy your DNS records manually.",
      actionUrl:    "https://resend.com/domains",
    });
  }
});

// ─── GET /api/credentials/dashboard — HTML credential management surface ──────
router.get("/dashboard", (_req: Request, res: Response) => {
  const creds = getCredentialStatus();
  const live  = creds.filter(c => c.set).length;

  const credsHtml = creds.map(c => {
    const def  = CREDENTIAL_DEFS.find(d => d.key === c.key);
    const statusColor = c.set ? "#34d399" : "#f87171";
    const statusLabel = c.set
      ? `✓ Connected (${c.source})`
      : "Not connected";
    return `<div class="cred-card ${c.set ? 'live' : 'pending'}">
      <div class="cc-top">
        <div>
          <div class="cc-name">${def?.label ?? c.key}</div>
          <div class="cc-channel">${c.channel}</div>
        </div>
        <span class="cc-status" style="color:${statusColor};background:${statusColor}14;border:1px solid ${statusColor}30">${statusLabel}</span>
      </div>
      ${!c.set ? `
      <div class="cc-form" id="form-${c.key}">
        <input
          class="cc-input"
          id="input-${c.key}"
          type="password"
          placeholder="${def?.placeholder ?? 'Enter token'}"
          autocomplete="new-password"
          aria-label="${def?.label ?? c.key}"
        >
        <button class="cc-btn" onclick="submitCred('${c.key}', '${def?.label ?? c.key}')">Save</button>
        ${def?.helpUrl ? `<a class="cc-help" href="${def.helpUrl}" target="_blank" rel="noopener">Where to find this →</a>` : ""}
      </div>
      <div class="cc-result" id="result-${c.key}" role="alert" aria-live="polite"></div>
      ` : `<div class="cc-connected">Credential is active — ${c.channel} marketplace sync is live. To rotate: clear first, then re-enter.</div>`}
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Credentials Hub — CreateAI Brain</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#020617;--s2:#111827;--s3:#1e293b;--line:#1e293b;
          --t1:#e2e8f0;--t2:#94a3b8;--t3:#64748b;--t4:#475569;--ind:#6366f1;--ind2:#818cf8;--g:#34d399;--r:#f87171;}
    html,body{background:var(--bg);color:var(--t1);font-family:'Inter',-apple-system,sans-serif;font-size:14px;min-height:100vh;-webkit-font-smoothing:antialiased}
    a{color:var(--ind2);text-decoration:none}a:hover{text-decoration:underline}
    .skip-link{position:absolute;top:-100px;left:1rem;background:var(--ind);color:#fff;padding:.4rem 1rem;border-radius:6px;font-weight:700;z-index:999;transition:top .2s}.skip-link:focus{top:1rem}
    .hdr{border-bottom:1px solid var(--line);padding:0 24px;background:rgba(2,6,23,.97);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
    .hdr-inner{max-width:900px;margin:0 auto;height:52px;display:flex;align-items:center;gap:14px}
    .logo{font-size:.95rem;font-weight:900;letter-spacing:-.03em}.logo span{color:var(--ind2)}
    .bdg{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:rgba(99,102,241,.15);color:var(--ind2);border:1px solid rgba(99,102,241,.3);border-radius:99px;padding:3px 10px}
    .hdr-links{margin-left:auto;display:flex;gap:16px}.hdr-links a{color:var(--t3);font-size:.78rem;font-weight:600;transition:color .15s}.hdr-links a:hover{color:var(--t1)}
    .wrap{max-width:900px;margin:0 auto;padding:32px 24px}
    .hero{margin-bottom:28px}.hero h1{font-size:1.6rem;font-weight:900;letter-spacing:-.04em;margin-bottom:4px}.hero h1 span{color:var(--ind2)}.hero p{font-size:.85rem;color:var(--t3)}
    .status-bar{display:flex;align-items:center;gap:12px;padding:14px 18px;background:${live === creds.length ? "rgba(52,211,153,.06)" : "rgba(99,102,241,.06)"};border:1px solid ${live === creds.length ? "rgba(52,211,153,.2)" : "rgba(99,102,241,.2)"};border-radius:12px;margin-bottom:24px;font-size:.82rem}
    .status-dot{width:8px;height:8px;border-radius:50%;background:${live > 0 ? "var(--g)" : "var(--r)"};flex-shrink:0}
    .status-text{font-weight:700;color:${live > 0 ? "var(--g)" : "var(--t2)"}}.status-sub{color:var(--t4);margin-left:auto}
    .creds-list{display:flex;flex-direction:column;gap:14px}
    .cred-card{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px;transition:border-color .2s}
    .cred-card.live{border-left:3px solid var(--g)}.cred-card.pending{border-left:3px solid rgba(99,102,241,.5)}
    .cc-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}
    .cc-name{font-size:.9rem;font-weight:800;margin-bottom:3px}.cc-channel{font-size:.72rem;color:var(--t3)}
    .cc-status{font-size:.68rem;font-weight:700;border-radius:99px;padding:3px 10px;white-space:nowrap;flex-shrink:0}
    .cc-form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
    .cc-input{flex:1;min-width:200px;background:var(--s3);border:1px solid var(--line);border-radius:8px;padding:9px 12px;color:var(--t1);font-family:inherit;font-size:.8rem;outline:none;transition:border-color .15s}.cc-input:focus{border-color:var(--ind2)}
    .cc-btn{background:var(--ind);color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:.78rem;font-weight:800;cursor:pointer;font-family:inherit;transition:background .15s;white-space:nowrap}.cc-btn:hover{background:var(--ind2)}
    .cc-help{font-size:.72rem;color:var(--ind2);white-space:nowrap}
    .cc-result{font-size:.78rem;border-radius:8px;padding:8px 12px;margin-top:4px;display:none}
    .cc-result.ok{background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);color:var(--g)}
    .cc-result.err{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);color:var(--r)}
    .cc-connected{font-size:.78rem;color:var(--g);font-style:italic}
    .dns-panel{background:var(--s2);border:1px solid var(--line);border-radius:14px;padding:22px;margin-top:24px}
    .dns-title{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t4);margin-bottom:12px}
    .dns-info{font-size:.8rem;color:var(--t3);line-height:1.6}
    footer{border-top:1px solid var(--line);padding:20px 24px;text-align:center;font-size:.68rem;color:var(--t4);margin-top:24px}
    @media(max-width:600px){.cc-form{flex-direction:column}.cc-input{min-width:100%}.wrap{padding:20px 16px}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="hdr" role="banner">
  <div class="hdr-inner">
    <a class="logo" href="/hub">CreateAI <span>Brain</span></a>
    <span class="bdg">Credentials Hub</span>
    <nav class="hdr-links" aria-label="Navigation">
      <a href="/hub">Hub</a>
      <a href="/api/activate/dashboard">Activation</a>
      <a href="/api/credentials/status">JSON</a>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
  <div class="hero">
    <h1>Credentials <span>Hub</span></h1>
    <p>Enter marketplace API tokens here to activate external product publishing. No Replit Secrets navigation required.</p>
  </div>

  <div class="status-bar" role="status">
    <div class="status-dot"></div>
    <span class="status-text">${live} of ${creds.length} marketplace channels connected</span>
    <span class="status-sub">${live === 0 ? "Enter tokens below to activate marketplace sync" : live === creds.length ? "All channels live — product sync is global" : "Continue entering tokens to expand reach"}</span>
  </div>

  <form onsubmit="event.preventDefault()">
    <div class="creds-list" role="list">${credsHtml}</div>
  </form>

  <div class="dns-panel">
    <div class="dns-title">Resend Email Domain Verification</div>
    <div class="dns-info">
      To enable full email delivery (beyond sivh@mail.com), verify <strong>createaiplatform.com</strong> with Resend.
      Your DNS records are available at <a href="/api/credentials/dns-records" target="_blank">GET /api/credentials/dns-records</a>.
      Paste the returned TXT records into your domain registrar. Verification typically completes in under 48 hours.
      Once verified, all notification emails will deliver globally.
    </div>
  </div>
</main>
<footer role="contentinfo">CreateAI Brain · Credential Bridge · Lakeside Trinity LLC</footer>
<script>
async function submitCred(key, label) {
  const input = document.getElementById('input-' + key);
  const resultEl = document.getElementById('result-' + key);
  const value = input.value.trim();
  if (!value) { showResult(resultEl, 'Please enter a token value.', 'err'); return; }

  try {
    const r = await fetch('/api/credentials/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    const data = await r.json();
    if (data.ok) {
      showResult(resultEl, '✓ ' + (data.message || label + ' connected.'), 'ok');
      input.value = '';
      setTimeout(() => location.reload(), 1500);
    } else {
      showResult(resultEl, '✗ ' + (data.error || 'Failed to save credential.'), 'err');
    }
  } catch (e) {
    showResult(resultEl, '✗ Network error. Try again.', 'err');
  }
}

function showResult(el, msg, type) {
  el.textContent = msg;
  el.className = 'cc-result ' + type;
  el.style.display = 'block';
}
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store");
  res.send(html);
});

export default router;
