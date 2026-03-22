// ─── Private Journal ─────────────────────────────────────────────────────────
// Personal reflection space. Entries are private by default.
// Never exposed to others without explicit consent. No comparisons, no sharing pressure.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

const VALID_MOODS = ["wonderful", "good", "okay", "tired", "hard", "grateful", "unsure"];

// GET /api/journal?limit=20&offset=0&startDate=&endDate=
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const offset = Number(req.query.offset ?? 0);
  const sql = getSql();

  const entries = await sql`
    SELECT * FROM platform_journal_entries
    WHERE user_id = ${userId}
    ORDER BY entry_date DESC, created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [countRow] = await sql`
    SELECT COUNT(*)::int AS total FROM platform_journal_entries WHERE user_id = ${userId}
  `;

  res.json({ entries, total: countRow?.total ?? 0 });
});

// GET /api/journal/:id — single entry
router.get("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const sql = getSql();
  const [entry] = await sql`
    SELECT * FROM platform_journal_entries WHERE id = ${id} AND user_id = ${userId}
  `;
  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json({ entry });
});

// POST /api/journal
router.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { title, content, mood, entryDate, isPrivate } = req.body as {
    title?: string;
    content?: string;
    mood?: string;
    entryDate?: string;
    isPrivate?: boolean;
  };

  if (!content?.trim() && !title?.trim()) {
    res.status(400).json({ error: "Title or content is required" });
    return;
  }

  const sql = getSql();
  const [entry] = await sql`
    INSERT INTO platform_journal_entries
      (user_id, title, content, mood, entry_date, is_private)
    VALUES
      (${userId}, ${title?.trim() ?? ""}, ${content?.trim() ?? ""},
       ${VALID_MOODS.includes(mood ?? "") ? mood! : null},
       ${entryDate ? new Date(entryDate) : new Date()},
       ${isPrivate !== false})
    RETURNING *
  `;
  res.json({ entry });
});

// PATCH /api/journal/:id
router.patch("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const { title, content, mood, entryDate } = req.body as {
    title?: string;
    content?: string;
    mood?: string;
    entryDate?: string;
  };
  const sql = getSql();
  const [existing] = await sql`
    SELECT * FROM platform_journal_entries WHERE id = ${id} AND user_id = ${userId}
  `;
  if (!existing) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  const [updated] = await sql`
    UPDATE platform_journal_entries SET
      title      = ${title?.trim() ?? existing.title},
      content    = ${content?.trim() ?? existing.content},
      mood       = ${VALID_MOODS.includes(mood ?? "") ? mood! : existing.mood},
      entry_date = ${entryDate ? new Date(entryDate) : existing.entry_date},
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  res.json({ entry: updated });
});

// DELETE /api/journal/:id — users control their own data
router.delete("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const sql = getSql();
  await sql`DELETE FROM platform_journal_entries WHERE id = ${id} AND user_id = ${userId}`;
  res.json({ success: true });
});

export default router;
