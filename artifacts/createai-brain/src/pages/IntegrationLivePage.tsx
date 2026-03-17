/**
 * IntegrationLivePage.tsx — /integration-live
 *
 * Standalone public page. Read-only view of the live integration engine.
 * No login required. No PHI. No credentials. No platform access.
 * Tabs: Adapters · Connections · Event Stream (SSE)
 */

import { useState, useEffect, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Adapter {
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
  adapters: Adapter[];
}

interface Connection {
  id: string;
  label: string;
  category: string;
  icon: string;
  status: "live" | "pending";
  detail: string;
}

interface StreamEvent {
  id: string;
  adapterId?: string;
  adapterLabel?: string;
  industry?: string;
  type: string;
  dir: "IN" | "OUT";
  status: "success" | "error";
  label: string;
  summary: string;
  latencyMs: number;
  ts: string;
}

// ─── Colour palette ──────────────────────────────────────────────────────────
const IND_COLOR: Record<string, string> = {
  healthcare: "#10b981", payments: "#8b5cf6", crm: "#3b82f6",
  communication: "#f97316", cloud: "#0ea5e9", ecommerce: "#f59e0b",
  productivity: "#6366f1", data: "#06b6d4", "web3-iot": "#a855f7",
};
const TYPE_COLOR: Record<string, string> = {
  FHIR: "#10b981", HL7: "#06b6d4", WEBHOOK: "#f97316", REST: "#6366f1",
  AUTH: "#8b5cf6", MQTT: "#f59e0b",
};
const CAT_COLOR: Record<string, string> = {
  Transport: "#6366f1", Security: "#10b981", Auth: "#8b5cf6",
  Healthcare: "#10b981", Compliance: "#f97316",
};

function fmt(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function IntegrationLivePage() {
  const [tab, setTab]             = useState<"adapters" | "connections" | "stream">("adapters");
  const [industries, setIndustries] = useState<Record<string, IndustryGroup>>({});
  const [liveConns, setLiveConns]   = useState<Connection[]>([]);
  const [pendingConns, setPendingConns] = useState<Connection[]>([]);
  const [events, setEvents]         = useState<StreamEvent[]>([]);
  const [sseOk, setSseOk]           = useState(false);
  const [loading, setLoading]       = useState(true);
  const [, setTick]                 = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  // Refresh "ago" display every 10s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  // Load adapter + connection data
  useEffect(() => {
    fetch("/api/public/integration-demo")
      .then(r => r.json())
      .then(d => {
        if (d.adapters?.byIndustry) setIndustries(d.adapters.byIndustry);
        if (d.connections?.live)    setLiveConns(d.connections.live);
        if (d.connections?.pending) setPendingConns(d.connections.pending);
        if (d.eventLog)             setEvents(d.eventLog);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // SSE stream
  useEffect(() => {
    let es: EventSource;
    function connect() {
      es = new EventSource("/api/public/events/stream");
      es.onopen  = () => setSseOk(true);
      es.onerror = () => { setSseOk(false); es.close(); setTimeout(connect, 3000); };
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "init" && msg.events?.length) {
            setEvents(prev => {
              const ids = new Set(prev.map((x: StreamEvent) => x.id));
              const fresh = (msg.events as StreamEvent[]).filter(x => !ids.has(x.id));
              return [...fresh, ...prev].slice(0, 100);
            });
          } else if (msg.type === "event") {
            setEvents(prev => [msg.event as StreamEvent, ...prev].slice(0, 100));
            logRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }
        } catch {}
      };
    }
    connect();
    return () => es?.close();
  }, []);

  const allAdapters = Object.values(industries).flatMap(g => g.adapters);
  const totalAdapters = allAdapters.length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0c11",
      color: "#e2e8f0",
      fontFamily: "'Inter', -apple-system, sans-serif",
      fontSize: 14,
    }}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "11px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(99,102,241,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <span style={{ fontWeight: 700, letterSpacing: "0.06em", color: "#a5b4fc", fontSize: 13 }}>
            CREATEAI BRAIN · INTEGRATION ENGINE
          </span>
          <span style={{
            background: "#6366f1", color: "#fff", borderRadius: 4,
            padding: "2px 8px", fontSize: 11, fontWeight: 700,
          }}>LIVE</span>
          <span style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 12,
            color: sseOk ? "#10b981" : "#f59e0b",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: sseOk ? "#10b981" : "#f59e0b",
              display: "inline-block",
            }} />
            {sseOk ? "Stream connected" : "Connecting…"}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "#475569" }}>
          Read-only · No PHI · No credentials · Authorized reviewer use only
        </span>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "28px 28px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Live Integration Engine
        </div>
        <div style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
          Real-time adapter status · connection health · inbound/outbound event stream
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Adapters",    value: totalAdapters || 26,          color: "#6366f1" },
            { label: "Industries",  value: Object.keys(industries).length || 9, color: "#10b981" },
            { label: "Live systems",value: liveConns.length || 13,        color: "#10b981" },
            { label: "Pending",     value: pendingConns.length || 5,      color: "#f59e0b" },
            { label: "Events",      value: events.length,                 color: "#06b6d4" },
          ].map(s => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "10px 18px", minWidth: 90,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 0 }}>
          {(["adapters", "connections", "stream"] as const).map(t => {
            const labels: Record<string, string> = {
              adapters: `Adapters ${totalAdapters ? `(${totalAdapters})` : "(26)"}`,
              connections: `Connections (${liveConns.length || 13})`,
              stream: `Event Stream (${events.length})`,
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "10px 18px",
                  background: "none",
                  border: "none",
                  borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent",
                  color: tab === t ? "#a5b4fc" : "#64748b",
                  fontWeight: tab === t ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  marginBottom: -1,
                }}
              >{labels[t]}</button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 28px 40px" }}>

        {/* ─ ADAPTERS ───────────────────────────────────────────────────── */}
        {tab === "adapters" && (
          <div>
            {loading ? (
              <div style={{ color: "#64748b", padding: 40, textAlign: "center" }}>Loading adapters…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Object.entries(industries).map(([industryId, group]) => {
                  const color = IND_COLOR[industryId] ?? "#6366f1";
                  return (
                    <div key={industryId} style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        padding: "10px 16px",
                        background: `linear-gradient(90deg, ${color}14, transparent)`,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        <span style={{ fontSize: 18 }}>{group.icon}</span>
                        <div>
                          <span style={{ fontWeight: 700, color, fontSize: 14 }}>{group.label}</span>
                          <span style={{ marginLeft: 10, fontSize: 11, color: "#64748b" }}>{group.complianceNote}</span>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569" }}>
                          {group.adapters.length} adapter{group.adapters.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                        gap: 1,
                        background: "rgba(255,255,255,0.03)",
                      }}>
                        {group.adapters.map(a => (
                          <div key={a.id} style={{
                            background: "#0d0e14",
                            padding: "13px 15px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                              <span style={{ fontSize: 20 }}>{a.icon}</span>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 700,
                                background: "rgba(16,185,129,0.15)", color: "#10b981",
                                borderRadius: 4, padding: "2px 7px",
                                display: "flex", alignItems: "center", gap: 4,
                              }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                                READY
                              </span>
                              <span style={{
                                fontSize: 10, background: "rgba(255,255,255,0.07)",
                                color: "#94a3b8", borderRadius: 4, padding: "2px 7px",
                              }}>{a.authType}</span>
                              {a.complianceFlags.slice(0, 2).map(f => (
                                <span key={f} style={{
                                  fontSize: 10, background: `${color}18`,
                                  color, borderRadius: 4, padding: "2px 7px",
                                }}>{f}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─ CONNECTIONS ────────────────────────────────────────────────── */}
        {tab === "connections" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Live */}
            <div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: "#10b981",
                letterSpacing: "0.08em", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                LIVE — {liveConns.length} ACTIVE SYSTEMS
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 10,
              }}>
                {liveConns.map(c => {
                  const color = CAT_COLOR[c.category] ?? "#6366f1";
                  return (
                    <div key={c.id} style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{c.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{c.label}</span>
                        </div>
                        <span style={{
                          fontSize: 10, background: `${color}22`,
                          color, borderRadius: 4, padding: "2px 8px", fontWeight: 700,
                        }}>{c.category}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{c.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pending */}
            {pendingConns.length > 0 && (
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: "#f59e0b",
                  letterSpacing: "0.08em", marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                  PENDING — {pendingConns.length} AWAITING CONFIGURATION
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 10,
                }}>
                  {pendingConns.map(c => (
                    <div key={c.id} style={{
                      background: "rgba(245,158,11,0.04)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{c.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.label}</span>
                        <span style={{
                          marginLeft: "auto", fontSize: 10, color: "#f59e0b",
                          background: "rgba(245,158,11,0.15)", borderRadius: 4, padding: "2px 8px", fontWeight: 700,
                        }}>PENDING</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{c.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─ EVENT STREAM ───────────────────────────────────────────────── */}
        {tab === "stream" && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
            }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Live inbound/outbound events — updates automatically via SSE
              </div>
              <span style={{
                marginLeft: "auto",
                fontSize: 11, color: sseOk ? "#10b981" : "#f59e0b",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: sseOk ? "#10b981" : "#f59e0b",
                  display: "inline-block",
                  animation: sseOk ? "pulse 2s infinite" : "none",
                }} />
                {sseOk ? "SSE connected — live" : "Reconnecting…"}
              </span>
            </div>

            <div
              ref={logRef}
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                overflow: "hidden",
                maxHeight: "calc(100vh - 320px)",
                overflowY: "auto",
                scrollbarWidth: "thin",
              }}
            >
              {/* Header row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "90px 80px 60px 100px 1fr 100px 70px",
                padding: "8px 16px",
                background: "rgba(255,255,255,0.04)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                fontSize: 10,
                fontWeight: 700,
                color: "#475569",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                gap: 8,
              }}>
                <span>Time</span>
                <span>Type</span>
                <span>Dir</span>
                <span>Industry</span>
                <span>Event</span>
                <span>Summary</span>
                <span style={{ textAlign: "right" }}>Latency</span>
              </div>

              {events.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>
                  No events yet — stream is listening
                </div>
              ) : (
                events.map((ev, i) => (
                  <div
                    key={ev.id + i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px 80px 60px 100px 1fr 100px 70px",
                      padding: "10px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: i === 0 ? "rgba(99,102,241,0.07)" : "transparent",
                      animation: i === 0 ? "fadeIn 0.3s ease" : "none",
                      alignItems: "start",
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "#475569", fontVariantNumeric: "tabular-nums", fontFamily: "monospace", fontSize: 11 }}>
                      {fmt(ev.ts)}
                    </span>
                    <span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: `${TYPE_COLOR[ev.type] ?? "#6366f1"}22`,
                        color: TYPE_COLOR[ev.type] ?? "#6366f1",
                        borderRadius: 4, padding: "2px 6px",
                      }}>{ev.type}</span>
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: ev.dir === "IN" ? "#10b981" : "#f97316",
                    }}>
                      {ev.dir === "IN" ? "↓ IN" : "↑ OUT"}
                    </span>
                    <span>
                      {ev.industry && (
                        <span style={{
                          fontSize: 10,
                          background: IND_COLOR[ev.industry] ? `${IND_COLOR[ev.industry]}18` : "rgba(255,255,255,0.06)",
                          color: IND_COLOR[ev.industry] ?? "#64748b",
                          borderRadius: 4, padding: "2px 6px",
                        }}>{ev.industry}</span>
                      )}
                    </span>
                    <span style={{
                      fontWeight: 600,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{ev.label}</span>
                    <span style={{
                      color: "#64748b", fontSize: 11,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{ev.summary}</span>
                    <span style={{
                      textAlign: "right", color: "#475569",
                      fontFamily: "monospace", fontSize: 11,
                    }}>{ev.latencyMs}ms</span>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: "#334155" }}>
              ⚠ All events are simulated. No real PHI, credentials, or external systems are involved.
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "14px 28px",
        fontSize: 11, color: "#334155",
        display: "flex", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8,
      }}>
        <span>CreateAI Brain v3.0 · Integration Engine · Read-only public view</span>
        <span>No PHI · No credentials · No admin access · No source code exposed</span>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
      `}</style>
    </div>
  );
}
