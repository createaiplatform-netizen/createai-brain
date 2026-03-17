import React, { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface SummaryRow {
  type: string;
  daily: number;
  weekly: number;
  monthly: number;
  lifetime: number;
}

interface SummaryTotals {
  daily: number;
  weekly: number;
  monthly: number;
  lifetime: number;
}

interface SummaryResponse {
  summary: SummaryRow[];
  totals: SummaryTotals;
}

interface DailyPoint {
  date: string;
  type: string;
  count: number;
}

interface WeeklyPoint {
  weekStart: string;
  type: string;
  count: number;
}

interface MonthlyPoint {
  monthStart: string;
  type: string;
  count: number;
}

interface CurvesResponse {
  daily: DailyPoint[];
  weekly: WeeklyPoint[];
  monthly: MonthlyPoint[];
}

// ─── Fetch helpers ──────────────────────────────────────────────────────────

async function fetchSummary(): Promise<SummaryResponse> {
  const res = await fetch("/api/metrics/summary", { credentials: "include" });
  if (!res.ok) throw new Error(`summary ${res.status}`);
  return res.json();
}

async function fetchCurves(): Promise<CurvesResponse> {
  const res = await fetch("/api/metrics/curves", { credentials: "include" });
  if (!res.ok) throw new Error(`curves ${res.status}`);
  return res.json();
}

// ─── Small UI helpers ───────────────────────────────────────────────────────

function fmt(label: string): string {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 8,
          background: "rgba(99,102,241,0.15)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#6366f1",
            borderRadius: 4,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 12, color: "#a0a0b0", minWidth: 28, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <h2
        style={{
          margin: "0 0 16px 0",
          fontSize: 15,
          fontWeight: 600,
          color: "#e0e0f0",
          letterSpacing: 0.2,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function TotalBadge({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "rgba(99,102,241,0.12)",
        border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: 12,
        padding: "14px 20px",
        textAlign: "center",
        flex: 1,
        minWidth: 100,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color: "#6366f1" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function MetricsPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [curves, setCurves] = useState<CurvesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSummary(), fetchCurves()])
      .then(([s, c]) => {
        setSummary(s);
        setCurves(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const maxLifetime = summary
    ? Math.max(...summary.summary.map((r) => r.lifetime), 1)
    : 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, hsl(220,20%,10%) 0%, hsl(240,25%,14%) 50%, hsl(255,30%,12%) 100%)",
        color: "#e0e0f0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "40px 0",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>📊</span>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#fff" }}>
              Metrics
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
            Live data from <code style={{ color: "#6366f1" }}>/api/metrics</code>
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ color: "#888", fontSize: 14 }}>Loading…</p>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#f87171",
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            Failed to load metrics: {error}
          </div>
        )}

        {/* Summary totals */}
        {summary && (
          <>
            <Card title="Totals">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <TotalBadge label="Today" value={summary.totals.daily} />
                <TotalBadge label="Last 7 days" value={summary.totals.weekly} />
                <TotalBadge label="Last 30 days" value={summary.totals.monthly} />
                <TotalBadge label="All time" value={summary.totals.lifetime} />
              </div>
            </Card>

            {/* Per-type breakdown */}
            <Card title="Per-type counts">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ color: "#666", textAlign: "left" }}>
                    <th style={{ padding: "6px 0", fontWeight: 500, width: "28%" }}>Type</th>
                    <th style={{ padding: "6px 8px", fontWeight: 500, width: "32%" }}>Activity (lifetime)</th>
                    <th style={{ padding: "6px 8px", fontWeight: 500 }}>Daily</th>
                    <th style={{ padding: "6px 8px", fontWeight: 500 }}>Weekly</th>
                    <th style={{ padding: "6px 8px", fontWeight: 500 }}>Monthly</th>
                    <th style={{ padding: "6px 8px", fontWeight: 500 }}>Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.summary.map((row, i) => (
                    <tr
                      key={row.type}
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <td style={{ padding: "10px 0", color: "#c0c0e0" }}>
                        {fmt(row.type)}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <Bar value={row.lifetime} max={maxLifetime} />
                      </td>
                      <td style={{ padding: "10px 8px", color: "#a0a0b0" }}>{row.daily}</td>
                      <td style={{ padding: "10px 8px", color: "#a0a0b0" }}>{row.weekly}</td>
                      <td style={{ padding: "10px 8px", color: "#a0a0b0" }}>{row.monthly}</td>
                      <td style={{ padding: "10px 8px", color: "#e0e0f0", fontWeight: 600 }}>
                        {row.lifetime}
                      </td>
                    </tr>
                  ))}
                  {summary.summary.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "16px 0", color: "#666", fontSize: 13 }}>
                        No metric events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {/* Curves — Daily */}
        {curves && (
          <>
            <Card title="Daily — last 30 days">
              {curves.daily.length === 0 ? (
                <p style={{ color: "#666", fontSize: 13, margin: 0 }}>No data.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#666", textAlign: "left" }}>
                      <th style={{ padding: "6px 0", fontWeight: 500 }}>Date</th>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>Type</th>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curves.daily.map((row, i) => (
                      <tr
                        key={`${row.date}-${row.type}`}
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <td style={{ padding: "8px 0", color: "#a0a0b0" }}>{fmtDate(row.date)}</td>
                        <td style={{ padding: "8px 8px", color: "#c0c0e0" }}>{fmt(row.type)}</td>
                        <td style={{ padding: "8px 8px", color: "#6366f1", fontWeight: 600 }}>
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Curves — Weekly */}
            <Card title="Weekly — last 12 weeks">
              {curves.weekly.length === 0 ? (
                <p style={{ color: "#666", fontSize: 13, margin: 0 }}>No data.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#666", textAlign: "left" }}>
                      <th style={{ padding: "6px 0", fontWeight: 500 }}>Week of</th>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>Type</th>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curves.weekly.map((row, i) => (
                      <tr
                        key={`${row.weekStart}-${row.type}`}
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <td style={{ padding: "8px 0", color: "#a0a0b0" }}>
                          {fmtDate(row.weekStart)}
                        </td>
                        <td style={{ padding: "8px 8px", color: "#c0c0e0" }}>{fmt(row.type)}</td>
                        <td style={{ padding: "8px 8px", color: "#6366f1", fontWeight: 600 }}>
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Curves — Monthly */}
            <Card title="Monthly — last 12 months">
              {curves.monthly.length === 0 ? (
                <p style={{ color: "#666", fontSize: 13, margin: 0 }}>No data.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#666", textAlign: "left" }}>
                      <th style={{ padding: "6px 0", fontWeight: 500 }}>Month</th>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>Type</th>
                      <th style={{ padding: "6px 8px", fontWeight: 500 }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {curves.monthly.map((row, i) => (
                      <tr
                        key={`${row.monthStart}-${row.type}`}
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <td style={{ padding: "8px 0", color: "#a0a0b0" }}>
                          {fmtDate(row.monthStart)}
                        </td>
                        <td style={{ padding: "8px 8px", color: "#c0c0e0" }}>{fmt(row.type)}</td>
                        <td style={{ padding: "8px 8px", color: "#6366f1", fontWeight: 600 }}>
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}

      </div>
    </div>
  );
}
