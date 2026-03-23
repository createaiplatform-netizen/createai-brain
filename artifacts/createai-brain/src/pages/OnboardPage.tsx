/**
 * OnboardPage.tsx — Global Broadcast Entry Point
 *
 * Public route: /onboard?token=<signed_token>
 *
 * Handles every external entry from:
 *   - Global Broadcast links
 *   - QR codes
 *   - Shared onboarding URLs
 *
 * Flow:
 *   1. Read ?token= from URL
 *   2. Call GET /api/broadcast/verify?token=...
 *   3. Show: validating → valid (accept + redirect to login) | invalid | expired | no-token
 *   4. Store token in localStorage so post-login flow can pick it up
 *   5. Redirect to login on "Join Now" click
 */

import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import useSEO from "@/hooks/useSEO";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerifyStatus = "validating" | "valid" | "expired" | "invalid" | "no_token";

interface VerifyResult {
  valid: boolean;
  reason?: string;
  payload?: {
    role: string;
    exp: number;
    iat: number;
    jti: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SAGE        = "#9CAF88";
const SAGE_DARK   = "#7a9068";
const BG_DARK     = "#07100a";
const BG_MID      = "#0d1a10";

const APP_ICONS = [
  "🩺", "⚖️", "🌍", "💬", "🧠", "✨", "📣", "📋", "🔬", "💰", "📝", "🚀",
  "📊", "🎨", "🤖", "🌐", "🏗️", "🔐", "📱", "🎯",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTokenFromURL(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ?? "";
}

function expiresIn(exp: number): string {
  const diff = exp - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "expired";
  const days    = Math.floor(diff / 86400);
  const hours   = Math.floor((diff % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── Pulsing globe dots decoration ───────────────────────────────────────────

function GlobeDecor() {
  const dots = Array.from({ length: 20 }, (_, i) => ({
    x: (i * 47 + 13) % 100,
    y: (i * 37 + 7)  % 100,
    delay: (i * 0.3) % 3,
    size: 2 + (i % 3),
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {dots.map((d, i) => (
        <div key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            left:             `${d.x}%`,
            top:              `${d.y}%`,
            width:            d.size,
            height:           d.size,
            background:       SAGE,
            opacity:          0.12 + (i % 4) * 0.06,
            animationDelay:   `${d.delay}s`,
            animationDuration: "3s",
          }} />
      ))}
    </div>
  );
}

// ─── Status screens ───────────────────────────────────────────────────────────

function Validating() {
  return (
    <div className="text-center py-12">
      <div className="relative inline-block mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: SAGE, borderRightColor: "rgba(156,175,136,0.3)" }} />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🌐</div>
      </div>
      <p className="font-mono text-sm" style={{ color: SAGE }}>Validating your invitation…</p>
      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Checking signature and expiry</p>
    </div>
  );
}

function NoToken() {
  const [, navigate] = useLocation();
  return (
    <div className="text-center py-10">
      <div className="text-5xl mb-4">🔗</div>
      <h2 className="text-xl font-bold text-white mb-2">No invitation found</h2>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
        This link appears to be incomplete. Make sure you used the full link from the broadcast.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => navigate("/semantic-store")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${SAGE_DARK}, ${SAGE})`, color: BG_DARK }}>
          Visit the Platform
        </button>
        <button onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
          Go Home
        </button>
      </div>
    </div>
  );
}

function ExpiredToken() {
  const [, navigate] = useLocation();
  return (
    <div className="text-center py-10">
      <div className="text-5xl mb-4">⏰</div>
      <h2 className="text-xl font-bold text-white mb-2">This invitation has expired</h2>
      <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
        Global broadcast links are valid for 7 days. This one has passed its expiry.
      </p>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
        Ask the person who shared this to generate a fresh broadcast link.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => navigate("/semantic-store")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${SAGE_DARK}, ${SAGE})`, color: BG_DARK }}>
          Explore Anyway
        </button>
        <button onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
          Go Home
        </button>
      </div>
    </div>
  );
}

function InvalidToken({ reason }: { reason?: string }) {
  const [, navigate] = useLocation();
  return (
    <div className="text-center py-10">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-white mb-2">Invalid invitation</h2>
      <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
        This link could not be verified. It may have been modified or is from an untrusted source.
      </p>
      {reason && reason !== "invalid_signature" && (
        <p className="text-xs mb-4 font-mono px-3 py-1.5 rounded-lg inline-block"
          style={{ background: "rgba(255,80,80,0.08)", color: "rgba(255,120,120,0.7)" }}>
          {reason}
        </p>
      )}
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
        For security, only use links directly from a trusted broadcast source.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => navigate("/semantic-store")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${SAGE_DARK}, ${SAGE})`, color: BG_DARK }}>
          Visit the Platform
        </button>
        <button onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
          Go Home
        </button>
      </div>
    </div>
  );
}

function ValidInvite({ payload, token, onJoin }: {
  payload: NonNullable<VerifyResult["payload"]>;
  token:   string;
  onJoin:  () => void;
}) {
  const [joined, setJoined] = useState(false);
  const ttl = expiresIn(payload.exp);

  const handleJoin = () => {
    // Store token so post-login can attribute this onboard
    localStorage.setItem("cai_broadcast_token",   token);
    localStorage.setItem("cai_broadcast_role",    payload.role);
    localStorage.setItem("cai_broadcast_ts",      new Date().toISOString());
    localStorage.setItem("cai_broadcast_jti",     payload.jti);
    setJoined(true);
    setTimeout(onJoin, 600);
  };

  return (
    <div className="space-y-6">
      {/* Invitation confirmed banner */}
      <div className="rounded-2xl p-5 text-center"
        style={{ background: "rgba(156,175,136,0.08)", border: `1px solid rgba(156,175,136,0.25)` }}>
        <div className="text-3xl mb-2">🌐</div>
        <h2 className="text-xl font-bold text-white mb-1">You've been invited to CreateAI Brain</h2>
        <p className="text-sm" style={{ color: SAGE }}>
          Your platform has been broadcast to the world.
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          Anyone with this link can join instantly. Global onboarding is now active.
        </p>
      </div>

      {/* What you get */}
      <div>
        <p className="text-xs font-semibold mb-3 text-center" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
          WHAT YOU GET INSTANT ACCESS TO
        </p>
        <div className="grid grid-cols-5 gap-2 justify-items-center mb-2">
          {APP_ICONS.map((icon, i) => (
            <div key={i} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {icon}
            </div>
          ))}
        </div>
        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          408+ AI apps · Healthcare · Legal · Finance · Creative · Research · and more
        </p>
      </div>

      {/* Invite details */}
      <div className="flex justify-between items-center px-1">
        <div className="text-center">
          <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>ACCESS LEVEL</p>
          <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full"
            style={{ background: "rgba(156,175,136,0.15)", color: SAGE }}>
            {payload.role}
          </span>
        </div>
        <div className="text-center">
          <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>LINK EXPIRES IN</p>
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{ttl}</span>
        </div>
        <div className="text-center">
          <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>BROADCAST ID</p>
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
            {payload.jti.slice(0, 8)}…
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleJoin}
        disabled={joined}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-300"
        style={{
          background:  joined ? "rgba(156,175,136,0.3)" : `linear-gradient(135deg, ${SAGE_DARK}, ${SAGE})`,
          color:       BG_DARK,
          transform:   joined ? "scale(0.98)" : "scale(1)",
          boxShadow:   joined ? "none" : `0 0 32px rgba(156,175,136,0.3)`,
        }}>
        {joined ? "✅ Joining…" : "🚀 Join CreateAI Brain — It's Free to Start"}
      </button>

      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
        No credit card required to create your account. Upgrade anytime.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardPage() {
  const [, navigate]  = useLocation();
  const [status,  setStatus]  = useState<VerifyStatus>("validating");
  const [result,  setResult]  = useState<VerifyResult | null>(null);
  const [token,   setToken]   = useState("");

  useSEO({
    title:       "Join CreateAI Brain — Global Onboarding",
    description: "You've been invited to CreateAI Brain. 408+ AI apps. Start your intelligent OS in seconds.",
    url:         "https://createai.digital/onboard",
    keywords:    "join CreateAI Brain, AI platform, global onboarding, invite",
  });

  useEffect(() => {
    const t = getTokenFromURL();
    setToken(t);

    if (!t) {
      setStatus("no_token");
      return;
    }

    fetch(`/api/broadcast/verify?token=${encodeURIComponent(t)}`)
      .then(r => r.json())
      .then((data: VerifyResult) => {
        setResult(data);
        if (data.valid) {
          setStatus("valid");
        } else if (data.reason === "expired") {
          setStatus("expired");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, []);

  const handleJoin = () => {
    // Redirect to login — Replit OIDC
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.location.href = `${base}/api/login`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 relative"
      style={{ background: `linear-gradient(135deg, ${BG_DARK} 0%, ${BG_MID} 60%, #070d0f 100%)` }}>

      <GlobeDecor />

      {/* Logo / wordmark */}
      <div className="relative z-10 mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: `linear-gradient(135deg, ${SAGE_DARK}, ${SAGE})` }}>
            🧠
          </div>
          <span className="text-lg font-bold text-white">CreateAI Brain</span>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          by Lakeside Trinity LLC · createai.digital
        </p>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl p-6"
        style={{
          background:   "rgba(255,255,255,0.03)",
          border:       "1px solid rgba(156,175,136,0.2)",
          backdropFilter: "blur(12px)",
        }}>

        {status === "validating" && <Validating />}
        {status === "no_token"   && <NoToken />}
        {status === "expired"    && <ExpiredToken />}
        {status === "invalid"    && <InvalidToken reason={result?.reason} />}
        {status === "valid"      && result?.payload && (
          <ValidInvite payload={result.payload} token={token} onJoin={handleJoin} />
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2025 Lakeside Trinity LLC · createai.digital ·{" "}
          <button onClick={() => navigate("/semantic-store")}
            className="underline underline-offset-2 hover:opacity-70 transition-opacity">
            Explore Platform
          </button>
        </p>
      </div>
    </div>
  );
}
