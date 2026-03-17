import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppShell } from "@/components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusType = "active" | "pending" | "available";
type EventType  = "REST" | "WEBHOOK" | "FHIR" | "HL7" | "SSE" | "AUTH";
type Direction  = "IN" | "OUT";
type SimType    = "fhir-patient" | "hl7-adt" | "webhook" | "rest";

interface StatusItem {
  id: string; label: string; icon: string; status: StatusType;
  detail: string; category: string;
}
interface Stats {
  connected: number; pending: number; available: number;
  totalEndpoints: number; lastScanAt: string;
}
interface EventLog {
  id: number; ts: string; direction: Direction; type: EventType;
  system: string; status: "success" | "error" | "pending";
  summary: string; payload?: Record<string, unknown>;
}

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CFG: Record<StatusType, {
  label: string; dot: string; bg: string; border: string; text: string;
}> = {
  active:    { label: "Active",     dot: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  pending:   { label: "Pending",    dot: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  available: { label: "Available",  dot: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0", text: "#64748b" },
};

const CATEGORY_LABEL: Record<string, string> = {
  transport: "Transport",
  security:  "Security",
  compliance: "Compliance",
  auth:      "Auth",
  healthcare: "Healthcare",
  ehr:       "EHR",
};

const CATEGORY_COLOR: Record<string, string> = {
  transport:  "#6366f1",
  security:   "#dc2626",
  compliance: "#0891b2",
  auth:       "#8b5cf6",
  healthcare: "#059669",
  ehr:        "#ea580c",
};

const TYPE_CFG: Record<EventType, { bg: string; text: string }> = {
  REST:    { bg: "#eff6ff", text: "#1d4ed8" },
  WEBHOOK: { bg: "#fdf4ff", text: "#7e22ce" },
  FHIR:    { bg: "#f0fdf4", text: "#15803d" },
  HL7:     { bg: "#fff7ed", text: "#c2410c" },
  SSE:     { bg: "#fefce8", text: "#a16207" },
  AUTH:    { bg: "#faf5ff", text: "#6d28d9" },
};

const SIM_CARDS: { type: SimType; icon: string; label: string; description: string; color: string }[] = [
  { type: "fhir-patient", icon: "🏥", label: "FHIR R4 Patient",   color: "#059669",
    description: "Fire a synthetic FHIR R4 Patient resource inbound event. Generates a complete Patient bundle including name, DOB, address, and communication preferences — no real PHI." },
  { type: "hl7-adt",      icon: "📨", label: "HL7 v2 ADT^A01",   color: "#ea580c",
    description: "Simulate an HL7 v2 ADT^A01 patient admission message. Generates all required segments (MSH, EVN, PID, PV1) with synthetic identifiers." },
  { type: "webhook",      icon: "🪝", label: "Outbound Webhook",  color: "#7e22ce",
    description: "Simulate an outbound webhook dispatch for a document.created event. Shows the signed payload that would be sent to a configured endpoint URL." },
  { type: "rest",         icon: "🌐", label: "REST Inbound Event", color: "#1d4ed8",
    description: "Simulate an inbound REST API call — an observation.new event with LOINC-coded body temperature data, as would arrive from an EHR or IoMT device." },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function relTime(ts: string): string {
  const diffMs = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusCard({ item }: { item: StatusItem }) {
  const cfg = STATUS_CFG[item.status];
  const catColor = CATEGORY_COLOR[item.category] || "#6366f1";
  return (
    <div className="rounded-2xl border p-3.5 flex flex-col gap-2 transition-all"
      style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${catColor}18` }}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-gray-800 leading-tight">{item.label}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: `${catColor}15`, color: catColor }}>
              {CATEGORY_LABEL[item.category]}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{item.detail}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
        <span className="text-[11px] font-medium" style={{ color: cfg.text }}>{cfg.label}</span>
      </div>
    </div>
  );
}

function LogRow({ log }: { log: EventLog }) {
  const typeCfg = TYPE_CFG[log.type];
  const dirBg   = log.direction === "IN" ? "#f0fdf4" : "#eff6ff";
  const dirText = log.direction === "IN" ? "#15803d" : "#1d4ed8";
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b last:border-b-0 border-gray-100">
      <button
        className="w-full flex items-start gap-2.5 p-3 text-left hover:bg-gray-50/80 transition-colors"
        onClick={() => log.payload && setExpanded(!expanded)}
      >
        {/* Direction */}
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 flex-shrink-0"
          style={{ background: dirBg, color: dirText }}>{log.direction}</span>
        {/* Type */}
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5 flex-shrink-0"
          style={{ background: typeCfg.bg, color: typeCfg.text }}>{log.type}</span>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-gray-700 leading-snug">{log.summary}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{log.system} · {relTime(log.ts)}</p>
        </div>
        {/* Status */}
        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
          log.status === "success" ? "bg-green-400" : log.status === "error" ? "bg-red-400" : "bg-amber-400"
        }`} />
        {log.payload && (
          <span className="text-[10px] text-gray-400 mt-0.5 flex-shrink-0">{expanded ? "▲" : "▼"}</span>
        )}
      </button>
      {expanded && log.payload && (
        <div className="px-3 pb-3">
          <pre className="text-[10px] leading-relaxed bg-gray-900 text-green-300 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(log.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Tab = "overview" | "connected" | "pending" | "available" | "logs" | "simulate";

export function IntegrationDashboard() {
  const [tab, setTab]             = useState<Tab>("overview");
  const [items, setItems]         = useState<StatusItem[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [logs, setLogs]           = useState<EventLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [simLoading, setSimLoading]   = useState<SimType | null>(null);
  const [simResults, setSimResults]   = useState<Record<SimType, EventLog | null>>({
    "fhir-patient": null, "hl7-adt": null, webhook: null, rest: null,
  });
  const [logFilter, setLogFilter] = useState<EventType | "ALL">("ALL");
  const logsInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch dashboard
  const fetchDashboard = useCallback(async () => {
    try {
      const r = await fetch("/api/integrations/dashboard", { credentials: "include" });
      if (!r.ok) return;
      const data = await r.json() as { statusItems: StatusItem[]; stats: Stats };
      setItems(data.statusItems);
      setStats(data.stats);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const r = await fetch("/api/integrations/event-logs", { credentials: "include" });
      if (!r.ok) return;
      const data = await r.json() as { logs: EventLog[] };
      setLogs(data.logs);
    } catch { /* silent */ } finally { setLogsLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Auto-refresh logs when on logs tab
  useEffect(() => {
    if (tab === "logs") {
      fetchLogs();
      logsInterval.current = setInterval(fetchLogs, 6000);
    } else {
      if (logsInterval.current) { clearInterval(logsInterval.current); logsInterval.current = null; }
    }
    return () => { if (logsInterval.current) clearInterval(logsInterval.current); };
  }, [tab, fetchLogs]);

  const simulate = async (type: SimType) => {
    setSimLoading(type);
    try {
      const r = await fetch("/api/integrations/simulate", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!r.ok) return;
      const data = await r.json() as { ok: boolean; log: EventLog };
      setSimResults(prev => ({ ...prev, [type]: data.log }));
      // Refresh logs if on logs tab
      if (tab === "logs") fetchLogs();
    } catch { /* silent */ } finally { setSimLoading(null); }
  };

  // Filter items by tab
  const tabItems = tab === "overview"
    ? items
    : items.filter(i => i.status === (tab === "connected" ? "active" : tab === "pending" ? "pending" : "available"));

  const filteredLogs = logFilter === "ALL" ? logs : logs.filter(l => l.type === logFilter);

  // Group overview items by category
  const grouped: Record<string, StatusItem[]> = {};
  if (tab === "overview") {
    for (const item of items) {
      (grouped[item.category] ??= []).push(item);
    }
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "overview",   label: "Overview" },
    { id: "connected",  label: "Connected",  count: stats?.connected },
    { id: "pending",    label: "Pending",    count: stats?.pending },
    { id: "available",  label: "Available",  count: stats?.available },
    { id: "logs",       label: "Event Logs" },
    { id: "simulate",   label: "Simulate" },
  ];

  return (
    <AppShell>
      {/* ── Header stats ─────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:grid-cols-4">
          <StatPill value={stats.connected}      label="Connected"       color="#22c55e" />
          <StatPill value={stats.pending}        label="Pending"         color="#f59e0b" />
          <StatPill value={stats.available}      label="Available"       color="#94a3b8" />
          <StatPill value={stats.totalEndpoints} label="API Endpoints"   color="#6366f1" />
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 pt-4 overflow-x-auto pb-0.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-medium transition-all whitespace-nowrap flex-shrink-0"
            style={{
              background: tab === t.id ? "#6366f1" : "rgba(0,0,0,0.04)",
              color:      tab === t.id ? "#fff"    : "#6b7280",
            }}>
            {t.label}
            {t.count !== undefined && (
              <span className="rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold px-1"
                style={{ background: tab === t.id ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.07)" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Transport / Security bar (always visible on overview) ────────── */}
      {tab === "overview" && !loading && (
        <div className="mx-4 mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <SecurityPill icon="🔒" label="TLS 1.3" active />
            <SecurityPill icon="🔐" label="AES-256 at rest" active />
            <SecurityPill icon="🛡️" label="PHI validated" active />
            <SecurityPill icon="📋" label="Audit logging" active />
            <SecurityPill icon="👤" label="RBAC enforced" active />
            <SecurityPill icon="🍪" label="HttpOnly cookies" active />
          </div>
          {stats && (
            <p className="text-[10px] text-indigo-400 mt-2">
              Last scan: {new Date(stats.lastScanAt).toLocaleTimeString()} · {stats.connected + stats.pending + stats.available} total integration points · {stats.connected} active
            </p>
          )}
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-20">

        {/* LOADING */}
        {loading && tab !== "logs" && tab !== "simulate" && (
          <AppShell.Loading rows={6} />
        )}

        {/* OVERVIEW — grouped by category */}
        {!loading && tab === "overview" && (
          <div className="space-y-5">
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: CATEGORY_COLOR[cat] }}>
                    {CATEGORY_LABEL[cat]}
                  </span>
                  <div className="flex-1 h-px" style={{ background: `${CATEGORY_COLOR[cat]}20` }} />
                  <span className="text-[10px] text-gray-400">{catItems.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {catItems.map(item => <StatusCard key={item.id} item={item} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONNECTED / PENDING / AVAILABLE */}
        {!loading && (tab === "connected" || tab === "pending" || tab === "available") && (
          <>
            {tabItems.length === 0 ? (
              <AppShell.Empty
                icon={tab === "pending" ? "⚠️" : tab === "available" ? "🔘" : "✅"}
                title={tab === "pending" ? "No pending configurations" : tab === "available" ? "No available systems" : "No connected systems"}
                description={tab === "connected" ? "Active integrations will appear here once connected." : ""}
              />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {tabItems.map(item => (
                  <div key={item.id} className="rounded-2xl border p-4 flex flex-col gap-3"
                    style={{
                      background: STATUS_CFG[item.status].bg,
                      borderColor: STATUS_CFG[item.status].border,
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${CATEGORY_COLOR[item.category] || "#6366f1"}18` }}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800">{item.label}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.detail}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="w-1.5 h-1.5 rounded-full"
                            style={{ background: STATUS_CFG[item.status].dot }} />
                          <span className="text-[10px] font-medium"
                            style={{ color: STATUS_CFG[item.status].text }}>
                            {STATUS_CFG[item.status].label}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1">·</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: `${CATEGORY_COLOR[item.category]}15`, color: CATEGORY_COLOR[item.category] }}>
                            {CATEGORY_LABEL[item.category]}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {item.status === "active" && (
                        <button className="flex-1 h-7 rounded-lg text-[11px] font-semibold border border-green-200 text-green-700 hover:bg-green-50 transition-colors">
                          ✓ Connected
                        </button>
                      )}
                      {item.status === "pending" && (
                        <button className="flex-1 h-7 rounded-lg text-[11px] font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">
                          ⚙ Configure
                        </button>
                      )}
                      {item.status === "available" && (
                        <button className="flex-1 h-7 rounded-lg text-[11px] font-semibold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">
                          + Connect
                        </button>
                      )}
                      {item.status !== "available" && (
                        <button className="h-7 px-3 rounded-lg text-[11px] font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                          Test
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* LOGS */}
        {tab === "logs" && (
          <div>
            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[11px] text-gray-400 font-medium">Filter:</span>
              {(["ALL", "REST", "FHIR", "HL7", "WEBHOOK", "SSE", "AUTH"] as (EventType | "ALL")[]).map(t => (
                <button key={t} onClick={() => setLogFilter(t)}
                  className="h-6 px-2.5 rounded-lg text-[10px] font-semibold transition-colors"
                  style={{
                    background: logFilter === t ? "#6366f1" : "rgba(0,0,0,0.05)",
                    color:      logFilter === t ? "#fff"    : "#6b7280",
                  }}>
                  {t}
                </button>
              ))}
              <div className="flex-1" />
              <button onClick={fetchLogs}
                className="h-6 px-2.5 rounded-lg text-[10px] font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                {logsLoading ? "…" : "↻ Refresh"}
              </button>
              <button onClick={() => setLogs([])}
                className="h-6 px-2.5 rounded-lg text-[10px] font-medium border border-gray-200 text-gray-400 hover:text-red-400 transition-colors">
                Clear
              </button>
            </div>

            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-gray-400">Live · refreshes every 6 seconds</span>
            </div>

            {/* Log table */}
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-gray-400">No events yet — fire a simulation or use the platform to generate events.</p>
                </div>
              ) : (
                filteredLogs.map(log => <LogRow key={log.id} log={log} />)
              )}
            </div>
          </div>
        )}

        {/* SIMULATE */}
        {tab === "simulate" && (
          <div>
            {/* Warning banner */}
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 flex gap-3">
              <span className="text-xl flex-shrink-0">🧪</span>
              <div>
                <p className="text-[12px] font-semibold text-amber-800">Simulation Mode — No Real PHI</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  All events use fully synthetic data. No real patient identifiers, no real endpoints contacted.
                  Results are logged to the Event Log panel for review.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SIM_CARDS.map(card => {
                const result = simResults[card.type];
                const isLoading = simLoading === card.type;
                return (
                  <div key={card.type} className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: `${card.color}15` }}>
                        {card.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800">{card.label}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{card.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => simulate(card.type)}
                      disabled={isLoading}
                      className="h-9 rounded-xl text-[12px] font-semibold transition-all"
                      style={{
                        background: isLoading ? "#e5e7eb" : card.color,
                        color:      isLoading ? "#9ca3af" : "#fff",
                      }}>
                      {isLoading ? "Firing…" : `↯ Fire ${card.label}`}
                    </button>
                    {result && (
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-[10px] font-semibold text-gray-600">Result — {relTime(result.ts)}</span>
                        </div>
                        <div className="p-2.5 bg-gray-50">
                          <p className="text-[11px] text-gray-700 font-medium mb-2">{result.summary}</p>
                          {result.payload && (
                            <pre className="text-[9.5px] leading-relaxed bg-gray-900 text-green-300 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap max-h-48">
                              {JSON.stringify(result.payload, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Inline sub-components ────────────────────────────────────────────────────
function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-2xl border p-3 text-center" style={{ background: `${color}08`, borderColor: `${color}20` }}>
      <p className="text-[22px] font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}

function SecurityPill({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{
        background: active ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.12)",
        color:      active ? "#15803d"               : "#64748b",
      }}>
      <span>{icon}</span>
      <span>{label}</span>
      {active && <span className="text-green-500">✓</span>}
    </div>
  );
}
