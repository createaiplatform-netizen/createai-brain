/**
 * TermsPage.tsx — Terms of Service
 * Route: /terms  (linked from NDAGate, CookieBanner, PricingPage, 404 page)
 * Public — no auth required
 */

import React, { useState } from "react";
import { useLocation } from "wouter";
import useSEO from "@/hooks/useSEO";

const SAGE   = "#9CAF88";
const SAGE_D = "#7a9068";
const TEXT   = "#1a1916";
const MUTED  = "#6b7280";
const BORDER = "rgba(0,0,0,0.07)";

const LAST_UPDATED = "March 1, 2025";

interface Section { title: string; body: string[] }

const SECTIONS: Section[] = [
  {
    title: "1. Acceptance of Terms",
    body: [
      'By creating an account, accessing, or using CreateAI Brain ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform.',
      'These Terms constitute a binding agreement between you and Lakeside Trinity LLC ("Company", "we", "us", "our"), operator of CreateAI Brain at createai.digital.',
      "We may update these Terms at any time. Material changes will be communicated to active account holders by email. Continued use after the effective date constitutes acceptance.",
    ],
  },
  {
    title: "2. Eligibility",
    body: [
      "You must be at least 18 years old to create a paid account or access the main platform.",
      "The Kids Hub feature is available to children under 18 only under the direct supervision of a parent or guardian who holds a valid account.",
      "You represent that all information you provide is accurate and that you have the authority to enter into these Terms.",
    ],
  },
  {
    title: "3. Platform Access and License",
    body: [
      "Subject to these Terms and your paid subscription, we grant you a non-exclusive, non-transferable, revocable license to access and use the Platform for your lawful business and personal purposes.",
      "You may not sublicense, sell, resell, transfer, assign, or commercially exploit the Platform except as expressly permitted.",
      "We reserve the right to suspend or terminate your access for violation of these Terms, non-payment, or any reason we deem necessary to protect the Platform and its users.",
    ],
  },
  {
    title: "4. Subscriptions and Billing",
    body: [
      "Paid plans are billed on a monthly or annual basis via Stripe. Prices are displayed at createai.digital/pricing.",
      "Subscriptions renew automatically until cancelled. You may cancel at any time from your billing settings, effective at the end of the current billing period.",
      "We do not issue refunds for partial months or unused portions of a billing period, except where required by applicable law.",
      "We reserve the right to change pricing with 30 days notice to active subscribers.",
    ],
  },
  {
    title: "5. Acceptable Use",
    body: [
      "You agree to use the Platform only for lawful purposes. You must not use the Platform to: (a) violate any law or regulation; (b) infringe intellectual property rights; (c) transmit harmful, abusive, harassing, defamatory, or fraudulent content; (d) attempt to gain unauthorized access to the Platform or its systems; (e) reverse-engineer, decompile, or disassemble any part of the Platform.",
      "AI-generated content is for informational, creative, and business productivity purposes only. It does not constitute legal, medical, financial, or professional advice. You are responsible for verifying any AI output before acting on it.",
      "We reserve the right to remove any content and terminate accounts that violate this section.",
    ],
  },
  {
    title: "6. Family Hub and FamilyBank",
    body: [
      "The Family Hub is a private, invite-only feature for your personal family group. You are responsible for any family members you invite and their activity on the Platform.",
      "FamilyBank is a VIRTUAL, GAMIFIED system only. It does not represent, hold, transfer, or store real money, real currency, or real financial assets of any kind. Lakeside Trinity LLC holds no banking license and provides no banking services. FamilyBank is a productivity and goal-tracking tool.",
      "No child-specific personal data is collected beyond what is necessary to operate the Kids Hub under parental supervision.",
    ],
  },
  {
    title: "7. AI and Third-Party Services",
    body: [
      "The Platform uses OpenAI APIs to power AI-generated content. Your use of AI features is also subject to OpenAI's usage policies.",
      "Payments are processed by Stripe, Inc. Your use of payment features is also subject to Stripe's Terms of Service.",
      "Transactional emails are sent via Resend. SMS notifications are sent via Twilio when you opt in.",
      "We are not responsible for the accuracy, completeness, or legality of AI-generated content. All AI outputs should be reviewed by a qualified human before use in legal, medical, financial, or professional contexts.",
    ],
  },
  {
    title: "8. Intellectual Property",
    body: [
      "The Platform, its design, software, and all proprietary content are owned by Lakeside Trinity LLC and protected by intellectual property laws.",
      "You retain ownership of content you create using the Platform. By using the Platform, you grant us a limited license to store and process your content solely to provide the service.",
      "You must not reproduce, distribute, or create derivative works from our Platform without express written permission.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    body: [
      "THE PLATFORM IS PROVIDED \"AS IS\" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.",
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, LAKESIDE TRINITY LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM.",
      "OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.",
    ],
  },
  {
    title: "10. Indemnification",
    body: [
      "You agree to indemnify, defend, and hold harmless Lakeside Trinity LLC and its officers, employees, and agents from any claims, damages, liabilities, costs, and expenses (including reasonable attorney fees) arising out of your use of the Platform, your violation of these Terms, or your violation of any third-party rights.",
    ],
  },
  {
    title: "11. Termination",
    body: [
      "You may terminate your account at any time from your settings. We may terminate or suspend your account immediately for violation of these Terms, non-payment, or for any reason with or without notice.",
      "On termination, your right to use the Platform ceases immediately. Sections that by their nature should survive termination will do so, including Intellectual Property, Limitation of Liability, Indemnification, and Governing Law.",
    ],
  },
  {
    title: "12. Governing Law and Disputes",
    body: [
      "These Terms are governed by the laws of the United States and the state in which Lakeside Trinity LLC is incorporated, without regard to conflict of law principles.",
      "Any disputes shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration under the rules of the American Arbitration Association.",
      "Class action waiver: you waive any right to participate in a class action lawsuit or class-wide arbitration against Lakeside Trinity LLC.",
    ],
  },
  {
    title: "13. Contact",
    body: [
      "Lakeside Trinity LLC",
      "Email: admin@LakesideTrinity.com",
      "Platform: createai.digital",
    ],
  },
];

export default function TermsPage() {
  const [, navigate]   = useLocation();
  const [open, setOpen] = useState<number | null>(null);

  useSEO({
    title:       "Terms of Service — CreateAI Brain",
    description: "Terms of Service for CreateAI Brain by Lakeside Trinity LLC. Your agreement with us governing use of the platform.",
    url:         "https://createai.digital/terms",
    keywords:    "CreateAI Brain terms of service, user agreement, Lakeside Trinity",
    jsonLD: {
      "@context": "https://schema.org",
      "@type":    "WebPage",
      "name":     "CreateAI Brain Terms of Service",
      "url":      "https://createai.digital/terms",
    },
  });

  return (
    <div className="min-h-screen" style={{ background: "#fafafa", color: TEXT }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #07100a, #0d1a10)", paddingBottom: 40 }}>
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-2">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")}
            className="inline-flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            ← Back
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}
            >
              📋
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Lakeside Trinity LLC · createai.digital
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span>Last updated: {LAST_UPDATED}</span>
            <span>·</span>
            <span>Effective: {LAST_UPDATED}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="max-w-3xl mx-auto px-4">
        <div
          className="rounded-2xl px-6 py-4 my-8 flex gap-4 items-start"
          style={{ background: `${SAGE}10`, border: `1px solid ${SAGE}25` }}
        >
          <span className="text-2xl flex-shrink-0">ℹ️</span>
          <div>
            <p className="font-semibold text-sm mb-1" style={{ color: SAGE_D }}>Plain-language summary</p>
            <p className="text-sm" style={{ color: MUTED }}>
              Use the platform lawfully, pay your subscription, don&apos;t misuse AI outputs,
              understand FamilyBank is virtual only (no real money), and be aware of
              our liability limits. Full details in the sections below.
            </p>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="rounded-xl p-5" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <p className="text-xs font-semibold mb-3" style={{ color: MUTED, letterSpacing: "0.07em" }}>
            TABLE OF CONTENTS
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {SECTIONS.map((s, i) => (
              <a key={i} href={`#term-${i}`}
                className="text-sm py-0.5 hover:underline underline-offset-2"
                style={{ color: SAGE_D }}>
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-4 pb-20 space-y-4">
        {SECTIONS.map((section, i) => (
          <div
            key={i}
            id={`term-${i}`}
            className="rounded-2xl overflow-hidden"
            style={{ background: "white", border: `1px solid ${BORDER}` }}
          >
            <button
              className="w-full flex items-center justify-between px-6 py-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-semibold text-sm" style={{ color: SAGE_D }}>{section.title}</span>
              <span style={{ color: MUTED, fontSize: 11 }}>{open === i ? "▲" : "▼"}</span>
            </button>
            {open === i && (
              <div className="px-6 pb-5 space-y-3 border-t" style={{ borderColor: BORDER }}>
                {section.body.map((para, j) => (
                  <p key={j} className="text-sm leading-relaxed pt-3" style={{ color: TEXT }}>
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Footer nav */}
        <div className="text-center pt-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: MUTED }}>
            <button onClick={() => navigate("/privacy")} className="hover:underline underline-offset-2">Privacy Policy</button>
            <span>·</span>
            <button onClick={() => navigate("/pricing")} className="hover:underline underline-offset-2">Pricing</button>
            <span>·</span>
            <button onClick={() => navigate("/semantic-store")} className="hover:underline underline-offset-2">Platform</button>
          </div>
          <p className="text-xs mt-4" style={{ color: "#d1d5db" }}>
            © {new Date().getFullYear()} Lakeside Trinity LLC. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
