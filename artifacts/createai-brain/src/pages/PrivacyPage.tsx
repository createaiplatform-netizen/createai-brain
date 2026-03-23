/**
 * PrivacyPage.tsx — Privacy Policy
 * Route: /privacy  (linked from CookieBanner on every public page)
 * Public — no auth required
 */

import React from "react";
import { useLocation } from "wouter";
import useSEO from "@/hooks/useSEO";

const SAGE   = "#9CAF88";
const SAGE_D = "#7a9068";
const TEXT   = "#1a1916";
const MUTED  = "#6b7280";
const BORDER = "rgba(0,0,0,0.07)";

const LAST_UPDATED = "March 1, 2025";

interface Section {
  title: string;
  body:  string | string[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Who we are",
    body: [
      'CreateAI Brain is operated by Lakeside Trinity LLC ("Company," "we," "us," or "our"), a limited liability company based in the United States. Our primary platform is available at createai.digital.',
      "For privacy inquiries, contact us at: admin@LakesideTrinity.com",
    ],
  },
  {
    title: "2. Information we collect",
    body: [
      "Account information: When you create an account (via Replit authentication), we receive your display name, email address, and profile image URL provided by the identity provider.",
      "Usage data: We record which applications you open, feature interactions, session timestamps, and usage frequency. This data is associated with your user ID.",
      "Payment information: Payments are processed by Stripe, Inc. We do not store your full card number, CVV, or other sensitive payment credentials. We receive a Stripe customer ID and subscription status.",
      "Communications: If you contact support or submit a form, we retain the content of that communication.",
      "Cookies: We use a single session cookie (connect.sid) to maintain your authenticated session. This cookie is httpOnly, Secure, and SameSite=Lax. We do not use third-party advertising cookies.",
    ],
  },
  {
    title: "3. How we use your information",
    body: [
      "To operate and maintain your account and the platform.",
      "To process payments and manage your subscription.",
      "To send transactional emails (account confirmation, subscription receipts, platform alerts) via Resend.",
      "To send SMS notifications when you have explicitly opted in via VentonWay.",
      "To analyze usage patterns to improve the platform — never to build advertising profiles.",
      "To enforce our Terms of Service and prevent abuse.",
      "To comply with applicable legal obligations.",
    ],
  },
  {
    title: "4. Family Hub and FamilyBank",
    body: [
      "The Family Hub is a private, invite-only space within your account. Family members you invite receive access only to the Family Hub, Kids Hub (if applicable), and related features — not to the broader platform.",
      "FamilyBank is a VIRTUAL, GAMIFIED points system. It does not represent, hold, transfer, or store real money or real financial assets of any kind. No banking license is held or required. FamilyBank data is stored solely within your account.",
      "Family member data (names, messages, shared content) is accessible only to invited family members within your account.",
    ],
  },
  {
    title: "5. Data sharing",
    body: [
      "We do not sell your personal data.",
      "We share data with service providers only as necessary to operate the platform: Replit (authentication and hosting infrastructure), Stripe (payment processing), Resend (transactional email), Twilio (SMS — opt-in only).",
      "We may disclose information if required by law, court order, or to protect the rights and safety of Lakeside Trinity LLC or others.",
      "We do not share data with advertisers or data brokers.",
    ],
  },
  {
    title: "6. AI-generated content",
    body: [
      "CreateAI Brain uses OpenAI APIs to power AI-generated content within the platform. Your prompts and the AI's responses may be sent to OpenAI for processing, subject to OpenAI's usage policies.",
      "We do not use your content to train our own models.",
      "AI-generated outputs are for informational and creative purposes only. They do not constitute legal, medical, financial, or professional advice.",
    ],
  },
  {
    title: "7. Data retention",
    body: [
      "Account data is retained for as long as your account is active.",
      "If you delete your account, your personal data is deleted within 30 days, except where retention is required by law or for fraud prevention.",
      "Usage analytics may be retained in anonymized, aggregated form indefinitely.",
    ],
  },
  {
    title: "8. Your rights",
    body: [
      "You may access, correct, or delete your personal data by contacting admin@LakesideTrinity.com.",
      "You may opt out of non-essential email communications at any time using the unsubscribe link in any email.",
      "You may opt out of SMS notifications by replying STOP to any text message.",
      "If you are in the European Economic Area (EEA), you have additional rights under GDPR, including the right to data portability and the right to lodge a complaint with a supervisory authority.",
      "California residents may have additional rights under the CCPA. Contact us at the email above to exercise any CCPA rights.",
    ],
  },
  {
    title: "9. Security",
    body: [
      "We use HTTPS for all data in transit. Session tokens are signed with HMAC-SHA256. Passwords are not stored — authentication is delegated to Replit's OAuth infrastructure.",
      "No system is perfectly secure. We cannot guarantee absolute security of your information.",
    ],
  },
  {
    title: "10. Children's privacy",
    body: [
      "The main CreateAI Brain platform is intended for users 18 and older.",
      "The Kids Hub feature is designed for use under the supervision of a parent or guardian who holds a paid account. We do not knowingly collect personal data from children under 13 without verifiable parental consent.",
    ],
  },
  {
    title: "11. Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time. We will post the updated policy here with a revised Last Updated date. Material changes will be communicated via email to active account holders.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      "Lakeside Trinity LLC",
      "Email: admin@LakesideTrinity.com",
      "Platform: createai.digital",
    ],
  },
];

export default function PrivacyPage() {
  const [, navigate] = useLocation();

  useSEO({
    title:       "Privacy Policy — CreateAI Brain",
    description: "Privacy Policy for CreateAI Brain by Lakeside Trinity LLC. How we collect, use, and protect your data.",
    url:         "https://createai.digital/privacy",
    keywords:    "CreateAI Brain privacy policy, data protection, Lakeside Trinity",
    jsonLD: {
      "@context": "https://schema.org",
      "@type":    "WebPage",
      "name":     "CreateAI Brain Privacy Policy",
      "url":      "https://createai.digital/privacy",
    },
  });

  return (
    <div className="min-h-screen" style={{ background: "#fafafa", color: TEXT }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #07100a, #0d1a10)`, paddingBottom: 40 }}>
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-2">
          <button onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")}
            className="inline-flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            ← Back
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `linear-gradient(135deg, ${SAGE_D}, ${SAGE})` }}>
              🔐
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
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

      {/* Summary banner */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-2xl px-6 py-4 my-8 flex gap-4 items-start"
          style={{ background: `${SAGE}10`, border: `1px solid ${SAGE}25` }}>
          <span className="text-2xl flex-shrink-0">ℹ️</span>
          <div>
            <p className="font-semibold text-sm mb-1" style={{ color: SAGE_D }}>Plain-language summary</p>
            <p className="text-sm" style={{ color: MUTED }}>
              We collect only what we need to run the platform. We never sell your data. Payments
              go through Stripe. AI features use OpenAI. The Family Hub is private. FamilyBank is
              virtual only — no real money. You can request deletion at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Table of contents */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="rounded-xl p-5" style={{ background: "white", border: `1px solid ${BORDER}` }}>
          <p className="text-xs font-semibold mb-3" style={{ color: MUTED, letterSpacing: "0.07em" }}>
            TABLE OF CONTENTS
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {SECTIONS.map((s, i) => (
              <a key={i} href={`#section-${i}`}
                className="text-sm py-0.5 hover:underline underline-offset-2"
                style={{ color: SAGE_D }}>
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-4 pb-20 space-y-8">
        {SECTIONS.map((section, i) => (
          <div key={i} id={`section-${i}`} className="rounded-2xl p-6"
            style={{ background: "white", border: `1px solid ${BORDER}` }}>
            <h2 className="text-base font-bold mb-4" style={{ color: SAGE_D }}>{section.title}</h2>
            {Array.isArray(section.body) ? (
              <ul className="space-y-3">
                {section.body.map((para, j) => (
                  <li key={j} className="text-sm leading-relaxed flex gap-2" style={{ color: TEXT }}>
                    <span style={{ color: SAGE, flexShrink: 0, marginTop: 2 }}>•</span>
                    <span>{para}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{section.body}</p>
            )}
          </div>
        ))}

        {/* Footer nav */}
        <div className="text-center pt-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm" style={{ color: MUTED }}>
            <button onClick={() => navigate("/pricing")} className="hover:underline underline-offset-2">Pricing</button>
            <span>·</span>
            <button onClick={() => navigate("/semantic-store")} className="hover:underline underline-offset-2">Platform</button>
            <span>·</span>
            <button onClick={() => navigate("/")} className="hover:underline underline-offset-2">Home</button>
          </div>
          <p className="text-xs mt-4" style={{ color: "#d1d5db" }}>
            © {new Date().getFullYear()} Lakeside Trinity LLC. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
