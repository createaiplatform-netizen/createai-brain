import { Router } from "express";
import { db, documents, activityLog } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// GET /api/operations/records — list records for current user
router.get("/records", async (req, res) => {
  if (!req.isAuthenticated()) return void res.status(401).json({ error: "Unauthorized" });
  const userId = (req as any).user?.id as string;
  try {
    const records = await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.docType, "Operations")))
      .orderBy(desc(documents.createdAt))
      .limit(100);
    res.json({ ok: true, records, count: records.length });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/operations/records — create a record
router.post("/records", async (req, res) => {
  if (!req.isAuthenticated()) return void res.status(401).json({ error: "Unauthorized" });
  const userId = (req as any).user?.id as string;
  const { title, body, tags } = req.body as { title?: string; body?: string; tags?: string };
  if (!title) return void res.status(400).json({ error: "title required" });
  try {
    const [record] = await db.insert(documents).values({
      userId,
      title: title.slice(0, 200),
      body: body ?? "",
      docType: "Operations",
      tags: tags ?? "operations",
    }).returning();
    await db.insert(activityLog).values({
      userId, action: "document_create",
      label: title.slice(0, 80), icon: "📄", appId: "operations",
      meta: { recordId: record.id, suite: "operations" },
    }).catch(() => {});
    res.json({ ok: true, record });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/operations/records/:id
router.get("/records/:id", async (req, res) => {
  if (!req.isAuthenticated()) return void res.status(401).json({ error: "Unauthorized" });
  const userId = (req as any).user?.id as string;
  const id = parseInt(req.params.id as string, 10);
  try {
    const [record] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!record || record.userId !== userId) return void res.status(404).json({ error: "Not found" });
    res.json({ ok: true, record });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE /api/operations/records/:id
router.delete("/records/:id", async (req, res) => {
  if (!req.isAuthenticated()) return void res.status(401).json({ error: "Unauthorized" });
  const userId = (req as any).user?.id as string;
  const id = parseInt(req.params.id as string, 10);
  try {
    const [record] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!record || record.userId !== userId) return void res.status(404).json({ error: "Not found" });
    await db.delete(documents).where(eq(documents.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/operations/stats
router.get("/stats", async (req, res) => {
  if (!req.isAuthenticated()) return void res.status(401).json({ error: "Unauthorized" });
  const userId = (req as any).user?.id as string;
  try {
    const records = await db.select().from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.docType, "Operations")));
    res.json({ ok: true, suite: "operations", totalRecords: records.length });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
