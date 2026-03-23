/**
 * routes/appUsage.ts — App open event tracking
 * ─────────────────────────────────────────────
 * POST /api/app-usage        — Record an app open event (fire-and-forget friendly)
 * GET  /api/app-usage/top    — Top apps by open count (admin/founder only)
 * GET  /api/app-usage/mine   — Current user's top apps by open count
 */

import { Router, type Request, type Response } from "express";
import { db, activityLog }                     from "@workspace/db";
import { eq, desc, sql, and }                  from "drizzle-orm";

const router = Router();

// ─── POST /api/app-usage — log an app open ────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { appId, label, icon } = req.body as {
    appId?: string; label?: string; icon?: string;
  };

  if (!appId || typeof appId !== "string") {
    res.status(400).json({ error: "appId required" });
    return;
  }

  try {
    await db.insert(activityLog).values({
      userId:    req.user.id,
      action:    "app_open",
      label:     label ?? appId,
      icon:      icon  ?? "📱",
      appId,
    });
    res.json({ ok: true });
  } catch (err) {
    // Non-critical — don't surface to client
    console.warn("[appUsage] Insert failed (non-fatal):", (err as Error).message);
    res.json({ ok: false, note: "non-fatal" });
  }
});

// ─── GET /api/app-usage/top — platform-wide top apps (admin/founder) ─────────
router.get("/top", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const role = (req.user as { role?: string }).role ?? "user";
  const isPrivileged = ["admin", "founder"].includes(role);

  const limit = Math.min(Number(req.query.limit) || 20, 100);

  try {
    // Aggregate across all users (admin) or just self
    const rows = await db
      .select({
        appId: activityLog.appId,
        label: sql<string>`MAX(${activityLog.label})`,
        icon:  sql<string>`MAX(${activityLog.icon})`,
        opens: sql<number>`cast(count(*) as int)`,
        users: sql<number>`cast(count(distinct ${activityLog.userId}) as int)`,
      })
      .from(activityLog)
      .where(
        isPrivileged
          ? eq(activityLog.action, "app_open")
          : and(eq(activityLog.action, "app_open"), eq(activityLog.userId, req.user.id))
      )
      .groupBy(activityLog.appId)
      .orderBy(sql`count(*) desc`)
      .limit(limit);

    res.json({
      ok:    true,
      scope: isPrivileged ? "platform" : "user",
      top:   rows.filter(r => r.appId),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ─── GET /api/app-usage/mine — current user's personal top apps ───────────────
router.get("/mine", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const limit = Math.min(Number(req.query.limit) || 10, 50);

  try {
    const rows = await db
      .select({
        appId: activityLog.appId,
        label: sql<string>`MAX(${activityLog.label})`,
        icon:  sql<string>`MAX(${activityLog.icon})`,
        opens: sql<number>`cast(count(*) as int)`,
      })
      .from(activityLog)
      .where(and(
        eq(activityLog.action, "app_open"),
        eq(activityLog.userId, req.user.id),
      ))
      .groupBy(activityLog.appId)
      .orderBy(sql`count(*) desc`)
      .limit(limit);

    res.json({ ok: true, top: rows.filter(r => r.appId) });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
