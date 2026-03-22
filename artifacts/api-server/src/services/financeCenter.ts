// ─── Finance Center ───────────────────────────────────────────────────────────
// Centralized finance-related outbound messages and summaries.
// Routes receipts, invoices, and reminders through the outbound engine.
// Designed so finance features can be expanded without refactor.
//
// Rules:
//   • Never initiates real money movement
//   • Every finance event is logged via outboundEngine
//   • "Bill pay" is a tracking/reminder tool only — not a payment processor
//   • FamilyBank is virtual only — clearly stated in every finance summary

import { getSql } from "../lib/db";
import { outboundEngine } from "./outboundEngine";
import { receiptTemplate, billReminderTemplate } from "./marketingKit";

// ─── Finance summary ──────────────────────────────────────────────────────────

export interface FinanceSummary {
  userId:             string;
  pendingBillsCount:  number;
  pendingBillsTotal:  number;
  overdueBillsCount:  number;
  familyBankBalance:  number;
  familyBankGoals:    number;
  exportedAt:         string;
  notice:             string;
}

export async function getFinanceSummary(userId: string): Promise<FinanceSummary> {
  const sql = getSql();

  const [billStats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')::int  AS pending_count,
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'pending'), 0)::int AS pending_total,
      COUNT(*) FILTER (WHERE status = 'overdue')::int  AS overdue_count
    FROM platform_bills WHERE user_id = ${userId}
  `;

  const [bankRow] = await sql`
    SELECT COALESCE(balance_cents, 0)::int AS balance
    FROM platform_family_bank_accounts WHERE user_id = ${userId}
  `;

  const [goalRow] = await sql`
    SELECT COUNT(*)::int AS goals FROM platform_family_bank_goals WHERE user_id = ${userId}
  `;

  return {
    userId,
    pendingBillsCount:  Number(billStats?.["pending_count"]  ?? 0),
    pendingBillsTotal:  Number(billStats?.["pending_total"]   ?? 0),
    overdueBillsCount:  Number(billStats?.["overdue_count"]   ?? 0),
    familyBankBalance:  Number(bankRow?.["balance"]           ?? 0),
    familyBankGoals:    Number(goalRow?.["goals"]             ?? 0),
    exportedAt:         new Date().toISOString(),
    notice:             "Family Bank is a virtual tracking tool. No real funds are held or transferred.",
  };
}

// ─── Finance outbound helpers ─────────────────────────────────────────────────

/** Sends a receipt email for a completed transaction. */
export async function sendReceiptEmail(params: {
  userId: string;
  email: string;
  userName: string;
  amountCents: number;
  description: string;
  transactionId: string;
}): Promise<void> {
  const { userId, email, userName, amountCents, description, transactionId } = params;
  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const tmpl = receiptTemplate({ userName, amountFormatted, description, transactionId, date });

  await outboundEngine.send({
    type:     "receipt",
    channel:  "email",
    to:       email,
    userId,
    role:     "customer",
    universe: "customer",
    subject:  tmpl.subject,
    body:     tmpl.html,
    metadata: { amountCents, transactionId },
  });
}

/** Sends a bill reminder notification email. */
export async function sendBillReminder(params: {
  userId: string;
  email: string;
  userName: string;
  billName: string;
  amountCents: number;
  dueDate: string;
  billId: string;
}): Promise<void> {
  const { userId, email, userName, billName, amountCents, dueDate, billId } = params;
  const amountFormatted = `$${(amountCents / 100).toFixed(2)}`;
  const tmpl = billReminderTemplate({ userName, billName, amountFormatted, dueDate });

  await outboundEngine.send({
    type:     "bill_reminder",
    channel:  "email",
    to:       email,
    userId,
    role:     "customer",
    universe: "customer",
    subject:  tmpl.subject,
    body:     tmpl.html,
    metadata: { billId, amountCents, dueDate },
  });
}

// ─── Future expansion stubs ───────────────────────────────────────────────────
// These are clean interfaces for finance features that will be added later.
// Implement the body when the feature is built — no core refactor needed.

/** Stub: Send invoice PDF. Implement when PDF generation is added. */
export async function sendInvoicePdf(_params: {
  userId: string; email: string; invoiceId: string;
}): Promise<void> {
  // TODO: generate PDF, attach to outboundEngine.send({ channel: "export", ... })
  console.log("[FinanceCenter] sendInvoicePdf stub — not yet implemented");
}

/** Stub: Export finance data for a user. */
export async function exportFinanceData(userId: string): Promise<Record<string, unknown>> {
  const summary = await getFinanceSummary(userId);
  const sql = getSql();
  const [bills, transactions] = await Promise.all([
    sql`SELECT * FROM platform_bills WHERE user_id = ${userId} ORDER BY created_at DESC`,
    sql`
      SELECT t.* FROM platform_family_bank_transactions t
      JOIN platform_family_bank_accounts a ON a.id = t.account_id
      WHERE a.user_id = ${userId} ORDER BY t.created_at DESC LIMIT 200
    `,
  ]);
  return { summary, bills, transactions };
}
