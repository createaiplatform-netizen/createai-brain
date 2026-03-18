import { Router, type Request, type Response } from "express";
import { query } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// ─── GET /audit ───────────────────────────────────────────────────────────────
// Returns audit log entries scoped to the authenticated user's organization.
// Query params:
//   ?limit=100           (default 100, max 500)
//   ?offset=0            (pagination)
//   ?action=LOGIN        (filter by action)
//   ?resource=patient    (filter by resource type)
//   ?userId=<uuid>       (filter by user)
//   ?from=2024-01-01     (ISO date, inclusive)
//   ?to=2024-12-31       (ISO date, inclusive)
//
// Admins see all events in their org.
// Super-admins see all events across all orgs.

router.get("/", requireRole("admin", "super_admin"), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;

  const limit  = Math.min(parseInt((req.query.limit  as string) ?? "100", 10), 500);
  const offset = Math.max(parseInt((req.query.offset as string) ?? "0",   10), 0);
  const action   = req.query.action   as string | undefined;
  const resource = req.query.resource as string | undefined;
  const userId   = req.query.userId   as string | undefined;
  const from     = req.query.from     as string | undefined;
  const to       = req.query.to       as string | undefined;

  try {
    const conditions: string[] = [];
    const values: unknown[]    = [];
    let   idx = 1;

    // Org scoping (super_admin bypasses)
    if (req.user.role !== "super_admin") {
      conditions.push(`a.org_id = $${idx++}`);
      values.push(req.user.organizationId);
    }

    if (action)   { conditions.push(`a.action = $${idx++}`);     values.push(action); }
    if (resource) { conditions.push(`a.resource = $${idx++}`);   values.push(resource); }
    if (userId)   { conditions.push(`a.user_id = $${idx++}`);    values.push(userId); }
    if (from)     { conditions.push(`a.occurred_at >= $${idx++}`); values.push(new Date(from)); }
    if (to)       { conditions.push(`a.occurred_at <= $${idx++}`); values.push(new Date(to)); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query<{
      id:          string;
      occurred_at: Date;
      user_id:     string | null;
      user_email:  string | null;
      org_id:      string | null;
      action:      string;
      resource:    string;
      resource_id: string | null;
      ip_address:  string | null;
      metadata:    object | null;
    }>(
      `SELECT a.id, a.occurred_at, a.user_id, a.user_email, a.org_id,
              a.action, a.resource, a.resource_id, a.ip_address, a.metadata
       FROM audit_log a
       ${where}
       ORDER BY a.occurred_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset]
    );

    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM audit_log a ${where}`,
      values
    );

    res.json({
      entries: rows.map((r) => ({
        id:         r.id,
        occurredAt: r.occurred_at,
        userId:     r.user_id,
        userEmail:  r.user_email,
        orgId:      r.org_id,
        action:     r.action,
        resource:   r.resource,
        resourceId: r.resource_id,
        ipAddress:  r.ip_address,
        metadata:   r.metadata,
      })),
      total:  parseInt(countRows[0]?.count ?? "0", 10),
      limit,
      offset,
    });
  } catch (err) {
    console.error("[audit] GET /audit:", err);
    res.status(500).json({ error: "Failed to load audit log." });
  }
});

// ─── GET /audit/actions ───────────────────────────────────────────────────────
// Returns the distinct action types in the log (for filter dropdowns).

router.get("/actions", requireRole("admin", "super_admin"), async (req: Request, res: Response): Promise<void> => {
  if (!req.user) return;
  try {
    const rows = await query<{ action: string }>(
      `SELECT DISTINCT action FROM audit_log
       ${req.user.role !== "super_admin" ? "WHERE org_id = $1" : ""}
       ORDER BY action`,
      req.user.role !== "super_admin" ? [req.user.organizationId] : []
    );
    res.json({ actions: rows.map((r) => r.action) });
  } catch (err) {
    res.status(500).json({ error: "Failed to load audit actions." });
  }
});

export default router;
