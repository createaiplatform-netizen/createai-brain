import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, soundscapeSessions } from "@workspace/db";
import { logTractionEvent } from "../lib/tractionLogger";

const router = Router();

router.get("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const list = await db.select().from(soundscapeSessions)
      .where(eq(soundscapeSessions.userId, req.user.id))
      .orderBy(desc(soundscapeSessions.createdAt));
    res.json({ sessions: list });
  } catch (err) { console.error("GET /soundscape error:", err); res.status(500).json({ error: "Internal server error" }); }
});

router.get("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  try {
    const [row] = await db.select().from(soundscapeSessions)
      .where(and(eq(soundscapeSessions.id, id), eq(soundscapeSessions.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Session not found" }); return; }
    res.json({ session: row });
  } catch (err) { console.error("GET /soundscape/:id error:", err); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { engineId, engineName, topic, output, title, tags, projectId, isStarred } = req.body as {
    engineId: string; engineName: string; topic: string; output: string;
    title?: string; tags?: string; projectId?: string; isStarred?: boolean;
  };
  if (!engineId || !engineName || !topic || !output) { res.status(400).json({ error: "Missing required fields" }); return; }
  try {
    const [row] = await db.insert(soundscapeSessions).values({
      userId: req.user.id, engineId, engineName, topic, output,
      title: title ?? null, tags: tags ?? null, projectId: projectId ?? null, isStarred: isStarred ?? false,
    }).returning();
    logTractionEvent({ eventType: "soundscape_session", category: "traction", subCategory: "soundscape", userId: req.user.id, metadata: { engineId, engineName, topic: topic.slice(0, 80) } });
    res.status(201).json({ session: row });
  } catch (err) { console.error("POST /soundscape error:", err); res.status(500).json({ error: "Internal server error" }); }
});

router.put("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  const { title, tags, isStarred } = req.body as { title?: string; tags?: string; isStarred?: boolean };
  try {
    const [existing] = await db.select().from(soundscapeSessions)
      .where(and(eq(soundscapeSessions.id, id), eq(soundscapeSessions.userId, req.user.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Session not found" }); return; }
    const updates: Partial<typeof soundscapeSessions.$inferInsert> = {};
    if (title !== undefined) updates.title = title;
    if (tags !== undefined) updates.tags = tags;
    if (isStarred !== undefined) updates.isStarred = isStarred;
    const [updated] = await db.update(soundscapeSessions).set(updates)
      .where(and(eq(soundscapeSessions.id, id), eq(soundscapeSessions.userId, req.user.id))).returning();
    res.json({ session: updated });
  } catch (err) { console.error("PUT /soundscape/:id error:", err); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  try {
    const [existing] = await db.select().from(soundscapeSessions)
      .where(and(eq(soundscapeSessions.id, id), eq(soundscapeSessions.userId, req.user.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Session not found" }); return; }
    await db.delete(soundscapeSessions).where(eq(soundscapeSessions.id, id));
    res.json({ success: true });
  } catch (err) { console.error("DELETE /soundscape/:id error:", err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
