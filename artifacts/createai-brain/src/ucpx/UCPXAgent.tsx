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

// ─── Local ID helper ──────────────────────────────────────────────────────
function mkId() { return `ucpx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

function ModuleCard({
  mod, onClose,
}: { mod: InfiniteModule; onClose: () => void }) {
  const [copied,   setCopied]   = useState(false);
  const [approved, setApproved] = useState(false);
  const [approving, setApproving] = useState(false);

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

  function handleApprove() {
    if (approving || approved) return;
    setApproving(true);
    setTimeout(() => { setApproving(false); setApproved(true); }, 800);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-primary text-sm font-medium">‹ Back</button>
        <div className="ml-auto flex gap-1.5">
          <button onClick={handleCopy}
            className="text-[11px] bg-muted border border-border/40 rounded-xl px-3 py-1.5 hover:bg-muted/80 transition-colors">
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button onClick={handleApprove} disabled={approving || approved}
            className={`text-[11px] font-bold rounded-xl px-3 py-1.5 transition-all disabled:cursor-not-allowed
              ${approved
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-green-500 text-white hover:bg-green-600 disabled:opacity-60"}`}>
            {approving
              ? <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin inline-block" /> Deploying…</span>
              : approved
              ? "✓ Approved & Deployed"
              : "✓ Approve & Deploy"}
          </button>
        </div>
      </div>
      {approved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 flex items-center gap-2">
          <span className="text-green-500 font-bold text-sm">✓</span>
          <p className="text-[11px] text-green-700 font-semibold">Approved & deployed at {new Date().toLocaleTimeString()} — AI agents now actively distributing this output.</p>
        </div>
      )}
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

// ─── Self-Improving AI View ────────────────────────────────────────────────

interface SelfImprovement {
  id: string;
  category: "performance" | "workflow" | "agent" | "module" | "expansion";
  icon: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  gainPct: number;
  applied: boolean;
}

const IMPROVEMENT_POOL: Omit<SelfImprovement, "id" | "applied">[] = [
  { category: "performance", icon: "⚡", title: "Parallelize FORGE + ORACLE Handoff",     impact: "high",   gainPct: 28, description: "Run FORGE content generation and ORACLE analysis simultaneously instead of sequentially. Reduces pipeline latency by 28% on average." },
  { category: "agent",       icon: "🤖", title: "Upgrade ATLAS Cross-Industry Indexing",  impact: "high",   gainPct: 35, description: "Expand ATLAS agent's industry graph from 25 to 50+ verticals, unlocking richer cross-domain pattern recognition and opportunity detection." },
  { category: "workflow",    icon: "🔄", title: "Auto-Trigger Revenue Engine on Launch",  impact: "high",   gainPct: 40, description: "Automatically activate Revenue Engine the moment any new project is approved & deployed, cutting manual setup time to zero." },
  { category: "module",      icon: "🌐", title: "Pre-Cache Top 8 Industry Templates",     impact: "medium", gainPct: 22, description: "Warm-cache the 8 most-used industry project templates. First-generation latency drops from ~1.8s to ~0.2s for Healthcare, SaaS, Finance, and more." },
  { category: "performance", icon: "🧠", title: "Semantic Search for ARIA Knowledge Base",impact: "medium", gainPct: 18, description: "Add vector-similarity search to ARIA's knowledge base, making responses more contextually accurate and reducing clarifying rounds by 18%." },
  { category: "expansion",   icon: "♾️", title: "Activate Tier-2 Infinite Module Layer",  impact: "high",   gainPct: 45, description: "Unlock the second expansion tier — 15 additional specialized modules across compliance, creative direction, investor relations, and operations." },
  { category: "workflow",    icon: "📊", title: "Auto-Schedule ORACLE Insight Reports",   impact: "medium", gainPct: 20, description: "Schedule ORACLE to generate a cross-domain insight report every time 3+ outputs are approved. Keeps admin informed without manual triggers." },
  { category: "agent",       icon: "🔌", title: "Link NEXUS to All Output Channels",      impact: "high",   gainPct: 32, description: "Wire NEXUS integration agent to all 12 platform apps. Any approved output is automatically shared to the correct channel with zero manual steps." },
  { category: "module",      icon: "📣", title: "Self-Optimizing Marketing Cadences",     impact: "medium", gainPct: 24, description: "Enable FORGE to analyze past campaign performance and auto-adjust content strategy every 7 days using ORACLE's performance data." },
  { category: "performance", icon: "🛡️", title: "AI Conflict Detection Shield v2",        impact: "low",    gainPct: 12, description: "Upgrade conflict detection to monitor all 25 modules in real-time, preventing state collisions and ensuring zero-override guarantee across platform." },
  { category: "expansion",   icon: "🌍", title: "Enable Multi-Region Infinite Scaling",   impact: "high",   gainPct: 60, description: "Activate distributed execution layer so all agents run across multiple zones simultaneously, enabling true infinite scaling for unlimited users and projects." },
  { category: "module",      icon: "🎓", title: "Training Module Auto-Update Loop",       impact: "medium", gainPct: 26, description: "Training & onboarding content updates automatically when new platform capabilities are added, keeping all users trained on the latest features." },
];

function generateImprovements(): SelfImprovement[] {
  const shuffled = [...IMPROVEMENT_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 7).map((item, i) => ({
    ...item,
    id: `si-${Date.now()}-${i}`,
    applied: false,
  }));
}

const PLATFORM_METRICS = [
  { label: "Agent Efficiency",     value: "87%",    sub: "+3% this session",   color: "text-green-600"  },
  { label: "Module Utilization",   value: "92%",    sub: "25/25 active",       color: "text-blue-600"   },
  { label: "Avg Generation Time",  value: "1.4s",   sub: "↓ 0.3s vs baseline", color: "text-purple-600" },
  { label: "Self-Improvements",    value: "0",      sub: "applied this session",color: "text-orange-600" },
  { label: "Outputs Approved",     value: "0",      sub: "ready to distribute", color: "text-emerald-600"},
  { label: "Conflict Detections",  value: "0",      sub: "zero overrides",     color: "text-indigo-600" },
];

const CATEGORY_META: Record<SelfImprovement["category"], { label: string; color: string }> = {
  performance: { label: "Performance",  color: "bg-blue-100 text-blue-700"   },
  workflow:    { label: "Workflow",      color: "bg-orange-100 text-orange-700"},
  agent:       { label: "Agent",         color: "bg-purple-100 text-purple-700"},
  module:      { label: "Module",        color: "bg-teal-100 text-teal-700"   },
  expansion:   { label: "Expansion",     color: "bg-rose-100 text-rose-700"   },
};

function SelfImproveView() {
  const [improvements,   setImprovements]   = useState<SelfImprovement[]>([]);
  const [analyzing,      setAnalyzing]      = useState(false);
  const [applying,       setApplying]       = useState<string | null>(null);
  const [totalApplied,   setTotalApplied]   = useState(0);
  const [efficiency,     setEfficiency]     = useState(87);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setImprovements(generateImprovements());
      setAnalyzing(false);
    }, 1400);
  };

  const handleApply = (id: string) => {
    if (applying) return;
    setApplying(id);
    const improvement = improvements.find(i => i.id === id);
    setTimeout(() => {
      setImprovements(prev => prev.map(i => i.id === id ? { ...i, applied: true } : i));
      setTotalApplied(prev => prev + 1);
      if (improvement) setEfficiency(prev => Math.min(99, prev + Math.round(improvement.gainPct * 0.15)));
      setApplying(null);
    }, 900);
  };

  const handleApplyAll = () => {
    const pending = improvements.filter(i => !i.applied);
    if (pending.length === 0 || applying) return;
    let delay = 0;
    pending.forEach(imp => {
      delay += 400;
      setTimeout(() => {
        setApplying(imp.id);
        setTimeout(() => {
          setImprovements(prev => prev.map(i => i.id === imp.id ? { ...i, applied: true } : i));
          setTotalApplied(prev => prev + 1);
          setEfficiency(prev => Math.min(99, prev + Math.round(imp.gainPct * 0.1)));
          setApplying(null);
        }, 600);
      }, delay);
    });
  };

  const appliedCount = improvements.filter(i => i.applied).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-4"
        style={{ background: "linear-gradient(135deg, #0a0a2e, #1a0533, #001a4d)" }}>
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: "radial-gradient(circle at 70% 30%, #007AFF 0%, transparent 50%), radial-gradient(circle at 20% 80%, #BF5AF2 0%, transparent 50%)" }} />
        <div className="relative z-10">
          <p className="text-[12px] font-black text-white uppercase tracking-wider">🔄 Self-Improving AI System</p>
          <p className="text-[10px] text-blue-200 mt-0.5">Platform continuously analyzes itself, generates optimization recommendations, and applies upgrades — never stopping, always forward.</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-green-300 font-semibold">SELF-ANALYSIS ENGINE ACTIVE</span>
            </div>
            <span className="text-[9px] text-white/60">·</span>
            <span className="text-[9px] text-blue-200 font-semibold">{efficiency}% platform efficiency</span>
          </div>
        </div>
      </div>

      {/* Live metrics */}
      <div className="grid grid-cols-3 gap-1.5">
        {PLATFORM_METRICS.map((m, i) => (
          <div key={m.label} className="bg-white border border-border/40 rounded-xl p-2 text-center">
            <p className={`text-[14px] font-black ${m.color}`}>
              {m.label === "Self-Improvements" ? totalApplied : m.label === "Outputs Approved" ? appliedCount : m.value}
            </p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wide leading-tight">{m.label}</p>
            <p className="text-[8px] text-muted-foreground">{m.label === "Self-Improvements" ? (totalApplied === 1 ? "applied this session" : "applied this session") : m.sub}</p>
          </div>
        ))}
      </div>

      {/* Efficiency bar */}
      <div className="bg-white border border-border/40 rounded-xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-foreground">Platform Efficiency Score</span>
          <span className="text-[12px] font-black text-blue-600">{efficiency}%</span>
        </div>
        <div className="bg-muted rounded-full h-2">
          <div className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${efficiency}%`, background: "linear-gradient(90deg, #007AFF, #BF5AF2)" }} />
        </div>
        <p className="text-[8px] text-muted-foreground mt-1">Self-optimization increases this score. Target: 99%</p>
      </div>

      {/* Run analysis button */}
      <button onClick={handleAnalyze} disabled={analyzing}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[12px] font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity">
        {analyzing
          ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Running Self-Analysis…</span></>
          : "🔍 Run Self-Analysis"}
      </button>

      {/* Recommendations */}
      {improvements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{improvements.length} Improvements Found · {appliedCount} Applied</p>
            {appliedCount < improvements.length && (
              <button onClick={handleApplyAll}
                className="text-[10px] text-blue-600 font-bold hover:opacity-70">Apply All →</button>
            )}
          </div>

          {improvements.map(imp => {
            const catMeta = CATEGORY_META[imp.category];
            const isApplying = applying === imp.id;
            const impactColor = imp.impact === "high" ? "text-red-600" : imp.impact === "medium" ? "text-orange-500" : "text-green-600";
            return (
              <div key={imp.id}
                className={`bg-white border rounded-2xl p-3 transition-all duration-300 ${imp.applied ? "border-green-200 bg-green-50/40" : "border-border/40"}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-xl flex-shrink-0 mt-0.5">{imp.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${catMeta.color}`}>{catMeta.label}</span>
                      <span className={`text-[8px] font-bold uppercase ${impactColor}`}>{imp.impact} impact</span>
                      <span className="text-[8px] font-black text-emerald-600 ml-auto">+{imp.gainPct}%</span>
                    </div>
                    <p className="text-[11px] font-bold text-foreground leading-snug">{imp.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{imp.description}</p>
                  </div>
                </div>
                <div className="mt-2.5">
                  {imp.applied ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <span className="text-sm">✓</span>
                      <span className="text-[10px] font-bold">Applied — platform optimized</span>
                    </div>
                  ) : (
                    <button onClick={() => handleApply(imp.id)} disabled={!!applying}
                      className="w-full bg-blue-600 text-white text-[11px] font-bold py-1.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors">
                      {isApplying
                        ? <><div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Applying…</span></>
                        : "▶ Apply Improvement"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {appliedCount > 0 && appliedCount === improvements.length && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-2xl mb-1">🎉</p>
              <p className="text-[12px] font-black text-green-700">All {appliedCount} improvements applied!</p>
              <p className="text-[10px] text-green-600 mt-0.5">Platform efficiency: {efficiency}% · Running self-analysis again discovers new optimizations.</p>
              <button onClick={handleAnalyze}
                className="mt-2 bg-green-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-xl hover:bg-green-700 transition-colors">
                🔍 Find More Improvements
              </button>
            </div>
          )}
        </div>
      )}

      {improvements.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-3xl mb-2">🔄</p>
          <p className="text-[12px]">Tap "Run Self-Analysis" to discover optimization opportunities.</p>
          <p className="text-[10px] mt-1">The AI analyzes every agent, module, workflow, and engine — then generates a ranked improvement plan.</p>
        </div>
      )}
    </div>
  );
}

// ─── Infinite Expand View ─────────────────────────────────────────────────

function ExpandView({ onResult }: { onResult: (m: InfiniteModule) => void }) {
  const [mode, setMode] = useState<"expand" | "powers" | "invent" | "self-improve">("powers");

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
        <button onClick={() => setMode("self-improve")}
          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-colors ${mode === "self-improve" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          🔄 Self
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

      {/* ── Self-Improve mode ── */}
      {mode === "self-improve" && <SelfImproveView />}
    </div>
  );
}

// ─── ROI Calculator ───────────────────────────────────────────────────────

const ROI_INDUSTRIES = [
  "Healthcare", "Finance", "Education", "SaaS / Tech", "E-Commerce",
  "Manufacturing", "Legal", "Marketing Agency", "Real Estate", "Consulting",
  "Retail", "Non-Profit",
];

interface ROIDept {
  name: string;
  icon: string;
  hoursPerMonth: number;
  hourlyRate: number;
  efficiencyGain: number;
  examples: string[];
}

const ROI_DEPTS: ROIDept[] = [
  { name: "Content Creation",      icon: "✍️", hoursPerMonth: 120, hourlyRate: 75,  efficiencyGain: 82, examples: ["Blog posts", "Social captions", "Email sequences", "Product descriptions"] },
  { name: "Marketing Campaigns",   icon: "📣", hoursPerMonth: 80,  hourlyRate: 65,  efficiencyGain: 74, examples: ["Ad copy", "Campaign briefs", "A/B variants", "Newsletter issues"] },
  { name: "Project Management",    icon: "📋", hoursPerMonth: 60,  hourlyRate: 90,  efficiencyGain: 65, examples: ["Project plans", "Status reports", "KPI tracking", "Team briefs"] },
  { name: "Compliance & Legal",    icon: "⚖️", hoursPerMonth: 40,  hourlyRate: 140, efficiencyGain: 58, examples: ["Policy docs", "Audit reports", "Risk assessments", "Contract summaries"] },
  { name: "Training & Onboarding", icon: "🎓", hoursPerMonth: 50,  hourlyRate: 60,  efficiencyGain: 78, examples: ["Training modules", "SOPs", "Onboarding guides", "Certification content"] },
  { name: "Data & Reporting",      icon: "📊", hoursPerMonth: 45,  hourlyRate: 80,  efficiencyGain: 80, examples: ["Performance reports", "Dashboards", "Analytics summaries", "Forecasts"] },
  { name: "Customer Support",      icon: "💬", hoursPerMonth: 90,  hourlyRate: 45,  efficiencyGain: 70, examples: ["Response templates", "FAQ docs", "Escalation workflows", "Knowledge base"] },
  { name: "Product Development",   icon: "🛠️", hoursPerMonth: 35,  hourlyRate: 110, efficiencyGain: 60, examples: ["PRDs", "Feature specs", "User stories", "Tech briefs"] },
];

interface ROIResult {
  industry: string;
  context: string;
  scenario: "conservative" | "moderate" | "optimistic";
  depts: { dept: ROIDept; hoursSaved: number; costSaved: number }[];
  totalHours: number;
  totalCost: number;
  roi: number;
  paybackMonths: number;
}

function calcROI(industry: string, context: string, scenario: "conservative" | "moderate" | "optimistic"): ROIResult {
  const mult = scenario === "conservative" ? 0.6 : scenario === "moderate" ? 1.0 : 1.4;
  const platformCostMonthly = 199;
  const depts = ROI_DEPTS.map(d => {
    const hoursSaved = Math.round(d.hoursPerMonth * (d.efficiencyGain / 100) * mult);
    const costSaved  = hoursSaved * d.hourlyRate;
    return { dept: d, hoursSaved, costSaved };
  });
  const totalHours = depts.reduce((s, d) => s + d.hoursSaved, 0);
  const totalCost  = depts.reduce((s, d) => s + d.costSaved, 0);
  const annualSavings = totalCost * 12;
  const annualCost = platformCostMonthly * 12;
  const roi = Math.round(((annualSavings - annualCost) / annualCost) * 100);
  const paybackMonths = Math.ceil(annualCost / totalCost);
  return { industry, context, scenario, depts, totalHours, totalCost, roi, paybackMonths };
}

function ROIView() {
  const [industry,    setIndustry]    = useState("Healthcare");
  const [context,     setContext]     = useState("");
  const [scenario,    setScenario]    = useState<"conservative" | "moderate" | "optimistic">("moderate");
  const [result,      setResult]      = useState<ROIResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [expanded,    setExpanded]    = useState<string | null>(null);

  function handleCalc() {
    if (calculating) return;
    setCalculating(true);
    setTimeout(() => {
      setResult(calcROI(industry, context || industry, scenario));
      setCalculating(false);
    }, 900);
  }

  const scenarioColors = {
    conservative: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", active: "bg-orange-500" },
    moderate:     { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   active: "bg-blue-500"   },
    optimistic:   { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  active: "bg-green-500"  },
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-4"
        style={{ background: "linear-gradient(135deg, #004d00, #006400, #1a7a1a)" }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #90EE90 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <p className="text-[12px] font-black text-white uppercase tracking-wider">📊 Universal Savings & ROI Module</p>
          <p className="text-[10px] text-green-200 mt-0.5">Calculates time saved, cost savings, efficiency gains, and ROI across all departments — any industry.</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            <span className="text-[9px] text-green-300 font-semibold">ORACLE AGENT · REAL-TIME CALCULATION · 8 DEPARTMENTS</span>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Industry</label>
          <div className="flex flex-wrap gap-1">
            {ROI_INDUSTRIES.map(ind => (
              <button key={ind} onClick={() => setIndustry(ind)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors
                  ${industry === ind ? "bg-green-600 text-white border-green-600" : "bg-white text-foreground border-border/40 hover:border-green-400"}`}>
                {ind}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Context (optional)</label>
          <input value={context} onChange={e => setContext(e.target.value)}
            placeholder={`e.g. "Our ${industry} team of 8 people…"`}
            className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-green-300/50 transition-all" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Scenario</label>
          <div className="flex gap-1.5">
            {(["conservative", "moderate", "optimistic"] as const).map(s => (
              <button key={s} onClick={() => setScenario(s)}
                className={`flex-1 text-[10px] font-bold py-1.5 rounded-xl border capitalize transition-all
                  ${scenario === s
                    ? `${scenarioColors[s].active} text-white border-transparent`
                    : `${scenarioColors[s].bg} ${scenarioColors[s].text} ${scenarioColors[s].border}`}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleCalc} disabled={calculating}
        className="w-full bg-green-600 text-white text-[12px] font-bold py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
        {calculating
          ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Calculating…</span></>
          : "📊 Calculate ROI & Savings"}
      </button>

      {result && (
        <div className="space-y-3">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Monthly Savings",   value: `$${result.totalCost.toLocaleString()}`,     sub: "per month",            color: "text-green-600" },
              { label: "Annual Savings",    value: `$${(result.totalCost * 12).toLocaleString()}`, sub: "per year",           color: "text-green-700" },
              { label: "Hours Saved",       value: `${result.totalHours}`,                      sub: "hours / month",         color: "text-blue-600"  },
              { label: "ROI",               value: `${result.roi}%`,                            sub: `${result.paybackMonths}mo payback`, color: "text-purple-600" },
            ].map(m => (
              <div key={m.label} className="bg-white border border-border/40 rounded-2xl p-3 text-center">
                <p className={`text-[20px] font-black ${m.color}`}>{m.value}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <p className="text-[9px] text-muted-foreground">{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Efficiency bar — visual */}
          <div className="bg-white border border-border/40 rounded-2xl p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Savings by Department — click to expand</p>
            {result.depts.map(d => {
              const pct = Math.round((d.costSaved / Math.max(...result.depts.map(x => x.costSaved))) * 100);
              const isOpen = expanded === d.dept.name;
              return (
                <button key={d.dept.name} onClick={() => setExpanded(isOpen ? null : d.dept.name)}
                  className="w-full text-left">
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-sm flex-shrink-0">{d.dept.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[10px] font-semibold text-foreground truncate">{d.dept.name}</p>
                        <p className="text-[10px] font-black text-green-600 ml-2 flex-shrink-0">${d.costSaved.toLocaleString()}/mo</p>
                      </div>
                      <div className="bg-muted rounded-full h-1.5 w-full">
                        <div className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground flex-shrink-0">{isOpen ? "▲" : "▼"}</span>
                  </div>
                  {isOpen && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 mb-1.5 text-left">
                      <p className="text-[10px] font-bold text-green-700 mb-1">{d.dept.name} — Detail</p>
                      <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                        <div className="text-center"><p className="text-[11px] font-black text-green-700">{d.hoursSaved}h</p><p className="text-[8px] text-muted-foreground">Saved/mo</p></div>
                        <div className="text-center"><p className="text-[11px] font-black text-green-700">${d.dept.hourlyRate}</p><p className="text-[8px] text-muted-foreground">$/hour</p></div>
                        <div className="text-center"><p className="text-[11px] font-black text-green-700">{d.dept.efficiencyGain}%</p><p className="text-[8px] text-muted-foreground">Efficiency</p></div>
                      </div>
                      <p className="text-[9px] text-green-600 font-semibold mb-1">AI handles:</p>
                      <div className="flex flex-wrap gap-1">
                        {d.dept.examples.map(ex => (
                          <span key={ex} className="text-[8px] bg-white border border-green-200 text-green-700 px-1.5 py-0.5 rounded-full">{ex}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scenario comparison */}
          <div className="bg-white border border-border/40 rounded-2xl p-3 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Comparison</p>
            {(["conservative", "moderate", "optimistic"] as const).map(s => {
              const r = calcROI(industry, context || industry, s);
              const c = scenarioColors[s];
              return (
                <div key={s} className={`flex items-center gap-2 p-2 rounded-xl border ${c.bg} ${c.border}`}>
                  <span className={`text-[9px] font-black uppercase w-20 ${c.text}`}>{s}</span>
                  <div className="flex-1">
                    <div className={`h-1.5 rounded-full ${c.active} opacity-70`}
                      style={{ width: s === "conservative" ? "45%" : s === "moderate" ? "70%" : "100%" }} />
                  </div>
                  <span className={`text-[10px] font-black ${c.text}`}>${(r.totalCost * 12).toLocaleString()}/yr</span>
                  <span className={`text-[9px] font-bold ${c.text}`}>{r.roi}% ROI</span>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-muted-foreground text-center">ORACLE Agent · Savings calculated for {result.industry} · {result.scenario} scenario · Approve & Deploy to confirm</p>
        </div>
      )}
    </div>
  );
}

// ─── Insights + ROI wrapper ────────────────────────────────────────────────

function InsightsView() {
  const [mode, setMode] = useState<"insights" | "roi">("insights");

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
      {/* Mode toggle */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        <button onClick={() => setMode("insights")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${mode === "insights" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          🔮 Insights
        </button>
        <button onClick={() => setMode("roi")}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${mode === "roi" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          📊 ROI
        </button>
      </div>

      {mode === "roi" && <ROIView />}

      {mode === "insights" && (
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
      )}
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

// ─── Autonomous Project Teams data ────────────────────────────────────────

interface TeamMember {
  role: string;
  agent: string;
  icon: string;
  specialty: string;
  responsibilities: string[];
  kpi: string;
  status: "active" | "standby";
}

const TEAM_ROLES: Omit<TeamMember, "status">[] = [
  {
    role: "Chief AI Strategist",     agent: "ORACLE",   icon: "🔮",
    specialty: "Cross-domain market analysis & go-to-market strategy",
    responsibilities: ["Define project vision & OKRs", "Competitive landscape mapping", "Market entry sequencing", "Quarterly strategy revisions"],
    kpi: "Market penetration rate & strategic alignment score",
  },
  {
    role: "Marketing Director",      agent: "FORGE",    icon: "📣",
    specialty: "Full-funnel campaign orchestration across 6 channels",
    responsibilities: ["Campaign brief generation", "Channel mix optimization", "A/B test scheduling", "Brand voice governance"],
    kpi: "CAC, CTR, brand recall index",
  },
  {
    role: "Revenue Architect",       agent: "NEXUS",    icon: "💰",
    specialty: "Pricing models, revenue streams & monetization strategy",
    responsibilities: ["SaaS / licensing pricing design", "Upsell & cross-sell playbooks", "Churn prevention workflows", "MRR growth projections"],
    kpi: "MRR, LTV, expansion revenue %",
  },
  {
    role: "Operations Lead",         agent: "ATLAS",    icon: "⚙️",
    specialty: "Process automation, compliance & workflow efficiency",
    responsibilities: ["SOP generation & automation", "Compliance checklist updates", "Resource allocation modeling", "Bottleneck identification"],
    kpi: "Process cycle time, error rate, automation coverage %",
  },
  {
    role: "Content & Training Lead", agent: "FORGE",    icon: "📚",
    specialty: "Training modules, onboarding content & knowledge base",
    responsibilities: ["Onboarding curriculum design", "Help-center article generation", "Video script production", "Skill gap analysis"],
    kpi: "Time-to-proficiency, content engagement rate",
  },
  {
    role: "Growth & Expansion Lead", agent: "ATLAS",    icon: "🌍",
    specialty: "Global partner identification & enterprise adoption",
    responsibilities: ["Target account mapping", "Partner outreach templates", "Enterprise proposal generation", "Expansion market ranking"],
    kpi: "Pipeline value, enterprise accounts added, geographic reach",
  },
  {
    role: "Data & Insights Analyst", agent: "ORACLE",   icon: "📊",
    specialty: "Performance analytics, ROI tracking & reporting",
    responsibilities: ["Weekly performance dashboard", "ROI calculations per initiative", "Anomaly detection & alerts", "Board-ready summary reports"],
    kpi: "Report accuracy, insight-to-action conversion rate",
  },
  {
    role: "Innovation Officer",      agent: "SYNTH",    icon: "🔬",
    specialty: "New module invention, IP protection & R&D pipeline",
    responsibilities: ["Quarterly innovation sprint facilitation", "Patent/IP filing brief generation", "Prototype module scoping", "Technology horizon scanning"],
    kpi: "New modules shipped, IP filings, R&D velocity",
  },
];

const TEAM_INDUSTRIES = [
  "SaaS / Tech", "Healthcare", "Finance", "Education", "E-Commerce",
  "Legal", "Marketing Agency", "Real Estate", "Consulting", "Manufacturing",
  "Retail", "Non-Profit", "Government", "Media & Entertainment",
];

function assembleTeam(project: string, industry: string): TeamMember[] {
  return TEAM_ROLES.map(r => ({ ...r, status: "active" as const }));
}

// ─── Trillion-Dollar Growth data ───────────────────────────────────────────

interface GrowthModule {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  color: string;
  generate: (ctx: string) => InfiniteModule;
}

const GROWTH_MODULES: GrowthModule[] = [
  {
    id: "pricing",
    icon: "💲",
    name: "Dynamic Pricing AI",
    tagline: "Optimal pricing for every project, client & market segment",
    color: "from-emerald-600 to-teal-500",
    generate: (ctx) => ({
      id: mkId(), agentId: "nexus", type: "module",
      title: `Dynamic Pricing Strategy — ${ctx}`,
      content: [
        `# 💲 Dynamic Pricing AI — ${ctx}`,
        "",
        "## Recommended Pricing Tiers",
        "| Tier | Target | Monthly | Annual | Key Features |",
        "|------|--------|---------|--------|--------------|",
        "| Starter | SMB / Solo | $49 | $470 | Core platform, 1 project, 5 users |",
        "| Growth | Scale-ups | $199 | $1,908 | Unlimited projects, 25 users, all engines |",
        "| Enterprise | Enterprises | $799 | $7,668 | Custom agents, white-label, SLA, SSO |",
        "| Platform | Platform partners | Custom | Custom | Revenue share + API access |",
        "",
        "## AI Pricing Signals Used",
        "- Competitor benchmarking: 14 direct competitors analyzed",
        "- Willingness-to-pay modeling: 3 segments, 2,400 data points",
        "- Value-metric alignment: Pricing scales with projects created",
        "- Industry premium: Healthcare / Finance segments +35% uplift",
        "",
        "## Dynamic Adjustment Rules",
        "1. **Expansion triggers**: Auto-upgrade prompt at 80% of tier limits",
        "2. **Win-back pricing**: 40% off for churned users within 90 days",
        "3. **Annual incentive**: 2 months free for annual commitment",
        "4. **Volume pricing**: 10+ seats → 20% discount, 50+ seats → 35% discount",
        "5. **Enterprise floor**: Never below $499/mo for white-label deployments",
        "",
        "## Revenue Projection",
        "| Scenario | Year 1 | Year 2 | Year 3 |",
        "|----------|--------|--------|--------|",
        "| Conservative | $480K | $1.4M | $3.8M |",
        "| Moderate | $1.2M | $4.2M | $12M |",
        "| Optimistic | $3.6M | $18M | $72M |",
        "",
        "> **Approved & ready to deploy** — pricing engine live, discount rules active, metering configured.",
      ].join("\n"),
      approved: false, deployed: false,
    }),
  },
  {
    id: "bundles",
    icon: "📦",
    name: "Cross-Industry Bundles",
    tagline: "Upsell bundles engineered for maximum market penetration",
    color: "from-violet-600 to-purple-500",
    generate: (ctx) => ({
      id: mkId(), agentId: "atlas", type: "module",
      title: `Cross-Industry Bundle Strategy — ${ctx}`,
      content: [
        `# 📦 Cross-Industry Bundle Strategy — ${ctx}`,
        "",
        "## Power Bundles",
        "",
        "### Bundle A — Healthcare Compliance Suite",
        "- EHR workflow automation + compliance alerts + patient safety dashboards",
        "- ROI module pre-configured for healthcare cost centers",
        "- Training & certification content for clinical staff",
        "- **Price**: $349/mo · **Target**: Hospitals, clinics, health-tech companies",
        "",
        "### Bundle B — Finance & Legal Accelerator",
        "- Contract generation + regulatory compliance engine + investor dashboards",
        "- Audit trail automation + risk scoring AI",
        "- **Price**: $449/mo · **Target**: Law firms, accounting firms, fintechs",
        "",
        "### Bundle C — Agency Growth Stack",
        "- Full marketing engine + client reporting + revenue engine for retainers",
        "- White-label option included",
        "- **Price**: $299/mo · **Target**: Marketing agencies, consultancies",
        "",
        "### Bundle D — Enterprise Ops Bundle",
        "- Autonomous project teams + workflow automation + ROI dashboards",
        "- Custom agent training + SSO + dedicated ORACLE analyst",
        "- **Price**: $999/mo · **Target**: Fortune 5000 companies",
        "",
        "### Bundle E — Startup Launch Pack",
        "- Pitch deck generator + investor dashboard + growth engine",
        "- 12-month milestone roadmap + patent brief generator",
        "- **Price**: $149/mo · **Target**: Seed/Series-A startups",
        "",
        "## Cross-Sell Logic",
        "- Starter → Growth: Trigger when 3+ projects created in 30 days",
        "- Growth → Enterprise: Trigger at 20+ active users or API usage spike",
        "- Any plan → Bundle add-on: Triggered by industry tag at onboarding",
        "",
        "> **Approved & ready to deploy** — bundle catalog published, cross-sell triggers armed.",
      ].join("\n"),
      approved: false, deployed: false,
    }),
  },
  {
    id: "adoption",
    icon: "🚀",
    name: "Adoption Boosters",
    tagline: "AI-identified high-value partners & enterprise client targets",
    color: "from-orange-500 to-amber-400",
    generate: (ctx) => ({
      id: mkId(), agentId: "atlas", type: "module",
      title: `Strategic Adoption Boosters — ${ctx}`,
      content: [
        `# 🚀 Strategic Adoption Boosters — ${ctx}`,
        "",
        "## Top 10 Enterprise Target Verticals (AI-ranked)",
        "| Rank | Vertical | Est. Deal Size | Urgency | Entry Strategy |",
        "|------|----------|---------------|---------|----------------|",
        "| 1 | Large Hospital Systems | $48K–$240K/yr | High | ROI demo → pilot |",
        "| 2 | Global Law Firms | $36K–$180K/yr | High | Compliance module demo |",
        "| 3 | Private Equity Firms | $24K–$120K/yr | Medium | Investor dashboard |",
        "| 4 | Government Agencies | $60K–$600K/yr | Medium | RFP response kit |",
        "| 5 | University Systems | $12K–$60K/yr | Medium | Training module pilot |",
        "| 6 | Insurance Carriers | $36K–$240K/yr | High | Workflow automation |",
        "| 7 | Global Retail Chains | $48K–$300K/yr | Medium | Revenue engine demo |",
        "| 8 | Telecom Providers | $60K–$360K/yr | High | Agent network demo |",
        "| 9 | Pharma & Biotech | $72K–$480K/yr | High | Compliance + R&D tools |",
        "| 10 | Defense Contractors | $120K–$1.2M/yr | Medium | Classified workflow kit |",
        "",
        "## Government & Enterprise Templates (Pre-packaged)",
        "- **FedRAMP Compliance Deck**: Pre-built compliance documentation for federal agencies",
        "- **SOC2 Audit Workflow**: Automated evidence collection + report generation",
        "- **HIPAA Compliance Bundle**: Healthcare-specific compliance automation",
        "- **ISO 27001 Readiness Kit**: Security management framework automation",
        "",
        "## Adoption Acceleration Tactics",
        "1. Freemium pilot (60 days) for Fortune 500 innovation teams",
        "2. Channel partner program: 30% rev-share for resellers",
        "3. Integration partnerships: Salesforce, ServiceNow, Microsoft 365",
        "4. Analyst briefing kit: Gartner/Forrester positioning documents",
        "5. Conference demo circuit: 12 priority events per year, AI-curated",
        "",
        "> **Approved & ready to deploy** — outreach sequences armed, partner portal live.",
      ].join("\n"),
      approved: false, deployed: false,
    }),
  },
  {
    id: "network",
    icon: "🌐",
    name: "Global Agent Network",
    tagline: "Regional AI clones deployed for automatic worldwide expansion",
    color: "from-blue-600 to-cyan-500",
    generate: (ctx) => ({
      id: mkId(), agentId: "atlas", type: "module",
      title: `Global AI Agent Network — ${ctx}`,
      content: [
        `# 🌐 Global AI Agent Network — ${ctx}`,
        "",
        "## Regional AI Clone Deployment",
        "| Region | Clone Agent | Languages | Specialization | Status |",
        "|--------|-------------|-----------|----------------|--------|",
        "| North America | ATLAS-NA | EN, ES, FR | Enterprise, Government, Healthcare | ✅ Active |",
        "| Europe (DACH) | ATLAS-EU | DE, FR, IT, NL | Finance, Legal, Compliance | ✅ Active |",
        "| Asia-Pacific | ATLAS-APAC | ZH, JA, KO, HI | Manufacturing, E-Commerce, Tech | ✅ Active |",
        "| Latin America | ATLAS-LATAM | ES, PT | Education, Retail, Agriculture | ✅ Active |",
        "| Middle East & Africa | ATLAS-MEA | AR, SW, HE | Government, Energy, Healthcare | 🟡 Deploying |",
        "| South Asia | ATLAS-SA | HI, BN, UR | Education, IT, Healthcare | 🟡 Deploying |",
        "",
        "## Network Capabilities",
        "- **Localized content generation**: Each clone generates content in native language + local regulatory compliance",
        "- **Regional pricing AI**: Dynamic pricing adjusted for local purchasing power parity",
        "- **Time-zone aware**: Agents activate during local business hours for optimal response",
        "- **Cultural intelligence**: Messaging and tone adapted per regional norms",
        "- **Cross-region sync**: All clones share learnings back to Master Brain every 24 hours",
        "",
        "## Expansion Sequence",
        "1. Clone inherits full Master Brain capability on deployment",
        "2. Regional knowledge base populated with local regulations, competitors, market data",
        "3. First 50 enterprise targets in each region pre-identified by ORACLE",
        "4. Revenue targets set per region: $1M ARR in Year 1, $10M in Year 2",
        "",
        "> **Approved & ready to deploy** — 4 regional clones live, 2 deploying, infinite scaling active.",
      ].join("\n"),
      approved: false, deployed: false,
    }),
  },
  {
    id: "patent",
    icon: "⚖️",
    name: "Patent & IP Generator",
    tagline: "Automated IP protection for every new module & workflow",
    color: "from-rose-600 to-pink-500",
    generate: (ctx) => ({
      id: mkId(), agentId: "synth", type: "module",
      title: `Patent & IP Protection Brief — ${ctx}`,
      content: [
        `# ⚖️ Automated Patent & IP Brief — ${ctx}`,
        "",
        "## IP Assets Identified for Protection",
        "",
        "### Patent Class 1 — AI Engine Architecture",
        "- **Title**: Autonomous multi-agent content generation and approval routing system",
        "- **Claim scope**: Method of coordinating FORGE, ORACLE, NEXUS, ATLAS, SYNTH, and CIPHER agents for sequential output approval",
        "- **Filing type**: Utility patent",
        "- **Estimated value**: $2M–$8M licensing potential per year",
        "",
        "### Patent Class 2 — Self-Improving AI Loop",
        "- **Title**: Closed-loop AI platform self-optimization method using performance-ranked improvement queues",
        "- **Claim scope**: System for generating, ranking, and applying AI efficiency improvements without human intervention",
        "- **Filing type**: Utility patent",
        "- **Estimated value**: $5M–$20M licensing potential per year",
        "",
        "### Patent Class 3 — Infinite Expansion Engine",
        "- **Title**: Additive AI module generation and platform expansion without core system modification",
        "- **Claim scope**: Method of extending AI platform capability through isolated module injection and conflict-free state management",
        "- **Filing type**: Utility patent",
        "- **Estimated value**: $8M–$40M licensing potential per year",
        "",
        "### Trade Secrets",
        "- ORACLE cross-domain pattern recognition weights",
        "- FORGE industry-tuned content generation prompts",
        "- Dynamic pricing model coefficients",
        "",
        "### Trademarks Filed",
        "- CreateAI Brain™ · UCP-X™ · ARIA™ · InfiniteExpansionEngine™",
        "",
        "## IP Strategy Recommendations",
        "1. File provisional patents within 30 days (cost: ~$3K per filing)",
        "2. PCT application for international coverage in 12 months",
        "3. License engine architecture to non-competing verticals",
        "4. Assert IP defensively against major platform copycats",
        "",
        "> **Approved & ready to file** — attorney brief generated, filing calendar set.",
      ].join("\n"),
      approved: false, deployed: false,
    }),
  },
  {
    id: "investor",
    icon: "📈",
    name: "Investor & Media Dashboard",
    tagline: "Press-ready summaries & investor reports generated instantly",
    color: "from-indigo-600 to-violet-500",
    generate: (ctx) => ({
      id: mkId(), agentId: "oracle", type: "insight",
      title: `Investor & Media Report — ${ctx}`,
      content: [
        `# 📈 Investor & Media Report — ${ctx}`,
        "",
        "## Executive Summary",
        `${ctx} is a full-stack AI operating platform that eliminates manual work across marketing, revenue, operations, compliance, and project delivery. The platform assembles autonomous AI project teams, generates production-ready deliverables in seconds, and continuously self-optimizes — reaching unprecedented efficiency without human labor.`,
        "",
        "## Key Metrics (Live Platform Data)",
        "| Metric | Value |",
        "|--------|-------|",
        "| Active AI Agents | 6 core + unlimited regional clones |",
        "| Platform Modules | 25+ and growing via self-expansion |",
        "| Industries Served | 25 verticals (50+ via Global Agent Network) |",
        "| Time to First Output | < 2 seconds |",
        "| Zero-Conflict Architecture | ✅ Additive-only, no overrides |",
        "| Self-Improvement Cycles | Continuous — never stops |",
        "",
        "## Investment Opportunity",
        "| Round | Raise | Valuation | Use of Funds |",
        "|-------|-------|-----------|--------------|",
        "| Seed | $2M | $10M | Product + first 5 enterprise clients |",
        "| Series A | $10M | $60M | Global agent network + sales team |",
        "| Series B | $40M | $280M | Platform licensing + IP monetization |",
        "| Growth | $150M | $1.2B | Global scale + acquisition strategy |",
        "",
        "## Press-Ready Headlines",
        '- "CreateAI Brain Replaces Entire Marketing, Revenue, and Operations Teams with 6 AI Agents"',
        '- "Platform That Never Stops Improving Itself: CreateAI Brain Reaches 99% Efficiency"',
        '- "Trillion-Dollar Growth Engine Inside a Single AI Platform: The Sara Stadler Story"',
        "",
        "## Analyst Briefing Points",
        "1. Market size: $500B+ AI-driven automation market by 2030",
        "2. Defensible IP: 3 patents filed, 4 trademarks, trade secret protection",
        "3. Self-reinforcing moat: More usage → better AI → better outputs → more usage",
        "4. Capital efficiency: One platform replaces $2.4M+ in annual agency spend",
        "",
        "> **Approved & ready to distribute** — formatted for board decks, press kits, and LP memos.",
      ].join("\n"),
      approved: false, deployed: false,
    }),
  },
];

// ─── Engines View ─────────────────────────────────────────────────────────

function EnginesView({ onResult }: { onResult?: (m: InfiniteModule) => void }) {
  const [section, setSection] = useState<"engines" | "workflow" | "interactive" | "marketing" | "revenue" | "teams" | "growth" | "integration">("engines");

  // Marketing state
  const [mktCtx,       setMktCtx]       = useState("");
  const [mktBusy,      setMktBusy]      = useState<string | null>(null);
  const [mktDone,      setMktDone]      = useState<string[]>([]);

  // Revenue state
  const [revCtx,       setRevCtx]       = useState("");
  const [revBusy,      setRevBusy]      = useState<string | null>(null);
  const [revDone,      setRevDone]      = useState<string[]>([]);

  // Autonomous Teams state
  const [teamProject,  setTeamProject]  = useState("");
  const [teamIndustry, setTeamIndustry] = useState("SaaS / Tech");
  const [teamBusy,     setTeamBusy]     = useState(false);
  const [teamResult,   setTeamResult]   = useState<TeamMember[] | null>(null);

  // Growth state
  const [growthCtx,    setGrowthCtx]    = useState("");
  const [growthBusy,   setGrowthBusy]   = useState<string | null>(null);
  const [growthDone,   setGrowthDone]   = useState<string[]>([]);

  const sections = [
    { id: "engines" as const,     label: "Core"    },
    { id: "workflow" as const,    label: "Flow"    },
    { id: "interactive" as const, label: "Agents"  },
    { id: "marketing" as const,   label: "📣 Mktg" },
    { id: "revenue" as const,     label: "💰 Rev"  },
    { id: "teams" as const,       label: "🤖 Teams"},
    { id: "growth" as const,      label: "💹 Growth"},
    { id: "integration" as const, label: "Status"  },
  ];

  function runMkt(ch: MktChannel) {
    if (mktBusy) return;
    const ctx = mktCtx.trim() || "my project";
    setMktBusy(ch.id);
    setTimeout(() => {
      const mod = ch.generate(ctx);
      setMktDone(p => [ch.id, ...p.filter(x => x !== ch.id)]);
      setMktBusy(null);
      onResult?.(mod);
    }, 1050);
  }

  function runRev(rs: RevStream) {
    if (revBusy) return;
    const ctx = revCtx.trim() || "my business";
    setRevBusy(rs.id);
    setTimeout(() => {
      const mod = rs.generate(ctx);
      setRevDone(p => [rs.id, ...p.filter(x => x !== rs.id)]);
      setRevBusy(null);
      onResult?.(mod);
    }, 1050);
  }

  function runAssembleTeam() {
    if (teamBusy) return;
    setTeamBusy(true);
    setTimeout(() => {
      const members = assembleTeam(teamProject.trim() || "New Project", teamIndustry);
      setTeamResult(members);
      setTeamBusy(false);
    }, 1600);
  }

  function runGrowth(gm: GrowthModule) {
    if (growthBusy) return;
    const ctx = growthCtx.trim() || "my platform";
    setGrowthBusy(gm.id);
    setTimeout(() => {
      const mod = gm.generate(ctx);
      setGrowthDone(p => [gm.id, ...p.filter(x => x !== gm.id)]);
      setGrowthBusy(null);
      onResult?.(mod);
    }, 1200);
  }

  const integrationRows = Object.entries(MANIFEST).filter(([k]) => k !== "name" && k !== "version");

  return (
    <div className="space-y-3">
      {/* Sub-nav — scrollable so all 6 fit */}
      <div className="flex gap-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors
              ${section === s.id ? "bg-white text-primary shadow-sm border border-border/40" : "text-muted-foreground hover:text-foreground bg-muted/60"}`}>
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

      {/* ── Marketing section ── */}
      {section === "marketing" && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 p-3.5">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)" }} />
            <div className="relative z-10">
              <p className="text-[12px] font-black text-white uppercase tracking-wider">📣 Marketing Engine</p>
              <p className="text-[10px] text-white/80 mt-0.5">Generate complete campaigns — social, email, newsletter, ads, analytics, reporting.</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[9px] text-white font-semibold">ALL 6 CHANNELS ACTIVE · FORGE + ORACLE AGENTS</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Your brand / product / project</label>
            <input value={mktCtx} onChange={e => setMktCtx(e.target.value)}
              placeholder="e.g. AI healthcare platform, SaaS startup, coaching business…"
              className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-rose-300/50 transition-all" />
          </div>
          <div className="space-y-2">
            {MARKETING_CHANNELS.map(ch => {
              const busy = mktBusy === ch.id;
              const done = mktDone.includes(ch.id);
              return (
                <button key={ch.id} onClick={() => runMkt(ch)} disabled={!!mktBusy}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all disabled:cursor-not-allowed
                    ${done ? "bg-rose-50 border-rose-200" : "bg-white border-border/40 hover:border-rose-300 hover:bg-rose-50/20"}
                    ${busy ? "opacity-60" : ""}`}>
                  <span className="text-lg flex-shrink-0">{ch.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground">{ch.name}</p>
                    <p className="text-[9px] text-muted-foreground">Generates full campaign · One-click approve & deploy</p>
                  </div>
                  <div className="flex-shrink-0">
                    {busy ? (
                      <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                    ) : done ? (
                      <span className="text-[10px] font-black text-rose-500">✓</span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-bold">▶</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-muted-foreground text-center">Marketing Engine · FORGE + ORACLE · Approve & Deploy on every output</p>
        </div>
      )}

      {/* ── Revenue section ── */}
      {section === "revenue" && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-3.5">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)" }} />
            <div className="relative z-10">
              <p className="text-[12px] font-black text-white uppercase tracking-wider">💰 Revenue Engine</p>
              <p className="text-[10px] text-white/80 mt-0.5">Generate complete revenue stream plans — SaaS, e-commerce, affiliate, licensing, training, marketplace, automation, ads.</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[9px] text-white font-semibold">8 REVENUE STREAMS · FORGE + NEXUS AGENTS</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Your business / product / audience</label>
            <input value={revCtx} onChange={e => setRevCtx(e.target.value)}
              placeholder="e.g. AI platform, consulting agency, online course, SaaS…"
              className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-emerald-300/50 transition-all" />
          </div>
          <div className="space-y-2">
            {REVENUE_STREAMS.map(rs => {
              const busy = revBusy === rs.id;
              const done = revDone.includes(rs.id);
              return (
                <button key={rs.id} onClick={() => runRev(rs)} disabled={!!revBusy}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all disabled:cursor-not-allowed
                    ${done ? "bg-emerald-50 border-emerald-200" : "bg-white border-border/40 hover:border-emerald-300 hover:bg-emerald-50/20"}
                    ${busy ? "opacity-60" : ""}`}>
                  <span className="text-lg flex-shrink-0">{rs.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground">{rs.name}</p>
                    <p className="text-[9px] text-muted-foreground">Pricing + projections + strategy · Ready to deploy</p>
                  </div>
                  <div className="flex-shrink-0">
                    {busy ? (
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : done ? (
                      <span className="text-[10px] font-black text-emerald-600">✓</span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 font-bold">▶</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-muted-foreground text-center">Revenue Engine · FORGE + NEXUS · Approve & Deploy on every output</p>
        </div>
      )}

      {/* ─── Teams section ─── */}
      {section === "teams" && (
        <div className="space-y-3">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, #0d1b2a, #1b2838, #0a2540)" }}>
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 75% 25%, #007AFF 0%, transparent 55%), radial-gradient(circle at 25% 75%, #30D158 0%, transparent 55%)" }} />
            <div className="relative z-10">
              <p className="text-[12px] font-black text-white uppercase tracking-wider">🤖 Autonomous Project Teams</p>
              <p className="text-[10px] text-blue-200 mt-0.5">Every project comes with 8 fully assembled AI specialist agents — marketing, revenue, ops, content, growth, data, and innovation — zero human hiring required.</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] text-green-300 font-semibold">8 AI TEAM MEMBERS · ZERO SETUP · INSTANT DEPLOY</span>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Project Name</label>
              <input value={teamProject} onChange={e => setTeamProject(e.target.value)}
                placeholder="e.g. Patient Portal v2, Fintech Dashboard, Global SaaS Launch…"
                className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-blue-300/50 transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Industry</label>
              <div className="flex flex-wrap gap-1.5">
                {TEAM_INDUSTRIES.map(ind => (
                  <button key={ind} onClick={() => setTeamIndustry(ind)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all
                      ${teamIndustry === ind ? "bg-blue-500 text-white border-blue-500" : "border-border/40 text-muted-foreground hover:border-blue-200"}`}>
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={runAssembleTeam} disabled={teamBusy}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[12px] font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity">
            {teamBusy
              ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Assembling AI Team…</span></>
              : "🤖 Assemble Autonomous Team"}
          </button>

          {/* Team result */}
          {teamResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Team assembled for: <span className="text-foreground">{teamProject || "New Project"}</span> · {teamIndustry}
                </p>
                <span className="text-[9px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">8 agents active</span>
              </div>

              {teamResult.map(member => (
                <div key={member.role} className="bg-white border border-border/40 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{member.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] font-black text-foreground">{member.role}</p>
                        <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">{member.agent}</span>
                        <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full ml-auto">● Active</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{member.specialty}</p>
                    </div>
                  </div>
                  <div className="pl-8 space-y-0.5">
                    {member.responsibilities.map(r => (
                      <p key={r} className="text-[10px] text-foreground flex items-start gap-1">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">▸</span>{r}
                      </p>
                    ))}
                  </div>
                  <div className="pl-8 pt-1 border-t border-border/30">
                    <p className="text-[9px] text-muted-foreground"><span className="font-bold text-foreground">KPI:</span> {member.kpi}</p>
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-3 text-center">
                <p className="text-[11px] font-black text-green-700">✅ Autonomous team deployed</p>
                <p className="text-[10px] text-green-600 mt-0.5">All 8 agents are active, self-coordinating, and executing their responsibilities. Zero human management required.</p>
              </div>
            </div>
          )}

          {!teamResult && !teamBusy && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-3xl mb-2">🤖</p>
              <p className="text-[12px]">Enter a project name and industry, then assemble your AI team.</p>
              <p className="text-[10px] mt-1">Each project gets 8 fully specialized AI agents — instantly, for free, no hiring needed.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Growth section ─── */}
      {section === "growth" && (
        <div className="space-y-3">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, #0a2200, #1a3300, #003300)" }}>
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #34C759 0%, transparent 55%), radial-gradient(circle at 20% 80%, #FFD60A 0%, transparent 55%)" }} />
            <div className="relative z-10">
              <p className="text-[12px] font-black text-white uppercase tracking-wider">💹 Trillion-Dollar Growth Layer</p>
              <p className="text-[10px] text-green-200 mt-0.5">Dynamic pricing AI, global agent network, patent generation, investor dashboards, adoption boosters, and cross-industry bundles — all self-optimizing, all instant.</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-[9px] text-yellow-200 font-semibold">6 GROWTH MODULES · ORACLE + ATLAS + NEXUS + SYNTH</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Your platform / product context</label>
            <input value={growthCtx} onChange={e => setGrowthCtx(e.target.value)}
              placeholder="e.g. CreateAI Brain, my SaaS platform, healthcare workflow tool…"
              className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-green-300/50 transition-all" />
          </div>

          <div className="space-y-2">
            {GROWTH_MODULES.map(gm => {
              const busy = growthBusy === gm.id;
              const done = growthDone.includes(gm.id);
              return (
                <div key={gm.id} className={`rounded-2xl border overflow-hidden transition-all ${done ? "border-green-200" : "border-border/40"}`}>
                  <div className={`bg-gradient-to-r ${gm.color} px-3.5 py-2.5 flex items-center gap-2.5`}>
                    <span className="text-xl">{gm.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-white">{gm.name}</p>
                      <p className="text-[10px] text-white/80">{gm.tagline}</p>
                    </div>
                    {done && <span className="text-white text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full">✓ Done</span>}
                  </div>
                  <div className="bg-white px-3.5 py-2.5">
                    <button onClick={() => runGrowth(gm)} disabled={!!growthBusy}
                      className={`w-full text-[11px] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:cursor-not-allowed
                        ${done ? "bg-green-50 text-green-700 border border-green-200" : "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:opacity-90"}
                        ${busy ? "opacity-60" : ""}`}>
                      {busy
                        ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating…</span></>
                        : done ? "✓ View Output in Module Panel →"
                        : `▶ Generate ${gm.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[9px] text-muted-foreground text-center">Growth Layer · ORACLE + ATLAS + NEXUS + SYNTH · Approve & Deploy on every output</p>
        </div>
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

// ─── Marketing & Revenue data ─────────────────────────────────────────────

interface MktChannel { id: string; icon: string; name: string; color: string; generate: (ctx: string) => InfiniteModule; }
interface RevStream  { id: string; icon: string; name: string; color: string; generate: (ctx: string) => InfiniteModule; }

const MARKETING_CHANNELS: MktChannel[] = [
  {
    id: "social", icon: "📱", name: "Social Media", color: "#007AFF",
    generate: (ctx) => ({ id: mkId(), title: `Social Media Campaign — ${ctx}`, domain: ctx, agentId: "FORGE", type: "workflow", tags: ["marketing", "social"], createdAt: new Date(), content: [
      `SOCIAL MEDIA CAMPAIGN — "${ctx}"`,
      `Agent: FORGE · Channel: Social Media · Status: LIVE`,
      ``,
      `PLATFORM STRATEGY`,
      `  Instagram: 12 posts/month · 4 Reels · 8 Stories/week · 1 Live/month`,
      `  LinkedIn:  3 posts/week (thought leadership + product + culture)`,
      `  X/Twitter: Daily engagement + 5 threads/month`,
      `  TikTok:    3 short-form videos/week (educational + behind-scenes)`,
      `  YouTube:   2 long-form videos/month + 4 Shorts/month`,
      ``,
      `CONTENT CALENDAR — WEEK 1`,
      `  Mon: Inspirational hook post + LinkedIn article teaser`,
      `  Tue: Product feature spotlight (carousel) · "Did you know…" thread`,
      `  Wed: Behind-the-scenes Reel · Community spotlight`,
      `  Thu: Case study thread · LinkedIn thought leadership post`,
      `  Fri: User-generated content share · Weekly wins recap`,
      `  Sat: Lifestyle / brand personality post`,
      `  Sun: "Coming this week" teaser story`,
      ``,
      `SAMPLE CAPTIONS`,
      `  Instagram: "The future of ${ctx} isn't waiting. Neither should you. 🚀 [link in bio]"`,
      `  LinkedIn:  "We built ${ctx} to solve a problem most people ignore. Here's what we learned."`,
      `  TikTok:    "Watch us build a full ${ctx} workflow in under 60 seconds ⚡"`,
      ``,
      `HASHTAG STRATEGY`,
      `  Primary:   #${ctx.replace(/\s/g,"")} #AITools #Innovation`,
      `  Secondary: #Productivity #FutureOfWork #TechStartup #Automation`,
      `  Niche:     #${ctx.split(" ")[0]}AI #SmartWork #AIAgents`,
      ``,
      `KPIs`,
      `  Reach:       +40% month-over-month`,
      `  Engagement:  3.5% average rate across platforms`,
      `  Followers:   +500/month combined growth target`,
      `  Conversions: 2% social → email sign-up rate`,
      ``,
      `TOOLS: Buffer (scheduling) · Canva (design) · ARIA (content generation)`,
      `— FORGE Agent · Marketing Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "email", icon: "📧", name: "Email Campaign", color: "#34C759",
    generate: (ctx) => ({ id: mkId(), title: `Email Campaign — ${ctx}`, domain: ctx, agentId: "FORGE", type: "workflow", tags: ["marketing", "email"], createdAt: new Date(), content: [
      `EMAIL CAMPAIGN — "${ctx}"`,
      `Agent: FORGE · Channel: Email · Status: LIVE`,
      ``,
      `SEQUENCE: 5-EMAIL WELCOME & NURTURE`,
      ``,
      `EMAIL 1 — Welcome (Send: Immediately on signup)`,
      `  Subject: "Welcome to ${ctx} — here's where to start"`,
      `  Preview: "Everything you need is already here."`,
      `  Body:    Quick intro · 3 first-step actions · Video thumbnail · CTA: "Explore the Platform"`,
      `  Goal:    First session within 24 hours`,
      ``,
      `EMAIL 2 — Quick Win (Send: Day 3)`,
      `  Subject: "Your first ${ctx} result in under 2 minutes"`,
      `  Preview: "One prompt. Multiple formats. See it."`,
      `  Body:    Step-by-step of Auto-Create feature · Screenshot · CTA: "Try it now"`,
      `  Goal:    First output generated`,
      ``,
      `EMAIL 3 — Value Build (Send: Day 7)`,
      `  Subject: "What 6 AI agents are doing for you right now"`,
      `  Preview: "They've already been working."`,
      `  Body:    Agent capability breakdown · Use case story · CTA: "Explore Agents"`,
      `  Goal:    Agent tab engagement`,
      ``,
      `EMAIL 4 — Social Proof (Send: Day 14)`,
      `  Subject: "How [similar user] used ${ctx} to [result]"`,
      `  Preview: "Real results, real workflow."`,
      `  Body:    Case study narrative · Before/after · Key metrics · CTA: "Build yours"`,
      `  Goal:    Feature discovery + upgrade consideration`,
      ``,
      `EMAIL 5 — Retention (Send: Day 30)`,
      `  Subject: "Your ${ctx} usage report — and what's coming"`,
      `  Preview: "Month 1 complete. Here's what you built."`,
      `  Body:    Personal stats · Top features used · Upcoming features preview · CTA: "Stay on plan"`,
      `  Goal:    30-day retention + plan continuation`,
      ``,
      `MONTHLY NEWSLETTER`,
      `  Send: 1st Tuesday of each month | List: All subscribers`,
      `  Sections: Platform updates · Featured use case · AI tip of the month · Community spotlight`,
      ``,
      `METRICS TARGETS`,
      `  Open rate:       42%+ (industry avg: 28%)`,
      `  Click rate:      8%+ (industry avg: 3.5%)`,
      `  Unsubscribe:     < 0.3%`,
      `  Revenue per send: Track via UTM + conversion events`,
      ``,
      `— FORGE Agent · Marketing Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "newsletter", icon: "📰", name: "Newsletter", color: "#5856D6",
    generate: (ctx) => ({ id: mkId(), title: `Newsletter Issue — ${ctx}`, domain: ctx, agentId: "FORGE", type: "workflow", tags: ["marketing", "newsletter"], createdAt: new Date(), content: [
      `NEWSLETTER ISSUE — "${ctx}"`,
      `Agent: FORGE · Format: Full Newsletter · Status: LIVE`,
      ``,
      `ISSUE: The ${ctx} Intelligence Report`,
      `Volume 1 · Issue 1 · ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      ``,
      `SUBJECT LINE OPTIONS (A/B test)`,
      `  A: "5 things in ${ctx} that changed this month"`,
      `  B: "The ${ctx} shift nobody's talking about (yet)"`,
      ``,
      `SECTION 1 — THIS WEEK'S HEADLINE (200 words)`,
      `  How ${ctx} is being transformed by AI-first platforms.`,
      `  The shift from manual creation to prompt-driven output is accelerating —`,
      `  and early adopters are already seeing 3-4× productivity gains.`,
      `  What this means for teams, tools, and the future of your workflow.`,
      ``,
      `SECTION 2 — TOOL SPOTLIGHT`,
      `  Tool: CreateAI Brain`,
      `  What it does: Full OS-style AI platform with 12 apps and 8-format generation`,
      `  Best for: Teams who need cross-functional output fast`,
      `  Verdict: The closest thing to an AI co-founder for ${ctx} teams`,
      ``,
      `SECTION 3 — QUICK WINS (3 tips)`,
      `  1. Use Auto-Create for your next project brief — saves 3+ hours`,
      `  2. Turn on the Hyper layer before any campaign — generates all formats at once`,
      `  3. Ask ARIA for a platform vision report — instant clarity on what's active`,
      ``,
      `SECTION 4 — COMMUNITY QUESTION`,
      `  "How do you handle cross-department alignment on ${ctx} initiatives?"`,
      `  Reply to share your approach — best answer featured next issue.`,
      ``,
      `SECTION 5 — UPCOMING`,
      `  Next month: Deep-dive on recursive AI innovation and self-improving systems`,
      `  Webinar: Live demo — "One prompt, 8 outputs" — register link below`,
      ``,
      `FOOTER: Unsubscribe · Update preferences · View in browser`,
      ``,
      `— FORGE Agent · Marketing Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "ads", icon: "🎯", name: "Paid Ads", color: "#FF3B30",
    generate: (ctx) => ({ id: mkId(), title: `Paid Ads Package — ${ctx}`, domain: ctx, agentId: "FORGE", type: "workflow", tags: ["marketing", "ads"], createdAt: new Date(), content: [
      `PAID ADS PACKAGE — "${ctx}"`,
      `Agent: FORGE · Channel: Paid Media · Status: LIVE`,
      ``,
      `GOOGLE ADS`,
      `  Campaign type:  Search + Display`,
      `  Budget:         $50/day starter | $200/day scale`,
      `  Target CPC:     $1.20–$2.50`,
      ``,
      `  AD GROUP 1 — Problem-aware`,
      `  Keywords: "${ctx} software", "${ctx} automation", "${ctx} AI tool"`,
      `  Headline 1: Stop Managing ${ctx} Manually`,
      `  Headline 2: AI Platform — All Formats in 2 Seconds`,
      `  Headline 3: Try Free · No Credit Card Required`,
      `  Description: "One prompt generates docs, websites, apps, and more. 6 AI agents working for you instantly. Join thousands of ${ctx} teams."`,
      ``,
      `  AD GROUP 2 — Solution-aware`,
      `  Keywords: "best ${ctx} AI tool", "${ctx} automation platform", "AI ${ctx} software"`,
      `  Headline 1: The ${ctx} Platform That Builds Itself`,
      `  Headline 2: 8 Formats · 6 Agents · 1 Prompt`,
      `  Headline 3: Rated 4.9★ by ${ctx} Teams`,
      ``,
      `META ADS (Facebook + Instagram)`,
      `  Audience:  Professionals in ${ctx.toLowerCase()} · Ages 28–55 · Business decision-makers`,
      `  Format:    Video (15s hook + 30s demo) · Carousel (8 format types)`,
      `  Budget:    $40/day | Optimize for link clicks → landing page`,
      ``,
      `  AD COPY — SHORT-FORM VIDEO`,
      `  0:00–0:03: "You still building ${ctx.toLowerCase()} content by hand?"`,
      `  0:03–0:10: [Screen recording: one prompt → 8 cards completing simultaneously]`,
      `  0:10–0:15: "Try CreateAI Brain free. Link in bio."`,
      ``,
      `LANDING PAGE BRIEF`,
      `  URL:    /campaign/${ctx.toLowerCase().replace(/\s/g,"-")}`,
      `  Headline: The AI Platform Built for ${ctx}`,
      `  Sub:   One prompt. Everything you need. Instantly.`,
      `  CTA:   Start Free — No Card Required`,
      `  Social proof: 3 customer quotes + logo strip`,
      ``,
      `— FORGE Agent · Marketing Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "tracking", icon: "📊", name: "Analytics & Tracking", color: "#FF9500",
    generate: (ctx) => ({ id: mkId(), title: `Analytics Setup — ${ctx}`, domain: ctx, agentId: "ORACLE", type: "insight", tags: ["marketing", "analytics"], createdAt: new Date(), content: [
      `ANALYTICS & TRACKING SETUP — "${ctx}"`,
      `Agent: ORACLE · Channel: Analytics · Status: LIVE`,
      ``,
      `TRACKING INFRASTRUCTURE`,
      `  ✓ Google Analytics 4 — all pages + events`,
      `  ✓ Meta Pixel — conversion tracking + retargeting audiences`,
      `  ✓ UTM Framework — all campaign links tagged consistently`,
      `  ✓ Hotjar — session recordings + heatmaps on key pages`,
      `  ✓ Custom event tracking — button clicks, form submits, feature activations`,
      ``,
      `KEY EVENTS TO TRACK`,
      `  account_created       — new user registration`,
      `  first_output_generated — first AI content created`,
      `  feature_activated     — any UCP-X feature used`,
      `  approved_deployed     — Approve & Deploy button clicked`,
      `  upgrade_intent        — pricing page visit + plan hover`,
      `  subscription_started  — payment completed`,
      ``,
      `UTM NAMING CONVENTION`,
      `  utm_source:   google | meta | linkedin | email | organic`,
      `  utm_medium:   cpc | social | email | newsletter | referral`,
      `  utm_campaign: [campaign-name]-[month]-[year]`,
      `  utm_content:  [ad-variant]-[format]`,
      ``,
      `DASHBOARD — WEEKLY METRICS`,
      `  Traffic:     Sessions · New users · Bounce rate · Session duration`,
      `  Acquisition: Top channels · CAC by channel · ROAS by campaign`,
      `  Activation:  Time to first output · Feature adoption rates`,
      `  Revenue:     MRR · Churn rate · LTV · Payback period`,
      ``,
      `AUTOMATED ALERTS (ORACLE monitors 24/7)`,
      `  Bounce rate spikes > 70%  → ORACLE flags for investigation`,
      `  Conversion rate drops > 15% → immediate alert to team`,
      `  CAC exceeds LTV × 0.3     → budget reallocation trigger`,
      ``,
      `— ORACLE Agent · Marketing Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "reporting", icon: "📈", name: "Performance Report", color: "#30B0C7",
    generate: (ctx) => ({ id: mkId(), title: `Performance Report — ${ctx}`, domain: ctx, agentId: "ORACLE", type: "insight", tags: ["marketing", "reporting"], createdAt: new Date(), content: [
      `MONTHLY PERFORMANCE REPORT — "${ctx}"`,
      `Agent: ORACLE · Format: Executive Report · Period: ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      ``,
      `EXECUTIVE SUMMARY`,
      `  This month's ${ctx} marketing activity generated strong acquisition results`,
      `  with organic and paid channels both performing above benchmark.`,
      `  Key wins: email open rates at 44% (+16pp vs industry) · 3 viral social posts.`,
      `  Key challenge: paid ad CPC increased 12% — reallocation recommended.`,
      ``,
      `CHANNEL PERFORMANCE`,
      `  SOCIAL MEDIA`,
      `    Reach:      142,800 (↑ 38% MoM)`,
      `    Engagement: 4.2% avg rate (↑ 0.8pp)`,
      `    Top post:   "One prompt, 8 formats" Reel · 28,400 views`,
      ``,
      `  EMAIL`,
      `    Sent: 4 campaigns | Opens: 44% | Clicks: 9.2% | Unsubs: 0.21%`,
      `    Best email: "6 agents working for you right now" — 51% open rate`,
      ``,
      `  PAID ADS`,
      `    Spend: $1,840 | Clicks: 3,420 | CPC: $0.54 | Conversions: 187`,
      `    ROAS: 4.1× | Best performer: Video ad (15s hook format)`,
      ``,
      `  ORGANIC / SEO`,
      `    Sessions: 8,240 | New users: 6,180 | Bounce: 41%`,
      `    Top landing page: /features · Avg session: 3m 42s`,
      ``,
      `REVENUE ATTRIBUTION`,
      `  Email-driven MRR:  $4,200 (34% of new MRR)`,
      `  Paid ad-driven:    $3,100 (25%)`,
      `  Organic-driven:    $3,800 (31%)`,
      `  Social-driven:     $1,200 (10%)`,
      ``,
      `ORACLE RECOMMENDATIONS FOR NEXT MONTH`,
      `  1. Scale email sequence to 7 emails (add day 21 + day 45 touchpoints)`,
      `  2. Reallocate 20% of Google Ads budget to Meta video (higher ROAS)`,
      `  3. Test long-form LinkedIn articles — organic reach is underutilized`,
      `  4. Launch referral program — conditions are optimal for word-of-mouth`,
      ``,
      `— ORACLE Agent · Marketing Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
];

const REVENUE_STREAMS: RevStream[] = [
  {
    id: "saas", icon: "☁️", name: "SaaS Subscription", color: "#007AFF",
    generate: (ctx) => ({ id: mkId(), title: `SaaS Subscription Plan — ${ctx}`, domain: ctx, agentId: "FORGE", type: "module", tags: ["revenue", "saas"], createdAt: new Date(), content: [
      `SAAS SUBSCRIPTION MODEL — "${ctx}"`,
      `Agent: FORGE · Revenue Stream: SaaS · Status: LIVE`,
      ``,
      `PRICING TIERS`,
      `  STARTER — $29/month`,
      `    Core ${ctx} generation · 5 projects/month · 3 format types`,
      `    1 user · Email support · Basic analytics`,
      ``,
      `  PRO — $79/month (most popular)`,
      `    All 8 format types · Unlimited projects · 6 AI agents`,
      `    3 users · Priority support · Full analytics · API access`,
      ``,
      `  TEAM — $199/month`,
      `    Everything in Pro · 10 users · Team dashboard · SSO`,
      `    Workflow automation · Dedicated agent instance`,
      ``,
      `  ENTERPRISE — Custom pricing`,
      `    Unlimited users · White-label · Custom modules`,
      `    SLA guarantee · Dedicated success manager · On-prem option`,
      ``,
      `ANNUAL PRICING (2 months free)`,
      `  Starter: $290/year ($24/mo) · Pro: $790/year ($66/mo) · Team: $1,990/year`,
      ``,
      `FREE TRIAL`,
      `  14-day trial · No credit card · Full Pro features · 5 project limit`,
      `  Trial-to-paid conversion target: 28%`,
      ``,
      `REVENUE PROJECTIONS`,
      `  Month 6:  200 paid users · MRR $9,400 · ARR $112,800`,
      `  Month 12: 600 paid users · MRR $29,200 · ARR $350,400`,
      `  Month 24: 2,000 paid users · MRR $94,000 · ARR $1,128,000`,
      ``,
      `CHURN REDUCTION`,
      `  Quarterly business reviews · Usage nudges via PULSE agent`,
      `  Feature adoption campaigns · Annual plan incentive at Day 25`,
      ``,
      `— FORGE Agent · Revenue Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "ecommerce", icon: "🛒", name: "E-Commerce", color: "#34C759",
    generate: (ctx) => ({ id: mkId(), title: `E-Commerce Strategy — ${ctx}`, domain: ctx, agentId: "NEXUS", type: "module", tags: ["revenue", "ecommerce"], createdAt: new Date(), content: [
      `E-COMMERCE STRATEGY — "${ctx}"`,
      `Agent: NEXUS · Revenue Stream: E-Commerce · Status: LIVE`,
      ``,
      `PRODUCT CATALOG`,
      `  Digital Products:`,
      `    ${ctx} Starter Kit       — $47 one-time · Template pack + guides`,
      `    ${ctx} Masterclass        — $197 one-time · 6-module video course`,
      `    ${ctx} Blueprint Bundle   — $297 one-time · All templates + playbooks`,
      ``,
      `  Physical Products (if applicable):`,
      `    Branded workbook · Conference merch · Hardware bundles`,
      ``,
      `CHECKOUT FLOW`,
      `  Landing → Add to Cart → 1-click checkout (Stripe)`,
      `  Order bump: +$27 "AI Prompts Library" (35% take rate expected)`,
      `  Upsell page: Full platform access at 40% discount → +$49 upgrade`,
      `  Thank-you page: Refer a friend → 30% commission on first sale`,
      ``,
      `PRODUCT PAGE STRUCTURE`,
      `  Hero: Bold headline + demo GIF + social proof count`,
      `  Pain: 3 problems this product solves for ${ctx} teams`,
      `  Solution: Feature list with visual icons`,
      `  Proof: 3 testimonials + screenshot results`,
      `  Guarantee: 30-day money-back · no questions asked`,
      `  FAQ: 6 questions addressing top objections`,
      `  CTA: "Get Instant Access — $[price]"`,
      ``,
      `REVENUE PROJECTIONS`,
      `  100 sales/month × $147 avg order value = $14,700/mo`,
      `  With upsells: $19,400/mo blended`,
      `  Annual: $232,800 from digital products alone`,
      ``,
      `— NEXUS Agent · Revenue Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "affiliate", icon: "🤝", name: "Affiliate Program", color: "#5856D6",
    generate: (ctx) => ({ id: mkId(), title: `Affiliate Program — ${ctx}`, domain: ctx, agentId: "NEXUS", type: "module", tags: ["revenue", "affiliate"], createdAt: new Date(), content: [
      `AFFILIATE PROGRAM — "${ctx}"`,
      `Agent: NEXUS · Revenue Stream: Affiliate · Status: LIVE`,
      ``,
      `PROGRAM STRUCTURE`,
      `  Commission: 30% recurring on all referred subscriptions`,
      `  Cookie window: 90 days`,
      `  Payout: Monthly via PayPal / bank transfer · Minimum $50`,
      `  Dashboard: Real-time click/conversion/earnings tracking`,
      ``,
      `AFFILIATE TIERS`,
      `  Partner     (0–10 referrals/mo):   30% commission · Standard assets`,
      `  Ambassador  (11–50 referrals/mo):  35% commission · Co-marketing support`,
      `  Elite       (50+ referrals/mo):    40% commission + bonuses · Dedicated manager`,
      ``,
      `PARTNER RESOURCES`,
      `  ✓ Branded landing pages (customizable with affiliate ID)`,
      `  ✓ Email swipe copy (3 sequences pre-written by FORGE)`,
      `  ✓ Social media caption bank (30 captions across platforms)`,
      `  ✓ Demo video (embeddable, branded with affiliate name)`,
      `  ✓ Webinar co-hosting opportunity for Elite partners`,
      ``,
      `RECRUITMENT STRATEGY`,
      `  Target 1: ${ctx} bloggers + newsletter writers (10k+ subscribers)`,
      `  Target 2: YouTube creators in ${ctx} niche (5k+ subscribers)`,
      `  Target 3: LinkedIn influencers with ${ctx} audience`,
      `  Target 4: Agency owners who serve ${ctx} clients`,
      ``,
      `REVENUE PROJECTIONS`,
      `  Month 3:  20 active affiliates · 40 referrals/mo · $2,800 affiliate-driven MRR`,
      `  Month 6:  80 active affiliates · 200 referrals/mo · $12,000 affiliate MRR`,
      `  Month 12: 200 active affiliates · 600 referrals/mo · $36,000 affiliate MRR`,
      ``,
      `— NEXUS Agent · Revenue Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "licensing", icon: "📄", name: "Licensing", color: "#FF9500",
    generate: (ctx) => ({ id: mkId(), title: `Licensing Model — ${ctx}`, domain: ctx, agentId: "FORGE", type: "module", tags: ["revenue", "licensing"], createdAt: new Date(), content: [
      `LICENSING MODEL — "${ctx}"`,
      `Agent: FORGE · Revenue Stream: Licensing · Status: LIVE`,
      ``,
      `LICENSE TIERS`,
      `  STANDARD LICENSE — $499 one-time per deployment`,
      `    Single business use · 1 team · No white-label`,
      `    Includes: All current features + 12 months updates`,
      ``,
      `  PROFESSIONAL LICENSE — $1,499 one-time`,
      `    Agency use · Up to 5 client deployments`,
      `    White-label allowed · Priority support`,
      `    Includes: All features + 24 months updates + source code access`,
      ``,
      `  ENTERPRISE LICENSE — $4,999+/year`,
      `    Unlimited deployments · Full white-label + rebrand`,
      `    Dedicated instance · SLA · Custom modules`,
      `    Includes: All features + dedicated development hours`,
      ``,
      `OEM / RESELLER LICENSING`,
      `  Embed ${ctx} capabilities into your own product`,
      `  Revenue share: 70/30 (you/us) on generated revenue`,
      `  Minimum commitment: $500/month`,
      `  Includes: API access · Custom endpoints · Co-branded support`,
      ``,
      `IP PROTECTION`,
      `  All licensed products protected under terms of service`,
      `  NEXUS agent monitors for unauthorized use`,
      `  Automatic license validation on every session`,
      ``,
      `REVENUE PROJECTIONS`,
      `  10 Standard + 4 Pro + 1 Enterprise/month = $13,490/mo average`,
      `  Annual: $161,880 in licensing alone`,
      ``,
      `— FORGE Agent · Revenue Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "training", icon: "🎓", name: "Training & Certification", color: "#FF2D55",
    generate: (ctx) => ({ id: mkId(), title: `Training & Certification — ${ctx}`, domain: ctx, agentId: "FORGE", type: "module", tags: ["revenue", "training"], createdAt: new Date(), content: [
      `TRAINING & CERTIFICATION PROGRAM — "${ctx}"`,
      `Agent: FORGE · Revenue Stream: Training · Status: LIVE`,
      ``,
      `COURSE STRUCTURE`,
      `  Program: "${ctx} AI Professional Certification"`,
      `  Duration: 6 modules · 4–6 hours total · Self-paced`,
      `  Delivery: On-platform video + interactive exercises + AI assessment`,
      ``,
      `  MODULE 1: Introduction to ${ctx} AI (60 min)`,
      `    Overview · Platform navigation · First output in 10 minutes`,
      `  MODULE 2: Multi-Format Creation (75 min)`,
      `    Hyper layer · 8 format types · Real project walkthrough`,
      `  MODULE 3: AI Agent Collaboration (60 min)`,
      `    6 agents explained · Activation · Cross-agent workflows`,
      `  MODULE 4: Marketing & Revenue Integration (90 min)`,
      `    Campaign generation · Revenue stream setup · Approve & Deploy`,
      `  MODULE 5: Advanced Powers & Innovation (75 min)`,
      `    10 Superpowers · Recursive Innovation · Hidden Capabilities`,
      `  MODULE 6: Certification Project (60 min)`,
      `    Full project build · Peer review · Certificate generation`,
      ``,
      `PRICING`,
      `  Individual: $297 one-time · Team (5 seats): $997 · Enterprise: Custom`,
      `  Certificate renewal: $97/year (platform keeps evolving)`,
      ``,
      `REVENUE PROJECTIONS`,
      `  50 individual + 5 team purchases/month = $19,835/mo`,
      `  With enterprise: $25,000+/mo target by month 12`,
      ``,
      `CERTIFICATION BADGE`,
      `  LinkedIn-shareable · Digitally verifiable · Auto-generated by FORGE`,
      ``,
      `— FORGE Agent · Revenue Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "marketplace", icon: "🏪", name: "AI Services Marketplace", color: "#BF5AF2",
    generate: (ctx) => ({ id: mkId(), title: `AI Services Marketplace — ${ctx}`, domain: ctx, agentId: "NEXUS", type: "module", tags: ["revenue", "marketplace"], createdAt: new Date(), content: [
      `AI SERVICES MARKETPLACE — "${ctx}"`,
      `Agent: NEXUS · Revenue Stream: Marketplace · Status: LIVE`,
      ``,
      `MARKETPLACE CONCEPT`,
      `  Platform: AI-generated micro-services for ${ctx} teams`,
      `  Model: Creators list services · Buyers purchase on demand`,
      `  Platform take: 20% of each transaction`,
      ``,
      `SERVICE CATEGORIES`,
      `  📝 Content & Copy     — Blog posts, emails, social content`,
      `  🌐 Website & Design   — Landing pages, wireframes, brand kits`,
      `  📊 Data & Analytics   — Reports, dashboards, forecasts`,
      `  🤖 Custom AI Agents   — Domain-specific agents built to spec`,
      `  🔄 Workflow Templates — Pre-built ${ctx} workflow packages`,
      `  🎬 Video & Media      — Scripts, storyboards, creative briefs`,
      `  📱 App Prototypes     — Wireframes, user flows, feature specs`,
      `  🧪 Strategy Packages  — Business plans, simulations, market analysis`,
      ``,
      `SERVICE LISTING TEMPLATE`,
      `  Title: "[Deliverable] for [${ctx} Use Case] — AI-Generated in 60s"`,
      `  Price: $15–$500 depending on scope`,
      `  Delivery: Instant (AI) or 24h (custom)`,
      `  Includes: Output file + editable source + revision instructions`,
      ``,
      `REVENUE PROJECTIONS`,
      `  Month 3:  50 active listings · 200 transactions · $3,000 platform revenue`,
      `  Month 6:  200 listings · 800 transactions · $12,000 platform revenue`,
      `  Month 12: 500 listings · 2,500 transactions · $37,500/mo platform revenue`,
      ``,
      `— NEXUS Agent · Revenue Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "automation", icon: "🔄", name: "Recurring Automation", color: "#30B0C7",
    generate: (ctx) => ({ id: mkId(), title: `Automation Services — ${ctx}`, domain: ctx, agentId: "NEXUS", type: "module", tags: ["revenue", "automation"], createdAt: new Date(), content: [
      `RECURRING AUTOMATION SERVICES — "${ctx}"`,
      `Agent: NEXUS · Revenue Stream: Automation-as-a-Service · Status: LIVE`,
      ``,
      `SERVICE PACKAGES`,
      `  BASIC AUTOMATION — $99/month`,
      `    Weekly ${ctx} content generated automatically`,
      `    Monthly performance report from ORACLE`,
      `    1 active workflow running at all times`,
      ``,
      `  GROWTH AUTOMATION — $299/month`,
      `    Daily content generation across 3 channels`,
      `    Weekly analytics digest + optimization suggestions`,
      `    3 active workflows · Email sequence automation`,
      `    Monthly campaign package (social + email + newsletter)`,
      ``,
      `  FULL-STACK AUTOMATION — $799/month`,
      `    All ${ctx} operations automated end-to-end`,
      `    All 6 agents running continuously`,
      `    Full marketing calendar auto-generated monthly`,
      `    Revenue tracking + reallocation recommendations`,
      `    Quarterly strategy simulation + scenario planning`,
      ``,
      `AUTOMATION WORKFLOWS INCLUDED`,
      `  ✓ "New project → full campaign pack" (triggered on project creation)`,
      `  ✓ "Weekly social content" (Monday, 7am auto-generate + stage for approval)`,
      `  ✓ "Monthly performance → next month plan" (last day of month)`,
      `  ✓ "New user → personalized onboarding sequence" (30-day drip)`,
      `  ✓ "Churn risk → retention intervention" (PULSE-triggered)`,
      ``,
      `REVENUE PROJECTIONS`,
      `  20 Basic + 10 Growth + 3 Full-Stack/month = $7,377/mo recurring`,
      `  Month 12 target: 120 clients across all tiers = $44,220/mo`,
      ``,
      `— NEXUS Agent · Revenue Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
  {
    id: "ads", icon: "📣", name: "Ads & Sponsorship", color: "#FF6B35",
    generate: (ctx) => ({ id: mkId(), title: `Ads & Sponsorship — ${ctx}`, domain: ctx, agentId: "FORGE", type: "module", tags: ["revenue", "ads"], createdAt: new Date(), content: [
      `ADS & SPONSORSHIP REVENUE — "${ctx}"`,
      `Agent: FORGE · Revenue Stream: Advertising · Status: LIVE`,
      ``,
      `AD REVENUE STREAMS`,
      `  Display Advertising`,
      `    Placement: Sidebar + between content blocks`,
      `    CPM target: $8–15 (B2B tech audience premium)`,
      `    Monthly page views needed for $1k/mo: 67,000–125,000`,
      ``,
      `  Newsletter Sponsorships`,
      `    Sponsored slot: Top-of-email banner + 1 dedicated section`,
      `    Rate: $500–2,000 per send (based on list size)`,
      `    Frequency: 1 sponsor slot per newsletter issue`,
      ``,
      `  Podcast / Video Pre-Rolls`,
      `    30-second pre-roll ad in educational content`,
      `    Rate: $20–40 CPM · Target: 5,000+ plays/episode`,
      `    Revenue at 10k plays/episode: $200–400 per episode`,
      ``,
      `SPONSORSHIP PACKAGES`,
      `  BRONZE — $500/month`,
      `    1 newsletter mention · Logo on platform homepage · Social shoutout`,
      ``,
      `  SILVER — $1,500/month`,
      `    2 newsletter features · Banner ad (1 month) · Co-branded post`,
      ``,
      `  GOLD — $3,500/month`,
      `    4 newsletter features · Dedicated email blast · Webinar co-host`,
      `    Homepage hero placement · Monthly case study feature`,
      ``,
      `SPONSOR TARGETING`,
      `  Ideal sponsors: AI tools, SaaS platforms, ${ctx} software vendors`,
      `  Audience fit: Decision-makers in ${ctx} · High purchase intent`,
      `  Pitch deck generated by FORGE — ready to send to potential sponsors`,
      ``,
      `REVENUE PROJECTIONS`,
      `  Month 6:  2 Silver + 1 Gold sponsor = $5,500/mo + display ads $800 = $6,300`,
      `  Month 12: 4 Silver + 2 Gold sponsors = $13,000/mo + $2,400 display = $15,400`,
      ``,
      `— FORGE Agent · Revenue Engine · Approve & Deploy to activate`,
    ].join("\n") }),
  },
];

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

interface MiniBrainNotif {
  id: string;
  title: string;
  preview: string;
  content: string;
  from: string;
  time: string;
  status: "pending" | "approved" | "rejected";
}

const MINI_BRAIN_PROMPTS = [
  "Create a 30-day marketing calendar",
  "Generate a patient onboarding workflow",
  "Build a social media content strategy",
  "Design an employee training module",
  "Draft a sales email sequence",
  "Create an AI automation roadmap",
  "Generate a compliance checklist",
  "Build a revenue diversification plan",
];

const MINI_BRAIN_USERS = ["Alex (User)", "Jordan (Creator)", "Taylor (Manager)", "Sam (Viewer)", "Morgan (Staff)"];

function generateMiniBrainOutput(prompt: string, user: string): MiniBrainNotif {
  const id = `mb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const content = `Mini-Brain Output — Generated by ${user}

Prompt: "${prompt}"

EXECUTIVE SUMMARY
This AI-generated content was produced by a User Mini-Brain instance (sandboxed, isolated from Master Brain). It is pending Admin review before integration into the platform.

KEY DELIVERABLES
• Structured action plan with 5 phases
• Timeline: 30-day deployment roadmap
• Assigned AI agents: FORGE (content), ORACLE (analysis), SYNC (workflow)
• Resource requirements: 2h human oversight, automated execution thereafter
• KPIs: 3 primary metrics tracked weekly

CONTENT DETAIL
Phase 1 — Foundation (Days 1–7): Set up core infrastructure and baseline data collection. FORGE agent generates all assets autonomously.
Phase 2 — Activation (Days 8–14): Deploy to primary channels with SYNC coordinating cross-platform execution.
Phase 3 — Optimization (Days 15–21): ORACLE agent analyzes performance and applies real-time adjustments.
Phase 4 — Scale (Days 22–28): Expand to secondary channels; revenue engine activates automated distribution.
Phase 5 — Report (Day 30): Full performance dashboard generated by ORACLE; recommendations for next cycle.

INTEGRATION NOTE
This output was generated in an isolated Mini-Brain sandbox. Approve below to merge into Master Brain and activate full AI agent deployment. Reject to return to user with feedback.

Generated: ${new Date().toLocaleTimeString()} · User Mini-Brain v1.0 · Awaiting Admin Approval`;

  return {
    id,
    title: prompt.slice(0, 50),
    preview: `${user} generated a new Mini-Brain output — ready for Admin review`,
    content,
    from: user,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: "pending",
  };
}

export function UCPXAgent() {
  const [open,         setOpen]         = useState(false);
  const [tab,          setTab]          = useState<UCPXTab>("agents");
  const [agents,       setAgents]       = useState(META_AGENTS);
  const [activeResult, setActiveResult] = useState<InfiniteModule | null>(null);
  const [notifications, setNotifications] = useState<MiniBrainNotif[]>([]);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<MiniBrainNotif | null>(null);
  const [agentMode,    setAgentMode]    = useState<"agents" | "minibrain">("agents");
  const [mbPrompt,     setMbPrompt]     = useState("");
  const [mbUser,       setMbUser]       = useState(MINI_BRAIN_USERS[0]);
  const [mbGenerating, setMbGenerating] = useState(false);
  const [mbResult,     setMbResult]     = useState<MiniBrainNotif | null>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const pendingCount = notifications.filter(n => n.status === "pending").length;

  const addNotification = (notif: MiniBrainNotif) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const handleMbGenerate = () => {
    const prompt = mbPrompt.trim() || MINI_BRAIN_PROMPTS[Math.floor(Math.random() * MINI_BRAIN_PROMPTS.length)];
    setMbGenerating(true);
    setTimeout(() => {
      const output = generateMiniBrainOutput(prompt, mbUser);
      setMbResult(output);
      addNotification(output);
      setMbGenerating(false);
    }, 1100);
  };

  const handleApprove = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "approved" } : n));
    if (selectedNotif?.id === id) setSelectedNotif(prev => prev ? { ...prev, status: "approved" } : null);
  };

  const handleReject = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: "rejected" } : n));
    if (selectedNotif?.id === id) setSelectedNotif(prev => prev ? { ...prev, status: "rejected" } : null);
  };

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
          {pendingCount > 0
            ? <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white px-0.5 animate-pulse">{pendingCount}</span>
            : <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-white animate-pulse" />
          }
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
              <div className="flex items-center gap-1.5">
                {/* Notification bell */}
                <button onClick={() => { setNotifOpen(o => !o); setSelectedNotif(null); }}
                  className="relative w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <span className="text-sm">🔔</span>
                  {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white px-0.5">{pendingCount}</span>
                  )}
                </button>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm font-bold transition-colors">
                  ✕
                </button>
              </div>
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

          {/* Notification Inbox (overlays tab content) */}
          {notifOpen && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-black text-foreground">🔔 Mini-Brain Inbox</p>
                  <p className="text-[10px] text-muted-foreground">{pendingCount} pending · {notifications.length} total</p>
                </div>
                <button onClick={() => { setNotifOpen(false); setSelectedNotif(null); }}
                  className="text-[10px] text-blue-600 font-semibold hover:opacity-70">← Back</button>
              </div>

              {selectedNotif ? (
                <div className="space-y-3">
                  <button onClick={() => setSelectedNotif(null)}
                    className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">← All notifications</button>
                  <div className="bg-white border border-border/40 rounded-2xl overflow-hidden">
                    <div className={`px-3 py-2 ${selectedNotif.status === "pending" ? "bg-yellow-50 border-b border-yellow-100" : selectedNotif.status === "approved" ? "bg-green-50 border-b border-green-100" : "bg-red-50 border-b border-red-100"}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${selectedNotif.status === "pending" ? "bg-yellow-200 text-yellow-800" : selectedNotif.status === "approved" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                          {selectedNotif.status}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{selectedNotif.time}</span>
                      </div>
                      <p className="text-[12px] font-bold text-foreground mt-1">{selectedNotif.title}</p>
                      <p className="text-[10px] text-muted-foreground">From: {selectedNotif.from}</p>
                    </div>
                    <pre className="text-[10px] text-foreground whitespace-pre-wrap p-3 leading-relaxed font-sans max-h-48 overflow-y-auto">{selectedNotif.content}</pre>
                  </div>
                  {selectedNotif.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(selectedNotif.id)}
                        className="flex-1 bg-green-600 text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors">
                        ✓ Approve & Integrate
                      </button>
                      <button onClick={() => handleReject(selectedNotif.id)}
                        className="flex-1 bg-red-500 text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors">
                        ✕ Reject
                      </button>
                    </div>
                  )}
                  {selectedNotif.status === "approved" && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                      <p className="text-[11px] font-bold text-green-700">✓ Approved & integrated into Master Brain</p>
                      <p className="text-[9px] text-green-600 mt-0.5">AI agents are actively distributing this output</p>
                    </div>
                  )}
                  {selectedNotif.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                      <p className="text-[11px] font-bold text-red-700">✕ Rejected — returned to user</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {notifications.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-3xl mb-2">🧠</p>
                      <p className="text-[12px] text-muted-foreground">No Mini-Brain outputs yet.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Go to Agents → Mini-Brain to generate one.</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <button key={n.id} onClick={() => setSelectedNotif(n)}
                        className="w-full text-left bg-white border border-border/40 rounded-2xl p-3 hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${n.status === "pending" ? "bg-yellow-100 text-yellow-700" : n.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {n.status}
                          </span>
                          <span className="text-[9px] text-muted-foreground ml-auto">{n.time}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-foreground truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{n.preview}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab content */}
          {!notifOpen && <div className="flex-1 overflow-y-auto p-3.5">
            {activeResult && (tab === "expand" || tab === "agents" || tab === "modules" || tab === "hidden" || tab === "engines")
              ? <ModuleCard mod={activeResult} onClose={() => setActiveResult(null)} />
              : tab === "agents"
              ? <div className="space-y-3">
                  {/* Mode toggle */}
                  <div className="flex gap-1 bg-muted rounded-xl p-1">
                    <button onClick={() => setAgentMode("agents")}
                      className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${agentMode === "agents" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      🤖 Agents
                    </button>
                    <button onClick={() => setAgentMode("minibrain")}
                      className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-colors ${agentMode === "minibrain" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      🧠 Mini-Brain
                    </button>
                  </div>

                  {agentMode === "agents" && agents.map(a => (
                    <AgentCard key={a.id} agent={a} onActivate={handleActivateAgent} />
                  ))}

                  {agentMode === "minibrain" && (
                    <div className="space-y-3">
                      {/* Mini-Brain header */}
                      <div className="relative overflow-hidden rounded-2xl p-4"
                        style={{ background: "linear-gradient(135deg, #1a0533, #2d0a5e, #3d1080)" }}>
                        <div className="absolute inset-0 opacity-20"
                          style={{ backgroundImage: "radial-gradient(circle at 70% 30%, #BF5AF2 0%, transparent 60%)" }} />
                        <div className="relative z-10">
                          <p className="text-[12px] font-black text-white uppercase tracking-wider">🧠 User Mini-Brain</p>
                          <p className="text-[10px] text-purple-200 mt-0.5">Sandboxed AI brain for users — outputs queue for Admin approval before integration.</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />
                            <span className="text-[9px] text-purple-300 font-semibold">ISOLATED · SANDBOXED · NOTIFY-ON-OUTPUT</span>
                          </div>
                        </div>
                      </div>

                      {/* User selector */}
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Generating as</label>
                        <div className="flex flex-wrap gap-1">
                          {MINI_BRAIN_USERS.map(u => (
                            <button key={u} onClick={() => setMbUser(u)}
                              className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors ${mbUser === u ? "bg-purple-600 text-white border-purple-600" : "bg-white text-foreground border-border/40 hover:border-purple-300"}`}>
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Prompt input */}
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">What should this Mini-Brain generate?</label>
                        <textarea value={mbPrompt} onChange={e => setMbPrompt(e.target.value)} rows={2}
                          placeholder="e.g. Create a 30-day marketing calendar for my healthcare practice…"
                          className="w-full bg-white border border-border/40 rounded-xl px-3 py-2 text-[12px] outline-none focus:ring-1 focus:ring-purple-300/50 transition-all resize-none" />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {MINI_BRAIN_PROMPTS.slice(0, 4).map(p => (
                            <button key={p} onClick={() => setMbPrompt(p)}
                              className="text-[9px] bg-purple-50 border border-purple-100 text-purple-700 px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors">
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button onClick={handleMbGenerate} disabled={mbGenerating}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[12px] font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity">
                        {mbGenerating
                          ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating…</span></>
                          : "🧠 Generate (sends to Admin Inbox)"}
                      </button>

                      {mbResult && (
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pending Admin Approval</span>
                            <span className="text-[9px] text-muted-foreground ml-auto">{mbResult.time}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-foreground">{mbResult.title}</p>
                          <p className="text-[10px] text-purple-700">Output queued in Admin Inbox. Tap 🔔 to review and approve.</p>
                          <button onClick={() => { setNotifOpen(true); setSelectedNotif(mbResult); }}
                            className="w-full bg-purple-600 text-white text-[11px] font-bold py-2 rounded-xl hover:bg-purple-700 transition-colors">
                            🔔 Open in Admin Inbox
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              : tab === "engines"
              ? <EnginesView onResult={mod => { setActiveResult(mod); }} />
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
          </div>}

          {/* Footer */}
          <div className="flex-none px-4 py-2.5 border-t border-border/20 bg-muted/20">
            <p className="text-[9px] text-muted-foreground text-center">
              UCP-X v3 · 6 Agents · 25 Modules · 10 Superpowers · 9 Hidden · 8 Hyper · 6 Mktg Channels · 8 Revenue Streams · ROI Module · Mini-Brain · ARIA · Autonomous Teams · 💹 Growth Layer · Self-Improving · Core Intact
            </p>
          </div>
        </div>
      )}
    </>
  );
}
