// ═══════════════════════════════════════════════════════════════════════════
// SystemHeartbeat.tsx
// Small pulsing widget showing live system status.
// Polls /api/system/health + /api/system/score every 45 seconds.
// Renders as a compact top-bar chip with tooltip.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

interface HealthData {
  status?: string;
  version?: string;
  uptime?: number;
  [key: string]: unknown;
}
interface ScoreData {
  readiness?: number;
  stability?: number;
  [key: string]: unknown;
}

const POLL_INTERVAL = 45_000;

export function SystemHeartbeat() {
  const [health,    setHealth]    = useState<HealthData | null>(null);
  const [scores,    setScores]    = useState<ScoreData | null>(null);
  const [tooltipOn, setTooltipOn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    try {
      const [hRes, sRes] = await Promise.all([
        apiRequest("GET", "/api/system/health"),
        apiRequest("GET", "/api/system/score"),
      ]);
      const h = await hRes.json() as HealthData;
      const s = await sRes.json() as ScoreData;
      setHealth(h);
      setScores(s);
    } catch {
      // stay silent
    }
  }

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const isUp      = health?.status === "ok" || health?.status === "healthy";
  const readiness = scores?.readiness ?? null;
  const stability = scores?.stability ?? null;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onMouseEnter={() => setTooltipOn(true)}
        onMouseLeave={() => setTooltipOn(false)}
        onClick={() => setTooltipOn(t => !t)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", border: "none", cursor: "pointer",
          padding: "3px 8px",
        }}
        aria-label="System status"
      >
        {/* Pulsing dot */}
        <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: health === null ? "#94a3b8" : isUp ? "#22c55e" : "#ef4444",
            opacity: 0.5,
            animation: "hb-pulse 1.8s ease-out infinite",
          }} />
          <span style={{
            position: "relative", width: 8, height: 8, borderRadius: "50%",
            background: health === null ? "#94a3b8" : isUp ? "#22c55e" : "#ef4444",
            display: "inline-block",
          }} />
          <style>{`
            @keyframes hb-pulse {
              0%   { transform: scale(1);   opacity: 0.6; }
              70%  { transform: scale(2.2); opacity: 0; }
              100% { transform: scale(1);   opacity: 0; }
            }
          `}</style>
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "-0.01em" }}>
          {health === null ? "Checking\u2026" : isUp ? "System Ready" : "Degraded"}
        </span>
      </button>

      {/* Tooltip */}
      {tooltipOn && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "#0F172A", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 10, padding: "12px 14px", minWidth: 180,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 9999,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
            Platform Health
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "#64748b" }}>Status</span>
              <span style={{ color: isUp ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                {health?.status ?? "\u2014"}
              </span>
            </div>
            {readiness !== null && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "#64748b" }}>Readiness</span>
                <span style={{ color: readiness >= 150 ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>
                  {readiness}
                </span>
              </div>
            )}
            {stability !== null && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "#64748b" }}>Stability</span>
                <span style={{ color: stability >= 120 ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>
                  {stability}
                </span>
              </div>
            )}
            {health?.version && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "#64748b" }}>Version</span>
                <span style={{ color: "#94a3b8" }}>{String(health.version)}</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 9.5, color: "#334155", marginTop: 8, textAlign: "right" }}>
            Polls every 45s
          </div>
        </div>
      )}
    </div>
  );
}
