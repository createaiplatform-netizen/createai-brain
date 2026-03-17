/**
 * LiveSimDashboard.tsx — Live Integration Simulation Dashboard
 *
 * Public page (no login required). Demonstrates real-time data flow through
 * every adapter in the platform registry.
 *
 * No PHI · No credentials · No proprietary source code · View-only demo
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
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
  id: string;
  label: string;
  icon: string;
  authType: string;
  complianceFlags: string[];
  industry: string;
}

interface IndustryGroup {
  label: string;
  icon: string;
  complianceNote: string;
  adapters: AdapterMeta[];
}

// ─── Industry colour map ────────────────────────────────────────────────────
const INDUSTRY_COLORS: Record<string, string> = {
  healthcare:   "#10b981",
  payments:     "#8b5cf6",
  crm:          "#3b82f6",
  communication:"#f97316",
  cloud:        "#0ea5e9",
  ecommerce:    "#f59e0b",
  productivity: "#6366f1",
  data:         "#06b6d4",
  "web3-iot":   "#a855f7",
};

const TYPE_COLORS: Record<string, string> = {
  FHIR: "#10b981", HL7: "#06b6d4", WEBHOOK: "#f97316",
  REST: "#6366f1", AUTH: "#8b5cf6", MQTT: "#f59e0b",
};

function fmt(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function ago(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 5)  return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LiveSimDashboard() {
  const [events, setEvents]               = useState<SimEvent[]>([]);
  const [selected, setSelected]           = useState<SimEvent | null>(null);
  const [simulating, setSimulating]       = useState<Set<string>>(new Set());
  const [lastSim, setLastSim]             = useState<Map<string, SimEvent>>(new Map());
  const [industries, setIndustries]       = useState<Record<string, IndustryGroup>>({});
  const [suiteRunning, setSuiteRunning]   = useState(false);
  const [sseConnected, setSseConnected]   = useState(false);
  const [totalFired, setTotalFired]       = useState(0);
  const [, setTick]                       = useState(0);

  const logRef  = useRef<HTMLDivElement>(null);
  const esRef   = useRef<EventSource | null>(null);

  // Keep re-rendering for "ago" freshness
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // Load adapter registry
  useEffect(() => {
    fetch("/api/public/integration-demo")
      .then(r => r.json())
      .then(d => {
        if (d.adapters?.byIndustry) setIndustries(d.adapters.byIndustry);
      })
      .catch(() => {});
  }, []);

  // SSE connection
  useEffect(() => {
    function connect() {
      const es = new EventSource("/api/public/events/stream");
      esRef.current = es;

      es.onopen = () => setSseConnected(true);
      es.onerror = () => {
        setSseConnected(false);
        es.close();
        setTimeout(connect, 3000);
      };
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

  // Auto-scroll log
  useEffect(() => {
    logRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [events.length]);

  const simulate = useCallback(async (adapterId: string) => {
    if (simulating.has(adapterId)) return;
    setSimulating(prev => new Set(prev).add(adapterId));
    try {
      const res = await fetch(`/api/public/simulate/adapter/${adapterId}`, { method: "POST" });
      const data = await res.json();
      if (data.ok && data.event) {
        // SSE will deliver it, but set selected immediately
        setSelected(data.event);
      }
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
    const allIds = Object.values(industries).flatMap(g => g.adapters.map(a => a.id));
    for (const id of allIds) {
      await simulate(id);
      await new Promise(r => setTimeout(r, 220));
    }
    setSuiteRunning(false);
  }, [industries, simulate, suiteRunning]);

  const allAdapters = Object.values(industries).flatMap(g =>
    g.adapters.map(a => ({ ...a, industryLabel: g.label, industryColor: INDUSTRY_COLORS[a.industry] ?? "#6366f1" }))
  );

  const adapterStatus = (id: string): "simulated" | "listening" => {
    return lastSim.has(id) ? "simulated" : "listening";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e2e8f0",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* ── Top banner ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "rgba(99,102,241,0.12)",
        borderBottom: "1px solid rgba(99,102,241,0.25)",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 12,
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 700, letterSpacing: "0.08em", color: "#a5b4fc" }}>
            CREATEAI BRAIN · LIVE INTEGRATION SIMULATION
          </span>
          <span style={{
            background: "#10b981",
            color: "#fff",
            borderRadius: 4,
            padding: "2px 8px",
            fontSize: 11,
            fontWeight: 700,
          }}>LIVE DEMO</span>
          <span style={{
            display: "flex", alignItems: "center", gap: 5,
            color: sseConnected ? "#10b981" : "#f59e0b",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: sseConnected ? "#10b981" : "#f59e0b",
              boxShadow: sseConnected ? "0 0 6px #10b981" : "0 0 6px #f59e0b",
              display: "inline-block",
              animation: sseConnected ? "pulse 2s infinite" : "none",
            }} />
            {sseConnected ? "SSE stream live" : "Reconnecting…"}
          </span>
        </div>
        <span style={{ color: "#64748b" }}>
          No PHI · No credentials · No source code · Authorized reviewer use only
        </span>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, flexShrink: 0,
          }}>🧠</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Live Integration Simulation Dashboard</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
              26 adapters · 9 industries · Real adapter code path · PHI-safe
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button
              onClick={runFullSuite}
              disabled={suiteRunning || Object.keys(industries).length === 0}
              style={{
                padding: "10px 20px",
                background: suiteRunning ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                border: "none", borderRadius: 8, color: "#fff",
                fontWeight: 700, fontSize: 13, cursor: suiteRunning ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              {suiteRunning ? (
                <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Running suite…</>
              ) : (
                <>▶ Run Full Suite</>
              )}
            </button>
          </div>
        </div>

        {/* ── Metrics bar ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Adapters",        value: allAdapters.length,  color: "#6366f1" },
            { label: "Industries",      value: Object.keys(industries).length, color: "#10b981" },
            { label: "Events fired",    value: totalFired + events.length, color: "#f97316" },
            { label: "In log",          value: events.length,       color: "#06b6d4" },
            { label: "Simulated",       value: lastSim.size,        color: "#8b5cf6" },
            { label: "SSE clients",     value: sseConnected ? 1 : 0, color: "#10b981" },
          ].map(m => (
            <div key={m.label} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "10px 18px",
              minWidth: 100,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: 16,
        padding: "0 24px 24px",
        alignItems: "start",
      }}>
        {/* ── LEFT: Adapter grid by industry ───────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Object.entries(industries).map(([industryId, group]) => {
            const color = INDUSTRY_COLORS[industryId] ?? "#6366f1";
            return (
              <div key={industryId} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                overflow: "hidden",
              }}>
                {/* Industry header */}
                <div style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid rgba(255,255,255,0.06)`,
                  display: "flex", alignItems: "center", gap: 10,
                  background: `linear-gradient(90deg, ${color}18, transparent)`,
                }}>
                  <span style={{ fontSize: 18 }}>{group.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color }}>{group.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{group.complianceNote}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>
                    {group.adapters.length} adapter{group.adapters.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Adapter cards */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 1,
                  background: "rgba(255,255,255,0.04)",
                }}>
                  {group.adapters.map(adapter => {
                    const status = adapterStatus(adapter.id);
                    const isLoading = simulating.has(adapter.id);
                    const last = lastSim.get(adapter.id);
                    const isSelected = selected?.adapterId === adapter.id;

                    return (
                      <div
                        key={adapter.id}
                        style={{
                          background: isSelected
                            ? `${color}14`
                            : "rgba(10,10,15,0.8)",
                          padding: "14px 16px",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          borderLeft: isSelected ? `3px solid ${color}` : "3px solid transparent",
                        }}
                        onClick={() => last && setSelected(last)}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                            <span style={{
                              fontSize: 22, flexShrink: 0,
                              filter: status === "simulated" ? "drop-shadow(0 0 4px " + color + ")" : "none",
                              transition: "filter 0.5s",
                            }}>{adapter.icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontWeight: 600, fontSize: 13,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}>{adapter.label}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                                <StatusPill status={status} color={color} />
                                <span style={{
                                  fontSize: 10, color: "#64748b",
                                  background: "rgba(255,255,255,0.06)",
                                  borderRadius: 4, padding: "1px 5px",
                                }}>{adapter.authType}</span>
                                {adapter.complianceFlags.slice(0, 2).map(f => (
                                  <span key={f} style={{
                                    fontSize: 10,
                                    background: `${color}22`,
                                    color,
                                    borderRadius: 4,
                                    padding: "1px 5px",
                                  }}>{f}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Simulate button */}
                          <button
                            onClick={e => { e.stopPropagation(); simulate(adapter.id); }}
                            disabled={isLoading}
                            style={{
                              padding: "5px 12px",
                              background: isLoading ? "rgba(255,255,255,0.08)" : `${color}22`,
                              border: `1px solid ${color}55`,
                              borderRadius: 6,
                              color: isLoading ? "#64748b" : color,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: isLoading ? "not-allowed" : "pointer",
                              flexShrink: 0,
                              transition: "all 0.15s",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {isLoading ? "⟳" : "▶ SIM"}
                          </button>
                        </div>

                        {last && (
                          <div style={{
                            marginTop: 8,
                            fontSize: 11,
                            color: "#64748b",
                            display: "flex", alignItems: "center", gap: 6,
                          }}>
                            <span style={{ color: "#10b981" }}>✓</span>
                            <span style={{
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>{last.label}</span>
                            <span style={{ marginLeft: "auto", flexShrink: 0, color: "#475569" }}>{ago(last.ts)} · {last.latencyMs}ms</span>
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

        {/* ── RIGHT: Event log + payload viewer ────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 16 }}>
          {/* Event log */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                Real-Time Event Log
                <span style={{
                  marginLeft: 8,
                  background: "rgba(99,102,241,0.2)",
                  color: "#a5b4fc",
                  borderRadius: 10,
                  padding: "1px 8px",
                  fontSize: 11,
                }}>{events.length}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>SSE stream</div>
            </div>
            <div
              ref={logRef}
              style={{ maxHeight: 340, overflowY: "auto", scrollbarWidth: "thin" }}
            >
              {events.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#475569", fontSize: 13 }}>
                  Click any ▶ SIM button or Run Full Suite to start
                </div>
              ) : (
                events.map((ev, i) => (
                  <div
                    key={ev.id + i}
                    onClick={() => setSelected(ev)}
                    style={{
                      padding: "9px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      background: selected?.id === ev.id ? "rgba(99,102,241,0.12)" : "transparent",
                      transition: "background 0.1s",
                      animation: i === 0 ? "fadeIn 0.3s ease" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: "#475569", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                        {fmt(ev.ts)}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: `${TYPE_COLORS[ev.type] ?? "#6366f1"}22`,
                        color: TYPE_COLORS[ev.type] ?? "#6366f1",
                        borderRadius: 4, padding: "1px 6px",
                        flexShrink: 0,
                      }}>{ev.type}</span>
                      <span style={{
                        fontSize: 10,
                        color: ev.dir === "IN" ? "#10b981" : "#f97316",
                        flexShrink: 0,
                      }}>{ev.dir === "IN" ? "↓IN" : "↑OUT"}</span>
                      <span style={{
                        fontSize: 10,
                        background: INDUSTRY_COLORS[ev.industry] ? `${INDUSTRY_COLORS[ev.industry]}22` : "rgba(255,255,255,0.06)",
                        color: INDUSTRY_COLORS[ev.industry] ?? "#64748b",
                        borderRadius: 4, padding: "1px 5px",
                        flexShrink: 0,
                      }}>{ev.industry}</span>
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 600,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{ev.label}</div>
                    <div style={{
                      fontSize: 11, color: "#64748b", marginTop: 2,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {ev.summary} · {ev.latencyMs}ms
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payload viewer */}
          {selected ? (
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              overflow: "hidden",
              maxHeight: 440,
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0,
              }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  Payload Viewer
                  <span style={{
                    marginLeft: 8, fontSize: 11, color: "#64748b",
                    background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 7px",
                  }}>{selected.adapterLabel}</span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "none", border: "none", color: "#64748b",
                    cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 2px",
                  }}
                >×</button>
              </div>
              <div style={{ padding: "6px 12px 4px", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { key: "type", val: selected.type },
                    { key: "dir",  val: selected.dir },
                    { key: "status", val: selected.status },
                    { key: "latency", val: `${selected.latencyMs}ms` },
                  ].map(b => (
                    <span key={b.key} style={{
                      fontSize: 10, background: "rgba(255,255,255,0.06)",
                      borderRadius: 4, padding: "2px 7px", color: "#94a3b8",
                    }}>
                      <span style={{ color: "#64748b" }}>{b.key}: </span>{b.val}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "thin" }}>
                <pre style={{
                  margin: 0, padding: "10px 14px 14px",
                  fontSize: 10.5, lineHeight: 1.6,
                  color: "#a5b4fc",
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>
              <div style={{
                padding: "8px 14px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: 10, color: "#475569",
                flexShrink: 0,
              }}>
                ⚠ SIMULATED — No real PHI, credentials, or external systems involved
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: 24,
              textAlign: "center",
              color: "#475569",
              fontSize: 13,
            }}>
              Click any event or adapter to inspect the JSON payload
            </div>
          )}

          {/* Legend */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "12px 14px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.06em" }}>
              STATUS LEGEND
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { dot: "#10b981", pulse: true,  label: "Listening",  desc: "Adapter wired · ready to receive" },
                { dot: "#6366f1", pulse: true,  label: "Simulated",  desc: "Event fired through real code path" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: l.dot, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ color: "#94a3b8", fontWeight: 600 }}>{l.label}</span>
                  <span style={{ color: "#475569" }}>{l.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            fontSize: 10, color: "#334155", lineHeight: 1.5,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: 10,
          }}>
            This dashboard demonstrates integration architecture and data flow capability only.
            No real PHI, credentials, API keys, or external systems are involved.
            All events are simulated and pass through the live adapter validation code.
            For authorized IT reviewer use only.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ─── Status pill sub-component ───────────────────────────────────────────────
function StatusPill({ status, color }: { status: "simulated" | "listening"; color: string }) {
  if (status === "simulated") {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700,
        background: `${color}22`,
        color,
        borderRadius: 4,
        padding: "1px 6px",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: color,
          display: "inline-block",
          animation: "pulse 1.5s infinite",
        }} />
        SIMULATED
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      background: "rgba(16,185,129,0.15)",
      color: "#10b981",
      borderRadius: 4,
      padding: "1px 6px",
      display: "flex", alignItems: "center", gap: 4,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: "#10b981",
        display: "inline-block",
      }} />
      LISTENING
    </span>
  );
}
