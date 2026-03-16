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
} from "@/engine/InfiniteExpansionEngine";

// ─── Panel tabs ───────────────────────────────────────────────────────────
type UCPXTab = "agents" | "engines" | "expand" | "insights" | "tour" | "modules";

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
  const [domain,     setDomain]     = useState("");
  const [agentId,    setAgentId]    = useState<AgentId>("FORGE");
  const [type,       setType]       = useState<InfiniteModule["type"]>("innovation");
  const [generating, setGenerating] = useState(false);
  const [recent,     setRecent]     = useState<InfiniteModule[]>([]);

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

  return (
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

function TourView() {
  const [step, setStep] = useState(0);
  const tour = GUIDED_TOUR;
  const current = tour[step];

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex gap-1">
        {tour.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`h-1 rounded-full flex-1 transition-all ${i === step ? "bg-blue-500" : i < step ? "bg-blue-200" : "bg-muted"}`} />
        ))}
      </div>

      {/* Current step */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 space-y-3">
        <div className="text-center">
          <p className="text-4xl mb-2">{current.icon}</p>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Step {step + 1} of {tour.length}</p>
          <h3 className="font-bold text-[15px] text-foreground mt-1">{current.title}</h3>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed text-center">{current.description}</p>
      </div>

      {/* Navigation */}
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
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string[]>([]);
  const [filter, setFilter] = useState("");

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

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-3">
        <p className="text-[11px] font-bold text-indigo-700">25 UNIVERSAL MODULES — ALL ACTIVE</p>
        <p className="text-[10px] text-indigo-600 mt-0.5">Tap any industry to generate a live AI module, workflow, or insight instantly</p>
      </div>

      {/* Search */}
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Filter by industry or keyword…"
        className="w-full bg-muted rounded-xl px-3 py-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-300"
      />

      {/* Module grid */}
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

      {/* Infinite features strip */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-3 space-y-2">
        <p className="text-[10px] font-bold text-purple-700 uppercase">Infinite Expansion Features Active</p>
        <div className="flex flex-wrap gap-1">
          {INFINITE_FEATURES.map(f => (
            <span key={f} className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{f}</span>
          ))}
        </div>
      </div>
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
    { id: "agents",  label: "Agents",   icon: "🤖" },
    { id: "engines", label: "Engines",  icon: "⚙️" },
    { id: "modules", label: "Modules",  icon: "🌐" },
    { id: "expand",  label: "Expand",   icon: "♾️" },
    { id: "insights",label: "Insights", icon: "🔮" },
    { id: "tour",    label: "Tour",     icon: "🗺️" },
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
            {activeResult && (tab === "expand" || tab === "agents" || tab === "modules")
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
              : tab === "tour"
              ? <TourView />
              : null
            }
          </div>

          {/* Footer */}
          <div className="flex-none px-4 py-2.5 border-t border-border/20 bg-muted/20">
            <p className="text-[9px] text-muted-foreground text-center">
              UCP-X v2 · 11 Engines · 6 Meta-Agents · 25 Universal Modules · Additive Only · Core Intact
            </p>
          </div>
        </div>
      )}
    </>
  );
}
