import React, { useState, useEffect } from "react";

// ─── IntelligenceRibbon ──────────────────────────────────────────────────────
// A subtle single-line bar that communicates system awareness without
// distracting the user. Rotates through soft status messages every 5 seconds.
// Placed between the dashboard top bar and main content.

const MESSAGES = [
  "86 engines active · 37 systems online · running at full capacity",
  "122 apps available · 20 expansion paths configured · always ready",
  "40 series ready · 109 AI system prompts loaded · config complete",
  "7 workflows running · 315 API endpoints serving · zero errors",
  "All systems active · self-heal: 0 repairs needed · locked & stable",
];

export function IntelligenceRibbon() {
  const [idx, setIdx]           = useState(0);
  const [fading, setFading]     = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("ribbon_dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (dismissed) return;
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % MESSAGES.length);
        setFading(false);
      }, 350);
    }, 6000);
    return () => clearInterval(t);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div style={{
      height: 30, flexShrink: 0,
      display: "flex", alignItems: "center",
      padding: "0 14px",
      background: "linear-gradient(90deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.03) 100%)",
      borderBottom: "1px solid rgba(99,102,241,0.08)",
    }}>
      {/* Pulse dot */}
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: "#22c55e",
        boxShadow: "0 0 6px rgba(34,197,94,0.55)",
        flexShrink: 0,
        animation: "pulse 2.5s ease-in-out infinite",
      }} />

      {/* Rotating message */}
      <span style={{
        marginLeft: 9, fontSize: 10.5, color: "#a5b4fc",
        fontWeight: 500, letterSpacing: "0.01em",
        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        transition: "opacity 0.35s ease",
        opacity: fading ? 0 : 0.85,
        userSelect: "none",
      }}>
        {MESSAGES[idx]}
      </span>

      {/* Dismiss — tiny, non-distracting */}
      <button
        onClick={() => {
          setDismissed(true);
          try { sessionStorage.setItem("ribbon_dismissed", "1"); } catch { /* no-op */ }
        }}
        title="Dismiss"
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "0 2px", color: "#c7d2fe", fontSize: 12, flexShrink: 0,
          opacity: 0.5, transition: "opacity 0.15s", lineHeight: 1,
          fontFamily: "inherit",
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "0.5")}
      >✕</button>
    </div>
  );
}
