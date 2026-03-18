import { Router, type Request, type Response } from "express";
// import { query } from "../db";

const router = Router();

// ─── FUTURE: Auth middleware will protect all routes in this file ─────────────
// import { requireAuth } from "../middleware/auth";
// router.use(requireAuth);

// ─── GET /users ───────────────────────────────────────────────────────────────
// Returns a list of users scoped to the authenticated user's organization.
//
// Future: Pull real users from the database.
// Future: Scope to req.user.organizationId so facilities only see their own staff.
// Future: Add pagination (limit/offset or cursor-based).
// Future: Add role filtering (?role=nurse&role=admin).
// Future: Emit audit log entry on access (HIPAA requirement).

router.get("/", async (_req: Request, res: Response) => {
  res.json({
    users: [],
    // Placeholder — real implementation will query the users table.
    // Schema will include: id, email, firstName, lastName, role, organizationId,
    //   createdAt, lastLoginAt, isActive, mfaEnabled.
    _placeholder: true,
  });
});

// ─── POST /users ──────────────────────────────────────────────────────────────
// Creates a new user within the caller's organization.
//
// Future: Validate body with Zod schema.
// Future: Hash password with bcrypt before storing.
// Future: Send welcome/invite email.
// Future: Emit audit log entry on creation.

router.post("/", async (_req: Request, res: Response) => {
  res.status(201).json({
    user: null,
    _placeholder: true,
    _todo: "Implement user creation with hashed password and org scoping.",
  });
});

// ─── GET /users/:id ───────────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response) => {
  res.json({
    user: { id: req.params.id },
    _placeholder: true,
  });
});

export default router;
