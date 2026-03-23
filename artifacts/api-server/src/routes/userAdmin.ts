// ─── Admin User Management ────────────────────────────────────────────────────
// Endpoints for admin/founder to manage users, roles, and devices.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  const sql = getSql();
  const user = req.user as { id: string };
  const [row] = await sql`SELECT role FROM users WHERE id = ${user.id}`;
  if (!row || !["admin", "founder"].includes(row.role as string)) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

// GET /api/user-admin/users
// Returns all users with role, device count, phone verification status
router.get("/users", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const sql = getSql();
  const users = await sql`
    SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      u.nda_signed,
      u.created_at,
      u.deleted_at,
      COUNT(DISTINCT td.id) AS device_count,
      MAX(td.last_used_at) AS last_active,
      MAX(pv.verified_at) IS NOT NULL AS has_phone_verified
    FROM users u
    LEFT JOIN platform_trusted_devices td ON td.user_id = u.id
    LEFT JOIN platform_phone_verifications pv ON pv.user_id = u.id AND pv.verified_at IS NOT NULL
    WHERE u.deleted_at IS NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  res.json({ users });
});

// PATCH /api/user-admin/users/:id/role
// Body: { role }
router.patch("/users/:id/role", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const { id } = req.params;
  const { role } = req.body as { role?: string };

  const VALID_ROLES = ["admin", "user", "viewer", "family_adult", "family_child", "customer"];
  if (!role || !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: `Role must be one of: ${VALID_ROLES.join(", ")}` });
    return;
  }

  // Cannot change founder role
  const sql = getSql();
  const [target] = await sql`SELECT role FROM users WHERE id = ${id}`;
  if (target?.role === "founder") {
    res.status(403).json({ error: "Cannot change founder role" });
    return;
  }

  await db.update(usersTable).set({ role }).where(eq(usersTable.id, String(id)));
  res.json({ success: true, id, role });
});

// DELETE /api/user-admin/users/:id/devices
// Remove all trusted devices for a user (e.g., lost phone recovery)
router.delete("/users/:id/devices", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const { id } = req.params;
  const sql = getSql();
  const result = await sql`
    DELETE FROM platform_trusted_devices WHERE user_id = ${id}
  `;
  res.json({ success: true, removed: result.count });
});

// GET /api/user-admin/users/:id/devices
// List all trusted devices for a specific user
router.get("/users/:id/devices", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const { id } = req.params;
  const sql = getSql();
  const devices = await sql`
    SELECT id, device_name, webauthn_credential_id IS NOT NULL AS has_biometric,
           phone_verified, last_used_at, created_at
    FROM platform_trusted_devices
    WHERE user_id = ${id}
    ORDER BY last_used_at DESC NULLS LAST
  `;
  res.json({ devices });
});

// POST /api/user-admin/users/:id/suspend
// Soft-delete (suspend) a user
router.post("/users/:id/suspend", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const { id } = req.params;
  const sql = getSql();
  const [target] = await sql`SELECT role FROM users WHERE id = ${id}`;
  if (target?.role === "founder") {
    res.status(403).json({ error: "Cannot suspend founder" });
    return;
  }
  await db.update(usersTable).set({ deletedAt: new Date() }).where(eq(usersTable.id, String(id)));
  res.json({ success: true });
});

// POST /api/user-admin/users/:id/restore
router.post("/users/:id/restore", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const { id } = req.params;
  await db.update(usersTable).set({ deletedAt: null }).where(eq(usersTable.id, String(id)));
  res.json({ success: true });
});

export default router;
