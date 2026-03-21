/**
 * routes/signalSpace.ts — SIGNALSPACE
 * ─────────────────────────────────────
 * Semantic Space Addressing Protocol (SSAP)
 *
 * An AI-native naming and routing layer. Every platform space has a Signal —
 * a multi-dimensional semantic fingerprint. You navigate by intent, concept,
 * natural language, or shortcode — not by memorizing URLs.
 *
 * Address formats:
 *   @codename    → signal handle    (@vault, @store, @launch)
 *   #concept     → semantic hashtag (#money → vault, #products → store)
 *   ?query       → natural language (?where is my balance → vault)
 *   ~code        → machine shortcode (~v01, ~st, ~lc)
 *
 * Routes:
 *   GET /ss                  → SignalSpace Console (UI)
 *   GET /ss/resolve?q=...    → Resolver JSON API
 *   GET /ss/nodes            → All registered nodes (JSON)
 *   GET /ss/goto/:signal     → Direct @signal navigation
 *   GET /ss/*                → Catch-all fuzzy resolver → redirect
 */

import { Router, type Request, type Response } from "express";
import { getPublicBaseUrl }                     from "../utils/publicUrl.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// NODE REGISTRY
// Every platform space registered as a Signal Node.
// ─────────────────────────────────────────────────────────────────────────────

type NodeRole = "admin" | "public" | "revenue" | "content" | "system";

interface SpaceNode {
  id:          string;     // stable internal ID
  codename:    string;     // @handle (without the @)
  shortcode:   string;     // ~machine code
  role:        NodeRole;
  intents:     string[];   // verbs: what you DO here
  concepts:    string[];   // nouns: what this IS about
  tags:        string[];   // free-form classifier terms
  description: string;     // one-line human description
  urlPath:     string;     // canonical platform path (appended to BASE)
  external:    boolean;    // true = opens offsite
}

function buildNodes(BASE: string): SpaceNode[] {
  return [
    {
      id:          "node_vault",
      codename:    "vault",
      shortcode:   "~v01",
      role:        "revenue",
      intents:     ["pay", "payout", "transfer", "withdraw", "earn", "receive"],
      concepts:    ["balance", "money", "bank", "stripe", "earnings", "revenue", "funds", "available", "pending"],
      tags:        ["finance", "payments", "cashflow"],
      description: "Your private payment command center. Balance, payouts, Move Money.",
      urlPath:     "/vault",
      external:    false,
    },
    {
      id:          "node_store",
      codename:    "store",
      shortcode:   "~st",
      role:        "public",
      intents:     ["browse", "buy", "purchase", "shop", "discover", "find"],
      concepts:    ["products", "catalog", "ebooks", "courses", "templates", "digital", "items", "shop"],
      tags:        ["commerce", "storefront", "public"],
      description: "Public product catalog. All 100 AI-generated digital products.",
      urlPath:     "/store",
      external:    false,
    },
    {
      id:          "node_launch",
      codename:    "launch",
      shortcode:   "~lc",
      role:        "admin",
      intents:     ["deliver", "sell", "send", "fulfill", "manage", "track"],
      concepts:    ["payments", "delivery", "orders", "customers", "sales", "live", "console"],
      tags:        ["ops", "fulfillment", "admin"],
      description: "Revenue Launch Console. Live payments, one-click delivery, product table.",
      urlPath:     "/launch/",
      external:    false,
    },
    {
      id:          "node_hub",
      codename:    "hub",
      shortcode:   "~hb",
      role:        "admin",
      intents:     ["navigate", "explore", "find", "locate", "overview", "manage"],
      concepts:    ["admin", "directory", "platform", "surfaces", "overview", "control", "all"],
      tags:        ["admin", "navigation", "meta"],
      description: "Admin Hub. Directory of every platform surface with status.",
      urlPath:     "/hub",
      external:    false,
    },
    {
      id:          "node_portal",
      codename:    "portal",
      shortcode:   "~pr",
      role:        "public",
      intents:     ["login", "access", "retrieve", "redownload", "check"],
      concepts:    ["customer", "purchases", "history", "downloads", "account", "orders", "receipt"],
      tags:        ["customer", "self-service", "public"],
      description: "Customer Portal. Email-gated purchase history and re-download links.",
      urlPath:     "/portal/me",
      external:    false,
    },
    {
      id:          "node_join",
      codename:    "join",
      shortcode:   "~jn",
      role:        "public",
      intents:     ["subscribe", "join", "upgrade", "become", "enroll"],
      concepts:    ["membership", "subscription", "plans", "tier", "monthly", "premium", "vip"],
      tags:        ["subscriptions", "membership", "revenue"],
      description: "Membership landing. Subscription tiers: $29 / $79 / $299/mo.",
      urlPath:     "/join/landing",
      external:    false,
    },
    {
      id:          "node_home",
      codename:    "home",
      shortcode:   "~hm",
      role:        "public",
      intents:     ["start", "begin", "land", "enter", "visit"],
      concepts:    ["homepage", "platform", "root", "front", "landing", "index"],
      tags:        ["public", "entry"],
      description: "Platform homepage. Public-facing brand entry with featured products.",
      urlPath:     "/",
      external:    false,
    },
    {
      id:          "node_signals",
      codename:    "signals",
      shortcode:   "~ss",
      role:        "system",
      intents:     ["navigate", "resolve", "find", "route", "search", "locate"],
      concepts:    ["signalspace", "ssap", "addressing", "navigation", "routing", "signals"],
      tags:        ["system", "meta", "ai-native"],
      description: "SignalSpace Console. The AI-native addressing and navigation layer.",
      urlPath:     "/ss",
      external:    false,
    },
    {
      id:          "node_content",
      codename:    "content",
      shortcode:   "~cn",
      role:        "content",
      intents:     ["generate", "create", "write", "produce", "make"],
      concepts:    ["ai", "generation", "content", "ebooks", "text", "writing", "gpt"],
      tags:        ["ai", "generation", "content"],
      description: "AI Content Engine. Generate product descriptions, emails, and copy.",
      urlPath:     "/api/semantic/content/",
      external:    false,
    },
    {
      id:          "node_sitemap",
      codename:    "sitemap",
      shortcode:   "~sm",
      role:        "system",
      intents:     ["index", "discover", "crawl", "map", "list"],
      concepts:    ["seo", "sitemap", "xml", "google", "search", "index", "pages"],
      tags:        ["seo", "system"],
      description: "XML Sitemap. Google-discoverable index of all 100 product pages.",
      urlPath:     "/sitemap.xml",
      external:    false,
    },
    {
      id:          "node_shopify",
      codename:    "shopify",
      shortcode:   "~sh",
      role:        "content",
      intents:     ["export", "import", "sync", "feed", "download"],
      concepts:    ["shopify", "csv", "export", "feed", "products", "import"],
      tags:        ["export", "commerce", "shopify"],
      description: "Shopify CSV export. All 100 products in Shopify import format.",
      urlPath:     "/export/shopify.csv",
      external:    false,
    },
    {
      id:          "node_stripe_balance",
      codename:    "balance",
      shortcode:   "~sb",
      role:        "revenue",
      intents:     ["view", "check", "see", "open"],
      concepts:    ["balance", "stripe", "available", "pending", "dashboard"],
      tags:        ["stripe", "external", "finance"],
      description: "Stripe Balance Dashboard. Opens stripe.com directly.",
      urlPath:     "https://dashboard.stripe.com/balance/overview",
      external:    true,
    },
    {
      id:          "node_stripe_payouts",
      codename:    "payouts",
      shortcode:   "~sp",
      role:        "revenue",
      intents:     ["view", "check", "withdraw", "transfer"],
      concepts:    ["payouts", "stripe", "bank", "transfer", "history", "payments"],
      tags:        ["stripe", "external", "finance"],
      description: "Stripe Payouts. Bank transfer history and payout management.",
      urlPath:     "https://dashboard.stripe.com/payouts",
      external:    true,
    },
    {
      id:          "node_analytics",
      codename:    "analytics",
      shortcode:   "~an",
      role:        "admin",
      intents:     ["measure", "track", "monitor", "score", "analyze"],
      concepts:    ["analytics", "score", "domains", "capability", "platform", "health", "metrics"],
      tags:        ["analytics", "admin"],
      description: "Platform Score Dashboard. 17/20 domain capability health check.",
      urlPath:     "/api/semantic/analytics/",
      external:    false,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVER ENGINE
// ─────────────────────────────────────────────────────────────────────────────

interface ResolverResult {
  matched:    boolean;
  node:       SpaceNode | null;
  confidence: number;        // 0–100
  matchType:  string;        // how it was matched
  inputType:  string;        // @signal | #concept | ?query | ~code | bare
  query:      string;
  resolvedUrl: string | null;
}

function detectInputType(q: string): string {
  const s = q.trim();
  if (s.startsWith("@"))  return "@signal";
  if (s.startsWith("#"))  return "#concept";
  if (s.startsWith("?"))  return "?query";
  if (s.startsWith("~"))  return "~code";
  return "bare";
}

function resolveQuery(q: string, nodes: SpaceNode[]): ResolverResult {
  const raw   = q.trim().toLowerCase();
  const type  = detectInputType(raw);
  const term  = raw.replace(/^[@#?~]/, "").trim();
  const words = term.split(/\s+/).filter(Boolean);

  const noMatch: ResolverResult = {
    matched: false, node: null, confidence: 0,
    matchType: "none", inputType: type, query: q, resolvedUrl: null,
  };
  if (!term) return noMatch;

  let best: { node: SpaceNode; confidence: number; matchType: string } | null = null;

  const score = (node: SpaceNode, conf: number, mt: string) => {
    if (!best || conf > best.confidence) best = { node, confidence: conf, matchType: mt };
  };

  for (const node of nodes) {
    // ── Exact codename match ──────────────────────────────────────────────
    if (term === node.codename)          score(node, 100, "exact:codename");
    if (term === node.shortcode.slice(1)) score(node, 100, "exact:shortcode");

    // ── Signal handle (@codename) ─────────────────────────────────────────
    if (type === "@signal" && term === node.codename) score(node, 100, "signal:exact");

    // ── Machine shortcode (~code) ─────────────────────────────────────────
    if (type === "~code" && raw === node.shortcode)   score(node, 100, "shortcode:exact");

    // ── Concept hashtag (#concept) ────────────────────────────────────────
    if (type === "#concept") {
      if (node.concepts.includes(term))  score(node, 95, "concept:exact");
      if (node.intents.includes(term))   score(node, 90, "intent:exact");
      if (node.tags.includes(term))      score(node, 85, "tag:exact");
    }

    // ── Natural language / bare query ─────────────────────────────────────
    if (type === "?query" || type === "bare") {
      let pts = 0;
      for (const w of words) {
        if (node.codename.includes(w) || w.includes(node.codename)) pts += 30;
        for (const i of node.intents)   if (i.includes(w) || w.includes(i))   pts += 20;
        for (const c of node.concepts)  if (c.includes(w) || w.includes(c))   pts += 18;
        for (const t of node.tags)      if (t.includes(w) || w.includes(t))   pts += 10;
        if (node.description.toLowerCase().includes(w))                        pts += 8;
      }
      if (pts > 0) {
        const conf = Math.min(92, Math.round((pts / (words.length * 30)) * 100));
        if (conf >= 15) score(node, conf, "semantic:weighted");
      }
    }

    // ── Partial substring fallback ────────────────────────────────────────
    if (node.codename.includes(term) || term.includes(node.codename)) score(node, 70, "partial:codename");
    for (const c of node.concepts) if (c.startsWith(term) || term.startsWith(c)) score(node, 55, "partial:concept");
  }

  if (!best || best.confidence < 12) return noMatch;

  const node = best.node;
  const url  = node.external ? node.urlPath : `${getPublicBaseUrl()}${node.urlPath}`;
  return {
    matched:     true,
    node,
    confidence:  best.confidence,
    matchType:   best.matchType,
    inputType:   type,
    query:       q,
    resolvedUrl: url,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE COLORS & METADATA
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_STYLE: Record<NodeRole, { bg: string; color: string; border: string; label: string }> = {
  admin:   { bg: "#ede9fe", color: "#4c1d95", border: "#c4b5fd", label: "Admin"   },
  public:  { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", label: "Public"  },
  revenue: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d", label: "Revenue" },
  content: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", label: "Content" },
  system:  { bg: "#f1f5f9", color: "#334155", border: "#cbd5e1", label: "System"  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /nodes — all registered nodes (JSON)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/nodes", (req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();
  const nodes = buildNodes(BASE);
  res.json({
    ok:        true,
    protocol:  "SSAP/1.0",
    nodeCount: nodes.length,
    nodes:     nodes.map(n => ({
      ...n,
      signal:     `@${n.codename}`,
      resolvedUrl: n.external ? n.urlPath : `${BASE}${n.urlPath}`,
    })),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /resolve?q=... — resolver JSON API
// ─────────────────────────────────────────────────────────────────────────────
router.get("/resolve", (req: Request, res: Response) => {
  const BASE  = getPublicBaseUrl();
  const nodes = buildNodes(BASE);
  const q     = String(req.query["q"] ?? "").trim();

  if (!q) {
    res.status(400).json({ ok: false, error: "Missing ?q= parameter" });
    return;
  }

  const result = resolveQuery(q, nodes);
  res.json({ ok: true, protocol: "SSAP/1.0", ...result });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /goto/:signal — direct @signal navigation
// ─────────────────────────────────────────────────────────────────────────────
router.get("/goto/:signal", (req: Request, res: Response) => {
  const BASE    = getPublicBaseUrl();
  const nodes   = buildNodes(BASE);
  const signal  = String(req.params["signal"] ?? "").toLowerCase().trim();
  const result  = resolveQuery(`@${signal}`, nodes);
  if (result.matched && result.resolvedUrl) {
    res.redirect(302, result.resolvedUrl);
  } else {
    res.redirect(302, `${BASE}/ss?q=@${signal}&error=unresolved`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET / — SignalSpace Console (full-screen UI)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", (req: Request, res: Response) => {
  const BASE     = getPublicBaseUrl();
  const nodes    = buildNodes(BASE);
  const initQ    = String(req.query["q"] ?? "");
  const initErr  = String(req.query["error"] ?? "");

  const nodesJson = JSON.stringify(nodes.map(n => ({
    ...n,
    signal:      `@${n.codename}`,
    resolvedUrl: n.external ? n.urlPath : `${BASE}${n.urlPath}`,
  })));

  // Node grid cards (server-rendered)
  const nodeCards = nodes.map(n => {
    const rs = ROLE_STYLE[n.role];
    const url = n.external ? n.urlPath : `${BASE}${n.urlPath}`;
    return `<div class="node-card" data-codename="${n.codename}" data-shortcode="${n.shortcode}"
      data-intents="${n.intents.join(",")}" data-concepts="${n.concepts.join(",")}"
      onclick="navigate('${url}', ${n.external})"
      onmouseover="this.style.borderColor='#6366f1';this.style.boxShadow='0 0 0 1px #6366f1,0 8px 24px rgba(99,102,241,0.18)'"
      onmouseout="this.style.borderColor='#1e293b';this.style.boxShadow=''">
      <div class="node-top">
        <div class="node-signal">@${n.codename}</div>
        <div class="node-badge" style="background:${rs.bg};color:${rs.color};border:1px solid ${rs.border};">${rs.label}</div>
      </div>
      <div class="node-short">${n.shortcode}</div>
      <div class="node-desc">${n.description}</div>
      <div class="node-meta">
        ${n.intents.slice(0,3).map(i => `<span class="node-tag intent-tag">${i}</span>`).join("")}
        ${n.concepts.slice(0,3).map(c => `<span class="node-tag concept-tag">#${c}</span>`).join("")}
      </div>
      <div class="node-url">${n.external ? "↗ external" : n.urlPath}</div>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SignalSpace — CreateAI Brain</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --ink: #0f172a; --ink2: #1e293b; --ink3: #334155;
      --muted: #64748b; --dim: #94a3b8; --line: #1e293b;
      --indigo: #6366f1; --indigo-d: #4f46e5; --indigo-glow: rgba(99,102,241,0.3);
      --cyan: #06b6d4; --emerald: #10b981; --amber: #f59e0b;
      --bg: #020617; --surface: #0f172a; --card: #111827;
      --text: #e2e8f0; --text2: #94a3b8; --text3: #475569;
    }
    html, body { height: 100%; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow-x: hidden; }

    /* ── Header ── */
    .hdr { border-bottom: 1px solid var(--line); padding: 0 28px; background: rgba(2,6,23,0.8); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
    .hdr-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; height: 54px; gap: 20px; }
    .ss-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .ss-icon { width: 30px; height: 30px; background: linear-gradient(135deg, var(--indigo), var(--cyan)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; }
    .ss-name { font-size: 0.95rem; font-weight: 900; color: var(--text); letter-spacing: -0.02em; }
    .ss-sub { font-size: 0.6rem; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.1em; margin-left: 6px; border-left: 1px solid var(--line); padding-left: 10px; }
    .proto-chip { font-family: monospace; font-size: 0.65rem; background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.25); border-radius: 6px; padding: 3px 8px; }
    .hdr-links { margin-left: auto; display: flex; gap: 20px; align-items: center; }
    .hdr-link { font-size: 0.78rem; font-weight: 600; color: var(--text2); text-decoration: none; transition: color 0.15s; }
    .hdr-link:hover { color: var(--text); }

    /* ── Resolver Bar (hero) ── */
    .resolver-hero { padding: 48px 28px 36px; text-align: center; border-bottom: 1px solid var(--line); background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.08), transparent); }
    .resolver-inner { max-width: 720px; margin: 0 auto; }
    .resolver-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--indigo); margin-bottom: 16px; }
    .resolver-heading { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 900; color: var(--text); letter-spacing: -0.03em; margin-bottom: 8px; }
    .resolver-sub { font-size: 0.85rem; color: var(--text2); margin-bottom: 28px; line-height: 1.6; }
    .resolver-wrap { position: relative; }
    .resolver-input { width: 100%; background: var(--surface); border: 1.5px solid var(--line); border-radius: 14px; padding: 16px 56px 16px 20px; font-size: 1rem; color: var(--text); outline: none; font-family: 'SF Mono', 'Fira Code', monospace; transition: border-color 0.2s, box-shadow 0.2s; }
    .resolver-input:focus { border-color: var(--indigo); box-shadow: 0 0 0 3px var(--indigo-glow); }
    .resolver-input::placeholder { color: var(--text3); }
    .resolver-clear { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text2); cursor: pointer; font-size: 1rem; padding: 4px; opacity: 0; transition: opacity 0.15s; }
    .resolver-clear.visible { opacity: 1; }

    /* ── Result Panel ── */
    .result-panel { margin-top: 16px; min-height: 80px; }
    .result-card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; text-align: left; display: flex; align-items: center; gap: 16px; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
    .result-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .result-body { flex: 1; min-width: 0; }
    .result-signal { font-family: monospace; font-size: 0.9rem; font-weight: 800; color: var(--indigo); margin-bottom: 3px; }
    .result-desc { font-size: 0.82rem; color: var(--text2); margin-bottom: 6px; }
    .result-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .result-confidence { font-size: 0.68rem; font-weight: 800; font-family: monospace; color: var(--emerald); background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); border-radius: 6px; padding: 2px 8px; }
    .result-match-type { font-size: 0.68rem; font-family: monospace; color: var(--text2); background: var(--surface); border-radius: 6px; padding: 2px 8px; border: 1px solid var(--line); }
    .result-url { font-size: 0.72rem; color: var(--text3); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 4px; }
    .result-action { flex-shrink: 0; }
    .btn-go { display: inline-flex; align-items: center; gap: 6px; background: var(--indigo); color: white; text-decoration: none; border-radius: 10px; padding: 10px 18px; font-size: 0.82rem; font-weight: 800; transition: all 0.15s; border: none; cursor: pointer; }
    .btn-go:hover { background: var(--indigo-d); transform: translateY(-1px); }
    .result-no-match { font-size: 0.85rem; color: var(--text2); text-align: center; padding: 20px; font-family: monospace; }
    .result-no-match strong { color: var(--amber); }

    /* ── Format hints ── */
    .format-hints { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
    .fhint { font-family: monospace; font-size: 0.75rem; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 5px 12px; color: var(--text2); cursor: pointer; transition: all 0.15s; }
    .fhint:hover { border-color: var(--indigo); color: var(--text); }
    .fhint strong { color: var(--cyan); }

    /* ── Page Layout ── */
    .page { max-width: 1400px; margin: 0 auto; padding: 28px; }
    .section-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text2); margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
    .section-label::after { content: ''; flex: 1; height: 1px; background: var(--line); }

    /* ── Node Grid ── */
    .node-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; margin-bottom: 32px; }
    .node-card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
    .node-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .node-signal { font-family: monospace; font-size: 0.88rem; font-weight: 800; color: #818cf8; }
    .node-badge { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; border-radius: 999px; padding: 2px 9px; }
    .node-short { font-family: monospace; font-size: 0.68rem; color: var(--text3); margin-bottom: 8px; }
    .node-desc { font-size: 0.78rem; color: var(--text2); line-height: 1.5; margin-bottom: 10px; }
    .node-meta { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px; }
    .node-tag { font-size: 0.62rem; font-weight: 700; border-radius: 4px; padding: 2px 7px; }
    .intent-tag { background: rgba(99,102,241,0.12); color: #818cf8; }
    .concept-tag { background: rgba(6,182,212,0.1); color: #67e8f9; }
    .node-url { font-family: monospace; font-size: 0.65rem; color: var(--text3); }

    /* ── Protocol Reference ── */
    .proto-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 32px; }
    .proto-card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 20px; }
    .proto-format { font-family: monospace; font-size: 1.1rem; font-weight: 900; margin-bottom: 8px; }
    .proto-name { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text2); margin-bottom: 10px; }
    .proto-desc { font-size: 0.8rem; color: var(--text2); line-height: 1.6; margin-bottom: 12px; }
    .proto-examples { display: flex; flex-direction: column; gap: 5px; }
    .proto-ex { font-family: monospace; font-size: 0.75rem; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 5px 10px; color: var(--text); cursor: pointer; transition: border-color 0.15s; }
    .proto-ex:hover { border-color: var(--indigo); }
    .proto-ex .ex-result { color: var(--dim); font-size: 0.68rem; display: block; margin-top: 2px; }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--bg); } ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }

    /* ── Responsive ── */
    @media(max-width: 640px) { .resolver-hero { padding: 28px 16px 24px; } .page { padding: 16px; } }
  </style>
</head>
<body>

<!-- ── Header ── -->
<header class="hdr">
  <div class="hdr-inner">
    <a class="ss-logo" href="${BASE}/ss">
      <div class="ss-icon">⬡</div>
      <span class="ss-name">SignalSpace</span>
    </a>
    <span class="ss-sub">by CreateAI Brain</span>
    <span class="proto-chip">SSAP / 1.0</span>
    <div class="hdr-links">
      <a href="${BASE}/hub" class="hdr-link">Hub</a>
      <a href="${BASE}/vault" class="hdr-link">Vault</a>
      <a href="${BASE}/ss/nodes" class="hdr-link" style="font-family:monospace;color:#818cf8;">nodes.json</a>
    </div>
  </div>
</header>

<!-- ── Resolver Hero ── -->
<div class="resolver-hero">
  <div class="resolver-inner">
    <div class="resolver-label">Semantic Space Addressing Protocol</div>
    <h1 class="resolver-heading">Navigate by intent. Not by URL.</h1>
    <p class="resolver-sub">Type anything — a signal handle, a concept, a shortcode, or plain English.<br>SignalSpace resolves it to the right space instantly.</p>
    <div class="resolver-wrap">
      <input class="resolver-input" id="resolver" type="text" autocomplete="off" spellcheck="false"
        placeholder="@vault  ·  #money  ·  ?where is my balance  ·  ~v01"
        value="${initQ.replace(/"/g, "&quot;")}" oninput="onInput(this.value)">
      <button class="resolver-clear" id="clear-btn" onclick="clearInput()">✕</button>
    </div>
    <div class="result-panel" id="result-panel">
      ${initQ ? `<div class="result-no-match"><strong>Resolving…</strong></div>` : `<div class="result-no-match" style="opacity:0.5;">Waiting for input</div>`}
      ${initErr === "unresolved" ? `<div class="result-no-match"><strong>@${initQ.replace("@","")} could not be resolved.</strong> Try a different signal or query.</div>` : ""}
    </div>
    <div class="format-hints">
      ${[
        ["@vault", "signal handle"],
        ["#money", "concept"],
        ["?my balance", "natural language"],
        ["~v01", "shortcode"],
        ["?where do I sell", "intent query"],
        ["@launch", "signal handle"],
        ["#customers", "concept"],
        ["~st", "shortcode"],
      ].map(([ex, label]) => `<div class="fhint" onclick="tryExample('${ex}')" title="${label}"><strong>${ex[0]}</strong>${ex.slice(1)}</div>`).join("")}
    </div>
  </div>
</div>

<!-- ── Main ── -->
<div class="page">

  <!-- Protocol Reference -->
  <div class="section-label">Address Formats — SSAP / 1.0</div>
  <div class="proto-grid">
    ${[
      {
        fmt: "@handle", color: "#818cf8", name: "Signal Handle",
        desc: "The primary address for every space. Like a @ mention, but for platform locations. Resolves instantly to that space's canonical URL.",
        examples: [["@vault","→ Vault Money Hub"], ["@store","→ Product Catalog"], ["@launch","→ Revenue Console"], ["@hub","→ Admin Directory"]],
      },
      {
        fmt: "#concept", color: "#67e8f9", name: "Concept Hashtag",
        desc: "Semantic concept routing. Type what the space is *about* and SignalSpace finds the most relevant destination. Multiple spaces may match — highest confidence wins.",
        examples: [["#money","→ @vault (95%)"], ["#products","→ @store (95%)"], ["#deliver","→ @launch (90%)"], ["#subscription","→ @join (95%)"]],
      },
      {
        fmt: "?query", color: "#86efac", name: "Natural Language",
        desc: "Ask in plain English. The resolver scores every node across intents, concepts, tags, and description text. Returns best match with confidence percentage.",
        examples: [["?where is my balance","→ @vault"], ["?I want to sell","→ @launch"], ["?sign up for monthly","→ @join"], ["?show me products","→ @store"]],
      },
      {
        fmt: "~code", color: "#fcd34d", name: "Machine Shortcode",
        desc: "Ultra-compact identifiers assigned by the system. Machine-generated, collision-free, copy-pasteable. Use in scripts, automations, and logs where brevity matters.",
        examples: [["~v01","→ @vault"], ["~st","→ @store"], ["~lc","→ @launch"], ["~ss","→ @signals"]],
      },
    ].map(p => `
    <div class="proto-card">
      <div class="proto-format" style="color:${p.color};">${p.fmt}</div>
      <div class="proto-name">${p.name}</div>
      <div class="proto-desc">${p.desc}</div>
      <div class="proto-examples">
        ${p.examples.map(([ex, res]) =>
          `<div class="proto-ex" onclick="tryExample('${ex}')"><span>${ex}</span><span class="ex-result">${res}</span></div>`
        ).join("")}
      </div>
    </div>`).join("")}
  </div>

  <!-- Signal Nodes -->
  <div class="section-label">Registered Signal Nodes (${nodes.length})</div>
  <div class="node-grid" id="node-grid">
    ${nodeCards}
  </div>

  <!-- API Reference -->
  <div class="section-label">Resolver API — SSAP Endpoints</div>
  <div style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:32px;font-family:monospace;font-size:0.82rem;color:var(--text2);">
    <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 24px;align-items:baseline;">
      ${[
        ["GET", "/ss", "SignalSpace Console (this page)"],
        ["GET", "/ss/nodes", "All registered nodes as JSON"],
        ["GET", "/ss/resolve?q=@vault", "Resolve any query → JSON result with confidence"],
        ["GET", "/ss/resolve?q=#money", "Resolve concept hashtag"],
        ["GET", "/ss/resolve?q=?my balance", "Resolve natural language"],
        ["GET", "/ss/resolve?q=~v01", "Resolve machine shortcode"],
        ["GET", "/ss/goto/:signal", "Navigate directly via @signal → 302 redirect"],
      ].map(([m, path, desc]) =>
        `<div style="color:#818cf8;font-weight:800;">${m}</div><div><span style="color:var(--text);">${path}</span> <span style="color:var(--text3);font-size:0.75rem;">— ${desc}</span></div>`
      ).join("")}
    </div>
  </div>

</div>

<script>
const NODES = ${nodesJson};

function navigate(url, isExternal) {
  if (isExternal) window.open(url, '_blank');
  else window.location.href = url;
}

function tryExample(q) {
  const inp = document.getElementById('resolver');
  inp.value = q;
  onInput(q);
  inp.focus();
}

function clearInput() {
  const inp = document.getElementById('resolver');
  inp.value = '';
  onInput('');
  inp.focus();
}

function onInput(q) {
  const clearBtn = document.getElementById('clear-btn');
  clearBtn.classList.toggle('visible', q.length > 0);
  if (!q.trim()) {
    document.getElementById('result-panel').innerHTML = '<div class="result-no-match" style="opacity:0.5;">Waiting for input</div>';
    return;
  }
  const result = resolveQuery(q.trim(), NODES);
  renderResult(result, q);
}

function detectInputType(q) {
  if (q.startsWith('@')) return '@signal';
  if (q.startsWith('#')) return '#concept';
  if (q.startsWith('?')) return '?query';
  if (q.startsWith('~')) return '~code';
  return 'bare';
}

function resolveQuery(q, nodes) {
  const raw   = q.toLowerCase();
  const type  = detectInputType(raw);
  const term  = raw.replace(/^[@#?~]/, '').trim();
  const words = term.split(/\\s+/).filter(Boolean);

  if (!term) return { matched: false };

  let best = null;

  function score(node, conf, mt) {
    if (!best || conf > best.confidence) best = { node, confidence: conf, matchType: mt };
  }

  for (const node of nodes) {
    if (term === node.codename) score(node, 100, 'exact:codename');
    if (term === node.shortcode.slice(1)) score(node, 100, 'exact:shortcode');
    if (type === '@signal' && term === node.codename) score(node, 100, 'signal:exact');
    if (type === '~code' && raw === node.shortcode) score(node, 100, 'shortcode:exact');

    if (type === '#concept') {
      if (node.concepts.includes(term)) score(node, 95, 'concept:exact');
      if (node.intents.includes(term))  score(node, 90, 'intent:exact');
      if (node.tags.includes(term))     score(node, 85, 'tag:exact');
    }

    if (type === '?query' || type === 'bare') {
      let pts = 0;
      for (const w of words) {
        if (node.codename.includes(w) || w.includes(node.codename)) pts += 30;
        for (const i of node.intents)  if (i.includes(w) || w.includes(i))  pts += 20;
        for (const c of node.concepts) if (c.includes(w) || w.includes(c))  pts += 18;
        for (const t of node.tags)     if (t.includes(w) || w.includes(t))  pts += 10;
        if (node.description.toLowerCase().includes(w))                      pts += 8;
      }
      if (pts > 0) {
        const conf = Math.min(92, Math.round((pts / (words.length * 30)) * 100));
        if (conf >= 15) score(node, conf, 'semantic:weighted');
      }
    }

    if (node.codename.includes(term) || term.includes(node.codename)) score(node, 70, 'partial:codename');
    for (const c of node.concepts) if (c.startsWith(term) || term.startsWith(c)) score(node, 55, 'partial:concept');
  }

  if (!best || best.confidence < 12) return { matched: false, query: q };
  return { matched: true, node: best.node, confidence: best.confidence, matchType: best.matchType, inputType: type, query: q };
}

const ROLE_ICON = { admin: '⚙', public: '🌐', revenue: '💰', content: '✍', system: '⬡' };

function renderResult(r, rawQuery) {
  const el = document.getElementById('result-panel');
  if (!r.matched) {
    const type = detectInputType(rawQuery.toLowerCase());
    const suggestions = {
      '@signal': 'Try: @vault · @store · @launch · @hub',
      '#concept': 'Try: #money · #products · #customers · #subscribe',
      '?query':   'Try: "where is my balance" or "I want to sell something"',
      '~code':    'Try: ~v01 · ~st · ~lc · ~hb · ~pr · ~jn · ~ss',
      'bare':     'Try prefixes: @ # ? ~ — or type a concept like "store" or "balance"',
    };
    el.innerHTML = '<div class="result-no-match"><strong>No match</strong> — ' + (suggestions[type] || suggestions.bare) + '</div>';
    return;
  }
  const n    = r.node;
  const url  = n.resolvedUrl;
  const conf = r.confidence;
  const confColor = conf >= 90 ? '#6ee7b7' : conf >= 70 ? '#fcd34d' : '#fb923c';
  const roleIcon  = ROLE_ICON[n.role] || '·';
  const target    = n.external ? '_blank' : '_self';

  el.innerHTML = '<div class="result-card">'
    + '<div class="result-icon" style="background:rgba(99,102,241,0.12);">' + roleIcon + '</div>'
    + '<div class="result-body">'
    + '  <div class="result-signal">' + n.signal + ' <span style="color:var(--text3);font-weight:400;font-size:0.75em;">(' + n.shortcode + ')</span></div>'
    + '  <div class="result-desc">' + n.description + '</div>'
    + '  <div class="result-meta">'
    + '    <span class="result-confidence" style="color:' + confColor + ';border-color:' + confColor + '33;background:' + confColor + '15;">' + conf + '% match</span>'
    + '    <span class="result-match-type">' + r.matchType + '</span>'
    + '    <span style="font-size:0.68rem;color:var(--text3);font-family:monospace;">' + r.inputType + '</span>'
    + '  </div>'
    + '  <div class="result-url">' + url + '</div>'
    + '</div>'
    + '<div class="result-action">'
    + '  <a href="' + url + '" target="' + target + '" class="btn-go">Go <span style="font-size:0.9em;">→</span></a>'
    + '</div>'
    + '</div>';
}

// ── Init: resolve initial query if present ────────────────────────────────
const initQ = ${JSON.stringify(initQ)};
if (initQ) {
  const r = resolveQuery(initQ, NODES);
  renderResult(r, initQ);
  document.getElementById('clear-btn').classList.add('visible');
}

// ── Keyboard shortcut: / or Cmd+K focuses the resolver ───────────────────
document.addEventListener('keydown', e => {
  if ((e.key === '/' && document.activeElement.tagName !== 'INPUT') ||
      (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
    e.preventDefault();
    document.getElementById('resolver').focus();
  }
  if (e.key === 'Escape') document.getElementById('resolver').blur();
  if (e.key === 'Enter' && document.activeElement === document.getElementById('resolver')) {
    const r = resolveQuery(document.getElementById('resolver').value.trim(), NODES);
    if (r.matched && r.node) navigate(r.node.resolvedUrl, r.node.external);
  }
});
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

// ─────────────────────────────────────────────────────────────────────────────
// Catch-all: treat any unmatched path segment as a bare query → fuzzy redirect
// e.g. /ss/vault → resolves "vault" → 302 to /vault
// Must use router.use() — Express v5 / path-to-regexp v8 rejects "/*"
// ─────────────────────────────────────────────────────────────────────────────
router.use((req: Request, res: Response) => {
  const BASE  = getPublicBaseUrl();
  const nodes = buildNodes(BASE);
  const slug  = req.path.replace(/^\//, "").trim();
  if (!slug) { res.redirect(302, `${BASE}/ss`); return; }
  const result = resolveQuery(slug, nodes);
  if (result.matched && result.resolvedUrl) {
    res.redirect(302, result.resolvedUrl);
  } else {
    res.redirect(302, `${BASE}/ss?q=${encodeURIComponent(slug)}&error=unresolved`);
  }
});

export default router;
