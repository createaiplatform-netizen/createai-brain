// ─── Smart Suggestions ────────────────────────────────────────────────────────
// Rule-based gentle suggestions from real user data. No AI calls. No pressure.
// All suggestions are optional, dismissible, and derived only from data the user
// has explicitly stored. Never alarming. Always calm and helpful.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

// GET /api/smart-suggestions — suggestions for current user based on actual data
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ suggestions: [] });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();
  const suggestions: { id: string; type: string; icon: string; message: string; action?: string; priority: number }[] = [];

  try {
    const [
      overdueEvents,
      upcomingEvents,
      overdueBills,
      habitsToday,
      reachedGoals,
      unreadMessages,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS cnt FROM platform_life_events WHERE user_id = ${userId} AND event_date < CURRENT_DATE AND completed = FALSE`,
      sql`SELECT COUNT(*)::int AS cnt FROM platform_life_events WHERE user_id = ${userId} AND event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND completed = FALSE`,
      sql`SELECT COUNT(*)::int AS cnt FROM platform_bills WHERE user_id = ${userId} AND due_date < CURRENT_DATE AND status NOT IN ('paid','cancelled')`,
      sql`SELECT COUNT(*)::int AS cnt FROM platform_habits WHERE user_id = ${userId} AND paused = FALSE AND (last_done_at IS NULL OR last_done_at < CURRENT_DATE)`,
      sql`SELECT COUNT(*)::int AS cnt FROM platform_family_bank_goals WHERE user_id = ${userId} AND completed = FALSE AND target_cents > 0 AND current_cents >= target_cents`,
      sql`SELECT COUNT(fm.*)::int AS cnt FROM platform_family_messages fm JOIN platform_family_conversations fc ON fc.id = fm.conversation_id WHERE ${userId} = ANY(fc.participant_ids) AND NOT (${userId} = ANY(fm.read_by))`,
    ]);

    if (Number(overdueBills?.at(0)?.cnt ?? 0) > 0) {
      const n = Number(overdueBills.at(0)?.cnt ?? 0);
      suggestions.push({ id: "overdue-bills", type: "alert", icon: "📋", message: `${n} bill${n !== 1 ? "s" : ""} overdue — check your bill tracker`, action: "bills", priority: 10 });
    }
    if (Number(overdueEvents?.at(0)?.cnt ?? 0) > 0) {
      const n = Number(overdueEvents.at(0)?.cnt ?? 0);
      suggestions.push({ id: "overdue-events", type: "reminder", icon: "🗓️", message: `${n} life event${n !== 1 ? "s" : ""} may need attention`, action: "life", priority: 9 });
    }
    if (Number(unreadMessages?.at(0)?.cnt ?? 0) > 0) {
      const n = Number(unreadMessages.at(0)?.cnt ?? 0);
      suggestions.push({ id: "unread-messages", type: "info", icon: "💌", message: `${n} unread message${n !== 1 ? "s" : ""} from your family`, action: "messages", priority: 8 });
    }
    if (Number(habitsToday?.at(0)?.cnt ?? 0) > 0) {
      const n = Number(habitsToday.at(0)?.cnt ?? 0);
      suggestions.push({ id: "habits-today", type: "info", icon: "🌱", message: n === 1 ? "One habit waiting for you today" : `${n} habits ready for today`, action: "habits", priority: 5 });
    }
    if (Number(upcomingEvents?.at(0)?.cnt ?? 0) > 0) {
      const n = Number(upcomingEvents.at(0)?.cnt ?? 0);
      suggestions.push({ id: "upcoming-events", type: "info", icon: "📅", message: `${n} event${n !== 1 ? "s" : ""} coming up in the next 7 days`, action: "life", priority: 4 });
    }
    if (Number(reachedGoals?.at(0)?.cnt ?? 0) > 0) {
      const n = Number(reachedGoals.at(0)?.cnt ?? 0);
      suggestions.push({ id: "reached-goals", type: "celebrate", icon: "🎯", message: `${n} savings goal${n !== 1 ? "s" : ""} reached — you did it!`, action: "bank", priority: 3 });
    }
  } catch {
    // Return empty suggestions gracefully if data isn't ready
  }

  suggestions.sort((a, b) => b.priority - a.priority);
  res.json({ suggestions: suggestions.slice(0, 5) });
});

export default router;
