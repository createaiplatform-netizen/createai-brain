/**
 * PlatformScorePage.tsx
 * ─────────────────────
 * Live Capability Intelligence Dashboard for CreateAI Brain.
 *
 * Shows the real-time platform score for every domain — current score,
 * theoretical maximum, gap, status, immediate actions, and blockers.
 *
 * Data: /api/semantic/analytics/platform-score (auto-refreshes every 30s)
 * Design: Indigo accent #6366f1, light theme, root bg #f8fafc
 */

import React, { useEffect, useState, useCallback } from "react";

interface DomainScore {
  domain:                      string;
  current:                     number;
  theoretical:                 number;
  gap:                         number;
  status:                      "scaling" | "active" | "mature" | "partial" | "planned" | "config-needed" | "empty";
  immediateActions:            string[];
  blockers:                    string[];
}

interface PlatformOverall {
  currentScore:                number;
  theoreticalMax:              number;
  closurePercent:              number;
  domainsTotal:                number;
  domainsActive:               number;
  domainsWithImmediateOpportunities: number;
}

interface PlatformScoreData {
  ok:      boolean;
  overall: PlatformOverall;
  domains: DomainScore[];
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  scaling:        { label: "Scaling",       color: "#7c3aed", bg: "#ede9fe", dot: "#7c3aed" },
  active:         { label: "Active",        color: "#047857", bg: "#d1fae5", dot: "#10b981" },
  mature:         { label: "Mature",        color: "#1d4ed8", bg: "#dbeafe", dot: "#3b82f6" },
  partial:        { label: "Partial",       color: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  planned:        { label: "Planned",       color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
  "config-needed":{ label: "Config Needed", color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
  empty:          { label: "No Data",       color: "#9ca3af", bg: "#f9fafb", dot: "#d1d5db" },
};

function ScoreBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <div style={{ background: "#f1f5f9", borderRadius: 999, height: 6, flex: 1 }}>
      <div
        style={{
          width:        `${pct}%`,
          height:       "100%",
          borderRadius: 999,
          background:   color,
          transition:   "width 0.6s ease",
        }}
      />
    </div>
  );
}

function DomainCard({ d }: { d: DomainScore }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[d.status] ?? STATUS_META["planned"]!;
  const pct  = d.theoretical > 0 ? Math.round((d.current / d.theoretical) * 100) : 0;

  return (
    <div
      style={{
        background:   "white",
        borderRadius: 14,
        border:       `1px solid ${open ? "#6366f1" : "#f1f5f9"}`,
        boxShadow:    open ? "0 4px 20px rgba(99,102,241,0.12)" : "0 1px 4px rgba(0,0,0,0.05)",
        padding:      "18px 20px",
        cursor:       "pointer",
        transition:   "all 0.2s",
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:           4,
              background:   meta.bg,
              color:        meta.color,
              borderRadius: 999,
              padding:      "2px 10px",
              fontSize:     "0.7rem",
              fontWeight:   700,
              textTransform:"uppercase",
              letterSpacing:"0.05em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot, display: "inline-block" }} />
              {meta.label}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "auto" }}>
              {d.current}% → {d.theoretical}%
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: 10 }}>
            {d.domain}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ScoreBar current={d.current} max={d.theoretical} color={meta.dot} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: meta.color, minWidth: 36, textAlign: "right" }}>
              {pct}%
            </span>
          </div>
        </div>
        <span style={{ color: "#94a3b8", fontSize: "0.9rem", transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
      </div>

      {open && (
        <div style={{ marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Immediate Actions
              </div>
              {d.immediateActions.length === 0
                ? <p style={{ color: "#94a3b8", fontSize: "0.82rem" }}>—</p>
                : d.immediateActions.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                    <span style={{ color: "#6366f1", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
                    <span style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.5 }}>{a}</span>
                  </div>
                ))
              }
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Blockers
              </div>
              {d.blockers.length === 0
                ? <p style={{ color: "#94a3b8", fontSize: "0.82rem" }}>None</p>
                : d.blockers.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                    <span style={{ color: "#ef4444", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>!</span>
                    <span style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))
              }
            </div>
          </div>
          <div style={{ marginTop: 12, background: "#f8fafc", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Gap to close: <strong style={{ color: "#1e293b" }}>{d.gap}%</strong></span>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Theoretical max: <strong style={{ color: "#6366f1" }}>{d.theoretical}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlatformScorePage() {
  const [data,    setData]    = useState<PlatformScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filter,  setFilter]  = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/semantic/analytics/platform-score");
      const d   = await res.json() as PlatformScoreData;
      if (!d.ok) throw new Error("API returned ok:false");
      setData(d);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => { void load(); }, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "#94a3b8", fontSize: "0.95rem" }}>
      Loading platform scores…
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 40, color: "#dc2626" }}>
      Error: {error ?? "No data"}
    </div>
  );

  const o = data.overall;
  const closurePct = o.theoreticalMax > 0 ? Math.round((o.currentScore / o.theoreticalMax) * 100) : 0;

  const STATUS_FILTERS = ["all", "scaling", "active", "mature", "partial", "planned", "config-needed", "empty"];
  const filtered = filter === "all"
    ? data.domains
    : data.domains.filter(d => d.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    const gapA = a.theoretical - a.current;
    const gapB = b.theoretical - b.current;
    return gapB - gapA;
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              Platform Capability Score
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "6px 0 0" }}>
              Live score across {o.domainsTotal} domains · Refreshes every 30s
              <span style={{ marginLeft: 12, fontSize: "0.75rem", color: "#94a3b8" }}>
                Last updated {lastRefresh.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); void load(); }}
            style={{ background: "#6366f1", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
          >
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {/* Overall Score Card */}
      <div style={{
        background:   "linear-gradient(135deg, #6366f1, #818cf8)",
        borderRadius: 20,
        padding:      "32px 40px",
        marginBottom: 32,
        color:        "white",
        display:      "flex",
        alignItems:   "center",
        gap:           40,
        flexWrap:     "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Overall Score
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: "4rem", fontWeight: 900, lineHeight: 1 }}>{o.currentScore}%</span>
            <span style={{ fontSize: "1.2rem", opacity: 0.7 }}>/ {o.theoreticalMax}%</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 999, height: 8, marginBottom: 8 }}>
            <div style={{ width: `${closurePct}%`, height: "100%", borderRadius: 999, background: "white" }} />
          </div>
          <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>{closurePct}% of theoretical maximum achieved</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
          {[
            { label: "Domains Active",   value: `${o.domainsActive}/${o.domainsTotal}` },
            { label: "Gap to Close",     value: `${o.theoreticalMax - o.currentScore}%` },
            { label: "Opportunities",    value: String(o.domainsWithImmediateOpportunities) },
            { label: "Closure Rate",     value: `${o.closurePercent}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: "0.7rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {STATUS_FILTERS.map(f => {
          const meta = STATUS_META[f];
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding:      "6px 14px",
                borderRadius: 999,
                border:       active ? "2px solid #6366f1" : "1px solid #e2e8f0",
                background:   active ? "#ede9fe" : "white",
                color:        active ? "#6366f1" : "#64748b",
                fontSize:     "0.78rem",
                fontWeight:   active ? 700 : 500,
                cursor:       "pointer",
                textTransform: f === "all" ? "none" : "capitalize",
              }}
            >
              {f === "all" ? `All (${data.domains.length})` : (meta?.label ?? f)}
            </button>
          );
        })}
      </div>

      {/* Sort note */}
      <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: 16 }}>
        Sorted by largest gap first — highest-impact opportunities at the top
      </div>

      {/* Domain cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 14 }}>
        {sorted.map(d => <DomainCard key={d.domain} d={d} />)}
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: "0.9rem" }}>
          No domains match this filter.
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 40, padding: "24px", background: "#f8fafc", borderRadius: 14, border: "1px solid #f1f5f9" }}>
        <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.8 }}>
          <strong style={{ color: "#1e293b" }}>How scores work:</strong>{" "}
          Each domain has a "current" score (what's live) and a "theoretical maximum" (what's possible with full implementation).
          The gap is the delta — your pipeline to scale. Scores above 100% mean a domain is performing at a level that could power multiple product lines simultaneously.
          Click any domain card to see immediate actions and blockers.
        </div>
      </div>
    </div>
  );
}
