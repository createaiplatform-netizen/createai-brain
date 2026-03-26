/**
 * middlewares/adminAuth.ts
 * ─────────────────────────
 * Cookie-based admin authentication for all sensitive platform routes.
 *
 * How it works:
 *   1. On GET requests to a protected route, check for the `ADMIN_SESSION` cookie.
 *   2. If the cookie is valid (HMAC matches), pass through.
 *   3. If the cookie is missing or invalid, redirect to /admin/login.
 *   4. POST /admin/login verifies the CORE_OWNER_PASS password and sets the cookie.
 *   5. GET /admin/logout clears the cookie.
 *
 * Cookie format: base64url(JSON{user, ts}) + "." + HMAC-SHA256(base64url(payload), CORE_SECRET)
 * Sessions are valid for 24 hours.
 */

import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  return process.env["CORE_SECRET"] ?? process.env["NEXUS_SECRET"] ?? "createai-admin-fallback-2024";
}

function getOwnerPass(): string {
  return process.env["CORE_OWNER_PASS"] ?? "createai2024";
}

function b64url(s: string): string {
  return Buffer.from(s).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex").slice(0, 32);
}

export function createAdminCookie(): string {
  const payload = b64url(JSON.stringify({ user: "owner", ts: Date.now() }));
  const sig = sign(payload);
  return payload + "." + sig;
}

export function verifyAdminCookie(cookie: string): boolean {
  try {
    const dot = cookie.lastIndexOf(".");
    if (dot < 1) return false;
    const payload = cookie.slice(0, dot);
    const sig = cookie.slice(dot + 1);
    if (sign(payload) !== sig) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { user: string; ts: number };
    if (data.user !== "owner") return false;
    if (Date.now() - data.ts > SESSION_TTL_MS) return false;
    return true;
  } catch {
    return false;
  }
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const cookie = req.cookies?.["ADMIN_SESSION"] as string | undefined;
  if (cookie && verifyAdminCookie(cookie)) {
    next();
    return;
  }
  const returnTo = encodeURIComponent(req.originalUrl);
  res.redirect(302, "/admin/login?return=" + returnTo);
}

export function buildLoginPage(error?: string, returnTo?: string): string {
  const rt = returnTo ?? "/hub";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin Login — CreateAI Brain</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%;background:#020617;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;}
    .card{background:#0d1526;border:1px solid #1e293b;border-radius:20px;padding:40px 36px;width:100%;max-width:380px;box-shadow:0 24px 64px rgba(0,0,0,0.6);}
    .logo{font-size:1.1rem;font-weight:900;letter-spacing:-0.03em;color:#e2e8f0;margin-bottom:28px;text-align:center;}
    .logo span{color:#6366f1;}
    h1{font-size:1.4rem;font-weight:900;color:#e2e8f0;letter-spacing:-0.03em;text-align:center;margin-bottom:6px;}
    .sub{font-size:0.8rem;color:#64748b;text-align:center;margin-bottom:28px;}
    label{display:block;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:6px;}
    input{width:100%;background:#020617;border:1.5px solid #1e293b;border-radius:9px;padding:11px 14px;font-size:0.9rem;color:#e2e8f0;outline:none;transition:border-color .15s;margin-bottom:16px;}
    input:focus{border-color:#6366f1;}
    input::placeholder{color:#475569;}
    button{width:100%;background:#6366f1;color:#fff;border:none;border-radius:9px;padding:13px;font-size:0.95rem;font-weight:800;cursor:pointer;transition:opacity .15s;margin-top:4px;}
    button:hover{opacity:.88;}
    .err{background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:8px;padding:10px 14px;font-size:0.78rem;color:#f87171;margin-bottom:16px;}
    .hint{font-size:0.7rem;color:#475569;text-align:center;margin-top:16px;}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Create<span>AI</span> Brain</div>
    <h1>Admin Access</h1>
    <p class="sub">Owner credentials required</p>
    ${error ? `<div class="err">${error}</div>` : ""}
    <form method="POST" action="/admin/login">
      <input type="hidden" name="returnTo" value="${rt}">
      <input type="text" name="username" id="username" value="admin" autocomplete="username" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;padding:0;" aria-hidden="true" tabindex="-1">
      <label for="adminPassword">Password</label>
      <input type="password" name="password" id="adminPassword" placeholder="Enter admin password" autofocus autocomplete="current-password" aria-label="Admin password">
      <button type="submit">Sign In →</button>
    </form>
    <div style="display:flex;align-items:center;gap:10px;margin:18px 0 16px;">
      <div style="flex:1;height:1px;background:rgba(99,102,241,.15);"></div>
      <span style="font-size:.65rem;color:#475569;letter-spacing:.06em;white-space:nowrap;">or use biometrics</span>
      <div style="flex:1;height:1px;background:rgba(99,102,241,.15);"></div>
    </div>
    <button type="button" id="pk-btn" onclick="doPasskeyAuth()" style="width:100%;background:transparent;border:1.5px solid rgba(99,102,241,.35);border-radius:9px;padding:12px;font-size:.88rem;font-weight:700;color:#818cf8;cursor:pointer;transition:border-color .15s,color .15s;display:flex;align-items:center;justify-content:center;gap:8px;">
      <span style="font-size:1.1rem;">🔐</span> Sign in with Face ID / Touch ID
    </button>
    <div id="pk-status" style="display:none;margin-top:10px;padding:8px 12px;border-radius:7px;font-size:.72rem;"></div>
    <div class="hint">Session expires after 24 hours &nbsp;·&nbsp; <a href="/admin/passkey" style="color:#6366f1;text-decoration:none;">Manage passkeys</a></div>
  </div>
<script src="https://unpkg.com/@simplewebauthn/browser@13/dist/bundle/index.umd.min.js"></script>
<script>
const { startAuthentication } = SimpleWebAuthnBrowser;
async function doPasskeyAuth() {
  const btn = document.getElementById('pk-btn');
  const st  = document.getElementById('pk-status');
  btn.disabled = true;
  btn.innerHTML = '<span style="font-size:1.1rem">⏳</span> Waiting for biometric…';
  st.style.display = 'none';
  try {
    const optsRes = await fetch('/admin/passkey/auth/options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!optsRes.ok) throw new Error(await optsRes.text());
    const opts = await optsRes.json();
    const authResp = await startAuthentication({ optionsJSON: opts });
    const rt = new URLSearchParams(location.search).get('return') ?? '/hub';
    const verRes = await fetch('/admin/passkey/auth/verify?return=' + encodeURIComponent(rt), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: authResp })
    });
    const data = await verRes.json();
    if (data.verified) {
      st.style.cssText = 'display:block;background:rgba(61,160,96,.12);border:1px solid rgba(61,160,96,.3);color:#6ee7b7;';
      st.textContent = '✓ Authenticated — entering the Architect console…';
      setTimeout(() => { location.href = data.redirectTo ?? '/hub'; }, 800);
    } else {
      throw new Error(data.error ?? 'Authentication failed');
    }
  } catch(e) {
    st.style.cssText = 'display:block;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);color:#f87171;';
    st.textContent = '✗ ' + e.message;
    btn.disabled = false;
    btn.innerHTML = '<span style="font-size:1.1rem">🔐</span> Sign in with Face ID / Touch ID';
  }
}
</script>
</body>
</html>`;
}
