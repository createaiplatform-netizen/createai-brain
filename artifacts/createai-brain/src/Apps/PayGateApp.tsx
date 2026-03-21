import { useState, useEffect, useCallback } from "react";

const API = "/api";

type Invoice = {
  id: string; invoiceNumber: string; status: string;
  clientName: string; clientEmail: string;
  total: number; currency: string;
  issueDate: string; dueDate: string; createdAt: number;
  paidVia?: string; paymentDate?: string;
};

type Summary = {
  totalInvoices: number; paidCount: number; paidTotal: number;
  pendingCount: number; pendingTotal: number; overdueCount: number;
  overdueTotal: number; draftCount: number;
  paidToday?: number; paidTodayTotal?: number;
  byMethod?: { cashapp: number; venmo: number };
};

type DailyIncome = {
  date: string; paidToday: number; dailyTotal: number;
  dailyTotalFormatted: string; allTimeTotal: string;
  allTimePaidCount: number; note: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  draft:     { bg: "rgba(148,163,184,0.10)", text: "#94a3b8", border: "rgba(148,163,184,0.20)" },
  sent:      { bg: "rgba(99,102,241,0.12)",  text: "#818cf8", border: "rgba(99,102,241,0.25)"  },
  viewed:    { bg: "rgba(167,139,250,0.12)", text: "#c4b5fd", border: "rgba(167,139,250,0.25)" },
  paid:      { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", border: "rgba(34,197,94,0.25)"   },
  overdue:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171", border: "rgba(239,68,68,0.25)"   },
  cancelled: { bg: "rgba(71,85,105,0.12)",   text: "#64748b", border: "rgba(71,85,105,0.20)"   },
};

function fmt(n: number, cur = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  return (
    <span style={{ background: c.bg, color: c.text, border: "1px solid " + c.border, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
      {status.toUpperCase()}
    </span>
  );
}

// ── Payment Method Cards ──────────────────────────────────────────────────────
function PaymentMethodBanner() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
      {/* Cash App */}
      <div style={{ background: "#001a08", border: "1.5px solid rgba(0,214,50,0.30)", borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>💚</span>
          <span style={{ fontWeight: 800, color: "#86efac", fontSize: 14 }}>Cash App</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#4ade80", background: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>INSTANT · FREE</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#00d632", letterSpacing: "-0.03em", marginBottom: 4 }}>$CreateAIDigital</div>
        <div style={{ fontSize: 12, color: "#86efac", lineHeight: 1.5 }}>Clients send to this handle on Cash App and include the invoice number in the note.</div>
      </div>
      {/* Venmo */}
      <div style={{ background: "#001220", border: "1.5px solid rgba(61,149,206,0.30)", borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>💙</span>
          <span style={{ fontWeight: 800, color: "#93c5fd", fontSize: 14 }}>Venmo</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#60a5fa", background: "rgba(59,130,246,0.15)", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>INSTANT</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#3d95ce", letterSpacing: "-0.03em", marginBottom: 4 }}>@CreateAIDigital</div>
        <div style={{ fontSize: 12, color: "#93c5fd", lineHeight: 1.5 }}>Clients send to this handle on Venmo and include the invoice number in the note.</div>
      </div>
    </div>
  );
}

export default function PayGateApp() {
  const [tab, setTab] = useState<"dashboard" | "invoices" | "create" | "methods" | "markpaid">("dashboard");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DailyIncome | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [markPaid, setMarkPaid] = useState<{ inv: Invoice; via: string; ref: string } | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<{ id: string; status: string; ref: string; via: string } | null>(null);

  const [newInvoice, setNewInvoice] = useState({
    clientName: "", clientEmail: "", clientCompany: "", clientAddress: "",
    currency: "USD", taxRate: "0", netDays: "30", notes: "",
    lineItems: [{ description: "CreateAI Brain — Professional Plan", quantity: "1", unitPrice: "297" }]
  });

  const loadAll = useCallback(() => {
    return Promise.all([
      fetch(API + "/payments/invoice/list", { credentials: "include" }).then(r => r.json()).catch(() => ({ ok: false })),
      fetch(API + "/payments/summary", { credentials: "include" }).then(r => r.json()).catch(() => ({ ok: false })),
      fetch(API + "/payments/daily-income", { credentials: "include" }).then(r => r.json()).catch(() => ({ ok: false })),
    ]).then(([inv, sum, daily]) => {
      if (inv.ok) setInvoices(inv.invoices);
      if (sum.ok) setSummary(sum.summary);
      if (daily.ok) setDaily(daily);
    });
  }, []);

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, [loadAll]);

  function addLineItem() {
    setNewInvoice(f => ({ ...f, lineItems: [...f.lineItems, { description: "", quantity: "1", unitPrice: "0" }] }));
  }
  function removeLineItem(i: number) {
    setNewInvoice(f => ({ ...f, lineItems: f.lineItems.filter((_, j) => j !== i) }));
  }
  function updateLineItem(i: number, field: string, value: string) {
    setNewInvoice(f => ({ ...f, lineItems: f.lineItems.map((item, j) => j === i ? { ...item, [field]: value } : item) }));
  }

  function calcTotal() {
    const sub = newInvoice.lineItems.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);
    const tax = sub * (Number(newInvoice.taxRate) / 100);
    return { subtotal: sub, tax, total: sub + tax };
  }

  async function createInvoice() {
    if (!newInvoice.clientName || !newInvoice.clientEmail) {
      setMsg({ text: "Client name and email are required.", ok: false }); return;
    }
    const lineItems = newInvoice.lineItems.map(i => ({
      description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice),
      total: Number(i.quantity) * Number(i.unitPrice)
    }));
    const r = await fetch(API + "/payments/invoice/create", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newInvoice, taxRate: Number(newInvoice.taxRate), netDays: Number(newInvoice.netDays), lineItems })
    });
    const d = await r.json();
    setMsg({ text: d.ok ? "Invoice " + d.invoice.invoiceNumber + " created (" + fmt(d.invoice.total) + "). Cash App + Venmo printed automatically." : d.error, ok: d.ok });
    if (d.ok) { loadAll(); setTab("invoices"); }
  }

  async function sendInvoice(id: string) {
    setSending(id);
    const r = await fetch(API + "/payments/invoice/send", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const d = await r.json();
    setMsg({ text: d.ok ? d.message : d.error, ok: d.ok });
    setSending(null); loadAll();
  }

  async function submitMarkPaid() {
    if (!markPaid) return;
    const r = await fetch(API + "/payments/invoice/" + markPaid.inv.id + "/mark-paid", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidVia: markPaid.via, paymentReference: markPaid.ref })
    });
    const d = await r.json();
    setMsg({ text: d.ok ? d.message : d.error, ok: d.ok });
    setMarkPaid(null); loadAll();
  }

  async function updateStatus() {
    if (!statusUpdate) return;
    const r = await fetch(API + "/payments/invoice/" + statusUpdate.id + "/status", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusUpdate.status, paymentReference: statusUpdate.ref, paidVia: statusUpdate.via })
    });
    const d = await r.json();
    setMsg({ text: d.ok ? d.message : d.error, ok: d.ok });
    setStatusUpdate(null); loadAll();
  }

  const S = {
    card: { background: "#0f172a", border: "1px solid rgba(30,41,59,1)", borderRadius: 14, padding: "18px 20px" } as React.CSSProperties,
    label: { fontSize: 11, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 4 } as React.CSSProperties,
    input: { width: "100%", background: "#020617", border: "1px solid rgba(30,41,59,1)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f1f5f9", outline: "none" } as React.CSSProperties,
    btn: { padding: "8px 18px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "#020617" }}>
      <div style={{ textAlign: "center", color: "#94a3b8" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
        <div style={{ fontSize: 14 }}>Loading PayGate…</div>
      </div>
    </div>
  );

  const TABS = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "invoices",  label: "📄 Invoices" },
    { id: "create",    label: "➕ Create Invoice" },
    { id: "methods",   label: "💚💙 Payment Methods" },
  ] as const;

  const { total: newTotal, subtotal: newSub, tax: newTax } = calcTotal();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#020617", color: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ padding: "16px 20px 0", borderBottom: "1px solid rgba(30,41,59,1)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em" }}>PayGate — Payment Rail</h1>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>$CreateAIDigital (Cash App) · @CreateAIDigital (Venmo) · Both on every invoice</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", padding: "4px 10px", borderRadius: 99 }}>
            STRIPE-INDEPENDENT
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: "8px 14px", background: "none", border: "none", borderBottom: tab === t.id ? "2.5px solid #6366f1" : "2.5px solid transparent", color: tab === t.id ? "#818cf8" : "#64748b", fontWeight: tab === t.id ? 700 : 500, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px" }}>
        {msg && (
          <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.ok ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", color: msg.ok ? "#4ade80" : "#f87171", border: "1px solid " + (msg.ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)") }}>
            {msg.text}
            <button onClick={() => setMsg(null)} style={{ marginLeft: 10, background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PaymentMethodBanner />

            {/* Revenue stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Today's Income", value: daily ? daily.dailyTotalFormatted : "$0.00", sub: daily ? daily.note : "", color: "#4ade80" },
                { label: "All-Time Collected", value: summary ? fmt(summary.paidTotal) : "$0.00", sub: summary ? summary.paidCount + " paid invoice" + (summary.paidCount !== 1 ? "s" : "") : "", color: "#818cf8" },
                { label: "Outstanding", value: summary ? fmt(summary.pendingTotal) : "$0.00", sub: summary ? summary.pendingCount + " pending" : "", color: "#fbbf24" },
                { label: "Total Invoices", value: String(summary?.totalInvoices ?? 0), sub: summary ? summary.draftCount + " draft · " + summary.overdueCount + " overdue" : "", color: "#38bdf8" },
              ].map(s => (
                <div key={s.label} style={S.card}>
                  <div style={S.label}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color, letterSpacing: "-0.03em", margin: "4px 0" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Quick info */}
            <div style={{ ...S.card, background: "rgba(99,102,241,0.06)", border: "1.5px solid rgba(99,102,241,0.15)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", marginBottom: 10 }}>💡 How it works</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
                Every invoice you create automatically includes instructions for both <strong style={{ color: "#00d632" }}>$CreateAIDigital (Cash App)</strong> and <strong style={{ color: "#3d95ce" }}>@CreateAIDigital (Venmo)</strong>. Clients pay by sending to either handle and adding the invoice number in the note. Once confirmed, mark the invoice as paid here — it logs instantly to your revenue tracker.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setTab("create")} style={S.btn}>➕ Create Invoice</button>
              <button onClick={() => setTab("invoices")} style={{ ...S.btn, background: "#1e293b" }}>📄 View All Invoices</button>
            </div>
          </div>
        )}

        {/* ── INVOICES ── */}
        {tab === "invoices" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {invoices.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
                <div style={{ color: "#64748b", marginBottom: 16 }}>No invoices yet. Create your first one to start collecting payments.</div>
                <button onClick={() => setTab("create")} style={S.btn}>Create First Invoice</button>
              </div>
            ) : (
              <>
                {/* Mark paid modal */}
                {markPaid && (
                  <div style={{ ...S.card, border: "1.5px solid rgba(34,197,94,0.30)", background: "rgba(0,20,10,0.8)" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>✅ Mark Invoice as Paid — {markPaid.inv.invoiceNumber}</div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={S.label}>Paid via</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        {[{ id: "cashapp", label: "💚 Cash App ($CreateAIDigital)", color: "#00d632" }, { id: "venmo", label: "💙 Venmo (@CreateAIDigital)", color: "#3d95ce" }].map(m => (
                          <button key={m.id} onClick={() => setMarkPaid(p => p ? { ...p, via: m.id } : null)}
                            style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1.5px solid " + (markPaid.via === m.id ? m.color : "rgba(30,41,59,1)"), background: markPaid.via === m.id ? m.color + "22" : "#020617", color: markPaid.via === m.id ? m.color : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={S.label}>Payment Reference (optional)</div>
                      <input value={markPaid.ref} onChange={e => setMarkPaid(p => p ? { ...p, ref: e.target.value } : null)}
                        placeholder="Transaction ID, note, or confirmation" style={{ ...S.input, marginTop: 4 }} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={submitMarkPaid} style={{ ...S.btn, background: "#16a34a" }}>✅ Confirm Paid</button>
                      <button onClick={() => setMarkPaid(null)} style={{ ...S.btn, background: "#1e293b" }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Status update panel */}
                {statusUpdate && (
                  <div style={{ ...S.card, border: "1.5px solid rgba(99,102,241,0.25)" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Update Invoice Status</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={S.label}>Status</div>
                        <select value={statusUpdate.status} onChange={e => setStatusUpdate(s => s ? { ...s, status: e.target.value } : null)}
                          style={{ ...S.input, marginTop: 4 }}>
                          {["draft", "sent", "viewed", "paid", "overdue", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={S.label}>Reference (optional)</div>
                        <input value={statusUpdate.ref} onChange={e => setStatusUpdate(s => s ? { ...s, ref: e.target.value } : null)}
                          placeholder="Transaction ID or ref" style={{ ...S.input, marginTop: 4 }} />
                      </div>
                    </div>
                    {statusUpdate.status === "paid" && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={S.label}>Paid via</div>
                        <select value={statusUpdate.via} onChange={e => setStatusUpdate(s => s ? { ...s, via: e.target.value } : null)}
                          style={{ ...S.input, marginTop: 4 }}>
                          <option value="cashapp">Cash App ($CreateAIDigital)</option>
                          <option value="venmo">Venmo (@CreateAIDigital)</option>
                        </select>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={updateStatus} style={S.btn}>Update</button>
                      <button onClick={() => setStatusUpdate(null)} style={{ ...S.btn, background: "#1e293b" }}>Cancel</button>
                    </div>
                  </div>
                )}

                {invoices.map(inv => (
                  <div key={inv.id} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 900, fontSize: 15 }}>{inv.invoiceNumber}</span>
                          <StatusBadge status={inv.status} />
                          {inv.paidVia && (
                            <span style={{ fontSize: 11, color: inv.paidVia === "cashapp" ? "#00d632" : "#3d95ce" }}>
                              {inv.paidVia === "cashapp" ? "💚 $CreateAIDigital" : "💙 @CreateAIDigital"}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: "#94a3b8" }}>{inv.clientName} · {inv.clientEmail}</div>
                        {inv.paymentDate && <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>Paid {inv.paymentDate}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: inv.status === "paid" ? "#4ade80" : "#818cf8", letterSpacing: "-0.03em" }}>{fmt(inv.total, inv.currency)}</div>
                        <div style={{ fontSize: 11, color: "#475569" }}>Due {inv.dueDate}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                      <a href={API + "/payments/invoice/" + inv.id + "/html"} target="_blank" rel="noreferrer"
                        style={{ padding: "6px 12px", background: "#1e293b", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#94a3b8", textDecoration: "none" }}>
                        🖨️ View / Print
                      </a>
                      {inv.status === "draft" && (
                        <button onClick={() => sendInvoice(inv.id)} disabled={sending === inv.id}
                          style={{ ...S.btn, fontSize: 12, padding: "6px 12px", opacity: sending === inv.id ? 0.5 : 1 }}>
                          {sending === inv.id ? "Sending…" : "📧 Email to Client"}
                        </button>
                      )}
                      {inv.status !== "paid" && inv.status !== "cancelled" && (
                        <button onClick={() => setMarkPaid({ inv, via: "cashapp", ref: "" })}
                          style={{ ...S.btn, fontSize: 12, padding: "6px 12px", background: "#16a34a" }}>
                          ✅ Mark Paid
                        </button>
                      )}
                      <button onClick={() => setStatusUpdate({ id: inv.id, status: inv.status, ref: "", via: "cashapp" })}
                        style={{ ...S.btn, fontSize: 12, padding: "6px 12px", background: "#1e293b", color: "#94a3b8" }}>
                        ✏️ Update Status
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── CREATE INVOICE ── */}
        {tab === "create" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Always-on payment notice */}
            <div style={{ background: "rgba(0,214,50,0.06)", border: "1.5px solid rgba(0,214,50,0.20)", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#86efac", marginBottom: 4 }}>💚💙 Both payment methods print automatically</div>
              <div style={{ fontSize: 12, color: "#4ade80" }}>Cash App ($CreateAIDigital) and Venmo (@CreateAIDigital) instructions appear on every invoice — no configuration needed.</div>
            </div>

            {/* Client info */}
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Client Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  ["Client Name *", "clientName", "Sara Johnson"],
                  ["Client Email *", "clientEmail", "client@company.com"],
                  ["Company (optional)", "clientCompany", "Acme Corp LLC"],
                  ["Address (optional)", "clientAddress", "123 Main St, City, ST 12345"],
                ].map(([l, k, ph]) => (
                  <div key={k}>
                    <div style={S.label}>{l}</div>
                    <input value={(newInvoice as any)[k]} onChange={e => setNewInvoice(f => ({ ...f, [k]: e.target.value }))}
                      placeholder={ph} style={{ ...S.input, marginTop: 4 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Invoice Settings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <div style={S.label}>Currency</div>
                  <select value={newInvoice.currency} onChange={e => setNewInvoice(f => ({ ...f, currency: e.target.value }))} style={{ ...S.input, marginTop: 4 }}>
                    {["USD", "EUR", "GBP", "CAD", "AUD"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={S.label}>Net Days</div>
                  <select value={newInvoice.netDays} onChange={e => setNewInvoice(f => ({ ...f, netDays: e.target.value }))} style={{ ...S.input, marginTop: 4 }}>
                    {["7", "14", "21", "30", "45", "60"].map(d => <option key={d} value={d}>Net {d}</option>)}
                  </select>
                </div>
                <div>
                  <div style={S.label}>Tax Rate (%)</div>
                  <input type="number" value={newInvoice.taxRate} onChange={e => setNewInvoice(f => ({ ...f, taxRate: e.target.value }))}
                    min="0" max="50" step="0.1" style={{ ...S.input, marginTop: 4 }} />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Line Items</div>
                <button onClick={addLineItem} style={{ ...S.btn, background: "#1e293b", color: "#94a3b8", fontSize: 12, padding: "6px 12px" }}>+ Add Item</button>
              </div>
              {newInvoice.lineItems.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr auto auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input value={item.description} onChange={e => updateLineItem(i, "description", e.target.value)}
                    placeholder="Description" style={{ ...S.input, fontSize: 12 }} />
                  <input type="number" value={item.quantity} onChange={e => updateLineItem(i, "quantity", e.target.value)}
                    placeholder="Qty" min="1" style={{ ...S.input, fontSize: 12 }} />
                  <input type="number" value={item.unitPrice} onChange={e => updateLineItem(i, "unitPrice", e.target.value)}
                    placeholder="Price" min="0" step="0.01" style={{ ...S.input, fontSize: 12 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", whiteSpace: "nowrap" as const }}>{fmt(Number(item.quantity) * Number(item.unitPrice))}</span>
                  {newInvoice.lineItems.length > 1 && (
                    <button onClick={() => removeLineItem(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 12, background: "#020617", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 4 }}>
                <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#64748b" }}><span>Subtotal</span><span>{fmt(newSub)}</span></div>
                {Number(newInvoice.taxRate) > 0 && <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#64748b" }}><span>Tax ({newInvoice.taxRate}%)</span><span>{fmt(newTax)}</span></div>}
                <div style={{ display: "flex", gap: 20, fontSize: 16, fontWeight: 900 }}><span style={{ color: "#94a3b8" }}>Total</span><span style={{ color: "#818cf8" }}>{fmt(newTotal)}</span></div>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.label}>Notes (optional)</div>
              <textarea value={newInvoice.notes} onChange={e => setNewInvoice(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Payment terms, project details, late fee policy…"
                style={{ ...S.input, marginTop: 4, resize: "none" as const }} />
            </div>

            <button onClick={createInvoice}
              style={{ ...S.btn, width: "100%", padding: "14px", fontSize: 15, borderRadius: 12 }}>
              ✅ Create Invoice — {fmt(newTotal)}
            </button>
          </div>
        )}

        {/* ── PAYMENT METHODS ── */}
        {tab === "methods" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...S.card, background: "rgba(99,102,241,0.06)", border: "1.5px solid rgba(99,102,241,0.18)" }}>
              <div style={{ fontWeight: 700, color: "#818cf8", marginBottom: 6 }}>Payment Methods — CreateAI Brain</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                Two payment methods are configured and appear automatically on every invoice. No phone numbers or personal data are ever exposed — only the handles below are shared with clients.
              </div>
            </div>

            {/* Cash App card */}
            <div style={{ background: "#001a08", border: "1.5px solid rgba(0,214,50,0.30)", borderRadius: 16, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>💚</span>
                <div>
                  <div style={{ fontWeight: 900, color: "#86efac", fontSize: 16 }}>Cash App</div>
                  <div style={{ fontSize: 12, color: "#4ade80" }}>Instant · No fees · Up to $7,500/week</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 24, fontWeight: 900, color: "#00d632" }}>$CreateAIDigital</span>
              </div>
              <div style={{ background: "rgba(0,214,50,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#86efac", fontWeight: 700, marginBottom: 8 }}>Step-by-step for your clients:</div>
                {["Open Cash App → tap the $ Pay icon", "Search for $CreateAIDigital", "Enter the exact invoice amount", "Add the invoice number in the note field", "Tap Pay — you receive the funds instantly"].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 12, color: "#86efac" }}>
                    <span style={{ color: "#00d632", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#475569" }}>Privacy: Only the $CreateAIDigital handle is shared. No phone numbers or personal information exposed.</div>
            </div>

            {/* Venmo card */}
            <div style={{ background: "#001220", border: "1.5px solid rgba(61,149,206,0.30)", borderRadius: 16, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>💙</span>
                <div>
                  <div style={{ fontWeight: 900, color: "#93c5fd", fontSize: 16 }}>Venmo</div>
                  <div style={{ fontSize: 12, color: "#60a5fa" }}>Instant · Up to $4,999.99/week</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 24, fontWeight: 900, color: "#3d95ce" }}>@CreateAIDigital</span>
              </div>
              <div style={{ background: "rgba(61,149,206,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#93c5fd", fontWeight: 700, marginBottom: 8 }}>Step-by-step for your clients:</div>
                {["Open Venmo → tap Pay or Request", "Search for @CreateAIDigital", "Enter the exact invoice amount", "Add the invoice number in the note field", "Tap Pay — funds transfer instantly"].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 12, color: "#93c5fd" }}>
                    <span style={{ color: "#3d95ce", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#475569" }}>Privacy: Only the @CreateAIDigital handle is shared. No phone numbers or personal information exposed.</div>
            </div>

            {/* Privacy notice */}
            <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,1)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                🔒 <strong style={{ color: "#94a3b8" }}>Privacy Protected:</strong> No personal phone numbers, email addresses, or sensitive account details are exposed to clients. Only the public business handles ($CreateAIDigital and @CreateAIDigital) appear on invoices.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
