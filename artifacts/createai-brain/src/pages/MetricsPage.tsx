import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";

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

// ─── Design tokens (matching OS shell) ─────────────────────────────────────

const PAGE_BG   = "hsl(220,20%,97%)";
const CARD_BG   = "#ffffff";
const BORDER    = "1px solid rgba(0,0,0,0.08)";
const SHADOW    = "0 1px 4px rgba(0,0,0,0.06)";
const TEXT_MAIN = "#0f172a";
const TEXT_SUB  = "#64748b";
const TEXT_DIM  = "#94a3b8";
const ACCENT    = "#6366f1";

// ─── Small helpers ──────────────────────────────────────────────────────────

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

// ─── Sub-components ─────────────────────────────────────────────────────────

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "rgba(99,102,241,0.10)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: ACCENT, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, color: TEXT_DIM, minWidth: 28, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD_BG, border: BORDER, borderRadius: 14, boxShadow: SHADOW, padding: "20px 24px", marginBottom: 20 }}>
      <h2 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 600, color: TEXT_MAIN, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function TotalBadge({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: `${ACCENT}0d`,
      border: `1px solid ${ACCENT}22`,
      borderRadius: 12,
      padding: "16px 20px",
      textAlign: "center",
      flex: 1,
      minWidth: 100,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: ACCENT, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 12, color: TEXT_SUB, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr>
        {cols.map((col) => (
          <th
            key={col}
            style={{ padding: "6px 10px 6px 0", textAlign: "left", fontSize: 11, fontWeight: 600,
              color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function MetricsPage() {
  const [, setLocation] = useLocation();
  const [summary, setSummary]   = useState<SummaryResponse | null>(null);
  const [curves, setCurves]     = useState<CurvesResponse | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([fetchSummary(), fetchCurves()])
      .then(([s, c]) => { setSummary(s); setCurves(c); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const maxLifetime = summary ? Math.max(...summary.summary.map((r) => r.lifetime), 1) : 1;

  return (
    <div style={{ minHeight: "100dvh", background: PAGE_BG, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => setLocation("/")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: BORDER, borderRadius: 8,
              padding: "5px 12px", fontSize: 13, color: TEXT_SUB,
              cursor: "pointer", boxShadow: SHADOW,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEXT_MAIN; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT_SUB; }}
          >
            ← Home
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>📊</span>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: TEXT_MAIN, letterSpacing: "-0.02em" }}>
                Metrics
              </h1>
            </div>
            <p style={{ margin: "2px 0 0 30px", fontSize: 13, color: TEXT_SUB }}>
              Live data · <code style={{ color: ACCENT, fontSize: 12 }}>/api/metrics/summary</code> &amp; <code style={{ color: ACCENT, fontSize: 12 }}>/api/metrics/curves</code>
            </p>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ color: TEXT_DIM, fontSize: 14, padding: "24px 0" }}>Loading…</div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
            padding: "14px 18px", color: "#dc2626", fontSize: 14, marginBottom: 20,
          }}>
            Failed to load metrics: {error}
          </div>
        )}

        {/* ── Totals ── */}
        {summary && (
          <>
            <Card title="Totals">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <TotalBadge label="Today"       value={summary.totals.daily}    />
                <TotalBadge label="Last 7 days" value={summary.totals.weekly}   />
                <TotalBadge label="Last 30 days" value={summary.totals.monthly} />
                <TotalBadge label="All time"    value={summary.totals.lifetime} />
              </div>
            </Card>

            {/* ── Per-type breakdown ── */}
            <Card title="Per-type counts">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <TableHead cols={["Type", "Activity", "Daily", "Weekly", "Monthly", "Lifetime"]} />
                <tbody>
                  {summary.summary.map((row) => (
                    <tr key={row.type} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <td style={{ padding: "10px 10px 10px 0", color: TEXT_MAIN, fontWeight: 500, whiteSpace: "nowrap" }}>
                        {fmt(row.type)}
                      </td>
                      <td style={{ padding: "10px 10px 10px 0", width: "30%" }}>
                        <Bar value={row.lifetime} max={maxLifetime} />
                      </td>
                      <td style={{ padding: "10px 10px 10px 0", color: TEXT_SUB }}>{row.daily}</td>
                      <td style={{ padding: "10px 10px 10px 0", color: TEXT_SUB }}>{row.weekly}</td>
                      <td style={{ padding: "10px 10px 10px 0", color: TEXT_SUB }}>{row.monthly}</td>
                      <td style={{ padding: "10px 0", color: ACCENT, fontWeight: 700 }}>{row.lifetime}</td>
                    </tr>
                  ))}
                  {summary.summary.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "20px 0", color: TEXT_DIM, fontSize: 13 }}>
                        No metric events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {/* ── Curves ── */}
        {curves && (
          <>
            <Card title="Daily — last 30 days">
              {curves.daily.length === 0 ? (
                <p style={{ color: TEXT_DIM, fontSize: 13, margin: 0 }}>No data.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <TableHead cols={["Date", "Type", "Count"]} />
                  <tbody>
                    {curves.daily.map((row) => (
                      <tr key={`${row.date}-${row.type}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "8px 10px 8px 0", color: TEXT_SUB, whiteSpace: "nowrap" }}>{fmtDate(row.date)}</td>
                        <td style={{ padding: "8px 10px 8px 0", color: TEXT_MAIN }}>{fmt(row.type)}</td>
                        <td style={{ padding: "8px 0", color: ACCENT, fontWeight: 600 }}>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Weekly — last 12 weeks">
              {curves.weekly.length === 0 ? (
                <p style={{ color: TEXT_DIM, fontSize: 13, margin: 0 }}>No data.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <TableHead cols={["Week of", "Type", "Count"]} />
                  <tbody>
                    {curves.weekly.map((row) => (
                      <tr key={`${row.weekStart}-${row.type}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "8px 10px 8px 0", color: TEXT_SUB, whiteSpace: "nowrap" }}>{fmtDate(row.weekStart)}</td>
                        <td style={{ padding: "8px 10px 8px 0", color: TEXT_MAIN }}>{fmt(row.type)}</td>
                        <td style={{ padding: "8px 0", color: ACCENT, fontWeight: 600 }}>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Monthly — last 12 months">
              {curves.monthly.length === 0 ? (
                <p style={{ color: TEXT_DIM, fontSize: 13, margin: 0 }}>No data.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <TableHead cols={["Month", "Type", "Count"]} />
                  <tbody>
                    {curves.monthly.map((row) => (
                      <tr key={`${row.monthStart}-${row.type}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <td style={{ padding: "8px 10px 8px 0", color: TEXT_SUB, whiteSpace: "nowrap" }}>{fmtDate(row.monthStart)}</td>
                        <td style={{ padding: "8px 10px 8px 0", color: TEXT_MAIN }}>{fmt(row.type)}</td>
                        <td style={{ padding: "8px 0", color: ACCENT, fontWeight: 600 }}>{row.count}</td>
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
