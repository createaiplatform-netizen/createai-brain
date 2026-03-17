import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, opportunities } from "@workspace/db";
import { logTractionEvent } from "../lib/tractionLogger";

const router = Router();

// ─── GET /api/opportunities ──────────────────────────────────────────────────
router.get("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const list = await db.select().from(opportunities)
      .where(eq(opportunities.userId, req.user.id))
      .orderBy(desc(opportunities.updatedAt));
    res.json({ opportunities: list });
  } catch (err) {
    console.error("GET /opportunities error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/opportunities/stats ────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const list = await db.select().from(opportunities)
      .where(eq(opportunities.userId, req.user.id));

    const total        = list.length;
    const won          = list.filter(o => o.status === "Won").length;
    const inProgress   = list.filter(o => o.status === "In Progress").length;
    const newCount     = list.filter(o => o.status === "New").length;
    const validated    = list.filter(o => o.status === "Validated").length;
    const avgScore     = total > 0
      ? Math.round(list.reduce((s, o) => s + (o.score ?? 0), 0) / total)
      : 0;
    const starred      = list.filter(o => o.isStarred).length;
    const highPriority = list.filter(o => o.priority === "High" || o.priority === "Critical").length;
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const o of list) {
      byType[o.type]     = (byType[o.type] ?? 0) + 1;
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    }

    res.json({ total, won, inProgress, newCount, validated, avgScore, starred, highPriority, byType, byStatus });
  } catch (err) {
    console.error("GET /opportunities/stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/opportunities/:id ──────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  try {
    const [row] = await db.select().from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Opportunity not found" }); return; }
    res.json({ opportunity: row });
  } catch (err) {
    console.error("GET /opportunities/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/opportunities ─────────────────────────────────────────────────
router.post("/", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const {
    title, description, type, status, priority, score, market,
    estimatedValue, confidence, source, notes, tags, dueDate,
    assignedTo, projectId, isStarred,
  } = req.body as {
    title: string; description?: string; type?: string; status?: string;
    priority?: string; score?: number; market?: string; estimatedValue?: string;
    confidence?: string; source?: string; notes?: string; tags?: string;
    dueDate?: string; assignedTo?: string; projectId?: string; isStarred?: boolean;
  };

  if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }

  try {
    const [opp] = await db.insert(opportunities).values({
      userId:         req.user.id,
      title:          title.trim(),
      description:    description?.trim() || null,
      type:           type || "Market",
      status:         status || "New",
      priority:       priority || "Medium",
      score:          score ?? 0,
      market:         market?.trim() || null,
      estimatedValue: estimatedValue?.trim() || null,
      confidence:     confidence || "Medium",
      source:         source?.trim() || null,
      notes:          notes?.trim() || null,
      tags:           tags?.trim() || null,
      dueDate:        dueDate?.trim() || null,
      assignedTo:     assignedTo?.trim() || null,
      projectId:      projectId?.trim() || null,
      isStarred:      isStarred ?? false,
    }).returning();

    logTractionEvent({
      eventType:   "opportunity_created",
      category:    "traction",
      subCategory: "opportunity",
      userId:      req.user.id,
      metadata:    { title, type: type || "Market", priority: priority || "Medium" },
    });

    res.json({ opportunity: opp });
  } catch (err) {
    console.error("POST /opportunities error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUT /api/opportunities/:id ──────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  const {
    title, description, type, status, priority, score, market,
    estimatedValue, confidence, source, aiInsight, notes, tags,
    dueDate, assignedTo, projectId, isStarred,
  } = req.body as {
    title?: string; description?: string; type?: string; status?: string;
    priority?: string; score?: number; market?: string; estimatedValue?: string;
    confidence?: string; source?: string; aiInsight?: string; notes?: string;
    tags?: string; dueDate?: string; assignedTo?: string; projectId?: string; isStarred?: boolean;
  };

  try {
    const [row] = await db.select().from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Opportunity not found" }); return; }

    const [updated] = await db.update(opportunities).set({
      ...(title          !== undefined ? { title: title.trim() }               : {}),
      ...(description    !== undefined ? { description: description.trim() || null } : {}),
      ...(type           !== undefined ? { type }                               : {}),
      ...(status         !== undefined ? { status }                             : {}),
      ...(priority       !== undefined ? { priority }                           : {}),
      ...(score          !== undefined ? { score }                              : {}),
      ...(market         !== undefined ? { market: market.trim() || null }      : {}),
      ...(estimatedValue !== undefined ? { estimatedValue: estimatedValue.trim() || null } : {}),
      ...(confidence     !== undefined ? { confidence }                         : {}),
      ...(source         !== undefined ? { source: source.trim() || null }      : {}),
      ...(aiInsight      !== undefined ? { aiInsight: aiInsight.trim() || null }: {}),
      ...(notes          !== undefined ? { notes: notes.trim() || null }        : {}),
      ...(tags           !== undefined ? { tags: tags.trim() || null }          : {}),
      ...(dueDate        !== undefined ? { dueDate: dueDate.trim() || null }    : {}),
      ...(assignedTo     !== undefined ? { assignedTo: assignedTo.trim() || null } : {}),
      ...(projectId      !== undefined ? { projectId: projectId.trim() || null }: {}),
      ...(isStarred      !== undefined ? { isStarred }                          : {}),
      updatedAt: new Date(),
    }).where(eq(opportunities.id, id)).returning();

    res.json({ opportunity: updated });
  } catch (err) {
    console.error("PUT /opportunities/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/opportunities/:id ───────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = Number(req.params.id as string);
  try {
    const [row] = await db.select().from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, req.user.id))).limit(1);
    if (!row) { res.status(404).json({ error: "Opportunity not found" }); return; }
    await db.delete(opportunities).where(eq(opportunities.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /opportunities/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
