// ─── Contributions (Fairness Engine) ─────────────────────────────────────────
// Tracks participation, creativity, time, and effort per family member.
// Used ONLY for rewards/unlocks — never for rankings or public comparisons.
// Founder can override any rule at any time.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

const VALID_TYPES = [
  "participation", "creativity", "time", "effort",
  "chore", "learning", "kindness", "teamwork", "custom",
];

// Contribution point values per type (can be tuned by founder/admin)
const DEFAULT_POINTS: Record<string, number> = {
  participation: 1,
  creativity:    2,
  time:          1,
  effort:        2,
  chore:         3,
  learning:      2,
  kindness:      3,
  teamwork:      2,
  custom:        1,
};

// GET /api/contributions/me
router.get("/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();
  const [summary] = await sql`
    SELECT
      COALESCE(SUM(points), 0)::int AS total_points,
      COUNT(*)::int AS total_contributions
    FROM platform_contributions
    WHERE user_id = ${userId}
  `;
  const recent = await sql`
    SELECT * FROM platform_contributions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 20
  `;
  res.json({ totalPoints: summary?.total_points ?? 0, totalContributions: summary?.total_contributions ?? 0, recent });
});

// GET /api/contributions/family — summary per family member (admin/adult only)
// Returns totals only — no comparisons shown to kids
router.get("/family", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const sql = getSql();
  const actor = req.user as { id: string };
  const [actorRow] = await sql`SELECT role FROM users WHERE id = ${actor.id}`;
  if (!["admin", "founder", "family_adult"].includes(actorRow?.role as string)) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const summaries = await sql`
    SELECT
      c.user_id,
      fi.display_name,
      fi.avatar_emoji,
      fi.avatar_color,
      COALESCE(SUM(c.points), 0)::int AS total_points,
      COUNT(c.id)::int AS total_contributions
    FROM platform_family_identities fi
    LEFT JOIN platform_contributions c ON c.user_id = fi.user_id
    JOIN users u ON u.id = fi.user_id
    WHERE u.role IN ('family_adult', 'family_child')
    GROUP BY c.user_id, fi.display_name, fi.avatar_emoji, fi.avatar_color
    ORDER BY fi.display_name ASC
  `;
  res.json({ members: summaries });
});

// POST /api/contributions — log a contribution (adult/admin can log for any family member)
router.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const actor = req.user as { id: string };
  const { userId, type, reason, points } = req.body as {
    userId?: string;
    type?: string;
    reason?: string;
    points?: number;
  };

  const sql = getSql();
  const [actorRow] = await sql`SELECT role FROM users WHERE id = ${actor.id}`;
  const targetId = userId ?? actor.id;

  if (targetId !== actor.id && !["admin", "founder", "family_adult"].includes(actorRow?.role as string)) {
    res.status(403).json({ error: "Not authorized to award contributions for others" });
    return;
  }

  const txnType = VALID_TYPES.includes(type ?? "") ? type! : "participation";
  const pts = Math.max(1, Math.min(points ?? DEFAULT_POINTS[txnType] ?? 1, 100));

  const [contrib] = await sql`
    INSERT INTO platform_contributions (user_id, type, points, reason, awarded_by)
    VALUES (${targetId}, ${txnType}, ${pts}, ${reason?.trim() ?? ""}, ${actor.id})
    RETURNING *
  `;
  res.json({ contribution: contrib });
});

// GET /api/contributions/types — available contribution types + default points
router.get("/types", (_req: Request, res: Response) => {
  res.json({ types: VALID_TYPES.map(t => ({ type: t, defaultPoints: DEFAULT_POINTS[t] ?? 1 })) });
});

export default router;
