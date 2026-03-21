/**
 * routes/invoicePayments.ts — Self-Hosted Invoice & Payment Rail
 * ──────────────────────────────────────────────────────────────
 * Professional invoice generation and multi-method payment tracking.
 * Accepts: Bank Transfer, ACH, Check, Zelle, Venmo (Business), Wire.
 * No Stripe required — bypasses charges_enabled: false restriction.
 * Delivers invoices via Resend email. Tracks all payment statuses internally.
 *
 * POST /api/payments/invoice/create    — create a professional invoice
 * GET  /api/payments/invoice/list      — list all invoices (owner only)
 * GET  /api/payments/invoice/:id       — get single invoice detail
 * POST /api/payments/invoice/send      — email invoice to client
 * PATCH /api/payments/invoice/:id/status — update payment status
 * GET  /api/payments/invoice/:id/html  — render invoice as HTML (printable)
 * GET  /api/payments/methods           — list accepted payment methods
 * GET  /api/payments/summary           — revenue summary
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";

const router = Router();

/* ── Payment Methods ─────────────────────────────────────────────── */
const PAYMENT_METHODS = [
  { id: "bank-transfer", name: "Bank Transfer (ACH)", instructions: "Contact admin@LakesideTrinity.com for banking details. Use invoice # as payment reference.", processingTime: "1-3 business days", fees: "None" },
  { id: "wire", name: "Wire Transfer", instructions: "Contact admin@LakesideTrinity.com for wire instructions. International wires accepted.", processingTime: "1-2 business days", fees: "Your bank's wire fee" },
  { id: "check", name: "Business Check", instructions: "Make check payable to 'Lakeside Trinity LLC'. Mail to address on invoice.", processingTime: "5-7 business days", fees: "None" },
  { id: "zelle", name: "Zelle (Business)", instructions: "Send to admin@LakesideTrinity.com via Zelle. Use invoice # in memo.", processingTime: "Instant", fees: "None", limit: "$5,000/day" },
  { id: "venmo-business", name: "Venmo (Business)", instructions: "Send to @LakesideTrinity on Venmo Business. Use invoice # in note.", processingTime: "Instant", fees: "1.9% + $0.10 (business)", limit: "$4,999.99/transaction" },
  { id: "paypal-invoice", name: "PayPal Invoice", instructions: "A PayPal invoice will be sent separately to your email if this method is selected.", processingTime: "Instant", fees: "2.99% + fixed fee", note: "PayPal invoicing available on request" },
  { id: "crypto", name: "Cryptocurrency", instructions: "BTC, ETH, USDC accepted. Contact admin@LakesideTrinity.com for wallet address.", processingTime: "10-60 minutes", fees: "Network gas fees only" }
];

/* ── In-memory invoice store ─────────────────────────────────────── */
interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
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
  sentAt?: number;
  createdAt: number;
  updatedAt: number;
}

const invoiceStore = new Map<string, Invoice>();
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

function renderInvoiceHTML(inv: Invoice): string {
  const method = PAYMENT_METHODS.find(m => m.id === inv.paymentMethod);
  const statusColor: Record<string, string> = {
    draft: "#94a3b8", sent: "#6366f1", viewed: "#a78bfa", paid: "#22c55e", overdue: "#ef4444", cancelled: "#475569"
  };
  const lineRows = inv.lineItems.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#f1f5f9;">${item.description}</td>
      <td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#94a3b8;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#94a3b8;text-align:right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #1e293b;color:#f1f5f9;text-align:right;font-weight:600;">${formatCurrency(item.total)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${inv.invoiceNumber} — CreateAI Brain</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }
    * { box-sizing: border-box; }
    body { background: #020617; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 40px; }
    .invoice-container { max-width: 820px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 48px; }
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .brand-name { font-size: 28px; font-weight: 900; color: #a5b4fc; letter-spacing: -1px; }
    .brand-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-number { font-size: 22px; font-weight: 700; color: #f1f5f9; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 8px; background: ${statusColor[inv.status] ?? "#6366f1"}22; color: ${statusColor[inv.status] ?? "#6366f1"}; border: 1px solid ${statusColor[inv.status] ?? "#6366f1"}55; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
    .party-block { background: #020617; border-radius: 8px; padding: 20px; }
    .party-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .party-name { font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
    .party-detail { font-size: 13px; color: #94a3b8; line-height: 1.6; }
    .dates-row { display: flex; gap: 24px; margin-bottom: 36px; }
    .date-block { background: #020617; border-radius: 8px; padding: 16px 24px; flex: 1; }
    .date-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .date-value { font-size: 15px; font-weight: 600; color: #f1f5f9; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 12px; border-bottom: 2px solid #1e293b; text-align: left; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
    .totals { margin-left: auto; width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; color: #94a3b8; font-size: 14px; }
    .total-final { display: flex; justify-content: space-between; padding: 16px 0 0; border-top: 2px solid #6366f1; color: #f1f5f9; font-size: 18px; font-weight: 700; margin-top: 8px; }
    .total-amount { color: #a5b4fc; }
    .payment-section { background: #020617; border-radius: 8px; padding: 24px; margin-top: 40px; }
    .payment-title { font-size: 14px; font-weight: 700; color: #a5b4fc; margin-bottom: 12px; }
    .payment-method { font-size: 15px; font-weight: 600; color: #f1f5f9; margin-bottom: 8px; }
    .payment-instructions { font-size: 13px; color: #94a3b8; line-height: 1.7; }
    .notes-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 13px; color: #64748b; line-height: 1.7; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #334155; line-height: 1.8; }
    .print-btn { display: inline-block; background: #6366f1; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 24px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:24px;">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="invoice-container">
    <div class="invoice-header">
      <div>
        <div class="brand-name">CreateAI Brain</div>
        <div class="brand-sub">Lakeside Trinity LLC</div>
        <div class="brand-sub">admin@LakesideTrinity.com</div>
        <div class="brand-sub">createaibrain.app</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-number">INVOICE ${inv.invoiceNumber}</div>
        <div class="status-badge">${inv.status.toUpperCase()}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party-block">
        <div class="party-label">Bill To</div>
        <div class="party-name">${inv.clientName}</div>
        ${inv.clientCompany ? `<div class="party-detail">${inv.clientCompany}</div>` : ""}
        <div class="party-detail">${inv.clientEmail}</div>
        ${inv.clientAddress ? `<div class="party-detail">${inv.clientAddress}</div>` : ""}
      </div>
      <div class="party-block">
        <div class="party-label">From</div>
        <div class="party-name">Sara Stadler</div>
        <div class="party-detail">Lakeside Trinity LLC</div>
        <div class="party-detail">admin@LakesideTrinity.com</div>
        <div class="party-detail">createaibrain.app</div>
      </div>
    </div>

    <div class="dates-row">
      <div class="date-block">
        <div class="date-label">Invoice Date</div>
        <div class="date-value">${inv.issueDate}</div>
      </div>
      <div class="date-block">
        <div class="date-label">Due Date</div>
        <div class="date-value">${inv.dueDate}</div>
      </div>
      <div class="date-block">
        <div class="date-label">Invoice #</div>
        <div class="date-value">${inv.invoiceNumber}</div>
      </div>
      <div class="date-block">
        <div class="date-label">Currency</div>
        <div class="date-value">${inv.currency}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${lineRows}</tbody>
    </table>

    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${formatCurrency(inv.subtotal, inv.currency)}</span></div>
      ${inv.taxRate > 0 ? `<div class="total-row"><span>Tax (${inv.taxRate}%)</span><span>${formatCurrency(inv.taxAmount, inv.currency)}</span></div>` : ""}
      <div class="total-final"><span>Total Due</span><span class="total-amount">${formatCurrency(inv.total, inv.currency)}</span></div>
    </div>

    ${method ? `<div class="payment-section">
      <div class="payment-title">PAYMENT INSTRUCTIONS</div>
      <div class="payment-method">${method.name}</div>
      <div class="payment-instructions">${method.instructions}</div>
      ${method.processingTime ? `<div class="payment-instructions">Processing time: ${method.processingTime}</div>` : ""}
    </div>` : ""}

    ${inv.notes ? `<div class="notes-section"><strong style="color:#94a3b8;">Notes:</strong><br>${inv.notes}</div>` : ""}

    <div class="footer">
      Thank you for your business. Questions? Contact admin@LakesideTrinity.com<br>
      Lakeside Trinity LLC · CreateAI Brain · createaibrain.app<br>
      ${inv.invoiceNumber} · Generated ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>`;
}

async function emailInvoice(inv: Invoice): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return false;
  const method = PAYMENT_METHODS.find(m => m.id === inv.paymentMethod);
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#020617;color:#f1f5f9;font-family:system-ui,sans-serif;padding:40px;max-width:600px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:28px;font-weight:900;color:#a5b4fc;">CreateAI Brain</div>
    <div style="color:#64748b;font-size:13px;">Lakeside Trinity LLC</div>
  </div>
  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:32px;">
    <h2 style="margin:0 0 8px;color:#f1f5f9;">Invoice ${inv.invoiceNumber}</h2>
    <p style="color:#94a3b8;margin:0 0 24px;">Hi ${inv.clientName}, please find your invoice details below.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:12px 0;color:#64748b;font-size:13px;">Invoice #</td>
        <td style="padding:12px 0;color:#f1f5f9;text-align:right;font-weight:600;">${inv.invoiceNumber}</td>
      </tr>
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:12px 0;color:#64748b;font-size:13px;">Issue Date</td>
        <td style="padding:12px 0;color:#f1f5f9;text-align:right;">${inv.issueDate}</td>
      </tr>
      <tr style="border-bottom:1px solid #1e293b;">
        <td style="padding:12px 0;color:#64748b;font-size:13px;">Due Date</td>
        <td style="padding:12px 0;color:#f1f5f9;text-align:right;">${inv.dueDate}</td>
      </tr>
      <tr>
        <td style="padding:16px 0 4px;color:#94a3b8;font-size:16px;">Total Due</td>
        <td style="padding:16px 0 4px;color:#a5b4fc;text-align:right;font-size:22px;font-weight:900;">${formatCurrency(inv.total, inv.currency)}</td>
      </tr>
    </table>
    ${method ? `<div style="background:#020617;border-radius:8px;padding:20px;margin-bottom:24px;">
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Payment Method</div>
      <div style="font-weight:700;color:#f1f5f9;margin-bottom:8px;">${method.name}</div>
      <div style="font-size:13px;color:#94a3b8;line-height:1.6;">${method.instructions}</div>
    </div>` : ""}
    <p style="color:#64748b;font-size:13px;margin:0;line-height:1.6;">Questions? Reply to this email or contact admin@LakesideTrinity.com</p>
  </div>
  <p style="text-align:center;color:#334155;font-size:12px;margin-top:24px;">Sara Stadler · Lakeside Trinity LLC · createaibrain.app</p>
</body>
</html>`;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Sara Stadler <admin@LakesideTrinity.com>",
        to: [inv.clientEmail],
        subject: `Invoice ${inv.invoiceNumber} — ${formatCurrency(inv.total, inv.currency)} due ${inv.dueDate}`,
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
  res.json({ ok: true, methods: PAYMENT_METHODS });
});

/* ── GET /summary ────────────────────────────────────────────────── */
router.get("/summary", (_req: Request, res: Response) => {
  const all = [...invoiceStore.values()];
  const paid = all.filter(i => i.status === "paid");
  const pending = all.filter(i => ["sent", "viewed"].includes(i.status));
  const overdue = all.filter(i => i.status === "overdue");

  res.json({
    ok: true,
    summary: {
      totalInvoices: all.length,
      paidCount: paid.length,
      paidTotal: paid.reduce((s, i) => s + i.total, 0),
      pendingCount: pending.length,
      pendingTotal: pending.reduce((s, i) => s + i.total, 0),
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((s, i) => s + i.total, 0),
      draftCount: all.filter(i => i.status === "draft").length,
      allStatuses: all.reduce((acc: Record<string, number>, i) => { acc[i.status] = (acc[i.status] ?? 0) + 1; return acc; }, {})
    }
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
    paymentMethod: b.paymentMethod ? String(b.paymentMethod) : "bank-transfer",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  invoiceStore.set(id, invoice);

  res.json({
    ok: true,
    invoice: { id, invoiceNumber: invoice.invoiceNumber, status: invoice.status, total, currency: invoice.currency },
    htmlUrl: `/api/payments/invoice/${id}/html`,
    message: "Invoice created successfully."
  });
});

/* ── GET /:id ────────────────────────────────────────────────────── */
router.get("/:id", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
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
    message: sent ? `Invoice ${inv.invoiceNumber} sent to ${inv.clientEmail}` : "Email unavailable — share the HTML link directly.",
    htmlUrl: `/api/payments/invoice/${id}/html`,
    invoiceNumber: inv.invoiceNumber
  });
});

/* ── PATCH /:id/status ───────────────────────────────────────────── */
router.patch("/:id/status", (req: Request, res: Response) => {
  const id = String(req.params["id"] ?? "");
  const inv = invoiceStore.get(id);
  if (!inv) { res.status(404).json({ ok: false, error: "Invoice not found" }); return; }

  const { status, paymentDate, paymentReference } = req.body as Record<string, string>;
  const validStatuses = ["draft", "sent", "viewed", "paid", "overdue", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ ok: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  inv.status = status as Invoice["status"];
  if (paymentDate) inv.paymentDate = paymentDate;
  if (paymentReference) inv.paymentReference = paymentReference;
  inv.updatedAt = Date.now();
  invoiceStore.set(id, inv);

  res.json({ ok: true, message: `Invoice ${inv.invoiceNumber} status updated to '${status}'`, invoice: { id, invoiceNumber: inv.invoiceNumber, status: inv.status } });
});

export default router;
