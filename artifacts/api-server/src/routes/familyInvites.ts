// ─── Family Invites ───────────────────────────────────────────────────────────
// POST   /family-invites          — send invite email (authenticated adult/founder)
// GET    /family-invites          — list my sent invites
// GET    /family-invites/validate — validate a token (public)
// POST   /family-invites/accept   — accept invite (authenticated)

import crypto from "crypto";
import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db.js";
import { getLaunchFlag } from "../utils/launchFlags.js";
import { outboundEngine } from "../services/outboundEngine.js";
import { PLATFORM } from "../services/platformIdentity.js";

const router = Router();

const ALLOWED_ROLES = ["family_adult", "family_child"] as const;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── POST / ───────────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const enabled = await getLaunchFlag("launch_family_invites");
  if (!enabled) {
    res.status(403).json({ error: "Family invites are not yet enabled." });
    return;
  }

  const { email, role } = req.body as { email?: string; role?: string };

  if (!email?.trim().includes("@")) {
    res.status(400).json({ error: "Valid email required" });
    return;
  }
  if (!role || !(ALLOWED_ROLES as readonly string[]).includes(role)) {
    res.status(400).json({ error: "Role must be family_adult or family_child" });
    return;
  }

  const sender = req.user as { id: string; firstName?: string; email?: string };
  const normalEmail = email.trim().toLowerCase();
  const sql = getSql();

  try {
    const [existing] = await sql`
      SELECT id FROM platform_family_invites
      WHERE email = ${normalEmail}
        AND accepted_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `;
    if (existing) {
      res.status(409).json({ error: "An active invite for this email already exists." });
      return;
    }

    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const [invite] = await sql`
      INSERT INTO platform_family_invites (email, role, token, invited_by, expires_at)
      VALUES (${normalEmail}, ${role}, ${token}, ${sender.id}, ${expiresAt})
      RETURNING id, email, role, expires_at
    `;

    const inviteUrl  = `https://${PLATFORM.domain}/accept-invite?token=${token}`;
    const senderName = sender.firstName ?? "A family member";
    const roleLabel  = role === "family_child" ? "Young one" : "Family adult";

    await outboundEngine.send({
      type:     "family_invite",
      channel:  "email",
      to:       normalEmail,
      userId:   sender.id,
      role,
      universe: "family",
      subject:  `${senderName} invited you to join their family space on ${PLATFORM.displayName}`,
      body: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1916;padding:24px;">
          <h2 style="color:#7a9068;margin-top:0;">You're invited 🌿</h2>
          <p style="font-size:15px;line-height:1.6;">
            <strong>${senderName}</strong> has invited you to join their private family space
            on <strong>${PLATFORM.displayName}</strong>.
          </p>
          <p style="color:#6b6660;font-size:13px;">Your role: <strong>${roleLabel}</strong></p>
          <a href="${inviteUrl}"
             style="display:inline-block;margin-top:20px;padding:13px 26px;background:#7a9068;
                    color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
            Accept Invitation
          </a>
          <p style="margin-top:28px;font-size:11px;color:#6b6660;line-height:1.5;">
            This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.
          </p>
        </div>
      `,
      metadata: { inviteId: invite.id, role, invitedBy: sender.id },
    });

    res.status(201).json({
      success: true,
      invite:  { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expires_at },
    });
  } catch (err) {
    console.error("[familyInvites] POST /:", err);
    res.status(500).json({ error: "Failed to create invite" });
  }
});

// ─── GET / ────────────────────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = req.user as { id: string };
  const sql  = getSql();

  try {
    const rows = await sql`
      SELECT id, email, role, expires_at, accepted_at, created_at
      FROM platform_family_invites
      WHERE invited_by = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    res.json({ invites: rows });
  } catch (err) {
    console.error("[familyInvites] GET /:", err);
    res.status(500).json({ error: "Failed to list invites" });
  }
});

// ─── GET /validate ────────────────────────────────────────────────────────────
router.get("/validate", async (req: Request, res: Response) => {
  const token = (req.query["token"] as string | undefined)?.trim();
  if (!token) {
    res.status(400).json({ error: "token required" });
    return;
  }
  const sql = getSql();

  try {
    const [invite] = await sql`
      SELECT id, email, role, expires_at, accepted_at
      FROM platform_family_invites
      WHERE token = ${token}
      LIMIT 1
    `;
    if (!invite)             { res.status(404).json({ error: "Invite not found" }); return; }
    if (invite.accepted_at)  { res.status(410).json({ error: "Invite already accepted" }); return; }
    if (new Date(invite.expires_at as string) < new Date()) {
      res.status(410).json({ error: "Invite has expired" }); return;
    }
    res.json({ valid: true, invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expires_at } });
  } catch (err) {
    console.error("[familyInvites] GET /validate:", err);
    res.status(500).json({ error: "Validation failed" });
  }
});

// ─── POST /accept ─────────────────────────────────────────────────────────────
router.post("/accept", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Must be logged in to accept an invite" });
    return;
  }
  const { token } = req.body as { token?: string };
  if (!token?.trim()) {
    res.status(400).json({ error: "token required" });
    return;
  }

  const user = req.user as { id: string };
  const sql  = getSql();

  try {
    const [invite] = await sql`
      SELECT * FROM platform_family_invites WHERE token = ${token.trim()} LIMIT 1
    `;
    if (!invite)             { res.status(404).json({ error: "Invite not found" }); return; }
    if (invite.accepted_at)  { res.status(410).json({ error: "Invite already accepted" }); return; }
    if (new Date(invite.expires_at as string) < new Date()) {
      res.status(410).json({ error: "Invite has expired" }); return;
    }

    await sql`
      UPDATE platform_family_invites
      SET accepted_at = NOW(), accepted_by = ${user.id}
      WHERE id = ${invite.id}
    `;

    // Ensure family identity exists for accepting user with correct member_type
    const isChild    = invite.role === "family_child";
    const memberType = isChild ? "child" : "adult";
    const childNames = ["Bloom", "Spark", "Ember", "Cricket", "Pebble", "Firefly", "Clover", "Acorn"];
    const adultNames = ["Oak", "Willow", "Cedar", "Maple", "River", "Harbor", "Meadow", "Stone"];
    const emojis     = ["🌱", "🌿", "🌾", "🍃", "🌸", "🌺", "🌻", "🌼", "🍀", "🌲"];
    const colors     = ["#7a9068", "#c4a97a", "#6a8db5", "#9a7ab5", "#e8826a"];
    const hash       = [...user.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    const names      = isChild ? childNames : adultNames;

    await sql`
      INSERT INTO platform_family_identities
        (user_id, display_name, avatar_emoji, avatar_color, member_type)
      VALUES (
        ${user.id},
        ${names[hash % names.length]},
        ${emojis[hash % emojis.length]},
        ${colors[hash % colors.length]},
        ${memberType}
      )
      ON CONFLICT (user_id) DO UPDATE
        SET member_type = EXCLUDED.member_type, updated_at = NOW()
    `;

    res.json({ success: true, role: invite.role });
  } catch (err) {
    console.error("[familyInvites] POST /accept:", err);
    res.status(500).json({ error: "Failed to accept invite" });
  }
});

export default router;
