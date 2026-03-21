/**
 * routes/moneyHub.ts — VAULT
 * ──────────────────────────
 * Sara's private payment command center. Stripe hidden behind the scenes.
 *
 * GET  /vault        → Vault dashboard (full HTML SPA)
 * GET  /vault/data   → Live financial data JSON (balance + payouts + charges + CRM)
 */

import { Router, type Request, type Response } from "express";
import { getUncachableStripeClient }             from "../services/integrations/stripeClient.js";
import { getCustomerStats, getCustomers }         from "../semantic/customerStore.js";
import { getPublicBaseUrl }                       from "../utils/publicUrl.js";

const router = Router();
const IS_PROD = process.env["REPLIT_DEPLOYMENT"] === "1";
const STRIPE_DASH = IS_PROD
  ? "https://dashboard.stripe.com"
  : "https://dashboard.stripe.com/test";

// ─────────────────────────────────────────────────────────────────────────────
// GET /data — live financial data JSON
// ─────────────────────────────────────────────────────────────────────────────
router.get("/data", async (_req: Request, res: Response) => {
  try {
    const stripe   = await getUncachableStripeClient();
    const crmStats = getCustomerStats();
    const customers = getCustomers();

    // Fetch in parallel
    const [balance, payouts, charges, transactions] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.payouts.list({ limit: 8 }),
      stripe.charges.list({ limit: 30 }),
      stripe.balanceTransactions.list({ limit: 60, type: "charge" }),
    ]);

    // Balance numbers (all in cents)
    const availableUSD = balance.available.find(b => b.currency === "usd");
    const pendingUSD   = balance.pending.find(b => b.currency === "usd");
    const availableCents = availableUSD?.amount ?? 0;
    const pendingCents   = pendingUSD?.amount ?? 0;
    const totalCents     = availableCents + pendingCents;

    // Payout history
    const payoutRows = payouts.data.map(p => ({
      id:          p.id,
      amountCents: p.amount,
      amountUSD:   fmt(p.amount),
      status:      p.status,        // "paid" | "pending" | "in_transit" | "failed"
      arrivalDate: new Date(p.arrival_date * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      createdAt:   new Date(p.created * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      method:      p.method,        // "standard" | "instant"
      bankLast4:   typeof p.destination === "string" ? "" : "",
    }));

    // Next payout (first in_transit or pending)
    const nextPayout = payoutRows.find(p => p.status === "in_transit" || p.status === "pending");

    // Recent charges
    const chargeRows = charges.data.map(c => ({
      id:           c.id,
      amountCents:  c.amount,
      amountUSD:    fmt(c.amount),
      status:       c.status,
      paid:         c.paid,
      refunded:     c.refunded,
      customerEmail: c.billing_details?.email ?? c.receipt_email ?? "",
      customerName:  c.billing_details?.name ?? "",
      description:   c.description ?? "",
      createdAt:     new Date(c.created * 1000).toISOString(),
      createdLabel:  new Date(c.created * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      stripeUrl:     `${STRIPE_DASH}/payments/${c.payment_intent ?? c.id}`,
      receiptUrl:    c.receipt_url ?? "",
    }));

    // Revenue by day (last 30 days) from balance transactions
    const thirtyDaysAgo = Date.now() - 30 * 86400 * 1000;
    const dailyRevenue: Record<string, number> = {};
    let grossThirtyDays = 0;
    for (const txn of transactions.data) {
      if (txn.created * 1000 < thirtyDaysAgo) continue;
      const day = new Date(txn.created * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyRevenue[day] = (dailyRevenue[day] ?? 0) + txn.amount;
      grossThirtyDays += txn.amount;
    }
    const dailySeries = Object.entries(dailyRevenue)
      .map(([day, cents]) => ({ day, amountUSD: parseFloat((cents / 100).toFixed(2)) }))
      .sort((a, b) => new Date(a.day + " 2025").getTime() - new Date(b.day + " 2025").getTime());

    // Gross from all charges (net of refunds)
    const grossAllCents  = chargeRows.filter(c => c.paid).reduce((s, c) => s + c.amountCents, 0);
    const refundedCents  = chargeRows.filter(c => c.refunded).reduce((s, c) => s + c.amountCents, 0);
    const paidCount      = chargeRows.filter(c => c.paid).length;

    res.json({
      ok: true,
      mode: IS_PROD ? "production" : "test",
      balance: {
        availableCents, pendingCents, totalCents,
        availableUSD: fmt(availableCents),
        pendingUSD:   fmt(pendingCents),
        totalUSD:     fmt(totalCents),
      },
      nextPayout: nextPayout ?? null,
      payouts: payoutRows,
      charges: chargeRows,
      revenue: {
        grossAllUSD:       fmt(grossAllCents),
        grossThirtyDaysUSD: fmt(grossThirtyDays),
        refundedUSD:       fmt(refundedCents),
        paidCharges:       paidCount,
        avgOrderUSD:       paidCount > 0 ? fmt(Math.round(grossAllCents / paidCount)) : "$0.00",
        dailySeries,
      },
      crm: {
        totalCustomers:   crmStats.totalCustomers,
        revenueUSD:       fmt(crmStats.totalRevenueCents),
        topProducts:      crmStats.topProducts.slice(0, 3),
        recentPurchases:  customers.slice(-5).reverse().map(c => ({
          email: c.email, name: c.name,
          product: c.productTitle, amount: fmt(c.priceCents),
          date: new Date(c.purchasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        })),
      },
      links: {
        moveMoney:       `${STRIPE_DASH}/balance/overview`,
        payoutSchedule:  `${STRIPE_DASH}/settings/payouts`,
        allPayouts:      `${STRIPE_DASH}/payouts`,
        allCharges:      `${STRIPE_DASH}/payments`,
        bankAccounts:    `${STRIPE_DASH}/settings/payouts`,
        taxDocuments:    `${STRIPE_DASH}/settings/tax-reporting`,
      },
    });
  } catch (e: unknown) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET / — Vault Dashboard HTML
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  const BASE = getPublicBaseUrl();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Vault — CreateAI Brain</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --indigo: #6366f1; --indigo-d: #4f46e5; --indigo-l: #ede9fe;
      --green: #10b981; --amber: #f59e0b; --red: #ef4444;
      --slate-50: #f8fafc; --slate-100: #f1f5f9; --slate-200: #e2e8f0;
      --slate-400: #94a3b8; --slate-500: #64748b; --slate-700: #334155;
      --slate-900: #0f172a; --slate-950: #020617;
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--slate-50); color: var(--slate-900); font-size: 14px; min-height: 100vh; }

    /* ── Header ── */
    .hdr { background: var(--slate-950); padding: 0 28px; }
    .hdr-inner { max-width: 1300px; margin: 0 auto; display: flex; align-items: center; height: 56px; gap: 20px; }
    .vault-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .vault-icon { width: 32px; height: 32px; background: var(--indigo); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
    .vault-name { font-size: 1rem; font-weight: 900; color: white; letter-spacing: -0.02em; }
    .vault-name small { font-size: 0.65rem; font-weight: 600; color: var(--slate-400); display: block; margin-top: -2px; letter-spacing: 0.05em; }
    .mode-chip { padding: 3px 10px; border-radius: 999px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; }
    .mode-test { background: rgba(245,158,11,0.2); color: #fcd34d; border: 1px solid rgba(245,158,11,0.3); }
    .mode-live { background: rgba(16,185,129,0.2); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
    .hdr-right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
    .hdr-link { font-size: 0.78rem; font-weight: 600; color: var(--slate-400); text-decoration: none; transition: color 0.15s; }
    .hdr-link:hover { color: white; }
    .refresh-btn { background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 6px 14px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .refresh-btn:hover { background: rgba(255,255,255,0.15); }
    .refresh-btn.spinning { opacity: 0.6; cursor: not-allowed; }

    /* ── Balance Hero ── */
    .balance-hero { background: linear-gradient(135deg, var(--slate-950) 0%, #1e1b4b 50%, var(--slate-950) 100%); padding: 40px 28px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .balance-inner { max-width: 1300px; margin: 0 auto; }
    .balance-label { font-size: 0.7rem; font-weight: 700; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .balance-amount { font-size: clamp(2.8rem, 6vw, 4.5rem); font-weight: 900; color: white; letter-spacing: -0.03em; line-height: 1; margin-bottom: 6px; }
    .balance-amount .cents { font-size: 0.45em; color: #818cf8; vertical-align: super; }
    .balance-sub { font-size: 0.85rem; color: var(--slate-400); margin-bottom: 28px; }
    .balance-split { display: flex; gap: 0; margin-bottom: 0; }
    .balance-tab { padding: 14px 24px; font-size: 0.8rem; font-weight: 700; color: var(--slate-400); border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
    .balance-tab.active { color: #818cf8; border-bottom-color: #818cf8; }
    .balance-kpi { display: flex; gap: 0; margin-left: auto; }
    .kpi { padding: 10px 20px; text-align: right; border-left: 1px solid rgba(255,255,255,0.06); }
    .kpi-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--slate-400); margin-bottom: 4px; }
    .kpi-value { font-size: 1.1rem; font-weight: 800; color: white; }

    /* ── Move Money Bar ── */
    .money-bar { background: white; border-bottom: 1px solid var(--slate-200); padding: 14px 28px; }
    .money-bar-inner { max-width: 1300px; margin: 0 auto; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .money-bar-left { flex: 1; }
    .payout-info { font-size: 0.85rem; font-weight: 600; color: var(--slate-700); }
    .payout-info span { color: var(--green); font-weight: 800; }
    .payout-sub { font-size: 0.75rem; color: var(--slate-400); margin-top: 2px; }
    .btn-move { display: inline-flex; align-items: center; gap: 8px; background: var(--indigo); color: white; text-decoration: none; border-radius: 10px; padding: 10px 22px; font-size: 0.88rem; font-weight: 800; transition: all 0.15s; white-space: nowrap; }
    .btn-move:hover { background: var(--indigo-d); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,0.3); }
    .btn-sm { display: inline-flex; align-items: center; gap: 5px; background: var(--slate-100); color: var(--slate-700); text-decoration: none; border-radius: 8px; padding: 8px 14px; font-size: 0.78rem; font-weight: 700; transition: all 0.15s; border: 1px solid var(--slate-200); white-space: nowrap; }
    .btn-sm:hover { border-color: var(--indigo); color: var(--indigo); background: var(--indigo-l); }

    /* ── Main Layout ── */
    .main { max-width: 1300px; margin: 0 auto; padding: 24px 28px; display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
    .main-col { min-width: 0; }

    /* ── Cards ── */
    .card { background: white; border-radius: 16px; border: 1px solid var(--slate-200); margin-bottom: 18px; overflow: hidden; }
    .card-hdr { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--slate-100); }
    .card-title { font-size: 0.82rem; font-weight: 800; color: var(--slate-900); }
    .card-meta { font-size: 0.72rem; color: var(--slate-400); }
    .card-body { padding: 20px; }

    /* ── Revenue chart (pure CSS bar chart) ── */
    .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 80px; padding: 0 4px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bar { width: 100%; background: var(--indigo); border-radius: 4px 4px 0 0; min-height: 2px; transition: height 0.3s; opacity: 0.85; }
    .bar:hover { opacity: 1; }
    .bar-lbl { font-size: 0.55rem; color: var(--slate-400); white-space: nowrap; transform: rotate(-45deg); transform-origin: top left; }

    /* ── Stats grid ── */
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px 20px; }
    .stat-box { background: var(--slate-50); border-radius: 10px; padding: 14px; border: 1px solid var(--slate-100); }
    .stat-label { font-size: 0.68rem; font-weight: 700; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
    .stat-value { font-size: 1.4rem; font-weight: 900; color: var(--indigo); line-height: 1; }
    .stat-sub { font-size: 0.7rem; color: var(--slate-400); margin-top: 3px; }

    /* ── Table ── */
    .tbl-wrap { overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; min-width: 540px; }
    thead th { padding: 10px 16px; text-align: left; font-size: 0.65rem; font-weight: 800; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1px solid var(--slate-100); white-space: nowrap; background: var(--slate-50); }
    tbody td { padding: 11px 16px; border-bottom: 1px solid var(--slate-50); vertical-align: middle; font-size: 0.82rem; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #fafbff; }

    /* ── Status pills ── */
    .pill { display: inline-block; border-radius: 999px; padding: 3px 10px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
    .pill-green { background: #d1fae5; color: #065f46; }
    .pill-amber { background: #fef3c7; color: #92400e; }
    .pill-blue  { background: #dbeafe; color: #1e40af; }
    .pill-gray  { background: var(--slate-100); color: var(--slate-500); }
    .pill-red   { background: #fee2e2; color: #991b1b; }

    /* ── Payout list ── */
    .payout-row { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--slate-50); }
    .payout-row:last-child { border-bottom: none; }
    .payout-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
    .payout-icon.paid { background: #d1fae5; }
    .payout-icon.transit { background: #dbeafe; }
    .payout-icon.pending { background: #fef3c7; }
    .payout-icon.failed { background: #fee2e2; }
    .payout-detail { flex: 1; min-width: 0; }
    .payout-amount { font-size: 0.9rem; font-weight: 800; color: var(--slate-900); }
    .payout-date { font-size: 0.72rem; color: var(--slate-400); margin-top: 1px; }
    .payout-status { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

    /* ── Customer list ── */
    .cust-row { display: flex; align-items: center; gap: 10px; padding: 10px 20px; border-bottom: 1px solid var(--slate-50); }
    .cust-row:last-child { border-bottom: none; }
    .cust-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--indigo-l); color: var(--indigo); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; flex-shrink: 0; }
    .cust-name { font-size: 0.82rem; font-weight: 700; color: var(--slate-900); }
    .cust-email { font-size: 0.72rem; color: var(--slate-400); }
    .cust-product { font-size: 0.72rem; color: var(--slate-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
    .cust-amount { font-size: 0.85rem; font-weight: 800; color: var(--indigo); margin-left: auto; flex-shrink: 0; }

    /* ── Quick links ── */
    .quick-link { display: flex; align-items: center; justify-content: space-between; padding: 11px 20px; border-bottom: 1px solid var(--slate-50); text-decoration: none; transition: background 0.1s; }
    .quick-link:last-child { border-bottom: none; }
    .quick-link:hover { background: var(--slate-50); }
    .ql-left { display: flex; align-items: center; gap: 10px; }
    .ql-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; flex-shrink: 0; }
    .ql-label { font-size: 0.82rem; font-weight: 700; color: var(--slate-900); }
    .ql-desc { font-size: 0.7rem; color: var(--slate-400); }
    .ql-arrow { font-size: 0.8rem; color: var(--slate-300); }

    /* ── Loading skeleton ── */
    .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; display: inline-block; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* ── Empty state ── */
    .empty { text-align: center; padding: 32px; color: var(--slate-400); font-size: 0.82rem; }

    /* ── Responsive ── */
    @media(max-width: 900px) { .main { grid-template-columns: 1fr; } }
    @media(max-width: 640px) { .main { padding: 16px; } .balance-hero { padding: 28px 16px 0; } .kpi { display: none; } }
  </style>
</head>
<body>

<!-- ── Header ── -->
<header class="hdr">
  <div class="hdr-inner">
    <a class="vault-logo" href="${BASE}/vault">
      <div class="vault-icon">🏦</div>
      <div class="vault-name">Vault <small>by CreateAI Brain</small></div>
    </a>
    <div class="mode-chip ${IS_PROD ? "mode-live" : "mode-test"}" id="mode-chip">
      ${IS_PROD ? "⚡ Live" : "🧪 Test"}
    </div>
    <div class="hdr-right">
      <a href="${BASE}/launch/" class="hdr-link">Launch Console</a>
      <a href="${BASE}/store" class="hdr-link">Store</a>
      <a href="${BASE}/hub" class="hdr-link">Hub</a>
      <button class="refresh-btn" onclick="loadData()" id="refresh-btn">↻ Refresh</button>
    </div>
  </div>
</header>

<!-- ── Balance Hero ── -->
<div class="balance-hero">
  <div class="balance-inner">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:20px;">
      <div>
        <div class="balance-label">Total Balance</div>
        <div class="balance-amount" id="total-balance"><span class="skeleton" style="width:220px;height:3rem;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
        <div class="balance-sub" id="balance-sub">Loading…</div>
      </div>
      <div class="balance-kpi">
        <div class="kpi">
          <div class="kpi-label">30-Day Revenue</div>
          <div class="kpi-value" id="kpi-30day">—</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Paid Charges</div>
          <div class="kpi-value" id="kpi-charges">—</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Avg Order</div>
          <div class="kpi-value" id="kpi-avg">—</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">CRM Customers</div>
          <div class="kpi-value" id="kpi-customers">—</div>
        </div>
      </div>
    </div>
    <div style="display:flex;align-items:center;">
      <div class="balance-split">
        <div class="balance-tab active">Overview</div>
      </div>
    </div>
  </div>
</div>

<!-- ── Move Money Bar ── -->
<div class="money-bar">
  <div class="money-bar-inner">
    <div class="money-bar-left">
      <div class="payout-info" id="payout-info">Checking payout status…</div>
      <div class="payout-sub" id="payout-sub">Standard schedule · 2–7 business days first payout · 2-day rolling after</div>
    </div>
    <a href="${STRIPE_DASH}/balance/overview" target="_blank" class="btn-move" id="move-money-btn">
      🏦 Move Money to Bank
    </a>
    <a href="${STRIPE_DASH}/payouts" target="_blank" class="btn-sm">All Payouts ↗</a>
    <a href="${STRIPE_DASH}/settings/payouts" target="_blank" class="btn-sm">⚙ Payout Settings</a>
  </div>
</div>

<!-- ── Main Content ── -->
<div class="main">

  <!-- LEFT COLUMN -->
  <div class="main-col">

    <!-- Revenue Summary Stats -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title">Revenue Summary</div>
        <div class="card-meta" id="revenue-updated">Live · from Stripe</div>
      </div>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Total Gross</div>
          <div class="stat-value" id="stat-gross">—</div>
          <div class="stat-sub">All paid charges</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Last 30 Days</div>
          <div class="stat-value" id="stat-30day">—</div>
          <div class="stat-sub">Balance transactions</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg Order Value</div>
          <div class="stat-value" id="stat-avg">—</div>
          <div class="stat-sub">Gross ÷ paid charges</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Available Now</div>
          <div class="stat-value" id="stat-available" style="color:#059669;">—</div>
          <div class="stat-sub">Ready for payout</div>
        </div>
      </div>

      <!-- Revenue bar chart -->
      <div style="padding:0 20px 20px;">
        <div style="font-size:0.7rem;font-weight:700;color:var(--slate-400);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px;">Daily Revenue — Last 30 Days</div>
        <div class="bar-chart" id="bar-chart">
          <div class="empty">Loading chart data…</div>
        </div>
      </div>
    </div>

    <!-- Recent Payments -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title">Recent Payments</div>
        <div class="card-meta">Last 30 from Stripe · <a href="${STRIPE_DASH}/payments" target="_blank" style="color:var(--indigo);font-weight:700;text-decoration:none;">View all ↗</a></div>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr><th>When</th><th>Customer</th><th>Amount</th><th>Status</th><th></th></tr>
          </thead>
          <tbody id="charges-body">
            <tr><td colspan="5" class="empty">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <!-- RIGHT COLUMN -->
  <div class="main-col">

    <!-- Payout History -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title">Payout History</div>
        <div class="card-meta"><a href="${STRIPE_DASH}/payouts" target="_blank" style="color:var(--indigo);font-weight:700;text-decoration:none;">View all ↗</a></div>
      </div>
      <div id="payouts-list"><div class="empty">Loading payouts…</div></div>
    </div>

    <!-- Recent Customers (CRM) -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title">Recent Customers</div>
        <div class="card-meta" id="crm-count">from your CRM</div>
      </div>
      <div id="customers-list"><div class="empty">Loading customers…</div></div>
    </div>

    <!-- Stripe Access Portal -->
    <div class="card" style="border:2px solid #ede9fe;">
      <div class="card-hdr" style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-bottom:1px solid #ddd6fe;">
        <div>
          <div class="card-title" style="color:#4c1d95;">Stripe Access Portal</div>
          <div class="card-meta" style="margin-top:2px;">Direct links — no searching, no guessing</div>
        </div>
        <div style="background:${IS_PROD ? "#d1fae5" : "#fef3c7"};color:${IS_PROD ? "#065f46" : "#92400e"};border-radius:999px;padding:3px 10px;font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">
          ${IS_PROD ? "⚡ Live Account" : "🧪 Test Account"}
        </div>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:10px;">

        <!-- View Balance -->
        <a href="${STRIPE_DASH}/balance/overview" target="_blank"
           style="display:flex;align-items:center;gap:14px;background:#6366f1;color:white;text-decoration:none;border-radius:12px;padding:14px 18px;transition:all 0.15s;border:none;"
           onmouseover="this.style.background='#4f46e5';this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 14px rgba(99,102,241,0.35)'"
           onmouseout="this.style.background='#6366f1';this.style.transform='';this.style.boxShadow=''">
          <div style="width:38px;height:38px;background:rgba(255,255,255,0.18);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">💰</div>
          <div style="flex:1;">
            <div style="font-size:0.9rem;font-weight:800;letter-spacing:-0.01em;">View Balance</div>
            <div style="font-size:0.72rem;opacity:0.8;margin-top:1px;">Available · Pending · Payout overview</div>
          </div>
          <div style="font-size:0.8rem;opacity:0.7;">↗</div>
        </a>

        <!-- View Payouts -->
        <a href="${STRIPE_DASH}/payouts" target="_blank"
           style="display:flex;align-items:center;gap:14px;background:#f5f3ff;color:#4c1d95;text-decoration:none;border-radius:12px;padding:14px 18px;transition:all 0.15s;border:2px solid #ddd6fe;"
           onmouseover="this.style.background='#ede9fe';this.style.borderColor='#a78bfa';this.style.transform='translateY(-1px)'"
           onmouseout="this.style.background='#f5f3ff';this.style.borderColor='#ddd6fe';this.style.transform=''">
          <div style="width:38px;height:38px;background:#ede9fe;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">🏦</div>
          <div style="flex:1;">
            <div style="font-size:0.9rem;font-weight:800;letter-spacing:-0.01em;">View Payouts</div>
            <div style="font-size:0.72rem;color:#7c3aed;margin-top:1px;">History · Status · Bank transfers</div>
          </div>
          <div style="font-size:0.8rem;color:#a78bfa;">↗</div>
        </a>

        <!-- Recover Stripe Login -->
        <a href="https://dashboard.stripe.com/forgot-password" target="_blank"
           style="display:flex;align-items:center;gap:14px;background:#fafafa;color:#334155;text-decoration:none;border-radius:12px;padding:14px 18px;transition:all 0.15s;border:1.5px solid #e2e8f0;"
           onmouseover="this.style.background='#f1f5f9';this.style.borderColor='#94a3b8';this.style.transform='translateY(-1px)'"
           onmouseout="this.style.background='#fafafa';this.style.borderColor='#e2e8f0';this.style.transform=''">
          <div style="width:38px;height:38px;background:#f1f5f9;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">🔑</div>
          <div style="flex:1;">
            <div style="font-size:0.9rem;font-weight:800;letter-spacing:-0.01em;">Recover Stripe Login</div>
            <div style="font-size:0.72rem;color:#64748b;margin-top:1px;">Reset password · Regain account access</div>
          </div>
          <div style="font-size:0.8rem;color:#94a3b8;">↗</div>
        </a>

        <div style="font-size:0.7rem;color:#94a3b8;text-align:center;padding-top:4px;">
          Opens stripe.com in a new tab · Your account: <strong style="color:#64748b;">admin@LakesideTrinity.com</strong>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title">Quick Actions</div>
      </div>
      <div>
        ${[
          { icon: "🏦", bg: "#ede9fe", label: "Move Money to Bank", desc: "Trigger payout to your bank account", url: `${STRIPE_DASH}/balance/overview` },
          { icon: "📋", bg: "#dbeafe", label: "All Transactions", desc: "Full payment and payout history", url: `${STRIPE_DASH}/payments` },
          { icon: "🧾", bg: "#d1fae5", label: "Tax Documents", desc: "1099-K and annual summaries", url: `${STRIPE_DASH}/settings/tax-reporting` },
          { icon: "⚙️", bg: "#fef3c7", label: "Payout Schedule", desc: "Change to instant or custom schedule", url: `${STRIPE_DASH}/settings/payouts` },
          { icon: "🚀", bg: "#f0fdf4", label: "Launch Console", desc: "Deliver products to customers", url: `${BASE}/launch/` },
          { icon: "📊", bg: "#faf5ff", label: "Platform Analytics", desc: "Capability scores and domain health", url: `${BASE}/api/semantic/analytics/` },
        ].map(a => `
        <a href="${a.url}" target="${a.url.startsWith("http") && !a.url.includes("localhost") ? "_blank" : "_self"}" class="quick-link">
          <div class="ql-left">
            <div class="ql-icon" style="background:${a.bg};">${a.icon}</div>
            <div>
              <div class="ql-label">${a.label}</div>
              <div class="ql-desc">${a.desc}</div>
            </div>
          </div>
          <div class="ql-arrow">↗</div>
        </a>`).join("")}
      </div>
    </div>

  </div>
</div>

<script>
let _data = null;

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60)  return Math.round(diff) + 's ago';
  if (diff < 3600) return Math.round(diff/60) + 'm ago';
  if (diff < 86400) return Math.round(diff/3600) + 'h ago';
  return Math.round(diff/86400) + 'd ago';
}

function statusPill(status, paid, refunded) {
  if (refunded) return '<span class="pill pill-amber">Refunded</span>';
  if (paid && status === 'succeeded') return '<span class="pill pill-green">Paid</span>';
  if (status === 'pending') return '<span class="pill pill-blue">Pending</span>';
  if (status === 'failed')  return '<span class="pill pill-red">Failed</span>';
  return '<span class="pill pill-gray">' + status + '</span>';
}

function payoutIcon(status) {
  if (status === 'paid')       return { cls: 'paid',    icon: '✅' };
  if (status === 'in_transit') return { cls: 'transit', icon: '🚀' };
  if (status === 'pending')    return { cls: 'pending', icon: '⏳' };
  if (status === 'failed')     return { cls: 'failed',  icon: '❌' };
  return { cls: '', icon: '•' };
}

function payoutStatusColor(status) {
  if (status === 'paid')       return 'color:#059669;';
  if (status === 'in_transit') return 'color:#2563eb;';
  if (status === 'pending')    return 'color:#d97706;';
  if (status === 'failed')     return 'color:#dc2626;';
  return 'color:var(--slate-400);';
}

// ── Load Data ──────────────────────────────────────────────────────────────
async function loadData() {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('spinning');
  btn.textContent = '↻ Loading…';

  try {
    const resp = await fetch('/vault/data');
    const d = await resp.json();
    if (!d.ok) throw new Error(d.error || 'API error');
    _data = d;
    render(d);
  } catch (err) {
    console.error(err);
    document.getElementById('balance-sub').textContent = 'Error loading data: ' + err.message;
  } finally {
    btn.classList.remove('spinning');
    btn.textContent = '↻ Refresh';
  }
}

// ── Render ─────────────────────────────────────────────────────────────────
function render(d) {
  // Balance hero
  const [whole, dec] = d.balance.totalUSD.replace('$','').split('.');
  document.getElementById('total-balance').innerHTML =
    '<span class="cents">$</span>' + whole.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',') + '<span class="cents">.' + (dec||'00') + '</span>';
  document.getElementById('balance-sub').textContent =
    d.balance.availableUSD + ' available · ' + d.balance.pendingUSD + ' pending';

  // KPI row
  document.getElementById('kpi-30day').textContent    = d.revenue.grossThirtyDaysUSD;
  document.getElementById('kpi-charges').textContent  = d.revenue.paidCharges;
  document.getElementById('kpi-avg').textContent      = d.revenue.avgOrderUSD;
  document.getElementById('kpi-customers').textContent = d.crm.totalCustomers;

  // Payout info bar
  if (d.nextPayout) {
    document.getElementById('payout-info').innerHTML =
      'Next payout: <span>' + d.nextPayout.amountUSD + '</span> · arriving ' + d.nextPayout.arrivalDate + ' · ' + d.nextPayout.status.replace('_',' ').toUpperCase();
  } else if (d.balance.availableCents > 0) {
    document.getElementById('payout-info').innerHTML =
      '<span>' + d.balance.availableUSD + '</span> available — click Move Money to initiate a payout';
  } else {
    document.getElementById('payout-info').textContent = 'No pending payouts · balance will grow as sales come in';
  }

  // Revenue stats
  document.getElementById('stat-gross').textContent     = d.revenue.grossAllUSD;
  document.getElementById('stat-30day').textContent     = d.revenue.grossThirtyDaysUSD;
  document.getElementById('stat-avg').textContent       = d.revenue.avgOrderUSD;
  document.getElementById('stat-available').textContent = d.balance.availableUSD;
  document.getElementById('revenue-updated').textContent = 'Live · ' + new Date().toLocaleTimeString();

  // Bar chart
  const series = d.revenue.dailySeries;
  const chartEl = document.getElementById('bar-chart');
  if (!series.length) {
    chartEl.innerHTML = '<div class="empty" style="width:100%">No revenue data yet — share a product link to start selling.</div>';
  } else {
    const maxVal = Math.max(...series.map(s => s.amountUSD), 0.01);
    chartEl.innerHTML = series.map(s => {
      const pct = Math.max(4, Math.round((s.amountUSD / maxVal) * 100));
      const tip = s.day + ': ' + (s.amountUSD > 0 ? '$' + s.amountUSD.toFixed(2) : '$0');
      return '<div class="bar-col" title="' + tip + '">'
        + '<div class="bar" style="height:' + pct + '%;' + (s.amountUSD > 0 ? '' : 'background:var(--slate-200);') + '"></div>'
        + '</div>';
    }).join('');
  }

  // Charges table
  const chargesEl = document.getElementById('charges-body');
  if (!d.charges.length) {
    chargesEl.innerHTML = '<tr><td colspan="5" class="empty">No charges yet. Share a product link to start selling.</td></tr>';
  } else {
    chargesEl.innerHTML = d.charges.map(c => {
      const email = c.customerEmail || '—';
      const name  = c.customerName  || '';
      const shortEmail = email.length > 28 ? email.slice(0, 28) + '…' : email;
      return '<tr>'
        + '<td style="color:var(--slate-400);white-space:nowrap;">' + timeAgo(c.createdAt) + '</td>'
        + '<td><div style="font-weight:600;">' + shortEmail + '</div>'
        + (name ? '<div style="font-size:0.72rem;color:var(--slate-400);">' + name + '</div>' : '') + '</td>'
        + '<td style="font-weight:800;color:var(--indigo);">' + c.amountUSD + '</td>'
        + '<td>' + statusPill(c.status, c.paid, c.refunded) + '</td>'
        + '<td style="white-space:nowrap;">'
        + '<a href="' + c.stripeUrl + '" target="_blank" style="font-size:0.72rem;color:var(--indigo);font-weight:700;text-decoration:none;">View ↗</a>'
        + (c.receiptUrl ? ' &nbsp;<a href="' + c.receiptUrl + '" target="_blank" style="font-size:0.72rem;color:var(--slate-400);font-weight:600;text-decoration:none;">Receipt</a>' : '')
        + '</td>'
        + '</tr>';
    }).join('');
  }

  // Payouts
  const payoutsEl = document.getElementById('payouts-list');
  if (!d.payouts.length) {
    payoutsEl.innerHTML = '<div class="empty">No payouts yet. Your first payout arrives 7 days after your first sale.</div>';
  } else {
    payoutsEl.innerHTML = d.payouts.map(p => {
      const pi = payoutIcon(p.status);
      return '<div class="payout-row">'
        + '<div class="payout-icon ' + pi.cls + '">' + pi.icon + '</div>'
        + '<div class="payout-detail">'
        + '<div class="payout-amount">' + p.amountUSD + '</div>'
        + '<div class="payout-date">Initiated ' + p.createdAt + ' · arrives ' + p.arrivalDate + '</div>'
        + '</div>'
        + '<div class="payout-status" style="' + payoutStatusColor(p.status) + '">' + p.status.replace('_',' ') + '</div>'
        + '</div>';
    }).join('');
  }

  // Recent customers (CRM)
  const custEl = document.getElementById('customers-list');
  document.getElementById('crm-count').textContent = d.crm.totalCustomers + ' total in CRM';
  if (!d.crm.recentPurchases.length) {
    custEl.innerHTML = '<div class="empty">No customers yet. Make your first sale to see them here.</div>';
  } else {
    custEl.innerHTML = d.crm.recentPurchases.map(c => {
      const initials = (c.name || c.email).slice(0, 2).toUpperCase();
      return '<div class="cust-row">'
        + '<div class="cust-avatar">' + initials + '</div>'
        + '<div style="flex:1;min-width:0;">'
        + '<div class="cust-name">' + (c.name || 'Customer') + '</div>'
        + '<div class="cust-email">' + c.email + '</div>'
        + '<div class="cust-product">' + c.product + '</div>'
        + '</div>'
        + '<div>'
        + '<div class="cust-amount">' + c.amount + '</div>'
        + '<div style="font-size:0.68rem;color:var(--slate-400);text-align:right;">' + c.date + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
loadData();

// Auto-refresh every 60 seconds
setInterval(loadData, 60000);
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

export default router;
