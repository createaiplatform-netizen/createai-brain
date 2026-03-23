/**
 * discovery.ts — Registry-driven public discovery API
 * ─────────────────────────────────────────────────────
 * GET  /api/discovery/surfaces          → public JSON list of all surfaces (no auth)
 * GET  /api/discovery/surfaces/:id      → single surface with full OG/structured data
 * POST /api/discovery/refresh           → admin/founder: regen + broadcast via GlobalPulse + ExternalPulse
 * GET  /api/discovery/agent-index       → machine-readable agent surface index (no auth)
 *
 * SELF-EXPANSION LOOP: Add a surface to publicSurfaces.ts → it auto-appears
 * in this API, the sitemap, metadata endpoints, and the External Bridge refresh.
 */

import { Router, type Request, type Response } from "express";
import { PUBLIC_SURFACES, getIndexableSurfaces, type PublicSurface } from "../config/publicSurfaces.js";
import { broadcastGlobalPulse }    from "../services/globalPulse.js";
import { broadcastToSubscribers }  from "../services/externalPulse.js";
import { getCanonicalBaseUrl }     from "../utils/publicUrl.js";

const router = Router();

// ── Build full metadata envelope for a surface ────────────────────────────────

function buildEnvelope(s: PublicSurface, base: string) {
  const url = base + s.path;
  return {
    id:         s.id,
    title:      s.title,
    tagline:    s.tagline,
    path:       s.path,
    icon:       s.icon,
    category:   s.category,
    canonical:  url,
    og: {
      title:       s.title,
      description: s.tagline,
      url,
      image:       s.ogImage ? base + s.ogImage : base + "/opengraph.jpg",
      type:        "website",
      site_name:   "CreateAI Brain",
    },
    structuredData: {
      "@context":   "https://schema.org",
      "@type":      "WebPage",
      name:         s.title,
      description:  s.tagline,
      url,
      publisher: {
        "@type": "Organization",
        name:    "Lakeside Trinity LLC",
        url:     "https://createai.digital",
      },
    },
    sitemap: {
      priority:   s.priority,
      changefreq: s.changefreq,
    },
    sharePayload: {
      title: s.title,
      text:  s.tagline,
      url,
    },
  };
}

// ── GET /api/discovery/surfaces ───────────────────────────────────────────────

router.get("/surfaces", (_req: Request, res: Response) => {
  const base     = getCanonicalBaseUrl();
  const surfaces = getIndexableSurfaces().map(s => buildEnvelope(s, base));
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
  res.json({ ok: true, count: surfaces.length, surfaces });
});

// ── GET /api/discovery/surfaces/:id ──────────────────────────────────────────

router.get("/surfaces/:id", (req: Request, res: Response) => {
  const base    = getCanonicalBaseUrl();
  const surface = PUBLIC_SURFACES.find(s => s.id === req.params.id);
  if (!surface) { res.status(404).json({ ok: false, error: "Surface not found" }); return; }
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({ ok: true, surface: buildEnvelope(surface, base) });
});

// ── GET /api/discovery/agent-index ───────────────────────────────────────────
// Machine-readable, minimal — for agents to enumerate all surfaces.

router.get("/agent-index", (_req: Request, res: Response) => {
  const base = getCanonicalBaseUrl();
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    ok: true,
    platform: "CreateAI Brain",
    description: "AI operating system by Lakeside Trinity LLC. 365+ tools, 12 industry verticals, family hub, and broadcast network.",
    surfaces: getIndexableSurfaces().map(s => ({
      id:       s.id,
      title:    s.title,
      tagline:  s.tagline,
      url:      base + s.path,
      icon:     s.icon,
      category: s.category,
    })),
    agentCapabilities: [
      "Enumerate all public surfaces",
      "Route users to the correct surface by intent",
      "Generate share/invite payloads for any surface",
      "Describe any surface by id",
      "Surface invite/QR/broadcast options at key lifecycle events",
    ],
  });
});

// ── POST /api/discovery/refresh ───────────────────────────────────────────────
// Admin/founder only — trigger self-expansion loop: regen + broadcast.

router.post("/refresh", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const role = (req.user as { role?: string }).role ?? "user";
  if (!["admin", "founder"].includes(role)) { res.status(403).json({ error: "Forbidden" }); return; }

  const base     = getCanonicalBaseUrl();
  const surfaces = getIndexableSurfaces().map(s => buildEnvelope(s, base));

  // ── 1. Broadcast via GlobalPulse (SSE + RSS + webhooks) ──
  const broadcastPayload = {
    event:     "registry.refresh",
    message:   `Discovery index refreshed — ${surfaces.length} public surfaces now indexed.`,
    surfaceCount: surfaces.length,
    surfaces:  surfaces.map(s => ({ id: s.id, title: s.title, url: s.canonical })),
    ts:        new Date().toISOString(),
  };

  await broadcastGlobalPulse(broadcastPayload).catch(() => {});

  // ── 2. Fan-out via ExternalPulse (opt-in subscribers) ──
  await broadcastToSubscribers({
    event:   "discovery.refresh",
    payload: broadcastPayload,
  }).catch(() => {});

  res.json({
    ok:            true,
    surfaceCount:  surfaces.length,
    broadcast:     "GlobalPulse + ExternalPulse",
    message:       "Discovery refreshed and broadcast to all subscribers.",
  });
});

export default router;
