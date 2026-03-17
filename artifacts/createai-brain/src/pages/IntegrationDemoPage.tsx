/**
 * IntegrationDemoPage — Public, No-Login Integration Capability Review
 *
 * Accessible at /integration-demo
 * No authentication required. No real PHI, credentials, or source code exposed.
 * Designed for external IT reviewers and integration partners.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConnectionPoint {
  id: string; label: string; category: string;
  icon: string; status: "live" | "pending"; detail: string;
}

interface EventEntry {
  id: string; type: string; dir: string; status: string;
  label: string; summary: string; latencyMs: number; ts: string;
}

interface ComplianceItem {
  framework: string; status: string; domains: string[]; coverage: number;
}

interface AdapterDef {
  id: string; label: string; icon: string;
  authType: string; complianceFlags: string[];
  docsUrl: string; website: string;
}

interface IndustryGroup {
  label: string; icon: string; complianceNote: string;
  adapters: AdapterDef[];
}

interface DemoData {
  platform: {
    name: string; version: string; buildMode: string;
    stats: Record<string, number>;
  };
  connections: { live: ConnectionPoint[]; pending: ConnectionPoint[] };
  compliance: ComplianceItem[];
  eventLog: EventEntry[];
  adapters: {
    byIndustry: Record<string, IndustryGroup>;
    total: number;
  };
}

// ─── Color helpers ─────────────────────────────────────────────────────────────
const EVENT_COLORS: Record<string, string> = {
  FHIR:    "#0ea5e9",
  HL7:     "#8b5cf6",
  REST:    "#22c55e",
  WEBHOOK: "#f59e0b",
  AUTH:    "#6366f1",
};

const CATEGORY_COLORS: Record<string, string> = {
  Transport:   "#22c55e",
  Security:    "#ef4444",
  Auth:        "#6366f1",
  Healthcare:  "#0ea5e9",
  Compliance:  "#f59e0b",
};

function typeColor(t: string) { return EVENT_COLORS[t] ?? "#94a3b8"; }
function catColor(c: string)  { return CATEGORY_COLORS[c] ?? "#6366f1"; }

function ago(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
      background: `${color}22`, color, border: `1px solid ${color}44`,
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function StatusDot({ live }: { live: boolean }) {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: 99,
      background: live ? "#22c55e" : "#f59e0b",
      boxShadow: live ? "0 0 6px #22c55e99" : "0 0 6px #f59e0b99",
      flexShrink: 0,
    }} />
  );
}

function MetricCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
  return (
    <div style={{
      background: `${color}0f`, border: `1px solid ${color}2a`,
      borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function EventRow({ ev, isNew }: { ev: EventEntry; isNew: boolean }) {
  const [open, setOpen] = useState(false);
  const c = typeColor(ev.type);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        borderRadius: 10, padding: "10px 14px",
        background: isNew ? `${c}18` : "rgba(255,255,255,0.03)",
        border: `1px solid ${isNew ? c + "44" : "rgba(255,255,255,0.07)"}`,
        cursor: "pointer", transition: "all 0.3s",
        animation: isNew ? "pulseIn 0.4s ease" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StatusDot live={ev.status === "success"} />
        <Pill color={c}>{ev.type}</Pill>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
          background: ev.dir === "IN" ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.15)",
          color: ev.dir === "IN" ? "#4ade80" : "#818cf8" }}>{ev.dir}</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#e2e8f0", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.label}</span>
        <span style={{ fontSize: 10, color: "#6b7280", flexShrink: 0 }}>{ago(ev.ts)}</span>
        <span style={{ fontSize: 10, color: "#6b7280", flexShrink: 0 }}>{ev.latencyMs}ms</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: "#94a3b8", paddingLeft: 17 }}>{ev.summary}</div>
      {open && !!(ev as EventEntry & { payload?: unknown }).payload && (
        <pre style={{
          marginTop: 8, fontSize: 10, color: "#94a3b8", background: "rgba(0,0,0,0.3)",
          borderRadius: 8, padding: "10px 12px", overflowX: "auto", whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}>
          {JSON.stringify((ev as EventEntry & { payload?: unknown }).payload, null, 2) ?? ""}
        </pre>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IntegrationDemoPage() {
  const [data, setData]           = useState<DemoData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [events, setEvents]       = useState<(EventEntry & { _new?: boolean })[]>([]);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"connections" | "events" | "adapters" | "compliance">("connections");
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  // Load demo data
  useEffect(() => {
    fetch("/api/public/integration-demo")
      .then(r => r.ok ? r.json() : Promise.reject("Failed to load"))
      .then((d: DemoData) => {
        setData(d);
        setEvents(d.eventLog.map(e => ({ ...e, _new: false })));
      })
      .catch(() => setError("Could not load integration demo. API server may be starting up — please refresh."))
      .finally(() => setLoading(false));
  }, []);

  // Scroll events to top when new events arrive
  useEffect(() => {
    eventsRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [events.length]);

  const simulate = useCallback(async (type: string) => {
    if (simulating) return;
    setSimulating(type);
    try {
      const r = await fetch(`/api/public/simulate/${type}`, { method: "POST" });
      const body = await r.json() as { ok: boolean; event: EventEntry };
      if (body.ok && body.event) {
        setEvents(prev => [{ ...body.event, id: `sim-${Date.now()}`, _new: true }, ...prev.map(e => ({ ...e, _new: false }))]);
        setActiveTab("events");
      }
    } catch { /* silent */ }
    finally { setSimulating(null); }
  }, [simulating]);

  // ── Loading ──
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "linear-gradient(135deg, #0d1117 0%, #0f1729 50%, #130f1e 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 99, border: "3px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#6366f1", fontSize: 14, fontWeight: 600 }}>Loading Integration Review Dashboard…</p>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", background: "linear-gradient(135deg, #0d1117 0%, #0f1729 50%, #130f1e 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24,
      }}>
        <span style={{ fontSize: 40 }}>⚠️</span>
        <p style={{ color: "#f87171", fontSize: 14, textAlign: "center" }}>{error}</p>
        <button onClick={() => window.location.reload()}
          style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "8px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { platform, connections, compliance, adapters } = data;
  const liveCount = connections.live.length;
  const pendingCount = connections.pending.length;

  const TABS = [
    { id: "connections" as const, label: "Connections",  icon: "🔗", count: liveCount + pendingCount },
    { id: "events"      as const, label: "Event Log",    icon: "📋", count: events.length            },
    { id: "adapters"    as const, label: "Adapters",     icon: "🔌", count: adapters.total           },
    { id: "compliance"  as const, label: "Compliance",   icon: "🛡️", count: compliance.length        },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1117 0%, #0f1729 50%, #130f1e 100%)",
      color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulseIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 99px; }
      `}</style>

      {/* ── Top Banner ── */}
      <div style={{
        background: "rgba(99,102,241,0.12)", borderBottom: "1px solid rgba(99,102,241,0.25)",
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#818cf8" }}>CREATEAI BRAIN · INTEGRATION CAPABILITY REVIEW</span>
        <span style={{
          background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.5)",
          borderRadius: 99, padding: "2px 10px", fontSize: 10, fontWeight: 800, color: "#6366f1", letterSpacing: "0.06em",
        }}>DEMO / VIEW ONLY</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>
          No real PHI · No credentials · No source code · For authorized reviewer use only
        </span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
            }}>🧠</div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                {platform.name}
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>
                {platform.version} · Universal Enterprise Integration Engine · {platform.buildMode}
              </p>
            </div>
          </div>
        </div>

        {/* ── Metrics ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
          <MetricCard icon="🌐" label="REST Endpoints"    value={platform.stats.restEndpoints}      color="#22c55e" />
          <MetricCard icon="⚙️" label="AI Engines"        value={platform.stats.aiEngines}           color="#6366f1" />
          <MetricCard icon="🏗️" label="Platform Systems"  value={platform.stats.platformSystems}     color="#8b5cf6" />
          <MetricCard icon="🔌" label="Adapter Registry"  value={platform.stats.registeredAdapters}  color="#0ea5e9" />
          <MetricCard icon="🏭" label="Industries"         value={platform.stats.industries}          color="#f59e0b" />
          <MetricCard icon="✅" label="Live Connections"  value={platform.stats.connectedSystems}     color="#10b981" />
        </div>

        {/* ── Simulate Buttons ── */}
        <div style={{
          background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)",
          borderRadius: 14, padding: "16px 20px", marginBottom: 24,
        }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", letterSpacing: "0.07em", margin: "0 0 12px" }}>
            🧪 LIVE SIMULATION ENGINE — Fire a mock integration event
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { type: "fhir",    label: "🏥 FHIR R4 Patient",    color: "#0ea5e9" },
              { type: "hl7",     label: "🔀 HL7 ADT^A01",        color: "#8b5cf6" },
              { type: "webhook", label: "🔔 Outbound Webhook",   color: "#f59e0b" },
              { type: "rest",    label: "🌐 REST Inbound",       color: "#22c55e" },
            ].map(btn => (
              <button
                key={btn.type}
                onClick={() => void simulate(btn.type)}
                disabled={!!simulating}
                style={{
                  background: simulating === btn.type ? `${btn.color}33` : `${btn.color}18`,
                  border: `1px solid ${btn.color}44`,
                  borderRadius: 10, padding: "8px 16px",
                  color: btn.color, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  opacity: simulating && simulating !== btn.type ? 0.5 : 1,
                  transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {simulating === btn.type ? (
                  <><span style={{ width: 12, height: 12, borderRadius: 99, border: `2px solid ${btn.color}`, borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Running…</>
                ) : btn.label}
              </button>
            ))}
            <span style={{ fontSize: 11, color: "#475569", alignSelf: "center", marginLeft: "auto" }}>
              Results appear in Event Log tab
            </span>
          </div>
        </div>

        {/* ── Tab Nav ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", overflowX: "auto" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "rgba(99,102,241,0.2)" : "transparent",
                border: activeTab === tab.id ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent",
                borderRadius: "8px 8px 0 0", padding: "8px 14px",
                color: activeTab === tab.id ? "#818cf8" : "#64748b",
                fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: "pointer", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {tab.icon} {tab.label}
              <span style={{
                fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 99,
                background: activeTab === tab.id ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)",
                color: activeTab === tab.id ? "#818cf8" : "#64748b",
              }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── CONNECTIONS TAB ── */}
        {activeTab === "connections" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Live */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <StatusDot live />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#22c55e", letterSpacing: "0.06em" }}>LIVE — {liveCount} ACTIVE SYSTEMS</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                {connections.live.map(c => (
                  <div key={c.id} style={{
                    background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.18)",
                    borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{c.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", flex: 1 }}>{c.label}</span>
                      <Pill color={catColor(c.category)}>{c.category}</Pill>
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{c.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <StatusDot live={false} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.06em" }}>PENDING — {pendingCount} AWAITING CONFIG</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                {connections.pending.map(c => (
                  <div key={c.id} style={{
                    background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.18)",
                    borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{c.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", flex: 1 }}>{c.label}</span>
                      <Pill color={catColor(c.category)}>{c.category}</Pill>
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{c.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EVENT LOG TAB ── */}
        {activeTab === "events" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(EVENT_COLORS).map(([t, c]) => (
                  <Pill key={t} color={c}>{t}</Pill>
                ))}
              </div>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>
                {events.length} events · Click row to expand payload
              </span>
            </div>
            <div ref={eventsRef} style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 520, overflowY: "auto" }}>
              {events.map(ev => (
                <EventRow key={ev.id} ev={ev} isNew={!!ev._new} />
              ))}
              {events.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 13 }}>
                  No events yet — fire a simulation above to see live results here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ADAPTERS TAB ── */}
        {activeTab === "adapters" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              {adapters.total} adapters across {Object.keys(adapters.byIndustry).length} industries — ready to connect with real credentials. All test functions execute real HTTP calls when configured.
            </p>
            {Object.entries(adapters.byIndustry).map(([industryId, group]) => (
              <div key={industryId} style={{
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, overflow: "hidden",
              }}>
                <button
                  onClick={() => setExpandedIndustry(expandedIndustry === industryId ? null : industryId)}
                  style={{
                    width: "100%", background: "none", border: "none", padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "#e2e8f0",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{group.icon}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{group.label}</span>
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 10 }}>{group.adapters.length} adapters</span>
                  </div>
                  <Pill color="#6366f1">{group.complianceNote}</Pill>
                  <span style={{ color: "#64748b", fontSize: 14 }}>{expandedIndustry === industryId ? "▾" : "›"}</span>
                </button>
                {expandedIndustry === industryId && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 18px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                      {group.adapters.map(a => (
                        <div key={a.id} style={{
                          background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)",
                          borderRadius: 10, padding: "10px 12px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 18 }}>{a.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", flex: 1 }}>{a.label}</span>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <Pill color="#6366f1">{a.authType}</Pill>
                            {a.complianceFlags.slice(0, 2).map(f => (
                              <Pill key={f} color="#f59e0b">{f}</Pill>
                            ))}
                          </div>
                          <a href={a.docsUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: "block", marginTop: 6, fontSize: 10, color: "#818cf8", textDecoration: "none" }}>
                            {a.website} ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── COMPLIANCE TAB ── */}
        {activeTab === "compliance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 6,
            }}>
              <p style={{ fontSize: 11, color: "#f87171", margin: 0, fontWeight: 600 }}>
                ⚠️ REGULATORY READINESS BLUEPRINTS — Structural frameworks only. Not legally binding certifications.
                Real compliance requires qualified legal, compliance, and security professionals.
              </p>
            </div>
            {compliance.map(c => {
              const color = c.status === "live" ? "#22c55e" : "#6366f1";
              return (
                <div key={c.framework} style={{
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "14px 18px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{c.framework}</span>
                    <Pill color={color}>{c.status === "live" ? "live" : "blueprint-ready"}</Pill>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.08)" }}>
                        <div style={{ width: `${c.coverage}%`, height: "100%", borderRadius: 99, background: color, transition: "width 0.6s" }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>{c.coverage}%</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {c.domains.map(d => (
                      <span key={d} style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 6,
                        background: "rgba(255,255,255,0.05)", color: "#94a3b8",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}>{d}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          marginTop: 40, padding: "20px 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>
            <strong style={{ color: "#6366f1" }}>CreateAI Brain</strong> · {platform.version} ·
            Universal Enterprise Integration Engine
          </p>
          <p style={{ fontSize: 10, color: "#374151", margin: 0 }}>
            This view contains no real PHI, no credentials, no API keys, and no proprietary source code.
            All event data is simulated. For authorized IT reviewer and integration partner use only.
            Sara Stadler · CreateAI Brain Platform.
          </p>
        </div>
      </div>
    </div>
  );
}
