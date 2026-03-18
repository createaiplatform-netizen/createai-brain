import { Router, type Request, type Response } from "express";
import { query } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// ─── GET /users ───────────────────────────────────────────────────────────────
// Returns users scoped to the authenticated user's organization.
// Admins see all users in their org; members see only themselves.

router.get("/", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  try {
    let rows: {
      id: string; email: string; name: string | null; role: string;
      is_active: boolean; last_login_at: Date | null; created_at: Date;
      mfa_enabled: boolean | null;
    }[];

    if (req.user.role === "admin") {
      rows = await query(
        `SELECT u.id, u.email, u.name, u.role, u.is_active,
                u.last_login_at, u.created_at, m.enabled AS mfa_enabled
         FROM users u
         LEFT JOIN user_mfa m ON m.user_id = u.id
         WHERE u.organization_id = $1
         ORDER BY u.created_at DESC`,
        [req.user.organizationId]
      );
    } else {
      rows = await query(
        `SELECT u.id, u.email, u.name, u.role, u.is_active,
                u.last_login_at, u.created_at, m.enabled AS mfa_enabled
         FROM users u
         LEFT JOIN user_mfa m ON m.user_id = u.id
         WHERE u.id = $1`,
        [req.user.id]
      );
    }

    res.json({
      users: rows.map((u) => ({
        id:          u.id,
        email:       u.email,
        name:        u.name,
        role:        u.role,
        isActive:    u.is_active,
        mfaEnabled:  u.mfa_enabled ?? false,
        lastLoginAt: u.last_login_at,
        createdAt:   u.created_at,
      })),
    });
  } catch (err) {
    console.error("[users] GET /users:", err);
    res.status(500).json({ error: "Failed to load users." });
  }
});

// ─── GET /users/:id ───────────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  const { id } = req.params;

  // Users can only view their own profile; admins can view any org member
  const canView =
    req.user.id === id ||
    req.user.role === "admin";

  if (!canView) {
    res.status(403).json({ error: "Insufficient permissions." });
    return;
  }

  try {
    const rows = await query<{
      id: string; email: string; name: string | null; role: string;
      organization_id: string | null; is_active: boolean;
      last_login_at: Date | null; created_at: Date; mfa_enabled: boolean | null;
    }>(
      `SELECT u.id, u.email, u.name, u.role, u.organization_id,
              u.is_active, u.last_login_at, u.created_at,
              m.enabled AS mfa_enabled
       FROM users u
       LEFT JOIN user_mfa m ON m.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Org isolation: admins can only see users in their own org
    const user = rows[0];
    if (
      req.user.role !== "super_admin" &&
      user.organization_id !== req.user.organizationId
    ) {
      res.status(403).json({ error: "Insufficient permissions." });
      return;
    }

    res.json({
      user: {
        id:             user.id,
        email:          user.email,
        name:           user.name,
        role:           user.role,
        organizationId: user.organization_id,
        isActive:       user.is_active,
        mfaEnabled:     user.mfa_enabled ?? false,
        lastLoginAt:    user.last_login_at,
        createdAt:      user.created_at,
      },
    });
  } catch (err) {
    console.error("[users] GET /users/:id:", err);
    res.status(500).json({ error: "Failed to load user." });
  }
});

// ─── PATCH /users/:id ─────────────────────────────────────────────────────────
// Admins can update name, role, isActive. Users can update their own name.

router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  const { id } = req.params;
  const isOwnProfile = req.user.id === id;
  const isAdmin      = req.user.role === "admin";

  if (!isOwnProfile && !isAdmin) {
    res.status(403).json({ error: "Insufficient permissions." });
    return;
  }

  const { name, role, isActive } = req.body as {
    name?: string; role?: string; isActive?: boolean;
  };

  try {
    const updates: string[] = [];
    const values:  unknown[] = [];
    let   idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim() || null);
    }
    if (isAdmin && role !== undefined) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if (isAdmin && isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "No fields to update." });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);
    await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}`,
      values
    );

    res.json({ success: true });
  } catch (err) {
    console.error("[users] PATCH /users/:id:", err);
    res.status(500).json({ error: "Failed to update user." });
  }
});

export default router;
