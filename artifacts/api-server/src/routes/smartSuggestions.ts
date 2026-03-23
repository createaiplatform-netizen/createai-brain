// ─── Smart Suggestions ────────────────────────────────────────────────────────
// Rule-based gentle suggestions from real user data. No AI calls. No pressure.
// All suggestions are optional, dismissible, and derived only from data the user
// has explicitly stored. Never alarming. Always calm and helpful.
// Role-aware: founder / admin / customer / family_adult / family_child / viewer.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db.js";

const router = Router();

type Suggestion = {
  id: string;
  type: "alert" | "reminder" | "celebrate" | "info";
  icon: string;
  message: string;
  action?: string;
  priority: number;
};

// ── Role-specific static suggestions ─────────────────────────────────────────

function roleBasedSuggestions(role: string): Suggestion[] {
  switch (role) {
    case "founder":
    case "admin":
      return [
        { id: "role-founder-1", type: "info",     icon: "📊", message: "Check your top apps chart in the admin panel",         action: "admin",       priority: 2 },
        { id: "role-founder-2", type: "info",     icon: "🚀", message: "Review new customer signups and subscription activity", action: "commandcenter", priority: 2 },
        { id: "role-founder-3", type: "info",     icon: "⚡", message: "Run a Brain Hub engine to generate strategic content",   action: "brainhub",    priority: 1 },
      ];
    case "customer":
      return [
        { id: "role-customer-1", type: "info",    icon: "✨", message: "Explore your recommended apps for today",               action: "apps",        priority: 2 },
        { id: "role-customer-2", type: "info",    icon: "📄", message: "Visit your output library to review saved documents",   action: "documents",   priority: 1 },
        { id: "role-customer-3", type: "info",    icon: "🎯", message: "Use the Opportunity Engine to discover new ideas",      action: "opportunity", priority: 1 },
      ];
    case "family_adult":
      return [
        { id: "role-fadult-1",  type: "info",     icon: "🏠", message: "Check the family dashboard for updates",               action: "family",      priority: 2 },
        { id: "role-fadult-2",  type: "info",     icon: "💌", message: "Send a message to a family member",                    action: "messages",    priority: 1 },
        { id: "role-fadult-3",  type: "info",     icon: "🌱", message: "Log a habit — consistency builds momentum",            action: "habits",      priority: 1 },
      ];
    case "family_child":
      return [
        { id: "role-fchild-1",  type: "info",     icon: "🎮", message: "Complete a learning activity today",                   action: "kids",        priority: 2 },
        { id: "role-fchild-2",  type: "celebrate",icon: "⭐", message: "Check your progress and earn your next milestone",     action: "kids",        priority: 1 },
      ];
    default:
      return [
        { id: "role-viewer-1",  type: "info",     icon: "👋", message: "Explore what CreateAI Brain can do for you",           action: "apps",        priority: 1 },
      ];
  }
}

// ── GET /api/smart-suggestions ────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ suggestions: [] });
    return;
  }
  const userId = (req.user as { id: string; role?: string }).id;
  const role   = (req.user as { id: string; role?: string }).role ?? "user";
  const sql = getSql();
  const suggestions: Suggestion[] = [];

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
    // Return empty data-driven suggestions gracefully if DB isn't ready
  }

  // Merge role-based suggestions, but only fill up to 5 total
  const roleSuggestions = roleBasedSuggestions(role);
  for (const rs of roleSuggestions) {
    if (suggestions.length < 5) suggestions.push(rs);
  }

  suggestions.sort((a, b) => b.priority - a.priority);
  res.json({ suggestions: suggestions.slice(0, 5) });
});

export default router;
