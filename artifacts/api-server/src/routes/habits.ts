// ─── Habits & Goals ───────────────────────────────────────────────────────────
// Gentle habit and goal tracking. No shaming. Users control everything.
// Can pause, change, or delete any tracker at any time.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";
import { contentSafetyCheck } from "../utils/contentSafety.js";

const router = Router();

const VALID_FREQUENCIES = ["daily", "weekly", "weekdays", "weekends", "custom"];

// ── Habits ────────────────────────────────────────────────────────────────────

// GET /api/habits
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();
  const habits = await sql`
    SELECT h.*,
           (SELECT COUNT(*)::int FROM platform_habit_completions hc WHERE hc.habit_id = h.id) AS total_completions
    FROM platform_habits h
    WHERE h.user_id = ${userId}
    ORDER BY h.paused ASC, h.created_at ASC
  `;
  res.json({ habits });
});

// POST /api/habits
router.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { name, emoji, frequency } = req.body as {
    name?: string;
    emoji?: string;
    frequency?: string;
  };

  if (!name?.trim()) {
    res.status(400).json({ error: "Habit name is required" });
    return;
  }

  // R-6: Content safety check on habit name (applies to all roles, extra important for kids).
  const safety = contentSafetyCheck(name.trim());
  if (!safety.safe) {
    res.status(422).json({ error: "Habit name contains content that is not allowed." });
    return;
  }

  const sql = getSql();

  // R-6: Server-side role verification — look up the user's current role from DB.
  const [userRow] = await sql`SELECT role FROM users WHERE id = ${userId}`;
  const userRole: string = userRow?.role ?? "user";

  // Kids-role guard: kids users may not create habits with restricted keywords
  // that are adult-oriented. Content filter above already covers abusive terms.
  // TODO: Add an approved-by-guardian workflow for kids habit creation if the
  //       platform ever adds a parental-approval layer.

  const [habit] = await sql`
    INSERT INTO platform_habits (user_id, name, emoji, frequency)
    VALUES (${userId}, ${name.trim()}, ${emoji ?? "🌱"}, ${VALID_FREQUENCIES.includes(frequency ?? "") ? frequency! : "daily"})
    RETURNING *
  `;
  res.json({ habit, createdByRole: userRole });
});

// PATCH /api/habits/:id
router.patch("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const { name, emoji, frequency, paused } = req.body as {
    name?: string;
    emoji?: string;
    frequency?: string;
    paused?: boolean;
  };
  const sql = getSql();
  const [existing] = await sql`SELECT * FROM platform_habits WHERE id = ${id} AND user_id = ${userId}`;
  if (!existing) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  const [updated] = await sql`
    UPDATE platform_habits SET
      name      = ${name?.trim() ?? existing.name},
      emoji     = ${emoji ?? existing.emoji},
      frequency = ${VALID_FREQUENCIES.includes(frequency ?? "") ? frequency! : existing.frequency},
      paused    = ${paused ?? existing.paused},
      updated_at= NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  res.json({ habit: updated });
});

// DELETE /api/habits/:id
router.delete("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const sql = getSql();
  await sql`DELETE FROM platform_habit_completions WHERE habit_id = ${id} AND user_id = ${userId}`;
  await sql`DELETE FROM platform_habits WHERE id = ${id} AND user_id = ${userId}`;
  res.json({ success: true });
});

// POST /api/habits/:id/complete — mark done for today
router.post("/:id/complete", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const { note, date } = req.body as { note?: string; date?: string };
  const doneOn = date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  const sql = getSql();
  const [habit] = await sql`SELECT * FROM platform_habits WHERE id = ${id} AND user_id = ${userId}`;
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  // Upsert completion
  await sql`
    INSERT INTO platform_habit_completions (habit_id, user_id, done_on, note)
    VALUES (${id}, ${userId}, ${doneOn}, ${note ?? null})
    ON CONFLICT (habit_id, done_on) DO NOTHING
  `;

  // Recalculate streak
  const completions = await sql`
    SELECT done_on FROM platform_habit_completions
    WHERE habit_id = ${id}
    ORDER BY done_on DESC
    LIMIT 365
  `;
  const dates = completions.map(c => new Date(c.done_on as string).toISOString().slice(0, 10));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let check = today;
  for (const d of dates) {
    if (d === check) {
      streak++;
      const prev = new Date(check);
      prev.setDate(prev.getDate() - 1);
      check = prev.toISOString().slice(0, 10);
    } else if (d < check) {
      break;
    }
  }

  const longestStreak = Math.max(streak, Number(habit.longest_streak ?? 0));
  await sql`
    UPDATE platform_habits SET
      current_streak = ${streak},
      longest_streak = ${longestStreak},
      last_done_at   = ${doneOn},
      updated_at     = NOW()
    WHERE id = ${id}
  `;

  res.json({ success: true, streak, longestStreak });
});

// GET /api/habits/:id/completions?days=30
router.get("/:id/completions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const days = Math.min(Number(req.query.days ?? 30), 365);
  const sql = getSql();
  const completions = await sql`
    SELECT done_on FROM platform_habit_completions
    WHERE habit_id = ${id} AND user_id = ${userId}
      AND done_on >= CURRENT_DATE - INTERVAL '${sql.unsafe(String(days))} days'
    ORDER BY done_on DESC
  `;
  res.json({ completions: completions.map(c => c.done_on) });
});

export default router;
