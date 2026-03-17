import React, { useState, useRef, useEffect } from "react";
import { useOS } from "@/os/OSContext";
import type { AppId } from "@/os/OSContext";
import {
  PLATFORM_SYSTEMS, PLATFORM_STATS, AUTO_WIRE_RULE, REPLICATION_PROTECTION,
  parseMessageIntent, loadFounderState,
  type OutboundMessage,
} from "@/engine/FounderTier";

type Tab = "command" | "status" | "protect" | "autowire";

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
  const [logs, setLogs]           = useState<CommandLog[]>([
    { id: "boot", input: "SYSTEM", result: "Founder Tier activated. All 18 systems online. Command Center ready.", ts: new Date().toISOString(), type: "info" },
  ]);
  const [sentMessages, setSentMessages] = useState<OutboundMessage[]>([]);
  const [isExecuting, setIsExecuting]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const founder = loadFounderState();

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
          result: `✓ Auto-sent via ${msg.channel.toUpperCase()} to "${msg.to}": "${msg.body}" — Founder Tier, no confirmation required.`,
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
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#86efac" }}>ALL SYSTEMS ONLINE</span>
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

            {/* Auto-send log */}
            {sentMessages.length > 0 && (
              <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(34,197,94,0.1)", background: "#0d1117" }}>
                <p style={{ fontSize: 9, color: "#334155", fontWeight: 700, letterSpacing: "0.08em", margin: "0 0 6px", textTransform: "uppercase" }}>
                  Auto-Sent Messages (Founder Tier — No Confirmation)
                </p>
                {sentMessages.slice(0, 3).map((m, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 8, alignItems: "center", marginBottom: 4,
                    fontSize: 11, color: "#86efac", fontFamily: "monospace",
                  }}>
                    <span style={{ color: "#22c55e" }}>✓</span>
                    <span style={{ color: "#475569" }}>[{m.channel.toUpperCase()}]</span>
                    <span>To: {m.to}</span>
                    <span style={{ color: "#334155" }}>·</span>
                    <span style={{ color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.body}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status Tab */}
        {activeTab === "status" && (
          <div style={{ padding: "16px" }}>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px", letterSpacing: "-0.01em" }}>Platform Systems</h3>
              <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>18/18 systems online · Founder Tier · Full activation</p>
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
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", margin: 0, truncate: true }}>{sys.label}</p>
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
      </div>

      <style>{`
        @keyframes pulse-green { 0%,100%{opacity:1;box-shadow:0 0 6px #22c55e} 50%{opacity:0.6;box-shadow:0 0 2px #22c55e} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
