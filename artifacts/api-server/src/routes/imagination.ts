import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, imaginationSessions } from "@workspace/db";
import { logTractionEvent } from "../lib/tractionLogger";

const router = Router();

// ─── GET /api/imagination ────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const list = await db.select().from(imaginationSessions)
      .where(eq(imaginationSessions.userId, req.user.id))
      .orderBy(desc(imaginationSessions.createdAt));
    res.json({ sessions: list });
  } catch (err) {
    console.error("GET /imagination error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/imagination/:id ─────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  try {
    const [row] = await db.select().from(imaginationSessions)
      .where(and(eq(imaginationSessions.id, id), eq(imaginationSessions.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Session not found" }); return; }
    res.json({ session: row });
  } catch (err) {
    console.error("GET /imagination/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/imagination ────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { engineId, engineName, topic, output, title, tags, projectId, isStarred } = req.body as {
    engineId: string; engineName: string; topic: string; output: string;
    title?: string; tags?: string; projectId?: string; isStarred?: boolean;
  };

  if (!engineId?.trim())  { res.status(400).json({ error: "engineId is required" }); return; }
  if (!topic?.trim())     { res.status(400).json({ error: "topic is required" }); return; }
  if (!output?.trim())    { res.status(400).json({ error: "output is required" }); return; }

  try {
    const [session] = await db.insert(imaginationSessions).values({
      userId:     req.user.id,
      engineId:   engineId.trim(),
      engineName: engineName?.trim() || engineId.trim(),
      topic:      topic.trim(),
      output:     output.trim(),
      title:      title?.trim() || null,
      tags:       tags?.trim() || null,
      projectId:  projectId?.trim() || null,
      isStarred:  isStarred ?? false,
    }).returning();

    logTractionEvent({
      eventType:   "imagination_session",
      category:    "traction",
      subCategory: "imagination",
      userId:      req.user.id,
      metadata:    { engineId, engineName, topic: topic.slice(0, 80) },
    });

    res.json({ session });
  } catch (err) {
    console.error("POST /imagination error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUT /api/imagination/:id ─────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  const { title, tags, projectId, isStarred } = req.body as {
    title?: string; tags?: string; projectId?: string; isStarred?: boolean;
  };

  try {
    const [row] = await db.select().from(imaginationSessions)
      .where(and(eq(imaginationSessions.id, id), eq(imaginationSessions.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Session not found" }); return; }

    const [updated] = await db.update(imaginationSessions).set({
      ...(title     !== undefined ? { title: title.trim() || null }         : {}),
      ...(tags      !== undefined ? { tags: tags.trim() || null }           : {}),
      ...(projectId !== undefined ? { projectId: projectId.trim() || null } : {}),
      ...(isStarred !== undefined ? { isStarred }                           : {}),
    }).where(eq(imaginationSessions.id, id)).returning();

    res.json({ session: updated });
  } catch (err) {
    console.error("PUT /imagination/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/imagination/:id ──────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  try {
    const [row] = await db.select().from(imaginationSessions)
      .where(and(eq(imaginationSessions.id, id), eq(imaginationSessions.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Session not found" }); return; }
    await db.delete(imaginationSessions).where(eq(imaginationSessions.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /imagination/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
