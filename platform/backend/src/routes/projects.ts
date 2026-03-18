import { Router, type Request, type Response } from "express";

const router = Router();

// ─── Projects ─────────────────────────────────────────────────────────────────
// A project is the core unit of work. In a nursing home context, a "project"
// might be a resident's care plan, a compliance initiative, a staff training
// program, or an operational process.
//
// Projects are always scoped to an organization. Users only see projects
// belonging to their organization.
//
// Future: Project types (care_plan, compliance, operational, training, other).
// Future: Project-level permissions (owner, editor, viewer).
// Future: AI Agent per project — knows all files in that project.
// Future: Scaffold engine — auto-creates standard files for each project type.
// Future: Project archiving and soft-delete.

// ─── GET /projects ────────────────────────────────────────────────────────────

router.get("/", async (_req: Request, res: Response) => {
  res.json({
    projects: [
      // Placeholder project shapes — replace with real DB queries.
      {
        id: "placeholder-1",
        name: "Resident Care Plan — Example",
        type: "care_plan",
        organizationId: "org-placeholder",
        status: "active",
        createdAt: new Date().toISOString(),
      },
      {
        id: "placeholder-2",
        name: "2024 HIPAA Compliance Review",
        type: "compliance",
        organizationId: "org-placeholder",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ],
    _placeholder: true,
    _todo: "Replace with: SELECT * FROM projects WHERE organization_id = req.user.organizationId",
  });
});

// ─── POST /projects ───────────────────────────────────────────────────────────

router.post("/", async (_req: Request, res: Response) => {
  res.status(201).json({
    project: null,
    _placeholder: true,
    _todo: [
      "Validate body (name, type, description).",
      "Insert project scoped to req.user.organizationId.",
      "Run scaffold engine to auto-create standard files for the project type.",
      "Initialize AI Agent context for this project.",
      "Emit audit log: project_created.",
    ],
  });
});

// ─── GET /projects/:id ────────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response) => {
  res.json({
    project: { id: req.params.id },
    _placeholder: true,
    _todo: "Verify org membership before returning. Never return cross-org data.",
  });
});

// ─── PATCH /projects/:id ──────────────────────────────────────────────────────

router.patch("/:id", async (req: Request, res: Response) => {
  res.json({
    project: { id: req.params.id },
    _placeholder: true,
  });
});

// ─── DELETE /projects/:id ─────────────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response) => {
  res.json({
    success: true,
    _placeholder: true,
    _todo: "Soft-delete only. Never hard-delete projects containing PHI.",
  });
});

export default router;
