/**
 * IntegrationSuitePage.tsx — /integration-suite
 *
 * Standalone public enterprise integration showcase.
 * 6 tabs: Overview · Adapters · Connections · Event Stream · Trigger Events · Compliance
 *
 * Public access · No login · No PHI · No credentials · Read-only safe demo
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  payload?: unknown;
}

interface Adapter {
  id: string; label: string; icon: string;
  authType: string; complianceFlags: string[]; industry: string;
}

interface IndustryGroup {
  label: string; icon: string; complianceNote: string; adapters: Adapter[];
}

interface Connection {
  id: string; label: string; category: string;
  icon: string; status: "live" | "pending"; detail: string;
}

interface ComplianceItem {
  framework: string; status: string; domains: string[]; coverage: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const IND_COLOR: Record<string, string> = {
  healthcare:"#10b981", payments:"#8b5cf6", crm:"#3b82f6",
  communication:"#f97316", cloud:"#0ea5e9", ecommerce:"#f59e0b",
  productivity:"#6366f1", data:"#06b6d4", "web3-iot":"#a855f7",
};
const TYPE_COLOR: Record<string, string> = {
  FHIR:"#10b981", HL7:"#06b6d4", WEBHOOK:"#f97316",
  REST:"#6366f1", AUTH:"#8b5cf6", MQTT:"#f59e0b",
};
const CAT_COLOR: Record<string, string> = {
  Transport:"#6366f1", Security:"#10b981", Auth:"#8b5cf6",
  Healthcare:"#10b981", Compliance:"#f97316",
};

const TABS = [
  { id:"overview",    label:"Overview",      icon:"◉" },
  { id:"adapters",    label:"Adapters",      icon:"⬡" },
  { id:"connections", label:"Connections",   icon:"⟷" },
  { id:"stream",      label:"Event Stream",  icon:"◎" },
  { id:"trigger",     label:"Trigger Events",icon:"▶" },
  { id:"compliance",  label:"Compliance",    icon:"✦" },
] as const;

type Tab = typeof TABS[number]["id"];

function fmt(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US",
    { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function IntegrationSuitePage() {
  const [tab, setTab]               = useState<Tab>("overview");
  const [industries, setIndustries] = useState<Record<string, IndustryGroup>>({});
  const [liveConns, setLiveConns]   = useState<Connection[]>([]);
  const [pendingConns, setPending]  = useState<Connection[]>([]);
  const [compliance, setCompliance] = useState<ComplianceItem[]>([]);
  const [events, setEvents]         = useState<StreamEvent[]>([]);
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [filter, setFilter]         = useState("ALL");
  const [sseOk, setSseOk]           = useState(false);
  const [loading, setLoading]       = useState(true);

  // Trigger Events state
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<StreamEvent | null>(null);
  const [sessionHistory, setSessionHistory] = useState<StreamEvent[]>([]);

  const logRef = useRef<HTMLDivElement>(null);

  // ── Load static data ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/public/integration-demo")
      .then(r => r.json())
      .then(d => {
        if (d.adapters?.byIndustry) setIndustries(d.adapters.byIndustry);
        if (d.connections?.live)    setLiveConns(d.connections.live);
        if (d.connections?.pending) setPending(d.connections.pending);
        if (d.compliance)           setCompliance(d.compliance);
        if (d.eventLog)             setEvents(d.eventLog);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── SSE stream ─────────────────────────────────────────────────────────────
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
              const fresh = (msg.events as StreamEvent[]).filter((x: StreamEvent) => !ids.has(x.id));
              return [...fresh, ...prev].slice(0, 100);
            });
          } else if (msg.type === "event") {
            const ev = msg.event as StreamEvent;
            setEvents(prev => [ev, ...prev].slice(0, 100));
            logRef.current?.scrollTo({ top:0, behavior:"smooth" });
          }
        } catch {}
      };
    }
    connect();
    return () => es?.close();
  }, []);

  // ── Trigger ────────────────────────────────────────────────────────────────
  const triggerEvent = useCallback(async (type: string, adapterId?: string) => {
    if (triggering) return;
    setTriggering(type);
    setTriggerResult(null);
    try {
      const url = adapterId
        ? `/api/public/simulate/adapter/${adapterId}`
        : `/api/public/simulate/${type}`;
      const res  = await fetch(url, { method:"POST" });
      const data = await res.json();
      if (data.ok && data.event) {
        setTriggerResult(data.event);
        setSessionHistory(prev => [data.event, ...prev].slice(0, 8));
      }
    } catch {}
    finally { setTimeout(() => setTriggering(null), 800); }
  }, [triggering]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const allAdapters   = Object.values(industries).flatMap(g => g.adapters);
  const filteredEvents = filter === "ALL" ? events : events.filter(e => e.type === filter);

  // ── Shared style helpers ───────────────────────────────────────────────────
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background:"rgba(255,255,255,0.03)",
    border:"1px solid rgba(255,255,255,0.07)",
    borderRadius:12,
    ...extra,
  });

  const pill = (color: string, bg?: string): React.CSSProperties => ({
    fontSize:10, fontWeight:700, borderRadius:4, padding:"2px 7px",
    color, background: bg ?? `${color}20`,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh", background:"#09090f",
      color:"#e2e8f0", fontFamily:"'Inter',-apple-system,sans-serif", fontSize:14,
    }}>
      {/* ─ Top Banner ─────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        padding:"10px 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"linear-gradient(90deg,rgba(99,102,241,0.1),rgba(139,92,246,0.06))",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>🧠</span>
          <span style={{ fontWeight:700, letterSpacing:"0.07em", color:"#a5b4fc", fontSize:13 }}>
            CREATEAI BRAIN · ENTERPRISE INTEGRATION SUITE
          </span>
          <span style={{
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            color:"#fff", borderRadius:4, padding:"2px 10px", fontSize:11, fontWeight:700,
          }}>ENTERPRISE</span>
          <span style={{
            fontSize:12, color:sseOk?"#10b981":"#f59e0b",
            display:"flex", alignItems:"center", gap:5,
          }}>
            <span style={{
              width:6, height:6, borderRadius:"50%",
              background:sseOk?"#10b981":"#f59e0b",
              display:"inline-block",
              animation:sseOk?"pulse 2s infinite":"none",
            }}/>
            {sseOk ? "Live stream" : "Connecting…"}
          </span>
        </div>
        <span style={{ fontSize:11, color:"#475569" }}>
          Read-only · No PHI · No credentials · No source code · Authorized reviewer use only
        </span>
      </div>

      {/* ─ Header + Tabs ──────────────────────────────────────────────────── */}
      <div style={{ padding:"24px 28px 0", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>
          Enterprise Integration Suite
        </div>
        <div style={{ color:"#64748b", fontSize:13, marginBottom:20 }}>
          26 adapters · 9 industries · 315 REST endpoints · Real-time SSE · PHI-safe demonstration
        </div>

        {/* Stat pills */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          {[
            { v:allAdapters.length||26, l:"Adapters",          c:"#6366f1" },
            { v:Object.keys(industries).length||9, l:"Industries", c:"#10b981" },
            { v:liveConns.length||13,  l:"Live Systems",       c:"#10b981" },
            { v:315,                   l:"REST Endpoints",     c:"#06b6d4" },
            { v:86,                    l:"AI Engines",         c:"#8b5cf6" },
            { v:events.length,         l:"Events",             c:"#f97316" },
          ].map(s => (
            <div key={s.l} style={{
              ...card(), padding:"9px 16px", minWidth:80, textAlign:"center",
            }}>
              <div style={{ fontSize:19, fontWeight:800, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div style={{ display:"flex", gap:0 }}>
          {TABS.map(t => {
            const counts: Record<string, number> = {
              adapters: allAdapters.length || 26,
              connections: liveConns.length || 13,
              stream: events.length,
              compliance: compliance.length || 6,
            };
            const count = counts[t.id];
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding:"10px 18px", background:"none", border:"none",
                borderBottom: tab===t.id ? "2px solid #6366f1" : "2px solid transparent",
                color: tab===t.id ? "#a5b4fc" : "#64748b",
                fontWeight: tab===t.id ? 700 : 400,
                fontSize:13, cursor:"pointer", transition:"all 0.15s",
                marginBottom:-1, display:"flex", alignItems:"center", gap:6,
              }}>
                <span style={{ opacity:0.7 }}>{t.icon}</span>
                {t.label}
                {count !== undefined && (
                  <span style={{
                    fontSize:10, background:"rgba(255,255,255,0.08)",
                    color:"#64748b", borderRadius:10, padding:"1px 6px",
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─ Tab Content ────────────────────────────────────────────────────── */}
      <div style={{ padding:"24px 28px 48px" }}>

        {/* ══ OVERVIEW ════════════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

            {/* Hero */}
            <div style={{
              ...card(),
              padding:"32px 36px",
              background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.06))",
              borderColor:"rgba(99,102,241,0.2)",
            }}>
              <div style={{ fontSize:18, fontWeight:700, color:"#a5b4fc", marginBottom:10 }}>
                Universal Enterprise Integration Engine
              </div>
              <div style={{ color:"#94a3b8", lineHeight:1.8, maxWidth:780 }}>
                CreateAI Brain's integration layer connects to any enterprise system across healthcare,
                finance, CRM, cloud, e-commerce, productivity, data, and IoT — using industry-standard
                protocols and authentication methods. Every adapter is built for production-grade
                reliability with real-time event streaming, validation, and compliance controls.
              </div>
              <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
                {["FHIR R4","HL7 v2.6","REST / JSON:API","Webhooks + HMAC","OAuth 2.0","API Key","JWT","SAML 2.0","mTLS"].map(p => (
                  <span key={p} style={{
                    fontSize:11, fontWeight:600,
                    background:"rgba(99,102,241,0.15)", color:"#a5b4fc",
                    borderRadius:6, padding:"4px 10px",
                    border:"1px solid rgba(99,102,241,0.25)",
                  }}>{p}</span>
                ))}
              </div>
            </div>

            {/* Capability cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {[
                {
                  icon:"🏥", title:"Healthcare & Clinical",
                  color:"#10b981", items:[
                    "FHIR R4 — Patient, Encounter, Observation, DocumentReference",
                    "HL7 v2.6 — ADT, ORM, ORU, ACK bidirectional parser",
                    "Epic EHR · Cerner/Oracle · athenahealth OAuth2",
                    "PHI minimum-necessary access · field-level masking",
                    "HIPAA technical safeguards blueprint",
                  ]
                },
                {
                  icon:"🌐", title:"Transport & Protocols",
                  color:"#6366f1", items:[
                    "315 versioned REST endpoints (GET/POST/PUT/PATCH/DELETE)",
                    "Server-Sent Events — real-time AI streaming",
                    "Inbound webhook ingestion with HMAC-SHA256 verification",
                    "TLS 1.3 in-transit encryption · mTLS proxy",
                    "JSON:API response format with schema validation",
                  ]
                },
                {
                  icon:"💳", title:"Payments & Commerce",
                  color:"#8b5cf6", items:[
                    "Stripe — PaymentIntents, Subscriptions, Connect, Webhooks",
                    "PayPal — Orders, Capture, Subscriptions, Payouts",
                    "Square — POS, Invoices, Catalog, Webhooks",
                    "Shopify — Orders, Products, Fulfillment, Inventory",
                    "Amazon SP-API · WooCommerce REST",
                  ]
                },
                {
                  icon:"☁️", title:"Cloud & DevOps",
                  color:"#0ea5e9", items:[
                    "AWS — S3, Lambda, SQS, SNS, RDS (Signature V4)",
                    "Google Cloud — Pub/Sub, Cloud Functions, BigQuery",
                    "Azure — Event Hub, Blob Storage, Functions",
                    "GitHub — Webhooks, REST, GraphQL, Actions",
                    "Google Workspace — Gmail, Drive, Calendar, Sheets",
                  ]
                },
                {
                  icon:"🧲", title:"CRM & Messaging",
                  color:"#3b82f6", items:[
                    "Salesforce — Contacts, Leads, Opportunities, Platform Events",
                    "HubSpot CRM — Contacts, Deals, Tickets, Webhooks",
                    "Pipedrive — Deals, Persons, Pipeline Stage Events",
                    "Slack — Bot messages, Workflow triggers, Channel events",
                    "Twilio SMS · SendGrid email · Mailchimp automation",
                  ]
                },
                {
                  icon:"🔒", title:"Security & Auth",
                  color:"#f59e0b", items:[
                    "JWT HS256 tokens — 1h TTL with refresh flow",
                    "Role-based access control (Owner/Editor/Viewer)",
                    "AES-256 encryption at rest · key rotation ready",
                    "Session management — HTTPOnly cookies, 7-day TTL",
                    "SAML 2.0 SSO ready · MFA (TOTP/SMS) config complete",
                  ]
                },
              ].map(cap => (
                <div key={cap.title} style={{ ...card(), padding:"20px 22px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <span style={{ fontSize:22 }}>{cap.icon}</span>
                    <span style={{ fontWeight:700, fontSize:14, color:cap.color }}>{cap.title}</span>
                  </div>
                  <ul style={{ margin:0, padding:"0 0 0 16px", listStyle:"disc" }}>
                    {cap.items.map(item => (
                      <li key={item} style={{ fontSize:12, color:"#94a3b8", marginBottom:5, lineHeight:1.5 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ADAPTERS ════════════════════════════════════════════════════════ */}
        {tab === "adapters" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {loading ? (
              <div style={{ color:"#64748b", padding:40, textAlign:"center" }}>Loading adapter registry…</div>
            ) : Object.entries(industries).map(([indId, group]) => {
              const color = IND_COLOR[indId] ?? "#6366f1";
              return (
                <div key={indId} style={{ ...card(), overflow:"hidden" }}>
                  <div style={{
                    padding:"11px 16px",
                    background:`linear-gradient(90deg,${color}14,transparent)`,
                    borderBottom:"1px solid rgba(255,255,255,0.06)",
                    display:"flex", alignItems:"center", gap:10,
                  }}>
                    <span style={{ fontSize:18 }}>{group.icon}</span>
                    <span style={{ fontWeight:700, color, fontSize:14 }}>{group.label}</span>
                    <span style={{ fontSize:11, color:"#64748b" }}>{group.complianceNote}</span>
                    <span style={{ marginLeft:"auto", fontSize:11, color:"#475569" }}>
                      {group.adapters.length} adapter{group.adapters.length!==1?"s":""}
                    </span>
                  </div>
                  <div style={{
                    display:"grid",
                    gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",
                    gap:1, background:"rgba(255,255,255,0.03)",
                  }}>
                    {group.adapters.map(a => (
                      <div key={a.id} style={{ background:"#0c0d14", padding:"14px 15px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8 }}>
                          <span style={{ fontSize:20 }}>{a.icon}</span>
                          <span style={{ fontWeight:600, fontSize:13 }}>{a.label}</span>
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          <span style={pill("#10b981")}>
                            <span style={{
                              width:4,height:4,borderRadius:"50%",background:"#10b981",
                              display:"inline-block",marginRight:4,
                            }}/>READY
                          </span>
                          <span style={pill("#64748b","rgba(255,255,255,0.07)")}>{a.authType}</span>
                          {a.complianceFlags.slice(0,2).map(f=>(
                            <span key={f} style={pill(color)}>{f}</span>
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

        {/* ══ CONNECTIONS ═════════════════════════════════════════════════════ */}
        {tab === "connections" && (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <div>
              <div style={{
                fontSize:12, fontWeight:700, color:"#10b981",
                letterSpacing:"0.08em", marginBottom:12,
                display:"flex", alignItems:"center", gap:7,
              }}>
                <span style={{ width:7,height:7,borderRadius:"50%",background:"#10b981",display:"inline-block" }}/>
                LIVE — {liveConns.length} ACTIVE SYSTEMS
              </div>
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
                gap:10,
              }}>
                {liveConns.map(c => {
                  const color = CAT_COLOR[c.category] ?? "#6366f1";
                  return (
                    <div key={c.id} style={{ ...card(), padding:"16px 18px" }}>
                      <div style={{
                        display:"flex", alignItems:"center",
                        justifyContent:"space-between", marginBottom:8,
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                          <span style={{ fontSize:18 }}>{c.icon}</span>
                          <span style={{ fontWeight:600, fontSize:13 }}>{c.label}</span>
                        </div>
                        <span style={pill(color)}>{c.category}</span>
                      </div>
                      <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>{c.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{
                fontSize:12, fontWeight:700, color:"#f59e0b",
                letterSpacing:"0.08em", marginBottom:12,
                display:"flex", alignItems:"center", gap:7,
              }}>
                <span style={{ width:7,height:7,borderRadius:"50%",background:"#f59e0b",display:"inline-block" }}/>
                PENDING — {pendingConns.length} AWAITING CONFIGURATION
              </div>
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
                gap:10,
              }}>
                {pendingConns.map(c => (
                  <div key={c.id} style={{
                    ...card(),
                    padding:"16px 18px",
                    borderColor:"rgba(245,158,11,0.2)",
                    background:"rgba(245,158,11,0.04)",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8 }}>
                      <span style={{ fontSize:18 }}>{c.icon}</span>
                      <span style={{ fontWeight:600, fontSize:13 }}>{c.label}</span>
                      <span style={{ marginLeft:"auto", ...pill("#f59e0b") }}>PENDING</span>
                    </div>
                    <div style={{ fontSize:12, color:"#64748b" }}>{c.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ EVENT STREAM ════════════════════════════════════════════════════ */}
        {tab === "stream" && (
          <div>
            <div style={{
              display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap",
            }}>
              {/* Filter buttons */}
              <div style={{ display:"flex", gap:6 }}>
                {["ALL","FHIR","HL7","REST","WEBHOOK","AUTH"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding:"5px 12px",
                    background: filter===f ? "#6366f1" : "rgba(255,255,255,0.05)",
                    border:`1px solid ${filter===f?"#6366f1":"rgba(255,255,255,0.1)"}`,
                    borderRadius:6, color: filter===f ? "#fff" : "#64748b",
                    fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.15s",
                  }}>{f}</button>
                ))}
              </div>
              <span style={{
                marginLeft:"auto", fontSize:11,
                color:sseOk?"#10b981":"#f59e0b",
                display:"flex", alignItems:"center", gap:5,
              }}>
                <span style={{
                  width:6,height:6,borderRadius:"50%",
                  background:sseOk?"#10b981":"#f59e0b",display:"inline-block",
                  animation:sseOk?"pulse 2s infinite":"none",
                }}/>
                {sseOk?"SSE — live updates":"Reconnecting…"} · {filteredEvents.length} events
              </span>
            </div>

            <div ref={logRef} style={{
              ...card(), overflow:"hidden",
              maxHeight:"calc(100vh - 300px)", overflowY:"auto", scrollbarWidth:"thin",
            }}>
              {/* Table header */}
              <div style={{
                display:"grid",
                gridTemplateColumns:"88px 72px 55px 95px 1fr 52px",
                padding:"8px 14px",
                background:"rgba(255,255,255,0.04)",
                borderBottom:"1px solid rgba(255,255,255,0.06)",
                fontSize:10, fontWeight:700, color:"#475569",
                letterSpacing:"0.07em", textTransform:"uppercase", gap:8,
              }}>
                <span>Time</span><span>Type</span><span>Dir</span>
                <span>Source</span><span>Event</span><span style={{textAlign:"right"}}>ms</span>
              </div>

              {filteredEvents.length===0 ? (
                <div style={{ padding:40, textAlign:"center", color:"#475569", fontSize:13 }}>
                  No events — fire one from Trigger Events
                </div>
              ) : filteredEvents.map((ev, i) => {
                const isOpen = expanded.has(ev.id+i);
                return (
                  <div key={ev.id+i}>
                    <div
                      onClick={() => toggleExpand(ev.id+i)}
                      style={{
                        display:"grid",
                        gridTemplateColumns:"88px 72px 55px 95px 1fr 52px",
                        padding:"10px 14px",
                        borderBottom:"1px solid rgba(255,255,255,0.04)",
                        cursor:"pointer",
                        background: isOpen ? "rgba(99,102,241,0.1)" : i===0 ? "rgba(99,102,241,0.05)" : "transparent",
                        animation: i===0&&!isOpen ? "fadeIn 0.3s ease" : "none",
                        alignItems:"start", gap:8,
                        transition:"background 0.1s",
                      }}
                    >
                      <span style={{ fontSize:10, color:"#475569", fontFamily:"monospace" }}>
                        {fmt(ev.ts)}
                      </span>
                      <span style={{
                        ...pill(TYPE_COLOR[ev.type]??("#6366f1")),
                        fontSize:10, display:"inline-block",
                      }}>{ev.type}</span>
                      <span style={{
                        fontSize:11, fontWeight:700,
                        color:ev.dir==="IN"?"#10b981":"#f97316",
                      }}>{ev.dir==="IN"?"↓ IN":"↑ OUT"}</span>
                      <span>
                        {ev.industry && (
                          <span style={pill(IND_COLOR[ev.industry]??(("#6366f1")))}>
                            {ev.industry}
                          </span>
                        )}
                      </span>
                      <div>
                        <div style={{
                          fontWeight:600, fontSize:12,
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                        }}>{ev.label}</div>
                        <div style={{
                          fontSize:11, color:"#64748b",
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                        }}>{ev.summary}</div>
                      </div>
                      <span style={{
                        textAlign:"right", fontSize:11,
                        color:"#475569", fontFamily:"monospace",
                      }}>{ev.latencyMs}</span>
                    </div>

                    {/* Expanded payload */}
                    {isOpen && (
                      <div style={{
                        borderBottom:"1px solid rgba(255,255,255,0.06)",
                        background:"rgba(0,0,0,0.3)",
                        padding:"12px 14px",
                      }}>
                        <div style={{ fontSize:10, color:"#64748b", marginBottom:6 }}>
                          PAYLOAD · {ev.adapterLabel || ev.adapterId} · {ev.latencyMs}ms
                          <span style={{
                            marginLeft:10, color:"#ef4444", fontSize:10,
                          }}>⚠ SIMULATED — No real PHI · No credentials</span>
                        </div>
                        <pre style={{
                          margin:0, fontSize:10.5, lineHeight:1.6,
                          color:"#a5b4fc", fontFamily:"'JetBrains Mono','Fira Code',monospace",
                          whiteSpace:"pre-wrap", wordBreak:"break-all",
                          maxHeight:240, overflowY:"auto", scrollbarWidth:"thin",
                        }}>
                          {JSON.stringify(ev.payload ?? { label:ev.label, summary:ev.summary, type:ev.type }, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:8, fontSize:11, color:"#334155" }}>
              Click any row to expand its payload · All data is simulated · No real PHI or credentials
            </div>
          </div>
        )}

        {/* ══ TRIGGER EVENTS ══════════════════════════════════════════════════ */}
        {tab === "trigger" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ fontSize:13, color:"#64748b" }}>
              Fire simulated events through the live adapter validation pipeline.
              Each event is processed by the real adapter code and appears in the Event Stream.
              No real systems are contacted — no PHI — no credentials.
            </div>

            {/* Trigger cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
              {[
                {
                  key:"fhir", title:"FHIR R4 Patient",
                  icon:"🏥", color:"#10b981",
                  proto:"FHIR R4 · REST", dir:"Inbound",
                  desc:"Simulates an Epic EHR sending a FHIR R4 Patient resource. PHI fields are placeholder-only.",
                  adapter:"epic-fhir",
                },
                {
                  key:"hl7", title:"HL7 ADT^A01",
                  icon:"🔀", color:"#06b6d4",
                  proto:"HL7 v2.6", dir:"Inbound",
                  desc:"Simulates an admit event (ADT^A01) from a hospital system. Returns parsed segments and ACK response.",
                  adapter:undefined,
                },
                {
                  key:"rest", title:"REST Inbound",
                  icon:"🌐", color:"#6366f1",
                  proto:"REST · JSON:API", dir:"Inbound",
                  desc:"Simulates a Salesforce CRM event arriving via the REST inbound pipeline with schema validation.",
                  adapter:"salesforce",
                },
                {
                  key:"webhook", title:"Outbound Webhook",
                  icon:"🔔", color:"#f97316",
                  proto:"Webhook · HMAC-SHA256", dir:"Outbound",
                  desc:"Simulates a Stripe payment webhook dispatched with HMAC-SHA256 signature verification.",
                  adapter:"stripe",
                },
              ].map(t => (
                <div key={t.key} style={{
                  ...card(),
                  padding:"20px",
                  borderColor: triggering===t.key ? `${t.color}55` : "rgba(255,255,255,0.07)",
                  background: triggering===t.key ? `${t.color}08` : "rgba(255,255,255,0.03)",
                  transition:"all 0.2s",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:24 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:t.color }}>{t.title}</div>
                      <div style={{ display:"flex", gap:5, marginTop:3 }}>
                        <span style={pill(t.color)}>{t.proto}</span>
                        <span style={pill("#64748b","rgba(255,255,255,0.07)")}>{t.dir}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6, marginBottom:14 }}>
                    {t.desc}
                  </div>
                  <button
                    onClick={() => triggerEvent(t.key, t.adapter)}
                    disabled={!!triggering}
                    style={{
                      width:"100%",
                      padding:"10px",
                      background: triggering===t.key
                        ? `${t.color}30`
                        : `linear-gradient(135deg,${t.color}88,${t.color}60)`,
                      border:`1px solid ${t.color}55`,
                      borderRadius:8, color:"#fff",
                      fontWeight:700, fontSize:13,
                      cursor:triggering?"not-allowed":"pointer",
                      transition:"all 0.2s",
                      display:"flex", alignItems:"center",
                      justifyContent:"center", gap:8,
                    }}
                  >
                    {triggering===t.key ? (
                      <><span style={{ animation:"spin 0.8s linear infinite", display:"inline-block" }}>⟳</span> Firing…</>
                    ) : (
                      <>▶ Fire Event</>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Response panel */}
            {triggerResult && (
              <div style={{ ...card(), overflow:"hidden" }}>
                <div style={{
                  padding:"12px 16px",
                  borderBottom:"1px solid rgba(255,255,255,0.06)",
                  background:"rgba(16,185,129,0.08)",
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{ color:"#10b981", fontWeight:700, fontSize:13 }}>✓ Event Processed</span>
                  <span style={pill(TYPE_COLOR[triggerResult.type]??(("#6366f1")))}>
                    {triggerResult.type}
                  </span>
                  <span style={{
                    fontSize:11, color:triggerResult.dir==="IN"?"#10b981":"#f97316",
                    fontWeight:700,
                  }}>{triggerResult.dir==="IN"?"↓ IN":"↑ OUT"}</span>
                  <span style={{ fontSize:12, color:"#94a3b8" }}>{triggerResult.label}</span>
                  <span style={{ marginLeft:"auto", fontSize:11, color:"#475569", fontFamily:"monospace" }}>
                    {triggerResult.latencyMs}ms
                  </span>
                </div>
                <div style={{ padding:"4px 0 6px", background:"rgba(0,0,0,0.2)" }}>
                  <div style={{ padding:"6px 14px", fontSize:10, color:"#475569" }}>
                    RESPONSE PAYLOAD · {triggerResult.adapterLabel}
                    <span style={{ marginLeft:10, color:"#ef4444" }}>⚠ SIMULATED — No real PHI</span>
                  </div>
                  <pre style={{
                    margin:0, padding:"0 14px 14px",
                    fontSize:10.5, lineHeight:1.6, color:"#a5b4fc",
                    fontFamily:"'JetBrains Mono','Fira Code',monospace",
                    whiteSpace:"pre-wrap", wordBreak:"break-all",
                    maxHeight:300, overflowY:"auto", scrollbarWidth:"thin",
                  }}>
                    {JSON.stringify(triggerResult.payload ?? triggerResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Session history */}
            {sessionHistory.length > 0 && (
              <div style={{ ...card(), overflow:"hidden" }}>
                <div style={{
                  padding:"10px 16px",
                  borderBottom:"1px solid rgba(255,255,255,0.06)",
                  fontSize:12, fontWeight:700, color:"#64748b",
                }}>
                  Session History — {sessionHistory.length} event{sessionHistory.length!==1?"s":""} fired
                </div>
                {sessionHistory.map((ev, i) => (
                  <div key={ev.id+i} style={{
                    padding:"9px 16px",
                    borderBottom:"1px solid rgba(255,255,255,0.04)",
                    display:"flex", alignItems:"center", gap:10, fontSize:12,
                  }}>
                    <span style={{ color:"#10b981" }}>✓</span>
                    <span style={pill(TYPE_COLOR[ev.type]??(("#6366f1")))}>{ev.type}</span>
                    <span style={{ color:"#94a3b8", flex:1 }}>{ev.label}</span>
                    <span style={{ color:"#475569", fontFamily:"monospace", fontSize:11 }}>
                      {ev.latencyMs}ms · {fmt(ev.ts)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ COMPLIANCE ══════════════════════════════════════════════════════ */}
        {tab === "compliance" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>
              Compliance framework coverage across the integration layer. Live frameworks are actively enforced.
              Blueprint-ready frameworks have architectural controls in place pending third-party audit.
            </div>

            {(compliance.length ? compliance : [
              { framework:"FHIR R4", status:"live",            coverage:95, domains:["Patient","Encounter","Observation","MedicationRequest","DocumentReference"] },
              { framework:"HL7 v2",  status:"live",            coverage:92, domains:["ADT","ORM","ORU","ACK","QRY/QRF"] },
              { framework:"HIPAA",   status:"blueprint-ready", coverage:89, domains:["Technical Safeguards","PHI Access Controls","Audit Logging","Breach Notification"] },
              { framework:"SOC 2",   status:"blueprint-ready", coverage:74, domains:["Availability","Confidentiality","Processing Integrity","Security"] },
              { framework:"GDPR",    status:"blueprint-ready", coverage:68, domains:["Right to Erasure","Data Minimization","Consent Management","DPA"] },
              { framework:"PCI-DSS", status:"blueprint-ready", coverage:61, domains:["Cardholder Data","Transmission Encryption","Access Controls"] },
            ]).map(c => {
              const isLive  = c.status === "live";
              const color   = isLive ? "#10b981" : "#f59e0b";
              const barColor = c.coverage >= 90 ? "#10b981" : c.coverage >= 70 ? "#6366f1" : c.coverage >= 60 ? "#f59e0b" : "#ef4444";
              return (
                <div key={c.framework} style={{ ...card(), padding:"20px 24px" }}>
                  <div style={{
                    display:"flex", alignItems:"center",
                    justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8,
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontWeight:700, fontSize:16 }}>{c.framework}</span>
                      <span style={{
                        fontSize:10, fontWeight:700, borderRadius:4, padding:"2px 8px",
                        background: isLive ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                        color,
                        border:`1px solid ${color}44`,
                      }}>
                        {isLive ? "✓ LIVE" : "📐 BLUEPRINT READY"}
                      </span>
                    </div>
                    <span style={{ fontSize:22, fontWeight:800, color:barColor }}>{c.coverage}%</span>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height:6, borderRadius:3,
                    background:"rgba(255,255,255,0.08)", marginBottom:14, overflow:"hidden",
                  }}>
                    <div style={{
                      height:"100%", borderRadius:3,
                      width:`${c.coverage}%`,
                      background:`linear-gradient(90deg,${barColor}cc,${barColor})`,
                      transition:"width 0.6s ease",
                    }}/>
                  </div>

                  {/* Domains */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {c.domains.map(d => (
                      <span key={d} style={{
                        fontSize:11, borderRadius:6, padding:"4px 10px",
                        background:"rgba(255,255,255,0.05)",
                        border:"1px solid rgba(255,255,255,0.08)",
                        color:"#94a3b8",
                      }}>
                        {isLive && <span style={{ color:"#10b981", marginRight:5 }}>✓</span>}
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─ Footer ─────────────────────────────────────────────────────────── */}
      <div style={{
        borderTop:"1px solid rgba(255,255,255,0.05)",
        padding:"14px 28px", fontSize:11, color:"#334155",
        display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8,
      }}>
        <span>CreateAI Brain v3.0 · Enterprise Integration Suite · Read-only public demonstration</span>
        <span>No PHI · No credentials · No admin access · No source code · Authorized reviewer use only</span>
      </div>

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
      `}</style>
    </div>
  );
}
