import React from "react";
import { useEngineStats } from "@/hooks/aes/useEngineStats";

const T = {
  bg:     "#050A18",
  card:   "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  text:   "#e2e8f0",
  sub:    "#94a3b8",
  dim:    "#64748b",
  green:  "#10b981",
  yellow: "#f59e0b",
  red:    "#ef4444",
  indigo: "#6366f1",
};

function rateColor(rate: number): string {
  if (rate >= 0.9) return T.green;
  if (rate >= 0.7) return T.yellow;
  return T.red;
}

function RateBar({ rate }: { rate: number }) {
  const pct   = Math.round(rate * 100);
  const color = rateColor(rate);
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        height: 4, borderRadius: 2,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          width: `${pct}%`, background: color,
          transition: "width 0.4s",
        }} />
      </div>
    </div>
  );
}

interface EngineStatsPanelProps {
  compact?: boolean;
}

export function EngineStatsPanel({ compact = false }: EngineStatsPanelProps) {
  const { stats, loading, error, refresh } = useEngineStats(30000);

  if (loading) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: T.dim }}>Loading engine stats\u2026</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 12 }}>
        <p style={{ fontSize: 11, color: T.red, margin: 0 }}>
          Failed to load stats. <button
            onClick={refresh}
            style={{ background: "none", border: "none", color: T.indigo,
              cursor: "pointer", fontSize: 11, padding: 0 }}
          >Retry</button>
        </p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <p style={{ fontSize: 11, color: T.dim, margin: 0 }}>
          No execution data yet. Run a goal to see engine stats.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 6 : 8 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: T.dim, margin: 0,
        }}>
          Engine Performance
        </p>
        <button
          onClick={refresh}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, color: T.dim, padding: 0,
          }}
          title="Refresh"
        >
          \u21BB
        </button>
      </div>

      {stats.map(s => {
        const pct   = Math.round(s.successRate * 100);
        const color = rateColor(s.successRate);
        return (
          <div key={s.engineId} style={{
            padding: compact ? "7px 10px" : "9px 12px",
            borderRadius: 8,
            background: T.card,
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              {/* Color indicator */}
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: color, flexShrink: 0,
                boxShadow: `0 0 4px ${color}`,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 600, color: T.text, flex: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {s.engineId.replace(/-/g, " ")}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>
                {pct}%
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <RateBar rate={s.successRate} />
              <span style={{ fontSize: 10, color: T.dim, flexShrink: 0 }}>
                {s.runCount} run{s.runCount !== 1 ? "s" : ""}
              </span>
              {s.averageLatency > 0 && (
                <span style={{ fontSize: 10, color: T.dim, flexShrink: 0 }}>
                  ~{Math.round(s.averageLatency)}ms
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
