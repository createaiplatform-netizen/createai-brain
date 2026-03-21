/**
 * routes/nexus.ts — NEXUS Unified Platform OS
 * ──────────────────────────────────────────────
 * The single intelligent layer for identity (Presence), intention (Intent),
 * semantic addressing (5-format unified), adaptive surfaces (Space Map),
 * and session memory (Context) — all operating from one coherent model.
 *
 * Supersedes:
 *   /core  — CORE OS (Presence + Intent)
 *   /ss    — SignalSpace SSAP (semantic addressing)
 *   /hub   — partially (discovery surface)
 *
 * Rules of NEXUS:
 *   1. One primitive: Space. No separate "node", "surface", "intent", "surface".
 *   2. One resolver: 5 formats, one algorithm, role-aware from first instruction.
 *   3. One identity model: hierarchical levels, strict HMAC, no external auth.
 *   4. Session context accumulates naturally from navigation — no explicit actions.
 *   5. Confidence is always visible and always drives behavior.
 *   6. Everything computable is computed server-side. Client-side JS mirrors it.
 *
 * Routes:
 *   GET  /nexus                   NEXUS Console (full UI)
 *   GET  /nexus/resolve?q=...     Universal resolver → JSON
 *   GET  /nexus/navigate?q=...    Resolve → 302 (records visit in context)
 *   GET  /nexus/spaces            All accessible spaces (role-filtered)
 *   GET  /nexus/spaces/:id        Single space detail
 *   POST /nexus/presence          Issue NX Presence token
 *   GET  /nexus/presence          Current presence
 *   DELETE /nexus/presence        Clear presence
 *   GET  /nexus/whoami            Full identity + context + access summary
 *   GET  /nexus/context           Session context (visit history)
 */

import { Router, type Request, type Response } from "express";
import { getPublicBaseUrl }                     from "../utils/publicUrl.js";
import { buildSpaces, accessibleSpaces, type Space, type SpaceLevel } from "../nexus/spaces.js";
import { resolve, detectFormat }                from "../nexus/resolver.js";
import {
  getPresence, setPresenceCookie, clearPresenceCookie,
  proveOwner, proveCreator, proveCustomer, proveVisitor,
  PRESENCE_COOKIE, ROLE_META, type NXPresence,
} from "../nexus/presence.js";
import { getContext, pushVisit, clearContext }  from "../nexus/context.js";

const router  = Router();
const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";

// ─────────────────────────────────────────────────────────────────────────────
// GET /resolve?q=... — universal resolver JSON
// ─────────────────────────────────────────────────────────────────────────────
router.get("/resolve", (req: Request, res: Response) => {
  const BASE    = getPublicBaseUrl();
  const spaces  = buildSpaces(BASE);
  const { level } = getPresence(req);
  const ctx     = getContext(req);
  const q       = String(req.query["q"] ?? req.query["query"] ?? "").trim();
  const lv      = Math.max(1, Math.min(4, parseInt(String(req.query["level"] ?? level), 10))) as SpaceLevel;

  if (!q) { res.status(400).json({ ok: false, error: "Missing ?q= parameter" }); return; }

  const result  = resolve(q, spaces, lv, ctx.history);
  res.json({
    ok:       true,
    query:    q,
    format:   result.format,
    level:    lv,
    resolved: result.resolved,
    top:      result.top ? {
      spaceId:     result.top.space.id,
      signal:      result.top.space.signal,
      code:        result.top.space.code,
      label:       result.top.space.id.replace("sp_","").replace(/_/g," "),
      path:        result.top.space.path,
      category:    result.top.space.category,
      icon:        result.top.space.icon,
      description: result.top.space.description,
      score:       result.top.score,
      band:        result.top.band,
      matchedOn:   result.top.matchedOn,
      historyBoosted: result.top.historyBoosted,
    } : null,
    alternatives: result.matches.slice(1).map(m => ({
      spaceId:  m.space.id,
      signal:   m.space.signal,
      label:    m.space.id.replace("sp_","").replace(/_/g," "),
      path:     m.space.path,
      score:    m.score,
      band:     m.band,
    })),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /navigate?q=... — resolve + redirect (records visit)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/navigate", (req: Request, res: Response) => {
  const BASE    = getPublicBaseUrl();
  const spaces  = buildSpaces(BASE);
  const { level } = getPresence(req);
  const ctx     = getContext(req);
  const q       = String(req.query["q"] ?? "").trim();

  if (!q) { res.redirect(302, `${BASE}/nexus`); return; }

  const result = resolve(q, spaces, level, ctx.history);
  if (result.resolved && result.top) {
    const next = pushVisit(res, ctx, result.top.space.id);
    void next;
    res.redirect(302, result.top.space.path);
  } else {
    res.redirect(302, `${BASE}/nexus?q=${encodeURIComponent(q)}&miss=1`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /spaces — all accessible spaces
// ─────────────────────────────────────────────────────────────────────────────
router.get("/spaces", (req: Request, res: Response) => {
  const BASE    = getPublicBaseUrl();
  const spaces  = buildSpaces(BASE);
  const { level } = getPresence(req);
  const lv      = Math.max(1, Math.min(4, parseInt(String(req.query["level"] ?? level), 10))) as SpaceLevel;
  const accessible = accessibleSpaces(spaces, lv);
  res.json({
    ok: true, level: lv, count: accessible.length,
    spaces: accessible.map(s => ({
      id: s.id, signal: s.signal, code: s.code,
      category: s.category, icon: s.icon,
      description: s.description, path: s.path,
      external: s.external, minLevel: s.minLevel,
      verbs: s.verbs.slice(0, 4), concepts: s.concepts.slice(0, 4),
    })),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /spaces/:id — single space
// ─────────────────────────────────────────────────────────────────────────────
router.get("/spaces/:id", (req: Request, res: Response) => {
  const BASE   = getPublicBaseUrl();
  const spaces = buildSpaces(BASE);
  const id     = String(req.params["id"] ?? "");
  const space  = spaces.find(s => s.id === id || s.signal === `@${id}` || s.code === `~${id.toUpperCase()}`);
  if (!space) { res.status(404).json({ ok: false, error: `Space not found: ${id}` }); return; }
  res.json({ ok: true, space });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /presence — establish Presence
// ─────────────────────────────────────────────────────────────────────────────
router.post("/presence", async (req: Request, res: Response) => {
  const { role, passphrase, email } = req.body as {
    role?: string; passphrase?: string; email?: string;
  };

  let result;
  if      (role === "owner")    result = proveOwner(passphrase);
  else if (role === "creator")  result = proveCreator(passphrase);
  else if (role === "customer") result = proveCustomer(email);
  else                          result = proveVisitor();

  if (!result.ok) { res.status(result.status).json({ ok: false, error: result.error }); return; }

  setPresenceCookie(res, result.presence);
  const { presence: p } = result;
  res.json({
    ok: true,
    presence: {
      token: p.token, level: p.level, role: p.role,
      name: p.name, email: p.email,
      issuedAt: p.issuedAt, expiresAt: p.expiresAt,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /presence — verify current
// ─────────────────────────────────────────────────────────────────────────────
router.get("/presence", (req: Request, res: Response) => {
  const { presence: p, level } = getPresence(req);
  if (!p) {
    res.json({ ok: true, presence: null, level: 1, message: "No active Presence — POST /nexus/presence to establish identity." });
    return;
  }
  const meta = ROLE_META[p.role];
  res.json({
    ok: true, level,
    presence: { token: p.token, level: p.level, role: p.role, roleLabel: meta.label, name: p.name, email: p.email, issuedAt: p.issuedAt, expiresAt: p.expiresAt },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /presence — clear (sign out)
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/presence", (req: Request, res: Response) => {
  clearPresenceCookie(res);
  clearContext(res);
  res.json({ ok: true, message: "Presence cleared — you are now a visitor." });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /whoami — full identity summary
// ─────────────────────────────────────────────────────────────────────────────
router.get("/whoami", (req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const spaces = buildSpaces(BASE);
  const { presence: p, level } = getPresence(req);
  const role = p?.role ?? "visitor";
  const meta = ROLE_META[role];
  const ctx  = getContext(req);
  const accessible = accessibleSpaces(spaces, level);
  res.json({
    ok: true,
    system: "NEXUS / Unified Platform OS / v2.0",
    identity: { role, level, roleLabel: meta.label, name: p?.name ?? null, email: p?.email ?? null, token: p?.token ?? null, hasPresence: !!p, issuedAt: p?.issuedAt ?? null, expiresAt: p?.expiresAt ?? null },
    access: {
      level, spaceCount: accessible.length,
      categories: [...new Set(accessible.map(s => s.category))],
    },
    context: { historyLength: ctx.history.length, recentSpaces: ctx.history.slice(0, 3) },
    platform: { mode: IS_PROD ? "production" : "test", baseUrl: BASE, spaceTotal: spaces.length },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /context — session context
// ─────────────────────────────────────────────────────────────────────────────
router.get("/context", (req: Request, res: Response) => {
  const BASE   = getPublicBaseUrl();
  const spaces = buildSpaces(BASE);
  const ctx    = getContext(req);
  const expanded = ctx.history.map(id => {
    const s = spaces.find(sp => sp.id === id);
    return s ? { id: s.id, signal: s.signal, label: s.id.replace("sp_","").replace(/_/g," "), path: s.path } : { id, signal: "?", label: id, path: "" };
  });
  res.json({ ok: true, history: expanded, lastSeen: ctx.lastSeen ? new Date(ctx.lastSeen) : null });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET / — NEXUS Console
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", (req: Request, res: Response) => {
  const BASE    = getPublicBaseUrl();
  const spaces  = buildSpaces(BASE);
  const { presence: p, level } = getPresence(req);
  const role    = p?.role ?? "visitor";
  const meta    = ROLE_META[role];
  const ctx     = getContext(req);
  const accessible = accessibleSpaces(spaces, level);
  const initQ   = String(req.query["q"] ?? "");
  const initMiss= req.query["miss"] === "1";

  // Group accessible spaces by category
  const byCat: Record<string, Space[]> = {};
  for (const s of accessible) (byCat[s.category] ??= []).push(s);

  const CAT_ORDER = ["Revenue","Commerce","Admin","Content","System","Public"];
  const CAT_ICON: Record<string, string> = {
    Revenue:"💰", Commerce:"🛍", Admin:"⊞", Content:"✍", System:"◉", Public:"🌐",
  };

  // History spaces with labels
  const histSpaces = ctx.history.map(id => spaces.find(s => s.id === id)).filter(Boolean) as Space[];

  // Inline spaces data for client-side resolver
  const spacesForClient = accessible.map(s => ({
    id:       s.id,
    signal:   s.signal.slice(1),  // strip @
    code:     s.code,
    verbs:    s.verbs,
    concepts: s.concepts,
    tags:     s.tags,
    path:     s.path,
    label:    s.id.replace("sp_","").replace(/_/g," "),
    desc:     s.description,
    icon:     s.icon,
    category: s.category,
    minLevel: s.minLevel,
  }));

  const spaceCardsHtml = CAT_ORDER
    .filter(cat => byCat[cat]?.length)
    .map(cat => {
      const items = byCat[cat]!;
      return `
    <div class="cat-block">
      <div class="cat-title">${CAT_ICON[cat] ?? "·"} ${cat}</div>
      <div class="space-grid">
        ${items.map(s => `
        <a href="${s.path}" class="space-card" data-id="${s.id}" ${s.external ? 'target="_blank" rel="noopener"' : ""}>
          <div class="sc-top">
            <span class="sc-icon">${s.icon}</span>
            <span class="sc-signal">${s.signal}</span>
            <span class="sc-code">${s.code}</span>
          </div>
          <div class="sc-desc">${s.description}</div>
          <div class="sc-verbs">${s.verbs.slice(0,4).join(" · ")}</div>
        </a>`).join("")}
      </div>
    </div>`;
    }).join("");

  const histHtml = histSpaces.length
    ? histSpaces.map((s, i) => `
      <a href="${s.path}" class="hist-item" title="${s.description}">
        <span class="hist-num">${histSpaces.length - i}</span>
        <span class="hist-icon">${s.icon}</span>
        <span class="hist-label">${s.signal}</span>
        <span class="hist-cat">${s.category}</span>
      </a>`).join("")
    : `<div class="hist-empty">Navigate a space to build history</div>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>NEXUS — Platform OS</title>
  <style>
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    :root {
      --bg:#020617; --s1:#0d1526; --s2:#111827; --s3:#1e293b;
      --line:#1e293b; --line2:#2d3748;
      --t1:#e2e8f0; --t2:#94a3b8; --t3:#64748b; --t4:#475569;
      --ind:#6366f1; --ind-d:#4f46e5; --ind-g:rgba(99,102,241,0.18);
      --cyan:#06b6d4; --em:#10b981; --am:#f59e0b; --re:#f87171;
    }
    html, body { height:100%; background:var(--bg); color:var(--t1); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:14px; }
    a { color:inherit; text-decoration:none; }

    /* ── Header ────────────────────────────────────────── */
    .hdr { position:sticky; top:0; z-index:200; background:rgba(2,6,23,0.95); backdrop-filter:blur(14px); border-bottom:1px solid var(--line); padding:0 24px; }
    .hdr-inner { max-width:1440px; margin:0 auto; height:48px; display:flex; align-items:center; gap:14px; }
    .nx-logo { font-size:1.05rem; font-weight:900; letter-spacing:-0.04em; color:var(--t1); display:flex; align-items:center; gap:8px; }
    .nx-dot { width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,var(--ind),var(--cyan)); display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:900; color:#fff; flex-shrink:0; }
    .nx-ver { font-size:0.6rem; font-weight:700; color:var(--t3); border:1px solid var(--line2); border-radius:99px; padding:2px 7px; letter-spacing:0.05em; margin-left:4px; }
    .mode-badge { font-size:0.58rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; border-radius:99px; padding:3px 9px; }
    .mode-test { background:rgba(245,158,11,0.12); color:#fcd34d; border:1px solid rgba(245,158,11,0.22); }
    .mode-live { background:rgba(16,185,129,0.12); color:#6ee7b7; border:1px solid rgba(16,185,129,0.22); }
    .hdr-links { margin-left:auto; display:flex; gap:20px; align-items:center; }
    .hdr-lnk { font-size:0.72rem; font-weight:600; color:var(--t3); transition:color .15s; }
    .hdr-lnk:hover { color:var(--t1); }
    .presence-chip { display:flex; align-items:center; gap:6px; border-radius:99px; padding:4px 10px 4px 8px; border:1px solid; font-size:0.7rem; font-weight:700; }

    /* ── Layout ─────────────────────────────────────────── */
    .body-wrap { max-width:1440px; margin:0 auto; padding:24px; display:grid; grid-template-columns:240px 1fr; gap:20px; }
    @media(max-width:900px) { .body-wrap { grid-template-columns:1fr; padding:16px; } .sidebar { display:none; } }

    /* ── Sidebar ────────────────────────────────────────── */
    .sidebar { display:flex; flex-direction:column; gap:14px; }
    .panel { background:var(--s2); border:1px solid var(--line); border-radius:12px; overflow:hidden; }
    .ph { padding:11px 14px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; }
    .ph-title { font-size:0.62rem; font-weight:800; text-transform:uppercase; letter-spacing:0.09em; color:var(--t3); }
    .pb { padding:14px; }

    /* Presence panel */
    .pres-active { border-radius:8px; padding:12px; margin-bottom:12px; border:1.5px solid; }
    .pres-role-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .pres-icon { font-size:1.1rem; }
    .pres-role { font-size:0.88rem; font-weight:900; }
    .pres-name { font-size:0.7rem; color:var(--t2); margin-top:2px; }
    .pres-email { font-size:0.65rem; color:var(--t3); margin-top:1px; font-family:monospace; }
    .pres-token { font-family:'SF Mono','Fira Code',monospace; font-size:0.58rem; background:var(--bg); border:1px solid var(--line); border-radius:5px; padding:4px 7px; color:var(--t2); word-break:break-all; cursor:pointer; }
    .pres-token:hover { border-color:var(--ind); }
    .pres-meta { font-size:0.62rem; color:var(--t4); margin-top:6px; }
    .pres-none { text-align:center; padding:14px 10px; }
    .pres-none-lbl { font-size:0.8rem; font-weight:700; color:var(--t2); margin-top:6px; }
    .pres-none-sub { font-size:0.68rem; color:var(--t4); margin-top:4px; line-height:1.5; }

    .role-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:10px; }
    .role-btn { background:var(--s1); border:1.5px solid var(--line); border-radius:7px; padding:7px 6px; cursor:pointer; text-align:center; transition:all .15s; }
    .role-btn:hover { border-color:var(--ind); }
    .role-btn.sel { border-color:var(--ind); background:var(--ind-g); }
    .rb-icon { font-size:0.9rem; }
    .rb-label { font-size:0.65rem; font-weight:700; color:var(--t1); margin-top:2px; }
    .rb-sub { font-size:0.56rem; color:var(--t4); margin-top:1px; }
    .auth-inp { width:100%; background:var(--s1); border:1.5px solid var(--line); border-radius:7px; padding:8px 10px; font-size:0.78rem; color:var(--t1); outline:none; margin-bottom:7px; font-family:inherit; transition:border-color .15s; }
    .auth-inp:focus { border-color:var(--ind); }
    .auth-inp::placeholder { color:var(--t4); }
    .btn-pres { width:100%; background:var(--ind); color:#fff; border:none; border-radius:8px; padding:9px; font-size:0.8rem; font-weight:800; cursor:pointer; transition:all .15s; }
    .btn-pres:hover { background:var(--ind-d); }
    .auth-msg { font-size:0.7rem; border-radius:6px; padding:7px 9px; margin-top:7px; }
    .auth-ok  { background:rgba(16,185,129,0.1); color:#6ee7b7; border:1px solid rgba(16,185,129,0.2); }
    .auth-err { background:rgba(248,113,113,0.1); color:#fca5a5; border:1px solid rgba(248,113,113,0.2); }

    /* History */
    .hist-item { display:flex; align-items:center; gap:7px; padding:7px 0; border-bottom:1px solid var(--line); cursor:pointer; transition:background .12s; border-radius:5px; padding:6px 6px; }
    .hist-item:hover { background:var(--s3); }
    .hist-item:last-child { border-bottom:none; }
    .hist-num  { font-size:0.58rem; font-weight:800; color:var(--t4); width:14px; text-align:right; flex-shrink:0; }
    .hist-icon { font-size:0.9rem; flex-shrink:0; }
    .hist-label { font-size:0.72rem; font-weight:700; color:var(--t1); flex:1; font-family:monospace; }
    .hist-cat  { font-size:0.58rem; color:var(--t4); }
    .hist-empty { font-size:0.7rem; color:var(--t4); text-align:center; padding:12px 0; }

    /* ── Main column ──────────────────────────────────────── */
    .main-col { display:flex; flex-direction:column; gap:20px; }

    /* NEXUS Bar */
    .nx-bar-wrap { background:var(--s2); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
    .nx-bar-hero { padding:20px 22px 14px; }
    .nx-bar-eyebrow { font-size:0.58rem; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:var(--ind); margin-bottom:10px; }
    .nx-bar-h { font-size:clamp(1rem,2.5vw,1.4rem); font-weight:900; color:var(--t1); letter-spacing:-0.03em; margin-bottom:4px; }
    .nx-bar-h em { color:#818cf8; font-style:normal; }
    .nx-bar-sub { font-size:0.75rem; color:var(--t3); line-height:1.5; }
    .nx-bar-row { display:flex; gap:8px; padding:0 22px 16px; }
    .nx-input { flex:1; background:var(--s1); border:1.5px solid var(--line2); border-radius:10px; padding:12px 16px; font-size:0.9rem; font-family:'SF Mono','Fira Code',Menlo,monospace; color:var(--t1); outline:none; transition:border-color .2s,box-shadow .2s; }
    .nx-input:focus { border-color:var(--ind); box-shadow:0 0 0 3px var(--ind-g); }
    .nx-input::placeholder { color:var(--t4); }
    .nx-go { background:var(--ind); color:#fff; border:none; border-radius:10px; padding:12px 20px; font-size:0.85rem; font-weight:800; cursor:pointer; white-space:nowrap; transition:all .15s; flex-shrink:0; }
    .nx-go:hover { background:var(--ind-d); }
    .nx-formats { display:flex; gap:10px; padding:0 22px 12px; flex-wrap:wrap; }
    .fmt-chip { font-size:0.62rem; font-weight:700; border-radius:99px; padding:3px 9px; border:1px solid var(--line2); color:var(--t3); font-family:monospace; cursor:pointer; transition:all .15s; }
    .fmt-chip:hover { border-color:var(--ind); color:#818cf8; }

    /* Resolution output */
    .resolve-out { border-top:1px solid var(--line); }
    .ro-match { padding:14px 22px; display:grid; grid-template-columns:1fr auto; gap:10px; align-items:start; }
    .ro-miss  { padding:14px 22px; font-size:0.78rem; color:var(--t4); }
    .ro-empty { padding:14px 22px; font-size:0.78rem; color:var(--t4); border-top:0; }
    .ro-label { font-size:0.72rem; font-weight:800; color:var(--t3); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:6px; }
    .ro-space-row { display:flex; align-items:center; gap:10px; }
    .ro-icon  { font-size:1.4rem; }
    .ro-name  { font-size:1rem; font-weight:900; color:var(--t1); }
    .ro-sig   { font-size:0.7rem; font-family:monospace; color:#818cf8; }
    .ro-desc  { font-size:0.75rem; color:var(--t2); margin-top:3px; line-height:1.4; }
    .ro-matched { font-size:0.65rem; color:var(--t4); margin-top:5px; font-family:monospace; }
    .ro-conf  { text-align:right; }
    .ro-conf-num  { font-size:1.6rem; font-weight:900; font-family:monospace; line-height:1; }
    .ro-conf-band { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; margin-top:2px; }
    .ro-alts  { padding:0 22px 14px; display:flex; gap:7px; flex-wrap:wrap; }
    .ro-alt   { background:var(--s1); border:1px solid var(--line2); border-radius:7px; padding:5px 10px; font-size:0.68rem; cursor:pointer; display:flex; align-items:center; gap:5px; transition:all .15s; }
    .ro-alt:hover { border-color:var(--ind); }
    .ro-alt-conf { font-size:0.6rem; color:var(--t4); }
    .band-certain { color:#4ade80; }
    .band-high    { color:#60a5fa; }
    .band-good    { color:#fbbf24; }
    .band-partial { color:#f87171; }
    .band-miss    { color:var(--t4); }

    /* Space index */
    .cat-block { margin-bottom:20px; }
    .cat-title { font-size:0.62rem; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; color:var(--t3); margin-bottom:9px; display:flex; align-items:center; gap:6px; }
    .space-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:8px; }
    .space-card { background:var(--s2); border:1px solid var(--line); border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:5px; cursor:pointer; transition:all .15s; }
    .space-card:hover { border-color:var(--ind); background:rgba(99,102,241,0.05); transform:translateY(-1px); }
    .sc-top { display:flex; align-items:center; gap:7px; }
    .sc-icon { font-size:1rem; }
    .sc-signal { font-size:0.7rem; font-weight:800; font-family:monospace; color:#818cf8; flex:1; }
    .sc-code   { font-size:0.6rem; color:var(--t4); font-family:monospace; border:1px solid var(--line2); border-radius:4px; padding:1px 5px; }
    .sc-desc  { font-size:0.68rem; color:var(--t2); line-height:1.4; }
    .sc-verbs { font-size:0.6rem; color:var(--t4); font-family:monospace; }

    /* Toast */
    .toast { position:fixed; bottom:24px; right:24px; background:var(--s3); color:var(--em); border:1px solid rgba(16,185,129,0.3); border-radius:10px; padding:10px 18px; font-size:0.78rem; font-weight:700; pointer-events:none; opacity:0; transform:translateY(8px); transition:all .22s; z-index:999; }
    .toast.show { opacity:1; transform:translateY(0); }

    /* Kbd hint */
    kbd { background:var(--s3); border:1px solid var(--line2); border-radius:4px; padding:1px 5px; font-size:0.6rem; font-family:monospace; color:var(--t3); }
  </style>
</head>
<body>

<!-- Header -->
<header class="hdr">
  <div class="hdr-inner">
    <div class="nx-logo">
      <div class="nx-dot">N</div>
      NEXUS
      <span class="nx-ver">v2.0</span>
    </div>
    <span class="mode-badge ${IS_PROD ? "mode-live" : "mode-test"}">${IS_PROD ? "⚡ Live" : "🧪 Test"}</span>
    <div class="presence-chip" style="background:${meta.bg};border-color:${meta.border};color:${meta.color};">
      ${meta.icon} ${meta.label} · L${level}
    </div>
    <div class="hdr-links">
      <a class="hdr-lnk" href="${BASE}/nexus/whoami" style="font-family:monospace;font-size:0.68rem;color:#818cf8;">/whoami</a>
      <a class="hdr-lnk" href="${BASE}/vault">Vault</a>
      <a class="hdr-lnk" href="${BASE}/launch/">Launch</a>
      <a class="hdr-lnk" href="${BASE}/hub">Hub</a>
    </div>
  </div>
</header>

<div class="body-wrap">

  <!-- ── Sidebar ─────────────────────────────────────────── -->
  <aside class="sidebar">

    <!-- Presence panel -->
    <div class="panel">
      <div class="ph"><div class="ph-title">Presence</div>${p ? `<span style="font-size:.65rem;color:${meta.color};">● Active</span>` : `<span style="font-size:.65rem;color:var(--t4);">● Unset</span>`}</div>
      <div class="pb">
        ${p
          ? `<div class="pres-active" style="background:${meta.bg};border-color:${meta.border};">
              <div class="pres-role-row">
                <span class="pres-icon">${meta.icon}</span>
                <div>
                  <div class="pres-role" style="color:${meta.color};">${meta.label} · L${level}</div>
                  ${p.name  ? `<div class="pres-name">${p.name}</div>` : ""}
                  ${p.email ? `<div class="pres-email">${p.email}</div>` : ""}
                </div>
              </div>
              <div class="pres-token" onclick="copyToken()" title="Click to copy token">${p.token}</div>
              <div class="pres-meta">${accessible.length} spaces · expires ${p.expiresAt.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
            </div>
            <button class="btn-pres" style="background:transparent;border:1px solid var(--line2);color:var(--t3);margin-top:0;" onclick="clearPresence()">Clear Presence</button>`
          : `<div class="pres-none">
              <div style="font-size:1.5rem;">${meta.icon}</div>
              <div class="pres-none-lbl">No active Presence</div>
              <div class="pres-none-sub">Select a role below to establish your identity.</div>
            </div>`
        }
      </div>
    </div>

    <!-- Establish Presence -->
    <div class="panel">
      <div class="ph"><div class="ph-title">Establish Presence</div></div>
      <div class="pb">
        <div class="role-grid">
          ${(["owner","customer","creator","visitor"] as const).map(r => {
            const m = ROLE_META[r];
            const sub = r==="owner"||r==="creator" ? "passphrase" : r==="customer" ? "email" : "open";
            return `<div class="role-btn${r==="visitor"?" sel":""}" data-role="${r}" onclick="selRole('${r}')">
              <div class="rb-icon">${m.icon}</div>
              <div class="rb-label">${m.label}</div>
              <div class="rb-sub">${sub}</div>
            </div>`;
          }).join("")}
        </div>
        <div id="pf-pass" style="display:none;"><input class="auth-inp" type="password" id="pf-pass-val" placeholder="Passphrase"></div>
        <div id="pf-email" style="display:none;"><input class="auth-inp" type="email"    id="pf-email-val" placeholder="your@email.com"></div>
        <div id="pf-vis" style="font-size:.68rem;color:var(--t4);margin-bottom:8px;">Auto-issued — no proof required. Public surfaces only.</div>
        <button class="btn-pres" id="pres-btn" onclick="doEstablish()">Establish Visitor Presence</button>
        <div id="pres-msg"></div>
      </div>
    </div>

    <!-- Context history -->
    <div class="panel">
      <div class="ph"><div class="ph-title">Recent Spaces</div><span style="font-size:.62rem;color:var(--t4);">${ctx.history.length}/8</span></div>
      <div class="pb" style="padding:8px 14px;">
        ${histHtml}
      </div>
    </div>

  </aside>

  <!-- ── Main column ──────────────────────────────────────── -->
  <main class="main-col">

    <!-- NEXUS Bar -->
    <div class="nx-bar-wrap">
      <div class="nx-bar-hero">
        <div class="nx-bar-eyebrow">NEXUS / Unified Platform OS · 5-Format Universal Resolver</div>
        <div class="nx-bar-h">Navigate by <em>intent</em>, signal, concept, or query.</div>
        <div class="nx-bar-sub">One input. Five address formats. Role-aware. History-boosted.<br>Press <kbd>/</kbd> to focus · <kbd>Enter</kbd> to navigate · <kbd>⌘K</kbd> to focus from anywhere.</div>
      </div>
      <div class="nx-bar-row">
        <input class="nx-input" id="nx-input" autocomplete="off" spellcheck="false"
          placeholder="@vault  ·  ~V  ·  #balance  ·  ?where can I earn  ·  earn"
          value="${initQ.replace(/"/g,"&quot;")}"
          oninput="onNXInput(this.value)"
          onkeydown="if(event.key==='Enter')doNXNav()">
        <button class="nx-go" onclick="doNXNav()">Go →</button>
      </div>
      <div class="nx-formats">
        ${[["@signal","@vault"],["~code","~V"],["#concept","#balance"],["?query","?I need to deliver"],["verb","earn"]].map(([label,ex]) =>
          `<div class="fmt-chip" onclick="setInputExample('${ex}')" title="Example: ${ex}">${label}</div>`
        ).join("")}
      </div>
      <!-- Resolution output -->
      <div class="resolve-out" id="ro">
        ${initMiss
          ? `<div class="ro-miss">⚠ Could not resolve "${initQ}" at Level ${level}. Your role may not have access, or the query matched no space.</div>`
          : `<div class="ro-empty">Type above — resolver runs live.</div>`}
      </div>
    </div>

    <!-- Space index -->
    <div>
      <div style="font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--t3);margin-bottom:14px;">
        ${accessible.length} Accessible Spaces · Level ${level} (${ROLE_META[role].label})
      </div>
      ${spaceCardsHtml}
    </div>

  </main>
</div>

<div class="toast" id="toast">Copied</div>

<script>
const BASE    = ${JSON.stringify(BASE)};
const SPACES  = ${JSON.stringify(spacesForClient)};
const LEVEL   = ${level};
const ROLE_META = ${JSON.stringify(ROLE_META)};
let selRoleCurrent = 'visitor';

// ── Format detection ────────────────────────────────────────────────────────
function detectFmt(q) {
  if (q.startsWith('@')) return { fmt:'@signal',  term: q.slice(1).toLowerCase() };
  if (q.startsWith('~')) return { fmt:'~code',    term: q.toUpperCase() };
  if (q.startsWith('#')) return { fmt:'#concept', term: q.slice(1).toLowerCase() };
  if (q.startsWith('?')) return { fmt:'?query',   term: q.slice(1).trim().toLowerCase() };
  return                        { fmt:'verb',      term: q.toLowerCase() };
}

// ── Resolver (mirrors server-side logic exactly) ────────────────────────────
function strMatch(term, cand) {
  const t = term.toLowerCase(), c = cand.toLowerCase();
  if (t === c)          return 100;
  if (c.startsWith(t)) return 80;
  if (t.startsWith(c)) return 75;
  if (c.includes(t))   return 55;
  if (t.includes(c) && c.length > 2) return 45;
  return 0;
}
function wordOverlap(qws, candidates) {
  let hits = 0;
  for (const qw of qws) for (const c of candidates) {
    if (c === qw) { hits += 2; break; }
    if (c.startsWith(qw) || qw.startsWith(c)) { hits += 1; break; }
  }
  return Math.min(100, (hits / Math.max(qws.length,1)) * 60);
}
function resolveClient(raw) {
  if (!raw.trim()) return [];
  const { fmt, term } = detectFmt(raw);
  const scored = [];
  for (const s of SPACES) {
    let score = 0, matchedOn = '';
    if (fmt === '@signal') {
      const v = strMatch(term, s.signal); if (v) { score = v; matchedOn = '@'+s.signal; }
    } else if (fmt === '~code') {
      if (s.code === term || s.code === '~'+term.replace('~','')) { score = 100; matchedOn = s.code; }
    } else if (fmt === '#concept') {
      let best = 0;
      for (const c of [...s.concepts, ...s.tags]) { const v = strMatch(term,c); if(v>best){best=v;matchedOn='#'+c;} }
      score = best;
    } else if (fmt === '?query') {
      const ws = term.split(/\s+/).filter(w=>w.length>1);
      score = Math.min(100, wordOverlap(ws,s.verbs)*1.0 + wordOverlap(ws,s.concepts)*0.9 + wordOverlap(ws,s.tags)*0.7);
      if (score > 0) matchedOn = '?query';
    } else {
      const ws = term.split(/[\s,/+]+/).filter(Boolean);
      let best = 0;
      for (const w of ws) {
        for (const v of s.verbs) { const sc = strMatch(w,v); if(sc>best){best=sc;matchedOn=v;} }
        for (const c of s.concepts) { const sc = strMatch(w,c)*0.8; if(sc>best){best=sc;matchedOn=c;} }
        const sc2 = strMatch(w,s.signal)*0.9; if(sc2>best){best=sc2;matchedOn='@'+s.signal;}
      }
      score = best;
    }
    if (score < 1) continue;
    const bnd = score>=90?'certain':score>=70?'high':score>=50?'good':score>=30?'partial':'miss';
    scored.push({ ...s, score:Math.round(score), fmt, matchedOn, band:bnd });
  }
  return scored.sort((a,b)=>b.score-a.score).slice(0,6);
}

// ── Live resolver UI ─────────────────────────────────────────────────────────
function onNXInput(v) {
  const matches = resolveClient(v);
  const ro = document.getElementById('ro');
  if (!v.trim()) { ro.innerHTML = '<div class="ro-empty">Type above — resolver runs live.</div>'; return; }
  if (!matches.length || matches[0].score < 30) {
    ro.innerHTML = '<div class="ro-miss">No match for <code style="color:#818cf8;">'+escHtml(v)+'</code> at Level '+LEVEL+'. Try a different format or verb.</div>';
    return;
  }
  const top = matches[0];
  const bandColor = { certain:'#4ade80', high:'#60a5fa', good:'#fbbf24', partial:'#f87171', miss:'var(--t4)' }[top.band] || 'var(--t2)';
  const bandColors = {certain:'#4ade80',high:'#60a5fa',good:'#fbbf24',partial:'#f87171',miss:'var(--t4)'};
  const alts = matches.slice(1).map(function(m) {
    const bc2 = bandColors[m.band] || 'var(--t2)';
    return '<div class="ro-alt" onclick="window.location.href=\'' + m.path + '\'" title="' + escHtml(m.desc) + '">'
      + m.icon + ' <span style="font-family:monospace;">@' + m.signal + '</span>'
      + '<span class="ro-alt-conf" style="color:' + bc2 + ';">' + m.score + '</span>'
      + '</div>';
  }).join('');
  const nameLabel = top.label.replace(/\b\w/g, function(c){return c.toUpperCase();});
  ro.innerHTML =
    '<div class="ro-match">'
    + '<div>'
    + '<div class="ro-label">Resolved &middot; format: <code style="color:#818cf8;">' + top.fmt + '</code></div>'
    + '<div class="ro-space-row">'
    + '<span class="ro-icon">' + top.icon + '</span>'
    + '<div>'
    + '<div class="ro-name">' + nameLabel + '</div>'
    + '<div class="ro-sig">@' + top.signal + ' &middot; ' + top.code + '</div>'
    + '<div class="ro-desc">' + escHtml(top.desc) + '</div>'
    + '<div class="ro-matched">matched on: ' + escHtml(top.matchedOn) + '</div>'
    + '</div></div></div>'
    + '<div class="ro-conf">'
    + '<div class="ro-conf-num" style="color:' + bandColor + ';">' + top.score + '</div>'
    + '<div class="ro-conf-band" style="color:' + bandColor + ';">' + top.band + '</div>'
    + '</div></div>'
    + (alts ? '<div class="ro-alts"><span style="font-size:.62rem;color:var(--t4);margin-right:4px;">alternatives \u2192</span>' + alts + '</div>' : '');
}

function doNXNav() {
  const q = document.getElementById('nx-input').value.trim();
  if (!q) return;
  const matches = resolveClient(q);
  if (matches.length && matches[0].score >= 30) {
    window.location.href = BASE + '/nexus/navigate?q=' + encodeURIComponent(q);
  } else {
    window.location.href = BASE + '/nexus?q=' + encodeURIComponent(q) + '&miss=1';
  }
}

function setInputExample(ex) {
  const inp = document.getElementById('nx-input');
  inp.value = ex;
  inp.focus();
  onNXInput(ex);
}

// ── Presence ─────────────────────────────────────────────────────────────────
function selRole(role) {
  selRoleCurrent = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('sel'));
  document.querySelector('[data-role="'+role+'"]')?.classList.add('sel');
  document.getElementById('pf-pass').style.display  = (role==='owner'||role==='creator') ? '' : 'none';
  document.getElementById('pf-email').style.display = role==='customer' ? '' : 'none';
  document.getElementById('pf-vis').style.display   = role==='visitor' ? '' : 'none';
  const m = ROLE_META[role];
  document.getElementById('pres-btn').textContent = 'Establish '+(m?.label||role)+' Presence';
  document.getElementById('pres-msg').innerHTML = '';
}

async function doEstablish() {
  const btn = document.getElementById('pres-btn');
  btn.disabled = true; btn.textContent = 'Establishing…';
  const body = { role: selRoleCurrent };
  if (selRoleCurrent === 'owner' || selRoleCurrent === 'creator')
    body.passphrase = document.getElementById('pf-pass-val')?.value;
  if (selRoleCurrent === 'customer')
    body.email = document.getElementById('pf-email-val')?.value;
  try {
    const r = await fetch('/nexus/presence', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.ok) {
      document.getElementById('pres-msg').innerHTML = '<div class="auth-msg auth-ok">✓ '+d.presence.role+' presence established. Reloading…</div>';
      setTimeout(()=>window.location.reload(), 700);
    } else {
      document.getElementById('pres-msg').innerHTML = '<div class="auth-msg auth-err">✗ '+(d.error||'Failed')+'</div>';
      btn.disabled = false; btn.textContent = 'Establish Presence';
    }
  } catch {
    document.getElementById('pres-msg').innerHTML = '<div class="auth-msg auth-err">✗ Request failed</div>';
    btn.disabled = false; btn.textContent = 'Establish Presence';
  }
}

async function clearPresence() {
  await fetch('/nexus/presence', { method:'DELETE' });
  window.location.reload();
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function copyToken() {
  const tok = document.querySelector('.pres-token')?.textContent;
  if (!tok) return;
  navigator.clipboard.writeText(tok).catch(()=>{});
  showToast('Token copied');
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2000);
}
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Keyboard ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const active = document.activeElement?.tagName;
  if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && active !== 'INPUT' && active !== 'TEXTAREA') {
    e.preventDefault(); document.getElementById('nx-input').focus();
  }
  if (e.key === 'Escape') document.activeElement?.blur?.();
});

// ── Init ──────────────────────────────────────────────────────────────────────
selRole('visitor');
const initQ = ${JSON.stringify(initQ)};
if (initQ) { setTimeout(()=>onNXInput(initQ), 50); }
</script>
</body>
</html>`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Catch-all → resolve + redirect (enables /nexus/earn, /nexus/@vault etc.)
// ─────────────────────────────────────────────────────────────────────────────
router.use((req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const q    = req.path.slice(1).replace(/^(@|#|~|\?)/, m => m);
  if (!q) { res.redirect(302, `${BASE}/nexus`); return; }
  res.redirect(302, `${BASE}/nexus/navigate?q=${encodeURIComponent(q)}`);
});

export default router;
