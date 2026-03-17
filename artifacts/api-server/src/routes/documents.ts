import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and, or } from "drizzle-orm";
import { db, documents } from "@workspace/db";
import { logTractionEvent } from "../lib/tractionLogger";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return req.user!.id;
}

function formatDoc(d: typeof documents.$inferSelect) {
  return {
    ...d,
    id: d.id.toString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

// ─── GET /documents ────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const projectId = req.query.projectId as string | undefined;
    const rows = await db
      .select()
      .from(documents)
      .where(
        projectId
          ? and(eq(documents.userId, userId), eq(documents.projectId, projectId))
          : eq(documents.userId, userId)
      )
      .orderBy(desc(documents.updatedAt));
    res.json({ documents: rows.map(formatDoc) });
  } catch (err) {
    console.error("[documents] GET /", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// ─── POST /documents ───────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { title, body = "", docType = "Note", tags = "", projectId, isTemplate = false } = req.body as {
      title: string; body?: string; docType?: string;
      tags?: string; projectId?: string; isTemplate?: boolean;
    };
    if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }
    const [row] = await db.insert(documents).values({
      userId, title: title.trim(), body, docType, tags,
      projectId: projectId ?? null, isTemplate,
    }).returning();
    logTractionEvent({
      eventType:   "document_created",
      category:    "retention",
      subCategory: docType,
      userId,
      metadata:    { title: title.trim(), docType, hasProject: !!projectId, isTemplate },
    });
    res.status(201).json({ document: formatDoc(row) });
  } catch (err) {
    console.error("[documents] POST /", err);
    res.status(500).json({ error: "Failed to create document" });
  }
});

// ─── GET /documents/:id ────────────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [row] = await db.select().from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    if (!row) { res.status(404).json({ error: "Document not found" }); return; }
    res.json({ document: formatDoc(row) });
  } catch (err) {
    console.error("[documents] GET /:id", err);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// ─── PUT /documents/:id ────────────────────────────────────────────────────
router.put("/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [existing] = await db.select().from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    if (!existing) { res.status(404).json({ error: "Document not found" }); return; }
    const { title, body, docType, tags, projectId, isTemplate, isPinned } = req.body as {
      title?: string; body?: string; docType?: string; tags?: string;
      projectId?: string | null; isTemplate?: boolean; isPinned?: boolean;
    };
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title.trim();
    if (body !== undefined) updates.body = body;
    if (docType !== undefined) updates.docType = docType;
    if (tags !== undefined) updates.tags = tags;
    if (projectId !== undefined) updates.projectId = projectId;
    if (isTemplate !== undefined) updates.isTemplate = isTemplate;
    if (isPinned !== undefined) updates.isPinned = isPinned;
    const [row] = await db.update(documents).set(updates)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning();
    res.json({ document: formatDoc(row) });
  } catch (err) {
    console.error("[documents] PUT /:id", err);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// ─── DELETE /documents/:id ─────────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [existing] = await db.select().from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    if (!existing) { res.status(404).json({ error: "Document not found" }); return; }
    await db.delete(documents).where(eq(documents.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error("[documents] DELETE /:id", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
