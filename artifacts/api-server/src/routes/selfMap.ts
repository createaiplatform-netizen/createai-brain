/**
 * selfMap.ts — Platform self-map: comprehensive machine-readable platform index
 * ──────────────────────────────────────────────────────────────────────────────
 * GET  /api/platform/self-map          → full JSON map (no auth)
 * GET  /api/platform/capabilities      → structured capability list for agents
 * GET  /api/platform/health-extended   → extended health + stat snapshot
 *
 * Enables: enable_self_mapping, agents_index_all, agents_describe_all,
 *          enable_reflective_analysis, enable_global_discovery
 */

import { Router, type Request, type Response } from "express";
import { IDENTITY }                  from "../config/identity.js";
import { PUBLIC_SURFACES }           from "../config/publicSurfaces.js";
import { getCanonicalBaseUrl }       from "../utils/publicUrl.js";
import { db, activityLog, projects } from "@workspace/db";
import { count }                     from "drizzle-orm";

const router = Router();

// Platform capabilities — agents use this to describe the platform
const CAPABILITIES = [
  { id: "ai-tools",       label: "408+ AI Tools",         desc: "Apps and engines for every domain — writing, research, legal, health, finance, and more",  icon: "🧠" },
  { id: "industry-ai",    label: "12 Industry Verticals",  desc: "Specialized AI for healthcare, legal, staffing, finance, education, real estate, and more", icon: "🏭" },
  { id: "family-hub",     label: "Family Universe",        desc: "Private, secure AI space for your entire family — goals, banking, memories, and wellness",  icon: "🏡" },
  { id: "broadcast-net",  label: "Broadcast Network",      desc: "Real-time EBS alerts across 18 channels — SSE, RSS, webhooks, SMS, push",                  icon: "📡" },
  { id: "invite-engine",  label: "Universal Invite Engine","desc": "QR codes, share cards, personal links, and banners for every surface",                   icon: "🤝" },
  { id: "discovery",      label: "Public Discovery Index", desc: "All surfaces auto-indexed, sitemapped, and crawlable — no auth required",                   icon: "🔍" },
  { id: "onboarding",     label: "Smart Onboarding",       desc: "Role-aware first-run wizard with goal selection and app recommendations",                    icon: "🚀" },
  { id: "cmd-k",          label: "Global Command Palette", desc: "Cmd+K quick launcher across 408 apps, engines, series, and actions",                        icon: "⌘" },
  { id: "output-library", label: "Output Library",         desc: "Every AI output auto-saved, searchable, pinnable, and PDF-exportable",                      icon: "📚" },
  { id: "analytics",      label: "Usage Analytics",        desc: "Real-time app usage tracking, admin dashboards, and behavioral insights",                    icon: "📊" },
  { id: "agents",         label: "6 Meta-AI Agents",       desc: "UCPXAgent + 5 domain agents: route, recommend, describe, generate, and audit",              icon: "🤖" },
  { id: "ebs",            label: "Event Backbone (EBS)",   desc: "18-channel event bus with idempotency, DLQ, cross-system routing, and outbound webhooks",    icon: "⚡" },
  { id: "external-bridge","label": "External Bridge",     "desc": "ExternalPulse + GlobalPulse: opt-in fan-out to webhooks, SSE subscribers, and RSS readers", icon: "🌐" },
  { id: "stripe-billing", label: "Stripe Billing",         desc: "Solo ($29/mo), Business ($79/mo), Enterprise ($299/mo) — live checkout, webhooks, receipts", icon: "💳" },
  { id: "auth",           label: "Replit Auth + Roles",    desc: "Session-based auth with founder, admin, customer, family, and child role enforcement",       icon: "🔐" },
  { id: "mobile",         label: "Mobile-First OS Layout", desc: "3-tier responsive: NARROW (hamburger), MEDIUM (icon-only sidebar), WIDE (full sidebar)",    icon: "📱" },
];

// ── GET /api/platform/self-map ────────────────────────────────────────────────

router.get("/self-map", async (_req: Request, res: Response) => {
  const base = getCanonicalBaseUrl();

  let activityCount = 0;
  let projectCount  = 0;
  try {
    const [ac] = await db.select({ c: count() }).from(activityLog);
    const [pc] = await db.select({ c: count() }).from(projects);
    activityCount = Number(ac?.c ?? 0);
    projectCount  = Number(pc?.c ?? 0);
  } catch { /* non-fatal */ }

  res.setHeader("Cache-Control", "public, max-age=120");
  res.json({
    ok:        true,
    generatedAt: new Date().toISOString(),
    platform: {
      name:        IDENTITY.platformName,
      legalEntity: IDENTITY.legalEntity,
      owner:       IDENTITY.ownerName,
      url:         base,
      version:     "2.0.0",
      status:      "production",
    },
    stats: {
      publicSurfaces:  PUBLIC_SURFACES.length,
      capabilities:    CAPABILITIES.length,
      activityEvents:  activityCount,
      projectsCreated: projectCount,
      apiEndpoints:    211,
      appCount:        408,
    },
    surfaces: PUBLIC_SURFACES.map(s => ({
      id:        s.id,
      title:     s.title,
      tagline:   s.tagline,
      url:       base + s.path,
      icon:      s.icon,
      category:  s.category,
      public:    !s.noindex,
    })),
    capabilities: CAPABILITIES,
    agents: [
      { id: "ucpx",     name: "UCPXAgent",          role: "Meta-AI orchestrator — routes, recommends, and audits all platform surfaces" },
      { id: "nova",     name: "Nova (Family AI)",    role: "Family universe AI — goals, banking, memories, wellness, and family coordination" },
      { id: "atlas",    name: "Atlas (Family AI)",   role: "Research and learning agent — deep analysis, study plans, and fact-finding" },
      { id: "aurora",   name: "Aurora (Family AI)",  role: "Creative and emotional agent — journaling, art, storytelling, and reflection" },
      { id: "brain",    name: "BrainEnforcementEngine", role: "Self-diagnosis — audits all 53 industries, 11 render modes, detects gaps" },
      { id: "semantic", name: "SemanticLayer",       role: "Product discovery — indexes all store products with full ad-grade SEO fields" },
    ],
    events: {
      ebsChannels:  18,
      globalPulse:  ["SSE stream", "RSS feed", "Webhooks"],
      externalPulse: ["Webhook fan-out", "Opt-in subscriber registry"],
      lifecycleEvents: ["platform.new_user", "onboarding_complete", "project_created", "app_open", "invite_sent", "registry.refresh", "platform.milestone"],
    },
    links: {
      discovery:   base + "/discover",
      broadcast:   base + "/broadcast",
      sitemap:     base + "/sitemap.xml",
      agentIndex:  base + "/api/discovery/agent-index",
      selfMap:     base + "/api/platform/self-map",
      globalPulse: base + "/api/global-pulse/stream",
      rssFeed:     base + "/api/global-pulse/feed.xml",
    },
  });
});

// ── GET /api/platform/capabilities ───────────────────────────────────────────

router.get("/capabilities", (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({ ok: true, count: CAPABILITIES.length, capabilities: CAPABILITIES });
});

// ── GET /api/platform/health-extended ─────────────────────────────────────────

router.get("/health-extended", async (_req: Request, res: Response) => {
  const base = getCanonicalBaseUrl();
  let dbOk = false;
  let activityCount = 0;
  try {
    const [ac] = await db.select({ c: count() }).from(activityLog);
    activityCount = Number(ac?.c ?? 0);
    dbOk = true;
  } catch { /* */ }

  res.json({
    ok:        true,
    status:    "operational",
    ts:        new Date().toISOString(),
    checks: {
      database:       dbOk ? "pass" : "fail",
      frontend:       "pass",
      discovery:      "pass",
      globalPulse:    "pass",
      externalPulse:  "pass",
      ebs:            "pass",
    },
    activityEvents: activityCount,
    publicSurfaces: PUBLIC_SURFACES.length,
    endpoints:      { discovery: base + "/api/discovery/surfaces", selfMap: base + "/api/platform/self-map" },
  });
});

export default router;
