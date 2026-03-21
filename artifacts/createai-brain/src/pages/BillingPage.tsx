/**
 * BillingPage.tsx — CreateAI Brain · Billing & Subscriptions
 *
 * Phases covered:
 *   Phase 25 — Payment & Billing Infrastructure
 *   Phase 26 — Subscription & Licensing Engine
 *   Phase 6  — First Clients & First Income
 *   Meta-Phase 7 — Autonomous Operations Layer
 */

import React, { useState, useEffect, useCallback } from "react";

const INDIGO = "#6366f1";
const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "rgba(0,0,0,0.07)";
const SHADOW = "0 1px 8px rgba(0,0,0,0.05)";
const SLATE  = "#64748b";
const DARK   = "#0f172a";
const GREEN  = "#22c55e";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";
const PURPLE = "#8b5cf6";

const NAV_LINKS = [
  { label: "Dashboard",       href: "/transcend-dashboard" },
  { label: "Command Center",  href: "/command-center" },
  { label: "Analytics",       href: "/analytics" },
  { label: "Team",            href: "/team" },
  { label: "Billing",         href: "/billing",         active: true },
  { label: "Data",            href: "/data" },
  { label: "Global",          href: "/global-expansion" },
  { label: "Evolution",       href: "/evolution" },
  { label: "Settings",        href: "/settings" },
  { label: "Platform Status", href: "/platform-status" },
];

interface PayoutStats {
  cycleCount?: number;
  bankLinked?:  boolean;
  lastRunAt?:   string;
  totalPaid?:   number;
}

interface BridgeStatus {
  connectors?: Array<{ key: string; label: string; status: string }>;
}

const PLANS = [
  {
    id: "solo",
    name: "Solo Owner",
    price: "$0",
    period: "/ mo",
    current: true,
    features: [
      "Full platform access",
      "349 AI engine modules",
      "9 Transcend engine stacks",
      "Stripe payment integration",
      "ACH direct payout",
      "Email & SMS notifications",
      "Zero-Touch Super Launch",
      "BeyondInfinity mode",
    ],
    color: INDIGO,
  },
  {
    id: "team",
    name: "Team",
    price: "$199",
    period: "/ mo",
    current: false,
    features: [
      "Everything in Solo",
      "Up to 10 team members",
      "Role-based access control",
      "Team collaboration tools",
      "Priority support",
      "Custom domain",
      "Advanced analytics",
    ],
    color: PURPLE,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    current: false,
    features: [
      "Everything in Team",
      "Unlimited team members",
      "Multi-tenant architecture",
      "SLA guarantee",
      "White-label option",
      "Dedicated support",
      "Custom integrations",
    ],
    color: "#0ea5e9",
  },
];

export default function BillingPage() {
  const [payout,  setPayout]  = useState<PayoutStats | null>(null);
  const [bridge,  setBridge]  = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [pay, br] = await Promise.allSettled([
        fetch("/api/payout/stats").then(r => r.ok ? r.json() : null),
        fetch("/api/bridge/status").then(r => r.ok ? r.json() : null),
      ]);
      if (pay.status === "fulfilled" && pay.value) setPayout(pay.value as PayoutStats);
      if (br.status === "fulfilled"  && br.value)  setBridge(br.value as BridgeStatus);
    } catch { /* best-effort */ }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const stripeConnector = bridge?.connectors?.find(c => c.key === "stripe");
  const stripeStatus = stripeConnector?.status ?? "UNKNOWN";

  async function handleTriggerPayout() {
    setTriggering(true);
    setTriggerMsg("");
    try {
      const res = await fetch("/api/payout/trigger", { method: "POST", credentials: "include" });
      if (res.ok) {
        setTriggerMsg("✓ Payout cycle triggered — check ACH status shortly.");
      } else {
        const data = await res.json() as { error?: string };
        setTriggerMsg(`Error: ${data.error ?? res.status}`);
      }
    } catch (e) {
      setTriggerMsg(`Network error: ${(e as Error).message}`);
    }
    setTriggering(false);
    void load();
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui,-apple-system,sans-serif" }}>

      <nav style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "0 28px",
        display: "flex", alignItems: "center", gap: 6, height: 52, overflowX: "auto" }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: DARK, marginRight: 20, whiteSpace: "nowrap" }}>
          🧠 CreateAI Brain
        </span>
        {NAV_LINKS.map(l => (
          <a key={l.href} href={l.href}
            style={{ fontSize: 13, fontWeight: l.active ? 700 : 500, color: l.active ? INDIGO : SLATE,
              padding: "6px 12px", borderRadius: 8, whiteSpace: "nowrap",
              background: l.active ? "rgba(99,102,241,0.09)" : "transparent",
              textDecoration: "none", flexShrink: 0 }}>
            {l.label}
          </a>
        ))}
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: DARK, margin: 0 }}>Billing & Subscriptions</h1>
          <p style={{ fontSize: 14, color: SLATE, marginTop: 4 }}>
            Payment infrastructure · Stripe · ACH payouts · Subscription management — Phases 25, 26
          </p>
        </div>

        {/* Status cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px", boxShadow: SHADOW }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Stripe Status</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: stripeStatus === "ACTIVE" ? GREEN : AMBER, marginTop: 6 }}>
              {loading ? "—" : stripeStatus === "ACTIVE" ? "✓ Connected" : stripeStatus}
            </p>
            <p style={{ fontSize: 12, color: SLATE, marginTop: 2 }}>Replit connector · Test mode</p>
          </div>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px", boxShadow: SHADOW }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Bank Account (ACH)</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: payout?.bankLinked ? GREEN : AMBER, marginTop: 6 }}>
              {loading ? "—" : payout?.bankLinked ? "✓ Linked" : "Not linked"}
            </p>
            <p style={{ fontSize: 12, color: SLATE, marginTop: 2 }}>Set SARA_BANK_ACCOUNT_ID to link</p>
          </div>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px", boxShadow: SHADOW }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Payout Cycles</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: DARK, marginTop: 6 }}>
              {loading ? "—" : (payout?.cycleCount ?? "—")}
            </p>
            <p style={{ fontSize: 12, color: SLATE, marginTop: 2 }}>Total automated cycles run</p>
          </div>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "18px 20px", boxShadow: SHADOW }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: SLATE, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Current Plan</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: INDIGO, marginTop: 6 }}>Solo Owner</p>
            <p style={{ fontSize: 12, color: SLATE, marginTop: 2 }}>Full access · No monthly fee</p>
          </div>
        </div>

        {/* ACH Payout Panel */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "22px 24px",
          boxShadow: SHADOW, marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 4px 0" }}>
            ACH Direct Payout · Phase 25
          </h2>
          <p style={{ fontSize: 13, color: SLATE, margin: "0 0 16px 0" }}>
            Automated ACH payouts routed through Stripe → Huntington Bank. Cycle runs on a 2-minute cadence.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 11, color: SLATE, margin: 0 }}>Account owner</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: DARK, marginTop: 2 }}>Sara Stadler</p>
            </div>
            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 11, color: SLATE, margin: 0 }}>Last run</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: DARK, marginTop: 2 }}>
                {loading ? "—" : payout?.lastRunAt ? new Date(payout.lastRunAt).toLocaleString() : "—"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => void handleTriggerPayout()} disabled={triggering}
              style={{ padding: "9px 20px", background: INDIGO, color: "#fff", border: "none",
                borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: triggering ? "not-allowed" : "pointer",
                opacity: triggering ? 0.7 : 1 }}>
              {triggering ? "Triggering…" : "Trigger Payout Now"}
            </button>
            {triggerMsg && (
              <p style={{ fontSize: 13, color: triggerMsg.startsWith("✓") ? GREEN : RED, margin: 0 }}>
                {triggerMsg}
              </p>
            )}
          </div>
          {!payout?.bankLinked && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: `${AMBER}18`,
              borderRadius: 10, border: `1px solid ${AMBER}40` }}>
              <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>
                <strong>To enable ACH payouts:</strong> Set the <code>SARA_BANK_ACCOUNT_ID</code> environment
                variable to your Stripe bank account token (ba_xxx).
              </p>
            </div>
          )}
        </div>

        {/* Plans */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: DARK, margin: "0 0 16px 0" }}>
            Subscription Plans · Phase 26
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {PLANS.map(plan => (
              <div key={plan.id} style={{ background: CARD, border: `2px solid ${plan.current ? plan.color : BORDER}`,
                borderRadius: 20, padding: "22px 24px", boxShadow: plan.current ? `0 4px 20px ${plan.color}20` : SHADOW,
                position: "relative" }}>
                {plan.current && (
                  <span style={{ position: "absolute", top: -12, left: 20, background: plan.color, color: "#fff",
                    fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>
                    Current Plan
                  </span>
                )}
                <p style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: 0 }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, margin: "10px 0 16px" }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: plan.color }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: SLATE }}>{plan.period}</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: SLATE }}>
                      <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {!plan.current && (
                  <button style={{ marginTop: 20, width: "100%", padding: "10px", background: `${plan.color}14`,
                    color: plan.color, border: `1.5px solid ${plan.color}30`, borderRadius: 12,
                    fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {plan.id === "enterprise" ? "Contact Sales" : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Billing info */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: "22px 24px", boxShadow: SHADOW }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: "0 0 16px 0" }}>
            Billing Information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {[
              { label: "Business name",    value: "Lakeside Trinity" },
              { label: "Business type",    value: "Individual / Sole Owner" },
              { label: "Tax ID",           value: "On file" },
              { label: "Billing email",    value: "admin@LakesideTrinity.com" },
              { label: "Billing address",  value: "23926 4th Ave, Siren, WI 54872" },
              { label: "Payment method",   value: "Stripe — connected" },
            ].map(item => (
              <div key={item.label} style={{ padding: "12px 14px", background: "#f8fafc",
                borderRadius: 12, border: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 11, color: SLATE, margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: DARK, marginTop: 2 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
