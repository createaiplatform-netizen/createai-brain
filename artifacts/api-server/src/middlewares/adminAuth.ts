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
      <label>Password</label>
      <input type="password" name="password" placeholder="Enter admin password" autofocus autocomplete="current-password">
      <button type="submit">Sign In →</button>
    </form>
    <div class="hint">Session expires after 24 hours</div>
  </div>
</body>
</html>`;
}
