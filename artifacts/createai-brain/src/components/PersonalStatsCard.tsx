// ═══════════════════════════════════════════════════════════════════════════
// PersonalStatsCard — "Your Brain Stats" dashboard card.
// Pulls live data from useVaultInsights. Zero network calls.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react";
import { useVaultInsights } from "@/hooks/useVaultInsights";
import { useLocation } from "wouter";

function fmt(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const TREND_ICON: Record<string, string> = { up: "↑", flat: "→", down: "↓" };
const TREND_COLOR: Record<string, string> = { up: "#7a9068", flat: "#9ca3af", down: "#f97316" };

function peakHourLabel(h: number | null): string {
  if (h === null) return "—";
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 || 12;
  return `${display}${period}`;
}

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}
function StatTile({ label, value, sub, color = "#0f172a" }: StatTileProps) {
  return (
    <div style={{
      flex: 1,
      minWidth: 80,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      padding: "10px 12px",
      background: "rgba(255,255,255,0.70)",
      borderRadius: 10,
      border: "1px solid rgba(0,0,0,0.06)",
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      {sub && <span style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</span>}
    </div>
  );
}

export function PersonalStatsCard() {
  const stats   = useVaultInsights();
  const [, nav] = useLocation();

  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(122,144,104,0.18)",
      background: "linear-gradient(135deg, rgba(122,144,104,0.07) 0%, rgba(255,255,255,0.95) 100%)",
      padding: "14px 16px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, #7a9068, #5d7a52)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 12,
          }}>🧠</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Your Brain Stats
            </div>
            {stats.total > 0 && (
              <div style={{ fontSize: 10, color: "#6b7280" }}>
                <span style={{ color: TREND_COLOR[stats.trend], fontWeight: 700 }}>
                  {TREND_ICON[stats.trend]}
                </span>
                {" "}
                {stats.trend === "up" ? "Growing this week" : stats.trend === "down" ? "Slower this week" : "Steady pace"}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => nav("/library")}
          style={{
            fontSize: 11, fontWeight: 600, color: "#7a9068",
            background: "rgba(122,144,104,0.10)", border: "1px solid rgba(122,144,104,0.22)",
            borderRadius: 20, padding: "4px 12px", cursor: "pointer",
            transition: "background 0.13s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(122,144,104,0.18)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(122,144,104,0.10)"; }}
        >
          View Library →
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <StatTile label="Total Outputs"   value={fmt(stats.total)}      sub={`${fmt(stats.pinned)} pinned`} />
        <StatTile label="This Week"       value={fmt(stats.weekCount)}   sub={`${fmt(stats.todayCount)} today`} />
        <StatTile label="Words Written"   value={fmt(stats.totalWords)}  sub={stats.avgWordsPerEntry > 0 ? `avg ${fmt(stats.avgWordsPerEntry)}/output` : undefined} />
        <StatTile label="Engines Used"    value={fmt(stats.uniqueEngines)} />
      </div>

      {/* Bottom row */}
      {(stats.topEngine || stats.peakHour !== null) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {stats.topEngine && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 8,
              background: "rgba(122,144,104,0.08)", border: "1px solid rgba(122,144,104,0.14)",
              fontSize: 11, color: "#374151",
            }}>
              <span>🏆</span>
              <span style={{ fontWeight: 600 }}>Top engine:</span>
              <span>{stats.topEngine.name}</span>
              <span style={{ color: "#9ca3af" }}>×{stats.topEngine.count}</span>
            </div>
          )}
          {stats.peakHour !== null && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 8,
              background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)",
              fontSize: 11, color: "#374151",
            }}>
              <span>⏰</span>
              <span style={{ fontWeight: 600 }}>Peak hour:</span>
              <span>{peakHourLabel(stats.peakHour)}</span>
            </div>
          )}
          {stats.velocity > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 8,
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.16)",
              fontSize: 11, color: "#374151",
            }}>
              <span>⚡</span>
              <span style={{ fontWeight: 600 }}>Velocity:</span>
              <span>{stats.velocity}/day</span>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {stats.total === 0 && (
        <div style={{
          textAlign: "center", padding: "12px 0 4px",
          fontSize: 12, color: "#9ca3af",
        }}>
          Start using any AI engine to see your stats here.
        </div>
      )}
    </div>
  );
}
