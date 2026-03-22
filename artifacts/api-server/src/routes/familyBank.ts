// ─── Family Bank ──────────────────────────────────────────────────────────────
// Virtual family bank: balances, goals, and transaction history.
// REAL MONEY NEVER MOVES HERE — this is a virtual points/rewards tracker.
// Actual payments always route through external providers with explicit approval.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

const VALID_TXN_TYPES = ["earn", "spend", "transfer", "reward", "goal_deposit"];

async function getOrCreateAccount(userId: string) {
  const sql = getSql();
  let [account] = await sql`
    SELECT * FROM platform_family_bank_accounts WHERE user_id = ${userId}
  `;
  if (!account) {
    [account] = await sql`
      INSERT INTO platform_family_bank_accounts (user_id, display_name)
      VALUES (${userId}, 'Family Bank')
      RETURNING *
    `;
  }
  return account;
}

// R-10: Shared virtual disclaimer injected into all account/transaction responses.
const VIRTUAL_META = {
  virtual: true,
  disclaimer: "Family Bank is a virtual points tracker. No real money moves here. Actual payments always require explicit approval through external payment providers.",
};

// GET /api/family-bank/account
router.get("/account", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const account = await getOrCreateAccount(userId);
  res.json({ account, ...VIRTUAL_META });
});

// GET /api/family-bank/accounts — admin: all family accounts with owner info
router.get("/accounts", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const sql = getSql();
  const actor = req.user as { id: string };
  const [actorRow] = await sql`SELECT role FROM users WHERE id = ${actor.id}`;
  if (!["admin", "founder", "family_adult"].includes(actorRow?.role as string)) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const accounts = await sql`
    SELECT fb.*, fi.display_name AS member_name, fi.avatar_emoji, u.role
    FROM platform_family_bank_accounts fb
    LEFT JOIN platform_family_identities fi ON fi.user_id = fb.user_id
    LEFT JOIN users u ON u.id = fb.user_id
    WHERE u.role IN ('family_adult', 'family_child')
    ORDER BY member_name ASC
  `;
  res.json({ accounts });
});

// GET /api/family-bank/transactions?limit=20
router.get("/transactions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const account = await getOrCreateAccount(userId);
  const sql = getSql();
  const transactions = await sql`
    SELECT * FROM platform_family_bank_transactions
    WHERE account_id = ${account.id as string}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  res.json({ transactions });
});

// POST /api/family-bank/transactions — Admin/adult can add transactions for any family member
// Body: { userId?, type, amountCents, reason, notes }
router.post("/transactions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const actor = req.user as { id: string };
  const { userId, type, amountCents, reason, notes } = req.body as {
    userId?: string;
    type?: string;
    amountCents?: number;
    reason?: string;
    notes?: string;
  };

  const sql = getSql();
  const [actorRow] = await sql`SELECT role FROM users WHERE id = ${actor.id}`;
  const targetUserId = userId ?? actor.id;

  // Only admin/founder/family_adult can add transactions for others
  if (targetUserId !== actor.id && !["admin", "founder", "family_adult"].includes(actorRow?.role as string)) {
    res.status(403).json({ error: "Not authorized to modify another user's bank" });
    return;
  }

  const txnType = VALID_TXN_TYPES.includes(type ?? "") ? type! : "earn";
  const amount = Math.abs(Math.round(amountCents ?? 0));
  if (amount === 0) {
    res.status(400).json({ error: "Amount must be greater than zero" });
    return;
  }

  const account = await getOrCreateAccount(targetUserId);
  const delta = txnType === "spend" ? -amount : amount;

  const [txn] = await sql`
    INSERT INTO platform_family_bank_transactions
      (account_id, user_id, type, amount_cents, reason, notes, approved_by)
    VALUES
      (${account.id as string}, ${targetUserId}, ${txnType}, ${amount}, ${reason ?? ""}, ${notes ?? null}, ${actor.id})
    RETURNING *
  `;

  // Update account balance
  await sql`
    UPDATE platform_family_bank_accounts
    SET balance_cents = balance_cents + ${delta}, updated_at = NOW()
    WHERE id = ${account.id as string}
  `;

  res.json({ transaction: txn, ...VIRTUAL_META });
});

// GET /api/family-bank/goals
router.get("/goals", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();
  const goals = await sql`
    SELECT * FROM platform_family_bank_goals
    WHERE user_id = ${userId}
    ORDER BY completed ASC, created_at DESC
  `;
  res.json({ goals });
});

// POST /api/family-bank/goals
router.post("/goals", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { name, emoji, targetCents, deadline } = req.body as {
    name?: string;
    emoji?: string;
    targetCents?: number;
    deadline?: string;
  };
  if (!name?.trim()) {
    res.status(400).json({ error: "Goal name is required" });
    return;
  }
  const sql = getSql();
  const [goal] = await sql`
    INSERT INTO platform_family_bank_goals
      (user_id, name, emoji, target_cents, deadline)
    VALUES
      (${userId}, ${name.trim()}, ${emoji ?? "🎯"}, ${Math.abs(targetCents ?? 0)}, ${deadline ? new Date(deadline) : null})
    RETURNING *
  `;
  res.json({ goal });
});

// PATCH /api/family-bank/goals/:id
router.patch("/goals/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const { name, emoji, targetCents, currentCents, deadline, completed } = req.body as {
    name?: string;
    emoji?: string;
    targetCents?: number;
    currentCents?: number;
    deadline?: string;
    completed?: boolean;
  };
  const sql = getSql();
  const [existing] = await sql`SELECT * FROM platform_family_bank_goals WHERE id = ${id} AND user_id = ${userId}`;
  if (!existing) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  const [updated] = await sql`
    UPDATE platform_family_bank_goals SET
      name          = ${name?.trim() ?? existing.name},
      emoji         = ${emoji ?? existing.emoji},
      target_cents  = ${Math.abs(targetCents ?? existing.target_cents)},
      current_cents = ${Math.abs(currentCents ?? existing.current_cents)},
      deadline      = ${deadline ? new Date(deadline) : existing.deadline},
      completed     = ${completed ?? existing.completed},
      updated_at    = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  res.json({ goal: updated });
});

// DELETE /api/family-bank/goals/:id
router.delete("/goals/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const { id } = req.params;
  const sql = getSql();
  await sql`DELETE FROM platform_family_bank_goals WHERE id = ${id} AND user_id = ${userId}`;
  res.json({ success: true });
});

export default router;
