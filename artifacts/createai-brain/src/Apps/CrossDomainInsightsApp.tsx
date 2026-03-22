/**
 * CrossDomainInsightsApp — Unified cross-domain intelligence dashboard
 *
 * Shows AI-synthesized insights across all platform domains:
 * health, legal, staffing, projects, leads, and people.
 *
 * Routes used:
 *   GET  /api/oracle/snapshots   — Recent intelligence snapshots
 *   GET  /api/oracle/report      — Full cross-domain intelligence report
 *   GET  /api/platform-dna/score — Platform maturity score per dimension
 */
import React, { useCallback, useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Snapshot {
  id: number;
  query: string;
  summary: string;
  domains: string[];
  created_at: string;
}

interface DomainStat {
  domain: string;
  label: string;
  icon: string;
  color: string;
  count: number | null;
  trend: "up" | "flat" | "down";
}

interface DnaScore {
  overallScore: number;
  tier: string;
  dimensions: { dimension: string; score: number; label: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DOMAIN_ICONS: Record<string, string> = {
  health:    "🏥",
  legal:     "⚖️",
  staffing:  "👥",
  projects:  "📋",
  leads:     "📈",
  people:    "🙍",
  documents: "📄",
};
const DOMAIN_COLORS: Record<string, string> = {
  health:    "#10b981",
  legal:     "#f59e0b",
  staffing:  "#3b82f6",
  projects:  "#8b5cf6",
  leads:     "#ec4899",
  people:    "#6366f1",
  documents: "#64748b",
};

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CrossDomainInsightsApp() {
  const [snapshots, setSnapshots]   = useState<Snapshot[]>([]);
  const [dna, setDna]               = useState<DnaScore | null>(null);
  const [domainStats, setDomainStats] = useState<DomainStat[]>([]);
  const [loading, setLoading]       = useState(true);
  const [reporting, setReporting]   = useState(false);
  const [report, setReport]         = useState<string>("");
  const [showReport, setShowReport] = useState(false);
  const [notify, setNotify]         = useState("");

  const toast = (msg: string) => {
    setNotify(msg);
    setTimeout(() => setNotify(""), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [snapRes, dnaRes] = await Promise.all([
      fetch("/api/oracle/snapshots?limit=6", { credentials: "include" })
        .then(r => r.json()).catch(() => ({ snapshots: [] })),
      fetch("/api/platform-dna/score", { credentials: "include" })
        .then(r => r.json()).catch(() => null),
    ]);

    const rawSnaps: Snapshot[] = (snapRes as { snapshots: Snapshot[] }).snapshots ?? [];
    setSnapshots(rawSnaps);
    setDna(dnaRes as DnaScore ?? null);

    // Derive domain stats from snapshots
    const domainCounts: Record<string, number> = {};
    rawSnaps.forEach(s => {
      (s.domains ?? []).forEach(d => {
        domainCounts[d] = (domainCounts[d] ?? 0) + 1;
      });
    });
    const allDomains = ["health", "legal", "staffing", "projects", "leads", "people", "documents"];
    setDomainStats(allDomains.map(d => ({
      domain:  d,
      label:   d.charAt(0).toUpperCase() + d.slice(1),
      icon:    DOMAIN_ICONS[d] ?? "📦",
      color:   DOMAIN_COLORS[d] ?? "#6366f1",
      count:   domainCounts[d] ?? 0,
      trend:   "flat" as const,
    })));
    setLoading(false);
  }, []);

  const generateReport = async () => {
    setReporting(true);
    toast("Generating cross-domain intelligence report…");
    try {
      const r = await fetch("/api/oracle/report", { credentials: "include" });
      const d = await r.json() as { ok: boolean; report?: { synthesis: string } };
      if (d.ok && d.report?.synthesis) {
        setReport(d.report.synthesis);
        setShowReport(true);
        toast("Report generated");
        void load();
      } else {
        toast("Could not generate report — Oracle requires auth");
      }
    } catch {
      toast("Network error");
    }
    setReporting(false);
  };

  useEffect(() => { void load(); }, [load]);

  const dnaScore = dna?.overallScore ?? null;
  const dnaTier  = dna?.tier ?? "—";

  return (
    <div style={{
      minHeight: "100%", background: "#020617", color: "#f1f5f9",
      fontFamily: "Inter, sans-serif", padding: "28px 32px",
    }}>
      {/* Skip link */}
      <a href="#main-content" style={{
        position: "absolute", left: "-9999px", top: "auto",
        background: "#6366f1", color: "#fff", padding: "4px 8px",
        zIndex: 9999, borderRadius: 4,
      }}>Skip to main content</a>

      {/* Notification */}
      {notify && (
        <div aria-live="polite" role="status" style={{
          position: "fixed", top: 20, right: 24, background: "#1e1b4b",
          border: "1px solid #6366f1", color: "#c7d2fe", padding: "10px 18px",
          borderRadius: 10, zIndex: 9999, fontSize: 13,
        }}>{notify}</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#e2e8f0" }}>
            🌐 Cross-Domain Insights
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            AI-synthesized intelligence across all platform domains
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={reporting}
          aria-label="Generate full cross-domain intelligence report"
          style={{
            background: reporting ? "#1e293b" : "#6366f1",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 18px", fontSize: 13, fontWeight: 600,
            cursor: reporting ? "not-allowed" : "pointer", opacity: reporting ? 0.6 : 1,
          }}
        >
          {reporting ? "Generating…" : "⚡ Generate Report"}
        </button>
      </div>

      <main id="main-content">

        {/* Platform maturity card */}
        {dna && (
          <div style={{
            background: "#0f172a", borderRadius: 12,
            border: "1px solid #1e293b", padding: "18px 24px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 24,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#6366f1" }}>{dnaScore}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Platform Score</div>
            </div>
            <div style={{ width: 1, height: 48, background: "#1e293b" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{dnaTier} Platform</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                {dna.dimensions?.length ?? 0} capability dimensions tracked
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 480 }}>
              {(dna.dimensions ?? []).slice(0, 6).map(dim => (
                <div key={dim.dimension} style={{
                  background: dim.score >= 90 ? "#052e16" : dim.score >= 70 ? "#1c1917" : "#2d1515",
                  border: `1px solid ${dim.score >= 90 ? "#166534" : dim.score >= 70 ? "#78350f" : "#7f1d1d"}`,
                  borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#e2e8f0",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                    background: dim.score >= 90 ? "#22c55e" : dim.score >= 70 ? "#f59e0b" : "#ef4444",
                  }} />
                  {dim.label} — {dim.score}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Domain Activity Grid */}
        <section aria-label="Domain activity summary">
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Domain Coverage
          </h2>
          {loading ? (
            <div style={{ color: "#475569", fontSize: 14 }}>Loading domain data…</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
              {domainStats.map(stat => (
                <div key={stat.domain} style={{
                  background: "#0f172a", borderRadius: 10,
                  border: `1px solid ${stat.count > 0 ? stat.color + "44" : "#1e293b"}`,
                  padding: "16px 14px", transition: "border-color 0.2s",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{stat.label}</div>
                  <div style={{
                    fontSize: 22, fontWeight: 800, color: stat.count > 0 ? stat.color : "#334155",
                    marginTop: 4,
                  }}>
                    {stat.count > 0 ? stat.count : "—"}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                    {stat.count > 0 ? "queries in snapshots" : "no recent activity"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Snapshots */}
        <section aria-label="Recent intelligence snapshots">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
              Recent Intelligence Snapshots
            </h2>
            <button
              onClick={load}
              aria-label="Refresh intelligence snapshots"
              style={{
                background: "transparent", color: "#6366f1", border: "1px solid #312e81",
                borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer",
              }}
            >↻ Refresh</button>
          </div>

          {loading ? (
            <div style={{ color: "#475569", fontSize: 14 }}>Loading snapshots…</div>
          ) : snapshots.length === 0 ? (
            <div style={{
              background: "#0f172a", borderRadius: 10, border: "1px dashed #1e293b",
              padding: "32px 24px", textAlign: "center", color: "#475569", fontSize: 14,
            }}>
              No intelligence snapshots yet. Use the <strong style={{ color: "#6366f1" }}>Intelligence Oracle</strong> app to run cross-domain queries, or click <strong style={{ color: "#6366f1" }}>Generate Report</strong> above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {snapshots.map(snap => (
                <div key={snap.id} style={{
                  background: "#0f172a", borderRadius: 10, border: "1px solid #1e293b",
                  padding: "16px 20px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, fontStyle: "italic" }}>
                        "{snap.query}"
                      </div>
                      <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6 }}>
                        {snap.summary}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {ago(snap.created_at)}
                    </div>
                  </div>
                  {(snap.domains ?? []).length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      {snap.domains.map(d => (
                        <span key={d} style={{
                          background: (DOMAIN_COLORS[d] ?? "#6366f1") + "22",
                          border: `1px solid ${(DOMAIN_COLORS[d] ?? "#6366f1")}55`,
                          color: DOMAIN_COLORS[d] ?? "#6366f1",
                          borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600,
                          textTransform: "uppercase", letterSpacing: 0.5,
                        }}>
                          {DOMAIN_ICONS[d] ?? "📦"} {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Report modal */}
        {showReport && report && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cross-domain intelligence report"
            onClick={() => setShowReport(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 9999, padding: 24,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: "#0f172a", border: "1px solid #6366f1",
                borderRadius: 14, padding: "28px 32px", maxWidth: 720, width: "100%",
                maxHeight: "80vh", overflow: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#e2e8f0" }}>
                  🌐 Cross-Domain Intelligence Report
                </h2>
                <button onClick={() => setShowReport(false)} style={{
                  background: "transparent", border: "none", color: "#64748b",
                  fontSize: 20, cursor: "pointer",
                }} aria-label="Close report">✕</button>
              </div>
              <p style={{
                fontSize: 14, lineHeight: 1.8, color: "#cbd5e1",
                whiteSpace: "pre-wrap", margin: 0,
              }}>
                {report}
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default CrossDomainInsightsApp;
