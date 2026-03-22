// ─── Bill Pay Component ───────────────────────────────────────────────────────
// Tracks bills, due dates, and payment methods. Every action requires
// explicit user approval — no automatic withdrawals ever.

import { useState, useEffect } from "react";

const SAGE = "#7a9068";
const CREAM = "#faf9f6";
const TEXT = "#1a1916";
const MUTED = "#6b6660";
const BORDER = "rgba(122,144,104,0.14)";

interface Bill {
  id: number;
  name: string;
  payee: string;
  amount_cents: number;
  due_date: string | null;
  payment_method: string;
  status: string;
  notes: string | null;
  approved_at: string | null;
  paid_at: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#b8860b", bg: "rgba(184,134,11,0.10)"  },
  approved:  { label: "Approved",  color: "#7a9068", bg: "rgba(122,144,104,0.12)" },
  paid:      { label: "Paid",      color: "#4a7a5a", bg: "rgba(74,122,90,0.12)"   },
  overdue:   { label: "Overdue",   color: "#c53030", bg: "rgba(197,48,48,0.10)"   },
  cancelled: { label: "Cancelled", color: "#6b6660", bg: "rgba(107,102,96,0.10)"  },
};

const METHOD_ICONS: Record<string, string> = {
  zelle: "💙", cashapp: "💚", venmo: "💜", paypal: "🔵",
  stripe: "🔷", bank_transfer: "🏦", manual: "💵", other: "💳",
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(d: string | null) {
  if (!d) return "No due date";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(bill: Bill) {
  if (!bill.due_date || bill.status !== "pending") return false;
  return new Date(bill.due_date) < new Date();
}

export function BillPay() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", payee: "", amount: "", dueDate: "", paymentMethod: "manual", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/bills", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { bills: Bill[] };
        setBills(data.bills);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Bill name is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          payee: form.payee,
          amountCents: Math.round(parseFloat(form.amount || "0") * 100),
          dueDate: form.dueDate || undefined,
          paymentMethod: form.paymentMethod,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ name: "", payee: "", amount: "", dueDate: "", paymentMethod: "manual", notes: "" });
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: number, status: string) {
    await fetch(`/api/bills/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this bill?")) return;
    await fetch(`/api/bills/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  }

  const totalDue = bills
    .filter(b => ["pending", "overdue"].includes(b.status) || isOverdue(b))
    .reduce((s, b) => s + b.amount_cents, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div
        className="flex items-center justify-between p-4 rounded-2xl"
        style={{ background: `${SAGE}10`, border: `1px solid ${BORDER}` }}
      >
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
            Total Due
          </p>
          <p className="text-[24px] font-black" style={{ color: totalDue > 0 ? "#c53030" : TEXT }}>
            {fmt(totalDue)}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2.5 rounded-xl font-bold text-[13px] text-white"
          style={{ background: SAGE }}
        >
          + Add bill
        </button>
      </div>

      {loading && (
        <div className="py-8 text-center text-[13px]" style={{ color: MUTED }}>Loading…</div>
      )}

      {!loading && bills.length === 0 && (
        <div className="py-10 text-center flex flex-col items-center gap-2">
          <div className="text-3xl">📋</div>
          <p className="text-[14px] font-semibold" style={{ color: TEXT }}>No bills yet</p>
          <p className="text-[12px]" style={{ color: MUTED }}>Add your first bill to start tracking payments</p>
        </div>
      )}

      {/* Bill list */}
      <div className="flex flex-col gap-2">
        {bills.map(bill => {
          const overdue = isOverdue(bill);
          const effectiveStatus = overdue ? "overdue" : bill.status;
          const statusInfo = STATUS_LABELS[effectiveStatus] ?? STATUS_LABELS.pending;

          return (
            <div
              key={bill.id}
              className="p-4 rounded-2xl flex items-start justify-between gap-3"
              style={{ background: "white", border: `1px solid ${BORDER}` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-bold" style={{ color: TEXT }}>{bill.name}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                    style={{ color: statusInfo.color, background: statusInfo.bg }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                {bill.payee && (
                  <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>To: {bill.payee}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-[16px] font-bold" style={{ color: TEXT }}>
                    {fmt(bill.amount_cents)}
                  </span>
                  <span className="text-[11px]" style={{ color: MUTED }}>
                    {fmtDate(bill.due_date)}
                  </span>
                  <span className="text-[11px]" style={{ color: MUTED }}>
                    {METHOD_ICONS[bill.payment_method] ?? "💳"} {bill.payment_method.replace("_", " ")}
                  </span>
                </div>
                {bill.notes && (
                  <p className="text-[11px] mt-1" style={{ color: MUTED }}>{bill.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {bill.status === "pending" && (
                  <button
                    onClick={() => handleStatus(bill.id, "approved")}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                    style={{ background: SAGE }}
                  >
                    Approve
                  </button>
                )}
                {bill.status === "approved" && (
                  <button
                    onClick={() => handleStatus(bill.id, "paid")}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
                    style={{ background: "#4a7a5a" }}
                  >
                    Mark paid
                  </button>
                )}
                <button
                  onClick={() => handleDelete(bill.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]"
                  style={{ background: "rgba(197,48,48,0.08)", color: "#c53030" }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add bill modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(26,25,22,0.50)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-sm rounded-3xl"
            style={{ background: CREAM, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
          >
            <form onSubmit={handleAdd} className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[17px] font-black" style={{ color: TEXT }}>Add a bill</h3>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[18px]"
                  style={{ background: BORDER, color: MUTED }}>×</button>
              </div>

              {[
                { key: "name", label: "Bill name *", placeholder: "Rent, Netflix, Electric…", type: "text" },
                { key: "payee", label: "Who to pay", placeholder: "Landlord, Netflix Inc…", type: "text" },
                { key: "amount", label: "Amount ($)", placeholder: "0.00", type: "number" },
                { key: "dueDate", label: "Due date", placeholder: "", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                    style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}
                  />
                </div>
              ))}

              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>
                  Payment method
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                  style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}
                >
                  {["zelle","cashapp","venmo","paypal","stripe","bank_transfer","manual","other"].map(m => (
                    <option key={m} value={m}>{METHOD_ICONS[m]} {m.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: MUTED }}>Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes…"
                  className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                  style={{ background: "white", border: `1.5px solid ${BORDER}`, color: TEXT }}
                />
              </div>

              {error && <p className="text-[12px]" style={{ color: "#c53030" }}>{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl font-bold text-[14px] text-white mt-1"
                style={{ background: SAGE, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : "Add bill"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
