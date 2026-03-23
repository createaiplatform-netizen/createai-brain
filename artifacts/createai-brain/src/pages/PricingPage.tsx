/**
 * PricingPage.tsx — Public pricing page
 * Route: /pricing  (linked from Sidebar for all logged-in users)
 * Public — no auth required
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import useSEO from "@/hooks/useSEO";

const SAGE     = "#9CAF88";
const SAGE_D   = "#7a9068";
const INDIGO   = "#6366f1";
const BG       = "#fafafa";
const TEXT     = "#111";
const MUTED    = "#6b7280";
const BORDER   = "rgba(0,0,0,0.08)";

interface Plan {
  id:        string;
  name:      string;
  price:     number | null;
  period:    string;
  badge?:    string;
  tagline:   string;
  features:  string[];
  cta:       string;
  ctaPath:   string;
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    id:        "solo",
    name:      "Solo",
    price:     29,
    period:    "/month",
    tagline:   "Perfect for solopreneurs and independent creators.",
    features: [
      "408+ AI apps — full platform access",
      "Unlimited AI sessions",
      "Output Library & PDF export",
      "Personal projects & file storage",
      "Email support",
      "1 seat",
    ],
    cta:       "Start Solo Plan",
    ctaPath:   "/checkout?plan=solo",
    highlight: false,
  },
  {
    id:        "business",
    name:      "Business",
    price:     79,
    period:    "/month",
    badge:     "Most Popular",
    tagline:   "Built for growing teams and serious operators.",
    features: [
      "Everything in Solo",
      "Up to 10 team seats",
      "Advanced analytics & usage tracking",
      "Priority AI processing",
      "VentonWay SMS broadcasting",
      "Customer onboarding flows",
      "Priority email support",
    ],
    cta:       "Start Business Plan",
    ctaPath:   "/checkout?plan=business",
    highlight: true,
  },
  {
    id:        "enterprise",
    name:      "Enterprise",
    price:     299,
    period:    "/month",
    tagline:   "Custom scale, white-label, and full control.",
    features: [
      "Everything in Business",
      "Unlimited seats",
      "White-label branding",
      "Custom domain (createai.digital)",
      "Dedicated onboarding call",
      "Global broadcast activation",
      "SLA guarantee",
      "Direct founder support",
    ],
    cta:       "Contact for Enterprise",
    ctaPath:   "/checkout?plan=enterprise",
    highlight: false,
  },
];

const FAQ = [
  { q: "Can I switch plans later?",           a: "Yes — upgrade or downgrade at any time from your billing settings. Changes take effect immediately." },
  { q: "Is there a free trial?",              a: "Creating your account is free. Paid plans start when you add a payment method. No credit card required to explore." },
  { q: "What payment methods do you accept?", a: "All major credit and debit cards via Stripe. Invoicing available for Enterprise plans." },
  { q: "How does per-seat pricing work?",     a: "Solo is single-seat. Business allows up to 10 seats at the flat rate. Enterprise is unlimited." },
  { q: "What is the Family Hub?",             a: "The Family Hub is a private, invite-only space inside your account. It does not cost extra and is included in any paid plan." },
  { q: "Is FamilyBank real money?",           a: "No. FamilyBank is a virtual points system only — no real funds, no banking. It is a gamified goal-tracking tool for families." },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title:       "Pricing — CreateAI Brain",
    description: "Simple, transparent pricing. Solo $29/mo · Business $79/mo · Enterprise $299/mo. Full platform access. 408+ AI apps.",
    url:         "https://createai.digital/pricing",
    keywords:    "CreateAI Brain pricing, AI platform plans, solo business enterprise",
    jsonLD: {
      "@context": "https://schema.org",
      "@type":    "WebPage",
      "name":     "CreateAI Brain Pricing",
      "url":      "https://createai.digital/pricing",
    },
  });

  return (
    <div className="min-h-screen" style={{ background: BG, color: TEXT }}>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <button onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 mb-8 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: MUTED }}>
          ← Back to platform
        </button>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-sm font-medium"
          style={{ background: `${SAGE}18`, color: SAGE_D, border: `1px solid ${SAGE}40` }}>
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl font-bold mb-4" style={{ letterSpacing: "-0.025em" }}>
          One platform. Every tool.<br />Pick your plan.
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: MUTED }}>
          408+ AI apps, private Family Hub, global broadcasting, output library — all included.
          No usage caps. No hidden fees.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.id}
              className="rounded-2xl p-6 flex flex-col relative transition-all"
              style={{
                background:   plan.highlight ? `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` : "white",
                border:       plan.highlight ? "none" : `1px solid ${BORDER}`,
                boxShadow:    plan.highlight ? `0 8px 32px ${SAGE}30` : "0 1px 4px rgba(0,0,0,0.06)",
                color:        plan.highlight ? "white" : TEXT,
              }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: INDIGO, color: "white" }}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                <p className="text-sm" style={{ opacity: plan.highlight ? 0.8 : undefined, color: plan.highlight ? undefined : MUTED }}>
                  {plan.tagline}
                </p>
              </div>

              <div className="mb-6">
                {plan.price !== null ? (
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-sm mb-1" style={{ opacity: 0.7 }}>{plan.period}</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold">Custom</span>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : SAGE }}>✓</span>
                    <span style={{ opacity: plan.highlight ? 0.9 : undefined }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate(plan.ctaPath)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                style={plan.highlight
                  ? { background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }
                  : { background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})`, color: "white" }
                }>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Annual note */}
        <p className="text-center text-sm mt-6" style={{ color: MUTED }}>
          All prices shown monthly. Annual billing available at checkout — save up to 20%.
        </p>
      </div>

      {/* Feature comparison table */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">What's included</h2>
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {[
            { feature: "408+ AI apps",                 solo: true,  biz: true,  ent: true  },
            { feature: "Unlimited AI sessions",        solo: true,  biz: true,  ent: true  },
            { feature: "Output Library & PDF export",  solo: true,  biz: true,  ent: true  },
            { feature: "Family Hub (private portal)",  solo: true,  biz: true,  ent: true  },
            { feature: "FamilyBank (virtual points)",  solo: true,  biz: true,  ent: true  },
            { feature: "Team seats",                   solo: "1",   biz: "10",  ent: "∞"   },
            { feature: "Advanced analytics",           solo: false, biz: true,  ent: true  },
            { feature: "VentonWay SMS broadcasts",     solo: false, biz: true,  ent: true  },
            { feature: "Global broadcast activation",  solo: false, biz: false, ent: true  },
            { feature: "White-label branding",         solo: false, biz: false, ent: true  },
            { feature: "Custom domain",                solo: false, biz: false, ent: true  },
            { feature: "Dedicated onboarding call",    solo: false, biz: false, ent: true  },
            { feature: "SLA guarantee",                solo: false, biz: false, ent: true  },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-4 items-center"
              style={{ background: i % 2 === 0 ? "white" : "#f9fafb", borderBottom: `1px solid ${BORDER}` }}>
              <div className="px-4 py-3 text-sm col-span-1 font-medium">{row.feature}</div>
              {[row.solo, row.biz, row.ent].map((val, j) => (
                <div key={j} className="text-center py-3 text-sm">
                  {typeof val === "string" ? (
                    <span className="font-semibold" style={{ color: SAGE_D }}>{val}</span>
                  ) : val ? (
                    <span style={{ color: SAGE_D }}>✓</span>
                  ) : (
                    <span style={{ color: "#d1d5db" }}>—</span>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-4 items-center bg-gray-50">
            <div className="px-4 py-3 text-xs text-gray-400" />
            {["Solo", "Business", "Enterprise"].map(name => (
              <div key={name} className="text-center py-3 text-xs font-semibold" style={{ color: MUTED }}>{name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                <span style={{ color: SAGE_D, fontSize: 12 }}>{openFaq === i ? "▲" : "▼"}</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm" style={{ color: MUTED }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center pb-16 px-4">
        <div className="inline-block rounded-2xl px-10 py-8 max-w-lg"
          style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
          <p className="text-white text-xl font-bold mb-2">Start building today</p>
          <p className="text-white text-sm mb-6" style={{ opacity: 0.85 }}>
            Your account is free to create. Activate a plan whenever you're ready.
          </p>
          <button onClick={() => navigate("/checkout")}
            className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
            Choose a plan →
          </button>
        </div>
        <p className="text-xs mt-6" style={{ color: MUTED }}>
          © {new Date().getFullYear()} Lakeside Trinity LLC · createai.digital ·{" "}
          <button onClick={() => navigate("/privacy")} className="underline underline-offset-2 hover:opacity-70">Privacy</button>
        </p>
      </div>
    </div>
  );
}
