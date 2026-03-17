import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, activityLog } from "@workspace/db";

const router = Router();

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
