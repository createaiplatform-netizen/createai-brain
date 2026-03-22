/**
 * forgeFactory.ts
 *
 * Unified CRUD factory for all CreateAI "forge" content engines.
 * Each engine (characterforge, loreforge, mythweave, etc.) stores sessions
 * in a dedicated PostgreSQL table with an identical schema:
 *
 *   id · userId · engineId · engineName · topic · output
 *   title · tags · projectId · isStarred · createdAt
 *
 * Usage:
 *   import { makeForgeRouter } from "../lib/forgeFactory.js";
 *   import { characterforgeSessions } from "@workspace/db";
 *   export default makeForgeRouter(characterforgeSessions, "characterforge");
 */

import { Router, type Request, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, characterforgeSessions } from "@workspace/db";
import { logTractionEvent }           from "./tractionLogger.js";

// ─── Shared column shape (structural alias — all forge tables match this) ─────
export type ForgeTable = typeof characterforgeSessions;

// ─── Body type shared across all forge session inserts ────────────────────────
interface ForgeBody {
  engineId:   string;
  engineName: string;
  topic:      string;
  output:     string;
  title?:     string;
  tags?:      string;
  projectId?: string;
  isStarred?: boolean;
}

/**
 * makeForgeRouter
 *
 * @param table      — Drizzle PgTable for this forge type (structural ForgeTable)
 * @param forgeKey   — lowercase identifier used in traction events & logs
 *                    e.g. "characterforge", "loreforge", "mythweave"
 */
export function makeForgeRouter(table: ForgeTable, forgeKey: string): Router {
  const router = Router();
  const tag    = forgeKey;

  // ─── GET / ─────────────────────────────────────────────────────────────────
  router.get("/", async (req: Request, res: Response) => {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    try {
      const list = await db
        .select()
        .from(table)
        .where(eq(table.userId, req.user.id))
        .orderBy(desc(table.createdAt));
      res.json({ sessions: list });
    } catch (err) {
      console.error(`[${tag}] GET / error:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── GET /:id ──────────────────────────────────────────────────────────────
  router.get("/:id", async (req: Request, res: Response) => {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(String(req.params["id"] ?? ""));
    if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    try {
      const [row] = await db
        .select()
        .from(table)
        .where(and(eq(table.id, id), eq(table.userId, req.user.id)))
        .limit(1);
      if (!row) { res.status(404).json({ error: "Session not found" }); return; }
      res.json({ session: row });
    } catch (err) {
      console.error(`[${tag}] GET /:id error:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── POST / ────────────────────────────────────────────────────────────────
  router.post("/", async (req: Request, res: Response) => {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const {
      engineId, engineName, topic, output,
      title, tags, projectId, isStarred,
    } = req.body as ForgeBody;

    if (!engineId || !engineName || !topic || !output) {
      res.status(400).json({ error: "engineId, engineName, topic, and output are required" });
      return;
    }

    try {
      const [row] = await db
        .insert(table)
        .values({
          userId:    req.user.id,
          engineId,
          engineName,
          topic,
          output,
          title:     title     ?? null,
          tags:      tags      ?? null,
          projectId: projectId ?? null,
          isStarred: isStarred ?? false,
        })
        .returning();

      logTractionEvent({
        eventType:   `${tag}_session`,
        category:    "traction",
        subCategory: tag,
        userId:      req.user.id,
        metadata:    { engineId, engineName, topic: topic.slice(0, 80) },
      });

      res.status(201).json({ session: row });
    } catch (err) {
      console.error(`[${tag}] POST / error:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── PUT /:id ──────────────────────────────────────────────────────────────
  router.put("/:id", async (req: Request, res: Response) => {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(String(req.params["id"] ?? ""));
    if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const { title, tags, isStarred } = req.body as Partial<ForgeBody>;

    try {
      const [existing] = await db
        .select()
        .from(table)
        .where(and(eq(table.id, id), eq(table.userId, req.user.id)))
        .limit(1);
      if (!existing) { res.status(404).json({ error: "Session not found" }); return; }

      const updates: Partial<typeof table.$inferInsert> = {};
      if (title     !== undefined) updates.title     = title;
      if (tags      !== undefined) updates.tags      = tags;
      if (isStarred !== undefined) updates.isStarred = isStarred;

      const [updated] = await db
        .update(table)
        .set(updates)
        .where(and(eq(table.id, id), eq(table.userId, req.user.id)))
        .returning();

      res.json({ session: updated });
    } catch (err) {
      console.error(`[${tag}] PUT /:id error:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── DELETE /:id ───────────────────────────────────────────────────────────
  router.delete("/:id", async (req: Request, res: Response) => {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const id = Number(String(req.params["id"] ?? ""));
    if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    try {
      const [existing] = await db
        .select()
        .from(table)
        .where(and(eq(table.id, id), eq(table.userId, req.user.id)))
        .limit(1);
      if (!existing) { res.status(404).json({ error: "Session not found" }); return; }
      await db
        .delete(table)
        .where(and(eq(table.id, id), eq(table.userId, req.user.id)));
      res.json({ success: true });
    } catch (err) {
      console.error(`[${tag}] DELETE /:id error:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
