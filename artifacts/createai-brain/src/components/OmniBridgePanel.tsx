/**
 * OmniBridgePanel.tsx — Omni-Bridge Architecture
 *
 * Renders a live unified view of the entire platform across all 7 dimensions:
 * HEAD · BODY · SOUL · BRAIN · UNIVERSE · INSIDE · OUTSIDE
 *
 * Fetches from GET /api/omni-bridge.
 * Apple/Linear aesthetic — light theme, indigo #6366f1.
 * Fully self-contained.
 */

import React, { useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SystemStatus    = "active" | "pending" | "not_configured";
type DimensionStatus = "active" | "partial"  | "inactive";

interface BridgeSystem {
  id:      string;
  name:    string;
  status:  SystemStatus;
  route?:  string;
  meta?:   string;
}

interface BridgeDimension {
  id:          string;
  label:       string;
  symbol:      string;
  description: string;
  systems:     BridgeSystem[];
  activeCount: number;
  totalCount:  number;
  status:      DimensionStatus;
}

interface OmniBridgeSnapshot {
  ok:            boolean;
  liveMode:      boolean;
  healthScore:   number;
  unifiedAt:     string;
  totalSystems:  number;
  activeSystems: number;
  dimensions:    BridgeDimension[];
  summary:       string;
}

// ── Dimension theme palette ───────────────────────────────────────────────────

const DIM_THEME: Record<string, {
  color: string; bg: string; border: string; glow: string;
}> = {
  head:     { color: "#6366f1", bg: "rgba(99,102,241,0.07)",  border: "rgba(99,102,241,0.22)",  glow: "rgba(99,102,241,0.14)" },
  body:     { color: "#0ea5e9", bg: "rgba(14,165,233,0.07)",  border: "rgba(14,165,233,0.22)",  glow: "rgba(14,165,233,0.14)" },
  soul:     { color: "#d946ef", bg: "rgba(217,70,239,0.07)",  border: "rgba(217,70,239,0.22)",  glow: "rgba(217,70,239,0.14)" },
  brain:    { color: "#8b5cf6", bg: "rgba(139,92,246,0.07)",  border: "rgba(139,92,246,0.22)",  glow: "rgba(139,92,246,0.14)" },
  universe: { color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.22)",  glow: "rgba(245,158,11,0.14)" },
  inside:   { color: "#10b981", bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.22)",  glow: "rgba(16,185,129,0.14)" },
  outside:  { color: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.22)",   glow: "rgba(239,68,68,0.14)" },
};

const DEFAULT_THEME = DIM_THEME["head"]!;

// ── Status helpers ────────────────────────────────────────────────────────────

function statusColor(s: SystemStatus): string {
  if (s === "active")         return "#10b981";
  if (s === "pending")        return "#f59e0b";
  if (s === "not_configured") return "#94a3b8";
  return "#94a3b8";
}

function statusLabel(s: SystemStatus): string {
  if (s === "active")         return "ACTIVE";
  if (s === "pending")        return "PENDING";
  if (s === "not_configured") return "NOT SET";
  return s;
}

function dimStatusLabel(s: DimensionStatus): string {
  if (s === "active")  return "FULLY ACTIVE";
  if (s === "partial") return "PARTIAL";
  return "INACTIVE";
}

function dimStatusColor(s: DimensionStatus): string {
  if (s === "active")  return "#10b981";
  if (s === "partial") return "#f59e0b";
  return "#ef4444";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SystemRow({ system }: { system: BridgeSystem }) {
  const color = statusColor(system.status);
  return (
    <div style={{
      display:       "flex",
      alignItems:    "flex-start",
      gap:           8,
      padding:       "7px 0",
      borderBottom:  "1px solid rgba(0,0,0,0.04)",
    }}>
      {/* Status dot */}
      <div style={{
        width:        7,
        height:       7,
        borderRadius: "50%",
        background:   color,
        flexShrink:   0,
        marginTop:    5,
        ...(system.status === "active" ? {
          boxShadow: `0 0 0 3px ${color}22`,
          animation: "obPulse 2.4s ease-in-out infinite",
        } : {}),
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
            {system.name}
          </span>
          <span style={{
            fontSize:      9,
            fontWeight:    700,
            letterSpacing: "0.07em",
            color,
            background:    `${color}14`,
            border:        `1px solid ${color}30`,
            borderRadius:  99,
            padding:       "1px 5px",
          }}>
            {statusLabel(system.status)}
          </span>
          {system.route && (
            <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>
              {system.route}
            </span>
          )}
        </div>
        {system.meta && (
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>
            {system.meta}
          </p>
        )}
      </div>
    </div>
  );
}

function DimensionCard({
  dimension,
  expanded,
  onToggle,
}: {
  dimension: BridgeDimension;
  expanded:  boolean;
  onToggle:  () => void;
}) {
  const theme    = DIM_THEME[dimension.id] ?? DEFAULT_THEME;
  const pct      = Math.round((dimension.activeCount / dimension.totalCount) * 100);

  return (
    <div style={{
      background:   "#ffffff",
      border:       `1px solid ${theme.border}`,
      borderRadius: 14,
      overflow:     "hidden",
      transition:   "box-shadow 0.2s ease",
      boxShadow:    expanded ? `0 4px 24px ${theme.glow}` : "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Card header */}
      <button
        onClick={onToggle}
        style={{
          width:          "100%",
          display:        "flex",
          alignItems:     "center",
          gap:            10,
          padding:        "14px 16px",
          background:     expanded ? theme.bg : "transparent",
          border:         "none",
          cursor:         "pointer",
          textAlign:      "left",
          transition:     "background 0.2s ease",
        }}
      >
        {/* Symbol */}
        <span style={{ fontSize: 22, flexShrink: 0 }}>{dimension.symbol}</span>

        {/* Text block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
              {dimension.label}
            </span>
            <span style={{
              fontSize:      9,
              fontWeight:    700,
              letterSpacing: "0.07em",
              color:         dimStatusColor(dimension.status),
              background:    `${dimStatusColor(dimension.status)}14`,
              border:        `1px solid ${dimStatusColor(dimension.status)}30`,
              borderRadius:  99,
              padding:       "1px 6px",
            }}>
              {dimStatusLabel(dimension.status)}
            </span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>
            {dimension.description}
          </p>
        </div>

        {/* Progress + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.color }}>
              {dimension.activeCount}
              <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8" }}>/{dimension.totalCount}</span>
            </div>
            <div style={{ fontSize: 9, color: theme.color, fontWeight: 600 }}>{pct}%</div>
          </div>
          <span style={{
            fontSize:   10,
            color:      "#94a3b8",
            transform:  expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}>
            ▼
          </span>
        </div>
      </button>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(0,0,0,0.05)" }}>
        <div style={{
          height:     "100%",
          width:      `${pct}%`,
          background: `linear-gradient(90deg, ${theme.color}, ${theme.color}cc)`,
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Expanded systems list */}
      {expanded && (
        <div style={{ padding: "4px 16px 12px" }}>
          {dimension.systems.map(s => (
            <SystemRow key={s.id} system={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Health ring (CSS-only) ────────────────────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const r         = 38;
  const circ      = 2 * Math.PI * r;
  const filled    = circ * (score / 100);
  const color     = score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div style={{
        position:   "absolute", inset: 0,
        display:    "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 8, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em" }}>HEALTH</span>
      </div>
    </div>
  );
}

// ── Connection threads (decorative) ──────────────────────────────────────────

function ConnectionBar({ liveMode }: { liveMode: boolean }) {
  const dimIds = ["head", "body", "soul", "brain", "universe", "inside", "outside"];
  return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      gap:            0,
      padding:        "10px 0",
      overflowX:      "auto",
    }}>
      {dimIds.map((id, i) => {
        const t = DIM_THEME[id]!;
        return (
          <React.Fragment key={id}>
            <div style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              gap:            4,
            }}>
              <div style={{
                width:        10, height: 10, borderRadius: "50%",
                background:   t.color,
                boxShadow:    `0 0 0 4px ${t.glow}`,
                animation:    liveMode ? `obPulse ${1.6 + i * 0.2}s ease-in-out infinite` : "none",
              }} />
              <span style={{
                fontSize: 8, fontWeight: 700, color: t.color,
                letterSpacing: "0.05em", textTransform: "uppercase",
              }}>
                {id}
              </span>
            </div>
            {i < dimIds.length - 1 && (
              <div style={{
                width:      28,
                height:     2,
                background: `linear-gradient(90deg, ${t.color}60, ${DIM_THEME[dimIds[i + 1]!]!.color}60)`,
                marginBottom: 14,
                flexShrink:  0,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function OmniBridgePanel() {
  const [data,     setData]     = useState<OmniBridgeSnapshot | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/omni-bridge")
      .then(r => r.json())
      .then((d: OmniBridgeSnapshot) => { setData(d); setError(""); })
      .catch(() => setError("Failed to load Omni-Bridge snapshot"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Layout: 3 top (HEAD BODY SOUL) + 2 middle (BRAIN UNIVERSE) + 2 bottom (INSIDE OUTSIDE)
  const groups: string[][] = [
    ["head", "body", "soul"],
    ["brain", "universe"],
    ["inside", "outside"],
  ];

  return (
    <>
      <style>{`
        @keyframes obPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.55; transform:scale(1.35); }
        }
        @keyframes obSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        background:   "#ffffff",
        border:       "1px solid rgba(0,0,0,0.07)",
        borderRadius: 18,
        boxShadow:    "0 1px 12px rgba(0,0,0,0.06)",
        overflow:     "hidden",
        marginTop:    24,
      }}>

        {/* ── Hero header ── */}
        <div style={{
          background:   "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
          padding:      "24px 24px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>

            {/* Left: title block */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 26 }}>🌐</span>
                <div>
                  <h2 style={{
                    margin: 0, fontSize: 20, fontWeight: 800, color: "#ffffff",
                    letterSpacing: "-0.03em", lineHeight: 1.1,
                  }}>
                    Omni-Bridge Architecture
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em" }}>
                    UNIFIED PLATFORM INTEGRATION LAYER
                  </p>
                </div>
              </div>

              {data && (
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                  {data.summary}
                </p>
              )}

              {/* Dimension chips */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                {["HEAD","BODY","SOUL","BRAIN","UNIVERSE","INSIDE","OUTSIDE"].map((d, i) => {
                  const ids = ["head","body","soul","brain","universe","inside","outside"];
                  const t   = DIM_THEME[ids[i]!]!;
                  return (
                    <span key={d} style={{
                      fontSize:      9,
                      fontWeight:    700,
                      letterSpacing: "0.08em",
                      color:         t.color,
                      background:    "rgba(255,255,255,0.08)",
                      border:        `1px solid ${t.color}44`,
                      borderRadius:  99,
                      padding:       "2px 8px",
                    }}>
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Right: health + stats */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
              {data ? <HealthRing score={data.healthScore} /> : (
                <div style={{
                  width: 96, height: 96, borderRadius: "50%",
                  border: "7px solid rgba(255,255,255,0.1)",
                  animation: "obSpin 1.5s linear infinite",
                }} />
              )}

              {data && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Live mode */}
                  <span style={{
                    display:       "inline-flex",
                    alignItems:    "center",
                    gap:           5,
                    fontSize:      10,
                    fontWeight:    700,
                    letterSpacing: "0.08em",
                    color:         data.liveMode ? "#10b981" : "#f59e0b",
                    background:    data.liveMode ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                    border:        data.liveMode ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(245,158,11,0.3)",
                    borderRadius:  99,
                    padding:       "3px 10px",
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: data.liveMode ? "#10b981" : "#f59e0b",
                      animation: "obPulse 1.8s ease-in-out infinite",
                    }} />
                    {data.liveMode ? "LIVE MODE" : "TEST MODE"}
                  </span>

                  {/* System count */}
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.5 }}>
                    <div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "#ffffff" }}>
                        {data.activeSystems}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                        /{data.totalSystems} systems
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>
                      across {data.dimensions.length} dimensions
                    </div>
                  </div>

                  {/* Refresh */}
                  <button
                    onClick={load}
                    style={{
                      fontSize:     10,
                      fontWeight:   600,
                      color:        "rgba(255,255,255,0.5)",
                      background:   "rgba(255,255,255,0.07)",
                      border:       "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      padding:      "4px 10px",
                      cursor:       "pointer",
                      letterSpacing:"0.04em",
                    }}
                  >
                    ↻ Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Connection thread bar */}
          {data && <ConnectionBar liveMode={data.liveMode} />}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 20px 24px" }}>

          {loading && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 10,
            }}>
              {[...Array(7)].map((_, i) => (
                <div key={i} style={{
                  height: 72, borderRadius: 14,
                  background: "rgba(99,102,241,0.04)",
                  opacity: 1 - i * 0.08,
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
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {groups.map((group, gi) => (
                <div key={gi} style={{
                  display:             "grid",
                  gridTemplateColumns: `repeat(${group.length}, 1fr)`,
                  gap:                 10,
                }}>
                  {group.map(id => {
                    const dim = data.dimensions.find(d => d.id === id);
                    if (!dim) return null;
                    return (
                      <DimensionCard
                        key={id}
                        dimension={dim}
                        expanded={!!expanded[id]}
                        onToggle={() => toggle(id)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {!loading && data && (
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            6,
              marginTop:      20,
              padding:        "12px 16px",
              background:     "rgba(99,102,241,0.04)",
              border:         "1px solid rgba(99,102,241,0.10)",
              borderRadius:   10,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#10b981",
                animation: "obPulse 2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 11, color: "#475569", letterSpacing: "0.02em" }}>
                Platform unified · All dimensions synchronized · Omni-Bridge active ·{" "}
                Last check {new Date(data.unifiedAt).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
