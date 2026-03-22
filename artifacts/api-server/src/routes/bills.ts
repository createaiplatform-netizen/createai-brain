// ─── Bill Pay Tracker ─────────────────────────────────────────────────────────
// Organizes bills, tracks payment methods, and requires explicit user approval.
// CANNOT withdraw money automatically — every payment requires user action.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

const VALID_METHODS = ["zelle", "cashapp", "venmo", "paypal", "stripe", "bank_transfer", "manual", "other"];
const VALID_STATUSES = ["pending", "approved", "paid", "overdue", "cancelled"];

// GET /api/bills
router.get("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();

  const bills = await sql`
    SELECT * FROM platform_bills
    WHERE user_id = ${userId}
    ORDER BY
      CASE status WHEN 'overdue' THEN 0 WHEN 'pending' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,
      due_date ASC NULLS LAST
  `;
  res.json({ bills });
});

// POST /api/bills
router.post("/", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { name, payee, amountCents, dueDate, paymentMethod, notes } = req.body as {
    name?: string;
    payee?: string;
    amountCents?: number;
    dueDate?: string;
    paymentMethod?: string;
    notes?: string;
  };

  if (!name?.trim()) {
    res.status(400).json({ error: "Bill name is required" });
    return;
  }

  const method = VALID_METHODS.includes(paymentMethod ?? "") ? paymentMethod! : "manual";
  const sql = getSql();

  const [bill] = await sql`
    INSERT INTO platform_bills (user_id, name, payee, amount_cents, due_date, payment_method, notes)
    VALUES (
      ${userId},
      ${name.trim()},
      ${payee?.trim() ?? ""},
      ${amountCents ?? 0},
      ${dueDate ? new Date(dueDate) : null},
      ${method},
      ${notes?.trim() ?? null}
    )
    RETURNING *
  `;
  res.json({ bill });
});

// PATCH /api/bills/:id
router.patch("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const { status, name, payee, amountCents, dueDate, paymentMethod, notes } = req.body as {
    status?: string;
    name?: string;
    payee?: string;
    amountCents?: number;
    dueDate?: string;
    paymentMethod?: string;
    notes?: string;
  };

  const sql = getSql();
  const [existing] = await sql`SELECT * FROM platform_bills WHERE id = ${id} AND user_id = ${userId}`;
  if (!existing) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }

  const newStatus = VALID_STATUSES.includes(status ?? "") ? status : existing.status;
  const approvedAt = newStatus === "approved" && existing.status !== "approved" ? new Date() : existing.approved_at;
  const paidAt = newStatus === "paid" && existing.status !== "paid" ? new Date() : existing.paid_at;

  const [updated] = await sql`
    UPDATE platform_bills SET
      name            = ${name?.trim() ?? existing.name},
      payee           = ${payee?.trim() ?? existing.payee},
      amount_cents    = ${amountCents ?? existing.amount_cents},
      due_date        = ${dueDate ? new Date(dueDate) : existing.due_date},
      payment_method  = ${VALID_METHODS.includes(paymentMethod ?? "") ? paymentMethod! : existing.payment_method},
      status          = ${newStatus},
      notes           = ${notes?.trim() ?? existing.notes},
      approved_at     = ${approvedAt},
      paid_at         = ${paidAt},
      updated_at      = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  res.json({ bill: updated });
});

// DELETE /api/bills/:id
router.delete("/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const sql = getSql();
  await sql`DELETE FROM platform_bills WHERE id = ${id} AND user_id = ${userId}`;
  res.json({ success: true });
});

// GET /api/bills/summary
router.get("/summary", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ pending: 0, totalCents: 0, overdue: 0 });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();
  const [row] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'overdue' OR (status = 'pending' AND due_date < NOW())) AS overdue,
      COALESCE(SUM(amount_cents) FILTER (WHERE status IN ('pending', 'overdue')), 0) AS total_due_cents
    FROM platform_bills WHERE user_id = ${userId}
  `;
  res.json({
    pending: Number(row?.pending ?? 0),
    overdue: Number(row?.overdue ?? 0),
    totalDueCents: Number(row?.total_due_cents ?? 0),
  });
});

export default router;
