/**
 * LiveSimDashboard.tsx — Live Integration Simulation Dashboard
 * Public page (no login required). Fully responsive — 320px → 1440px+.
 * No PHI · No credentials · No proprietary source code · View-only demo
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SimEvent {
  id: string;
  adapterId: string;
  adapterLabel: string;
  industry: string;
  type: string;
  dir: "IN" | "OUT";
  status: "success" | "error";
  label: string;
  summary: string;
  latencyMs: number;
  ts: string;
  payload?: unknown;
}
interface AdapterMeta {
  id: string; label: string; icon: string;
  authType: string; complianceFlags: string[]; industry: string;
}
interface IndustryGroup {
  label: string; icon: string; complianceNote: string; adapters: AdapterMeta[];
}

// ─── Colour maps ─────────────────────────────────────────────────────────────
const IND: Record<string, string> = {
  healthcare:"#10b981", payments:"#8b5cf6", crm:"#3b82f6",
  communication:"#f97316", cloud:"#0ea5e9", ecommerce:"#f59e0b",
  productivity:"#6366f1", data:"#06b6d4", "web3-iot":"#a855f7",
};
const TYPE: Record<string, string> = {
  FHIR:"#10b981", HL7:"#06b6d4", WEBHOOK:"#f97316",
  REST:"#6366f1", AUTH:"#8b5cf6", MQTT:"#f59e0b",
};

function fmt(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US",
    { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" });
}
function ago(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 5)   return "just now";
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiveSimDashboard() {
  const [events, setEvents]             = useState<SimEvent[]>([]);
  const [selected, setSelected]         = useState<SimEvent | null>(null);
  const [simulating, setSimulating]     = useState<Set<string>>(new Set());
  const [lastSim, setLastSim]           = useState<Map<string, SimEvent>>(new Map());
  const [industries, setIndustries]     = useState<Record<string, IndustryGroup>>({});
  const [suiteRunning, setSuiteRunning] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [totalFired, setTotalFired]     = useState(0);
  const [, setTick]                     = useState(0);

  const logRef = useRef<HTMLDivElement>(null);
  const esRef  = useRef<EventSource | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/public/integration-demo")
      .then(r => r.json())
      .then(d => { if (d.adapters?.byIndustry) setIndustries(d.adapters.byIndustry); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function connect() {
      const es = new EventSource("/api/public/events/stream");
      esRef.current = es;
      es.onopen  = () => setSseConnected(true);
      es.onerror = () => { setSseConnected(false); es.close(); setTimeout(connect, 3000); };
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "init") {
            setEvents(msg.events ?? []);
          } else if (msg.type === "event") {
            const ev: SimEvent = msg.event;
            setEvents(prev => [ev, ...prev].slice(0, 120));
            setLastSim(prev => new Map(prev).set(ev.adapterId, ev));
            setTotalFired(n => n + 1);
          }
        } catch {}
      };
    }
    connect();
    return () => { esRef.current?.close(); };
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top:0, behavior:"smooth" });
  }, [events.length]);

  const simulate = useCallback(async (adapterId: string) => {
    if (simulating.has(adapterId)) return;
    setSimulating(prev => new Set(prev).add(adapterId));
    try {
      const res  = await fetch(`/api/public/simulate/adapter/${adapterId}`, { method:"POST" });
      const data = await res.json();
      if (data.ok && data.event) setSelected(data.event);
    } catch {}
    finally {
      setTimeout(() => {
        setSimulating(prev => { const n = new Set(prev); n.delete(adapterId); return n; });
      }, 1000);
    }
  }, [simulating]);

  const runFullSuite = useCallback(async () => {
    if (suiteRunning) return;
    setSuiteRunning(true);
    const ids = Object.values(industries).flatMap(g => g.adapters.map(a => a.id));
    for (const id of ids) {
      await simulate(id);
      await new Promise(r => setTimeout(r, 220));
    }
    setSuiteRunning(false);
  }, [industries, simulate, suiteRunning]);

  const allAdapters = Object.values(industries).flatMap(g => g.adapters);

  return (
    <div className="sim-root">

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="sim-banner">
        <div className="sim-banner-left">
          <span className="sim-brand">CREATEAI BRAIN · LIVE INTEGRATION SIMULATION</span>
          <span className="sim-badge-live">LIVE DEMO</span>
          <span className="sim-sse" style={{ color: sseConnected ? "#10b981" : "#f59e0b" }}>
            <span className="sim-dot" style={{
              background: sseConnected ? "#10b981" : "#f59e0b",
              boxShadow: `0 0 5px ${sseConnected ? "#10b981" : "#f59e0b"}`,
              animation: sseConnected ? "simdot 2s infinite" : "none",
            }} />
            {sseConnected ? "Stream live" : "Connecting…"}
          </span>
        </div>
        <span className="sim-banner-right">
          No PHI · No credentials · No source code · Authorized reviewer use only
        </span>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sim-header">
        <div className="sim-title-row">
          <div className="sim-logo">🧠</div>
          <div className="sim-title-text">
            <div className="sim-title">Live Integration Simulation Dashboard</div>
            <div className="sim-subtitle">26 adapters · 9 industries · Real adapter code path · PHI-safe</div>
          </div>
          <button
            onClick={runFullSuite}
            disabled={suiteRunning || Object.keys(industries).length === 0}
            className="sim-suite-btn"
            style={{
              background: suiteRunning
                ? "rgba(99,102,241,0.3)"
                : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              cursor: suiteRunning ? "not-allowed" : "pointer",
            }}
          >
            {suiteRunning
              ? <><span className="sim-spin">⟳</span> Running…</>
              : <>▶ Run All</>}
          </button>
        </div>

        {/* Metrics */}
        <div className="sim-metrics">
          {[
            { label:"Adapters",    value:allAdapters.length,                  color:"#6366f1" },
            { label:"Industries",  value:Object.keys(industries).length,      color:"#10b981" },
            { label:"Fired",       value:totalFired + events.length,          color:"#f97316" },
            { label:"In Log",      value:events.length,                       color:"#06b6d4" },
            { label:"Simulated",   value:lastSim.size,                        color:"#8b5cf6" },
            { label:"SSE",         value:sseConnected ? "●" : "○",           color:sseConnected?"#10b981":"#f59e0b" },
          ].map(m => (
            <div key={m.label} className="sim-metric-card">
              <div className="sim-metric-val" style={{ color:m.color }}>{m.value}</div>
              <div className="sim-metric-lbl">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main layout: adapters left, log right ──────────────────────────── */}
      <div className="sim-main">

        {/* LEFT — Adapter grid */}
        <div className="sim-adapters">
          {Object.entries(industries).map(([indId, group]) => {
            const color = IND[indId] ?? "#6366f1";
            return (
              <div key={indId} className="sim-industry-block">
                {/* Industry header */}
                <div className="sim-industry-hdr" style={{
                  background:`linear-gradient(90deg,${color}18,transparent)`,
                }}>
                  <span className="sim-industry-icon">{group.icon}</span>
                  <div className="sim-industry-info">
                    <span className="sim-industry-name" style={{ color }}>{group.label}</span>
                    <span className="sim-industry-note">{group.complianceNote}</span>
                  </div>
                  <span className="sim-industry-count">
                    {group.adapters.length} adapter{group.adapters.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Adapter cards */}
                <div className="sim-adapter-grid">
                  {group.adapters.map(adapter => {
                    const simmed    = lastSim.has(adapter.id);
                    const isLoading = simulating.has(adapter.id);
                    const last      = lastSim.get(adapter.id);
                    const isSel     = selected?.adapterId === adapter.id;

                    return (
                      <div
                        key={adapter.id}
                        className="sim-adapter-card"
                        onClick={() => last && setSelected(last)}
                        style={{
                          background: isSel ? `${color}14` : "rgba(10,10,15,0.85)",
                          borderLeft: `3px solid ${isSel ? color : "transparent"}`,
                        }}
                      >
                        <div className="sim-card-top">
                          <div className="sim-card-info">
                            <span
                              className="sim-card-icon"
                              style={{ filter: simmed ? `drop-shadow(0 0 4px ${color})` : "none" }}
                            >{adapter.icon}</span>
                            <div className="sim-card-meta">
                              <div className="sim-card-name">{adapter.label}</div>
                              <div className="sim-card-badges">
                                <SimBadge simmed={simmed} color={color} />
                                <span className="sim-auth-badge">{adapter.authType}</span>
                                {adapter.complianceFlags.slice(0, 2).map(f => (
                                  <span key={f} className="sim-flag" style={{
                                    background:`${color}22`, color,
                                  }}>{f}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            className="sim-sim-btn"
                            onClick={e => { e.stopPropagation(); simulate(adapter.id); }}
                            disabled={isLoading}
                            style={{
                              background: isLoading ? "rgba(255,255,255,0.08)" : `${color}22`,
                              border:`1px solid ${color}55`,
                              color: isLoading ? "#64748b" : color,
                              cursor: isLoading ? "not-allowed" : "pointer",
                            }}
                          >{isLoading ? "⟳" : "▶ SIM"}</button>
                        </div>

                        {last && (
                          <div className="sim-last-activity">
                            <span style={{ color:"#10b981" }}>✓</span>
                            <span className="sim-last-label">{last.label}</span>
                            <span className="sim-last-meta">{ago(last.ts)} · {last.latencyMs}ms</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT — Event log + payload viewer */}
        <div className="sim-sidebar">

          {/* Event log */}
          <div className="sim-panel">
            <div className="sim-panel-hdr">
              <span className="sim-panel-title">
                Real-Time Event Log
                <span className="sim-count-badge">{events.length}</span>
              </span>
              <span className="sim-panel-sub">SSE stream</span>
            </div>
            <div ref={logRef} className="sim-log-scroll">
              {events.length === 0 ? (
                <div className="sim-empty">
                  Click ▶ SIM on any adapter or tap Run All to start
                </div>
              ) : events.map((ev, i) => (
                <div
                  key={ev.id + i}
                  onClick={() => setSelected(ev)}
                  className="sim-log-row"
                  style={{
                    background: selected?.id === ev.id ? "rgba(99,102,241,0.12)" : "transparent",
                    animation: i === 0 ? "simfade 0.3s ease" : "none",
                  }}
                >
                  <div className="sim-log-meta">
                    <span className="sim-log-time">{fmt(ev.ts)}</span>
                    <span className="sim-type-badge" style={{
                      background:`${TYPE[ev.type]??"#6366f1"}22`,
                      color:TYPE[ev.type]??"#6366f1",
                    }}>{ev.type}</span>
                    <span className="sim-dir" style={{
                      color:ev.dir==="IN"?"#10b981":"#f97316",
                    }}>{ev.dir==="IN"?"↓IN":"↑OUT"}</span>
                    <span className="sim-ind-badge" style={{
                      background:IND[ev.industry]?`${IND[ev.industry]}22`:"rgba(255,255,255,0.06)",
                      color:IND[ev.industry]??"#64748b",
                    }}>{ev.industry}</span>
                  </div>
                  <div className="sim-log-label">{ev.label}</div>
                  <div className="sim-log-summary">{ev.summary} · {ev.latencyMs}ms</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payload viewer */}
          {selected ? (
            <div className="sim-panel sim-payload-panel">
              <div className="sim-panel-hdr">
                <span className="sim-panel-title">
                  Payload Viewer
                  <span className="sim-adapter-tag">{selected.adapterLabel}</span>
                </span>
                <button className="sim-close-btn" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="sim-payload-meta">
                {[
                  { k:"type",    v:selected.type },
                  { k:"dir",     v:selected.dir },
                  { k:"status",  v:selected.status },
                  { k:"latency", v:`${selected.latencyMs}ms` },
                ].map(b => (
                  <span key={b.k} className="sim-meta-pill">
                    <span className="sim-meta-key">{b.k}:</span> {b.v}
                  </span>
                ))}
              </div>
              <div className="sim-payload-scroll">
                <pre className="sim-payload-pre">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>
              <div className="sim-payload-footer">
                ⚠ SIMULATED — No real PHI, credentials, or external systems
              </div>
            </div>
          ) : (
            <div className="sim-panel sim-payload-empty">
              Tap any event or adapter card to inspect the JSON payload
            </div>
          )}

          {/* Legend */}
          <div className="sim-panel sim-legend">
            <div className="sim-legend-title">STATUS</div>
            <div className="sim-legend-row">
              <span className="sim-dot" style={{ background:"#10b981" }} />
              <strong>Listening</strong>
              <span className="sim-legend-desc">Adapter wired · ready to receive</span>
            </div>
            <div className="sim-legend-row">
              <span className="sim-dot" style={{ background:"#6366f1", animation:"simdot 1.5s infinite" }} />
              <strong>Simulated</strong>
              <span className="sim-legend-desc">Event fired through real code path</span>
            </div>
          </div>

          <div className="sim-disclaimer">
            This dashboard demonstrates integration architecture only.
            No real PHI, credentials, API keys, or external systems are involved.
            All events are simulated through the live adapter validation code.
          </div>
        </div>
      </div>

      {/* ── Global styles ──────────────────────────────────────────────────── */}
      <style>{`
        /* ── Reset & Root ───────────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; }
        .sim-root {
          min-height: 100vh;
          background: #0a0a0f;
          color: #e2e8f0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 14px;
          overflow-x: hidden;
          width: 100%;
        }

        /* ── Banner ─────────────────────────────────────────────────────── */
        .sim-banner {
          background: rgba(99,102,241,0.12);
          border-bottom: 1px solid rgba(99,102,241,0.25);
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 12px;
        }
        .sim-banner-left {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sim-brand {
          font-weight: 700;
          letter-spacing: 0.07em;
          color: #a5b4fc;
          font-size: 11px;
        }
        .sim-badge-live {
          background: #10b981;
          color: #fff;
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }
        .sim-sse {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          white-space: nowrap;
        }
        .sim-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }
        .sim-banner-right {
          color: #64748b;
          font-size: 10px;
          white-space: nowrap;
        }

        /* ── Header ─────────────────────────────────────────────────────── */
        .sim-header {
          padding: 20px 16px 0;
        }
        .sim-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .sim-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
        }
        .sim-title-text { flex: 1; min-width: 0; }
        .sim-title {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.3;
        }
        .sim-subtitle {
          color: #64748b;
          font-size: 12px;
          margin-top: 2px;
        }
        .sim-suite-btn {
          border: none;
          border-radius: 8px;
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Metrics ────────────────────────────────────────────────────── */
        .sim-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .sim-metric-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 12px;
          text-align: center;
        }
        .sim-metric-val {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
        }
        .sim-metric-lbl {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        /* ── Main two-column layout ──────────────────────────────────────── */
        .sim-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 0 16px 32px;
        }

        /* ── Industry blocks ─────────────────────────────────────────────── */
        .sim-adapters {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }
        .sim-industry-block {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
        }
        .sim-industry-hdr {
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sim-industry-icon { font-size: 18px; flex-shrink: 0; }
        .sim-industry-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .sim-industry-name { font-weight: 700; font-size: 13px; }
        .sim-industry-note { font-size: 11px; color: #64748b; }
        .sim-industry-count { font-size: 11px; color: #475569; white-space: nowrap; }

        /* Adapter cards grid — 1 col on mobile, 2 on tablet, 3 on desktop */
        .sim-adapter-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: rgba(255,255,255,0.04);
        }
        .sim-adapter-card {
          padding: 14px 14px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .sim-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .sim-card-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .sim-card-icon {
          font-size: 22px;
          flex-shrink: 0;
          transition: filter 0.5s;
        }
        .sim-card-meta { min-width: 0; }
        .sim-card-name {
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sim-card-badges {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .sim-auth-badge {
          font-size: 10px;
          color: #64748b;
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
          padding: 1px 5px;
        }
        .sim-flag {
          font-size: 10px;
          border-radius: 4px;
          padding: 1px 5px;
        }
        .sim-sim-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          transition: all 0.15s;
          letter-spacing: 0.04em;
          white-space: nowrap;
          min-width: 56px;
          text-align: center;
        }
        .sim-last-activity {
          margin-top: 8px;
          font-size: 11px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }
        .sim-last-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }
        .sim-last-meta {
          color: #475569;
          flex-shrink: 0;
          font-size: 10px;
        }

        /* ── Sidebar ─────────────────────────────────────────────────────── */
        .sim-sidebar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }

        /* ── Panels ──────────────────────────────────────────────────────── */
        .sim-panel {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
        }
        .sim-panel-hdr {
          padding: 11px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .sim-panel-title {
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }
        .sim-panel-sub { font-size: 11px; color: #64748b; white-space: nowrap; }
        .sim-count-badge {
          background: rgba(99,102,241,0.2);
          color: #a5b4fc;
          border-radius: 10px;
          padding: 1px 8px;
          font-size: 11px;
        }
        .sim-adapter-tag {
          font-size: 11px;
          color: #64748b;
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
          padding: 1px 7px;
          font-weight: 400;
        }
        .sim-close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 15px;
          line-height: 1;
          padding: 2px 4px;
          flex-shrink: 0;
        }

        /* ── Event log ───────────────────────────────────────────────────── */
        .sim-log-scroll {
          max-height: 320px;
          overflow-y: auto;
          scrollbar-width: thin;
        }
        .sim-empty {
          padding: 28px 16px;
          text-align: center;
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
        }
        .sim-log-row {
          padding: 9px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: background 0.1s;
        }
        .sim-log-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 3px;
          flex-wrap: wrap;
        }
        .sim-log-time {
          font-size: 10px;
          color: #475569;
          font-variant-numeric: tabular-nums;
          font-family: monospace;
          flex-shrink: 0;
        }
        .sim-type-badge {
          font-size: 10px;
          font-weight: 700;
          border-radius: 4px;
          padding: 1px 6px;
          flex-shrink: 0;
        }
        .sim-dir {
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .sim-ind-badge {
          font-size: 10px;
          border-radius: 4px;
          padding: 1px 5px;
          flex-shrink: 0;
        }
        .sim-log-label {
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sim-log-summary {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Payload viewer ──────────────────────────────────────────────── */
        .sim-payload-panel {
          display: flex;
          flex-direction: column;
          max-height: 400px;
        }
        .sim-payload-meta {
          padding: 6px 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .sim-meta-pill {
          font-size: 10px;
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
          padding: 2px 7px;
          color: #94a3b8;
        }
        .sim-meta-key { color: #64748b; }
        .sim-payload-scroll {
          overflow-y: auto;
          flex: 1;
          scrollbar-width: thin;
        }
        .sim-payload-pre {
          margin: 0;
          padding: 10px 14px 14px;
          font-size: 10.5px;
          line-height: 1.6;
          color: #a5b4fc;
          font-family: 'JetBrains Mono','Fira Code',monospace;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .sim-payload-footer {
          padding: 8px 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 10px;
          color: #475569;
          flex-shrink: 0;
        }
        .sim-payload-empty {
          padding: 24px 16px;
          text-align: center;
          color: #475569;
          font-size: 13px;
          border-style: dashed;
        }

        /* ── Legend ──────────────────────────────────────────────────────── */
        .sim-legend { padding: 12px 14px; }
        .sim-legend-title {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .sim-legend-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          margin-bottom: 5px;
          flex-wrap: wrap;
        }
        .sim-legend-desc { color: #475569; }

        /* ── Disclaimer ──────────────────────────────────────────────────── */
        .sim-disclaimer {
          font-size: 10px;
          color: #334155;
          line-height: 1.6;
          padding: 0 2px;
        }

        /* ── Adapter status badge ─────────────────────────────────────────── */
        .sim-status-pill {
          font-size: 10px;
          font-weight: 700;
          border-radius: 4px;
          padding: 1px 6px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .sim-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          display: inline-block;
        }

        /* ── Animations ──────────────────────────────────────────────────── */
        @keyframes simdot {
          0%,100% { opacity:1; }
          50%      { opacity:0.3; }
        }
        @keyframes simfade {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes simspin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        .sim-spin { display:inline-block; animation:simspin 1s linear infinite; }

        /* ── Scrollbars ──────────────────────────────────────────────────── */
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }

        /* ════ RESPONSIVE BREAKPOINTS ════════════════════════════════════════ */

        /* Tablet: 640px+ — adapter grid 2 columns */
        @media (min-width: 640px) {
          .sim-header { padding: 22px 24px 0; }
          .sim-main   { padding: 0 24px 32px; }
          .sim-banner { padding: 10px 24px; }
          .sim-title  { font-size: 20px; }
          .sim-metrics {
            grid-template-columns: repeat(6, 1fr);
          }
          .sim-adapter-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .sim-log-scroll { max-height: 360px; }
        }

        /* Desktop: 1024px+ — side-by-side main layout */
        @media (min-width: 1024px) {
          .sim-main {
            display: grid;
            grid-template-columns: 1fr 380px;
            align-items: start;
            gap: 16px;
          }
          .sim-sidebar {
            position: sticky;
            top: 16px;
          }
          .sim-title { font-size: 22px; }
          .sim-adapter-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
          .sim-log-scroll { max-height: 360px; }
          .sim-payload-panel { max-height: 420px; }
        }

        /* Large desktop: 1440px+ */
        @media (min-width: 1440px) {
          .sim-adapter-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          }
        }

        /* Small mobile: max 375px — tighter padding */
        @media (max-width: 375px) {
          .sim-header { padding: 14px 12px 0; }
          .sim-main   { padding: 0 12px 24px; gap: 12px; }
          .sim-banner { padding: 8px 12px; }
          .sim-banner-right { display: none; }
          .sim-brand  { font-size: 10px; }
          .sim-title  { font-size: 16px; }
          .sim-suite-btn { padding: 8px 14px; font-size: 12px; }
          .sim-metrics { gap: 6px; }
          .sim-metric-card { padding: 8px 6px; }
          .sim-metric-val { font-size: 17px; }
        }
      `}</style>
    </div>
  );
}

// ─── Status badge sub-component ───────────────────────────────────────────────
function SimBadge({ simmed, color }: { simmed: boolean; color: string }) {
  if (simmed) {
    return (
      <span className="sim-status-pill" style={{
        background:`${color}22`, color,
      }}>
        <span className="sim-status-dot" style={{
          background:color, animation:"simdot 1.5s infinite",
        }}/>
        SIMULATED
      </span>
    );
  }
  return (
    <span className="sim-status-pill" style={{
      background:"rgba(16,185,129,0.15)", color:"#10b981",
    }}>
      <span className="sim-status-dot" style={{ background:"#10b981" }}/>
      LISTENING
    </span>
  );
}
