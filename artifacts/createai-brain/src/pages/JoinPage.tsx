/**
 * JoinPage.tsx — Referral Landing Page
 *
 * Public route: /join/:code
 * - Records the referral click server-side
 * - Shows a compelling join page with social proof
 * - Stores the referral code in localStorage before redirecting to login
 * - Zero auth required — pure marketing landing
 */

import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";

const INDIGO = "#6366f1";
const PURPLE = "#8b5cf6";
const API = "/api";

interface ReferralInfo {
  valid: boolean;
  convertCount?: number;
}

const APP_HIGHLIGHTS = [
  { icon: "🩺", label: "HealthOS" },
  { icon: "⚖️", label: "LegalPM" },
  { icon: "🌍", label: "StaffingOS" },
  { icon: "💬", label: "AI Chat" },
  { icon: "🧠", label: "BrainGen" },
  { icon: "✨", label: "Creator" },
  { icon: "📣", label: "Marketing" },
  { icon: "📋", label: "Projects" },
  { icon: "🔬", label: "Research" },
  { icon: "💰", label: "Finance" },
  { icon: "📝", label: "Documents" },
  { icon: "🚀", label: "Launch" },
];

export default function JoinPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();

  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    document.title = "You've Been Invited — CreateAI Brain";

    if (!code) return;

    // Record click
    fetch(`${API}/referral/click/${code}`, { method: "POST" }).catch(() => {});

    // Fetch referral info
    fetch(`${API}/referral/info/${code}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.ok ? setInfo({ valid: d.valid, convertCount: d.convertCount }) : setInfo({ valid: false }))
      .catch(() => setInfo({ valid: false }));

    // Store in localStorage for post-login conversion tracking
    localStorage.setItem("createai_ref_code", code);

    return () => { document.title = "CreateAI Brain"; };
  }, [code]);

  const handleJoin = () => {
    setJoining(true);
    localStorage.setItem("createai_ref_code", code);
    navigate("/");
  };

  const DARK_BG = "linear-gradient(135deg, hsl(220,20%,10%) 0%, hsl(240,25%,14%) 50%, hsl(255,30%,12%) 100%)";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", background: DARK_BG, color: "#f1f5f9" }}>

      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 40% at 50% 10%, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />

      <div style={{ position: "relative", maxWidth: 560, margin: "0 auto", padding: "60px 24px 80px", display: "flex", flexDirection: "column", gap: 36, alignItems: "center", textAlign: "center" }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 0 40px rgba(99,102,241,0.35)" }}>
            🧠
          </div>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9" }}>CreateAI Brain</span>
        </div>

        {/* Invite badge */}
        {info?.valid !== false && (
          <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 100, padding: "8px 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc" }}>
              {info?.convertCount ? `${info.convertCount} people have already joined with this link` : "You've been personally invited"}
            </span>
          </div>
        )}

        {/* Headline */}
        <div>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16, color: "#f1f5f9" }}>
            Your invite to the AI OS that replaces your entire software stack
          </h1>
          <p style={{ fontSize: 15, color: "rgba(148,163,184,0.85)", lineHeight: 1.7 }}>
            122 AI apps in one platform — HealthOS, LegalPM, StaffingOS, 12 invention tools, and more. One monthly subscription. No hardware. No licenses. No setup.
          </p>
        </div>

        {/* App grid preview */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {APP_HIGHLIGHTS.map(({ icon, label }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(203,213,225,0.7)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Value props */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "✅", text: "Full access to all 122 AI apps" },
            { icon: "✅", text: "HealthOS, LegalPM, and StaffingOS included" },
            { icon: "✅", text: "No setup, no hardware, no IT team" },
            { icon: "✅", text: "Replaces $100K+ in enterprise software" },
            { icon: "✅", text: "Start free — upgrade anytime for $97/mo" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", textAlign: "left" }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 13, color: "#e2e8f0" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={handleJoin}
            disabled={joining}
            style={{ width: "100%", background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, color: "#fff", border: "none", borderRadius: 16, padding: "18px", fontSize: 16, fontWeight: 800, cursor: joining ? "not-allowed" : "pointer", boxShadow: "0 8px 32px rgba(99,102,241,0.45)", opacity: joining ? 0.8 : 1 }}>
            {joining ? "Redirecting…" : "Accept Invite & Get Full Access →"}
          </button>
          <p style={{ fontSize: 12, color: "rgba(148,163,184,0.5)" }}>
            No credit card required to start · Payment via Cash App $CreateAIDigital or Venmo @CreateAIDigital when ready to upgrade
          </p>
        </div>

        {/* Referral code display */}
        {code && (
          <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "12px 20px", fontSize: 12, color: "#818cf8" }}>
            Referral code: <strong>{code}</strong> · Your friend gets credit for this signup
          </div>
        )}
      </div>
    </div>
  );
}
