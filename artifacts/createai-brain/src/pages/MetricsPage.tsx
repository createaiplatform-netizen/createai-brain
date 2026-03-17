import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

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

// ─── Fetch helpers (module-level — stable, never recreated) ─────────────────

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

// ─── Design tokens — identical to OS shell ─────────────────────────────────

const CARD_BG   = "#ffffff";
const BORDER    = "1px solid rgba(0,0,0,0.08)";
const SHADOW    = "0 1px 4px rgba(0,0,0,0.06)";
const TEXT_MAIN = "#0f172a";
const TEXT_SUB  = "#64748b";
const TEXT_DIM  = "#94a3b8";
const ACCENT    = "#6366f1";

// ─── CSS keyframes — injected once, never again ─────────────────────────────

const STYLE_ID = "metrics-page-styles";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes metrics-fade-up {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes metrics-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .metrics-section {
      animation: metrics-fade-up 0.32s ease both;
    }
    .metrics-section:nth-child(1) { animation-delay: 0.00s; }
    .metrics-section:nth-child(2) { animation-delay: 0.06s; }
    .metrics-section:nth-child(3) { animation-delay: 0.12s; }
    .metrics-section:nth-child(4) { animation-delay: 0.18s; }
    .metrics-section:nth-child(5) { animation-delay: 0.24s; }
    .metrics-skeleton {
      background: linear-gradient(90deg,
        rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 100%);
      background-size: 800px 100%;
      animation: metrics-shimmer 1.4s infinite linear;
      border-radius: 6px;
    }
    /* Hover — background-color only, no layout shift */
    .metrics-badge:hover {
      background-color: rgba(99,102,241,0.10) !important;
      border-color: rgba(99,102,241,0.30) !important;
    }
    /* Focus — visible ring matching the OS shell's indigo accent */
    .metrics-row:focus-visible {
      outline: 2px solid #6366f1;
      outline-offset: -2px;
      background-color: rgba(99,102,241,0.04);
    }
    .metrics-badge:focus-visible {
      outline: 2px solid #6366f1;
      outline-offset: 3px;
      border-radius: 12px;
    }
  `;
  document.head.appendChild(el);
}

// ─── Helpers (module-level — pure, stable) ──────────────────────────────────

function fmt(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

/** Derives a stable, URL-safe id from a section title for aria-labelledby. */
function titleId(title: string) {
  return "metrics-section-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Memoized sub-components ─────────────────────────────────────────────────

const SkeletonRect = memo(function SkeletonRect({ w, h, label }: { w: string | number; h: number; label?: string }) {
  return (
    <div
      className="metrics-skeleton"
      aria-hidden="true"
      style={{ width: w, height: h, display: "inline-block" }}
      aria-label={label}
    />
  );
});

const SkeletonCard = memo(function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{
      background: CARD_BG, border: BORDER, borderRadius: 14,
      boxShadow: SHADOW, padding: "20px 24px", marginBottom: 20,
    }}>
      <SkeletonRect w={120} h={14} />
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SkeletonRect w="35%" h={11} />
            <SkeletonRect w="45%" h={8} />
            <SkeletonRect w="10%" h={11} />
          </div>
        ))}
      </div>
    </div>
  );
});

/** Informational empty state — role="note" signals it's advisory, not interactive. */
const EmptyState = memo(function EmptyState({ message }: { message: string }) {
  return (
    <div
      role="note"
      aria-label={message}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 8, padding: "28px 0",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 28, opacity: 0.3 }}>📭</span>
      <p style={{ margin: 0, fontSize: 13, color: TEXT_DIM, textAlign: "center" }}>
        {message}
      </p>
    </div>
  );
});

/**
 * Bar — visual representation of a value relative to a maximum.
 * Uses role="meter" so screen readers can announce the proportion.
 * The numeric label to the right provides a text equivalent of the fill color.
 */
const Bar = memo(function Bar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const ariaLabel = label
    ? `${label}: ${value} out of ${max} (${pct}%)`
    : `${value} out of ${max} (${pct}%)`;
  return (
    <div
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      {/* Track */}
      <div
        aria-hidden="true"
        style={{
          flex: 1, height: 6, background: "rgba(99,102,241,0.10)",
          borderRadius: 4, overflow: "hidden",
        }}
      >
        {/* Fill — color-only indicator; aria-label on parent covers it */}
        <div style={{
          width: `${pct}%`, height: "100%", background: ACCENT,
          borderRadius: 4, transition: "width 0.6s ease",
        }} />
      </div>
      {/* Numeric text equivalent — visible and always present */}
      <span style={{ fontSize: 12, color: TEXT_DIM, minWidth: 28, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
});

/**
 * SectionCard — renders as a <section> with an associated <h2> heading.
 * The heading id is referenced by aria-labelledby so assistive technology
 * announces the section label when focus enters.
 */
const SectionCard = memo(function SectionCard({
  title, children,
}: {
  title: string; children: React.ReactNode;
}) {
  const id = titleId(title);
  return (
    <section
      aria-labelledby={id}
      className="metrics-section"
      style={{
        background: CARD_BG, border: BORDER, borderRadius: 14,
        boxShadow: SHADOW, padding: "20px 24px", marginBottom: 20,
      }}
    >
      <h2
        id={id}
        style={{
          margin: "0 0 16px 0", fontSize: 14, fontWeight: 600,
          color: TEXT_MAIN, letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
});

/**
 * TotalBadge — informational stat tile.
 * aria-label combines value + period so screen readers read it as one unit,
 * e.g. "312 Today" instead of "312" then "Today" as separate elements.
 */
const TotalBadge = memo(function TotalBadge({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="metrics-badge"
      role="figure"
      aria-label={`${value} — ${label}`}
      tabIndex={0}
      style={{
        background: `${ACCENT}0d`, border: `1px solid ${ACCENT}22`,
        borderRadius: 12, padding: "16px 20px", textAlign: "center",
        flex: 1, minWidth: 100,
        transition: "background-color 0.15s ease, border-color 0.15s ease",
        cursor: "default",
      }}
    >
      <div
        aria-hidden="true"
        style={{ fontSize: 28, fontWeight: 700, color: ACCENT, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div aria-hidden="true" style={{ fontSize: 12, color: TEXT_SUB, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
});

/** THead — adds scope="col" to every <th> for correct column association. */
const THead = memo(function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr>
        {cols.map((col) => (
          <th
            key={col}
            scope="col"
            style={{
              padding: "6px 10px 6px 0", textAlign: "left", fontSize: 11,
              fontWeight: 600, color: TEXT_DIM, textTransform: "uppercase",
              letterSpacing: "0.06em", borderBottom: "1px solid rgba(0,0,0,0.07)",
              whiteSpace: "nowrap",
            }}
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
});

/**
 * HRow — hoverable, keyboard-accessible table row.
 *
 * tabIndex={0}  — makes the row reachable via Tab key
 * onKeyDown     — Enter / Space announce "selected" to screen readers
 * onFocus/Blur  — mirrors hover highlight so keyboard users see the same cue
 * class="metrics-row" — picks up :focus-visible outline from injected CSS
 */
const HRow = memo(function HRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLTableRowElement>(null);

  const highlight = useCallback(() => {
    if (ref.current) ref.current.style.backgroundColor = "rgba(99,102,241,0.04)";
  }, []);

  const clear = useCallback(() => {
    if (ref.current) ref.current.style.backgroundColor = "transparent";
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      highlight();
      setTimeout(clear, 200);
    }
  }, [highlight, clear]);

  return (
    <tr
      ref={ref}
      className="metrics-row"
      tabIndex={0}
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        transition: "background-color 0.12s ease",
      }}
      onMouseEnter={highlight}
      onMouseLeave={clear}
      onFocus={highlight}
      onBlur={clear}
      onKeyDown={handleKeyDown}
    >
      {children}
    </tr>
  );
});

// ─── MetricsPage — content only, layout provided by OSLayout ───────────────

export default function MetricsPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [curves,  setCurves]  = useState<CurvesResponse  | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    ensureStyles();
    let cancelled = false;
    Promise.all([fetchSummary(), fetchCurves()])
      .then(([s, c]) => {
        if (!cancelled) { setSummary(s); setCurves(c); }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  const maxLifetime = useMemo(
    () => summary ? Math.max(...summary.summary.map((r) => r.lifetime), 1) : 1,
    [summary],
  );

  // ── Loading skeleton ────────────────────────────────────────────────────────
  // role="status" + aria-live="polite" tells screen readers the page is loading
  // and will announce the update when data arrives without interrupting speech.
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading metrics data, please wait"
        style={{ padding: "24px 24px 64px", maxWidth: 900, margin: "0 auto" }}
      >
        {/* Visually-hidden text for screen readers — skeletons are aria-hidden */}
        <span className="sr-only" style={{
          position: "absolute", width: 1, height: 1,
          overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
        }}>
          Loading metrics data…
        </span>

        <div style={{
          background: CARD_BG, border: BORDER, borderRadius: 14,
          boxShadow: SHADOW, padding: "20px 24px", marginBottom: 20,
        }}>
          <SkeletonRect w={60} h={14} />
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                flex: 1, minWidth: 100, borderRadius: 12, padding: "16px 20px",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                <SkeletonRect w={40} h={28} />
                <SkeletonRect w={60} h={11} />
              </div>
            ))}
          </div>
        </div>
        <SkeletonCard rows={5} />
        <SkeletonCard rows={4} />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  // role="alert" causes screen readers to announce the message immediately,
  // interrupting any current speech — appropriate for errors.
  if (error) {
    return (
      <div style={{ padding: "24px 24px 64px", maxWidth: 900, margin: "0 auto" }}>
        <div
          role="alert"
          style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
            padding: "16px 20px", color: "#dc2626", fontSize: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <span aria-hidden="true">⚠️</span>
          <span>Failed to load metrics: {error}</span>
        </div>
      </div>
    );
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  return (
    <main
      aria-label="Metrics dashboard"
      style={{ padding: "24px 24px 64px", maxWidth: 900, margin: "0 auto" }}
    >

      {/* ── Totals ── */}
      {summary && (
        <SectionCard title="Totals">
          {summary.totals.lifetime === 0 ? (
            <EmptyState message="No events recorded yet. Run an engine or open an app to start tracking." />
          ) : (
            <div
              role="list"
              aria-label="Event totals by time period"
              style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
            >
              <div role="listitem"><TotalBadge label="Today"        value={summary.totals.daily}    /></div>
              <div role="listitem"><TotalBadge label="Last 7 days"  value={summary.totals.weekly}   /></div>
              <div role="listitem"><TotalBadge label="Last 30 days" value={summary.totals.monthly}  /></div>
              <div role="listitem"><TotalBadge label="All time"     value={summary.totals.lifetime} /></div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Per-type breakdown ── */}
      {summary && (
        <SectionCard title="Per-type counts">
          {summary.summary.length === 0 ? (
            <EmptyState message="No events by type yet." />
          ) : (
            <table
              aria-label="Event counts per type with activity bar, daily, weekly, monthly, and lifetime values"
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <THead cols={["Type", "Activity", "Daily", "Weekly", "Monthly", "Lifetime"]} />
              <tbody>
                {summary.summary.map((row) => (
                  <HRow key={row.type}>
                    <td style={{ padding: "10px 10px 10px 0", color: TEXT_MAIN, fontWeight: 500, whiteSpace: "nowrap" }}>
                      {fmt(row.type)}
                    </td>
                    <td style={{ padding: "10px 10px 10px 0", width: "30%" }}>
                      <Bar value={row.lifetime} max={maxLifetime} label={fmt(row.type)} />
                    </td>
                    <td style={{ padding: "10px 10px 10px 0", color: TEXT_SUB }}>{row.daily}</td>
                    <td style={{ padding: "10px 10px 10px 0", color: TEXT_SUB }}>{row.weekly}</td>
                    <td style={{ padding: "10px 10px 10px 0", color: TEXT_SUB }}>{row.monthly}</td>
                    <td style={{ padding: "10px 0", color: ACCENT, fontWeight: 700 }}>{row.lifetime}</td>
                  </HRow>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}

      {/* ── Daily ── */}
      {curves && (
        <SectionCard title="Daily — last 30 days">
          {curves.daily.length === 0 ? (
            <EmptyState message="No daily events in the last 30 days." />
          ) : (
            <table
              aria-label="Daily event counts for the last 30 days"
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <THead cols={["Date", "Type", "Count"]} />
              <tbody>
                {curves.daily.map((row) => (
                  <HRow key={`${row.date}-${row.type}`}>
                    <td style={{ padding: "8px 10px 8px 0", color: TEXT_SUB, whiteSpace: "nowrap" }}>
                      {fmtDate(row.date)}
                    </td>
                    <td style={{ padding: "8px 10px 8px 0", color: TEXT_MAIN }}>{fmt(row.type)}</td>
                    <td style={{ padding: "8px 0", color: ACCENT, fontWeight: 600 }}>{row.count}</td>
                  </HRow>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}

      {/* ── Weekly ── */}
      {curves && (
        <SectionCard title="Weekly — last 12 weeks">
          {curves.weekly.length === 0 ? (
            <EmptyState message="No weekly events in the last 12 weeks." />
          ) : (
            <table
              aria-label="Weekly event counts for the last 12 weeks"
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <THead cols={["Week of", "Type", "Count"]} />
              <tbody>
                {curves.weekly.map((row) => (
                  <HRow key={`${row.weekStart}-${row.type}`}>
                    <td style={{ padding: "8px 10px 8px 0", color: TEXT_SUB, whiteSpace: "nowrap" }}>
                      {fmtDate(row.weekStart)}
                    </td>
                    <td style={{ padding: "8px 10px 8px 0", color: TEXT_MAIN }}>{fmt(row.type)}</td>
                    <td style={{ padding: "8px 0", color: ACCENT, fontWeight: 600 }}>{row.count}</td>
                  </HRow>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}

      {/* ── Monthly ── */}
      {curves && (
        <SectionCard title="Monthly — last 12 months">
          {curves.monthly.length === 0 ? (
            <EmptyState message="No monthly events in the last 12 months." />
          ) : (
            <table
              aria-label="Monthly event counts for the last 12 months"
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <THead cols={["Month", "Type", "Count"]} />
              <tbody>
                {curves.monthly.map((row) => (
                  <HRow key={`${row.monthStart}-${row.type}`}>
                    <td style={{ padding: "8px 10px 8px 0", color: TEXT_SUB, whiteSpace: "nowrap" }}>
                      {fmtDate(row.monthStart)}
                    </td>
                    <td style={{ padding: "8px 10px 8px 0", color: TEXT_MAIN }}>{fmt(row.type)}</td>
                    <td style={{ padding: "8px 0", color: ACCENT, fontWeight: 600 }}>{row.count}</td>
                  </HRow>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}

    </main>
  );
}
