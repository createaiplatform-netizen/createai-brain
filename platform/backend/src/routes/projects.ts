import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth";
import { query } from "../db";

const router = Router();

// ─── All project routes require authentication ─────────────────────────────
router.use(requireAuth);

// ─── GET /projects ────────────────────────────────────────────────────────────
// Returns all projects scoped to the authenticated user's organization.
// If the user has no organization yet, returns an empty list.

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.organizationId) {
      res.json({ projects: [] });
      return;
    }

    const rows = await query<{
      id: string;
      name: string;
      type: string;
      status: string;
      created_at: Date;
    }>(
      `SELECT id, name, type, status, created_at
       FROM projects
       WHERE organization_id = $1
         AND status != 'deleted'
       ORDER BY created_at DESC`,
      [req.user.organizationId]
    );

    res.json({
      projects: rows.map((r) => ({
        id:        r.id,
        name:      r.name,
        type:      r.type,
        status:    r.status,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error("[projects] GET /", err);
    res.status(500).json({ error: "Failed to load projects." });
  }
});

// ─── POST /projects ───────────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { name, type } = req.body as { name?: string; type?: string };

  if (!name?.trim()) {
    res.status(400).json({ error: "name is required." });
    return;
  }

  if (!req.user?.organizationId) {
    res.status(400).json({ error: "You must belong to an organization to create projects." });
    return;
  }

  try {
    const rows = await query<{ id: string; name: string; type: string; status: string; created_at: Date }>(
      `INSERT INTO projects (name, type, status, organization_id, created_by)
       VALUES ($1, $2, 'active', $3, $4)
       RETURNING id, name, type, status, created_at`,
      [name.trim(), type ?? "general", req.user.organizationId, req.user.id]
    );

    const project = rows[0];
    res.status(201).json({
      project: {
        id:        project.id,
        name:      project.name,
        type:      project.type,
        status:    project.status,
        createdAt: project.created_at,
      },
    });
  } catch (err) {
    console.error("[projects] POST /", err);
    res.status(500).json({ error: "Failed to create project." });
  }
});

// ─── GET /projects/:id ────────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query<{ id: string; name: string; type: string; status: string; organization_id: string; created_at: Date }>(
      "SELECT id, name, type, status, organization_id, created_at FROM projects WHERE id = $1",
      [req.params.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Project not found." });
      return;
    }

    // Enforce org scoping — never return cross-org data.
    if (rows[0].organization_id !== req.user?.organizationId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    res.json({ project: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to load project." });
  }
});

// ─── PATCH /projects/:id ──────────────────────────────────────────────────────

router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const { name, status } = req.body as { name?: string; status?: string };

  try {
    const existing = await query<{ organization_id: string }>(
      "SELECT organization_id FROM projects WHERE id = $1",
      [req.params.id]
    );

    if (!existing.length || existing[0].organization_id !== req.user?.organizationId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    await query(
      `UPDATE projects SET
         name       = COALESCE($1, name),
         status     = COALESCE($2, status),
         updated_at = NOW()
       WHERE id = $3`,
      [name ?? null, status ?? null, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update project." });
  }
});

// ─── DELETE /projects/:id ─────────────────────────────────────────────────────
// Soft-delete only. Never hard-delete projects containing PHI.

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await query<{ organization_id: string }>(
      "SELECT organization_id FROM projects WHERE id = $1",
      [req.params.id]
    );

    if (!existing.length || existing[0].organization_id !== req.user?.organizationId) {
      res.status(403).json({ error: "Access denied." });
      return;
    }

    await query(
      "UPDATE projects SET status = 'deleted', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project." });
  }
});

export default router;
