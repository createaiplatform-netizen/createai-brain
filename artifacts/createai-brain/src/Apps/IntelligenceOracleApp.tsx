import React, { useState, useEffect } from "react";

type Snapshot = { id: number; query: string | null; report_type: string; domains_used: string[]; created_at: string; excerpt: string };
type OracleStatus = { engine: string; model: string; domains: string[]; stats: { total: number; reports: number; queries: number; last_query_at: string | null } };

const S: Record<string, React.CSSProperties> = {
  root:   { background: "#020617", minHeight: "100%", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", padding: "1.5rem", overflowY: "auto" as const },
  h1:     { fontSize: "1.25rem", fontWeight: 700, color: "#a5b4fc" },
  sub:    { fontSize: ".8rem", color: "#64748b", marginTop: ".2rem", marginBottom: "1.25rem" },
  grid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" },
  card:   { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "12px", padding: "1.25rem" },
  h2:     { fontSize: ".875rem", fontWeight: 600, color: "#c7d2fe", marginBottom: "1rem" },
  inp:    { background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.15)", borderRadius: "10px", color: "#e2e8f0", padding: ".65rem 1rem", fontSize: ".875rem", width: "100%", boxSizing: "border-box" as const, resize: "vertical" as const, minHeight: "80px", outline: "none" },
  btn:    { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: "10px", padding: ".65rem 1.5rem", fontSize: ".875rem", cursor: "pointer", fontWeight: 700 },
  btn2:   { background: "rgba(99,102,241,.2)", color: "#a5b4fc", border: "none", borderRadius: "10px", padding: ".65rem 1.5rem", fontSize: ".875rem", cursor: "pointer", fontWeight: 600 },
  result: { background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.2)", borderRadius: "12px", padding: "1.25rem", marginTop: "1.25rem" },
  pre:    { fontFamily: "'Inter',system-ui,sans-serif", fontSize: ".83rem", lineHeight: 1.7, color: "#c7d2fe", whiteSpace: "pre-wrap" as const },
  chip:   { background: "rgba(99,102,241,.15)", color: "#a5b4fc", padding: ".15em .5em", borderRadius: "4px", fontSize: ".72rem" },
  snap:   { background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "10px", padding: ".9rem 1rem", marginBottom: ".6rem" },
  stat:   { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "10px", padding: "1rem", textAlign: "center" as const },
  sn:     { fontSize: "1.5rem", fontWeight: 800, color: "#a5b4fc" },
  sl:     { fontSize: ".7rem", color: "#64748b", marginTop: ".2rem" },
  loader: { textAlign: "center" as const, padding: "2rem", color: "#6366f1" },
  hint:   { fontSize: ".75rem", color: "#64748b", marginTop: ".5rem" },
  toast:  { background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "8px", padding: ".75rem 1rem", marginBottom: "1rem", fontSize: ".8rem", color: "#ef4444" },
};

const SAMPLE_QUERIES = [
  "What are my top revenue opportunities right now?",
  "Which domain has the most active clients this month?",
  "Identify patterns between my leads, projects, and staffing data.",
  "What are the biggest risks across all my business domains?",
  "Where should I focus my energy in the next 30 days?",
];

export function IntelligenceOracleApp() {
  const [query,     setQuery]    = useState("");
  const [insight,   setInsight]  = useState("");
  const [snapshots, setSnaps]    = useState<Snapshot[]>([]);
  const [status,    setStatus]   = useState<OracleStatus | null>(null);
  const [loading,   setLoading]  = useState(false);
  const [loadRpt,   setLoadRpt]  = useState(false);
  const [error,     setError]    = useState("");
  const [domains,   setDomains]  = useState<string[]>([]);
  const [tokens,    setTokens]   = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/oracle/status", { credentials: "include" }).then(r => r.json()).then((d: OracleStatus) => setStatus(d)).catch(() => {});
    fetch("/api/oracle/snapshots?limit=5", { credentials: "include" }).then(r => r.json()).then((d: { snapshots?: Snapshot[] }) => setSnaps(d.snapshots ?? [])).catch(() => {});
  }, []);

  const query_oracle = async (q: string) => {
    if (!q.trim() || q.length < 5) { setError("Query must be at least 5 characters"); return; }
    setLoading(true); setError(""); setInsight(""); setDomains([]); setTokens({});
    const r = await fetch("/api/oracle/query", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    }).catch(() => null);
    setLoading(false);
    if (!r || !r.ok) { setError("Oracle unavailable — check AI integration"); return; }
    const d = await r.json() as { ok: boolean; insight: string; domainsUsed?: string[]; tokenUsage?: Record<string, number> };
    setInsight(d.insight ?? "");
    setDomains(d.domainsUsed ?? []);
    setTokens(d.tokenUsage ?? {});
    // Refresh snapshots
    fetch("/api/oracle/snapshots?limit=5", { credentials: "include" }).then(r2 => r2.json()).then((d2: { snapshots?: Snapshot[] }) => setSnaps(d2.snapshots ?? [])).catch(() => {});
  };

  const gen_report = async () => {
    setLoadRpt(true); setError(""); setInsight(""); setDomains([]);
    const r = await fetch("/api/oracle/report", { credentials: "include" }).catch(() => null);
    setLoadRpt(false);
    if (!r || !r.ok) { setError("Report generation failed — check AI integration"); return; }
    const d = await r.json() as { ok: boolean; insight: string; domainsUsed?: string[] };
    setInsight(d.insight ?? "");
    setDomains(d.domainsUsed ?? []);
    fetch("/api/oracle/snapshots?limit=5", { credentials: "include" }).then(r2 => r2.json()).then((d2: { snapshots?: Snapshot[] }) => setSnaps(d2.snapshots ?? [])).catch(() => {});
  };

  return (
    <div style={S.root} role="main">
      <a href="#query" style={{ position: "absolute", left: -999, top: 0 }}>Skip to query</a>
      <div style={S.h1}>🔮 Intelligence Oracle</div>
      <div style={S.sub}>GPT-4o cross-domain intelligence — sees all platform data at once</div>

      {/* Stats */}
      {status && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
          <div style={S.stat}><div style={S.sn}>{status.stats.total}</div><div style={S.sl}>Total Snapshots</div></div>
          <div style={S.stat}><div style={S.sn}>{status.domains.length}</div><div style={S.sl}>Domains Monitored</div></div>
          <div style={S.stat}><div style={{ ...S.sn, fontSize: "1rem" }}>{status.model}</div><div style={S.sl}>AI Model</div></div>
        </div>
      )}

      <div style={S.grid}>
        {/* Query panel */}
        <div style={{ ...S.card, display: "flex", flexDirection: "column" as const, gap: ".75rem" }} id="query">
          <div style={S.h2}>Ask the Oracle</div>
          <textarea style={S.inp} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Ask any cross-domain question: revenue patterns, risks, opportunities, recommendations…"
            aria-label="Oracle query input" />
          <div style={{ display: "flex", gap: ".75rem" }}>
            <button style={S.btn} onClick={() => query_oracle(query)} disabled={loading || loadRpt}>
              {loading ? "Thinking…" : "Ask Oracle"}
            </button>
            <button style={S.btn2} onClick={gen_report} disabled={loading || loadRpt}>
              {loadRpt ? "Generating…" : "Full Report"}
            </button>
          </div>
          <div>
            <div style={{ fontSize: ".75rem", color: "#64748b", marginBottom: ".4rem" }}>Sample queries:</div>
            {SAMPLE_QUERIES.map((q, i) => (
              <div key={i} style={{ fontSize: ".75rem", color: "#6366f1", cursor: "pointer", padding: ".2rem 0" }}
                onClick={() => setQuery(q)}>→ {q}</div>
            ))}
          </div>
        </div>

        {/* Recent snapshots */}
        <div style={S.card}>
          <div style={S.h2}>Recent Insights ({snapshots.length})</div>
          {snapshots.length === 0 ? (
            <div style={{ color: "#64748b", fontSize: ".8rem", textAlign: "center" as const, padding: "1.5rem", fontStyle: "italic" }}>
              No snapshots yet. Ask your first question →
            </div>
          ) : snapshots.map(s => (
            <div key={s.id} style={S.snap}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                <span style={{ ...S.chip, background: s.report_type === "full_report" ? "rgba(139,92,246,.2)" : "rgba(99,102,241,.15)", color: s.report_type === "full_report" ? "#c4b5fd" : "#a5b4fc" }}>
                  {s.report_type === "full_report" ? "📊 Report" : "💬 Query"}
                </span>
                <span style={{ fontSize: ".7rem", color: "#64748b" }}>{new Date(s.created_at).toLocaleString()}</span>
              </div>
              {s.query && <div style={{ fontSize: ".78rem", color: "#c7d2fe", marginBottom: ".25rem" }}>"{s.query}"</div>}
              <div style={{ fontSize: ".76rem", color: "#94a3b8" }}>{s.excerpt}…</div>
            </div>
          ))}
        </div>
      </div>

      {error && <div style={S.toast} role="alert">{error}</div>}

      {(loading || loadRpt) && (
        <div style={S.loader} aria-live="polite" aria-busy="true">
          <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🔮</div>
          <div style={{ fontSize: ".9rem", color: "#a5b4fc" }}>Oracle is analysing all platform data…</div>
          <div style={{ fontSize: ".75rem", color: "#64748b", marginTop: ".3rem" }}>Querying {status?.domains.length ?? 9} domains simultaneously</div>
        </div>
      )}

      {insight && (
        <div style={S.result}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{ fontSize: ".875rem", fontWeight: 700, color: "#a5b4fc" }}>Oracle Response</div>
            <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" as const }}>
              {domains.map(d => <span key={d} style={S.chip}>{d}</span>)}
            </div>
          </div>
          <div style={S.pre}>{insight}</div>
          {tokens["total_tokens"] && (
            <div style={{ fontSize: ".7rem", color: "#64748b", marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: ".6rem" }}>
              Tokens used: {tokens["prompt_tokens"]} prompt + {tokens["completion_tokens"]} completion = {tokens["total_tokens"]} total
            </div>
          )}
        </div>
      )}
    </div>
  );
}
