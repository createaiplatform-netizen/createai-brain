// ─── Family Identity Engine ───────────────────────────────────────────────────
// Auto-generates and stores identities (name, avatar, color) for family members.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

const FAMILY_EMOJIS = ["🌱", "🌿", "🌾", "🍃", "🌸", "🌺", "🌻", "🌼", "🍀", "🌲", "🌳", "🦋", "🐝", "⭐", "🌙", "☀️", "🌈"];
const FAMILY_COLORS = ["#7a9068", "#c4a97a", "#6a8db5", "#9a7ab5", "#e8826a", "#6aab8a", "#d4845a", "#5a7a68", "#8a6878", "#6a9a8a"];
const ROLE_NAMES: Record<string, string[]> = {
  adult: ["Oak", "Willow", "Cedar", "Maple", "River", "Harbor", "Meadow", "Clover"],
  child: ["Bloom", "Spark", "Ember", "Cricket", "Pebble", "Firefly", "Clover", "Acorn"],
};

function autoIdentity(userId: string, memberType: string) {
  const hash = [...userId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const names = ROLE_NAMES[memberType] ?? ROLE_NAMES.adult;
  return {
    display_name: names[hash % names.length],
    avatar_emoji: FAMILY_EMOJIS[hash % FAMILY_EMOJIS.length],
    avatar_color: FAMILY_COLORS[hash % FAMILY_COLORS.length],
  };
}

// GET /api/family-identity/me
router.get("/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = req.user as { id: string };
  const sql = getSql();

  let [identity] = await sql`
    SELECT * FROM platform_family_identities WHERE user_id = ${user.id}
  `;

  if (!identity) {
    // Auto-generate
    const generated = autoIdentity(user.id, "adult");
    const [created] = await sql`
      INSERT INTO platform_family_identities (user_id, display_name, avatar_emoji, avatar_color, member_type)
      VALUES (${user.id}, ${generated.display_name}, ${generated.avatar_emoji}, ${generated.avatar_color}, 'adult')
      RETURNING *
    `;
    identity = created;
  }

  res.json({ identity });
});

// PUT /api/family-identity/me
// Body: { displayName?, avatarEmoji?, bio? }
router.put("/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = req.user as { id: string };
  const { displayName, avatarEmoji, bio } = req.body as {
    displayName?: string;
    avatarEmoji?: string;
    bio?: string;
  };
  const sql = getSql();

  await sql`
    INSERT INTO platform_family_identities (user_id, display_name, avatar_emoji, bio)
    VALUES (${user.id}, ${displayName ?? "Family Member"}, ${avatarEmoji ?? "🌱"}, ${bio ?? null})
    ON CONFLICT (user_id) DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, platform_family_identities.display_name),
      avatar_emoji = COALESCE(EXCLUDED.avatar_emoji, platform_family_identities.avatar_emoji),
      bio          = COALESCE(EXCLUDED.bio, platform_family_identities.bio),
      updated_at   = NOW()
  `;

  const [updated] = await sql`SELECT * FROM platform_family_identities WHERE user_id = ${user.id}`;
  res.json({ identity: updated });
});

// GET /api/family-identity/members (admin/family_adult can see all family members)
router.get("/members", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const sql = getSql();
  const members = await sql`
    SELECT fi.*, u.email, u.role
    FROM platform_family_identities fi
    JOIN users u ON u.id = fi.user_id
    WHERE u.role IN ('family_adult', 'family_child')
    ORDER BY fi.created_at ASC
  `;
  res.json({ members });
});

export default router;
