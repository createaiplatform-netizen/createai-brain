import { Router } from "express";
import { db, documents, activityLog } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { OWNER_AUTHORIZATION_MANIFEST } from "../security/ownerAuthorizationManifest.js";

const router = Router();

// GET /api/security/records — list records for current user
router.get("/records", async (req, res) => {
  if (!req.isAuthenticated()) return void res.status(401).json({ error: "Unauthorized" });
  const userId = (req as any).user?.id as string;
  try {
    const records = await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.docType, "Security")))
      .orderBy(desc(documents.createdAt))
      .limit(100);
    res.json({ ok: true, records, count: records.length });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/security/records — create a record
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
      docType: "Security",
      tags: tags ?? "security",
    }).returning();
    await db.insert(activityLog).values({
      userId, action: "document_create",
      label: title.slice(0, 80), icon: "📄", appId: "security",
      meta: { recordId: record.id, suite: "security" },
    }).catch(() => {});
    res.json({ ok: true, record });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/security/records/:id
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

// DELETE /api/security/records/:id
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

// GET /api/security/stats
router.get("/stats", async (req, res) => {
  if (!req.isAuthenticated()) return void res.status(401).json({ error: "Unauthorized" });
  const userId = (req as any).user?.id as string;
  try {
    const records = await db.select().from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.docType, "Security")));
    res.json({ ok: true, suite: "security", totalRecords: records.length });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// ── GET /api/security/owner-auth ─────────────────────────────────────────────
// Public read — returns owner authorization status (no credentials stored here)

router.get("/owner-auth", (_req, res) => {
  const m = OWNER_AUTHORIZATION_MANIFEST;
  res.json({
    ts:     new Date().toISOString(),
    status: m.approvesUniversalBridgeEngine ? "ACTIVE" : "INACTIVE",
    manifest: {
      owner:                              m.owner,
      ownerId:                            m.ownerId,
      email:                              m.email,
      phone:                              m.phone,
      address:                            m.address,
      businessType:                       m.businessType,
      approvedAt:                         m.approvedAt,
      approvesUniversalBridgeEngine:      m.approvesUniversalBridgeEngine,
      approvesAllConnectors:              m.approvesAllConnectors,
      approvesAllAutomationFlows:         m.approvesAllAutomationFlows,
      approvesAllMonetizationFlows:       m.approvesAllMonetizationFlows,
      approvesAllCurrentAndFutureEngines: m.approvesAllCurrentAndFutureEngines,
      scope:                              m.scope,
      notes:                              m.notes,
    },
  });
});

export default router;
