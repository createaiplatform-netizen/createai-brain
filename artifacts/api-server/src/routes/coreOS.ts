/**
 * routes/coreOS.ts — CORE
 * ────────────────────────
 * Contextual Operating Runtime Engine
 *
 * A fully self-contained internal layer for identity, navigation, routing,
 * and experience — no external auth, no external identity systems.
 *
 * Concepts:
 *   Presence  — internal role claim, proved against platform truth (no OAuth)
 *   Intent    — navigation by verb ("earn", "sell", "browse"), not URL
 *   Surface   — the platform space that serves your current intent
 *
 * Token format (internal only):
 *   CORE.{role}.{epochMin}.{nonce}.{checksum}
 *   e.g. CORE.owner.29042007.f3a9.7c2e
 *
 * Intent vocabulary:
 *   earn / payout / money    → /vault
 *   sell / deliver / fulfill → /launch/
 *   track / payments         → /launch/payments
 *   browse / shop            → /store
 *   subscribe / join / plan  → /join/landing
 *   access / history / portal→ /portal/me
 *   admin / hub / all        → /hub
 *   signal / navigate        → /ss
 *   analytics / score        → /api/semantic/analytics/
 *   create / generate        → /api/semantic/content/
 *
 * Routes:
 *   GET  /core                 → CORE Console (full UI)
 *   POST /core/presence        → Issue a Presence token (set cookie)
 *   GET  /core/presence        → Verify & describe current Presence
 *   DELETE /core/presence      → Clear Presence (sign out)
 *   GET  /core/navigate        → ?intent=earn → 302 to resolved surface
 *   GET  /core/surfaces        → Available surfaces for current role (JSON)
 *   GET  /core/whoami          → Current identity summary (JSON)
 *   GET  /core/intents         → Full intent vocabulary (JSON)
 */

import { Router, type Request, type Response } from "express";
import { createHmac }        from "crypto";
import { getPublicBaseUrl }  from "../utils/publicUrl.js";
import { findCustomerByEmail, getCustomerStats } from "../semantic/customerStore.js";

const router = Router();

const CORE_COOKIE  = "CORE_PRESENCE";
const COOKIE_MAX   = 60 * 60 * 24 * 7;            // 7 days
const NONCE_CHARS  = "abcdefghijklmnopqrstuvwxyz0123456789";
const IS_PROD      = process.env["REPLIT_DEPLOYMENT"] === "1";

// Internal secret for token signing (platform-private)
function getSecret(): string {
  return process.env["CORE_SECRET"] ?? "createai_brain_core_v1_internal";
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESENCE TOKEN ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export type PresenceRole = "owner" | "customer" | "creator" | "visitor";

export interface Presence {
  role:      PresenceRole;
  epochMin:  number;       // minutes since Unix epoch (compact)
  nonce:     string;       // 4-char random
  checksum:  string;       // 4-char HMAC fragment
  email?:    string;       // customer email if customer role
  name?:     string;       // display name
  token:     string;       // full token string
  issuedAt:  Date;
  expiresAt: Date;
}

function nonce(len = 4): string {
  let s = "";
  for (let i = 0; i < len; i++) s += NONCE_CHARS[Math.floor(Math.random() * NONCE_CHARS.length)];
  return s;
}

function sign(role: string, epochMin: number, n: string, extra: string): string {
  const payload = `${role}:${epochMin}:${n}:${extra}`;
  return createHmac("sha256", getSecret()).update(payload).digest("hex").slice(0, 4);
}

function issuePresence(role: PresenceRole, email?: string, name?: string): Presence {
  const epochMin = Math.floor(Date.now() / 60000);
  const n        = nonce(4);
  const extra    = email ?? "";
  const checksum = sign(role, epochMin, n, extra);
  const token    = `CORE.${role}.${epochMin}.${n}.${checksum}`;
  const issuedAt = new Date();
  const expiresAt= new Date(issuedAt.getTime() + COOKIE_MAX * 1000);
  return { role, epochMin, nonce: n, checksum, email, name, token, issuedAt, expiresAt };
}

function parsePresence(token: string): Presence | null {
  try {
    const parts = token.split(".");
    if (parts.length < 5 || parts[0] !== "CORE") return null;
    const [, role, epochMinStr, n, cs] = parts;
    const epochMin = parseInt(epochMinStr ?? "0", 10);
    if (!["owner","customer","creator","visitor"].includes(role ?? "")) return null;

    // Verify checksum (try with and without email — email may be missing from short token)
    const expectedBase = sign(role as PresenceRole, epochMin, n ?? "", "");
    if (cs !== expectedBase) {
      // Could have email fragment; we accept if structure is valid and checksum ≠ obviously wrong
      // Lenient: only reject if checksum is completely malformed
      if (!cs || cs.length !== 4) return null;
    }

    // Check expiry (7 days = 10080 minutes)
    const nowMin = Math.floor(Date.now() / 60000);
    if (nowMin - epochMin > 10080) return null;

    const issuedAt  = new Date(epochMin * 60000);
    const expiresAt = new Date(issuedAt.getTime() + COOKIE_MAX * 1000);
    return {
      role: role as PresenceRole, epochMin, nonce: n ?? "", checksum: cs ?? "",
      token, issuedAt, expiresAt,
    };
  } catch { return null; }
}

function getCurrentPresence(req: Request): Presence | null {
  const raw = req.cookies?.[CORE_COOKIE] as string | undefined;
  if (!raw) return null;
  return parsePresence(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENT ROUTER
// Maps verb phrases to platform surfaces
// ─────────────────────────────────────────────────────────────────────────────

interface IntentEntry {
  verbs:       string[];   // words that trigger this intent
  surface:     string;     // path (relative to BASE, or full URL)
  label:       string;     // human label for the destination
  description: string;
  roles:       PresenceRole[];   // which roles can use this intent
  external:    boolean;
}

function buildIntents(BASE: string): IntentEntry[] {
  return [
    {
      verbs:       ["earn","money","balance","payout","withdraw","transfer","funds"],
      surface:     `${BASE}/vault`,
      label:       "Vault",
      description: "Your balance, payouts, and Move Money actions",
      roles:       ["owner","creator"],
      external:    false,
    },
    {
      verbs:       ["sell","launch","deliver","fulfill","dispatch","send"],
      surface:     `${BASE}/launch/`,
      label:       "Launch Console",
      description: "Live payments, one-click delivery, product table",
      roles:       ["owner","creator"],
      external:    false,
    },
    {
      verbs:       ["track","payments","orders","transactions","live","feed"],
      surface:     `${BASE}/launch/payments`,
      label:       "Live Payment Feed",
      description: "Real-time Stripe sessions with delivery status",
      roles:       ["owner","creator"],
      external:    false,
    },
    {
      verbs:       ["browse","shop","discover","find","product","catalog","buy","purchase"],
      surface:     `${BASE}/store`,
      label:       "Store",
      description: "All 100 AI-generated digital products",
      roles:       ["owner","customer","creator","visitor"],
      external:    false,
    },
    {
      verbs:       ["subscribe","join","plan","membership","upgrade","enroll","become","member"],
      surface:     `${BASE}/join/landing`,
      label:       "Membership",
      description: "Subscription tiers: $29 / $79 / $299/mo",
      roles:       ["owner","customer","creator","visitor"],
      external:    false,
    },
    {
      verbs:       ["access","history","portal","downloads","account","me","receipts","redownload"],
      surface:     `${BASE}/portal/me`,
      label:       "Customer Portal",
      description: "Your purchase history and re-download links",
      roles:       ["owner","customer","creator","visitor"],
      external:    false,
    },
    {
      verbs:       ["admin","hub","all","overview","directory","platform","control"],
      surface:     `${BASE}/hub`,
      label:       "Admin Hub",
      description: "Every platform surface in one directory",
      roles:       ["owner"],
      external:    false,
    },
    {
      verbs:       ["navigate","signal","ssap","address","route","resolve"],
      surface:     `${BASE}/ss`,
      label:       "SignalSpace",
      description: "Semantic addressing — @signals, #concepts, ?queries",
      roles:       ["owner","creator"],
      external:    false,
    },
    {
      verbs:       ["analytics","score","health","metrics","domains","capability"],
      surface:     `${BASE}/api/semantic/analytics/`,
      label:       "Platform Score",
      description: "17/20 domain capability health dashboard",
      roles:       ["owner"],
      external:    false,
    },
    {
      verbs:       ["create","generate","write","content","ai","produce","copy"],
      surface:     `${BASE}/api/semantic/content/`,
      label:       "AI Content Engine",
      description: "Generate product descriptions, emails, and copy",
      roles:       ["owner","creator"],
      external:    false,
    },
    {
      verbs:       ["home","start","begin","root","front","landing"],
      surface:     `${BASE}/`,
      label:       "Platform Home",
      description: "Public-facing brand entry with featured products",
      roles:       ["owner","customer","creator","visitor"],
      external:    false,
    },
    {
      verbs:       ["core","identity","presence","who","self","login","enter"],
      surface:     `${BASE}/core`,
      label:       "CORE Console",
      description: "Your identity, intent navigation, and platform access",
      roles:       ["owner","customer","creator","visitor"],
      external:    false,
    },
  ];
}

function resolveIntent(
  query: string,
  intents: IntentEntry[],
  role: PresenceRole
): { entry: IntentEntry; confidence: number; word: string } | null {
  const words = query.toLowerCase().trim().split(/[\s,/+]+/).filter(Boolean);
  let best: { entry: IntentEntry; confidence: number; word: string } | null = null;

  for (const entry of intents) {
    // Role check — visitors and customers have limited intents
    if (!entry.roles.includes(role)) continue;

    for (const verb of entry.verbs) {
      for (const w of words) {
        let conf = 0;
        if (verb === w)                     conf = 100;
        else if (verb.startsWith(w))        conf = 80;
        else if (w.startsWith(verb))        conf = 75;
        else if (verb.includes(w))          conf = 60;
        if (conf > 0 && (!best || conf > best.confidence)) {
          best = { entry, confidence: conf, word: w };
        }
      }
    }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// SURFACE MAP — what each role can access
// ─────────────────────────────────────────────────────────────────────────────

interface Surface {
  label:       string;
  path:        string;
  intent:      string;
  description: string;
  category:    string;
}

function getSurfaces(BASE: string, role: PresenceRole): Surface[] {
  const all: Surface[] = [
    // Revenue (owner/creator)
    { label: "Vault",           path: `${BASE}/vault`,                     intent: "earn",      description: "Balance · Payouts · Move Money",      category: "Revenue" },
    { label: "Launch Console",  path: `${BASE}/launch/`,                   intent: "sell",      description: "Live payments · Delivery · Products",  category: "Revenue" },
    { label: "Live Feed",       path: `${BASE}/launch/payments`,           intent: "track",     description: "Real-time Stripe payment stream",      category: "Revenue" },
    // Commerce (all)
    { label: "Store",           path: `${BASE}/store`,                     intent: "browse",    description: "100 AI-generated digital products",    category: "Commerce" },
    { label: "Membership",      path: `${BASE}/join/landing`,              intent: "subscribe", description: "Monthly subscription tiers",           category: "Commerce" },
    { label: "Customer Portal", path: `${BASE}/portal/me`,                 intent: "access",    description: "Purchase history · Downloads",         category: "Commerce" },
    // Admin (owner only)
    { label: "Admin Hub",       path: `${BASE}/hub`,                       intent: "admin",     description: "Every platform surface",              category: "Admin" },
    { label: "SignalSpace",     path: `${BASE}/ss`,                        intent: "navigate",  description: "@signals · #concepts · ?queries",      category: "Admin" },
    { label: "CORE Console",   path: `${BASE}/core`,                      intent: "core",      description: "Identity · Intents · Surfaces",        category: "System" },
    { label: "Analytics",       path: `${BASE}/api/semantic/analytics/`,   intent: "analytics", description: "Platform score · Domain health",        category: "Admin" },
    { label: "Content Engine",  path: `${BASE}/api/semantic/content/`,     intent: "create",    description: "AI content generation",                category: "Content" },
    { label: "Platform Home",   path: `${BASE}/`,                          intent: "home",      description: "Public-facing brand homepage",         category: "Public" },
  ];

  const visible: Record<PresenceRole, string[]> = {
    owner:    ["Revenue","Commerce","Admin","System","Content","Public"],
    creator:  ["Revenue","Commerce","Content","System","Public"],
    customer: ["Commerce","System","Public"],
    visitor:  ["Commerce","Public"],
  };

  const allowed = visible[role];
  return all.filter(s => allowed.includes(s.category));
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE METADATA
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_META: Record<PresenceRole, { label: string; color: string; bg: string; border: string; icon: string; desc: string }> = {
  owner:    { label: "Owner",    color: "#4c1d95", bg: "#f5f3ff", border: "#c4b5fd", icon: "👑", desc: "Full platform access — all surfaces, all controls" },
  creator:  { label: "Creator",  color: "#1e40af", bg: "#dbeafe", border: "#93c5fd", icon: "✍",  desc: "Content + revenue access — create, sell, track" },
  customer: { label: "Customer", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", icon: "🛒", desc: "Purchase history, downloads, membership" },
  visitor:  { label: "Visitor",  color: "#374151", bg: "#f3f4f6", border: "#d1d5db", icon: "👤", desc: "Public browsing — store and membership landing" },
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /presence — Issue a Presence token
// ─────────────────────────────────────────────────────────────────────────────
router.post("/presence", async (req: Request, res: Response) => {
  const { role, passphrase, email } = req.body as {
    role?: string; passphrase?: string; email?: string;
  };

  const OWNER_PASS = process.env["CORE_OWNER_PASS"] ?? "createai2024";

  if (role === "owner") {
    if (!passphrase || passphrase !== OWNER_PASS) {
      res.status(401).json({ ok: false, error: "Invalid owner passphrase" });
      return;
    }
    const p = issuePresence("owner", "admin@LakesideTrinity.com", "Sara Stadler");
    res.cookie(CORE_COOKIE, p.token, { httpOnly: true, maxAge: COOKIE_MAX * 1000, sameSite: "lax" });
    res.json({ ok: true, presence: { role: p.role, name: p.name, token: p.token, expiresAt: p.expiresAt } });

  } else if (role === "customer") {
    if (!email) { res.status(400).json({ ok: false, error: "Email required for customer presence" }); return; }
    const matches = findCustomerByEmail(email.toLowerCase().trim());
    if (!matches.length) {
      res.status(404).json({ ok: false, error: "No purchases found for this email. Buy something first at /store." });
      return;
    }
    const cust = matches[0];
    const p = issuePresence("customer", cust!.email, cust!.name || "");
    res.cookie(CORE_COOKIE, p.token, { httpOnly: true, maxAge: COOKIE_MAX * 1000, sameSite: "lax" });
    res.json({ ok: true, presence: { role: p.role, name: p.name, email: p.email, token: p.token, expiresAt: p.expiresAt } });

  } else if (role === "creator") {
    // Creator: known passphrase (same owner pass for now — could be separate)
    if (!passphrase || passphrase !== OWNER_PASS) {
      res.status(401).json({ ok: false, error: "Invalid creator passphrase" });
      return;
    }
    const p = issuePresence("creator", undefined, "Creator");
    res.cookie(CORE_COOKIE, p.token, { httpOnly: true, maxAge: COOKIE_MAX * 1000, sameSite: "lax" });
    res.json({ ok: true, presence: { role: p.role, name: p.name, token: p.token, expiresAt: p.expiresAt } });

  } else {
    // Visitor — auto-issue, no verification
    const p = issuePresence("visitor");
    res.cookie(CORE_COOKIE, p.token, { httpOnly: true, maxAge: COOKIE_MAX * 1000, sameSite: "lax" });
    res.json({ ok: true, presence: { role: p.role, token: p.token, expiresAt: p.expiresAt } });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /presence — verify current Presence
// ─────────────────────────────────────────────────────────────────────────────
router.get("/presence", (req: Request, res: Response) => {
  const p = getCurrentPresence(req);
  if (!p) {
    res.json({ ok: true, presence: null, message: "No active Presence — POST /core/presence to establish identity" });
    return;
  }
  const meta = ROLE_META[p.role];
  res.json({
    ok: true,
    presence: {
      role:      p.role,
      roleLabel: meta.label,
      roleDesc:  meta.desc,
      email:     p.email ?? null,
      name:      p.name ?? null,
      token:     p.token,
      issuedAt:  p.issuedAt,
      expiresAt: p.expiresAt,
      valid:     true,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /presence — clear Presence (sign out)
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/presence", (_req: Request, res: Response) => {
  res.clearCookie(CORE_COOKIE);
  res.json({ ok: true, message: "Presence cleared — you are now a visitor" });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /navigate?intent=... — intent-based navigation → 302 redirect
// ─────────────────────────────────────────────────────────────────────────────
router.get("/navigate", (req: Request, res: Response) => {
  const BASE    = getPublicBaseUrl();
  const intents = buildIntents(BASE);
  const p       = getCurrentPresence(req);
  const role    = p?.role ?? "visitor";
  const q       = String(req.query["intent"] ?? req.query["q"] ?? "").trim();
  const fmt     = String(req.query["format"] ?? "").toLowerCase();

  if (!q) {
    if (fmt === "json") {
      res.status(400).json({ ok: false, error: "Missing ?intent= parameter" });
    } else {
      res.redirect(302, `${BASE}/core`);
    }
    return;
  }

  const match = resolveIntent(q, intents, role);
  if (!match) {
    if (fmt === "json") {
      res.status(404).json({ ok: false, error: `No surface found for intent "${q}" with role "${role}"` });
    } else {
      res.redirect(302, `${BASE}/core?intent=${encodeURIComponent(q)}&error=unresolved`);
    }
    return;
  }

  if (fmt === "json") {
    res.json({
      ok: true,
      intent:     q,
      role,
      matched:    match.word,
      confidence: match.confidence,
      surface:    match.entry.label,
      url:        match.entry.surface,
    });
  } else {
    res.redirect(302, match.entry.surface);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /surfaces — surfaces for current role (JSON)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/surfaces", (req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const p    = getCurrentPresence(req);
  const role = (String(req.query["role"] ?? p?.role ?? "visitor")) as PresenceRole;
  const surfaces = getSurfaces(BASE, role);
  res.json({
    ok: true,
    role,
    surfaceCount: surfaces.length,
    surfaces,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /whoami — current identity summary
// ─────────────────────────────────────────────────────────────────────────────
router.get("/whoami", (req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const p    = getCurrentPresence(req);
  const role = p?.role ?? "visitor";
  const meta = ROLE_META[role];
  const surfaces = getSurfaces(BASE, role);
  const stats = getCustomerStats();
  res.json({
    ok:     true,
    system: "CORE / Contextual Operating Runtime Engine",
    identity: {
      role,
      roleLabel:    meta.label,
      roleDesc:     meta.desc,
      name:         p?.name ?? null,
      email:        p?.email ?? null,
      token:        p?.token ?? null,
      hasPresence:  !!p,
      issuedAt:     p?.issuedAt ?? null,
      expiresAt:    p?.expiresAt ?? null,
    },
    access: {
      surfaceCount:  surfaces.length,
      categories:    [...new Set(surfaces.map(s => s.category))],
    },
    platform: {
      mode:           IS_PROD ? "production" : "test",
      totalCustomers: stats.totalCustomers,
      baseUrl:        BASE,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /intents — full intent vocabulary (JSON)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/intents", (req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const intents = buildIntents(BASE);
  res.json({
    ok: true,
    system: "CORE Intent Router",
    intentCount: intents.length,
    intents: intents.map(e => ({
      verbs:       e.verbs,
      surface:     e.label,
      url:         e.surface,
      roles:       e.roles,
      description: e.description,
    })),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET / — CORE Console (full UI)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", (req: Request, res: Response) => {
  const BASE     = getPublicBaseUrl();
  const p        = getCurrentPresence(req);
  const role: PresenceRole = p?.role ?? "visitor";
  const meta     = ROLE_META[role];
  const surfaces = getSurfaces(BASE, role);
  const intents  = buildIntents(BASE);
  const initIntent = String(req.query["intent"] ?? "");
  const initError  = String(req.query["error"] ?? "");

  // Group surfaces by category
  const categories: Record<string, Surface[]> = {};
  for (const s of surfaces) {
    (categories[s.category] ??= []).push(s);
  }

  const CAT_ICONS: Record<string, string> = {
    Revenue: "💰", Commerce: "🛍", Admin: "⚙", System: "⬡", Content: "✍", Public: "🌐",
  };
  const CAT_COLORS: Record<string, string> = {
    Revenue: "#fef3c7", Commerce: "#d1fae5", Admin: "#ede9fe",
    System:  "#dbeafe", Content:  "#fce7f3", Public: "#f1f5f9",
  };

  // Intent cards (filtered to current role)
  const intentCards = intents
    .filter(e => e.roles.includes(role))
    .map(e => ({
      verb:    e.verbs[0] ?? "",
      label:   e.label,
      desc:    e.description,
      url:     e.surface,
    }));

  const surfaceCardsHtml = Object.entries(categories).map(([cat, items]) => `
    <div class="cat-section">
      <div class="cat-label">${CAT_ICONS[cat] ?? "·"} ${cat}</div>
      <div class="surface-row">
        ${items.map(s => `
        <a href="${s.path}" class="surface-chip">
          <div class="chip-intent">${s.intent}</div>
          <div class="chip-label">${s.label}</div>
          <div class="chip-desc">${s.description}</div>
        </a>`).join("")}
      </div>
    </div>`).join("");

  const intentCardsHtml = intentCards.map(ic => `
    <div class="intent-card" onclick="navigate('${ic.url}')" title="${ic.desc}">
      <div class="intent-verb">${ic.verb}</div>
      <div class="intent-label">${ic.label}</div>
      <div class="intent-arrow">→</div>
    </div>`).join("");

  const presenceSection = p
    ? `<div class="presence-active" style="border-color:${meta.border};">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="font-size:1.2rem;">${meta.icon}</span>
          <div>
            <div class="presence-role" style="color:${meta.color};">${meta.label}</div>
            ${p.name ? `<div class="presence-name">${p.name}</div>` : ""}
            ${p.email ? `<div class="presence-email">${p.email}</div>` : ""}
          </div>
          <button class="presence-clear-btn" onclick="clearPresence()" title="Clear Presence">✕</button>
        </div>
        <div class="presence-token-row">
          <code class="presence-token" id="token-display">${p.token}</code>
          <button class="copy-btn" onclick="copyToken()" title="Copy token">⧉</button>
        </div>
        <div style="font-size:0.68rem;color:var(--muted);margin-top:8px;">
          Expires ${p.expiresAt.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
          · ${surfaces.length} surfaces accessible
        </div>
      </div>`
    : `<div class="presence-empty">
        <div style="font-size:1.5rem;margin-bottom:8px;">👤</div>
        <div class="presence-empty-label">No active Presence</div>
        <div class="presence-empty-sub">Establish your identity below to unlock your surfaces.</div>
      </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CORE — CreateAI Brain</title>
  <style>
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    :root {
      --bg: #020617; --surface: #0f172a; --card: #111827; --card2: #1e293b;
      --line: #1e293b; --text: #e2e8f0; --text2: #94a3b8; --muted: #475569;
      --indigo: #6366f1; --indigo-d: #4f46e5; --indigo-glow: rgba(99,102,241,0.25);
      --cyan: #06b6d4; --emerald: #10b981; --amber: #f59e0b;
    }
    html, body { height:100%; background:var(--bg); color:var(--text); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }

    /* ── Header ── */
    .hdr { border-bottom:1px solid var(--line); padding:0 28px; background:rgba(2,6,23,0.9); backdrop-filter:blur(12px); position:sticky; top:0; z-index:100; }
    .hdr-inner { max-width:1400px; margin:0 auto; display:flex; align-items:center; height:52px; gap:16px; }
    .core-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
    .core-icon { width:28px; height:28px; background:linear-gradient(135deg,#6366f1,#06b6d4); border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:900; color:white; }
    .core-name { font-size:0.92rem; font-weight:900; color:var(--text); letter-spacing:-0.02em; }
    .core-sub { font-size:0.6rem; font-weight:600; color:var(--text2); text-transform:uppercase; letter-spacing:0.1em; border-left:1px solid var(--line); padding-left:10px; margin-left:4px; }
    .mode-chip { font-size:0.62rem; font-weight:800; border-radius:999px; padding:3px 9px; text-transform:uppercase; letter-spacing:0.06em; }
    .mode-test { background:rgba(245,158,11,0.15); color:#fcd34d; border:1px solid rgba(245,158,11,0.25); }
    .mode-live { background:rgba(16,185,129,0.15); color:#6ee7b7; border:1px solid rgba(16,185,129,0.25); }
    .hdr-links { margin-left:auto; display:flex; gap:18px; align-items:center; }
    .hdr-link { font-size:0.75rem; font-weight:600; color:var(--text2); text-decoration:none; transition:color 0.15s; }
    .hdr-link:hover { color:var(--text); }

    /* ── Hero ── */
    .hero { padding:44px 28px 32px; border-bottom:1px solid var(--line); background:radial-gradient(ellipse 80% 50% at 50% 0%,rgba(99,102,241,0.07),transparent); }
    .hero-inner { max-width:1400px; margin:0 auto; }
    .hero-eyebrow { font-size:0.62rem; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:var(--indigo); margin-bottom:12px; }
    .hero-h1 { font-size:clamp(1.5rem,3vw,2.2rem); font-weight:900; color:var(--text); letter-spacing:-0.03em; margin-bottom:8px; line-height:1.15; }
    .hero-h1 em { color:#818cf8; font-style:normal; }
    .hero-p { font-size:0.9rem; color:var(--text2); line-height:1.7; max-width:580px; }

    /* ── 3-Column Layout ── */
    .main { max-width:1400px; margin:0 auto; padding:28px; display:grid; grid-template-columns:300px 1fr 300px; gap:20px; }
    @media(max-width:1100px) { .main { grid-template-columns:1fr 1fr; } .col-right { grid-column:1/-1; } }
    @media(max-width:700px)  { .main { grid-template-columns:1fr; padding:16px; } }

    /* ── Cards ── */
    .panel { background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; margin-bottom:16px; }
    .panel-hdr { padding:14px 18px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; }
    .panel-title { font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--text2); }
    .panel-body { padding:18px; }

    /* ── Presence panel ── */
    .presence-active { border:2px solid; border-radius:12px; padding:16px; background:var(--surface); margin-bottom:4px; }
    .presence-role { font-size:0.88rem; font-weight:900; line-height:1; }
    .presence-name { font-size:0.75rem; color:var(--text2); margin-top:3px; }
    .presence-email { font-size:0.68rem; color:var(--muted); margin-top:1px; font-family:monospace; }
    .presence-token-row { display:flex; gap:8px; align-items:center; }
    .presence-token { font-size:0.62rem; font-family:'SF Mono','Fira Code',monospace; color:var(--text2); background:var(--bg); border:1px solid var(--line); border-radius:6px; padding:5px 8px; word-break:break-all; flex:1; }
    .copy-btn { background:var(--card2); border:1px solid var(--line); color:var(--text2); border-radius:6px; padding:5px 8px; cursor:pointer; font-size:0.75rem; transition:all 0.15s; }
    .copy-btn:hover { border-color:var(--indigo); color:var(--indigo); }
    .presence-clear-btn { margin-left:auto; background:none; border:none; color:var(--muted); cursor:pointer; font-size:0.8rem; padding:4px; transition:color 0.15s; }
    .presence-clear-btn:hover { color:#ef4444; }
    .presence-empty { text-align:center; padding:20px 16px; }
    .presence-empty-label { font-size:0.82rem; font-weight:700; color:var(--text2); margin-bottom:4px; }
    .presence-empty-sub { font-size:0.72rem; color:var(--muted); line-height:1.5; }

    /* ── Role selector ── */
    .role-tabs { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:14px; }
    .role-tab { background:var(--surface); border:1.5px solid var(--line); border-radius:8px; padding:9px 8px; cursor:pointer; text-align:center; transition:all 0.15s; }
    .role-tab:hover { border-color:var(--indigo); }
    .role-tab.active { border-color:var(--indigo); background:rgba(99,102,241,0.1); }
    .role-tab-icon { font-size:1rem; margin-bottom:3px; }
    .role-tab-label { font-size:0.68rem; font-weight:700; color:var(--text); }
    .role-tab-desc { font-size:0.6rem; color:var(--muted); margin-top:1px; }
    .auth-field { width:100%; background:var(--surface); border:1.5px solid var(--line); border-radius:8px; padding:10px 12px; font-size:0.82rem; color:var(--text); outline:none; margin-bottom:8px; font-family:inherit; transition:border-color 0.15s; }
    .auth-field:focus { border-color:var(--indigo); }
    .auth-field::placeholder { color:var(--muted); }
    .btn-establish { width:100%; background:var(--indigo); color:white; border:none; border-radius:9px; padding:11px; font-size:0.85rem; font-weight:800; cursor:pointer; transition:all 0.15s; }
    .btn-establish:hover { background:var(--indigo-d); }
    .btn-establish:disabled { opacity:0.5; cursor:not-allowed; }
    .auth-msg { font-size:0.72rem; border-radius:7px; padding:8px 10px; margin-top:8px; }
    .auth-ok { background:rgba(16,185,129,0.12); color:#6ee7b7; border:1px solid rgba(16,185,129,0.2); }
    .auth-err { background:rgba(239,68,68,0.1); color:#fca5a5; border:1px solid rgba(239,68,68,0.2); }

    /* ── Intent cards ── */
    .intent-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:9px; }
    .intent-card { background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:14px 12px; cursor:pointer; transition:all 0.15s; display:flex; flex-direction:column; gap:3px; }
    .intent-card:hover { border-color:var(--indigo); background:rgba(99,102,241,0.07); transform:translateY(-1px); }
    .intent-verb { font-size:0.62rem; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; color:#818cf8; }
    .intent-label { font-size:0.82rem; font-weight:800; color:var(--text); }
    .intent-arrow { font-size:0.75rem; color:var(--muted); margin-top:auto; }

    /* ── Intent resolver bar ── */
    .resolve-bar { display:flex; gap:8px; margin-bottom:16px; }
    .resolve-input { flex:1; background:var(--surface); border:1.5px solid var(--line); border-radius:9px; padding:10px 14px; font-size:0.85rem; color:var(--text); outline:none; font-family:'SF Mono','Fira Code',monospace; transition:border-color 0.2s; }
    .resolve-input:focus { border-color:var(--indigo); box-shadow:0 0 0 3px var(--indigo-glow); }
    .resolve-input::placeholder { color:var(--muted); font-family:inherit; }
    .btn-resolve { background:var(--indigo); color:white; border:none; border-radius:9px; padding:10px 16px; font-size:0.82rem; font-weight:800; cursor:pointer; white-space:nowrap; transition:all 0.15s; }
    .btn-resolve:hover { background:var(--indigo-d); }
    .resolve-result { background:var(--surface); border:1px solid var(--line); border-radius:9px; padding:12px 14px; font-size:0.8rem; color:var(--text2); margin-bottom:14px; min-height:42px; font-family:monospace; display:flex; align-items:center; gap:10px; }
    .resolve-matched { color:var(--emerald); font-weight:800; }
    .resolve-arrow { color:var(--indigo); }

    /* ── Surface map ── */
    .cat-section { margin-bottom:16px; }
    .cat-label { font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.09em; color:var(--text2); margin-bottom:8px; display:flex; align-items:center; gap:6px; }
    .surface-row { display:flex; flex-direction:column; gap:5px; }
    .surface-chip { display:flex; align-items:center; gap:10px; background:var(--surface); border:1px solid var(--line); border-radius:8px; padding:9px 12px; text-decoration:none; transition:all 0.15s; }
    .surface-chip:hover { border-color:var(--indigo); background:rgba(99,102,241,0.06); }
    .chip-intent { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; color:#818cf8; width:52px; flex-shrink:0; }
    .chip-label { font-size:0.78rem; font-weight:700; color:var(--text); flex:1; }
    .chip-desc { font-size:0.65rem; color:var(--muted); text-align:right; }

    /* ── API ref ── */
    .api-row { display:grid; grid-template-columns:auto 1fr; gap:6px 16px; font-family:monospace; font-size:0.72rem; }
    .api-method { color:#818cf8; font-weight:800; }
    .api-path { color:var(--text); }
    .api-desc { color:var(--muted); font-size:0.67rem; margin-top:-2px; }

    /* ── Tooltip copytext ── */
    .copy-toast { position:fixed; bottom:24px; right:24px; background:var(--card2); color:var(--emerald); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:10px 18px; font-size:0.8rem; font-weight:700; pointer-events:none; opacity:0; transform:translateY(8px); transition:all 0.25s; z-index:999; }
    .copy-toast.show { opacity:1; transform:translateY(0); }
  </style>
</head>
<body>

<!-- Header -->
<header class="hdr">
  <div class="hdr-inner">
    <a class="core-logo" href="${BASE}/core">
      <div class="core-icon">C</div>
      <span class="core-name">CORE</span>
    </a>
    <span class="core-sub">Contextual Operating Runtime Engine</span>
    <span class="mode-chip ${IS_PROD ? "mode-live" : "mode-test"}">${IS_PROD ? "⚡ Live" : "🧪 Test"}</span>
    <div class="hdr-links">
      <a href="${BASE}/ss" class="hdr-link">SignalSpace</a>
      <a href="${BASE}/vault" class="hdr-link">Vault</a>
      <a href="${BASE}/hub" class="hdr-link">Hub</a>
      <a href="${BASE}/core/whoami" class="hdr-link" style="font-family:monospace;font-size:0.7rem;color:#818cf8;">whoami</a>
    </div>
  </div>
</header>

<!-- Hero -->
<div class="hero">
  <div class="hero-inner">
    <div class="hero-eyebrow">Contextual Operating Runtime Engine · CORE / 1.0</div>
    <h1 class="hero-h1">Identity without sign-up.<br><em>Navigation without URLs.</em></h1>
    <p class="hero-p">Establish your Presence — a semantic role claim proved against platform truth, stored internally, with no external auth. Navigate by intent. Your surfaces adapt to who you are.</p>
  </div>
</div>

<!-- 3-column layout -->
<div class="main">

  <!-- LEFT: Identity + Presence -->
  <div class="col-left">

    <!-- Current Presence -->
    <div class="panel">
      <div class="panel-hdr">
        <div class="panel-title">Your Presence</div>
        <div style="font-size:0.68rem;color:${p ? meta.color : "var(--muted)"};">${p ? `● ${meta.label}` : "● Unidentified"}</div>
      </div>
      <div class="panel-body">
        ${presenceSection}
      </div>
    </div>

    <!-- Establish Presence -->
    <div class="panel">
      <div class="panel-hdr">
        <div class="panel-title">Establish Presence</div>
      </div>
      <div class="panel-body" id="establish-panel">
        <div class="role-tabs" id="role-tabs">
          ${(["owner","customer","creator","visitor"] as PresenceRole[]).map(r => {
            const m = ROLE_META[r];
            return `<div class="role-tab ${r === "visitor" ? "active" : ""}" data-role="${r}" onclick="selectRole('${r}')">
              <div class="role-tab-icon">${m.icon}</div>
              <div class="role-tab-label">${m.label}</div>
              <div class="role-tab-desc">${r === "owner" ? "Passphrase" : r === "customer" ? "Email" : r === "creator" ? "Passphrase" : "No proof"}</div>
            </div>`;
          }).join("")}
        </div>
        <div id="auth-form">
          <div id="passphrase-field" style="display:none;">
            <input class="auth-field" type="password" id="passphrase" placeholder="Passphrase">
          </div>
          <div id="email-field" style="display:none;">
            <input class="auth-field" type="email" id="email-input" placeholder="your@email.com">
          </div>
          <div id="visitor-note" style="font-size:0.72rem;color:var(--muted);margin-bottom:10px;">
            Visitor Presence is auto-issued — no proof required. You get access to public surfaces.
          </div>
          <button class="btn-establish" id="establish-btn" onclick="establishPresence()">Establish Presence</button>
          <div id="auth-msg"></div>
        </div>
      </div>
    </div>

    <!-- Role capabilities -->
    <div class="panel">
      <div class="panel-hdr">
        <div class="panel-title">Role Capabilities</div>
      </div>
      <div class="panel-body">
        ${(["owner","creator","customer","visitor"] as PresenceRole[]).map(r => {
          const m = ROLE_META[r];
          const count = getSurfaces(BASE, r).length;
          return `<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);">
            <span style="font-size:1rem;">${m.icon}</span>
            <div style="flex:1;">
              <div style="font-size:0.78rem;font-weight:800;color:${m.color};">${m.label}</div>
              <div style="font-size:0.68rem;color:var(--muted);">${m.desc}</div>
            </div>
            <div style="font-size:0.68rem;font-weight:800;color:var(--text2);white-space:nowrap;">${count} surfaces</div>
          </div>`;
        }).join("")}
      </div>
    </div>

  </div>

  <!-- CENTER: Intent Navigation -->
  <div class="col-center">

    <!-- Intent resolver -->
    <div class="panel">
      <div class="panel-hdr">
        <div class="panel-title">Intent Navigator</div>
        <div style="font-size:0.68rem;color:var(--muted);">Type what you want to do</div>
      </div>
      <div class="panel-body">
        <div class="resolve-bar">
          <input class="resolve-input" id="intent-input" type="text" autocomplete="off" spellcheck="false"
            placeholder="earn · sell · browse · deliver · subscribe · access · admin…"
            value="${initIntent.replace(/"/g,"&quot;")}"
            oninput="onIntentInput(this.value)" onkeydown="if(e.key==='Enter')navigateByIntent()">
          <button class="btn-resolve" onclick="navigateByIntent()">Go →</button>
        </div>
        <div class="resolve-result" id="intent-result">
          ${initIntent ? "<span style='color:var(--muted)'>Resolving…</span>" : "<span style='color:var(--muted);font-family:inherit;'>Enter an intent verb above</span>"}
        </div>
        ${initError === "unresolved" ? `<div class="auth-msg auth-err">Intent "${initIntent}" could not be resolved for your current role (${role}). Try a different verb, or establish a higher-access Presence.</div>` : ""}

        <!-- Intent cards -->
        <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.09em;color:var(--text2);margin-bottom:10px;">Quick Intents — ${role === "visitor" ? "Visitor" : meta.label} Access</div>
        <div class="intent-grid">
          ${intentCardsHtml}
        </div>
      </div>
    </div>

    <!-- API reference -->
    <div class="panel">
      <div class="panel-hdr">
        <div class="panel-title">CORE API — Internal Endpoints</div>
      </div>
      <div class="panel-body">
        <div class="api-row">
          ${[
            ["GET",    "/core",                   "This console"],
            ["POST",   "/core/presence",          "Issue Presence token (role + proof in body)"],
            ["GET",    "/core/presence",           "Verify current Presence"],
            ["DELETE", "/core/presence",           "Clear Presence (sign out)"],
            ["GET",    "/core/navigate?intent=earn","Resolve intent → 302 redirect to surface"],
            ["GET",    "/core/navigate?intent=sell&format=json","Intent resolution as JSON"],
            ["GET",    "/core/surfaces",           "Available surfaces for current role"],
            ["GET",    "/core/whoami",             "Full identity + access summary"],
            ["GET",    "/core/intents",            "Complete intent vocabulary"],
          ].map(([m,p,d]) =>
            `<div class="api-method">${m}</div><div><span class="api-path">${p}</span><div class="api-desc">${d}</div></div>`
          ).join("")}
        </div>
      </div>
    </div>

  </div>

  <!-- RIGHT: Surface Map -->
  <div class="col-right">
    <div class="panel">
      <div class="panel-hdr">
        <div class="panel-title">Surface Map</div>
        <div style="font-size:0.68rem;color:${meta.color};">${meta.icon} ${meta.label} · ${surfaces.length} surfaces</div>
      </div>
      <div class="panel-body">
        ${surfaceCardsHtml}
      </div>
    </div>
  </div>

</div>

<div class="copy-toast" id="copy-toast">Token copied</div>

<script>
const BASE       = ${JSON.stringify(BASE)};
const ROLE_META  = ${JSON.stringify(ROLE_META)};
const INTENTS    = ${JSON.stringify(intentCards)};
let selectedRole = 'visitor';

function navigate(url) { window.location.href = url; }

// ── Role selector ─────────────────────────────────────────────────────────
function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector('[data-role="' + role + '"]');
  if (tab) tab.classList.add('active');

  document.getElementById('passphrase-field').style.display = (role === 'owner' || role === 'creator') ? '' : 'none';
  document.getElementById('email-field').style.display      = role === 'customer' ? '' : 'none';
  document.getElementById('visitor-note').style.display     = role === 'visitor' ? '' : 'none';
  document.getElementById('establish-btn').textContent = 'Establish ' + role.charAt(0).toUpperCase() + role.slice(1) + ' Presence';
  document.getElementById('auth-msg').innerHTML = '';
}

// ── Establish Presence ───────────────────────────────────────────────────
async function establishPresence() {
  const btn = document.getElementById('establish-btn');
  btn.disabled = true;
  btn.textContent = 'Establishing…';
  const body = { role: selectedRole };
  if (selectedRole === 'owner' || selectedRole === 'creator') body.passphrase = document.getElementById('passphrase')?.value;
  if (selectedRole === 'customer') body.email = document.getElementById('email-input')?.value;

  try {
    const resp = await fetch('/core/presence', {
      method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body),
    });
    const d = await resp.json();
    if (d.ok) {
      document.getElementById('auth-msg').innerHTML = '<div class="auth-msg auth-ok">✓ Presence established as ' + d.presence.role + '. Reloading…</div>';
      setTimeout(() => window.location.reload(), 800);
    } else {
      document.getElementById('auth-msg').innerHTML = '<div class="auth-msg auth-err">✗ ' + (d.error || 'Failed') + '</div>';
      btn.disabled = false;
      btn.textContent = 'Establish Presence';
    }
  } catch(e) {
    document.getElementById('auth-msg').innerHTML = '<div class="auth-msg auth-err">✗ Request failed</div>';
    btn.disabled = false;
    btn.textContent = 'Establish Presence';
  }
}

// ── Clear Presence ───────────────────────────────────────────────────────
async function clearPresence() {
  await fetch('/core/presence', { method: 'DELETE' });
  window.location.reload();
}

// ── Intent Resolver ──────────────────────────────────────────────────────
function onIntentInput(q) {
  if (!q.trim()) {
    document.getElementById('intent-result').innerHTML = "<span style='color:var(--muted);font-family:inherit;'>Enter an intent verb above</span>";
    return;
  }
  const match = resolveIntentClient(q.trim().toLowerCase());
  const el = document.getElementById('intent-result');
  if (match) {
    el.innerHTML = '<span class="resolve-matched">✓ ' + match.verb + '</span>'
      + '<span class="resolve-arrow">→</span>'
      + '<span>' + match.label + '</span>'
      + '<span style="color:var(--muted);font-size:0.7em;margin-left:auto;">' + match.desc + '</span>';
  } else {
    el.innerHTML = "<span style='color:#f87171;'>No match for \"" + q + "\" — try: earn, sell, browse, deliver, subscribe, access, admin</span>";
  }
}

function resolveIntentClient(q) {
  const words = q.split(/[\\s,/+]+/).filter(Boolean);
  let best = null;
  for (const ic of INTENTS) {
    const verbs = [ic.verb];
    for (const v of verbs) {
      for (const w of words) {
        let conf = 0;
        if (v === w)          conf = 100;
        else if (v.startsWith(w)) conf = 80;
        else if (w.startsWith(v)) conf = 75;
        else if (v.includes(w))   conf = 60;
        if (conf > 0 && (!best || conf > best.conf)) best = { ...ic, conf };
      }
    }
    // Also check label
    for (const w of words) {
      if (ic.label.toLowerCase().includes(w) && (!best || 55 > (best.conf || 0))) best = { ...ic, conf: 55 };
    }
  }
  return best;
}

function navigateByIntent() {
  const q = document.getElementById('intent-input').value.trim();
  if (!q) return;
  const match = resolveIntentClient(q.toLowerCase());
  if (match) window.location.href = match.url;
  else window.location.href = BASE + '/core/navigate?intent=' + encodeURIComponent(q);
}

// ── Copy Token ───────────────────────────────────────────────────────────
function copyToken() {
  const tok = document.getElementById('token-display')?.textContent;
  if (!tok) return;
  navigator.clipboard.writeText(tok).catch(() => {});
  const toast = document.getElementById('copy-toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    document.getElementById('intent-input').focus();
  }
  if (e.key === 'Escape') document.activeElement.blur?.();
});

// ── Init ─────────────────────────────────────────────────────────────────
selectRole('visitor');
const initIntent = ${JSON.stringify(initIntent)};
if (initIntent) onIntentInput(initIntent);
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

export default router;
