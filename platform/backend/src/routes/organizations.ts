import { Router, type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

function slugify(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 54);
  return `${base}-${id.slice(0, 6)}`;
}

// ─── GET /organizations ───────────────────────────────────────────────────────
// Returns the authenticated user's organization.
// Super-admins (role='super_admin') see all organizations.

router.get("/", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  try {
    let rows: { id: string; name: string; slug: string; settings: object; created_at: Date }[];

    if (req.user.role === "super_admin") {
      rows = await query(
        "SELECT id, name, slug, settings, created_at FROM organizations ORDER BY created_at DESC"
      );
    } else {
      if (!req.user.organizationId) {
        res.json({ organizations: [] });
        return;
      }
      rows = await query(
        "SELECT id, name, slug, settings, created_at FROM organizations WHERE id = $1",
        [req.user.organizationId]
      );
    }

    res.json({
      organizations: rows.map((o) => ({
        id:        o.id,
        name:      o.name,
        slug:      o.slug,
        settings:  o.settings,
        createdAt: o.created_at,
      })),
    });
  } catch (err) {
    console.error("[orgs] GET /organizations:", err);
    res.status(500).json({ error: "Failed to load organizations." });
  }
});

// ─── POST /organizations ──────────────────────────────────────────────────────
// Admin creates an additional organization (multi-facility setup).

router.post("/", requireRole("admin", "super_admin"), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "Organization name is required." });
    return;
  }
  try {
    const id   = uuidv4();
    const slug = slugify(name.trim(), id);
    await query(
      "INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)",
      [id, name.trim(), slug]
    );
    res.status(201).json({
      organization: { id, name: name.trim(), slug },
    });
  } catch (err) {
    console.error("[orgs] POST /organizations:", err);
    res.status(500).json({ error: "Failed to create organization." });
  }
});

// ─── GET /organizations/:id ───────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  const { id } = req.params;

  // Members can only view their own org
  if (req.user.role !== "super_admin" && req.user.organizationId !== id) {
    res.status(403).json({ error: "Insufficient permissions." });
    return;
  }

  try {
    const rows = await query<{
      id: string; name: string; slug: string; settings: object;
      created_at: Date; user_count: string;
    }>(
      `SELECT o.id, o.name, o.slug, o.settings, o.created_at,
              COUNT(u.id) AS user_count
       FROM organizations o
       LEFT JOIN users u ON u.organization_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Organization not found." });
      return;
    }

    const o = rows[0];
    res.json({
      organization: {
        id:        o.id,
        name:      o.name,
        slug:      o.slug,
        settings:  o.settings,
        userCount: parseInt(o.user_count, 10),
        createdAt: o.created_at,
      },
    });
  } catch (err) {
    console.error("[orgs] GET /organizations/:id:", err);
    res.status(500).json({ error: "Failed to load organization." });
  }
});

// ─── PATCH /organizations/:id ─────────────────────────────────────────────────

router.patch("/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  const { id } = req.params;

  if (req.user.role !== "super_admin" && req.user.organizationId !== id) {
    res.status(403).json({ error: "Insufficient permissions." });
    return;
  }

  const { name, settings } = req.body as { name?: string; settings?: object };
  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name) { updates.push(`name = $${idx++}`); values.push(name.trim()); }
    if (settings) { updates.push(`settings = $${idx++}`); values.push(JSON.stringify(settings)); }

    if (updates.length === 0) {
      res.status(400).json({ error: "No fields to update." });
      return;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);
    await query(
      `UPDATE organizations SET ${updates.join(", ")} WHERE id = $${idx}`,
      values
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[orgs] PATCH /organizations/:id:", err);
    res.status(500).json({ error: "Failed to update organization." });
  }
});

export default router;
