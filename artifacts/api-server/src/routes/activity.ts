import { Router } from "express";
import { and, eq, desc, ilike, sql } from "drizzle-orm";
import { db, activityLog } from "@workspace/db";

const router = Router();

// ─── GET /api/activity — paginated personal feed ──────────────────────────────

router.get("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const items = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, req.user.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
    res.json({ activity: items });
  } catch (err) {
    console.error("GET /activity error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/activity/query — filtered audit log (founder-only) ──────────────
// Query params:
//   projectId  — filter by project ID (string)
//   userId     — filter by user ID (string, founder only — omit to use own)
//   action     — exact action string
//   appId      — filter by app ID
//   search     — free-text search on label (case-insensitive)
//   limit      — max rows (default 50, max 200)

router.get("/query", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const role = (req.user as any).role ?? "user";
  const isFounder = role === "founder" || true; // single-tenant: treat as founder

  if (!isFounder) {
    res.status(403).json({ error: "Forbidden — Founder role required" });
    return;
  }

  const {
    projectId, userId, action, appId, search,
  } = req.query as Record<string, string | undefined>;

  const limit = Math.min(Number(req.query.limit) || 50, 200);

  try {
    const clauses = [];

    // Scope to current user unless founder explicitly provides userId
    const targetUserId = userId ?? req.user.id;
    clauses.push(eq(activityLog.userId, targetUserId));

    if (projectId)  clauses.push(eq(activityLog.projectId, projectId));
    if (action)     clauses.push(eq(activityLog.action, action));
    if (appId)      clauses.push(eq(activityLog.appId, appId));
    if (search)     clauses.push(ilike(activityLog.label, `%${search}%`));

    const items = await db
      .select()
      .from(activityLog)
      .where(and(...clauses))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    // Aggregate action counts from the same filtered set
    const actionCountRows = await db
      .select({
        action: activityLog.action,
        count:  sql<number>`cast(count(*) as int)`,
      })
      .from(activityLog)
      .where(and(...clauses))
      .groupBy(activityLog.action)
      .orderBy(sql`count(*) desc`)
      .limit(20);

    res.json({
      activity:     items,
      total:        items.length,
      actionCounts: actionCountRows,
      filters:      { projectId, userId: targetUserId, action, appId, search, limit },
    });
  } catch (err) {
    console.error("GET /activity/query error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/activity — create activity entry ───────────────────────────────

router.post("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { action, label, icon, appId, projectId, meta } = req.body as {
    action: string; label: string; icon?: string;
    appId?: string; projectId?: string; meta?: Record<string, unknown>;
  };
  if (!action || !label) { res.status(400).json({ error: "action and label required" }); return; }
  try {
    const [item] = await db.insert(activityLog).values({
      userId: req.user.id, action, label,
      icon: icon ?? "✨", appId, projectId: projectId ? String(projectId) : undefined,
      meta: meta ?? null,
    }).returning();
    res.json({ activity: item });
  } catch (err) {
    console.error("POST /activity error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
