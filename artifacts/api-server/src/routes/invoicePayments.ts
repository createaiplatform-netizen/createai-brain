/**
 * routes/invoicePayments.ts — Self-Hosted Invoice & Payment Rail
 * ─────────────────────────────────────────────────────────────────
 * Payment methods: Cash App ($CreateAIDigital) + Venmo (@CreateAIDigital)
 * No personal phone numbers or sensitive data exposed anywhere.
 * Both methods appear automatically on every generated invoice.
 * Invoice identity is driven by IDENTITY config → change BRAND_DOMAIN env var to update everywhere.
 *
 * POST  /api/payments/invoice/create    — create a professional invoice
 * GET   /api/payments/invoice/list      — list all invoices (owner only)
 * GET   /api/payments/invoice/:id       — get single invoice detail
 * POST  /api/payments/invoice/send      — email invoice to client
 * PATCH /api/payments/invoice/:id/status — update payment status
 * GET   /api/payments/invoice/:id/html  — render invoice as HTML (printable)
 * GET   /api/payments/methods           — list accepted payment methods
 * GET   /api/payments/summary           — full revenue summary
 * GET   /api/payments/daily-income      — today's collected income (real data)
 * POST  /api/payments/invoice/:id/mark-paid — quick mark-paid action
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { IDENTITY } from "../config/identity.js";

const router = Router();

/* ── Payment Methods Registry ────────────────────────────────────── */
// Only $CreateAIDigital handles. No personal phone numbers exposed.
export const PAYMENT_METHODS = [
  {
    id: "cashapp",
    name: "Cash App",
    handle: "$CreateAIDigital",
    icon: "💚",
    color: "#00d632",
    instructions: "Open Cash App and send to $CreateAIDigital. Include your invoice number in the note.",
    howTo: [
      "Open the Cash App on your phone",
      "Tap the $ icon to send money",
      "Search for $CreateAIDigital",
      "Enter the invoice total amount",
      "Add your invoice number in the note field",
      "Tap Pay — payment is instant"
    ],
    processingTime: "Instant",
    fees: "None",
    limit: "$7,500/week (unverified) · Unlimited (verified account)"
  },
  {
    id: "venmo",
    name: "Venmo",
    handle: "@CreateAIDigital",
    icon: "💙",
    color: "#3d95ce",
    instructions: "Open Venmo and pay @CreateAIDigital. Include your invoice number in the note.",
    howTo: [
      "Open the Venmo app on your phone",
      "Tap the Pay/Request button",
      "Search for @CreateAIDigital",
      "Enter the invoice total amount",
      "Set to Business payment (toggle if shown)",
      "Add your invoice number in the note field",
      "Tap Pay — payment is instant"
    ],
    processingTime: "Instant",
    fees: "None for personal · 1.9% + $0.10 for business payments",
    limit: "$4,999.99/week"
  }
];

/* ── In-memory invoice store ─────────────────────────────────────── */
interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  paidVia?: "cashapp" | "venmo";
  sentAt?: number;
  createdAt: number;
  updatedAt: number;
}

export const invoiceStore = new Map<string, Invoice>();
let invoiceCounter = 1000;

/* ── Helpers ─────────────────────────────────────────────────────── */
function nextInvoiceNumber(): string {
  invoiceCounter++;
  return `LTL-${invoiceCounter}`;
}

function calcTotals(lineItems: InvoiceLineItem[], taxRate: number) {
  const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, total };
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

/* ── Revenue summary (exported for Percentage Engine) ────────────── */
export function getInvoiceSummary() {
  const all = [...invoiceStore.values()];
  const paid = all.filter(i => i.status === "paid");
  const pending = all.filter(i => ["sent", "viewed"].includes(i.status));
  const overdue = all.filter(i => i.status === "overdue");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const paidToday = paid.filter(i => i.updatedAt >= todayMs);

  return {
    totalInvoices: all.length,
    paidCount: paid.length,
    paidTotal: paid.reduce((s, i) => s + i.total, 0),
    paidToday: paidToday.length,
    paidTodayTotal: paidToday.reduce((s, i) => s + i.total, 0),
    pendingCount: pending.length,
    pendingTotal: pending.reduce((s, i) => s + i.total, 0),
    overdueCount: overdue.length,
    overdueTotal: overdue.reduce((s, i) => s + i.total, 0),
    draftCount: all.filter(i => i.status === "draft").length,
    allStatuses: all.reduce((acc: Record<string, number>, i) => {
      acc[i.status] = (acc[i.status] ?? 0) + 1; return acc;
    }, {}),
    byMethod: {
      cashapp: paid.filter(i => i.paidVia === "cashapp").reduce((s, i) => s + i.total, 0),
      venmo:   paid.filter(i => i.paidVia === "venmo").reduce((s, i) => s + i.total, 0),
    }
  };
}

/* ── Invoice HTML renderer — both methods on every invoice ───────── */
function renderInvoiceHTML(inv: Invoice): string {
  const statusColor: Record<string, string> = {
    draft: "#94a3b8", sent: "#6366f1", viewed: "#a78bfa",
    paid: "#22c55e", overdue: "#ef4444", cancelled: "#475569"
  };

  const lineRows = inv.lineItems.map(item => [
    "<tr>",
    "<td style='padding:12px 0;border-bottom:1px solid #1e293b;color:#f1f5f9;'>", item.description, "</td>",
    "<td style='padding:12px 0;border-bottom:1px solid #1e293b;color:#94a3b8;text-align:center;'>", String(item.quantity), "</td>",
    "<td style='padding:12px 0;border-bottom:1px solid #1e293b;color:#94a3b8;text-align:right;'>", formatCurrency(item.unitPrice), "</td>",
    "<td style='padding:12px 0;border-bottom:1px solid #1e293b;color:#f1f5f9;text-align:right;font-weight:600;'>", formatCurrency(item.total), "</td>",
    "</tr>"
  ].join("")).join("");

  const taxRow = inv.taxRate > 0
    ? "<div style='display:flex;justify-content:space-between;padding:8px 0;color:#94a3b8;font-size:14px;'><span>Tax (" + inv.taxRate + "%)</span><span>" + formatCurrency(inv.taxAmount, inv.currency) + "</span></div>"
    : "";

  const notesSection = inv.notes
    ? "<div style='margin-top:32px;padding-top:24px;border-top:1px solid #1e293b;font-size:13px;color:#64748b;line-height:1.7;'><strong style='color:#94a3b8;'>Notes:</strong><br>" + inv.notes + "</div>"
    : "";

  const clientCompanyLine = inv.clientCompany ? "<div style='color:#94a3b8;font-size:13px;'>" + inv.clientCompany + "</div>" : "";
  const clientAddressLine = inv.clientAddress ? "<div style='color:#94a3b8;font-size:13px;'>" + inv.clientAddress + "</div>" : "";

  return "<!DOCTYPE html>" +
  "<html><head>" +
  "<meta charset='utf-8'>" +
  "<title>Invoice " + inv.invoiceNumber + " — CreateAI Brain</title>" +
  "<link rel='preconnect' href='https://fonts.googleapis.com'>" +
  "<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>" +
  "<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' rel='stylesheet'>" +
  "<style>" +
  "@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }" +
  "* { box-sizing: border-box; }" +
  "body { background: #020617; color: #f1f5f9; font-family: 'Inter', system-ui, -apple-system, sans-serif; margin: 0; padding: 40px; -webkit-font-smoothing: antialiased; }" +
  ".wrap { max-width: 820px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 48px; }" +
  ".hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }" +
  ".brand { font-size: 28px; font-weight: 900; color: #a5b4fc; letter-spacing: -1px; }" +
  ".brand-sub { font-size: 13px; color: #64748b; margin-top: 4px; }" +
  ".inv-num { font-size: 22px; font-weight: 700; color: #f1f5f9; text-align: right; }" +
  ".badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 8px; background: " + (statusColor[inv.status] ?? "#6366f1") + "22; color: " + (statusColor[inv.status] ?? "#6366f1") + "; border: 1px solid " + (statusColor[inv.status] ?? "#6366f1") + "55; }" +
  ".parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }" +
  ".party { background: #020617; border-radius: 8px; padding: 20px; }" +
  ".plabel { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }" +
  ".pname { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }" +
  ".dates { display: flex; gap: 24px; margin-bottom: 36px; }" +
  ".dblock { background: #020617; border-radius: 8px; padding: 16px 24px; flex: 1; }" +
  ".dlabel { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }" +
  ".dvalue { font-size: 15px; font-weight: 600; color: #f1f5f9; }" +
  "table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }" +
  "th { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 12px; border-bottom: 2px solid #1e293b; text-align: left; }" +
  "th:nth-child(2) { text-align: center; } th:nth-child(3), th:nth-child(4) { text-align: right; }" +
  ".totals { margin-left: auto; width: 280px; }" +
  ".trow { display: flex; justify-content: space-between; padding: 8px 0; color: #94a3b8; font-size: 14px; }" +
  ".tfinal { display: flex; justify-content: space-between; padding: 16px 0 0; border-top: 2px solid #6366f1; color: #f1f5f9; font-size: 18px; font-weight: 700; margin-top: 8px; }" +
  ".pay-section { margin-top: 40px; }" +
  ".pay-title { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }" +
  ".pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }" +
  ".pay-card { border-radius: 12px; padding: 20px; }" +
  ".pay-card-ca { background: #00200a; border: 1.5px solid #00d63240; }" +
  ".pay-card-vm { background: #001f30; border: 1.5px solid #3d95ce40; }" +
  ".pay-handle { font-size: 22px; font-weight: 900; margin: 8px 0; letter-spacing: -0.5px; }" +
  ".pay-handle-ca { color: #00d632; }" +
  ".pay-handle-vm { color: #3d95ce; }" +
  ".pay-steps { font-size: 12px; color: #94a3b8; line-height: 1.7; margin-top: 10px; }" +
  ".pay-steps li { margin-bottom: 3px; }" +
  ".footer { text-align: center; margin-top: 40px; font-size: 12px; color: #334155; line-height: 1.8; }" +
  ".print-btn { display: inline-block; background: #6366f1; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 24px; }" +
  "</style></head><body>" +
  "<div class='no-print' style='text-align:center;margin-bottom:24px;'>" +
  "<button class='print-btn' onclick='window.print()'>🖨️ Print / Save as PDF</button>" +
  "</div>" +
  "<div class='wrap'>" +
  "<div class='hdr'>" +
  "<div><div class='brand'>" + IDENTITY.platformName + "</div><div class='brand-sub'>" + IDENTITY.legalEntity + "</div><div class='brand-sub'>" + IDENTITY.brandDomain + "</div></div>" +
  "<div><div class='inv-num'>INVOICE " + inv.invoiceNumber + "</div><div class='badge'>" + inv.status.toUpperCase() + "</div></div>" +
  "</div>" +
  "<div class='parties'>" +
  "<div class='party'><div class='plabel'>Bill To</div><div class='pname'>" + inv.clientName + "</div>" + clientCompanyLine + "<div style='color:#94a3b8;font-size:13px;'>" + inv.clientEmail + "</div>" + clientAddressLine + "</div>" +
  "<div class='party'><div class='plabel'>From</div><div class='pname'>" + IDENTITY.platformName + "</div><div style='color:#94a3b8;font-size:13px;'>" + IDENTITY.legalEntity + "</div><div style='color:#94a3b8;font-size:13px;'>" + IDENTITY.brandDomain + "</div></div>" +
  "</div>" +
  "<div class='dates'>" +
  "<div class='dblock'><div class='dlabel'>Invoice Date</div><div class='dvalue'>" + inv.issueDate + "</div></div>" +
  "<div class='dblock'><div class='dlabel'>Due Date</div><div class='dvalue'>" + inv.dueDate + "</div></div>" +
  "<div class='dblock'><div class='dlabel'>Invoice #</div><div class='dvalue'>" + inv.invoiceNumber + "</div></div>" +
  "<div class='dblock'><div class='dlabel'>Currency</div><div class='dvalue'>" + inv.currency + "</div></div>" +
  "</div>" +
  "<table><thead><tr>" +
  "<th>Description</th><th style='text-align:center'>Qty</th><th style='text-align:right'>Unit Price</th><th style='text-align:right'>Total</th>" +
  "</tr></thead><tbody>" + lineRows + "</tbody></table>" +
  "<div class='totals'>" +
  "<div class='trow'><span>Subtotal</span><span>" + formatCurrency(inv.subtotal, inv.currency) + "</span></div>" +
  taxRow +
  "<div class='tfinal'><span>Total Due</span><span style='color:#a5b4fc;'>" + formatCurrency(inv.total, inv.currency) + "</span></div>" +
  "</div>" +
  "<div class='pay-section'>" +
  "<div class='pay-title'>How to Pay — Choose Either Method</div>" +
  "<div class='pay-grid'>" +
  "<div class='pay-card pay-card-ca'>" +
  "<div style='font-size:13px;font-weight:700;color:#86efac;'>💚 Cash App</div>" +
  "<div class='pay-handle pay-handle-ca'>$CreateAIDigital</div>" +
  "<div style='font-size:12px;color:#86efac;margin-bottom:8px;'>✓ Instant · No fees</div>" +
  "<ol class='pay-steps'>" +
  "<li>Open Cash App → tap $</li>" +
  "<li>Search <strong style='color:#00d632;'>$CreateAIDigital</strong></li>" +
  "<li>Enter amount: <strong style='color:#f1f5f9;'>" + formatCurrency(inv.total, inv.currency) + "</strong></li>" +
  "<li>Note: <strong style='color:#f1f5f9;'>" + inv.invoiceNumber + "</strong></li>" +
  "<li>Tap Pay ✓</li>" +
  "</ol>" +
  "</div>" +
  "<div class='pay-card pay-card-vm'>" +
  "<div style='font-size:13px;font-weight:700;color:#93c5fd;'>💙 Venmo</div>" +
  "<div class='pay-handle pay-handle-vm'>@CreateAIDigital</div>" +
  "<div style='font-size:12px;color:#93c5fd;margin-bottom:8px;'>✓ Instant</div>" +
  "<ol class='pay-steps'>" +
  "<li>Open Venmo → tap Pay/Request</li>" +
  "<li>Search <strong style='color:#3d95ce;'>@CreateAIDigital</strong></li>" +
  "<li>Enter amount: <strong style='color:#f1f5f9;'>" + formatCurrency(inv.total, inv.currency) + "</strong></li>" +
  "<li>Note: <strong style='color:#f1f5f9;'>" + inv.invoiceNumber + "</strong></li>" +
  "<li>Tap Pay ✓</li>" +
  "</ol>" +
  "</div>" +
  "</div>" +
  "</div>" +
  notesSection +
  "<div class='footer'>Thank you for your business! Questions? Email " + IDENTITY.contactEmail + "<br>" + IDENTITY.legalEntity + " · " + IDENTITY.platformName + " · " + IDENTITY.brandDomain + "<br>" + inv.invoiceNumber + " · Generated " + new Date().toLocaleDateString() + "</div>" +
  "</div>" +
  "</body></html>";
}

/* ── Email invoice helper ─────────────────────────────────────────── */
async function emailInvoice(inv: Invoice): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return false;

  const html = [
    "<!DOCTYPE html><html><head><meta charset='utf-8'><link rel='preconnect' href='https://fonts.googleapis.com'><link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' rel='stylesheet'></head>",
    "<body style='background:#020617;color:#f1f5f9;font-family:Inter,system-ui,-apple-system,sans-serif;padding:40px;max-width:600px;margin:0 auto;-webkit-font-smoothing:antialiased;'>",
    "<div style='text-align:center;margin-bottom:32px;'>",
    "<div style='font-size:28px;font-weight:900;color:#a5b4fc;'>CreateAI Brain</div>",
    "<div style='color:#64748b;font-size:13px;'>Lakeside Trinity LLC</div>",
    "</div>",
    "<div style='background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:32px;'>",
    "<h2 style='margin:0 0 8px;color:#f1f5f9;'>Invoice " + inv.invoiceNumber + "</h2>",
    "<p style='color:#94a3b8;margin:0 0 24px;'>Hi " + inv.clientName + ", here is your invoice from CreateAI Brain.</p>",
    "<table style='width:100%;border-collapse:collapse;margin-bottom:24px;'>",
    "<tr style='border-bottom:1px solid #1e293b;'><td style='padding:12px 0;color:#64748b;font-size:13px;'>Invoice #</td><td style='padding:12px 0;color:#f1f5f9;text-align:right;font-weight:600;'>" + inv.invoiceNumber + "</td></tr>",
    "<tr style='border-bottom:1px solid #1e293b;'><td style='padding:12px 0;color:#64748b;font-size:13px;'>Issue Date</td><td style='padding:12px 0;color:#f1f5f9;text-align:right;'>" + inv.issueDate + "</td></tr>",
    "<tr style='border-bottom:1px solid #1e293b;'><td style='padding:12px 0;color:#64748b;font-size:13px;'>Due Date</td><td style='padding:12px 0;color:#f1f5f9;text-align:right;'>" + inv.dueDate + "</td></tr>",
    "<tr><td style='padding:16px 0 4px;color:#94a3b8;font-size:16px;'>Total Due</td><td style='padding:16px 0 4px;color:#a5b4fc;text-align:right;font-size:22px;font-weight:900;'>" + formatCurrency(inv.total, inv.currency) + "</td></tr>",
    "</table>",
    "<div style='background:#020617;border-radius:10px;padding:20px;margin-bottom:20px;'>",
    "<div style='font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;'>How to Pay</div>",
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:12px;'>",
    "<div style='background:#00200a;border:1px solid #00d63230;border-radius:8px;padding:14px;'>",
    "<div style='font-weight:700;color:#86efac;font-size:12px;'>💚 Cash App</div>",
    "<div style='font-size:20px;font-weight:900;color:#00d632;margin:6px 0;'>$CreateAIDigital</div>",
    "<div style='font-size:11px;color:#86efac;'>Instant · No fees</div>",
    "<div style='font-size:11px;color:#94a3b8;margin-top:6px;'>Note: " + inv.invoiceNumber + "</div>",
    "</div>",
    "<div style='background:#001f30;border:1px solid #3d95ce30;border-radius:8px;padding:14px;'>",
    "<div style='font-weight:700;color:#93c5fd;font-size:12px;'>💙 Venmo</div>",
    "<div style='font-size:20px;font-weight:900;color:#3d95ce;margin:6px 0;'>@CreateAIDigital</div>",
    "<div style='font-size:11px;color:#93c5fd;'>Instant</div>",
    "<div style='font-size:11px;color:#94a3b8;margin-top:6px;'>Note: " + inv.invoiceNumber + "</div>",
    "</div>",
    "</div>",
    "</div>",
    "<p style='color:#64748b;font-size:13px;margin:0;line-height:1.6;'>Questions? Reply to this email or contact " + IDENTITY.contactEmail + "</p>",
    "</div>",
    "<p style='text-align:center;color:#334155;font-size:12px;margin-top:24px;'>" + IDENTITY.legalEntity + " · " + IDENTITY.platformName + " · " + IDENTITY.brandDomain + "</p>",
    "</body></html>"
  ].join("");

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: IDENTITY.fromHeader,
        to: [inv.clientEmail],
        subject: "Invoice " + inv.invoiceNumber + " — " + formatCurrency(inv.total, inv.currency) + " due " + inv.dueDate,
        html
      })
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/* ── GET /methods ────────────────────────────────────────────────── */
router.get("/methods", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    methods: PAYMENT_METHODS,
    summary: "Cash App ($CreateAIDigital) and Venmo (@CreateAIDigital) — both appear on every invoice automatically.",
    privacy: "No personal phone numbers or sensitive data is exposed. Only public payment handles are used."
  });
});

/* ── GET /summary ────────────────────────────────────────────────── */
router.get("/summary", (_req: Request, res: Response) => {
  res.json({ ok: true, summary: getInvoiceSummary() });
});

/* ── GET /daily-income ───────────────────────────────────────────── */
router.get("/daily-income", (_req: Request, res: Response) => {
  const s = getInvoiceSummary();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  res.json({
    ok: true,
    date: today,
    paidToday: s.paidToday,
    dailyTotal: s.paidTodayTotal,
    dailyTotalFormatted: formatCurrency(s.paidTodayTotal),
    byMethod: {
      cashapp: { count: 0, total: formatCurrency(0), handle: "$CreateAIDigital" },
      venmo:   { count: 0, total: formatCurrency(0), handle: "@CreateAIDigital" }
    },
    allTimeTotal: formatCurrency(s.paidTotal),
    allTimePaidCount: s.paidCount,
    note: s.paidTodayTotal === 0
      ? "No payments received today yet. Both payment rails are live and ready."
      : "Live revenue — collected today via Cash App or Venmo."
  });
});

/* ── GET /list ───────────────────────────────────────────────────── */
router.get("/list", (_req: Request, res: Response) => {
  const invoices = [...invoiceStore.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(inv => ({
      id: inv.id, invoiceNumber: inv.invoiceNumber, status: inv.status,
      clientName: inv.clientName, clientEmail: inv.clientEmail,
      total: inv.total, currency: inv.currency,
      issueDate: inv.issueDate, dueDate: inv.dueDate,
      paidVia: inv.paidVia, paymentDate: inv.paymentDate,
      createdAt: inv.createdAt
    }));
  res.json({ ok: true, count: invoices.length, invoices });
});

/* ── POST /create ────────────────────────────────────────────────── */
router.post("/create", (req: Request, res: Response) => {
  const b = req.body as Record<string, any>;
  if (!b.clientName || !b.clientEmail || !b.lineItems?.length) {
    res.status(400).json({ ok: false, error: "clientName, clientEmail, and lineItems are required" });
    return;
  }

  const lineItems: InvoiceLineItem[] = (b.lineItems as any[]).map(item => ({
    description: String(item.description ?? ""),
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.unitPrice ?? 0),
    total: Math.round(Number(item.quantity ?? 1) * Number(item.unitPrice ?? 0) * 100) / 100
  }));

  const taxRate = Number(b.taxRate ?? 0);
  const { subtotal, taxAmount, total } = calcTotals(lineItems, taxRate);
  const now = new Date();
  const dueDate = new Date(now.getTime() + (Number(b.netDays ?? 30)) * 86400000);

  const id = crypto.randomBytes(12).toString("hex");
  const invoice: Invoice = {
    id,
    invoiceNumber: nextInvoiceNumber(),
    status: "draft",
    clientName: String(b.clientName),
    clientEmail: String(b.clientEmail),
    clientCompany: b.clientCompany ? String(b.clientCompany) : undefined,
    clientAddress: b.clientAddress ? String(b.clientAddress) : undefined,
    issueDate: now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    dueDate: dueDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    lineItems,
    subtotal,
    taxRate,
    taxAmount,
    total,
    currency: String(b.currency ?? "USD"),
    notes: b.notes ? String(b.notes) : undefined,
    paymentMethod: "cashapp-venmo",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  invoiceStore.set(id, invoice);

  res.json({
    ok: true,
    invoice: { id, invoiceNumber: invoice.invoiceNumber, status: invoice.status, total, currency: invoice.currency },
    htmlUrl:   "/api/payments/invoice/" + id + "/html",
    clientUrl: "/api/payments/invoice/" + id + "/html",
    paymentMethods: ["$CreateAIDigital (Cash App)", "@CreateAIDigital (Venmo)"],
    shareNote: "Share the clientUrl link directly with your client — no email required. They see the full invoice with Cash App + Venmo payment instructions.",
    message:   "Invoice " + invoice.invoiceNumber + " created. Share the clientUrl link with your client to collect payment instantly."
  });
});

/* ── GET /:id ────────────────────────────────────────────────────── */
router.get("/:id", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  if (["list", "create", "send", "summary", "methods", "daily-income"].includes(id)) {
    res.status(404).json({ ok: false, error: "Route not found" }); return;
  }
  const inv = invoiceStore.get(id);
  if (!inv) { res.status(404).json({ ok: false, error: "Invoice not found" }); return; }
  res.json({ ok: true, invoice: inv });
});

/* ── GET /:id/html ───────────────────────────────────────────────── */
router.get("/:id/html", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const inv = invoiceStore.get(id);
  if (!inv) { res.status(404).send("<h1>Invoice not found</h1>"); return; }
  if (inv.status === "sent") { inv.status = "viewed"; inv.updatedAt = Date.now(); invoiceStore.set(id, inv); }
  res.setHeader("Content-Type", "text/html");
  res.send(renderInvoiceHTML(inv));
});

/* ── POST /:id/mark-paid ─────────────────────────────────────────── */
router.post("/:id/mark-paid", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const inv = invoiceStore.get(id);
  if (!inv) { res.status(404).json({ ok: false, error: "Invoice not found" }); return; }

  const { paidVia, paymentReference } = req.body as Record<string, string>;
  inv.status = "paid";
  inv.paidVia = (paidVia === "venmo" ? "venmo" : "cashapp") as "cashapp" | "venmo";
  inv.paymentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  if (paymentReference) inv.paymentReference = paymentReference;
  inv.updatedAt = Date.now();
  invoiceStore.set(id, inv);

  const s = getInvoiceSummary();
  res.json({
    ok: true,
    message: "Invoice " + inv.invoiceNumber + " marked as PAID via " + (inv.paidVia === "venmo" ? "@CreateAIDigital (Venmo)" : "$CreateAIDigital (Cash App)") + ".",
    invoice: { id, invoiceNumber: inv.invoiceNumber, status: "paid", total: inv.total, paidVia: inv.paidVia },
    allTimePaidTotal: s.paidTotal,
    todayPaidTotal: s.paidTodayTotal
  });
});

/* ── POST /send ──────────────────────────────────────────────────── */
router.post("/send", async (req: Request, res: Response) => {
  const { id } = req.body as Record<string, string>;
  if (!id) { res.status(400).json({ ok: false, error: "Invoice id required" }); return; }
  const inv = invoiceStore.get(id);
  if (!inv) { res.status(404).json({ ok: false, error: "Invoice not found" }); return; }

  const sent = await emailInvoice(inv);
  if (sent) { inv.status = "sent"; inv.sentAt = Date.now(); inv.updatedAt = Date.now(); invoiceStore.set(id, inv); }

  res.json({
    ok: true,
    sent,
    message: sent
      ? "Invoice " + inv.invoiceNumber + " sent to " + inv.clientEmail + " with Cash App + Venmo instructions."
      : "Email pending domain verification — share the HTML link directly.",
    htmlUrl: "/api/payments/invoice/" + id + "/html",
    invoiceNumber: inv.invoiceNumber,
    paymentMethods: ["$CreateAIDigital (Cash App)", "@CreateAIDigital (Venmo)"]
  });
});

/* ── PATCH /:id/status ───────────────────────────────────────────── */
router.patch("/:id/status", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const inv = invoiceStore.get(id);
  if (!inv) { res.status(404).json({ ok: false, error: "Invoice not found" }); return; }

  const { status, paymentDate, paymentReference, paidVia } = req.body as Record<string, string>;
  const validStatuses = ["draft", "sent", "viewed", "paid", "overdue", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ ok: false, error: "Invalid status. Must be one of: " + validStatuses.join(", ") });
    return;
  }

  inv.status = status as Invoice["status"];
  if (status === "paid") {
    inv.paymentDate = paymentDate ?? new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    if (paidVia === "venmo" || paidVia === "cashapp") inv.paidVia = paidVia;
  }
  if (paymentReference) inv.paymentReference = paymentReference;
  inv.updatedAt = Date.now();
  invoiceStore.set(id, inv);

  res.json({
    ok: true,
    message: "Invoice " + inv.invoiceNumber + " status updated to '" + status + "'",
    invoice: { id, invoiceNumber: inv.invoiceNumber, status: inv.status }
  });
});

export default router;
