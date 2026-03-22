// ─── Audit Log ────────────────────────────────────────────────────────────────
// Records key platform events: logins, device trust changes, role changes,
// payment triggers, and admin actions. Admin-only read access. Not surveillance.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

const VALID_EVENT_TYPES = [
  "login", "logout",
  "device_trusted", "device_removed", "biometric_registered",
  "phone_verified",
  "role_changed", "user_suspended", "user_restored",
  "payment_approved", "payment_triggered",
  "bill_created", "bill_approved", "bill_paid",
  "bank_transaction", "bank_goal_created",
  "nda_signed",
  "admin_action",
  "consent_given",
  "data_exported",
];

// Middleware: admin-only
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

// POST /api/audit/log — internal use: log an event
// Called by other routes; also exposed as an endpoint for explicit logging
export async function logEvent(
  actorId: string,
  eventType: string,
  details: Record<string, unknown> = {},
  options: { targetId?: string; targetType?: string; ipAddress?: string } = {}
): Promise<void> {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO platform_audit_logs
        (actor_id, event_type, target_id, target_type, details, ip_address)
      VALUES
        (${actorId}, ${eventType}, ${options.targetId ?? null}, ${options.targetType ?? null},
         ${JSON.stringify(details)}, ${options.ipAddress ?? null})
    `;
  } catch (err) {
    console.error("[audit] Log write failed:", err);
  }
}

// GET /api/audit/events?limit=50&offset=0&type=&actorId=
router.get("/events", async (req: Request, res: Response) => {
  if (!(await requireAdmin(req, res))) return;

  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const offset = Number(req.query.offset ?? 0);
  const { type, actorId } = req.query as { type?: string; actorId?: string };
  const sql = getSql();

  const events = await sql`
    SELECT al.*, u.email AS actor_email, u.first_name AS actor_first_name
    FROM platform_audit_logs al
    LEFT JOIN users u ON u.id = al.actor_id
    WHERE TRUE
      ${type ? sql`AND al.event_type = ${type}` : sql``}
      ${actorId ? sql`AND al.actor_id = ${actorId}` : sql``}
    ORDER BY al.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [countRow] = await sql`SELECT COUNT(*)::int AS total FROM platform_audit_logs`;

  res.json({ events, total: countRow?.total ?? 0 });
});

// GET /api/audit/types — list of valid event types
router.get("/types", (_req: Request, res: Response) => {
  res.json({ types: VALID_EVENT_TYPES });
});

// POST /api/audit/log — explicit log (admin or internal)
router.post("/log", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const actor = req.user as { id: string };
  const { eventType, details, targetId, targetType } = req.body as {
    eventType?: string;
    details?: Record<string, unknown>;
    targetId?: string;
    targetType?: string;
  };

  if (!eventType) {
    res.status(400).json({ error: "eventType is required" });
    return;
  }

  await logEvent(
    actor.id,
    eventType,
    details ?? {},
    { targetId, targetType, ipAddress: req.ip }
  );

  res.json({ success: true });
});

export default router;
