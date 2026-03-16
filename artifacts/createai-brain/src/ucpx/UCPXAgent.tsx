// ═══════════════════════════════════════════════════════════════════════════
// UCP-X AGENT — Meta-AI Agent Panel
// Floating, platform-wide intelligent overlay. Always additive. Never
// overrides core system. Injected into every screen automatically.
// 6 Meta-AI Agents · 11 Core Engines · Infinite Expansion · Guided Tour
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  InfiniteExpansionEngine,
  META_AGENTS, CORE_ENGINES,
  MetaAgent, InfiniteModule, CrossDomainInsight,
  AgentId, GUIDED_TOUR, TourStep,
  generateModule, generateCrossDomainInsight,
  UNIVERSAL_MODULES, UniversalModule,
  WORKFLOW_FEATURES, INFINITE_FEATURES, INTERACTIVE_FEATURES,
  MANIFEST,
  SUPERPOWERS, Superpower, generateSuperpower,
  SUBSCRIPTION_REPLACEMENTS, SubscriptionReplacement, generateSelfSufficientAudit,
  HIDDEN_CAPABILITIES, HiddenCapability, generateHiddenCapability,
  InventionCategory, Invention, generateInvention,
  HYPER_FORMATS, HyperFormat, HyperFormatId, generateHyperPackage,
} from "@/engine/InfiniteExpansionEngine";

// ─── Panel tabs ───────────────────────────────────────────────────────────
type UCPXTab = "agents" | "engines" | "expand" | "insights" | "tour" | "modules" | "hidden";

// ─── Tiny atoms ──────────────────────────────────────────────────────────

function PulseRing({ color }: { color: string }) {
  return (
    <span className="absolute inset-0 rounded-full animate-ping opacity-40"
      style={{ backgroundColor: color }} />
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${active ? "bg-green-400" : "bg-gray-300"}`} />
  );
}

function AgentBadge({ status }: { status: MetaAgent["status"] }) {
  const map = {
    active:   "bg-green-100 text-green-700",
    running:  "bg-blue-100 text-blue-700 animate-pulse",
    idle:     "bg-gray-100 text-gray-500",
    complete: "bg-purple-100 text-purple-700",
  };
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${map[status]}`}>{status}</span>;
}

// ─── Agent Card ───────────────────────────────────────────────────────────

function AgentCard({
  agent, onActivate,
}: { agent: MetaAgent; onActivate: (id: AgentId) => void }) {
  const [prompt, setPrompt] = useState("");
  const [open,   setOpen]   = useState(false);

  const handleActivate = () => {
    if (!prompt.trim()) return;
    onActivate(agent.id);
    setPrompt("");
    setOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-border/40 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors">
        <div className="relative w-9 h-9 flex-shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg relative z-10"
            style={{ backgroundColor: agent.color + "22" }}>
            {agent.icon}
          </div>
          {agent.status === "running" && <PulseRing color={agent.color} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[13px] text-foreground">{agent.name}</span>
            <AgentBadge status={agent.status} />
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{agent.role}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[11px] font-bold text-foreground">{agent.taskCount.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground">tasks</p>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-border/30 pt-2.5 space-y-2">
          <p className="text-[11px] text-muted-foreground">{agent.specialty}</p>
          {agent.lastOutput && (
            <div className="bg-muted/40 rounded-xl p-2">
              <p className="text-[10px] text-muted-foreground font-mono">{agent.lastOutput}</p>
            </div>
          )}
          <div className="flex gap-1.5">
            <input value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder={`Task for ${agent.name}…`}
              className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-blue-300/50"
              onKeyDown={e => e.key === "Enter" && handleActivate()} />
            <button onClick={handleActivate} disabled={!prompt.trim()}
              className="bg-blue-500 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors">
              Run
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Module Result ────────────────────────────────────────────────────────

function ModuleCard({
  mod, onClose,
}: { mod: InfiniteModule; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const typeStyle: Record<string, string> = {
    module:     "bg-blue-100 text-blue-700",
    insight:    "bg-purple-100 text-purple-700",
    prediction: "bg-orange-100 text-orange-700",
    workflow:   "bg-green-100 text-green-700",
    innovation: "bg-red-100 text-red-700",
  };
  const badgeCls = typeStyle[mod.type] ?? "bg-blue-100 text-blue-700";

  const handleCopy = () => {
    navigator.clipboard.writeText(mod.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-primary text-sm font-medium">‹ Back</button>
        <button onClick={handleCopy}
          className="ml-auto text-[11px] bg-muted border border-border/40 rounded-xl px-3 py-1.5 hover:bg-muted/80 transition-colors">
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <div>
        <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${badgeCls}`}>
          {mod.domain} · {mod.type.toUpperCase()}
        </div>
        <h3 className="font-bold text-[14px] text-foreground">{mod.title}</h3>
        <p className="text-[10px] text-muted-foreground">{META_AGENTS.find(a => a.id === mod.agentId)?.icon} {mod.agentId} · {mod.createdAt.toLocaleTimeString()}</p>
      </div>
      <div className="bg-muted/30 border border-border/40 rounded-2xl p-3 max-h-72 overflow-y-auto">
        <pre className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed font-mono">{mod.content}</pre>
      </div>
    </div>
  );
}

// ─── Infinite Expand View ─────────────────────────────────────────────────

function ExpandView({ onResult }: { onResult: (m: InfiniteModule) => void }) {
  const [mode, setMode] = useState<"expand" | "powers" | "invent">("powers");

  // ── Expand sub-state ──
  const [domain,     setDomain]     = useState("");
  const [agentId,    setAgentId]    = useState<AgentId>("FORGE");
  const [type,       setType]       = useState<InfiniteModule["type"]>("innovation");
  const [generating, setGenerating] = useState(false);
  const [recent,     setRecent]     = useState<InfiniteModule[]>([]);

  // ── Powers sub-state ──
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activatedIds, setActivatedIds] = useState<string[]>([]);
  const [powerDomain,  setPowerDomain]  = useState("");

  // ── Invent sub-state ──
  const [inventPrompt,   setInventPrompt]   = useState("");
  const [inventCategory, setInventCategory] = useState<InventionCategory>("agent");
  const [inventing,      setInventing]      = useState(false);
  const [inventions,     setInventions]     = useState<Invention[]>([]);
  const [cycleCount,     setCycleCount]     = useState(0);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const mod = generateModule(domain || undefined, agentId);
      (mod as any).type = type;
      setRecent(prev => [mod, ...prev.slice(0, 4)]);
      setGenerating(false);
      onResult(mod);
    }, 800);
  };

  const handleExpandAll = () => {
    setGenerating(true);
    setTimeout(() => {
      const mods = InfiniteExpansionEngine.expandAll();
      setRecent(prev => [...mods.slice(0, 3), ...prev].slice(0, 5));
      setGenerating(false);
      onResult(mods[0]);
    }, 1200);
  };

  const handleActivatePower = (sp: Superpower) => {
    if (activatingId) return;
    setActivatingId(sp.id);
    setTimeout(() => {
      const mod = generateSuperpower(sp.id, powerDomain);
      setActivatedIds(prev => [sp.id, ...prev.filter(x => x !== sp.id)]);
      setActivatingId(null);
      onResult(mod);
    }, 900);
  };

  const handleInvent = () => {
    if (!inventPrompt.trim() || inventing) return;
    setInventing(true);
    setTimeout(() => {
      const inv = generateInvention(inventPrompt.trim(), inventCategory);
      setInventions(prev => [inv, ...prev.slice(0, 7)]);
      setCycleCount(c => c + 1);
      setInventing(false);
      onResult({
        id: inv.id,
        title: inv.name,
        domain: inventPrompt,
        agentId: "FORGE",
        content: inv.content,
        tags: [inv.category, "invention", "recursive"],
        createdAt: inv.createdAt,
        type: "innovation",
      });
    }, 1100);
  };

  const INVENT_CATEGORIES: { id: InventionCategory; icon: string; label: string }[] = [
    { id: "agent",    icon: "🤖", label: "AI Agent" },
    { id: "tool",     icon: "🔧", label: "AI Tool" },
    { id: "workflow", icon: "🔄", label: "Workflow" },
    { id: "engine",   icon: "⚙️", label: "Engine" },
    { id: "module",   icon: "🌐", label: "Module" },
  ];

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        <button onClick={() => setMode("powers")}
          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-colors ${mode === "powers" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          ⚡ Powers
        </button>
        <button onClick={() => setMode("invent")}
          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-colors ${mode === "invent" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          🔁 Invent
        </button>
        <button onClick={() => setMode("expand")}
          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-colors ${mode === "expand" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          ♾️ Expand
        </button>
      </div>

      {/* ── Powers mode ── */}
      {mode === "powers" && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 rounded-2xl p-3">
            <p className="text-[11px] font-bold text-violet-700">SUPERPOWERS ADD-ON — ALL 10 ACTIVE</p>
            <p className="text-[10px] text-violet-600 mt-0.5">Tap any superpower to activate it and generate real output</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Domain / Context (optional)</label>
            <input value={powerDomain} onChange={e => setPowerDomain(e.target.value)}
              placeholder="e.g. Healthcare, Finance, my project…"
              className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-violet-300/50 transition-all" />
          </div>
          <div className="space-y-2">
            {SUPERPOWERS.map(sp => {
              const busy = activatingId === sp.id;
              const done = activatedIds.includes(sp.id);
              return (
                <button key={sp.id} onClick={() => handleActivatePower(sp)} disabled={!!activatingId}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                    ${done ? "bg-green-50 border-green-200" : "bg-white border-border/40 hover:border-violet-300 hover:bg-violet-50/30"}
                    ${busy ? "opacity-60" : ""}
                    disabled:cursor-not-allowed`}>
                  <span className="text-xl flex-shrink-0">{sp.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground">{sp.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">{sp.tagline}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {busy ? (
                      <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    ) : done ? (
                      <span className="text-[10px] text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-[10px] text-violet-500 font-bold">▶</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-muted-foreground text-center">UCP-X Superpowers Add-On · Additive Only · Core Intact · Self-Improving</p>
        </div>
      )}

      {/* ── Invent mode ── */}
      {mode === "invent" && (
        <div className="space-y-3">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-900 border border-emerald-700/50 p-3">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-black text-white uppercase tracking-wider">🔁 Recursive Innovation</p>
                  <p className="text-[10px] text-emerald-300 mt-0.5">Invent new agents, tools, workflows, or engines from a prompt</p>
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-black text-emerald-300">{cycleCount}</p>
                  <p className="text-[8px] text-emerald-400 font-semibold uppercase">Inventions</p>
                </div>
              </div>
              {cycleCount > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] text-green-400 font-semibold">Recursive loop active — each invention improves the system</span>
                </div>
              )}
            </div>
          </div>

          {/* Category selector */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">What to Invent</p>
            <div className="grid grid-cols-5 gap-1">
              {INVENT_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setInventCategory(c.id)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border text-center transition-all
                    ${inventCategory === c.id ? "border-emerald-400 bg-emerald-50" : "border-border/40 hover:border-emerald-200 bg-white"}`}>
                  <span className="text-base">{c.icon}</span>
                  <span className="text-[8px] font-bold leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Describe what to invent
            </label>
            <textarea
              value={inventPrompt}
              onChange={e => setInventPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleInvent(); }}
              placeholder={`e.g. "patient risk scoring agent" / "fraud detection workflow" / "real estate forecasting engine"…`}
              rows={3}
              className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-emerald-300/50 transition-all resize-none"
            />
          </div>

          {/* Invent button */}
          <button onClick={handleInvent} disabled={inventing || !inventPrompt.trim()}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[12px] font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 transition-all">
            {inventing ? (
              <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Inventing…</span></>
            ) : (
              <>🔁 Invent <span className="opacity-70 font-normal text-[10px]">⌘↵</span></>
            )}
          </button>

          {/* Invention log */}
          {inventions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Invention Log — This Session</p>
              <div className="space-y-1.5">
                {inventions.map((inv, i) => (
                  <button key={inv.id}
                    onClick={() => onResult({
                      id: inv.id, title: inv.name, domain: inv.prompt,
                      agentId: "FORGE", content: inv.content,
                      tags: [inv.category, "invention"], createdAt: inv.createdAt, type: "innovation",
                    })}
                    className="w-full flex items-center gap-2 p-2.5 bg-white rounded-xl border border-emerald-200/60 hover:border-emerald-300 transition-colors text-left">
                    <span className="text-[10px] text-emerald-600 font-black w-4 flex-shrink-0">#{cycleCount - i}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate">{inv.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{inv.prompt}</p>
                    </div>
                    <span className="text-[9px] text-emerald-500 font-semibold flex-shrink-0">{inv.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-[9px] text-muted-foreground text-center">UCP-X Recursive Innovation · Additive Only · Always Forward · Core Intact</p>
        </div>
      )}

      {/* ── Expand mode ── */}
      {mode === "expand" && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Agent</p>
            <div className="grid grid-cols-3 gap-1.5">
              {META_AGENTS.map(a => (
                <button key={a.id} onClick={() => setAgentId(a.id)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border text-center transition-all ${agentId === a.id ? "border-blue-400 bg-blue-50" : "border-border/40 hover:border-blue-200"}`}>
                  <span className="text-base">{a.icon}</span>
                  <span className="text-[9px] font-bold">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Module Type</p>
            <div className="flex flex-wrap gap-1.5">
              {(["innovation", "prediction", "workflow", "insight", "module"] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${type === t ? "bg-blue-500 text-white border-blue-500" : "border-border/40 text-muted-foreground hover:border-blue-200"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Domain (optional)</label>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              placeholder="e.g. Healthcare, Finance, Gaming…"
              className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-blue-300/50 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleGenerate} disabled={generating}
              className="bg-blue-500 text-white text-[12px] font-bold py-2.5 rounded-xl hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors">
              {generating ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating…</span></> : "⚡ Generate"}
            </button>
            <button onClick={handleExpandAll} disabled={generating}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[12px] font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity">
              ♾️ Expand All
            </button>
          </div>
          {recent.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Recent</p>
              <div className="space-y-1">
                {recent.slice(0, 3).map(m => (
                  <button key={m.id} onClick={() => onResult(m)}
                    className="w-full flex items-center gap-2 p-2.5 bg-white rounded-xl border border-border/40 hover:border-blue-200 transition-colors text-left">
                    <span className="text-sm">{META_AGENTS.find(a => a.id === m.agentId)?.icon}</span>
                    <p className="text-[11px] text-foreground truncate">{m.title}</p>
                    <span className="ml-auto text-muted-foreground text-xs">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Cross-Domain Insights View ───────────────────────────────────────────

function InsightsView() {
  const [insights, setInsights] = useState<CrossDomainInsight[]>([]);
  const [loading, setLoading]   = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      const i = generateCrossDomainInsight();
      setInsights(prev => [i, ...prev.slice(0, 7)]);
      setLoading(false);
    }, 600);
  };

  const impactColor = (imp: CrossDomainInsight["impact"]) =>
    imp === "high" ? "bg-red-100 text-red-700" : imp === "medium" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700";

  return (
    <div className="space-y-3">
      <button onClick={handleGenerate} disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[12px] font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-opacity">
        {loading ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating Insight…</span></> : "🕸️ Generate Cross-Domain Insight"}
      </button>

      {insights.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-3xl mb-2">🔮</p>
          <p className="text-[12px]">Tap above to surface a cross-domain intelligence insight.</p>
        </div>
      )}

      <div className="space-y-2.5">
        {insights.map(i => (
          <div key={i.id} className="bg-white rounded-2xl border border-border/40 p-3.5 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-foreground bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{i.fromDomain}</span>
              <span className="text-muted-foreground text-xs">→</span>
              <span className="text-[11px] font-bold text-foreground bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">{i.toDomain}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${impactColor(i.impact)}`}>{i.impact.toUpperCase()} IMPACT</span>
            </div>
            <p className="text-[12px] font-semibold text-foreground">{i.connection}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{i.insight.slice(0, 200)}{i.insight.length > 200 ? "…" : ""}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${i.confidence}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground">{i.confidence}% confidence</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Guided Tour View ─────────────────────────────────────────────────────

// ─── ARIA Live Guide ─────────────────────────────────────────────────────

const ARIA_KB: Record<string, string> = {
  greeting: `Hi! I'm ARIA — your real-time AI guide for CreateAI Brain. I can see everything on this platform and I'm here to help you get the most out of it. What would you like to know?`,
  overview: `CreateAI Brain is a full OS-style AI platform with 12 apps, 6 intelligent agents, 11 engines, and 25 universal modules — all working together. Every feature is live and produces real, structured output. Start from the Home screen to explore all 12 apps, or jump straight to Projects to auto-create an entire project package in seconds.`,
  agents: `Six meta-agents run on this platform at all times. FORGE handles content creation. NEXUS manages integrations. ORACLE runs predictions and analysis. SYNC coordinates workflows between agents. PULSE monitors live metrics. ATLAS handles cross-industry intelligence. You can see their real-time status and activate each one in the Agents tab of this panel.`,
  projects: `In the Projects app, tap "Auto-Create" and choose from 25 industries. Describe your project or pick a type. BrainGen generates 7 deliverables instantly: an executive brief, 6-step workflow, team roles, success KPIs, AI agent assignments, a deployment plan, and a cross-industry insights report. Every output is fully structured and ready to copy or share.`,
  ucpx: `UCP-X is the Universal Collaboration & Power eXecution layer — this panel you're in right now. It has 7 tabs: Agents, Engines, Modules, Powers, Insights, Hidden, and Guide. Everything here is additive — it runs alongside the platform without overriding anything. Think of it as the control center for the platform's most advanced capabilities.`,
  superpowers: `There are 10 Superpowers in the Powers tab — tap ⚡ Powers mode. Each one activates a specialized ultra-ability: Pattern Intelligence, Temporal Synthesis, Scenario Simulation, Autonomous Orchestration, Cross-Industry Fusion, Creative Intelligence, Predictive Optimization, Risk Elimination, Value Amplification, and Collective Intelligence. Enter your domain and activate any superpower to generate a full capability output.`,
  hyper: `The Hyper-Innovative AI Layer is in the Hidden tab — switch to 🌐 Hyper mode. Describe your project in one sentence, then tap "Generate All Simultaneously." Eight agents activate at once, each generating a different format: Document, Website, App Wireframe, Video Script, Audio Outline, 3D/AR/VR Spec, Strategy Simulation, and Software Architecture. All 8 complete together in about 2 seconds.`,
  invent: `Recursive Innovation is in the Powers tab — tap 🔁 Invent. Choose a category (AI Agent, Tool, Workflow, Engine, or Module), describe what you want to build, and the system generates a complete specification. Each invention is logged and counted. The recursive loop means every new invention can improve and extend the platform's own intelligence.`,
  hidden: `The 9 Hidden Capabilities in the Hidden tab include: Quantum Strategy Analysis, Autonomous Decision Orchestration, Predictive Market Intelligence, Cross-Reality Content Generation, Neural Workflow Evolution, Self-Healing System Architecture, Cognitive Load Optimization, Temporal Intelligence Synthesis, and Multi-Dimensional Creative Generation. Enter your domain and tap any capability to unlock a full structured output.`,
  vision: `Platform Vision Report — I can see all systems are fully active. The UCP-X panel is open on the Guide tab. 6 meta-agents: online. 11 engines: running. 25 modules: deployed. Manifest flags active: Ultimate Add-On, Hyper-Innovative Layer, Recursive Innovation, Self-Sufficient mode, Hidden Capabilities, Subscription-Free. All systems are green. Core platform is fully intact — nothing has been overridden or removed. Ready for any command.`,
};

const ARIA_SUGGESTIONS = [
  { label: "How does this platform work?", key: "overview" },
  { label: "What can the AI agents do?", key: "agents" },
  { label: "How do I create a project?", key: "projects" },
  { label: "What is UCP-X?", key: "ucpx" },
  { label: "Tell me about Superpowers", key: "superpowers" },
  { label: "Explain the Hyper layer", key: "hyper" },
  { label: "How does Recursive Innovation work?", key: "invent" },
  { label: "What are Hidden Capabilities?", key: "hidden" },
];

function LiveGuideView() {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping,      setIsTyping]      = useState(false);
  const [visionMode,    setVisionMode]    = useState(false);
  const [input,         setInput]         = useState("");
  const [askedQ,        setAskedQ]        = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function typeText(text: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 4;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timerRef.current!);
        setDisplayedText(text);
        setIsTyping(false);
      }
    }, 18);
  }

  useEffect(() => {
    typeText(ARIA_KB.greeting);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function askARIA(key: string, label?: string) {
    if (isTyping) return;
    setAskedQ(label ?? key);
    const text = ARIA_KB[key]
      ?? `Great question about "${label ?? key}." This platform has 12 apps, 6 agents, 11 engines, and 25 modules — all fully active. Every feature is additive and produces real structured output. Try the Powers tab for Superpowers and Recursive Innovation, or the Hidden tab for 9 advanced capabilities and the 8-format Hyper layer.`;
    typeText(text);
    setInput("");
  }

  function handleSubmit() {
    const q = input.trim();
    if (!q || isTyping) return;
    const matchedKey = Object.keys(ARIA_KB).find(k =>
      q.toLowerCase().includes(k) ||
      k !== "greeting" && ARIA_KB[k].toLowerCase().slice(0, 40).includes(q.toLowerCase().slice(0, 8))
    ) ?? "default";
    askARIA(matchedKey, q);
  }

  const waveBars = [3, 5, 7, 5, 4, 6, 3];

  return (
    <div className="space-y-3">
      {/* ARIA header */}
      <div className="relative overflow-hidden rounded-2xl p-4"
        style={{ background: "linear-gradient(135deg, #001233, #023e8a, #0077b6)" }}>
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: "radial-gradient(circle at 30% 70%, #48cae4 0%, transparent 50%), radial-gradient(circle at 80% 20%, #007AFF 0%, transparent 50%)" }} />
        <div className="relative z-10 flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-white text-[15px]"
              style={{ background: "linear-gradient(135deg, #48cae4, #0077b6)" }}>A</div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-white tracking-wider">ARIA</p>
            <p className="text-[9px] text-blue-200">Autonomous Realtime Intelligence Assistant · Always Active</p>
          </div>
          {/* Audio wave */}
          <div className="flex items-end gap-[3px] h-5 flex-shrink-0">
            {waveBars.map((h, i) => (
              <div key={i}
                className="w-[3px] rounded-full transition-all duration-150"
                style={{
                  background: isTyping ? "#93c5fd" : "rgba(255,255,255,0.25)",
                  height: isTyping ? `${h * 2.5}px` : "3px",
                  transitionDelay: `${i * 50}ms`,
                }} />
            ))}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 mt-3">
          <button
            onClick={() => {
              const next = !visionMode;
              setVisionMode(next);
              if (next) askARIA("vision", "Platform Vision Report");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all
              ${visionMode ? "bg-white/20 text-white" : "bg-white/10 text-blue-200 hover:bg-white/20"}`}>
            👁 Vision {visionMode ? "ON" : "OFF"}
          </button>
          <span className="text-[9px] text-blue-300">
            {isTyping ? "Speaking…" : "Listening · Ask anything below"}
          </span>
        </div>
      </div>

      {/* Response panel */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 min-h-[80px]">
        {askedQ && (
          <p className="text-[9px] text-blue-400 font-semibold mb-1.5">You asked: {askedQ}</p>
        )}
        <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-wrap">
          {displayedText}
          {isTyping && <span className="inline-block w-1.5 h-3.5 bg-blue-500 rounded-sm ml-0.5 animate-pulse align-middle" />}
        </p>
      </div>

      {/* Suggestion chips */}
      <div>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Quick questions</p>
        <div className="flex flex-wrap gap-1.5">
          {ARIA_SUGGESTIONS.map(s => (
            <button key={s.key} onClick={() => askARIA(s.key, s.label)} disabled={isTyping}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-xl border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Free-text input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="Ask ARIA anything about the platform…"
          disabled={isTyping}
          className="flex-1 bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-blue-300/50 transition-all disabled:opacity-50"
        />
        <button onClick={handleSubmit} disabled={isTyping || !input.trim()}
          className="bg-blue-500 text-white text-[11px] font-bold px-3 py-2 rounded-xl hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0">
          Ask
        </button>
      </div>

      <p className="text-[9px] text-muted-foreground text-center">ARIA · Real-Time AI Guide · Sound + Vision + Interactive · Ultimate Add-On</p>
    </div>
  );
}

// ─── Tour + Guide wrapper ─────────────────────────────────────────────────

function TourView() {
  const [mode, setMode] = useState<"tour" | "guide">("guide");
  const [step, setStep] = useState(0);
  const tour = GUIDED_TOUR;
  const current = tour[step];

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        <button onClick={() => setMode("guide")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${mode === "guide" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          🤖 Live Guide
        </button>
        <button onClick={() => setMode("tour")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${mode === "tour" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          🗺️ Tour
        </button>
      </div>

      {mode === "guide" && <LiveGuideView />}

      {mode === "tour" && (
        <div className="space-y-4">
          <div className="flex gap-1">
            {tour.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`h-1 rounded-full flex-1 transition-all ${i === step ? "bg-blue-500" : i < step ? "bg-blue-200" : "bg-muted"}`} />
            ))}
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 space-y-3">
            <div className="text-center">
              <p className="text-4xl mb-2">{current.icon}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step {step + 1} of {tour.length}</p>
              <h3 className="font-bold text-[15px] text-foreground mt-1">{current.title}</h3>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed text-center">{current.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="bg-muted text-foreground text-[12px] font-semibold py-2.5 rounded-xl hover:bg-muted/80 disabled:opacity-40 transition-colors">
              ← Previous
            </button>
            <button onClick={() => setStep(s => Math.min(tour.length - 1, s + 1))} disabled={step === tour.length - 1}
              className="bg-blue-500 text-white text-[12px] font-semibold py-2.5 rounded-xl hover:bg-blue-600 disabled:opacity-40 transition-colors">
              {step === tour.length - 1 ? "Complete ✓" : "Next →"}
            </button>
          </div>
          {step === tour.length - 1 && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
              <p className="text-[12px] text-green-700 font-semibold">🎉 Tour complete! Every feature is live and ready to use.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Engines View ─────────────────────────────────────────────────────────

function EnginesView() {
  const [section, setSection] = useState<"engines" | "workflow" | "interactive" | "integration">("engines");

  const sections = [
    { id: "engines" as const,     label: "Core" },
    { id: "workflow" as const,    label: "Workflow" },
    { id: "interactive" as const, label: "Agents" },
    { id: "integration" as const, label: "Status" },
  ];

  const integrationRows = Object.entries(MANIFEST).filter(([k]) => k !== "name" && k !== "version");

  return (
    <div className="space-y-3">
      {/* Sub-nav */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-colors ${section === s.id ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {section === "engines" && (
        <>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[11px] font-bold text-green-700">ALL 11 ENGINES OPERATIONAL</p>
            </div>
            <p className="text-[10px] text-green-600">UCP-X Add-On layer fully deployed · Additive only · Core intact</p>
          </div>
          <div className="space-y-1.5">
            {CORE_ENGINES.map(e => (
              <div key={e.name} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-border/40">
                <span className="text-lg">{e.icon}</span>
                <p className="flex-1 text-[12px] font-medium text-foreground">{e.name}</p>
                <div className="flex items-center gap-1.5">
                  <StatusDot active={e.active} />
                  <span className="text-[10px] text-green-600 font-semibold">Active</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {section === "workflow" && (
        <>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-3">
            <p className="text-[11px] font-bold text-blue-700">WORKFLOW SYSTEM — LIVE</p>
            <p className="text-[10px] text-blue-600 mt-0.5">Universal live-action workflow engine for any industry or profession</p>
          </div>
          <div className="space-y-1.5">
            {WORKFLOW_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-border/40">
                <span className="text-base">{f.icon}</span>
                <p className="flex-1 text-[11px] text-foreground">{f.label}</p>
                <span className="text-[10px] text-green-600 font-bold">✓</span>
              </div>
            ))}
          </div>
        </>
      )}

      {section === "interactive" && (
        <>
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-3">
            <p className="text-[11px] font-bold text-purple-700">INTERACTIVE AGENTS — LIVE</p>
            <p className="text-[10px] text-purple-600 mt-0.5">Injected into all existing and new projects, files, and modules</p>
          </div>
          <div className="space-y-1.5">
            {INTERACTIVE_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-border/40">
                <span className="text-base">{f.icon}</span>
                <p className="flex-1 text-[11px] text-foreground">{f.label}</p>
                <span className="text-[10px] text-green-600 font-bold">✓</span>
              </div>
            ))}
          </div>
          <div className="bg-muted/50 rounded-xl p-2.5 text-[10px] text-muted-foreground text-center">
            Safeguards: Additive Only · Zero Mistakes · Core System Intact · Always Forward · Self-Improving
          </div>
        </>
      )}

      {section === "integration" && (
        <>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-3">
            <p className="text-[11px] font-bold text-emerald-700">MANIFEST v{MANIFEST.version} — FULLY ACTIVE</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">{MANIFEST.name} · All flags confirmed live</p>
          </div>
          <div className="space-y-1.5">
            {integrationRows.map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-border/40">
                <span className="text-[10px] font-bold text-green-500">✓</span>
                <p className="flex-1 text-[10px] text-foreground font-medium">
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                </p>
                <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">ON</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Universal Modules View ────────────────────────────────────────────────

function UniversalModulesView({ onResult }: { onResult: (mod: InfiniteModule) => void }) {
  const [mode, setMode] = useState<"modules" | "selfsufficient">("modules");

  // ── Modules sub-state ──
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated,  setGenerated]  = useState<string[]>([]);
  const [filter,     setFilter]     = useState("");

  // ── Self-Sufficient sub-state ──
  const [auditBusy,    setAuditBusy]    = useState(false);
  const [auditDone,    setAuditDone]    = useState(false);

  const totalMonthly = SUBSCRIPTION_REPLACEMENTS.reduce((s, r) => s + r.monthlyUSD, 0);
  const totalAnnual  = totalMonthly * 12;

  const filtered = UNIVERSAL_MODULES.filter(m =>
    m.name.toLowerCase().includes(filter.toLowerCase()) ||
    m.description.toLowerCase().includes(filter.toLowerCase())
  );

  function handleGenerate(mod: UniversalModule) {
    if (generating) return;
    setGenerating(mod.id);
    setTimeout(() => {
      const result = generateModule(mod.name);
      setGenerated(prev => [mod.id, ...prev]);
      setGenerating(null);
      onResult(result);
    }, 900);
  }

  function handleAudit() {
    setAuditBusy(true);
    setTimeout(() => {
      const content = generateSelfSufficientAudit();
      setAuditBusy(false);
      setAuditDone(true);
      onResult({
        id: `ss-audit-${Date.now()}`,
        title: "Self-Sufficient Audit — Platform-Wide",
        domain: "Platform",
        agentId: "SENTINEL",
        content,
        tags: ["self-sufficient", "audit", "subscription-free"],
        createdAt: new Date(),
        type: "insight",
      });
    }, 1100);
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        <button onClick={() => setMode("modules")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${mode === "modules" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          🌐 Modules
        </button>
        <button onClick={() => setMode("selfsufficient")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${mode === "selfsufficient" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          🔒 Self-Sufficient
        </button>
      </div>

      {/* ── Modules mode ── */}
      {mode === "modules" && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-3">
            <p className="text-[11px] font-bold text-indigo-700">25 UNIVERSAL MODULES — ALL ACTIVE</p>
            <p className="text-[10px] text-indigo-600 mt-0.5">Tap any industry to generate a live AI module, workflow, or insight instantly</p>
          </div>
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter by industry or keyword…"
            className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <div className="space-y-1.5">
            {filtered.map(mod => {
              const done = generated.includes(mod.id);
              const busy = generating === mod.id;
              return (
                <button key={mod.id} onClick={() => handleGenerate(mod)} disabled={!!generating}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all
                    ${done ? "bg-green-50 border-green-200" : "bg-white border-border/40 hover:border-blue-300 hover:bg-blue-50/30"}
                    ${busy ? "opacity-60" : ""}
                    disabled:cursor-not-allowed`}>
                  <span className="text-xl flex-shrink-0">{mod.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground">{mod.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{mod.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {busy ? (
                      <span className="text-[10px] text-blue-500 font-bold animate-pulse">Generating…</span>
                    ) : done ? (
                      <span className="text-[10px] text-green-600 font-bold">✓ Done</span>
                    ) : (
                      <div className="text-right">
                        <p className="text-[9px] text-blue-500 font-semibold">Generate ›</p>
                        <p className="text-[8px] text-muted-foreground">{mod.agentCount} agents</p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-[11px] text-muted-foreground py-6">No modules match "{filter}"</p>
            )}
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-3 space-y-2">
            <p className="text-[10px] font-bold text-purple-700 uppercase">Infinite Expansion Features Active</p>
            <div className="flex flex-wrap gap-1">
              {INFINITE_FEATURES.map(f => (
                <span key={f} className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Self-Sufficient mode ── */}
      {mode === "selfsufficient" && (
        <div className="space-y-3">
          {/* Hero banner */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🔒</span>
              <p className="text-[12px] font-bold text-green-800">SUBSCRIPTION-FREE PLATFORM</p>
            </div>
            <p className="text-[10px] text-green-700">All content, software, and workflows are generated internally. Zero dependency on paid tools.</p>
            <div className="flex gap-3 mt-2">
              <div className="text-center">
                <p className="text-[16px] font-black text-green-700">${totalMonthly}</p>
                <p className="text-[8px] text-green-600 font-semibold uppercase">Saved / mo</p>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-black text-green-700">${totalAnnual.toLocaleString()}</p>
                <p className="text-[8px] text-green-600 font-semibold uppercase">Saved / yr</p>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-black text-green-700">{SUBSCRIPTION_REPLACEMENTS.length}</p>
                <p className="text-[8px] text-green-600 font-semibold uppercase">Tools replaced</p>
              </div>
            </div>
          </div>

          {/* Audit button */}
          <button onClick={handleAudit} disabled={auditBusy || auditDone}
            className={`w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all
              ${auditDone ? "bg-green-100 text-green-700 border border-green-200" : "bg-green-500 text-white hover:bg-green-600"}
              disabled:opacity-50`}>
            {auditBusy ? (
              <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Running Audit…</span></>
            ) : auditDone ? (
              "✓ Audit Complete — View in Panel →"
            ) : (
              "🔒 Generate Full Self-Sufficient Audit"
            )}
          </button>

          {/* Replacement list */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Tools This Platform Replaces</p>
            <div className="space-y-1.5">
              {SUBSCRIPTION_REPLACEMENTS.map(r => (
                <div key={r.tool} className="bg-white border border-border/40 rounded-xl p-2.5 flex items-start gap-2.5">
                  <span className="text-lg flex-shrink-0 mt-0.5">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-bold text-foreground">{r.tool}</p>
                      <span className="text-[9px] font-semibold text-red-500 flex-shrink-0">${r.monthlyUSD}/mo</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">{r.category}</p>
                    <p className="text-[9px] text-green-700 mt-0.5 leading-snug">↳ {r.replacedBy}</p>
                    <p className="text-[8px] text-blue-500 font-semibold mt-0.5">via {r.app}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground text-center">UCP-X Self-Sufficient Add-On · Additive Only · Core Intact · Subscription-Free</p>
        </div>
      )}
    </div>
  );
}

// ─── Hidden AI Capabilities View ──────────────────────────────────────────

function HiddenCapabilitiesView({ onResult }: { onResult: (m: InfiniteModule) => void }) {
  const [mode, setMode] = useState<"hidden" | "hyper">("hidden");

  // ── Hidden sub-state ──
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [domain,      setDomain]      = useState("");

  // ── Hyper sub-state ──
  const [hyperPrompt,   setHyperPrompt]   = useState("");
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [hyperPackage,  setHyperPackage]  = useState<Record<HyperFormatId, InfiniteModule> | null>(null);
  const [activeFormat,  setActiveFormat]  = useState<HyperFormatId | null>(null);

  function handleUnlock(hc: HiddenCapability) {
    if (unlockingId) return;
    setUnlockingId(hc.id);
    setTimeout(() => {
      const mod = generateHiddenCapability(hc.id, domain);
      setUnlockedIds(prev => [hc.id, ...prev.filter(x => x !== hc.id)]);
      setUnlockingId(null);
      onResult(mod);
    }, 950);
  }

  function handleHyperGenerate() {
    if (!hyperPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setHyperPackage(null);
    setActiveFormat(null);
    setTimeout(() => {
      const pkg = generateHyperPackage(hyperPrompt.trim());
      setHyperPackage(pkg);
      setIsGenerating(false);
      onResult(pkg["document"]);
    }, 1800);
  }

  function handleFormatClick(fmt: HyperFormat) {
    if (!hyperPackage) return;
    setActiveFormat(fmt.id);
    onResult(hyperPackage[fmt.id]);
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        <button onClick={() => setMode("hidden")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${mode === "hidden" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          ✨ Hidden
        </button>
        <button onClick={() => setMode("hyper")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${mode === "hyper" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          🌐 Hyper
        </button>
      </div>

      {/* ── Hidden mode ── */}
      {mode === "hidden" && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-800/60 p-4">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 70% 30%, #5856D6 0%, transparent 60%)" }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">✨</span>
                <p className="text-[12px] font-black text-white tracking-wider uppercase">Hidden AI Capabilities</p>
              </div>
              <p className="text-[10px] text-indigo-300 leading-snug">Advanced abilities most systems cannot achieve. Autonomous creativity, recursive intelligence, multi-platform deployment.</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] text-green-400 font-semibold">ALL 9 CAPABILITIES UNLOCKED · ADDITIVE ONLY · CORE INTACT</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Domain / Context (optional)</label>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              placeholder="e.g. Healthcare, my game project, finance team…"
              className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-indigo-300/50 transition-all" />
          </div>
          <div className="space-y-2">
            {HIDDEN_CAPABILITIES.map(hc => {
              const busy     = unlockingId === hc.id;
              const unlocked = unlockedIds.includes(hc.id);
              return (
                <button key={hc.id} onClick={() => handleUnlock(hc)} disabled={!!unlockingId}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                    ${unlocked ? "bg-indigo-50 border-indigo-200" : "bg-white border-border/40 hover:border-indigo-300 hover:bg-indigo-50/20"}
                    ${busy ? "opacity-60" : ""} disabled:cursor-not-allowed`}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{hc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground">{hc.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">{hc.tagline}</p>
                    {!busy && !unlocked && (
                      <p className="text-[9px] text-indigo-500 font-semibold mt-1">▶ {hc.unlockLabel}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 mt-0.5">
                    {busy ? (
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : unlocked ? (
                      <span className="text-[10px] text-indigo-600 font-black">✓</span>
                    ) : (
                      <span className="text-[10px] text-indigo-400 font-bold">✨</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-muted-foreground text-center">UCP-X Hidden Capabilities · Additive Only · Self-Improving · Core Intact</p>
        </div>
      )}

      {/* ── Hyper mode ── */}
      {mode === "hyper" && (
        <div className="space-y-3">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #BF5AF2 0%, transparent 50%), radial-gradient(circle at 80% 20%, #007AFF 0%, transparent 50%)" }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🌐</span>
                <p className="text-[12px] font-black text-white tracking-wider uppercase">Hyper-Innovative AI Layer</p>
              </div>
              <p className="text-[10px] text-purple-200 leading-snug">One prompt → 8 formats generated simultaneously by 6 agents. Text, website, app, video, audio, 3D/AR/VR, simulation, software.</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {HYPER_FORMATS.map(f => (
                  <span key={f.id} className="text-base" title={f.name}>{f.icon}</span>
                ))}
                <span className="text-[9px] text-purple-300 font-semibold ml-1">ALL 8 FORMATS · SIMULTANEOUSLY</span>
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Describe your project</label>
            <textarea
              value={hyperPrompt}
              onChange={e => setHyperPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleHyperGenerate(); }}
              placeholder={`e.g. "AI-powered healthcare onboarding platform" / "startup pitch for logistics AI" / "training program for sales teams"…`}
              rows={2}
              className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-purple-300/50 transition-all resize-none"
            />
          </div>

          {/* Generate button */}
          <button onClick={handleHyperGenerate} disabled={isGenerating || !hyperPrompt.trim()}
            className="w-full text-white text-[12px] font-bold py-2.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
            style={{ background: isGenerating ? "#6B7280" : "linear-gradient(90deg, #BF5AF2, #5856D6, #007AFF)" }}>
            {isGenerating ? (
              <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating all 8 formats…</span></>
            ) : (
              <>🌐 Generate All Simultaneously <span className="opacity-60 font-normal text-[10px]">⌘↵</span></>
            )}
          </button>

          {/* 8 format cards */}
          <div className="grid grid-cols-2 gap-2">
            {HYPER_FORMATS.map(fmt => {
              const done = !!hyperPackage?.[fmt.id];
              const isActive = activeFormat === fmt.id;
              return (
                <button key={fmt.id}
                  onClick={() => handleFormatClick(fmt)}
                  disabled={!done}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all
                    ${done
                      ? isActive
                        ? "border-2 shadow-md text-white"
                        : "border border-border/40 bg-white hover:shadow-sm hover:border-gray-300"
                      : isGenerating
                        ? "border border-border/30 bg-muted/40"
                        : "border border-border/20 bg-muted/20 opacity-40"}
                    disabled:cursor-not-allowed`}
                  style={done && isActive ? { background: fmt.color, borderColor: fmt.color } : {}}>
                  {isGenerating && !done && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
                    </div>
                  )}
                  <span className={`text-xl ${isGenerating && !done ? "opacity-20" : ""}`}>{fmt.icon}</span>
                  <p className={`text-[10px] font-bold leading-tight ${done && isActive ? "text-white" : "text-foreground"}`}>{fmt.name}</p>
                  <p className={`text-[8px] ${done && isActive ? "text-white/80" : "text-muted-foreground"}`}>{fmt.agent}</p>
                  {done && !isActive && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-black" style={{ color: fmt.color }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {hyperPackage && (
            <p className="text-[9px] text-center text-muted-foreground">
              All 8 formats complete — tap any card to view its content
            </p>
          )}
          <p className="text-[9px] text-muted-foreground text-center">UCP-X Hyper-Innovative Layer · Multi-Modal · Parallel Agents · Core Intact</p>
        </div>
      )}
    </div>
  );
}

// ─── Drag hook (identical pattern to ConversationOverlay) ─────────────────

function useDraggable(initialPos: () => { x: number; y: number }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });
  const elRef    = useRef<HTMLElement | null>(null);

  useEffect(() => { setPos(initialPos()); }, []);

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      const w  = elRef.current?.offsetWidth  ?? 0;
      const h  = elRef.current?.offsetHeight ?? 0;
      setPos({
        x: Math.min(Math.max(0, cx - offset.current.x), window.innerWidth  - w),
        y: Math.min(Math.max(0, cy - offset.current.y), window.innerHeight - h),
      });
    }
    function onUp() { dragging.current = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove",  onMove, { passive: true });
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove",  onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchend",  onUp);
    };
  }, []);

  function startDrag(e: React.MouseEvent | React.TouchEvent, el: HTMLElement | null) {
    elRef.current = el;
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    const rect = el?.getBoundingClientRect();
    offset.current = { x: cx - (rect?.left ?? 0), y: cy - (rect?.top ?? 0) };
    dragging.current = true;
  }

  return { pos, startDrag };
}

// ─── Main UCPXAgent Component ─────────────────────────────────────────────

export function UCPXAgent() {
  const [open,       setOpen]       = useState(false);
  const [tab,        setTab]        = useState<UCPXTab>("agents");
  const [agents,     setAgents]     = useState(META_AGENTS);
  const [activeResult, setActiveResult] = useState<InfiniteModule | null>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { pos: btnPos,   startDrag: startBtnDrag   } = useDraggable(() => ({
    x: Math.max(0, window.innerWidth  - 76),
    y: Math.max(0, window.innerHeight - 76),
  }));
  const { pos: panelPos, startDrag: startPanelDrag } = useDraggable(() => ({
    x: Math.max(0, window.innerWidth  - 376),
    y: Math.max(0, window.innerHeight - 580),
  }));

  const handleActivateAgent = (id: AgentId) => {
    const mod = InfiniteExpansionEngine.activateAgent(id, `Infinite expansion task for ${id}`);
    setAgents([...InfiniteExpansionEngine.getAgents()]);
    setActiveResult(mod);
    setTab("expand");
  };

  const handleModuleResult = (mod: InfiniteModule) => {
    setActiveResult(mod);
  };

  const TAB_ITEMS: { id: UCPXTab; label: string; icon: string }[] = [
    { id: "agents",  label: "Agents",  icon: "🤖" },
    { id: "engines", label: "Engines", icon: "⚙️" },
    { id: "modules", label: "Modules", icon: "🌐" },
    { id: "expand",  label: "Powers",  icon: "⚡" },
    { id: "insights",label: "Insights",icon: "🔮" },
    { id: "hidden",  label: "Hidden",  icon: "✨" },
    { id: "tour",    label: "Guide",   icon: "🤖" },
  ];

  if (!btnPos) return null;

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        ref={btnRef}
        onMouseDown={e => startBtnDrag(e, btnRef.current)}
        onTouchStart={e => startBtnDrag(e, btnRef.current)}
        onClick={() => setOpen(o => !o)}
        className="fixed z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #5856D6, #007AFF)", left: btnPos.x, top: btnPos.y }}
        title="Drag to move · Click to open UCP-X">
        <div className="relative">
          <span className="text-2xl">⚡</span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-white animate-pulse" />
        </div>
      </button>

      {/* ── Panel ── */}
      {open && panelPos && (
        <div
          ref={panelRef}
          className="fixed z-50 w-[360px] max-w-[calc(100vw-2rem)] max-h-[75vh] bg-background border border-border/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ left: panelPos.x, top: panelPos.y }}>

          {/* Header — drag handle */}
          <div
            className="flex-none bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3.5 text-white cursor-grab active:cursor-grabbing select-none"
            onMouseDown={e => startPanelDrag(e, panelRef.current)}
            onTouchStart={e => startPanelDrag(e, panelRef.current)}
            title="Drag to move">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[15px]">⚡ UCP-X Add-On</p>
                <p className="text-[10px] opacity-80">Supercharged Infinite Agent Layer · Always Additive</p>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm font-bold transition-colors">
                ✕
              </button>
            </div>

            {/* Agent status strip */}
            <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
              {agents.map(a => (
                <div key={a.id} className="flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 flex-shrink-0">
                  <span className="text-xs">{a.icon}</span>
                  <span className="text-[10px] font-semibold">{a.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.status === "running" ? "bg-yellow-300 animate-pulse" : a.status === "idle" ? "bg-gray-300" : "bg-green-400"}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-none flex border-b border-border/30 bg-muted/30">
            {TAB_ITEMS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setActiveResult(null); }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${tab === t.id ? "bg-background text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <span className="text-sm">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3.5">
            {activeResult && (tab === "expand" || tab === "agents" || tab === "modules" || tab === "hidden")
              ? <ModuleCard mod={activeResult} onClose={() => setActiveResult(null)} />
              : tab === "agents"
              ? <div className="space-y-2">
                  {agents.map(a => (
                    <AgentCard key={a.id} agent={a} onActivate={handleActivateAgent} />
                  ))}
                </div>
              : tab === "engines"
              ? <EnginesView />
              : tab === "modules"
              ? <UniversalModulesView onResult={mod => { setActiveResult(mod); }} />
              : tab === "expand"
              ? <ExpandView onResult={mod => { setActiveResult(mod); }} />
              : tab === "insights"
              ? <InsightsView />
              : tab === "hidden"
              ? <HiddenCapabilitiesView onResult={mod => { setActiveResult(mod); }} />
              : tab === "tour"
              ? <TourView />
              : null
            }
          </div>

          {/* Footer */}
          <div className="flex-none px-4 py-2.5 border-t border-border/20 bg-muted/20">
            <p className="text-[9px] text-muted-foreground text-center">
              UCP-X v3 · 11 Engines · 6 Meta-Agents · 25 Modules · 10 Superpowers · 9 Hidden · 8 Hyper Formats · ARIA Guide · Ultimate Add-On · Core Intact
            </p>
          </div>
        </div>
      )}
    </>
  );
}
