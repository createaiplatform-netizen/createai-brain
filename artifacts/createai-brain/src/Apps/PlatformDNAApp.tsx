import React, { useState, useEffect } from "react";

type Dimension = { id: string; name: string; score: number; evidence: string[]; gaps: string[] };
type GenomeResp = { ok: boolean; meta: { platform: string; version: string; generatedAt: string }; dimensions: Dimension[] };
type ScoreResp  = { ok: boolean; overallScore: number; maturityLevel: string; dimensions: number; at100Pct: number; below90Pct: number; weakest: { id: string; name: string; score: number }[] };
type GapsResp   = { ok: boolean; totalGaps: number; gaps: Array<{ dimension: string; gap: string; priority: string }> };

const S: Record<string, React.CSSProperties> = {
  root:   { background: "#020617", minHeight: "100%", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", padding: "1.5rem", overflowY: "auto" as const },
  h1:     { fontSize: "1.25rem", fontWeight: 700, color: "#a5b4fc" },
  sub:    { fontSize: ".8rem", color: "#64748b", marginTop: ".2rem", marginBottom: "1.25rem" },
  grid:   { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.25rem" },
  stat:   { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "10px", padding: "1rem", textAlign: "center" as const },
  sn:     { fontSize: "1.5rem", fontWeight: 900, color: "#a5b4fc" },
  sl:     { fontSize: ".7rem", color: "#64748b", marginTop: ".2rem" },
  hero:   { background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.3)", borderRadius: "16px", padding: "1.5rem", textAlign: "center" as const, marginBottom: "1.25rem" },
  hScore: { fontSize: "4rem", fontWeight: 900, color: "#a5b4fc", lineHeight: 1 },
  hLabel: { fontSize: ".8rem", color: "#64748b", marginTop: ".4rem" },
  badge:  { display: "inline-block", background: "rgba(34,197,94,.12)", color: "#86efac", padding: ".3rem .9rem", borderRadius: "9999px", fontSize: ".8rem", fontWeight: 700, marginTop: ".75rem" },
  card:   { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" },
  h2:     { fontSize: ".875rem", fontWeight: 600, color: "#c7d2fe", marginBottom: "1rem" },
  bar:    { display: "flex", alignItems: "center", gap: ".75rem", padding: ".5rem 0", borderBottom: "1px solid rgba(255,255,255,.05)" },
  barLabel:{ flex: "0 0 160px", fontSize: ".8rem", color: "#c7d2fe", cursor: "pointer" },
  barTrack:{ flex: 1, height: "8px", background: "rgba(255,255,255,.06)", borderRadius: "4px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "4px" },
  barNum: { flex: "0 0 32px", textAlign: "right" as const, fontSize: ".8rem", fontWeight: 700 },
  gap:    { padding: ".4rem 0", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: ".8rem" },
  gapDim: { fontSize: ".7rem", color: "#6366f1", fontWeight: 600 },
  tabs:   { display: "flex", gap: ".5rem", marginBottom: "1.25rem" },
  tab:    { background: "rgba(99,102,241,.15)", color: "#a5b4fc", border: "none", borderRadius: "8px", padding: ".4rem .9rem", fontSize: ".8rem", cursor: "pointer" },
  tabA:   { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: ".4rem .9rem", fontSize: ".8rem", cursor: "pointer" },
  btn:    { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: ".4rem .9rem", fontSize: ".8rem", cursor: "pointer", fontWeight: 600 },
  detail: { background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", borderRadius: "10px", padding: "1rem", marginTop: ".75rem" },
  evRow:  { fontSize: ".78rem", color: "#94a3b8", padding: ".2rem 0", display: "flex", gap: ".4rem" },
};

function getBarColor(score: number): string {
  if (score >= 95) return "#22c55e";
  if (score >= 80) return "#eab308";
  return "#ef4444";
}

export function PlatformDNAApp() {
  const [genome,  setGenome]  = useState<GenomeResp | null>(null);
  const [score,   setScore]   = useState<ScoreResp | null>(null);
  const [gaps,    setGaps]    = useState<GapsResp | null>(null);
  const [tab,     setTab]     = useState<"genome"|"gaps"|"pulse">("genome");
  const [selected, setSelected] = useState<Dimension | null>(null);
  const [pulsing, setPulsing] = useState(false);
  const [toast,   setToast]   = useState("");

  useEffect(() => {
    fetch("/api/platform-dna/genome", { credentials: "include" }).then(r => r.json()).then((d: GenomeResp) => setGenome(d)).catch(() => {});
    fetch("/api/platform-dna/score",  { credentials: "include" }).then(r => r.json()).then((d: ScoreResp) => setScore(d)).catch(() => {});
    fetch("/api/platform-dna/gaps",   { credentials: "include" }).then(r => r.json()).then((d: GapsResp) => setGaps(d)).catch(() => {});
  }, []);

  const pulse = async () => {
    setPulsing(true);
    const r = await fetch("/api/platform-dna/pulse", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
    const d = await r.json() as { ok: boolean; pulse?: { score: number } };
    setPulsing(false);
    setToast(d.ok ? `Heartbeat recorded — score: ${d.pulse?.score ?? "—"}` : "Failed");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div style={S.root} role="main">
      <a href="#content" style={{ position: "absolute", left: -999, top: 0 }}>Skip to main</a>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div><div style={S.h1}>🧬 Platform DNA</div><div style={S.sub}>Capability genome — {genome?.dimensions.length ?? 0} dimensions tracked</div></div>
        <button style={S.btn} onClick={pulse} disabled={pulsing}>{pulsing ? "Recording…" : "Record Heartbeat"}</button>
      </div>

      {toast && <div style={{ background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", borderRadius: "8px", padding: ".65rem 1rem", marginBottom: "1rem", fontSize: ".8rem", color: "#a5b4fc" }} aria-live="polite">{toast}</div>}

      {/* Hero score */}
      {score && (
        <div style={S.hero}>
          <div style={S.hScore}>{score.overallScore}</div>
          <div style={S.hLabel}>Overall Platform Maturity Score / 100</div>
          <div style={S.badge}>{score.maturityLevel} Platform</div>
        </div>
      )}

      {score && (
        <div style={S.grid}>
          <div style={S.stat}><div style={S.sn}>{score.dimensions}</div><div style={S.sl}>Dimensions</div></div>
          <div style={S.stat}><div style={{ ...S.sn, color: "#22c55e" }}>{score.at100Pct}</div><div style={S.sl}>At 100%</div></div>
          <div style={S.stat}><div style={{ ...S.sn, color: "#eab308" }}>{score.below90Pct}</div><div style={S.sl}>Below 90%</div></div>
          <div style={S.stat}><div style={S.sn}>{gaps?.totalGaps ?? "—"}</div><div style={S.sl}>Capability Gaps</div></div>
        </div>
      )}

      <div style={S.tabs}>
        {(["genome","gaps"] as const).map(t => (
          <button key={t} style={tab === t ? S.tabA : S.tab} onClick={() => setTab(t)}>{t === "genome" ? "Capability Genome" : `Gaps (${gaps?.totalGaps ?? "…"})`}</button>
        ))}
      </div>

      <div id="content">
        {/* Genome */}
        {tab === "genome" && genome && (
          <div style={S.card}>
            <div style={S.h2}>Capability Dimensions</div>
            {genome.dimensions.map(d => (
              <div key={d.id}>
                <div style={S.bar} onClick={() => setSelected(selected?.id === d.id ? null : d)}>
                  <div style={S.barLabel}>{d.name}</div>
                  <div style={S.barTrack}><div style={{ ...S.barFill, width: `${d.score}%`, background: getBarColor(d.score) }} /></div>
                  <div style={{ ...S.barNum, color: getBarColor(d.score) }}>{d.score}</div>
                </div>
                {selected?.id === d.id && (
                  <div style={S.detail}>
                    <div style={{ fontSize: ".8rem", fontWeight: 600, color: "#a5b4fc", marginBottom: ".5rem" }}>Evidence ({d.evidence.length})</div>
                    {d.evidence.map((e, i) => <div key={i} style={S.evRow}><span style={{ color: "#22c55e" }}>✓</span>{e}</div>)}
                    {d.gaps.length > 0 && (
                      <>
                        <div style={{ fontSize: ".8rem", fontWeight: 600, color: "#a5b4fc", margin: ".75rem 0 .5rem" }}>Remaining Gaps ({d.gaps.length})</div>
                        {d.gaps.map((g, i) => <div key={i} style={{ ...S.evRow, color: "#f59e0b" }}><span>△</span>{g}</div>)}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Gaps */}
        {tab === "gaps" && gaps && (
          <div style={S.card}>
            <div style={S.h2}>Capability Gaps — {gaps.totalGaps} total</div>
            {(gaps.gaps ?? []).map((g, i) => (
              <div key={i} style={S.gap}>
                <div style={S.gapDim}>{g.dimension}</div>
                <div style={{ color: g.priority === "high" ? "#f59e0b" : "#94a3b8" }}>
                  {g.priority === "high" ? "⚡ " : "○ "}{g.gap}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
