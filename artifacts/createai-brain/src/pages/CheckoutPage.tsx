/**
 * CheckoutPage.tsx — CreateAI Brain · Customer Checkout
 *
 * Customer-facing purchase flow:
 *   1. Display available subscription plans from Stripe
 *   2. Let customer pick a plan
 *   3. POST to /api/integrations/stripe/checkout → get Stripe-hosted URL
 *   4. Redirect to Stripe Checkout
 *   5. Handle success/cancel return
 *
 * Route: /checkout
 */

import React, { useState, useEffect } from "react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Price {
  id:          string;
  amount:      number;
  currency:    string;
  interval?:   string;
  productName: string;
  productDesc: string;
  active:      boolean;
}

const FALLBACK_PLANS: Price[] = [
  {
    id:          "solo",
    amount:      0,
    currency:    "usd",
    productName: "Solo Owner Plan",
    productDesc: "Full platform access — all 47+ AI engines, healthcare, legal, staffing, projects, and advertising hub. No monthly fee for the founding member.",
    active:      true,
  },
  {
    id:          "team",
    amount:      19900,
    currency:    "usd",
    interval:    "month",
    productName: "Team Plan",
    productDesc: "Everything in Solo + up to 10 team members, role-based access, collaboration tools, and priority support.",
    active:      true,
  },
  {
    id:          "enterprise",
    amount:      49900,
    currency:    "usd",
    interval:    "month",
    productName: "Enterprise Plan",
    productDesc: "Unlimited team members, white-label branding, custom domain, dedicated onboarding, SLA guarantee.",
    active:      true,
  },
];

function formatAmount(amount: number, currency: string): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style:    "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export default function CheckoutPage() {
  const [plans,          setPlans]          = useState<Price[]>(FALLBACK_PLANS);
  const [selected,       setSelected]       = useState<string | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [fetchingPlans,  setFetchingPlans]  = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "success" | "cancel">("idle");

  // Read checkout result from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") setCheckoutStatus("success");
    if (params.get("checkout") === "cancel")  setCheckoutStatus("cancel");
  }, []);

  // Fetch real prices from Stripe
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/integrations/stripe/prices`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json() as { prices?: Price[]; ok?: boolean };
          if (Array.isArray(data.prices) && data.prices.length > 0) {
            setPlans(data.prices);
          }
        }
      } catch {
        // Use fallback plans
      } finally {
        setFetchingPlans(false);
      }
    };
    void fetchPrices();
  }, []);

  const handleCheckout = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);

    try {
      const plan = plans.find(p => p.id === selected);
      if (!plan) throw new Error("Plan not found");

      // Free plan — no checkout needed
      if (plan.amount === 0) {
        window.location.href = `${BASE_URL}/`;
        return;
      }

      // Real Stripe checkout
      const res = await fetch(`${BASE_URL}/api/integrations/stripe/checkout`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({
          amount:      plan.amount,
          productName: plan.productName,
        }),
      });

      const data = await res.json() as { ok?: boolean; url?: string; error?: string };

      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Checkout failed. Please try again.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Success State ──────────────────────────────────────────────────────────
  if (checkoutStatus === "success") {
    return (
      <div style={styles.page}>
        <div style={styles.successBox}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
          <h1 style={{ ...styles.heading, color: "#22c55e", marginBottom: 8 }}>Payment Successful</h1>
          <p style={styles.subtext}>Welcome to CreateAI Brain. Your plan is now active.</p>
          <a href={`${BASE_URL}/`} style={styles.ctaBtn}>Go to Dashboard</a>
        </div>
      </div>
    );
  }

  // ─── Cancel State ───────────────────────────────────────────────────────────
  if (checkoutStatus === "cancel") {
    return (
      <div style={styles.page}>
        <div style={styles.successBox}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>↩</div>
          <h1 style={{ ...styles.heading, marginBottom: 8 }}>Checkout Cancelled</h1>
          <p style={styles.subtext}>No charge was made. Pick a plan below to try again.</p>
          <button
            style={styles.ctaBtn}
            onClick={() => setCheckoutStatus("idle")}
          >
            Choose a Plan
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Checkout ──────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <a href={`${BASE_URL}/`} style={styles.logo}>
          CreateAI <span style={{ color: "#818cf8" }}>Brain</span>
        </a>
        <div style={styles.badge}>🔒 Secure Checkout · Powered by Stripe</div>
      </div>

      <div style={styles.wrap}>
        <div style={styles.hero}>
          <h1 style={styles.heading}>Choose Your Plan</h1>
          <p style={styles.subtext}>
            All plans include full access to the CreateAI Brain platform.
            Upgrade or downgrade anytime. Cancel with one click.
          </p>
        </div>

        {/* Plans grid */}
        {fetchingPlans ? (
          <div style={styles.loading}>Loading plans…</div>
        ) : (
          <div style={styles.plansGrid}>
            {plans.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                style={{
                  ...styles.planCard,
                  border: selected === plan.id
                    ? "2px solid #6366f1"
                    : "2px solid rgba(255,255,255,0.1)",
                  background: selected === plan.id
                    ? "rgba(99,102,241,0.12)"
                    : "rgba(255,255,255,0.05)",
                }}
                aria-pressed={selected === plan.id}
              >
                {plan.amount === 0 && (
                  <div style={styles.freeBadge}>Current Plan</div>
                )}
                {plan.amount === 19900 && (
                  <div style={{ ...styles.freeBadge, background: "#6366f1" }}>Popular</div>
                )}
                <div style={styles.planName}>{plan.productName}</div>
                <div style={styles.planPrice}>
                  {formatAmount(plan.amount, plan.currency)}
                  {plan.interval && (
                    <span style={styles.planInterval}> / {plan.interval}</span>
                  )}
                </div>
                <div style={styles.planDesc}>{plan.productDesc}</div>
                {selected === plan.id && (
                  <div style={styles.selectedCheck}>✓ Selected</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={styles.errorBox} role="alert">
            {error}
          </div>
        )}

        {/* CTA */}
        <div style={styles.ctaRow}>
          <button
            style={{
              ...styles.ctaBtn,
              opacity: (!selected || loading) ? 0.6 : 1,
              cursor:  (!selected || loading) ? "not-allowed" : "pointer",
            }}
            disabled={!selected || loading}
            onClick={() => void handleCheckout()}
          >
            {loading
              ? "Redirecting to Stripe…"
              : selected
                ? plans.find(p => p.id === selected)?.amount === 0
                  ? "Continue with Free Plan"
                  : "Continue to Secure Checkout"
                : "Select a Plan to Continue"}
          </button>
          <p style={styles.trustNote}>
            🔒 Encrypted · Stripe-secured · No subscription traps
          </p>
        </div>

        {/* Feature guarantees */}
        <div style={styles.guarantees}>
          {[
            { icon: "🔄", text: "Cancel anytime, no questions" },
            { icon: "💳", text: "All major cards accepted" },
            { icon: "🛡️", text: "256-bit SSL encryption" },
            { icon: "📞", text: "Human support available" },
          ].map(g => (
            <div key={g.text} style={styles.guaranteeItem}>
              <span style={{ fontSize: "1.2rem" }}>{g.icon}</span>
              <span style={styles.guaranteeText}>{g.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily:           "'Inter', system-ui, -apple-system, sans-serif",
    background:           "#020617",
    color:                "#e2e8f0",
    minHeight:            "100vh",
    WebkitFontSmoothing:  "antialiased",
  },
  header: {
    borderBottom:       "1px solid rgba(255,255,255,0.08)",
    padding:            "0 24px",
    height:             52,
    display:            "flex",
    alignItems:         "center",
    justifyContent:     "space-between",
    position:           "sticky" as const,
    top:                0,
    zIndex:             100,
    background:         "rgba(2,6,23,0.97)",
    backdropFilter:     "blur(12px)",
  },
  logo: {
    fontSize:           "1rem",
    fontWeight:         900,
    letterSpacing:      "-0.03em",
    color:              "#e2e8f0",
    textDecoration:     "none",
  },
  badge: {
    fontSize:           "0.72rem",
    fontWeight:         700,
    color:              "#94a3b8",
  },
  wrap: {
    maxWidth:           700,
    margin:             "0 auto",
    padding:            "48px 24px",
  },
  hero: {
    textAlign:          "center" as const,
    marginBottom:       40,
  },
  heading: {
    fontSize:           "2rem",
    fontWeight:         900,
    letterSpacing:      "-0.04em",
    marginBottom:       12,
    color:              "#e2e8f0",
  },
  subtext: {
    fontSize:           "0.95rem",
    color:              "#94a3b8",
    lineHeight:         1.6,
    maxWidth:           500,
    margin:             "0 auto",
  },
  loading: {
    textAlign:          "center" as const,
    color:              "#64748b",
    padding:            "32px 0",
    fontSize:           "0.9rem",
  },
  plansGrid: {
    display:            "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap:                16,
    marginBottom:       32,
  },
  planCard: {
    background:         "rgba(255,255,255,0.05)",
    borderRadius:       16,
    padding:            "24px 20px",
    textAlign:          "left" as const,
    cursor:             "pointer",
    position:           "relative" as const,
    transition:         "all 0.15s ease",
    color:              "#e2e8f0",
    width:              "100%",
  },
  freeBadge: {
    position:           "absolute" as const,
    top:                -10,
    right:              12,
    background:         "#22c55e",
    color:              "#fff",
    fontSize:           "0.58rem",
    fontWeight:         800,
    textTransform:      "uppercase" as const,
    letterSpacing:      "0.08em",
    borderRadius:       99,
    padding:            "3px 10px",
  },
  planName: {
    fontSize:           "0.9rem",
    fontWeight:         800,
    color:              "#818cf8",
    marginBottom:       8,
  },
  planPrice: {
    fontSize:           "1.6rem",
    fontWeight:         900,
    color:              "#e2e8f0",
    letterSpacing:      "-0.03em",
    marginBottom:       12,
  },
  planInterval: {
    fontSize:           "0.85rem",
    fontWeight:         500,
    color:              "#64748b",
  },
  planDesc: {
    fontSize:           "0.78rem",
    color:              "#94a3b8",
    lineHeight:         1.55,
  },
  selectedCheck: {
    marginTop:          12,
    fontSize:           "0.75rem",
    fontWeight:         800,
    color:              "#818cf8",
  },
  errorBox: {
    background:         "rgba(239,68,68,0.1)",
    border:             "1px solid rgba(239,68,68,0.3)",
    borderRadius:       10,
    padding:            "12px 16px",
    color:              "#fca5a5",
    fontSize:           "0.85rem",
    marginBottom:       20,
  },
  ctaRow: {
    textAlign:          "center" as const,
    marginBottom:       32,
  },
  ctaBtn: {
    display:            "inline-block",
    background:         "#6366f1",
    color:              "#fff",
    fontSize:           "0.95rem",
    fontWeight:         800,
    letterSpacing:      "-0.02em",
    border:             "none",
    borderRadius:       12,
    padding:            "14px 32px",
    cursor:             "pointer",
    textDecoration:     "none",
    transition:         "background 0.15s ease",
  },
  trustNote: {
    marginTop:          12,
    fontSize:           "0.72rem",
    color:              "#475569",
  },
  guarantees: {
    display:            "grid",
    gridTemplateColumns: "1fr 1fr",
    gap:                12,
    borderTop:          "1px solid rgba(255,255,255,0.08)",
    paddingTop:         24,
  },
  guaranteeItem: {
    display:            "flex",
    alignItems:         "center",
    gap:                10,
  },
  guaranteeText: {
    fontSize:           "0.8rem",
    color:              "#94a3b8",
  },
  successBox: {
    maxWidth:           480,
    margin:             "80px auto",
    textAlign:          "center" as const,
    padding:            "48px 32px",
    background:         "rgba(255,255,255,0.05)",
    border:             "1px solid rgba(255,255,255,0.1)",
    borderRadius:       20,
  },
};
