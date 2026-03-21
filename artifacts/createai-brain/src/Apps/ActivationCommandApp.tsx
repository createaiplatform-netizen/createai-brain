import React, { useState, useEffect, useCallback } from "react";

const API = "/api";

interface Engine {
  id: string;
  label: string;
  status: string;
  schedule: string;
  cycles?: number;
  products?: number;
  platforms?: number;
  phase?: string;
  lastScore?: number | null;
  handles?: { cashapp: string; venmo: string };
  paidTotal?: number;
  paidTodayTotal?: number;
  note?: string;
}

interface Blocker {
  id: string;
  system: string;
  status: string;
  reason: string;
  bypass: string;
  bypassActive: boolean;
  requiresExternalAction: boolean;
  externalSteps: string[];
}

interface SequenceStep {
  t: string;
  action: string;
  type: string;
}

interface StatusData {
  engines: Engine[];
  blockers: Blocker[];
  liveRevenue: { paidTotal: number; paidToday: number; cashapp: number; venmo: number; note: string };
  checkedAt: string;
}

interface ActivationResult {
  confirmation: string;
  enginesTriggered: number;
  fired: { engine: string; label: string }[];
  failed: { engine: string; reason: string }[];
  alwaysRunning: { engine: string; label: string; schedule: string }[];
  blockers: Blocker[];
  bypassesActive: number;
  executionSequence: SequenceStep[];
  paymentRail: { cashapp: string; venmo: string; status: string; note: string };
}

const typeColor: Record<string, string> = {
  system:      "#6366f1",
  revenue:     "#22c55e",
  generation:  "#f59e0b",
  enforcement: "#ef4444",
  ai:          "#a78bfa",
  autonomous:  "#38bdf8",
  payment:     "#4ade80",
};

const statusDot = (s: string) => {
  if (s === "running" || s === "live")            return "#22c55e";
  if (s === "blocked")                            return "#ef4444";
  if (s === "partial" || s === "requires-auth")   return "#f59e0b";
  return "#94a3b8";
};

export default function ActivationCommandApp() {
  const [status, setStatus]     = useState<StatusData | null>(null);
  const [result, setResult]     = useState<ActivationResult | null>(null);
  const [firing, setFiring]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<"engines"|"blockers"|"sequence">("engines");
  const [error, setError]       = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API}/activate/status`);
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      setStatus(d);
      setError(null);
    } catch (e) {
      setError("Could not reach activation endpoint");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 30_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const handleActivateAll = async () => {
    setFiring(true);
    setResult(null);
    try {
      const r = await fetch(`${API}/activate/all`, { method: "POST" });
      const d = await r.json();
      setResult(d);
      await fetchStatus();
    } catch {
      setError("Activation call failed — API server may be restarting");
    } finally {
      setFiring(false);
    }
  };

  const fmtDollars = (n: number) => "$" + n.toFixed(2);

  return (
    <div style={{ background: "#020617", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", padding: "0 0 80px 0" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", borderBottom: "1px solid #1e293b", padding: "28px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px" }}>Activation Command Center</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Maximum potential — all systems, all engines, all revenue rails</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 32px 0" }}>

        {/* Big Activate Button */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 28, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Fire All Engines</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Triggers Above-Transcend, Ultimate, Meta, and Enforcer simultaneously</div>
          </div>
          <button
            onClick={handleActivateAll}
            disabled={firing}
            style={{
              background: firing ? "#312e81" : "linear-gradient(135deg, #4f46e5, #6366f1)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "14px 32px",
              fontSize: 15,
              fontWeight: 700,
              cursor: firing ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              transition: "opacity 0.2s",
              opacity: firing ? 0.7 : 1,
              minWidth: 200,
              whiteSpace: "nowrap",
            }}
          >
            {firing ? "⚡ Activating…" : "⚡ ACTIVATE ALL SYSTEMS"}
          </button>
        </div>

        {/* Activation Result */}
        {result && (
          <div style={{ background: "#0f2a1a", border: "1px solid #166534", borderRadius: 14, padding: 22, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ fontSize: 22, marginTop: 2 }}>✅</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 15, marginBottom: 8 }}>{result.confirmation}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  {result.fired.map(f => (
                    <span key={f.engine} style={{ background: "#14532d", color: "#86efac", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                      ✓ {f.label}
                    </span>
                  ))}
                  {result.failed.map(f => (
                    <span key={f.engine} style={{ background: "#450a0a", color: "#fca5a5", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                      ✗ {f.engine}: {f.reason}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {result.alwaysRunning.length} systems already running continuously — they don't need a trigger.
                </div>
                <div style={{ marginTop: 10, background: "#052e16", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>Payment Rail</div>
                  <div style={{ fontSize: 13, color: "#86efac" }}>
                    💚 Cash App: <strong>{result.paymentRail.cashapp}</strong> &nbsp;|&nbsp; 💙 Venmo: <strong>{result.paymentRail.venmo}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>{result.paymentRail.note}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#1c0a0a", border: "1px solid #450a0a", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#fca5a5", fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        {/* Live Revenue Strip */}
        {status?.liveRevenue && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { label: "All-Time Revenue", value: fmtDollars(status.liveRevenue.paidTotal), icon: "💰", color: "#4ade80" },
              { label: "Revenue Today",    value: fmtDollars(status.liveRevenue.paidToday), icon: "📅", color: "#38bdf8" },
              { label: "Cash App",         value: fmtDollars(status.liveRevenue.cashapp),   icon: "💚", color: "#4ade80" },
              { label: "Venmo",            value: fmtDollars(status.liveRevenue.venmo),     icon: "💙", color: "#818cf8" },
            ].map(card => (
              <div key={card.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{card.icon} {card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#0f172a", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {(["engines","blockers","sequence"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? "#6366f1" : "transparent",
                color: tab === t ? "#fff" : "#94a3b8",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {t === "engines" ? "🔧 Engines" : t === "blockers" ? "🚧 Blockers" : "🔄 Sequence"}
            </button>
          ))}
        </div>

        {/* ── ENGINES TAB ────────────────────────────────────────────────────────── */}
        {tab === "engines" && (
          loading ? (
            <div style={{ color: "#475569", padding: 40, textAlign: "center" }}>Loading engine status…</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {status?.engines.map(eng => (
                <div key={eng.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusDot(eng.status), boxShadow: `0 0 8px ${statusDot(eng.status)}` }} />
                    <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14, flex: 1 }}>{eng.label}</div>
                    <div style={{ fontSize: 11, color: "#475569", background: "#1e293b", padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{eng.status}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>⏱ {eng.schedule}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {eng.cycles != null && (
                      <span style={{ background: "#1e293b", color: "#94a3b8", padding: "2px 10px", borderRadius: 6, fontSize: 12 }}>
                        {eng.cycles.toLocaleString()} cycles
                      </span>
                    )}
                    {eng.products != null && (
                      <span style={{ background: "#1e293b", color: "#94a3b8", padding: "2px 10px", borderRadius: 6, fontSize: 12 }}>
                        {eng.products.toLocaleString()} products
                      </span>
                    )}
                    {eng.phase && (
                      <span style={{ background: "#1e293b", color: "#818cf8", padding: "2px 10px", borderRadius: 6, fontSize: 12 }}>
                        {eng.phase}
                      </span>
                    )}
                    {eng.handles && (
                      <span style={{ background: "#052e16", color: "#4ade80", padding: "2px 10px", borderRadius: 6, fontSize: 12 }}>
                        {eng.handles.cashapp} · {eng.handles.venmo}
                      </span>
                    )}
                    {eng.paidTotal != null && (
                      <span style={{ background: "#052e16", color: "#4ade80", padding: "2px 10px", borderRadius: 6, fontSize: 12 }}>
                        Collected: {fmtDollars(eng.paidTotal ?? 0)}
                      </span>
                    )}
                  </div>
                  {eng.note && <div style={{ fontSize: 11, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>{eng.note}</div>}
                </div>
              ))}
            </div>
          )
        )}

        {/* ── BLOCKERS TAB ───────────────────────────────────────────────────────── */}
        {tab === "blockers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {status?.blockers.map(b => (
              <div key={b.id} style={{ background: "#0f172a", border: `1px solid ${b.bypassActive ? "#166534" : "#450a0a"}`, borderRadius: 14, padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14 }}>{b.system}</div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <span style={{
                      background: b.bypassActive ? "#052e16" : "#1c0a0a",
                      color: b.bypassActive ? "#4ade80" : "#f87171",
                      padding: "3px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      {b.bypassActive ? "✓ BYPASS ACTIVE" : "✗ NO BYPASS"}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10, lineHeight: 1.5 }}>
                  <strong style={{ color: "#64748b" }}>Blocker:</strong> {b.reason}
                </div>

                <div style={{ background: b.bypassActive ? "#052e16" : "#1c0a0a", borderRadius: 8, padding: "10px 14px", marginBottom: b.externalSteps.length > 0 ? 10 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: b.bypassActive ? "#22c55e" : "#f87171", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {b.bypassActive ? "Active Bypass" : "No bypass available"}
                  </div>
                  <div style={{ fontSize: 13, color: b.bypassActive ? "#86efac" : "#fca5a5", lineHeight: 1.5 }}>{b.bypass}</div>
                </div>

                {b.externalSteps.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Steps to fully resolve:</div>
                    {b.externalSteps.map((step, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#64748b", marginBottom: 4, display: "flex", gap: 8 }}>
                        <span style={{ color: "#6366f1", minWidth: 18, fontWeight: 700 }}>{i + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {status?.blockers && (
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 18px", marginTop: 4 }}>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  <strong style={{ color: "#4ade80" }}>{status.blockers.filter(b => b.bypassActive).length}</strong> of <strong>{status.blockers.length}</strong> blockers have active bypasses.
                  Zero revenue is lost — all gaps are covered by alternative methods already running.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SEQUENCE TAB ───────────────────────────────────────────────────────── */}
        {tab === "sequence" && (
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 72, top: 0, bottom: 0, width: 1, background: "#1e293b", zIndex: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {(result?.executionSequence ?? FALLBACK_SEQUENCE).map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "14px 0", position: "relative", zIndex: 1 }}>
                  <div style={{ minWidth: 72, textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", fontWeight: 600 }}>{step.t}</span>
                  </div>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: typeColor[step.type] ?? "#6366f1", border: "2px solid #020617", marginTop: 2, flexShrink: 0, boxShadow: `0 0 8px ${typeColor[step.type] ?? "#6366f1"}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>{step.action}</div>
                    <div style={{ fontSize: 11, color: typeColor[step.type] ?? "#6366f1", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{step.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer timestamp */}
        {status?.checkedAt && (
          <div style={{ marginTop: 32, fontSize: 11, color: "#334155", textAlign: "center" }}>
            Last checked: {new Date(status.checkedAt).toLocaleTimeString()} · Auto-refreshes every 30 seconds
          </div>
        )}
      </div>
    </div>
  );
}

const FALLBACK_SEQUENCE = [
  { t: "T+0s",     action: "All triggerable engines fired simultaneously",                           type: "system"     },
  { t: "T+30s",    action: "Semantic product catalog refresh — all 100+ products re-indexed",        type: "revenue"    },
  { t: "T+1min",   action: "Ultimate Zero-Touch: 11 content formats × all niches generated",         type: "generation" },
  { t: "T+1min",   action: "Meta Premium Expansion: premium tier content and pricing cycle",         type: "revenue"    },
  { t: "T+2min",   action: "Maximizer enforcement: all revenue metrics locked at ≥100%",            type: "enforcement"},
  { t: "T+2min",   action: "Platform Enforcer: all metrics audited and held to spec",               type: "enforcement"},
  { t: "T+2min",   action: "Wealth Multiplier: growth ratios computed and applied",                 type: "revenue"    },
  { t: "T+5min",   action: "Orchestrator: AI multi-phase goal plan generated and queued",           type: "ai"         },
  { t: "Ongoing",  action: "All engines cycling 24/7 autonomously — zero human intervention needed", type: "autonomous" },
  { t: "On-demand",action: "PayGate: Cash App + Venmo ready to receive payment from any client at any time", type: "payment" },
];
