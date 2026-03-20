/**
 * StripeIntegrationPage.tsx
 * -------------------------
 * Real Stripe integration — authenticated, Replit connector-powered.
 * Routes to /stripe-integration
 *
 * No manual API key entry. Credentials come from the Replit Stripe connector.
 * Create Customers · Create PaymentIntents · View Payments · Check Balance
 */

import { useState, useEffect, useCallback } from "react";
import type { ReactNode, CSSProperties } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StripeStatus {
  ok: boolean;
  mode?: "live" | "test";
  publishableKey?: string;
  error?: string;
}

interface StripeCustomer {
  id: string;
  name: string | null;
  email: string | null;
  created: number;
}

interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
}

interface StripeBalance {
  available: Array<{ amount: number; currency: string }>;
  pending:   Array<{ amount: number; currency: string }>;
}

type Tab = "balance" | "customer" | "payment" | "list";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE = "/api/integrations/stripe";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res  = await fetch(`${BASE}${path}`, {
    headers:     { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

function fmt(ts: number) {
  return new Date(ts * 1000).toLocaleString();
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: "24px 28px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Btn({
  children, onClick, loading, disabled, variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  const base: CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 20px", borderRadius: 10, fontWeight: 600,
    fontSize: 14, border: "none",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1, transition: "opacity .15s",
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" },
    ghost:   { background: "#f1f5f9", color: "#475569" },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={!!disabled || !!loading}>
      {loading ? "⏳ " : ""}{children}
    </button>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{
      marginTop: 12, padding: "10px 14px",
      background: "#fee2e2", border: "1px solid #fecaca",
      borderRadius: 8, fontSize: 13, color: "#dc2626",
    }}>
      ❌ {msg}
    </div>
  );
}

function SuccessBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{
      marginTop: 16, background: "#f0fdf4",
      border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px",
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#15803d", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#1e293b", fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}

// ─── Balance panel ────────────────────────────────────────────────────────────

function BalancePanel() {
  const [bal, setBal]         = useState<StripeBalance | null>(null);
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setErr(""); setLoading(true);
    try {
      const data = await apiFetch<{ balance: StripeBalance }>("/balance");
      setBal(data.balance);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>💰 Account Balance</h3>
        <Btn onClick={load} loading={loading} variant="ghost">Refresh</Btn>
      </div>

      {err && <ErrBox msg={err} />}

      {bal && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>AVAILABLE</div>
            {bal.available.map((a, i) => (
              <div key={i} style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
                {money(a.amount, a.currency)}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>PENDING</div>
            {bal.pending.map((p, i) => (
              <div key={i} style={{ fontSize: 22, fontWeight: 800, color: "#64748b" }}>
                {money(p.amount, p.currency)}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !bal && !err && (
        <div style={{ color: "#94a3b8", fontSize: 14 }}>Loading balance…</div>
      )}
    </Card>
  );
}

// ─── Create customer panel ────────────────────────────────────────────────────

function CreateCustomerPanel() {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<StripeCustomer | null>(null);
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(""); setResult(null); setLoading(true);
    try {
      const data = await apiFetch<{ customer: StripeCustomer }>("/customer", {
        method: "POST", body: JSON.stringify({ name, email }),
      });
      setResult(data.customer);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <Card>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
        👤 Create Customer
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Full Name", val: name,  set: setName,  ph: "Sara Stadler"     },
          { label: "Email",     val: email, set: setEmail, ph: "sara@example.com" },
        ].map(({ label, val, set, ph }) => (
          <div key={label}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
            <input
              value={val} onChange={e => set(e.target.value)} placeholder={ph}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
      </div>

      <Btn onClick={submit} loading={loading} disabled={!name || !email}>
        Create in Stripe
      </Btn>

      {err && <ErrBox msg={err} />}

      {result && (
        <SuccessBox title="✅ Customer created in Stripe">
          <InfoRow label="Customer ID" value={result.id}             mono />
          <InfoRow label="Name"        value={result.name  ?? "—"}       />
          <InfoRow label="Email"       value={result.email ?? "—"}       />
          <InfoRow label="Created"     value={fmt(result.created)}       />
        </SuccessBox>
      )}
    </Card>
  );
}

// ─── Create payment intent panel ──────────────────────────────────────────────

function CreatePaymentPanel() {
  const [amount,   setAmount]   = useState("1000");
  const [currency, setCurrency] = useState("usd");
  const [result,   setResult]   = useState<StripePaymentIntent | null>(null);
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);

  async function submit() {
    setErr(""); setResult(null); setLoading(true);
    try {
      const data = await apiFetch<{ paymentIntent: StripePaymentIntent }>("/payment-intent", {
        method: "POST", body: JSON.stringify({ amount: Number(amount), currency }),
      });
      setResult(data.paymentIntent);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <Card>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
        💳 Create PaymentIntent
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Amount (cents)</label>
          <input
            type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1000"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
            {Number(amount) > 0 ? `= ${money(Number(amount), currency)}` : "e.g. 1000 = $10.00"}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Currency</label>
          <select
            value={currency} onChange={e => setCurrency(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}
          >
            {["usd", "eur", "gbp", "cad", "aud"].map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <Btn onClick={submit} loading={loading} disabled={!amount || Number(amount) <= 0}>
        Create in Stripe
      </Btn>

      {err && <ErrBox msg={err} />}

      {result && (
        <div style={{ marginTop: 16, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#7c3aed", marginBottom: 8 }}>✅ PaymentIntent created</div>
          <InfoRow label="ID"      value={result.id}                              mono />
          <InfoRow label="Amount"  value={money(result.amount, result.currency)}      />
          <InfoRow label="Status"  value={result.status}                             />
          <InfoRow label="Created" value={fmt(result.created)}                       />
        </div>
      )}
    </Card>
  );
}

// ─── Payments list panel ──────────────────────────────────────────────────────

function PaymentsListPanel() {
  const [payments, setPayments] = useState<StripePaymentIntent[]>([]);
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);

  const load = useCallback(async () => {
    setErr(""); setLoading(true);
    try {
      const data = await apiFetch<{ payments: StripePaymentIntent[] }>("/payments");
      setPayments(data.payments);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColor: Record<string, string> = {
    succeeded:               "#16a34a",
    requires_payment_method: "#d97706",
    canceled:                "#dc2626",
    processing:              "#2563eb",
    requires_capture:        "#7c3aed",
  };

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>📋 Recent Payments</h3>
        <Btn onClick={load} loading={loading} variant="ghost">Refresh</Btn>
      </div>

      {err && <ErrBox msg={err} />}

      {!loading && payments.length === 0 && !err && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 14 }}>
          No payments yet — create a PaymentIntent to see it here.
        </div>
      )}

      {payments.map(p => (
        <div key={p.id} style={{
          borderTop: "1px solid #f1f5f9", padding: "12px 0",
          display: "grid", gridTemplateColumns: "1fr auto", gap: 8,
        }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#6366f1", marginBottom: 4 }}>{p.id}</div>
            <div style={{ fontSize: 13, color: "#475569" }}>{fmt(p.created)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{money(p.amount, p.currency)}</div>
            <div style={{
              display: "inline-block", marginTop: 4, padding: "2px 8px",
              borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: `${statusColor[p.status] ?? "#64748b"}18`,
              color: statusColor[p.status] ?? "#64748b",
            }}>
              {p.status}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "balance",  label: "Balance",           icon: "💰" },
  { id: "customer", label: "Create Customer",   icon: "👤" },
  { id: "payment",  label: "Create Payment",    icon: "💳" },
  { id: "list",     label: "Recent Payments",   icon: "📋" },
];

export default function StripeIntegrationPage() {
  const [status, setStatus]   = useState<StripeStatus | null>(null);
  const [tab, setTab]         = useState<Tab>("balance");

  useEffect(() => {
    apiFetch<StripeStatus>("/status")
      .then(d => setStatus(d))
      .catch(e => setStatus({ ok: false, error: (e as Error).message }));
  }, []);

  const modeBadge = status?.mode
    ? (
      <span style={{
        padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600,
        background: status.mode === "live" ? "#dcfce7" : "#fef9c3",
        color:      status.mode === "live" ? "#16a34a"  : "#92400e",
      }}>
        {status.mode === "live" ? "🟢 Live mode" : "🟡 Test mode"}
      </span>
    ) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
          }}>💳</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              Stripe Integration
            </h1>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {status === null && <span style={{ color: "#94a3b8" }}>Connecting…</span>}
              {status !== null && (
                <>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                    background: status.ok ? "#dcfce7" : "#fee2e2",
                    color:      status.ok ? "#16a34a"  : "#dc2626",
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                    {status.ok ? "Connected via Replit" : "Connection issue"}
                  </span>
                  {modeBadge}
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>tier: real · isReal: true</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error state */}
        {status && !status.ok && (
          <Card style={{ borderColor: "#fecaca", background: "#fff5f5" }}>
            <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>⚠️ Stripe connection issue</div>
            <div style={{ fontSize: 13, color: "#7f1d1d" }}>{status.error}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
              The Stripe connector is set up — this may be a transient issue. Try refreshing the page.
            </div>
          </Card>
        )}

        {/* Connected UI */}
        {status?.ok && (
          <>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    background: tab === t.id
                      ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                      : "#f1f5f9",
                    color: tab === t.id ? "#fff" : "#475569",
                    transition: "all .15s",
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {tab === "balance"  && <BalancePanel         />}
            {tab === "customer" && <CreateCustomerPanel  />}
            {tab === "payment"  && <CreatePaymentPanel   />}
            {tab === "list"     && <PaymentsListPanel    />}

            {/* Publishable key display */}
            {status.publishableKey && (
              <div style={{ marginTop: 20, padding: "10px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Publishable Key (client-safe)
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#475569", wordBreak: "break-all" }}>
                  {status.publishableKey}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
