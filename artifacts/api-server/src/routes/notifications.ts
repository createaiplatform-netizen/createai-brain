import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, notifications } from "@workspace/db";
import { logTractionEvent } from "../lib/tractionLogger";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return req.user!.id;
}

// ─── GET /notifications ────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    const unreadCount = rows.filter(n => !n.read).length;
    res.json({ notifications: rows, unreadCount });
  } catch (err) {
    console.error("[notifications] GET /", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ─── POST /notifications ───────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { type = "info", title, body = "", appId, projectId, actionUrl } = req.body as {
      type?: string; title: string; body?: string;
      appId?: string; projectId?: string; actionUrl?: string;
    };
    if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }
    const [row] = await db.insert(notifications).values({
      userId, type, title: title.trim(), body, appId, projectId, actionUrl,
    }).returning();
    logTractionEvent({
      eventType:   "notification_triggered",
      category:    "retention",
      subCategory: type,
      userId,
      metadata:    { type, appId: appId ?? null, hasProject: !!projectId },
    });
    res.status(201).json({ notification: row });
  } catch (err) {
    console.error("[notifications] POST /", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// ─── PUT /notifications/:id/read ───────────────────────────────────────────
router.put("/:id/read", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[notifications] PUT /:id/read", err);
    res.status(500).json({ error: "Failed to mark notification read" });
  }
});

// ─── PUT /notifications/read-all ──────────────────────────────────────────
router.put("/read-all", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[notifications] PUT /read-all", err);
    res.status(500).json({ error: "Failed to mark all read" });
  }
});

// ─── DELETE /notifications/:id ────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    await db.delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[notifications] DELETE /:id", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// ─── DELETE /notifications (clear all) ────────────────────────────────────
router.delete("/", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    await db.delete(notifications).where(eq(notifications.userId, userId));
    res.json({ ok: true });
  } catch (err) {
    console.error("[notifications] DELETE /", err);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

export default router;
