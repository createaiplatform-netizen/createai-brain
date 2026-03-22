// ─── Data Export ──────────────────────────────────────────────────────────────
// Users can export all their data as portable JSON.
// No hard-coded format — designed for future migration to any host/provider.
// Admins can export audit logs. All other data is user-scoped.

import { Router, type Request, type Response } from "express";
import { getSql } from "../lib/db";

const router = Router();

// GET /api/export/my-data — exports all data for the authenticated user
router.get("/my-data", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = (req.user as { id: string }).id;
  const sql = getSql();

  const [
    userRow,
    identity,
    bills,
    bankAccount,
    bankTransactions,
    bankGoals,
    lifeEvents,
    habits,
    habitCompletions,
    contributions,
    journalEntries,
    conversations,
  ] = await Promise.all([
    sql`SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = ${userId}`,
    sql`SELECT * FROM platform_family_identities WHERE user_id = ${userId}`,
    sql`SELECT * FROM platform_bills WHERE user_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT * FROM platform_family_bank_accounts WHERE user_id = ${userId}`,
    sql`SELECT t.* FROM platform_family_bank_transactions t
        JOIN platform_family_bank_accounts a ON a.id = t.account_id
        WHERE a.user_id = ${userId} ORDER BY t.created_at DESC`,
    sql`SELECT * FROM platform_family_bank_goals WHERE user_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT * FROM platform_life_events WHERE user_id = ${userId} ORDER BY event_date ASC NULLS LAST`,
    sql`SELECT * FROM platform_habits WHERE user_id = ${userId} ORDER BY created_at ASC`,
    sql`SELECT hc.* FROM platform_habit_completions hc
        JOIN platform_habits h ON h.id = hc.habit_id
        WHERE h.user_id = ${userId} ORDER BY hc.done_on DESC`,
    sql`SELECT * FROM platform_contributions WHERE user_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT * FROM platform_journal_entries WHERE user_id = ${userId} ORDER BY entry_date DESC`,
    sql`SELECT id, name, type, participant_ids, created_at
        FROM platform_family_conversations WHERE ${userId} = ANY(participant_ids)`,
  ]);

  const exportPayload = {
    exportVersion: "1.0",
    exportedAt: new Date().toISOString(),
    notice: "This export contains your personal data from CreateAI Brain. It is portable and not locked to any specific host or provider.",
    user: userRow[0] ?? null,
    identity: identity[0] ?? null,
    bills,
    familyBank: {
      account: bankAccount[0] ?? null,
      transactions: bankTransactions,
      goals: bankGoals,
    },
    lifeEvents,
    habits,
    habitCompletions,
    contributions,
    journalEntries,
    conversationIds: conversations.map(c => c.id),
    note: "Message content is not included in export for privacy. Contact support to request a full message export.",
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="createai-export-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(exportPayload);
});

// GET /api/export/audit-logs — admin-only audit export
router.get("/audit-logs", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const sql = getSql();
  const actor = req.user as { id: string };
  const [actorRow] = await sql`SELECT role FROM users WHERE id = ${actor.id}`;
  if (!["admin", "founder"].includes(actorRow?.role as string)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  const events = await sql`
    SELECT al.*, u.email AS actor_email
    FROM platform_audit_logs al
    LEFT JOIN users u ON u.id = al.actor_id
    ORDER BY al.created_at DESC
    LIMIT 1000
  `;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="audit-export-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ exportVersion: "1.0", exportedAt: new Date().toISOString(), events });
});

export default router;
