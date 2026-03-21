/**
 * ReferralApp.tsx — Viral Referral Dashboard
 * OS App: gives users their unique referral link + stats + share tools
 */

import React, { useState, useEffect, useCallback } from "react";

const API = "/api";
const INDIGO = "#6366f1";

interface ReferralData {
  code: string;
  url: string;
  clickCount: number;
  convertCount: number;
  shareMessages: { twitter: string; linkedin: string; direct: string };
}

interface LeaderboardEntry {
  rank: number;
  convertCount: number;
  clickCount: number;
  displayName: string;
}

const SHARE_CHANNELS = [
  {
    id: "direct",
    icon: "🔗",
    label: "Direct Link",
    color: "#6366f1",
    action: (msg: string, url: string) => { navigator.clipboard.writeText(url); },
    buttonLabel: "Copy Link",
  },
  {
    id: "twitter",
    icon: "𝕏",
    label: "X / Twitter",
    color: "#000",
    action: (msg: string) => { window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(msg)}`, "_blank"); },
    buttonLabel: "Share on X",
  },
  {
    id: "linkedin",
    icon: "in",
    label: "LinkedIn",
    color: "#0077b5",
    action: (_msg: string, url: string) => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank"); },
    buttonLabel: "Post on LinkedIn",
  },
  {
    id: "whatsapp",
    icon: "💬",
    label: "WhatsApp",
    color: "#25d366",
    action: (msg: string) => { window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank"); },
    buttonLabel: "Send on WhatsApp",
  },
  {
    id: "email",
    icon: "✉️",
    label: "Email",
    color: "#f59e0b",
    action: (msg: string, url: string) => {
      window.location.href = `mailto:?subject=You're invited to CreateAI Brain&body=${encodeURIComponent(msg + "\n\n" + url)}`;
    },
    buttonLabel: "Send Email",
  },
];

export default function ReferralApp() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, lb] = await Promise.all([
        fetch(`${API}/referral/my-link`).then(res => res.ok ? res.json() : null),
        fetch(`${API}/referral/leaderboard`).then(res => res.ok ? res.json() : null),
      ]);
      if (r?.ok) setData(r);
      if (lb?.ok) setLeaderboard(lb.leaderboard ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#64748b", fontSize: 14 }}>
      Loading your referral dashboard…
    </div>
  );

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px", fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)", borderRadius: 16, padding: "28px 28px", marginBottom: 20, color: "#f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${INDIGO}, #8b5cf6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔗</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Referral Program</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Share CreateAI Brain · Earn recognition · Build the platform together</p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Link Clicks", value: data?.clickCount ?? 0, color: "#60a5fa" },
            { label: "Conversions", value: data?.convertCount ?? 0, color: "#4ade80" },
            { label: "Your Rank", value: leaderboard.find(l => l.convertCount === data?.convertCount)?.rank ?? "—", color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Your referral link */}
      {data && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Your Unique Referral Link</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#475569", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {data.url}
            </div>
            <button onClick={() => copyLink(data.url, "main")}
              style={{ background: copied === "main" ? "#10b981" : INDIGO, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.2s" }}>
              {copied === "main" ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
            Your code: <strong style={{ color: INDIGO }}>{data.code}</strong>
          </div>
        </div>
      )}

      {/* Share channels */}
      {data && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Share On Any Channel</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {SHARE_CHANNELS.map(ch => (
              <button key={ch.id}
                onClick={() => {
                  const msg = ch.id === "linkedin" ? data.shareMessages.linkedin : ch.id === "twitter" ? data.shareMessages.twitter : data.shareMessages.direct;
                  ch.action(msg, data.url);
                  if (ch.id === "direct") { copyLink(data.url, ch.id); }
                }}
                style={{ background: copied === ch.id ? "#10b981" : `${ch.color}15`, color: ch.color, border: `1px solid ${ch.color}30`, borderRadius: 12, padding: "12px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{ch.icon}</div>
                <div>{copied === ch.id ? "✓ Copied!" : ch.buttonLabel}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pre-written messages */}
      {data && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Pre-Written Share Messages</div>
          {[
            { label: "For X / Twitter", msg: data.shareMessages.twitter, id: "msg-twitter" },
            { label: "For LinkedIn", msg: data.shareMessages.linkedin, id: "msg-linkedin" },
            { label: "Direct / WhatsApp", msg: data.shareMessages.direct, id: "msg-direct" },
          ].map(m => (
            <div key={m.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</div>
                <button onClick={() => copyLink(m.msg, m.id)}
                  style={{ background: copied === m.id ? "#10b981" : "#f1f5f9", color: copied === m.id ? "#fff" : "#475569", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {copied === m.id ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{m.msg}</div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Top Referrers</div>
          {leaderboard.slice(0, 5).map(entry => (
            <div key={entry.rank} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: entry.rank === 1 ? "#fef3c7" : entry.rank === 2 ? "#f1f5f9" : "#fafafa", border: `1px solid ${entry.rank === 1 ? "#f59e0b" : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: entry.rank === 1 ? "#92400e" : "#64748b" }}>
                {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{entry.displayName}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{entry.clickCount} clicks</div>
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#166534" }}>
                {entry.convertCount} joined
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Industry landing pages */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px", marginTop: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Industry-Specific Landing Pages</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Share directly with contacts in these industries — each page has tailored messaging for their specific pain points.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["healthcare", "legal", "staffing", "entrepreneurs", "creators", "consultants"].map(ind => {
            const url = window.location.origin + `/for/${ind}?ref=${data?.code ?? ""}`;
            return (
              <button key={ind} onClick={() => copyLink(url, `ind-${ind}`)}
                style={{ background: copied === `ind-${ind}` ? "#10b981" : "#f8fafc", color: copied === `ind-${ind}` ? "#fff" : "#475569", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {copied === `ind-${ind}` ? "✓ Copied!" : `AI for ${ind.charAt(0).toUpperCase() + ind.slice(1)}`}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
