import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, integrations } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const list = await db.select().from(integrations)
      .where(eq(integrations.userId, req.user.id))
      .orderBy(integrations.name);
    res.json({ integrations: list });
  } catch (err) {
    console.error("GET /integrations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { name, type, category, webhookUrl, configJson, status: reqStatus, isEnabled } = req.body as {
    name: string; type: string; category?: string;
    webhookUrl?: string; configJson?: Record<string, unknown>;
    status?: string; isEnabled?: boolean;
  };
  if (!name || !type) { res.status(400).json({ error: "name and type required" }); return; }
  try {
    const [item] = await db.insert(integrations).values({
      userId: req.user.id, name, type,
      category: category || "General",
      status: reqStatus || "ready",
      webhookUrl: webhookUrl || null,
      configJson: configJson || null,
      isEnabled: isEnabled ?? false,
    }).returning();
    res.json({ integration: item });
  } catch (err) {
    console.error("POST /integrations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id);
  const { status, isEnabled, webhookUrl, configJson } = req.body as {
    status?: string; isEnabled?: boolean; webhookUrl?: string; configJson?: Record<string, unknown>;
  };
  try {
    const [row] = await db.select().from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Integration not found" }); return; }
    const [updated] = await db.update(integrations).set({
      ...(status !== undefined ? { status } : {}),
      ...(isEnabled !== undefined ? { isEnabled } : {}),
      ...(webhookUrl !== undefined ? { webhookUrl } : {}),
      ...(configJson !== undefined ? { configJson } : {}),
      updatedAt: new Date(),
    }).where(eq(integrations.id, id)).returning();
    res.json({ integration: updated });
  } catch (err) {
    console.error("PUT /integrations/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id);
  try {
    const [row] = await db.select().from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Integration not found" }); return; }
    await db.delete(integrations).where(eq(integrations.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /integrations/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
