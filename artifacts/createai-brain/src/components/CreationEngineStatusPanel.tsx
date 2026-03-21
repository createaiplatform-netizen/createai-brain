/**
 * CreationEngineStatusPanel.tsx
 *
 * Shows the unified status of all 8 core creation engines.
 * Fetches from GET /api/engines/creation.
 * Displays live-mode badge when deployed with REPLIT_DEPLOYMENT=1.
 *
 * Apple/Linear aesthetic — light theme, indigo accent #6366f1.
 * Fully self-contained — no external state.
 */

import React, { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EngineStatus {
  id:          string;
  name:        string;
  symbol:      string;
  description: string;
  active:      boolean;
  activatedAt: string;
  liveMode:    boolean;
}

interface RegistryResponse {
  ok:          boolean;
  liveMode:    boolean;
  totalCount:  number;
  activeCount: number;
  engines:     EngineStatus[];
  checkedAt:   string;
}

// ── Engine-specific accent colors (subtle variety within the light palette) ───

const ENGINE_ACCENTS: Record<string, { color: string; bg: string; border: string }> = {
  "guided":                   { color: "#6366f1", bg: "rgba(99,102,241,0.07)",  border: "rgba(99,102,241,0.18)" },
  "free":                     { color: "#0ea5e9", bg: "rgba(14,165,233,0.07)",  border: "rgba(14,165,233,0.18)" },
  "hybrid":                   { color: "#8b5cf6", bg: "rgba(139,92,246,0.07)",  border: "rgba(139,92,246,0.18)" },
  "app":                      { color: "#10b981", bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.18)" },
  "website":                  { color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.18)" },
  "tool":                     { color: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.18)"  },
  "end-to-end":               { color: "#06b6d4", bg: "rgba(6,182,212,0.07)",   border: "rgba(6,182,212,0.18)"  },
  "platform-inside-platform": { color: "#d946ef", bg: "rgba(217,70,239,0.07)",  border: "rgba(217,70,239,0.18)" },
};

const DEFAULT_ACCENT = { color: "#6366f1", bg: "rgba(99,102,241,0.07)", border: "rgba(99,102,241,0.18)" };

// ── Sub-component ─────────────────────────────────────────────────────────────

function EngineCard({ engine }: { engine: EngineStatus }) {
  const accent = ENGINE_ACCENTS[engine.id] ?? DEFAULT_ACCENT;

  return (
    <div
      title={engine.description}
      style={{
        display:       "flex",
        flexDirection: "column",
        gap:           8,
        padding:       "14px 16px",
        borderRadius:  12,
        background:    engine.active ? accent.bg : "rgba(0,0,0,0.025)",
        border:        `1px solid ${engine.active ? accent.border : "rgba(0,0,0,0.08)"}`,
        transition:    "box-shadow 0.15s ease",
        cursor:        "default",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 16px ${accent.border}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{engine.symbol}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {engine.name}
          </span>
        </div>

        {/* Status badge */}
        <span style={{
          display:       "inline-flex",
          alignItems:    "center",
          gap:           4,
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: "0.07em",
          color:         engine.active ? "#10b981" : "#94a3b8",
          background:    engine.active ? "rgba(16,185,129,0.10)" : "rgba(0,0,0,0.04)",
          border:        engine.active ? "1px solid rgba(16,185,129,0.22)" : "1px solid rgba(0,0,0,0.08)",
          borderRadius:  99,
          padding:       "2px 7px",
          whiteSpace:    "nowrap",
        }}>
          {engine.active ? (
            <>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#10b981",
                animation: "cePulse 2.2s ease-in-out infinite",
              }} />
              ACTIVE
            </>
          ) : "INACTIVE"}
        </span>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.45 }}>
        {engine.description}
      </p>

      {/* Live mode footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: "0.06em",
          color:         engine.liveMode ? accent.color : "#94a3b8",
          background:    engine.liveMode ? accent.bg    : "transparent",
          border:        engine.liveMode ? `1px solid ${accent.border}` : "1px solid rgba(0,0,0,0.06)",
          borderRadius:  99,
          padding:       "1px 6px",
        }}>
          {engine.liveMode ? "⚡ LIVE MODE" : "TEST MODE"}
        </span>
        <span style={{ fontSize: 9, color: "#94a3b8" }}>
          · active since {new Date(engine.activatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CreationEngineStatusPanel() {
  const [data,    setData]    = useState<RegistryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/engines/creation")
      .then(r => r.json())
      .then((d: RegistryResponse) => { setData(d); setError(""); })
      .catch(() => setError("Failed to load creation engine registry"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        @keyframes cePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(1.4); }
        }
      `}</style>

      <div style={{
        background:   "#ffffff",
        border:       "1px solid rgba(0,0,0,0.07)",
        borderRadius: 16,
        boxShadow:    "0 1px 8px rgba(0,0,0,0.05)",
        overflow:     "hidden",
        marginTop:    24,
      }}>

        {/* ── Header ── */}
        <div style={{
          padding:        "18px 20px 14px",
          borderBottom:   "1px solid rgba(0,0,0,0.06)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          flexWrap:       "wrap",
          gap:            10,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚙️</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Core Creation Engines
              </h2>

              {/* Live Mode badge */}
              {data && (
                <span style={{
                  display:       "inline-flex",
                  alignItems:    "center",
                  gap:           5,
                  fontSize:      9,
                  fontWeight:    700,
                  letterSpacing: "0.08em",
                  color:         data.liveMode ? "#6366f1" : "#94a3b8",
                  background:    data.liveMode ? "rgba(99,102,241,0.08)" : "rgba(0,0,0,0.04)",
                  border:        data.liveMode ? "1px solid rgba(99,102,241,0.22)" : "1px solid rgba(0,0,0,0.08)",
                  borderRadius:  99,
                  padding:       "2px 8px",
                }}>
                  {data.liveMode ? "⚡ LIVE MODE" : "TEST MODE"}
                </span>
              )}

              {/* All active badge */}
              {data?.ok && (
                <span style={{
                  fontSize:      9,
                  fontWeight:    700,
                  letterSpacing: "0.07em",
                  color:         "#10b981",
                  background:    "rgba(16,185,129,0.10)",
                  border:        "1px solid rgba(16,185,129,0.22)",
                  borderRadius:  99,
                  padding:       "2px 8px",
                }}>
                  ALL ACTIVE
                </span>
              )}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
              {data
                ? `${data.activeCount} / ${data.totalCount} engines operational · Unified creation surface`
                : "Loading engine status…"}
            </p>
          </div>

          {/* Count pill */}
          {data && (
            <div style={{
              display:       "flex",
              alignItems:    "center",
              gap:           6,
              padding:       "6px 14px",
              background:    "rgba(99,102,241,0.06)",
              border:        "1px solid rgba(99,102,241,0.16)",
              borderRadius:  99,
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#6366f1" }}>
                {data.activeCount}
              </span>
              <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600 }}>
                / {data.totalCount} active
              </span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "16px 20px 20px" }}>

          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  height: 90, borderRadius: 12,
                  background: "rgba(99,102,241,0.05)",
                  opacity: 1 - i * 0.07,
                }} />
              ))}
            </div>
          )}

          {error && (
            <div style={{
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              fontSize: 13,
              color: "#991b1b",
            }}>
              ⚠ {error}
            </div>
          )}

          {!loading && data && (
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap:                 10,
            }}>
              {data.engines.map(engine => (
                <EngineCard key={engine.id} engine={engine} />
              ))}
            </div>
          )}

          {/* Footer */}
          {!loading && data && (
            <p style={{
              margin:        "14px 0 0",
              fontSize:      11,
              color:         "#94a3b8",
              textAlign:     "center",
              letterSpacing: "0.02em",
            }}>
              Engines unified under the Global Experience Engine ·{" "}
              Checked at {new Date(data.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
