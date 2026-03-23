/**
 * contextual.ts — Contextual, predictive, and relational surface engine
 * ──────────────────────────────────────────────────────────────────────
 * GET  /api/contextual/surfaces       → surfaces relevant to current route + role
 * GET  /api/contextual/predict        → predicted next surfaces from usage history
 * GET  /api/contextual/related/:id    → surfaces related to a given surface id
 * GET  /api/contextual/feed           → full ranked feed: contextual + predicted + related
 *
 * Consumes: publicSurfaces.ts registry + activityLog (behavioral data)
 * Emits:    nothing externally (read-only)
 */

import { Router, type Request, type Response } from "express";
import { PUBLIC_SURFACES, getIndexableSurfaces } from "../config/publicSurfaces.js";
import { db, activityLog }  from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { getCanonicalBaseUrl } from "../utils/publicUrl.js";

const router = Router();

// ── Category relationship map — determines "related" surfaces ─────────────────
const RELATED: Record<string, string[]> = {
  platform:  ["tool", "invite", "broadcast"],
  tool:      ["platform", "hub", "invite"],
  invite:    ["platform", "broadcast"],
  broadcast: ["platform", "invite"],
  hub:       ["platform", "tool"],
};

function surfaceUrl(path: string, base: string) {
  return path.startsWith("http") ? path : base + path;
}

// ── GET /api/contextual/surfaces — route + role aware ────────────────────────

router.get("/surfaces", async (req: Request, res: Response) => {
  const route  = (req.query.route  as string) ?? "/";
  const role   = (req.query.role   as string) ?? (req.user ? (req.user as { role?: string }).role ?? "user" : "public");
  const limit  = Math.min(Number(req.query.limit) || 8, 20);
  const base   = getCanonicalBaseUrl();

  const surfaces = getIndexableSurfaces();

  // Score each surface by relevance to current route + role
  const scored = surfaces.map(s => {
    let score = 0;
    if (s.path === route || route.startsWith(s.path) && s.path !== "/") score += 10;
    if (route.startsWith("/for/") && s.category === "tool") score += 5;
    if (route === "/broadcast" && s.category === "broadcast") score += 8;
    if (route === "/discover"  && s.category === "platform")  score += 6;
    if (role === "founder" || role === "admin") score += (s.category === "platform" ? 2 : 0);
    if (role === "customer") score += (s.category === "tool" ? 3 : 0);
    if (s.category === "invite") score += 2; // always surface invite options
    return { surface: s, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ surface: s }) => ({
      id:       s.id,
      title:    s.title,
      tagline:  s.tagline,
      url:      surfaceUrl(s.path, base),
      icon:     s.icon,
      category: s.category,
    }));

  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({ ok: true, route, role, count: scored.length, surfaces: scored });
});

// ── GET /api/contextual/predict — behavioral prediction from usage history ────

router.get("/predict", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 5, 20);
  const base  = getCanonicalBaseUrl();

  if (!req.user) {
    // Unauthenticated: return featured/invite surfaces
    const featured = getIndexableSurfaces()
      .filter(s => ["invite", "broadcast", "platform"].includes(s.category))
      .slice(0, limit)
      .map(s => ({ id: s.id, title: s.title, tagline: s.tagline, url: surfaceUrl(s.path, base), icon: s.icon, predicted: false }));
    res.json({ ok: true, authenticated: false, surfaces: featured });
    return;
  }

  try {
    // Get user's top apps from activityLog
    const topApps = await db
      .select({
        appId: activityLog.appId,
        label: sql<string>`MAX(${activityLog.label})`,
        opens: sql<number>`cast(count(*) as int)`,
      })
      .from(activityLog)
      .where(and(eq(activityLog.action, "app_open"), eq(activityLog.userId, req.user.id)))
      .groupBy(activityLog.appId)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const usedAppIds = new Set(topApps.map(a => a.appId).filter(Boolean));
    const all = getIndexableSurfaces();

    // Predict: surfaces the user hasn't visited yet, ranked by category match
    const predicted = all
      .filter(s => !usedAppIds.has(s.id))
      .slice(0, limit)
      .map(s => ({
        id:        s.id,
        title:     s.title,
        tagline:   s.tagline,
        url:       surfaceUrl(s.path, base),
        icon:      s.icon,
        category:  s.category,
        predicted: true,
      }));

    res.json({ ok: true, authenticated: true, usageCount: topApps.length, surfaces: predicted });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ── GET /api/contextual/related/:id — surfaces related to a given one ─────────

router.get("/related/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const base   = getCanonicalBaseUrl();
  const limit  = Math.min(Number(req.query.limit) || 4, 10);

  const source = PUBLIC_SURFACES.find(s => s.id === id);
  if (!source) { res.status(404).json({ ok: false, error: "Surface not found" }); return; }

  const allowedCategories = RELATED[source.category] ?? [];
  const related = getIndexableSurfaces()
    .filter(s => s.id !== id && allowedCategories.includes(s.category))
    .slice(0, limit)
    .map(s => ({ id: s.id, title: s.title, tagline: s.tagline, url: surfaceUrl(s.path, base), icon: s.icon }));

  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({ ok: true, sourceId: id, count: related.length, related });
});

// ── GET /api/contextual/feed — full ranked feed ───────────────────────────────

router.get("/feed", async (req: Request, res: Response) => {
  const route = (req.query.route as string) ?? "/";
  const base  = getCanonicalBaseUrl();

  const all = getIndexableSurfaces().map(s => ({
    id:       s.id,
    title:    s.title,
    tagline:  s.tagline,
    url:      surfaceUrl(s.path, base),
    icon:     s.icon,
    category: s.category,
    priority: parseFloat(s.priority),
    // Boost contextually relevant surfaces
    contextScore: (s.path === route || route.startsWith(s.path) && s.path !== "/") ? 2 : 1,
  }))
    .sort((a, b) => (b.priority * b.contextScore) - (a.priority * a.contextScore));

  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({ ok: true, route, count: all.length, feed: all });
});

export default router;
