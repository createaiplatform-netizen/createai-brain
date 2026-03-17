import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const appId = req.query.appId as string | undefined;
    const conds = appId
      ? and(eq(conversations.userId, req.user.id), eq(conversations.appId, appId))
      : eq(conversations.userId, req.user.id);
    const list = await db
      .select()
      .from(conversations)
      .where(conds)
      .orderBy(desc(conversations.createdAt))
      .limit(50);
    res.json({ conversations: list });
  } catch (err) {
    console.error("GET /conversations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { title, appId } = req.body as { title?: string; appId?: string };
  try {
    const [conv] = await db.insert(conversations).values({
      userId: req.user.id,
      title: title?.trim() || "New Conversation",
      appId: appId || "chat",
    }).returning();
    res.json({ conversation: conv });
  } catch (err) {
    console.error("POST /conversations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/messages", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const convId = Number(req.params.id);
  try {
    const [conv] = await db.select().from(conversations)
      .where(and(eq(conversations.id, convId), eq(conversations.userId, req.user.id))).limit(1);
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    const msgs = await db.select().from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(messages.createdAt);
    res.json({ messages: msgs });
  } catch (err) {
    console.error("GET /conversations/:id/messages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/messages", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const convId = Number(req.params.id);
  const { role, content } = req.body as { role: string; content: string };
  if (!role || !content) { res.status(400).json({ error: "role and content required" }); return; }
  try {
    const [conv] = await db.select().from(conversations)
      .where(and(eq(conversations.id, convId), eq(conversations.userId, req.user.id))).limit(1);
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    const [msg] = await db.insert(messages).values({ conversationId: convId, role, content }).returning();
    res.json({ message: msg });
  } catch (err) {
    console.error("POST /conversations/:id/messages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const convId = Number(req.params.id);
  try {
    const [conv] = await db.select().from(conversations)
      .where(and(eq(conversations.id, convId), eq(conversations.userId, req.user.id))).limit(1);
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    await db.delete(messages).where(eq(messages.conversationId, convId));
    await db.delete(conversations).where(eq(conversations.id, convId));
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /conversations/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
