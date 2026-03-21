import { useState, useEffect } from "react";

const API = "/api";

type Invoice = {
  id: string; invoiceNumber: string; status: string;
  clientName: string; clientEmail: string;
  total: number; currency: string;
  issueDate: string; dueDate: string; createdAt: number;
};

type Summary = {
  totalInvoices: number; paidCount: number; paidTotal: number;
  pendingCount: number; pendingTotal: number; overdueCount: number; overdueTotal: number;
  draftCount: number;
};

type PayMethod = { id: string; name: string; instructions: string; processingTime: string; fees: string; limit?: string };

const STATUS_COLORS: Record<string, string> = {
  draft: "text-slate-400 bg-slate-700", sent: "text-indigo-400 bg-indigo-500/20",
  viewed: "text-purple-400 bg-purple-500/20", paid: "text-green-400 bg-green-500/20",
  overdue: "text-red-400 bg-red-500/20", cancelled: "text-slate-500 bg-slate-800"
};

export default function PayGateApp() {
  const [tab, setTab] = useState<"dashboard"|"invoices"|"create"|"methods">("dashboard");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [methods, setMethods] = useState<PayMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    clientName: "", clientEmail: "", clientCompany: "", clientAddress: "",
    currency: "USD", taxRate: "0", netDays: "30", paymentMethod: "bank-transfer", notes: "",
    lineItems: [{ description: "CreateAI Brain Pro — Monthly Subscription", quantity: "1", unitPrice: "97" }]
  });
  const [statusUpdate, setStatusUpdate] = useState<{ id: string; status: string; ref: string } | null>(null);

  function loadAll() {
    return Promise.all([
      fetch(`${API}/payments/invoice/list`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/payments/summary`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/payments/methods`, { credentials: "include" }).then(r => r.json()),
    ]).then(([inv, sum, meth]) => {
      if (inv.ok) setInvoices(inv.invoices);
      if (sum.ok) setSummary(sum.summary);
      if (meth.ok) setMethods(meth.methods);
    });
  }

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, []);

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
    const r = await fetch(`${API}/payments/invoice/create`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newInvoice, taxRate: Number(newInvoice.taxRate), netDays: Number(newInvoice.netDays), lineItems })
    });
    const d = await r.json();
    setMsg({ text: d.ok ? `Invoice ${d.invoice.invoiceNumber} created (${fmt(d.invoice.total)}).` : d.error, ok: d.ok });
    if (d.ok) { loadAll(); setTab("invoices"); }
  }

  async function sendInvoice(id: string) {
    setSending(id);
    const r = await fetch(`${API}/payments/invoice/send`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const d = await r.json();
    setMsg({ text: d.ok ? d.message : d.error, ok: d.ok });
    setSending(null); loadAll();
  }

  async function updateStatus() {
    if (!statusUpdate) return;
    const r = await fetch(`${API}/payments/invoice/${statusUpdate.id}/status`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusUpdate.status, paymentReference: statusUpdate.ref })
    });
    const d = await r.json();
    setMsg({ text: d.ok ? d.message : d.error, ok: d.ok });
    setStatusUpdate(null); loadAll();
  }

  function fmt(n: number, cur = "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(n);
  }

  const T = {
    tab: "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
    active: "bg-indigo-600 text-white",
    inactive: "text-slate-400 hover:text-white hover:bg-slate-800",
    card: "bg-slate-900 border border-slate-800 rounded-xl p-5",
    label: "text-xs text-slate-500 uppercase tracking-wider mb-1",
    input: "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none",
    btn: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50",
    h2: "text-lg font-bold text-white mb-4",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center"><div className="text-4xl mb-4">💳</div><div className="text-slate-400 text-sm">Loading PayGate…</div></div>
    </div>
  );

  const TABS = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "invoices", label: "📄 Invoices" },
    { id: "create", label: "➕ New Invoice" },
    { id: "methods", label: "💳 Payment Methods" },
  ] as const;

  const { total: newTotal, subtotal: newSub, tax: newTax } = calcTotal();

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">PayGate — Multi-Rail Payments</h1>
            <p className="text-xs text-slate-500 mt-0.5">Invoice generation, email delivery, payment tracking — bank, wire, Zelle, Venmo, check, crypto</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30">STRIPE-INDEPENDENT</span>
          </div>
        </div>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`${T.tab} ${tab === t.id ? T.active : T.inactive}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {msg && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${msg.ok ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
            {msg.text}
          </div>
        )}

        {tab === "dashboard" && summary && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className={T.card}>
                <div className={T.label}>Total Collected</div>
                <div className="text-3xl font-black text-green-400">{fmt(summary.paidTotal)}</div>
                <div className="text-xs text-slate-500 mt-1">{summary.paidCount} paid invoice{summary.paidCount !== 1 ? "s" : ""}</div>
              </div>
              <div className={T.card}>
                <div className={T.label}>Outstanding</div>
                <div className="text-3xl font-black text-amber-400">{fmt(summary.pendingTotal)}</div>
                <div className="text-xs text-slate-500 mt-1">{summary.pendingCount} pending invoice{summary.pendingCount !== 1 ? "s" : ""}</div>
              </div>
              <div className={T.card}>
                <div className={T.label}>Overdue</div>
                <div className={`text-3xl font-black ${summary.overdueTotal > 0 ? "text-red-400" : "text-slate-600"}`}>{fmt(summary.overdueTotal)}</div>
                <div className="text-xs text-slate-500 mt-1">{summary.overdueCount} overdue</div>
              </div>
              <div className={T.card}>
                <div className={T.label}>Total Invoices</div>
                <div className="text-3xl font-black text-indigo-400">{summary.totalInvoices}</div>
                <div className="text-xs text-slate-500 mt-1">{summary.draftCount} draft</div>
              </div>
            </div>
            <div className={T.card}>
              <div className={T.h2}>Payment Rails Available</div>
              <div className="grid grid-cols-2 gap-3">
                {methods.slice(0, 4).map(m => (
                  <div key={m.id} className="bg-slate-800 rounded-lg p-3">
                    <div className="font-semibold text-white text-sm mb-1">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.processingTime} · {m.fees}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500">+ {methods.length - 4} more methods. All bypass Stripe requirements.</div>
            </div>
            <div className={T.card}>
              <div className={T.h2}>Quick Actions</div>
              <div className="flex gap-3">
                <button onClick={() => setTab("create")} className={T.btn}>➕ New Invoice</button>
                <button onClick={() => setTab("invoices")} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-300">📄 View All</button>
              </div>
            </div>
          </div>
        )}

        {tab === "invoices" && (
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className={`${T.card} text-center py-12`}>
                <div className="text-4xl mb-3">📄</div>
                <div className="text-slate-400">No invoices yet. Create your first one.</div>
                <button onClick={() => setTab("create")} className={`${T.btn} mt-4`}>Create Invoice</button>
              </div>
            ) : (
              <>
                {statusUpdate && (
                  <div className={T.card}>
                    <div className={T.h2}>Update Invoice Status</div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className={T.label}>New Status</div>
                        <select value={statusUpdate.status} onChange={e => setStatusUpdate(s => s ? { ...s, status: e.target.value } : null)}
                          className={`${T.input} mt-1`}>
                          {["draft", "sent", "viewed", "paid", "overdue", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className={T.label}>Payment Reference (optional)</div>
                        <input value={statusUpdate.ref} onChange={e => setStatusUpdate(s => s ? { ...s, ref: e.target.value } : null)}
                          placeholder="Check #, wire ref, Zelle txn" className={`${T.input} mt-1`} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={updateStatus} className={T.btn}>Update Status</button>
                      <button onClick={() => setStatusUpdate(null)} className="px-4 py-2 bg-slate-800 rounded-lg text-sm font-bold text-slate-400">Cancel</button>
                    </div>
                  </div>
                )}
                {invoices.map(inv => (
                  <div key={inv.id} className={T.card}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white">{inv.invoiceNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[inv.status] ?? "text-slate-400"}`}>{inv.status.toUpperCase()}</span>
                        </div>
                        <div className="text-sm text-slate-400 mt-0.5">{inv.clientName} · {inv.clientEmail}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-indigo-400">{fmt(inv.total, inv.currency)}</div>
                        <div className="text-xs text-slate-500">Due {inv.dueDate}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <a href={`${API}/payments/invoice/${inv.id}/html`} target="_blank" rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-slate-300 transition-colors">
                        🖨️ View / Print
                      </a>
                      {inv.status === "draft" && (
                        <button onClick={() => sendInvoice(inv.id)} disabled={sending === inv.id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-bold text-white transition-colors disabled:opacity-50">
                          {sending === inv.id ? "Sending…" : "📧 Send to Client"}
                        </button>
                      )}
                      <button onClick={() => setStatusUpdate({ id: inv.id, status: inv.status, ref: "" })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-bold text-white transition-colors">
                        ✏️ Update Status
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {tab === "create" && (
          <div className="space-y-5">
            <div className={T.card}>
              <div className={T.h2}>Client Information</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Client Name*", "clientName", "Sara Johnson"],
                  ["Client Email*", "clientEmail", "client@company.com"],
                  ["Company (optional)", "clientCompany", "Acme Corp LLC"],
                  ["Address (optional)", "clientAddress", "123 Main St, City, ST 12345"],
                ].map(([l, k, ph]) => (
                  <div key={k}>
                    <div className={T.label}>{l}</div>
                    <input value={(newInvoice as any)[k]} onChange={e => setNewInvoice(f => ({ ...f, [k]: e.target.value }))}
                      placeholder={ph} className={`${T.input} mt-1`} />
                  </div>
                ))}
              </div>
            </div>
            <div className={T.card}>
              <div className={T.h2}>Invoice Settings</div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Currency", key: "currency", type: "select", options: ["USD", "EUR", "GBP", "CAD", "AUD"] },
                  { label: "Net Days", key: "netDays", type: "select", options: ["7", "14", "21", "30", "45", "60"] },
                  { label: "Payment Method", key: "paymentMethod", type: "select", options: methods.map(m => ({ value: m.id, label: m.name })) },
                ].map(f => (
                  <div key={f.key}>
                    <div className={T.label}>{f.label}</div>
                    <select value={(newInvoice as any)[f.key]} onChange={e => setNewInvoice(fi => ({ ...fi, [f.key]: e.target.value }))}
                      className={`${T.input} mt-1`}>
                      {f.options.map((o: any) => typeof o === "string"
                        ? <option key={o} value={o}>{o}</option>
                        : <option key={o.value} value={o.value}>{o.label}</option>
                      )}
                    </select>
                  </div>
                ))}
                <div>
                  <div className={T.label}>Tax Rate (%)</div>
                  <input type="number" value={newInvoice.taxRate} onChange={e => setNewInvoice(f => ({ ...f, taxRate: e.target.value }))}
                    min="0" max="50" step="0.1" className={`${T.input} mt-1`} />
                </div>
              </div>
            </div>
            <div className={T.card}>
              <div className="flex items-center justify-between mb-4">
                <div className={T.h2} style={{ marginBottom: 0 }}>Line Items</div>
                <button onClick={addLineItem} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-slate-300">+ Add Item</button>
              </div>
              <div className="space-y-3">
                {newInvoice.lineItems.map((item, i) => (
                  <div key={i} className="bg-slate-800 rounded-lg p-3 grid grid-cols-5 gap-2 items-center">
                    <div className="col-span-2">
                      <input value={item.description} onChange={e => updateLineItem(i, "description", e.target.value)}
                        placeholder="Description" className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <input type="number" value={item.quantity} onChange={e => updateLineItem(i, "quantity", e.target.value)}
                        placeholder="Qty" min="1" className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <input type="number" value={item.unitPrice} onChange={e => updateLineItem(i, "unitPrice", e.target.value)}
                        placeholder="Price" min="0" step="0.01" className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">{fmt(Number(item.quantity) * Number(item.unitPrice))}</span>
                      {newInvoice.lineItems.length > 1 && (
                        <button onClick={() => removeLineItem(i)} className="text-red-400 text-xs ml-2">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-slate-800 rounded-lg p-4 flex justify-end">
                <div className="text-right space-y-1">
                  <div className="flex gap-12 text-sm text-slate-400"><span>Subtotal</span><span>{fmt(newSub)}</span></div>
                  {Number(newInvoice.taxRate) > 0 && <div className="flex gap-12 text-sm text-slate-400"><span>Tax ({newInvoice.taxRate}%)</span><span>{fmt(newTax)}</span></div>}
                  <div className="flex gap-12 text-base font-black"><span className="text-slate-300">Total</span><span className="text-indigo-400">{fmt(newTotal)}</span></div>
                </div>
              </div>
            </div>
            <div className={T.card}>
              <div className={T.label}>Notes (optional)</div>
              <textarea value={newInvoice.notes} onChange={e => setNewInvoice(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Payment terms, late fee policy, project details..."
                className={`${T.input} mt-1 resize-none`} />
            </div>
            <button onClick={createInvoice}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold text-white transition-colors">
              ✅ Create Invoice — {fmt(newTotal)}
            </button>
          </div>
        )}

        {tab === "methods" && (
          <div className="space-y-4">
            <div className={`${T.card} bg-indigo-950 border-indigo-800`}>
              <div className="text-sm font-bold text-indigo-300 mb-2">Why Multi-Rail Payments?</div>
              <div className="text-xs text-indigo-400">CreateAI Brain operates independent of Stripe's charges_enabled status. All payment methods below work immediately — no platform approval required. Revenue starts now.</div>
            </div>
            {methods.map(m => (
              <div key={m.id} className={T.card}>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-white">{m.name}</div>
                  <div className="flex gap-2">
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{m.processingTime}</span>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Fees: {m.fees}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-300">{m.instructions}</div>
                {m.limit && <div className="text-xs text-amber-400 mt-2">Limit: {m.limit}</div>}
                {(m as any).note && <div className="text-xs text-slate-500 mt-2">{(m as any).note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
