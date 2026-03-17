import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, loreforgeSessions } from "@workspace/db";
import { logTractionEvent } from "../lib/tractionLogger";

const router = Router();

// ─── GET /api/loreforge ──────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const list = await db.select().from(loreforgeSessions)
      .where(eq(loreforgeSessions.userId, req.user.id))
      .orderBy(desc(loreforgeSessions.createdAt));
    res.json({ sessions: list });
  } catch (err) {
    console.error("GET /loreforge error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/loreforge/:id ───────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  try {
    const [row] = await db.select().from(loreforgeSessions)
      .where(and(eq(loreforgeSessions.id, id), eq(loreforgeSessions.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Session not found" }); return; }
    res.json({ session: row });
  } catch (err) {
    console.error("GET /loreforge/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/loreforge ─────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { engineId, engineName, topic, output, title, tags, projectId, isStarred } = req.body as {
    engineId: string; engineName: string; topic: string; output: string;
    title?: string; tags?: string; projectId?: string; isStarred?: boolean;
  };
  if (!engineId || !engineName || !topic || !output) {
    res.status(400).json({ error: "engineId, engineName, topic, and output are required" });
    return;
  }
  try {
    const [row] = await db.insert(loreforgeSessions).values({
      userId: req.user.id, engineId, engineName, topic, output,
      title: title ?? null, tags: tags ?? null,
      projectId: projectId ?? null, isStarred: isStarred ?? false,
    }).returning();
    logTractionEvent({
      eventType:   "loreforge_session",
      category:    "traction",
      subCategory: "loreforge",
      userId:      req.user.id,
      metadata:    { engineId, engineName, topic: topic.slice(0, 80) },
    });
    res.status(201).json({ session: row });
  } catch (err) {
    console.error("POST /loreforge error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUT /api/loreforge/:id ───────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  const { title, tags, isStarred } = req.body as { title?: string; tags?: string; isStarred?: boolean };
  try {
    const [existing] = await db.select().from(loreforgeSessions)
      .where(and(eq(loreforgeSessions.id, id), eq(loreforgeSessions.userId, req.user.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Session not found" }); return; }
    const updates: Partial<typeof loreforgeSessions.$inferInsert> = {};
    if (title     !== undefined) updates.title     = title;
    if (tags      !== undefined) updates.tags      = tags;
    if (isStarred !== undefined) updates.isStarred = isStarred;
    const [updated] = await db.update(loreforgeSessions).set(updates)
      .where(and(eq(loreforgeSessions.id, id), eq(loreforgeSessions.userId, req.user.id))).returning();
    res.json({ session: updated });
  } catch (err) {
    console.error("PUT /loreforge/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/loreforge/:id ────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  try {
    const [existing] = await db.select().from(loreforgeSessions)
      .where(and(eq(loreforgeSessions.id, id), eq(loreforgeSessions.userId, req.user.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Session not found" }); return; }
    await db.delete(loreforgeSessions).where(eq(loreforgeSessions.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /loreforge/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
