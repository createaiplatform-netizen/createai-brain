/**
 * LeadCaptureForm.tsx — Internal email capture (replaces Mailchimp/ConvertKit)
 * Embedded on every SEO landing page. Stores directly to your own DB.
 */

import React, { useState } from "react";

interface LeadCaptureFormProps {
  industry?: string;
  refCode?: string;
  utmSource?: string;
  utmCampaign?: string;
  compact?: boolean;
}

const API = "/api";

function getUtmParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    utmSource:   p.get("utm_source") ?? "seo",
    utmMedium:   p.get("utm_medium") ?? "landing",
    utmCampaign: p.get("utm_campaign") ?? "organic",
    refCode:     p.get("ref") ?? localStorage.getItem("createai_ref_code") ?? undefined,
  };
}

export default function LeadCaptureForm({ industry, compact = false }: LeadCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName]   = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg]     = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");

    const utm = getUtmParams();

    try {
      const r = await fetch(`${API}/leads/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name:  name.trim() || null,
          industry,
          ...utm,
        }),
      });
      const data = await r.json() as { ok: boolean; message?: string };
      if (data.ok) {
        setState("done");
        setMsg(data.message ?? "You're on the list!");
      } else {
        setState("error");
        setMsg("Something went wrong. Try again.");
      }
    } catch {
      setState("error");
      setMsg("Network error — please try again.");
    }
  };

  const INDIGO = "#6366f1";

  if (state === "done") {
    return (
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: compact ? 12 : 16, padding: compact ? "16px 20px" : "24px 28px", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: compact ? 14 : 16, fontWeight: 700, color: "#166534" }}>You're in!</div>
        <div style={{ fontSize: 13, color: "#15803d", marginTop: 4 }}>We'll be in touch with early access and updates.</div>
      </div>
    );
  }

  return (
    <div style={{ background: compact ? "transparent" : "rgba(255,255,255,0.04)", border: compact ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: compact ? 0 : 20, padding: compact ? 0 : "32px 28px" }}>
      {!compact && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>
            Get early access + updates
          </div>
          <div style={{ fontSize: 13, color: "rgba(148,163,184,0.8)" }}>
            No spam. Unsubscribe anytime. Your data stays in our system.
          </div>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!compact && (
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "#f1f5f9", outline: "none" }}
          />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            placeholder={compact ? "Your email address" : "Your work email"}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ flex: 1, background: compact ? "#f8fafc" : "rgba(255,255,255,0.07)", border: compact ? "1px solid #e2e8f0" : "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 16px", fontSize: 14, color: compact ? "#0f172a" : "#f1f5f9", outline: "none" }}
          />
          <button
            type="submit"
            disabled={state === "loading"}
            style={{ background: `linear-gradient(135deg, ${INDIGO}, #8b5cf6)`, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: state === "loading" ? "not-allowed" : "pointer", whiteSpace: "nowrap", opacity: state === "loading" ? 0.7 : 1 }}>
            {state === "loading" ? "…" : compact ? "Notify me →" : "Get Access →"}
          </button>
        </div>

        {state === "error" && (
          <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>{msg}</div>
        )}

        {!compact && (
          <div style={{ fontSize: 11, color: "rgba(148,163,184,0.5)", textAlign: "center", marginTop: 4 }}>
            🔒 Your email is stored securely on our servers. Never sold. Never shared.
          </div>
        )}
      </form>
    </div>
  );
}
