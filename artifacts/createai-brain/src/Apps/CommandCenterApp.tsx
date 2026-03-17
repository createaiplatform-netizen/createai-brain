import React, { useState, useRef, useEffect } from "react";
import { useOS } from "@/os/OSContext";
import type { AppId } from "@/os/OSContext";
import {
  PLATFORM_SYSTEMS, PLATFORM_STATS, AUTO_WIRE_RULE, REPLICATION_PROTECTION,
  FOUNDER_EXECUTION_CONFIG,
  parseMessageIntent, loadFounderState, getExecutionModeStatus,
  type OutboundMessage,
} from "@/engine/FounderTier";

type Tab = "command" | "status" | "protect" | "autowire" | "system" | "expand";

interface CommandLog {
  id: string;
  input: string;
  result: string;
  routed?: string;
  ts: string;
  type: "route" | "message" | "info" | "error";
}

const COMMAND_HINTS = [
  { label: "open brainhub",           desc: "Launch Brain Hub" },
  { label: "open chat",               desc: "Open AI Chat" },
  { label: "send to Team: stand-up at 9am", desc: "Auto-send internal message" },
  { label: "email Sara: project update",    desc: "Auto-send email (Founder)" },
  { label: "open projects",           desc: "Go to Projects" },
  { label: "open marketing",          desc: "Go to Marketing" },
  { label: "open admin",              desc: "Open Admin" },
  { label: "open simulation",         desc: "Open Simulation" },
  { label: "open opportunity",        desc: "Open Opportunities" },
  { label: "status",                  desc: "Show platform status" },
];

export function CommandCenterApp() {
  const { openApp, routeIntent } = useOS();
  const [activeTab, setActiveTab] = useState<Tab>("command");
  const [input, setInput]         = useState("");
  const execStatus = getExecutionModeStatus();
  const [logs, setLogs]           = useState<CommandLog[]>([
    { id: "boot-exec", input: "SYSTEM", result: `FOUNDER-TIER FULL EXECUTION MODE — ACTIVE. ${execStatus.disabledModes.join(", ")} disabled. All instructions execute directly. Messages delivered internally. No confirmation required.`, ts: new Date().toISOString(), type: "info" },
    { id: "boot-sys",  input: "SYSTEM", result: "All 19 systems online. 100+ engines at full capacity. Expansion Engine active. Command Center ready.", ts: new Date().toISOString(), type: "info" },
  ]);
  const [sentMessages, setSentMessages] = useState<OutboundMessage[]>([]);
  const [isExecuting, setIsExecuting]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const founder = loadFounderState();

  // ── System Command Processor state ──────────────────────────────────────
  interface SysLog {
    id: string; ts: string; kind: "input" | "output" | "log" | "error" | "ok";
    text: string;
  }
  const [sysInput, setSysInput]   = useState("");
  const [sysLogs, setSysLogs]     = useState<SysLog[]>([
    { id: "boot-exec", ts: new Date().toISOString(), kind: "ok", text: "FOUNDER-TIER FULL EXECUTION MODE — ACTIVE (FOUNDER-EXEC-1.0)" },
    { id: "boot-dis",  ts: new Date().toISOString(), kind: "ok", text: "Disabled: Demo Mode · Preview Mode · Mock Mode · Staging Mode · Limited Mode · Sandbox Mode" },
    { id: "boot-msg",  ts: new Date().toISOString(), kind: "ok", text: "Messaging: internal delivery · no confirmation · no drafts · all sends logged" },
    { id: "boot-sys",  ts: new Date().toISOString(), kind: "ok", text: "System Command Processor v1 — 10 handlers · 19 systems · full capacity. Type a command or 'help'." },
  ]);
  const [sysRunning, setSysRunning] = useState(false);
  const [registryStats, setRegistryStats] = useState<{ total: number; active: number; integrated: number; protected: number } | null>(null);
  const sysEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sysEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [sysLogs]);

  // ── Expansion Engine state ──────────────────────────────────────────────
  interface ExpandLog {
    id: string; ts: string;
    kind: "init" | "generate" | "evaluate" | "execute" | "optimize" | "protect" | "complete" | "warn" | "error";
    action: string; target: string; detail: string;
  }
  interface ExpandSummary {
    idea: string; status: string; totalIterations: number;
    totalPaths: number; viablePaths: number; executedPaths: number;
    newRegistryItems: number; totalRegistrySize: number;
    protectionsApplied: number; optimizations: number;
    startedAt: string; completedAt: string;
  }
  const [expandIdea, setExpandIdea]     = useState("");
  const [expandRunning, setExpandRunning] = useState(false);
  const [expandLog, setExpandLog]       = useState<ExpandLog[]>([]);
  const [expandSummary, setExpandSummary] = useState<ExpandSummary | null>(null);
  const [expandError, setExpandError]   = useState<string | null>(null);
  const expandEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { expandEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [expandLog]);

  const EXPAND_QUICK_IDEAS = [
    "Customer analytics dashboard with real-time metrics",
    "Automated invoice generation and payment tracking",
    "Team collaboration and task management system",
    "AI-powered content calendar and marketing automation",
    "Compliance audit trail and regulatory reporting",
    "Multi-channel notification and alert engine",
    "Document versioning and approval workflows",
    "Revenue forecasting and financial modeling engine",
  ];

  function kindToColor(kind: ExpandLog["kind"]): string {
    const map: Record<string, string> = {
      init:     "#818cf8", generate: "#a78bfa", evaluate: "#94a3b8",
      execute:  "#22c55e", optimize: "#f59e0b",  protect:  "#6366f1",
      complete: "#22c55e", warn:     "#f59e0b",   error:    "#ef4444",
    };
    return map[kind] ?? "#94a3b8";
  }

  function kindToIcon(kind: ExpandLog["kind"]): string {
    const map: Record<string, string> = {
      init:     "⚙",  generate: "🔀", evaluate: "📊",
      execute:  "▶",  optimize: "✦",  protect:  "🛡",
      complete: "✓",  warn:     "⚠",  error:    "✕",
    };
    return map[kind] ?? "·";
  }

  function logKindFromAction(action: string): ExpandLog["kind"] {
    if (action.includes("init"))     return "init";
    if (action.includes("generate")) return "generate";
    if (action.includes("evaluate")) return "evaluate";
    if (action.includes("execute") || action.includes("step") || action.includes("register") ||
        action.includes("activate") || action.includes("integrate") || action.includes("document") ||
        action.includes("inherit"))  return "execute";
    if (action.includes("optim"))    return "optimize";
    if (action.includes("protect"))  return "protect";
    if (action.includes("complete")) return "complete";
    if (action.includes("warn") || action.includes("skip")) return "warn";
    return "evaluate";
  }

  async function runExpansion() {
    const trimmed = expandIdea.trim();
    if (!trimmed || expandRunning) return;
    setExpandRunning(true);
    setExpandLog([]);
    setExpandSummary(null);
    setExpandError(null);

    const boot: ExpandLog = {
      id: "boot", ts: new Date().toISOString(), kind: "init",
      action: "expand:init", target: trimmed,
      detail: `Expansion Engine initializing — idea: "${trimmed}"`,
    };
    setExpandLog([boot]);

    try {
      const res = await fetch("/api/system/expand", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: trimmed }),
      });
      const data = await res.json() as {
        ok?: boolean;
        summary?: {
          idea: string; status: string; totalIterations: number;
          totalPaths: number; viablePaths: number; executedPaths: number;
          newRegistryItems: number; totalRegistrySize: number;
          protectionsApplied: number; optimizations: number;
          startedAt: string; completedAt: string;
          log: Array<{ ts: string; action: string; target: string; status: string; detail: string }>;
        };
        error?: string;
      };

      if (!res.ok || data.error || !data.summary) {
        setExpandError(data.error ?? "Expansion failed — unknown error");
        return;
      }

      const logs: ExpandLog[] = (data.summary.log ?? []).map((entry, i) => ({
        id: `${i}-${entry.ts}`,
        ts: entry.ts,
        kind: logKindFromAction(entry.action),
        action: entry.action,
        target: entry.target,
        detail: entry.detail,
      }));
      setExpandLog(logs);
      setExpandSummary({
        idea:              data.summary.idea,
        status:            data.summary.status,
        totalIterations:   data.summary.totalIterations,
        totalPaths:        data.summary.totalPaths,
        viablePaths:       data.summary.viablePaths,
        executedPaths:     data.summary.executedPaths,
        newRegistryItems:  data.summary.newRegistryItems,
        totalRegistrySize: data.summary.totalRegistrySize,
        protectionsApplied: data.summary.protectionsApplied,
        optimizations:     data.summary.optimizations,
        startedAt:         data.summary.startedAt,
        completedAt:       data.summary.completedAt,
      });
    } catch (err) {
      setExpandError(`Network error: ${String(err)}`);
    } finally {
      setExpandRunning(false);
    }
  }

  // Fetch registry stats when System tab opens
  useEffect(() => {
    if (activeTab !== "system") return;
    fetch("/api/system/health", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((d: { registrySize?: number; activeItems?: number } | null) => {
        if (d) setRegistryStats({ total: d.registrySize ?? 0, active: d.activeItems ?? 0, integrated: d.activeItems ?? 0, protected: d.activeItems ?? 0 });
      })
      .catch(() => {});
  }, [activeTab]);

  function addSysLog(kind: SysLog["kind"], text: string) {
    setSysLogs(prev => [...prev, { id: Date.now().toString() + Math.random(), ts: new Date().toISOString(), kind, text }]);
  }

  async function executeSysCmd(instruction: string) {
    const trimmed = instruction.trim();
    if (!trimmed) return;
    setSysInput("");
    setSysRunning(true);
    addSysLog("input", `> ${trimmed}`);

    try {
      const res = await fetch("/api/system/command", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: trimmed }),
      });
      const data = await res.json() as {
        ok?: boolean;
        instruction?: string;
        totalActions?: number;
        results?: Array<{ action: string; status: string; message: string; logs: string[] }>;
        error?: string;
      };

      if (!res.ok || data.error) {
        addSysLog("error", `✗ Error: ${data.error ?? "Unknown error"}`);
        return;
      }

      addSysLog("ok", `✓ Executed: "${data.instruction}" — ${data.totalActions ?? 0} action(s)`);

      for (const result of data.results ?? []) {
        const icon = result.status === "executed" ? "✓" : result.status === "rejected" ? "✗" : "~";
        addSysLog(result.status === "rejected" ? "error" : "output", `${icon} [${result.action}] ${result.message}`);
        for (const line of result.logs ?? []) {
          addSysLog("log", line);
        }
      }

      // Refresh registry stats after command
      fetch("/api/system/health", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then((d: { registrySize?: number; activeItems?: number } | null) => {
          if (d) setRegistryStats({ total: d.registrySize ?? 0, active: d.activeItems ?? 0, integrated: d.activeItems ?? 0, protected: d.activeItems ?? 0 });
        })
        .catch(() => {});
    } catch (err) {
      addSysLog("error", `✗ Network error: ${String(err)}`);
    } finally {
      setSysRunning(false);
    }
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function addLog(log: Omit<CommandLog, "id" | "ts">) {
    setLogs(prev => [...prev, { ...log, id: Date.now().toString(), ts: new Date().toISOString() }]);
  }

  function executeCommand(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    setInput("");
    setIsExecuting(true);

    setTimeout(() => {
      const lower = trimmed.toLowerCase();

      if (lower === "status" || lower === "platform status") {
        addLog({ input: trimmed, result: `Platform fully online. 18/18 systems active. 122 apps registered. 100+ engines online. Replication guard active.`, type: "info" });
        setActiveTab("status");
        setIsExecuting(false);
        return;
      }

      if (lower === "protect" || lower === "protection") {
        addLog({ input: trimmed, result: "Replication protection active. Non-founder access blocked.", type: "info" });
        setActiveTab("protect");
        setIsExecuting(false);
        return;
      }

      if (lower === "autowire" || lower === "auto-wire" || lower === "auto wire") {
        addLog({ input: trimmed, result: "Auto-wire system active. 9 rules enforced globally.", type: "info" });
        setActiveTab("autowire");
        setIsExecuting(false);
        return;
      }

      const msg = parseMessageIntent(trimmed);
      if (msg) {
        setSentMessages(prev => [msg, ...prev]);
        addLog({
          input: trimmed,
          result: `✓ DELIVERED [${msg.channel.toUpperCase()}] → "${msg.to}": "${msg.body}" — Full Execution Mode · Internal delivery · No confirmation · Logged at ${new Date(msg.deliveredAt).toLocaleTimeString()}.`,
          type: "message",
        });
        setIsExecuting(false);
        return;
      }

      const openMatch = lower.match(/^open\s+(.+)/);
      if (openMatch) {
        const target = openMatch[1].trim();
        const appId = routeIntent(target);
        if (appId) {
          addLog({ input: trimmed, result: `Routing to "${appId}" → opening now.`, routed: appId, type: "route" });
          setTimeout(() => openApp(appId as AppId), 400);
        } else {
          addLog({ input: trimmed, result: `No app matched "${target}". Try a different name.`, type: "error" });
        }
        setIsExecuting(false);
        return;
      }

      const appId = routeIntent(trimmed);
      if (appId) {
        addLog({ input: trimmed, result: `Intent matched → "${appId}". Opening now.`, routed: appId, type: "route" });
        setTimeout(() => openApp(appId as AppId), 400);
        setIsExecuting(false);
        return;
      }

      addLog({ input: trimmed, result: `Command processed. No direct route found — try "open [app name]" or "send [message]".`, type: "info" });
      setIsExecuting(false);
    }, 320);
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") executeCommand(input);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "command",  label: "Command",    icon: "🎛️" },
    { id: "status",   label: "Systems",    icon: "🟢" },
    { id: "protect",  label: "Protection", icon: "🛡️" },
    { id: "autowire", label: "Auto-Wire",  icon: "🔗" },
    { id: "system",   label: "Sys Cmd",    icon: "⚡" },
    { id: "expand",   label: "Expand",     icon: "🚀" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#0a0e1a" }}>

      {/* ── Founder Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        borderBottom: "1px solid rgba(99,102,241,0.3)",
        padding: "20px 24px 16px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: 20, flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#a5b4fc" }}>FOUNDER TIER</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
            background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 20, flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse-green 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#86efac" }}>19 SYSTEMS ONLINE</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
            background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.3)",
            borderRadius: 20, flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#eab308", boxShadow: "0 0 6px #eab308", display: "inline-block" }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#fde047" }}>EXEC MODE: FULL</span>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2, margin: "0 0 4px" }}>
          Command Center
        </h1>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
          {founder.founderName} · Platform OS v{founder.buildVersion} · Full operator access
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
          {PLATFORM_STATS.map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, minWidth: 0,
            }}>
              <span style={{ fontSize: 13 }}>{s.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: "flex", gap: 2, padding: "0 16px",
        background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0, overflowX: "auto",
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 14px",
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.01em", whiteSpace: "nowrap",
              color: activeTab === t.id ? "#a5b4fc" : "#475569",
              borderBottom: activeTab === t.id ? "2px solid #6366f1" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>

        {/* Command Tab */}
        {activeTab === "command" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 400 }}>

            {/* Log area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              {logs.map(log => (
                <div key={log.id} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {log.input !== "SYSTEM" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#a5b4fc", fontFamily: "monospace", fontWeight: 600 }}>▶ CMD</span>
                      <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{log.input}</span>
                    </div>
                  )}
                  <div style={{
                    display: "flex", gap: 8, alignItems: "flex-start",
                    padding: "6px 10px", borderRadius: 6,
                    background: log.type === "error" ? "rgba(239,68,68,0.08)" :
                                log.type === "message" ? "rgba(34,197,94,0.08)" :
                                log.type === "route" ? "rgba(99,102,241,0.08)" :
                                "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      log.type === "error" ? "rgba(239,68,68,0.15)" :
                      log.type === "message" ? "rgba(34,197,94,0.15)" :
                      log.type === "route" ? "rgba(99,102,241,0.15)" :
                      "rgba(255,255,255,0.05)"
                    }`,
                  }}>
                    <span style={{ fontSize: 11, color: "#334155", fontFamily: "monospace", flexShrink: 0, marginTop: 1 }}>
                      {log.type === "error" ? "✕" : log.type === "message" ? "✉" : log.type === "route" ? "→" : "•"}
                    </span>
                    <span style={{
                      fontSize: 12, lineHeight: 1.5, fontFamily: "monospace",
                      color: log.type === "error" ? "#f87171" :
                             log.type === "message" ? "#86efac" :
                             log.type === "route" ? "#a5b4fc" : "#94a3b8",
                    }}>
                      {log.result}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", paddingLeft: 2 }}>
                    {new Date(log.ts).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {isExecuting && (
                <div style={{ display: "flex", gap: 4, padding: "8px 0", alignItems: "center" }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 5, height: 5, borderRadius: "50%", background: "#6366f1",
                      animation: `bounce 0.8s infinite ${i * 0.15}s`,
                    }} />
                  ))}
                </div>
              )}
              <div ref={logEndRef} />
            </div>

            {/* Hints */}
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap",
              background: "#0d1117",
            }}>
              {COMMAND_HINTS.slice(0, 6).map(h => (
                <button
                  key={h.label}
                  onClick={() => { setInput(h.label); inputRef.current?.focus(); }}
                  title={h.desc}
                  style={{
                    padding: "3px 8px", borderRadius: 5,
                    background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)",
                    fontSize: 10, color: "#818cf8", cursor: "pointer", fontFamily: "monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h.label}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", background: "#0d1117",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, color: "#6366f1", fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>⌘</span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a command or natural language instruction…"
                autoFocus
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: 13, color: "#e2e8f0", fontFamily: "monospace",
                  caretColor: "#6366f1",
                }}
              />
              <button
                onClick={() => executeCommand(input)}
                disabled={!input.trim() || isExecuting}
                style={{
                  padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: input.trim() ? "#6366f1" : "rgba(99,102,241,0.2)",
                  color: input.trim() ? "#fff" : "#4b5563",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
                  transition: "all 0.15s", flexShrink: 0,
                }}
              >
                RUN
              </button>
            </div>

            {/* Delivery log */}
            {sentMessages.length > 0 && (
              <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(34,197,94,0.1)", background: "#0d1117" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>
                    Internal Delivery Log — Full Execution Mode
                  </p>
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}>
                    NO CONFIRM · NO DRAFT · {sentMessages.length} DELIVERED
                  </span>
                </div>
                {sentMessages.slice(0, 4).map((m) => (
                  <div key={m.id} style={{
                    display: "flex", gap: 8, alignItems: "center", marginBottom: 5, padding: "5px 8px",
                    background: "rgba(34,197,94,0.05)", borderRadius: 6, border: "1px solid rgba(34,197,94,0.12)",
                  }}>
                    <span style={{ fontSize: 10, color: "#22c55e", flexShrink: 0 }}>✓ DELIVERED</span>
                    <span style={{ fontSize: 9, color: "#475569", flexShrink: 0 }}>[{m.channel.toUpperCase()}]</span>
                    <span style={{ fontSize: 11, color: "#86efac" }}>→ {m.to}</span>
                    <span style={{ color: "#334155" }}>·</span>
                    <span style={{ fontSize: 11, color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.body}</span>
                    <span style={{ fontSize: 9, color: "#334155", flexShrink: 0 }}>{new Date(m.deliveredAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status Tab */}
        {activeTab === "status" && (
          <div style={{ padding: "16px" }}>

            {/* Execution Mode Banner */}
            <div style={{
              padding: "12px 14px", marginBottom: 16,
              background: "linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(99,102,241,0.08) 100%)",
              border: "1px solid rgba(234,179,8,0.25)", borderRadius: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14 }}>🚀</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fde047" }}>FOUNDER-TIER FULL EXECUTION MODE — ACTIVE</span>
                <span style={{ padding: "2px 8px", borderRadius: 10, background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", fontSize: 9, color: "#fde047", fontWeight: 700 }}>FOUNDER-EXEC-1.0</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 6 }}>
                {Object.entries(FOUNDER_EXECUTION_CONFIG.rules).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 10, color: val ? "#86efac" : "#f87171" }}>
                    <span>{val ? "✓" : "✗"}</span>
                    <span style={{ color: "#94a3b8" }}>{key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {Object.keys(FOUNDER_EXECUTION_CONFIG.disabled).map(mode => (
                  <span key={mode} style={{ padding: "2px 8px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 9, color: "#f87171", fontWeight: 600 }}>
                    ✗ {mode.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Platform Systems</h3>
              <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>19/19 systems online · Founder Tier · Full execution capacity</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              {PLATFORM_SYSTEMS.map(sys => (
                <div key={sys.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8, borderLeft: "3px solid #22c55e",
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{sys.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sys.label}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 4px #22c55e" }} />
                      <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, letterSpacing: "0.06em" }}>ONLINE</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Protection Tab */}
        {activeTab === "protect" && (
          <div style={{ padding: "16px" }}>
            <div style={{
              padding: "12px 14px", background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, marginBottom: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span>🛡️</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>Replication Guard — Active</span>
                <span style={{ marginLeft: "auto", padding: "2px 7px", borderRadius: 10, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", fontSize: 9, color: "#86efac", fontWeight: 700 }}>LOCKED</span>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                No other user can view, copy, export, clone, or reconstruct the Brain, engines, modules, series, or system architecture. Applied globally across all platforms.
              </p>
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.08em", margin: "0 0 8px", textTransform: "uppercase" }}>
                  Founder-Only (Locked)
                </p>
                {REPLICATION_PROTECTION.founderOnly.map((item, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6,
                    padding: "7px 10px", background: "rgba(99,102,241,0.05)", borderRadius: 6,
                    border: "1px solid rgba(99,102,241,0.10)",
                  }}>
                    <span style={{ fontSize: 10, color: "#6366f1", flexShrink: 0, marginTop: 1 }}>🔐</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.08em", margin: "0 0 8px", textTransform: "uppercase" }}>
                  Non-Founder Ceiling
                </p>
                {REPLICATION_PROTECTION.nonFounderCeiling.map((item, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6,
                    padding: "7px 10px", background: "rgba(245,158,11,0.05)", borderRadius: 6,
                    border: "1px solid rgba(245,158,11,0.10)",
                  }}>
                    <span style={{ fontSize: 10, color: "#f59e0b", flexShrink: 0, marginTop: 1 }}>⛔</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto-Wire Tab */}
        {activeTab === "autowire" && (
          <div style={{ padding: "16px" }}>
            <div style={{
              padding: "12px 14px", background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, marginBottom: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span>🔗</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#86efac" }}>{AUTO_WIRE_RULE.title}</span>
                <span style={{ marginLeft: "auto", padding: "2px 7px", borderRadius: 10, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", fontSize: 9, color: "#86efac", fontWeight: 700 }}>ENFORCED</span>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                All new engines, modules, series, workflows, routes, schemas, and UI components created on this platform self-wire, self-register, and self-activate automatically. No manual steps required.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {AUTO_WIRE_RULE.rules.map((rule, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "10px 12px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
                  borderLeft: "3px solid #22c55e",
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: "50%", background: "rgba(34,197,94,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: "#22c55e", flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{rule}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#22c55e", flexShrink: 0, fontWeight: 700 }}>✓</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 16, padding: "12px 14px",
              background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", margin: "0 0 6px" }}>Unlimited Growth — No Ceilings</p>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Founder Tier grants unlimited project generation, multi-artifact creation, Brain expansion, engine creation, module depth, schema growth, and system-level capabilities — within legal and safety boundaries. No caps or restrictions apply to this account.
              </p>
            </div>
          </div>
        )}

        {/* ── System Command Processor Tab ── */}
        {activeTab === "system" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>

            {/* Header bar */}
            <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.07)", borderBottom: "1px solid rgba(99,102,241,0.15)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>⚡ System Command Processor</span>
                <span style={{ fontSize: 9, padding: "2px 8px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 10, color: "#818cf8", fontWeight: 700, letterSpacing: "0.07em" }}>FOUNDER ONLY</span>
                {registryStats && (
                  <span style={{ fontSize: 9, marginLeft: "auto", color: "#64748b" }}>
                    Registry: {registryStats.total} items · {registryStats.active} active
                  </span>
                )}
              </div>
              <p style={{ fontSize: 10, color: "#475569", margin: "4px 0 0" }}>
                Natural language → internal platform action. Commands route through 9 handler types automatically.
              </p>
            </div>

            {/* Quick command pills */}
            <div style={{ padding: "10px 16px", background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0, overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                {[
                  "help",
                  "status",
                  "activate all engines",
                  "register new module Analytics",
                  "protect all systems",
                  "integrate all",
                  "founder tier",
                  "inherit ui rules",
                  "update state",
                ].map(cmd => (
                  <button key={cmd} onClick={() => executeSysCmd(cmd)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(99,102,241,0.2)",
                      background: "rgba(99,102,241,0.06)", color: "#818cf8", fontSize: 10, fontWeight: 600,
                      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit",
                    }}>
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal output */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "12px 16px", fontFamily: "monospace",
              background: "#060a14", display: "flex", flexDirection: "column", gap: 3,
              fontSize: 11, lineHeight: 1.6,
            }}>
              {sysLogs.map(log => {
                const color = log.kind === "input" ? "#7dd3fc"
                  : log.kind === "ok" ? "#86efac"
                  : log.kind === "error" ? "#fca5a5"
                  : log.kind === "output" ? "#c4b5fd"
                  : "#64748b";
                return (
                  <div key={log.id} style={{ color, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#374151", flexShrink: 0, fontSize: 9, paddingTop: 2 }}>
                      {new Date(log.ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span style={{ wordBreak: "break-word", flex: 1 }}>{log.text}</span>
                  </div>
                );
              })}
              {sysRunning && (
                <div style={{ color: "#f59e0b", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#374151", fontSize: 9 }}>
                    {new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  <span>Processing…</span>
                  <span style={{ animation: "bounce 1s infinite" }}>⟳</span>
                </div>
              )}
              <div ref={sysEndRef} />
            </div>

            {/* Input bar */}
            <div style={{
              padding: "10px 16px", background: "#0d1117", borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex", gap: 8, flexShrink: 0,
            }}>
              <input
                value={sysInput}
                onChange={e => setSysInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !sysRunning) executeSysCmd(sysInput); }}
                placeholder="enter system command… (try 'help' or 'activate all engines')"
                disabled={sysRunning}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 12, fontFamily: "monospace",
                  outline: "none", minWidth: 0,
                }}
              />
              <button
                onClick={() => executeSysCmd(sysInput)}
                disabled={sysRunning || !sysInput.trim()}
                style={{
                  padding: "8px 14px", borderRadius: 8, background: sysRunning ? "rgba(99,102,241,0.2)" : "#6366f1",
                  border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: sysRunning ? "not-allowed" : "pointer",
                  flexShrink: 0, fontFamily: "inherit",
                }}>
                {sysRunning ? "…" : "▶"}
              </button>
              <button
                onClick={() => setSysLogs([{ id: "clear", ts: new Date().toISOString(), kind: "ok", text: "Terminal cleared." }])}
                style={{
                  padding: "8px 10px", borderRadius: 8, background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)", color: "#475569", fontSize: 11,
                  cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
                }}>
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* ── Expansion Engine Tab ── */}
        {activeTab === "expand" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(99,102,241,0.15)", background: "rgba(99,102,241,0.07)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>🚀 Expansion Engine</span>
                <span style={{ fontSize: 9, padding: "2px 8px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 10, color: "#818cf8", fontWeight: 700, letterSpacing: "0.07em" }}>FOUNDER ONLY</span>
              </div>
              <p style={{ fontSize: 11, color: "#475569", margin: "4px 0 0" }}>
                Enter any idea. The engine expands it to the maximum safe, legal, compliant extent across all platform layers — automatically.
              </p>
            </div>

            {/* Idea input area */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "#0d1117" }}>
              <textarea
                value={expandIdea}
                onChange={e => setExpandIdea(e.target.value)}
                disabled={expandRunning}
                placeholder="Describe any idea, feature, or concept to expand…&#10;e.g. &quot;Customer analytics dashboard with real-time metrics and AI forecasting&quot;"
                rows={3}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10,
                  padding: "10px 12px", color: "#e2e8f0", fontSize: 13,
                  fontFamily: "inherit", lineHeight: 1.5, resize: "vertical",
                  outline: "none", boxSizing: "border-box",
                }}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) runExpansion(); }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <button
                  onClick={runExpansion}
                  disabled={!expandIdea.trim() || expandRunning}
                  style={{
                    padding: "9px 20px", borderRadius: 9, border: "none",
                    background: expandIdea.trim() && !expandRunning ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(99,102,241,0.2)",
                    color: expandIdea.trim() && !expandRunning ? "#fff" : "#4b5563",
                    fontSize: 13, fontWeight: 700, cursor: expandIdea.trim() && !expandRunning ? "pointer" : "not-allowed",
                    letterSpacing: "0.02em", transition: "all 0.15s", flexShrink: 0,
                  }}
                >
                  {expandRunning ? "Expanding…" : "🚀 Expand to Limit"}
                </button>
                {expandLog.length > 0 && !expandRunning && (
                  <button
                    onClick={() => { setExpandLog([]); setExpandSummary(null); setExpandError(null); setExpandIdea(""); }}
                    style={{
                      padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)",
                      background: "transparent", color: "#475569", fontSize: 12, cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                )}
                <span style={{ fontSize: 10, color: "#334155", marginLeft: "auto" }}>⌘+Enter to run</span>
              </div>

              {/* Quick ideas */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                {EXPAND_QUICK_IDEAS.slice(0, 4).map(idea => (
                  <button
                    key={idea}
                    onClick={() => setExpandIdea(idea)}
                    style={{
                      padding: "3px 9px", borderRadius: 5, fontSize: 10, cursor: "pointer",
                      background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)",
                      color: "#6366f1", whiteSpace: "nowrap",
                    }}
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            {/* Expansion log */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 2 }}>

              {expandError && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, marginBottom: 8,
                }}>
                  ✕ {expandError}
                </div>
              )}

              {expandLog.length === 0 && !expandRunning && !expandError && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#334155", fontSize: 12 }}>
                  Enter an idea above and click "Expand to Limit" to begin.
                </div>
              )}

              {expandRunning && expandLog.length === 0 && (
                <div style={{ display: "flex", gap: 4, padding: "16px 0", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#818cf8" }}>Initializing expansion pipeline</span>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", animation: `bounce 0.8s infinite ${i * 0.15}s`, display: "inline-block" }} />
                  ))}
                </div>
              )}

              {expandLog.map(entry => (
                <div key={entry.id} style={{
                  display: "flex", gap: 8, alignItems: "flex-start",
                  padding: "3px 6px", borderRadius: 4,
                  background: entry.kind === "complete" ? "rgba(34,197,94,0.06)" :
                              entry.kind === "error"    ? "rgba(239,68,68,0.06)" :
                              entry.kind === "warn"     ? "rgba(245,158,11,0.05)" :
                              entry.kind === "execute"  ? "rgba(99,102,241,0.04)" : "transparent",
                }}>
                  <span style={{ fontSize: 10, flexShrink: 0, color: kindToColor(entry.kind), fontFamily: "monospace", marginTop: 1, minWidth: 12, textAlign: "center" }}>
                    {kindToIcon(entry.kind)}
                  </span>
                  <span style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", flexShrink: 0, marginTop: 2, whiteSpace: "nowrap" }}>
                    {new Date(entry.ts).toLocaleTimeString()}
                  </span>
                  <span style={{ fontSize: 10, color: kindToColor(entry.kind), fontFamily: "monospace", flexShrink: 0, whiteSpace: "nowrap", fontWeight: 600 }}>
                    [{entry.action}]
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", lineHeight: 1.4, flex: 1, wordBreak: "break-word" }}>
                    {entry.detail}
                  </span>
                </div>
              ))}

              {expandRunning && expandLog.length > 0 && (
                <div style={{ display: "flex", gap: 4, padding: "8px 0", alignItems: "center", paddingLeft: 6 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", animation: `bounce 0.8s infinite ${i * 0.15}s`, display: "inline-block" }} />
                  ))}
                  <span style={{ fontSize: 10, color: "#475569", marginLeft: 4 }}>Expanding…</span>
                </div>
              )}

              <div ref={expandEndRef} />
            </div>

            {/* Expansion summary card */}
            {expandSummary && (
              <div style={{
                margin: "0 16px 14px", padding: "12px 14px",
                background: expandSummary.status === "completed"
                  ? "rgba(34,197,94,0.07)" : "rgba(245,158,11,0.07)",
                border: `1px solid ${expandSummary.status === "completed" ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
                borderRadius: 12, flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 14 }}>{expandSummary.status === "completed" ? "✓" : "⚠"}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: expandSummary.status === "completed" ? "#22c55e" : "#f59e0b" }}>
                    Expansion {expandSummary.status === "completed" ? "Complete" : "Partial"} — "{expandSummary.idea.slice(0, 60)}{expandSummary.idea.length > 60 ? "…" : ""}"
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                  {[
                    { label: "Iterations",       value: expandSummary.totalIterations,   color: "#818cf8" },
                    { label: "Paths Explored",   value: expandSummary.totalPaths,        color: "#a78bfa" },
                    { label: "Viable Paths",     value: expandSummary.viablePaths,       color: "#22c55e" },
                    { label: "Paths Executed",   value: expandSummary.executedPaths,     color: "#6366f1" },
                    { label: "New Modules",      value: expandSummary.newRegistryItems,  color: "#22c55e" },
                    { label: "Registry Total",   value: expandSummary.totalRegistrySize, color: "#94a3b8" },
                    { label: "Protections",      value: expandSummary.protectionsApplied, color: "#6366f1" },
                    { label: "Optimizations",    value: expandSummary.optimizations,     color: "#f59e0b" },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      padding: "8px 10px", background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, textAlign: "center",
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ fontSize: 9, color: "#475569", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: "#334155", margin: "10px 0 0", textAlign: "right" }}>
                  {new Date(expandSummary.startedAt).toLocaleTimeString()} → {new Date(expandSummary.completedAt).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-green { 0%,100%{opacity:1;box-shadow:0 0 6px #22c55e} 50%{opacity:0.6;box-shadow:0 0 2px #22c55e} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
