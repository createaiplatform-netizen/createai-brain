// ─── Habits & Goals ───────────────────────────────────────────────────────────
// Gentle habit and goal tracking. No shaming. Users control everything.
// Guardian approval: kids' completions require adult sign-off before counting.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db.js";
import { contentSafetyCheck } from "../utils/contentSafety.js";
import { outboundEngine } from "../services/outboundEngine.js";

const router = Router();

const VALID_FREQUENCIES = ["daily", "weekly", "weekdays", "weekends", "custom"];
const ADULT_ROLES       = new Set(["family_adult", "founder", "admin", "user"]);
const CHILD_ROLE        = "family_child";

function isAdult(role: string) { return ADULT_ROLES.has(role); }

// ── Streak recalculator (approved completions only) ───────────────────────────
async function recalcStreak(habitId: string): Promise<{ streak: number; longest: number }> {
  const sql = getSql();
  const completions = await sql`
    SELECT done_on FROM platform_habit_completions
    WHERE habit_id = ${habitId} AND approval_status = 'approved'
    ORDER BY done_on DESC
    LIMIT 365
  `;
  const dates = completions.map(c => new Date(c.done_on as string).toISOString().slice(0, 10));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let check   = today;
  for (const d of dates) {
    if (d === check) {
      streak++;
      const prev = new Date(check);
      prev.setDate(prev.getDate() - 1);
      check = prev.toISOString().slice(0, 10);
    } else if (d < check) break;
  }
  const [row] = await sql`SELECT longest_streak FROM platform_habits WHERE id = ${habitId}`;
  const longest = Math.max(streak, Number(row?.longest_streak ?? 0));
  return { streak, longest };
}

// ── GET /api/habits ───────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = (req.user as { id: string }).id;
  const sql    = getSql();
  const today  = new Date().toISOString().slice(0, 10);

  const habits = await sql`
    SELECT h.*,
      (SELECT COUNT(*)::int FROM platform_habit_completions hc
       WHERE hc.habit_id = h.id AND hc.approval_status = 'approved') AS total_completions,
      (SELECT COUNT(*)::int FROM platform_habit_completions hc
       WHERE hc.habit_id = h.id AND hc.approval_status = 'pending') AS pending_approvals,
      EXISTS(
        SELECT 1 FROM platform_habit_completions hc
        WHERE hc.habit_id = h.id AND hc.user_id = ${userId}
          AND hc.done_on = ${today} AND hc.approval_status = 'pending'
      ) AS has_pending_today
    FROM platform_habits h
    WHERE h.user_id = ${userId}
    ORDER BY h.paused ASC, h.created_at ASC
  `;
  res.json({ habits });
});

// ── POST /api/habits ──────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = (req.user as { id: string }).id;
  const { name, emoji, frequency } = req.body as { name?: string; emoji?: string; frequency?: string };

  if (!name?.trim()) { res.status(400).json({ error: "Habit name is required" }); return; }

  const safety = contentSafetyCheck(name.trim());
  if (!safety.safe) { res.status(422).json({ error: "Habit name contains content that is not allowed." }); return; }

  const sql = getSql();
  const [userRow] = await sql`SELECT role FROM users WHERE id = ${userId}`;
  const userRole: string = userRow?.role ?? "user";

  const [habit] = await sql`
    INSERT INTO platform_habits (user_id, name, emoji, frequency)
    VALUES (${userId}, ${name.trim()}, ${emoji ?? "🌱"}, ${VALID_FREQUENCIES.includes(frequency ?? "") ? frequency! : "daily"})
    RETURNING *
  `;
  res.json({ habit, createdByRole: userRole });
});

// ── PATCH /api/habits/:id ─────────────────────────────────────────────────────
router.patch("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const { name, emoji, frequency, paused } = req.body as {
    name?: string; emoji?: string; frequency?: string; paused?: boolean;
  };
  const sql = getSql();
  const [existing] = await sql`SELECT * FROM platform_habits WHERE id = ${id} AND user_id = ${userId}`;
  if (!existing) { res.status(404).json({ error: "Habit not found" }); return; }

  const [updated] = await sql`
    UPDATE platform_habits SET
      name       = ${name?.trim() ?? existing.name},
      emoji      = ${emoji ?? existing.emoji},
      frequency  = ${VALID_FREQUENCIES.includes(frequency ?? "") ? frequency! : existing.frequency},
      paused     = ${paused ?? existing.paused},
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  res.json({ habit: updated });
});

// ── DELETE /api/habits/:id ────────────────────────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const sql = getSql();
  await sql`DELETE FROM platform_habit_completions WHERE habit_id = ${id} AND user_id = ${userId}`;
  await sql`DELETE FROM platform_habits WHERE id = ${id} AND user_id = ${userId}`;
  res.json({ success: true });
});

// ── POST /api/habits/:id/complete ─────────────────────────────────────────────
router.post("/:id/complete", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const { note, date } = req.body as { note?: string; date?: string };
  const doneOn = date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const sql    = getSql();

  const [habit] = await sql`SELECT * FROM platform_habits WHERE id = ${id} AND user_id = ${userId}`;
  if (!habit) { res.status(404).json({ error: "Habit not found" }); return; }

  const [userRow] = await sql`SELECT role FROM users WHERE id = ${userId}`;
  const role: string = userRow?.role ?? "user";
  const child        = role === CHILD_ROLE;
  const status       = child ? "pending" : "approved";

  await sql`
    INSERT INTO platform_habit_completions (habit_id, user_id, done_on, note, approval_status)
    VALUES (${id}, ${userId}, ${doneOn}, ${note ?? null}, ${status})
    ON CONFLICT (habit_id, done_on) DO UPDATE SET note = EXCLUDED.note
  `;

  if (child) {
    // Notify all adults — do not update streaks yet
    const adults = await sql`
      SELECT id, role FROM users
      WHERE role IN ('family_adult', 'founder', 'admin')
      LIMIT 20
    `;
    const habitName: string = String(habit.name);
    const habitEmoji: string = String(habit.emoji ?? "🌱");

    await Promise.allSettled(adults.map(adult =>
      outboundEngine.send({
        type:     "habit_pending_approval",
        channel:  "in-app",
        to:       String(adult.id),
        userId:   String(adult.id),
        role:     String(adult.role),
        universe: "family",
        subject:  "Habit completion needs your review",
        body:     `${habitEmoji} <strong>${habitName}</strong> was logged by a family member and is waiting for your approval.`,
        metadata: { habitId: id, childUserId: userId, doneOn },
      })
    ));

    res.json({ success: true, status: "pending", message: "Logged — waiting for a guardian to approve." });
    return;
  }

  // Adult path — recalc streak immediately
  const { streak, longest } = await recalcStreak(id);
  await sql`
    UPDATE platform_habits SET
      current_streak = ${streak},
      longest_streak = ${longest},
      last_done_at   = ${doneOn},
      updated_at     = NOW()
    WHERE id = ${id}
  `;

  res.json({ success: true, status: "approved", streak, longestStreak: longest });
});

// ── GET /api/habits/:id/completions ──────────────────────────────────────────
router.get("/:id/completions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const days   = Math.min(Number(req.query["days"] ?? 30), 365);
  const sql    = getSql();

  const completions = await sql`
    SELECT done_on, approval_status FROM platform_habit_completions
    WHERE habit_id = ${id} AND user_id = ${userId}
      AND approval_status = 'approved'
      AND done_on >= CURRENT_DATE - INTERVAL '${sql.unsafe(String(days))} days'
    ORDER BY done_on DESC
  `;
  res.json({ completions: completions.map(c => c.done_on) });
});

// ── GET /api/habits/approvals — adults only ───────────────────────────────────
router.get("/approvals", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Not authenticated" }); return; }
  const reviewer = req.user as { id: string };
  const sql      = getSql();

  const [reviewerRow] = await sql`SELECT role FROM users WHERE id = ${reviewer.id}`;
  if (!isAdult(reviewerRow?.role ?? "")) {
    res.status(403).json({ error: "Adults only" }); return;
  }

  const pending = await sql`
    SELECT
      hc.id            AS completion_id,
      hc.done_on,
      hc.note,
      hc.created_at,
      h.id             AS habit_id,
      h.name           AS habit_name,
      h.emoji          AS habit_emoji,
      hc.user_id       AS child_user_id,
      COALESCE(fi.display_name, u.email) AS child_display_name
    FROM platform_habit_completions hc
    JOIN platform_habits h ON h.id = hc.habit_id
    JOIN users u ON u.id = hc.user_id
    LEFT JOIN platform_family_identities fi ON fi.user_id = hc.user_id
    WHERE hc.approval_status = 'pending'
    ORDER BY hc.created_at ASC
  `;
  res.json({ pending });
});

// ── POST /api/habits/approvals/:completionId/approve ─────────────────────────
router.post("/approvals/:completionId/approve", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Not authenticated" }); return; }
  const reviewer = req.user as { id: string };
  const sql      = getSql();

  const [reviewerRow] = await sql`SELECT role FROM users WHERE id = ${reviewer.id}`;
  if (!isAdult(reviewerRow?.role ?? "")) {
    res.status(403).json({ error: "Adults only" }); return;
  }

  const { completionId } = req.params;
  const { note } = req.body as { note?: string };

  const [completion] = await sql`
    UPDATE platform_habit_completions
    SET approval_status = 'approved',
        reviewed_at     = NOW(),
        reviewed_by     = ${reviewer.id},
        parent_note     = ${note ?? null}
    WHERE id = ${completionId} AND approval_status = 'pending'
    RETURNING *
  `;
  if (!completion) { res.status(404).json({ error: "Completion not found or already reviewed" }); return; }

  // Recalculate streak for the habit
  const habitId = String(completion.habit_id);
  const { streak, longest } = await recalcStreak(habitId);

  const doneOn = String(completion.done_on);
  await sql`
    UPDATE platform_habits SET
      current_streak = ${streak},
      longest_streak = ${longest},
      last_done_at   = ${doneOn},
      updated_at     = NOW()
    WHERE id = ${habitId}
  `;

  // Notify child
  const [habit] = await sql`SELECT name, emoji FROM platform_habits WHERE id = ${habitId}`;
  const childId = String(completion.user_id);
  const [childRow] = await sql`SELECT role FROM users WHERE id = ${childId}`;

  await outboundEngine.send({
    type:     "habit_approved",
    channel:  "in-app",
    to:       childId,
    userId:   childId,
    role:     String(childRow?.role ?? "family_child"),
    universe: "family",
    subject:  "Habit approved!",
    body:     `${String(habit?.emoji ?? "🌱")} Your <strong>${String(habit?.name ?? "habit")}</strong> was approved! It counts toward your streak. Keep going! 🌟`,
    metadata: { habitId, completionId },
  });

  res.json({ success: true, streak, longestStreak: longest });
});

// ── POST /api/habits/approvals/:completionId/reject ───────────────────────────
router.post("/approvals/:completionId/reject", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Not authenticated" }); return; }
  const reviewer = req.user as { id: string };
  const sql      = getSql();

  const [reviewerRow] = await sql`SELECT role FROM users WHERE id = ${reviewer.id}`;
  if (!isAdult(reviewerRow?.role ?? "")) {
    res.status(403).json({ error: "Adults only" }); return;
  }

  const { completionId } = req.params;
  const { note } = req.body as { note?: string };

  const [completion] = await sql`
    UPDATE platform_habit_completions
    SET approval_status = 'rejected',
        reviewed_at     = NOW(),
        reviewed_by     = ${reviewer.id},
        parent_note     = ${note ?? null}
    WHERE id = ${completionId} AND approval_status = 'pending'
    RETURNING *
  `;
  if (!completion) { res.status(404).json({ error: "Completion not found or already reviewed" }); return; }

  // Notify child
  const habitId = String(completion.habit_id);
  const [habit] = await sql`SELECT name, emoji FROM platform_habits WHERE id = ${habitId}`;
  const childId = String(completion.user_id);
  const [childRow] = await sql`SELECT role FROM users WHERE id = ${childId}`;

  await outboundEngine.send({
    type:     "habit_rejected",
    channel:  "in-app",
    to:       childId,
    userId:   childId,
    role:     String(childRow?.role ?? "family_child"),
    universe: "family",
    subject:  "Habit needs another try",
    body:     `${String(habit?.emoji ?? "🌱")} Your <strong>${String(habit?.name ?? "habit")}</strong> needs another try. ${note ? `Note: ${note}` : "Give it another go — you've got this! 🌿"}`,
    metadata: { habitId, completionId },
  });

  res.json({ success: true });
});

export default router;
