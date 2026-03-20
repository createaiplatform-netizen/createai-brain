/**
 * StripeIntegrationPage.tsx
 * -------------------------
 * Real Stripe integration UI — authenticated, interactive.
 * Routes to /stripe-integration
 *
 * States:
 *   not-connected → Connect form (paste sk_test_ / sk_live_ key)
 *   connected     → Create Customer · Create PaymentIntent · View Payments
 */

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type Tab = "connect" | "customer" | "payment" | "list";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API = (path: string) => `/api/integrations/stripe${path}`;

async function apiFetch<T>(
  path:    string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(API(path), {
    headers: { "Content-Type": "application/json" },
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

function amountFmt(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

// ─── Small UI primitives ──────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
}) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 20px", borderRadius: 10, fontWeight: 600,
    fontSize: 14, border: "none", cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1, transition: "opacity .15s",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" },
    ghost:   { background: "#f1f5f9", color: "#475569" },
    danger:  { background: "#fee2e2", color: "#dc2626" },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={!!disabled || !!loading}>
      {loading ? "⏳ " : ""}{children}
    </button>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "#1e293b", fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all" }}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
      background: ok ? "#dcfce7" : "#fee2e2",
      color: ok ? "#16a34a" : "#dc2626",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
      {ok ? "Connected" : "Not connected"}
    </span>
  );
}

// ─── Connect panel ────────────────────────────────────────────────────────────

function ConnectPanel({ onConnected }: { onConnected: () => void }) {
  const [key, setKey]     = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  async function connect() {
    setErr(""); setLoading(true);
    try {
      await apiFetch("/connect", {
        method: "POST",
        body: JSON.stringify({ apiKey: key }),
      });
      onConnected();
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card style={{ maxWidth: 480 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>💳</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>Connect Stripe</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Paste your Stripe API key to enable live payments</div>
        </div>
      </div>

      <input
        type="password"
        value={key}
        onChange={e => setKey(e.target.value)}
        placeholder="sk_test_... or sk_live_..."
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 10,
          border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
          fontFamily: "monospace", boxSizing: "border-box", marginBottom: 12,
        }}
        onKeyDown={e => e.key === "Enter" && connect()}
      />

      {err && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fecaca",
          borderRadius: 8, padding: "10px 14px", fontSize: 13,
          color: "#dc2626", marginBottom: 12,
        }}>
          ❌ {err}
        </div>
      )}

      <Btn onClick={connect} loading={loading} disabled={!key.startsWith("sk_")}>
        Validate &amp; Connect
      </Btn>

      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 14, lineHeight: 1.6 }}>
        Your key is validated against Stripe's live API, then stored encrypted.<br />
        Use <code>sk_test_</code> keys from{" "}
        <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noreferrer"
          style={{ color: "#6366f1" }}>dashboard.stripe.com/test/apikeys</a>
      </p>
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
        method: "POST",
        body: JSON.stringify({ name, email }),
      });
      setResult(data.customer);
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
        👤 Create Customer
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Name",  val: name,  set: setName,  ph: "Sara Stadler"         },
          { label: "Email", val: email, set: setEmail, ph: "sara@example.com" },
        ].map(({ label, val, set, ph }) => (
          <div key={label}>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
            <input
              value={val}
              onChange={e => set(e.target.value)}
              placeholder={ph}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}
      </div>

      <Btn onClick={submit} loading={loading} disabled={!name || !email}>
        Create in Stripe
      </Btn>

      {err && <div style={{ marginTop: 12, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>❌ {err}</div>}

      {result && (
        <div style={{ marginTop: 16, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#15803d", marginBottom: 8 }}>✅ Customer created in Stripe</div>
          <Field label="Customer ID" value={result.id} mono />
          <Field label="Name"  value={result.name  ?? "—"} />
          <Field label="Email" value={result.email ?? "—"} />
          <Field label="Created" value={fmt(result.created)} />
        </div>
      )}
    </Card>
  );
}

// ─── Create payment intent panel ──────────────────────────────────────────────

function CreatePaymentPanel() {
  const [amount, setAmount]     = useState("1000");
  const [currency, setCurrency] = useState("usd");
  const [result, setResult]     = useState<StripePaymentIntent | null>(null);
  const [err, setErr]           = useState("");
  const [loading, setLoading]   = useState(false);

  async function submit() {
    setErr(""); setResult(null); setLoading(true);
    try {
      const data = await apiFetch<{ paymentIntent: StripePaymentIntent }>("/payment-intent", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), currency }),
      });
      setResult(data.paymentIntent);
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
        💰 Create PaymentIntent
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Amount (cents)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="1000"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
            {Number(amount) > 0 ? `= ${amountFmt(Number(amount), currency)}` : "e.g. 1000 = $10.00"}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Currency</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
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

      {err && <div style={{ marginTop: 12, padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>❌ {err}</div>}

      {result && (
        <div style={{ marginTop: 16, background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#7c3aed", marginBottom: 8 }}>✅ PaymentIntent created</div>
          <Field label="ID"       value={result.id}                              mono />
          <Field label="Amount"   value={amountFmt(result.amount, result.currency)} />
          <Field label="Status"   value={result.status} />
          <Field label="Created"  value={fmt(result.created)} />
        </div>
      )}
    </Card>
  );
}

// ─── Payments list panel ──────────────────────────────────────────────────────

function PaymentsListPanel() {
  const [payments, setPayments] = useState<StripePaymentIntent[]>([]);
  const [err, setErr]           = useState("");
  const [loading, setLoading]   = useState(false);

  const load = useCallback(async () => {
    setErr(""); setLoading(true);
    try {
      const data = await apiFetch<{ payments: StripePaymentIntent[] }>("/payments");
      setPayments(data.payments);
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColor: Record<string, string> = {
    succeeded: "#16a34a", requires_payment_method: "#d97706",
    canceled: "#dc2626", processing: "#2563eb",
  };

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>📋 Recent Payments</h3>
        <Btn onClick={load} loading={loading} variant="ghost">Refresh</Btn>
      </div>

      {err && <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#dc2626", marginBottom: 12 }}>❌ {err}</div>}

      {!loading && payments.length === 0 && (
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
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{amountFmt(p.amount, p.currency)}</div>
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

export default function StripeIntegrationPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [mode, setMode]           = useState<string>("test");
  const [tab, setTab]             = useState<Tab>("customer");

  const checkStatus = useCallback(async () => {
    try {
      const data = await apiFetch<{ connected: boolean; mode?: string }>("/status");
      setConnected(data.connected);
      if (data.mode) setMode(data.mode);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "customer", label: "Create Customer",       icon: "👤" },
    { id: "payment",  label: "Create Payment",         icon: "💰" },
    { id: "list",     label: "View Payments",          icon: "📋" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" }}>
      <div style={{ maxWidth: 740, margin: "0 auto" }}>

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
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 10 }}>
              <StatusPill ok={connected === true} />
              {connected && (
                <span style={{
                  padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                  background: mode === "live" ? "#dcfce7" : "#fef9c3",
                  color: mode === "live" ? "#16a34a" : "#92400e",
                }}>
                  {mode === "live" ? "🟢 Live mode" : "🟡 Test mode"}
                </span>
              )}
              <span style={{ fontSize: 11, color: "#94a3b8" }}>tier: real · isReal: true</span>
            </div>
          </div>
          {connected && (
            <button
              onClick={() => setConnected(false)}
              style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Not connected */}
        {connected === false && (
          <ConnectPanel onConnected={() => { setConnected(true); setTab("customer"); }} />
        )}

        {/* Loading */}
        {connected === null && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Checking connection…</div>
        )}

        {/* Connected */}
        {connected === true && (
          <>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    background: tab === t.id ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f1f5f9",
                    color: tab === t.id ? "#fff" : "#475569",
                    transition: "all .15s",
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {tab === "customer" && <CreateCustomerPanel />}
            {tab === "payment"  && <CreatePaymentPanel  />}
            {tab === "list"     && <PaymentsListPanel   />}
          </>
        )}
      </div>
    </div>
  );
}
