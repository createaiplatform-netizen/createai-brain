// ─── Life Events (Civic, Health, School, Work) ────────────────────────────────
// Helps users track important dates and tasks: elections, renewals, appointments,
// deadlines. Plain-language, always links to official sources.
// Platform organizes and reminds — never replaces official systems.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

const VALID_CATEGORIES = ["civic", "health", "school", "work", "personal", "finance"];

// GET /api/life-events?category=civic&upcoming=true
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { category, upcoming } = req.query as { category?: string; upcoming?: string };
  const sql = getSql();

  const events = await sql`
    SELECT * FROM platform_life_events
    WHERE user_id = ${userId}
      ${category ? sql`AND category = ${category}` : sql``}
      ${upcoming === "true" ? sql`AND (event_date >= CURRENT_DATE OR event_date IS NULL) AND completed = FALSE` : sql``}
    ORDER BY
      CASE WHEN event_date IS NULL THEN 1 ELSE 0 END,
      event_date ASC,
      created_at DESC
  `;
  res.json({ events });
});

// POST /api/life-events
router.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { category, title, description, eventDate, officialUrl, notes } = req.body as {
    category?: string;
    title?: string;
    description?: string;
    eventDate?: string;
    officialUrl?: string;
    notes?: string;
  };

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const cat = VALID_CATEGORIES.includes(category ?? "") ? category! : "personal";
  const sql = getSql();

  const [event] = await sql`
    INSERT INTO platform_life_events
      (user_id, category, title, description, event_date, official_url, notes)
    VALUES
      (${userId}, ${cat}, ${title.trim()},
       ${description?.trim() ?? null},
       ${eventDate ? new Date(eventDate) : null},
       ${officialUrl?.trim() ?? null},
       ${notes?.trim() ?? null})
    RETURNING *
  `;
  res.json({ event });
});

// PATCH /api/life-events/:id
router.patch("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const { title, description, eventDate, officialUrl, notes, completed, category } = req.body as {
    title?: string;
    description?: string;
    eventDate?: string;
    officialUrl?: string;
    notes?: string;
    completed?: boolean;
    category?: string;
  };

  const sql = getSql();
  const [existing] = await sql`SELECT * FROM platform_life_events WHERE id = ${id} AND user_id = ${userId}`;
  if (!existing) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const [updated] = await sql`
    UPDATE platform_life_events SET
      category    = ${VALID_CATEGORIES.includes(category ?? "") ? category! : existing.category},
      title       = ${title?.trim() ?? existing.title},
      description = ${description?.trim() ?? existing.description},
      event_date  = ${eventDate ? new Date(eventDate) : existing.event_date},
      official_url= ${officialUrl?.trim() ?? existing.official_url},
      notes       = ${notes?.trim() ?? existing.notes},
      completed   = ${completed ?? existing.completed},
      updated_at  = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  res.json({ event: updated });
});

// DELETE /api/life-events/:id
router.delete("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const sql = getSql();
  await sql`DELETE FROM platform_life_events WHERE id = ${id} AND user_id = ${userId}`;
  res.json({ success: true });
});

// GET /api/life-events/upcoming-summary — quick summary for dashboard widgets
router.get("/upcoming-summary", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ upcoming: 0, overdue: 0 });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();
  const [row] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE event_date >= CURRENT_DATE AND completed = FALSE) AS upcoming,
      COUNT(*) FILTER (WHERE event_date < CURRENT_DATE AND completed = FALSE)  AS overdue
    FROM platform_life_events WHERE user_id = ${userId}
  `;
  res.json({ upcoming: Number(row?.upcoming ?? 0), overdue: Number(row?.overdue ?? 0) });
});

export default router;
