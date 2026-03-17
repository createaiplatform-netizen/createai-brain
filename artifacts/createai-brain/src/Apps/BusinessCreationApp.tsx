import React, { useState, useRef, useCallback } from "react";
import { GLOBAL_REGION_GROUPS, getAllIndustries } from "@/engine/universeConfig";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type BusinessSize = "Solopreneur" | "Small Team (2–15)" | "Mid-Size (16–200)" | "Enterprise (200+)";
type BusinessStage = "Concept" | "Early-Stage" | "Growing" | "Scaling" | "Mature";
type LayerId = "adaptation" | "opportunity" | "solution" | "model" | "operations" | "expansion";

interface BusinessContext {
  industry: string;
  region: string;
  size: BusinessSize;
  stage: BusinessStage;
  focus: string;
}

interface LayerState {
  content: string;
  loading: boolean;
  generated: boolean;
}

interface EnsureState {
  content: string;
  loading: boolean;
  ensured: boolean;
}

// ─── Layer Config ──────────────────────────────────────────────────────────────

const LAYERS: { id: LayerId; num: number; icon: string; label: string; desc: string; action: string }[] = [
  { id: "adaptation",  num: 1, icon: "🏭", label: "Industry Adaptation",        desc: "Terminology, workflows, and structure tailored to your industry and region",   action: "industry-adaptation"  },
  { id: "opportunity", num: 2, icon: "🔍", label: "Opportunity Discovery",       desc: "Inefficiencies, risks, and improvement opportunities identified by AI",         action: "opportunity-discovery" },
  { id: "solution",    num: 3, icon: "⚙️", label: "Solution Generation",         desc: "Platforms, tools, workflows, dashboards, and automations recommended",          action: "solution-generation"  },
  { id: "model",       num: 4, icon: "💰", label: "Business Model Engine",       desc: "Monetization models, pricing tiers, and revenue flow strategy",                 action: "business-model"       },
  { id: "operations",  num: 5, icon: "🗂️", label: "Operations & Workflow Design", desc: "Roles, responsibilities, processes, and cross-department flow design",         action: "operations-design"    },
  { id: "expansion",   num: 6, icon: "🚀", label: "Expansion Layer",             desc: "Additional features, verticals, integrations, and growth opportunities",        action: "expansion"            },
];

const SIZES: BusinessSize[] = [
  "Solopreneur",
  "Small Team (2–15)",
  "Mid-Size (16–200)",
  "Enterprise (200+)",
];

const STAGES: BusinessStage[] = [
  "Concept",
  "Early-Stage",
  "Growing",
  "Scaling",
  "Mature",
];

const DEFAULT_CTX: BusinessContext = {
  industry: "Healthcare",
  region: "California",
  size: "Mid-Size (16–200)",
  stage: "Growing",
  focus: "",
};

// ─── SSE Streaming Helper ─────────────────────────────────────────────────────

async function streamBusinessLayer(
  ctx: BusinessContext,
  action: string,
  onChunk: (text: string) => void,
  signal: AbortSignal,
) {
  const res = await fetch("/api/openai/business-creation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      industry: ctx.industry,
      region: ctx.region,
      size: ctx.size,
      stage: ctx.stage,
      focus: ctx.focus,
      action,
    }),
    signal,
  });

  if (!res.ok || !res.body) return;

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += dec.decode(value, { stream: true });
    const parts = acc.split("\n\n");
    acc = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.startsWith("data: ") ? part.slice(6) : null;
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.content) onChunk(parsed.content);
        if (parsed.done) return;
      } catch {}
    }
  }
}

// ─── Everything-Ensurer SSE Helper ───────────────────────────────────────────

async function streamEnsureLayer(
  content: string,
  ctx: BusinessContext,
  layerLabel: string,
  onChunk: (text: string) => void,
  signal: AbortSignal,
) {
  const res = await fetch("/api/openai/everything-ensurer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      industry: ctx.industry,
      region: ctx.region,
      size: ctx.size,
      stage: ctx.stage,
      focus: ctx.focus,
      layerLabel,
    }),
    signal,
  });

  if (!res.ok || !res.body) return;

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += dec.decode(value, { stream: true });
    const parts = acc.split("\n\n");
    acc = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.startsWith("data: ") ? part.slice(6) : null;
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.content) onChunk(parsed.content);
        if (parsed.done) return;
      } catch {}
    }
  }
}

// ─── Seed Framework Cards ──────────────────────────────────────────────────────

const SEED_DATA: Record<LayerId, { heading: string; points: string[] }[]> = {
  adaptation: [
    {
      heading: "Industry Vocabulary & Nomenclature",
      points: [
        "Workflows renamed to match sector-specific terminology and process names",
        "Document templates aligned with industry standards and regulatory formats",
        "Compliance language reflects jurisdiction-specific regulatory context",
        "KPI names, units, and benchmarks calibrated to sector norms",
      ],
    },
    {
      heading: "Structural Alignment",
      points: [
        "Process stage names match your industry's common workflow conventions",
        "Role titles aligned with sector hiring conventions and org structures",
        "SLA targets and throughput baselines calibrated to industry benchmarks",
        "Risk categories and escalation paths adapted to sector-specific exposure",
      ],
    },
  ],
  opportunity: [
    {
      heading: "Operational Inefficiencies",
      points: [
        "Manual handoffs causing measurable delays between departments",
        "Redundant data entry across disconnected and siloed tools",
        "Approval bottlenecks with no automated escalation or timeout handling",
        "Revenue leakage from untracked deliverables and incomplete billing",
      ],
    },
    {
      heading: "Growth & Revenue Opportunities",
      points: [
        "Adjacent service verticals with similar delivery infrastructure",
        "Underutilized client relationships with documented upsell potential",
        "Automation opportunities that directly reduce cost-per-unit-of-output",
        "Pricing gaps relative to comparable competitors at similar scale",
      ],
    },
  ],
  solution: [
    {
      heading: "Core Platform Architecture",
      points: [
        "Centralized operations dashboard with real-time KPI visibility",
        "Automated workflow engine with rule-based routing and escalation",
        "Client and partner portal with self-service access and status tracking",
        "AI-assisted document generation, review, and approval flow",
      ],
    },
    {
      heading: "Key Automations",
      points: [
        "Intake → assignment → completion loop fully automated end-to-end",
        "Recurring billing and invoice generation triggered on schedule or milestone",
        "Compliance checkpoint alerts surfaced before regulatory deadlines",
        "Follow-up and notification sequences triggered by stage transitions",
      ],
    },
  ],
  model: [
    {
      heading: "Revenue Streams",
      points: [
        "Primary: recurring subscription or retainer model for predictable MRR",
        "Secondary: project-based and milestone billing for custom engagements",
        "Tertiary: premium add-on services and feature tier upgrades",
        "Optional: white-label licensing and reseller channel revenue",
      ],
    },
    {
      heading: "Pricing Architecture",
      points: [
        "Starter tier: core access, volume limits, email support",
        "Professional tier: full feature access, priority AI, phone support",
        "Enterprise tier: custom pricing, dedicated onboarding, SLA guarantee",
        "Usage-based overlay pricing for AI generation and API consumption",
      ],
    },
  ],
  operations: [
    {
      heading: "Core Roles & Ownership",
      points: [
        "Operations Lead — process ownership, throughput, and escalation handling",
        "Client Success Manager — retention, satisfaction, and expansion revenue",
        "Finance & Compliance — billing, risk management, and regulatory reporting",
        "AI & Systems Administrator — platform configuration and integration management",
      ],
    },
    {
      heading: "Cross-Department Workflow Flows",
      points: [
        "Sales → Operations: structured intake handoff form with context transfer",
        "Operations → Finance: automated close packet generated at project completion",
        "Compliance review gate required before all external client deliverables",
        "Weekly cross-team sync: KPIs, blockers, capacity, and priority alignment",
      ],
    },
  ],
  expansion: [
    {
      heading: "Near-Term Feature Roadmap",
      points: [
        "Mobile-optimized dashboards for client-facing and team-facing access",
        "Native API integrations with core industry tools and platforms",
        "Advanced reporting, cohort analysis, and scheduled export capabilities",
        "AI-generated status updates, summaries, and proactive recommendations",
      ],
    },
    {
      heading: "Growth Verticals & Market Expansion",
      points: [
        "Adjacent industry segment sharing similar workflow and compliance needs",
        "Geographic expansion with full regional compliance and terminology adaptation",
        "B2B partner channel with tiered revenue share and co-marketing model",
        "Training, certification, and enablement product line for practitioners",
      ],
    },
  ],
};

function SeedCard({ layer }: { layer: LayerId }) {
  const sections = SEED_DATA[layer] ?? [];
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(99,102,241,0.12)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#6366f1" }}>
            {s.heading}
          </div>
          <ul className="space-y-1.5">
            {s.points.map((p, j) => (
              <li key={j} className="flex items-start gap-2 text-[12px]" style={{ color: "rgba(148,163,184,0.8)" }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: "#6366f1" }}>→</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Context Tag ───────────────────────────────────────────────────────────────

const TAG_COLORS: [string, string][] = [
  ["#6366f1", "#6366f118"],
  ["#0ea5e9", "#0ea5e918"],
  ["#22c55e", "#22c55e18"],
  ["#f59e0b", "#f59e0b18"],
  ["#f43f5e", "#f43f5e18"],
];

// ─── Main App ──────────────────────────────────────────────────────────────────

export function BusinessCreationApp() {
  const industries = getAllIndustries().filter(i => i.id !== "generic");

  const [ctx, setCtx] = useState<BusinessContext>(DEFAULT_CTX);
  const [activeLayer, setActiveLayer] = useState<LayerId>("adaptation");
  const [layerStates, setLayerStates] = useState<Record<LayerId, LayerState>>(() => {
    const init: Partial<Record<LayerId, LayerState>> = {};
    LAYERS.forEach(l => { init[l.id] = { content: "", loading: false, generated: false }; });
    return init as Record<LayerId, LayerState>;
  });
  const [generatingAll, setGeneratingAll] = useState(false);
  const [ensureStates, setEnsureStates] = useState<Record<LayerId, EnsureState>>(() => {
    const init: Partial<Record<LayerId, EnsureState>> = {};
    LAYERS.forEach(l => { init[l.id] = { content: "", loading: false, ensured: false }; });
    return init as Record<LayerId, EnsureState>;
  });
  const [ensuringAll, setEnsuringAll] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const abortRefs = useRef<Partial<Record<LayerId, AbortController>>>({});
  const ensureAbortRefs = useRef<Partial<Record<LayerId, AbortController>>>({});

  const updateCtx = useCallback(<K extends keyof BusinessContext>(key: K, val: BusinessContext[K]) => {
    setCtx(prev => ({ ...prev, [key]: val }));
  }, []);

  const generateLayer = useCallback(async (layerId: LayerId, ctxOverride?: BusinessContext) => {
    const layer = LAYERS.find(l => l.id === layerId);
    if (!layer) return;

    abortRefs.current[layerId]?.abort();
    const ctrl = new AbortController();
    abortRefs.current[layerId] = ctrl;

    setLayerStates(prev => ({ ...prev, [layerId]: { content: "", loading: true, generated: false } }));

    try {
      let text = "";
      await streamBusinessLayer(ctxOverride ?? ctx, layer.action, chunk => {
        text += chunk;
        setLayerStates(prev => ({ ...prev, [layerId]: { content: text, loading: true, generated: false } }));
      }, ctrl.signal);
      setLayerStates(prev => ({ ...prev, [layerId]: { content: text, loading: false, generated: true } }));
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setLayerStates(prev => ({
          ...prev,
          [layerId]: { content: "[Generation failed — please check your connection and try again]", loading: false, generated: false },
        }));
      }
    }
  }, [ctx]);

  const generateAll = useCallback(async () => {
    setGeneratingAll(true);
    const snapshot = { ...ctx };
    for (const layer of LAYERS) {
      await generateLayer(layer.id, snapshot);
    }
    setGeneratingAll(false);
  }, [ctx, generateLayer]);

  const ensureLayer = useCallback(async (layerId: LayerId, ctxOverride?: BusinessContext) => {
    const layerContent = layerStates[layerId]?.content;
    if (!layerContent) return;
    const layer = LAYERS.find(l => l.id === layerId);
    if (!layer) return;

    ensureAbortRefs.current[layerId]?.abort();
    const ctrl = new AbortController();
    ensureAbortRefs.current[layerId] = ctrl;

    setEnsureStates(prev => ({ ...prev, [layerId]: { content: "", loading: true, ensured: false } }));

    try {
      let text = "";
      await streamEnsureLayer(layerContent, ctxOverride ?? ctx, `Layer ${layer.num}: ${layer.label}`, chunk => {
        text += chunk;
        setEnsureStates(prev => ({ ...prev, [layerId]: { content: text, loading: true, ensured: false } }));
      }, ctrl.signal);
      setEnsureStates(prev => ({ ...prev, [layerId]: { content: text, loading: false, ensured: true } }));
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setEnsureStates(prev => ({
          ...prev,
          [layerId]: { content: "[Quality validation failed — please try again]", loading: false, ensured: false },
        }));
      }
    }
  }, [ctx, layerStates]);

  const ensureAll = useCallback(async () => {
    setEnsuringAll(true);
    const snapshot = { ...ctx };
    for (const layer of LAYERS) {
      if (layerStates[layer.id].generated) {
        await ensureLayer(layer.id, snapshot);
      }
    }
    setEnsuringAll(false);
  }, [ctx, layerStates, ensureLayer]);

  const currentLayer = LAYERS.find(l => l.id === activeLayer)!;
  const currentState = layerStates[activeLayer];
  const currentEnsureState = ensureStates[activeLayer];

  const contextTags = [
    ctx.industry,
    ctx.region,
    ctx.size,
    ctx.stage,
    ...(ctx.focus ? [`Focus: ${ctx.focus}`] : []),
  ];

  const generatedCount = LAYERS.filter(l => layerStates[l.id].generated).length;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "hsl(231,47%,6%)", color: "#e2e8f0" }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(99,102,241,0.15)" }}
      >
        <div>
          <div className="text-[15px] font-bold text-white">🏗️ Business Creation Engine</div>
          <div className="text-[11px]" style={{ color: "rgba(148,163,184,0.55)" }}>
            6-layer conceptual business design · Everything-Ensurer quality validation ·{" "}
            {generatedCount > 0 ? `${generatedCount}/6 layers generated` : "Select your profile, then generate any layer"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generatedCount > 0 && (
            <button
              onClick={ensureAll}
              disabled={ensuringAll || generatingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: ensuringAll ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.14)",
                border: "1px solid rgba(34,197,94,0.35)",
                color: ensuringAll ? "#475569" : "#4ade80",
                cursor: (ensuringAll || generatingAll) ? "not-allowed" : "pointer",
              }}
            >
              {ensuringAll ? (
                <><span className="animate-spin inline-block">⟳</span> Ensuring All…</>
              ) : (
                <><span>✓</span> Ensure Everything</>
              )}
            </button>
          )}
          <button
            onClick={generateAll}
            disabled={generatingAll || ensuringAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: generatingAll ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.20)",
              border: "1px solid rgba(99,102,241,0.40)",
              color: generatingAll ? "#64748b" : "#a5b4fc",
              cursor: (generatingAll || ensuringAll) ? "not-allowed" : "pointer",
            }}
          >
            {generatingAll ? (
              <><span className="animate-spin inline-block">⟳</span> Generating All Layers…</>
            ) : (
              <><span>✦</span> Generate Full Plan</>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel: Business Profile ─────────────────────────────────── */}
        <div
          className="w-60 flex-shrink-0 overflow-y-auto p-4 space-y-4"
          style={{ borderRight: "1px solid rgba(99,102,241,0.12)", background: "rgba(0,0,0,0.18)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6366f1" }}>
            Business Profile
          </div>

          {/* Industry Picker */}
          <div>
            <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Industry</div>
            <div className="grid grid-cols-2 gap-1.5">
              {industries.slice(0, 12).map(ind => (
                <button
                  key={ind.id}
                  onClick={() => updateCtx("industry", ind.label)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium text-left transition-all"
                  style={{
                    background: ctx.industry === ind.label ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.industry === ind.label ? "rgba(99,102,241,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.industry === ind.label ? "#a5b4fc" : "#475569",
                  }}
                >
                  <span className="flex-shrink-0">{ind.icon}</span>
                  <span className="truncate">{ind.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Region</div>
            <select
              value={ctx.region}
              onChange={e => updateCtx("region", e.target.value)}
              className="w-full text-white text-[11px] px-2.5 py-2 rounded-lg outline-none"
              style={{ background: "rgba(14,18,42,0.85)", border: "1px solid rgba(99,102,241,0.22)" }}
            >
              {GLOBAL_REGION_GROUPS.map(group => (
                <optgroup key={group.group} label={group.group}>
                  {group.regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Business Size</div>
            <div className="space-y-1">
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => updateCtx("size", s)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: ctx.size === s ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.size === s ? "rgba(99,102,241,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.size === s ? "#a5b4fc" : "#475569",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stage */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Business Stage</div>
            <div className="space-y-1">
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => updateCtx("stage", s)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: ctx.stage === s ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.stage === s ? "rgba(99,102,241,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.stage === s ? "#a5b4fc" : "#475569",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Area */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Focus Area</div>
            <textarea
              value={ctx.focus}
              onChange={e => updateCtx("focus", e.target.value)}
              placeholder="e.g. streamline patient intake, reduce hiring delays, expand to EU market..."
              rows={3}
              className="w-full text-white text-[10px] px-2.5 py-2 rounded-lg outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.22)" }}
            />
          </div>

          {/* Progress */}
          {generatedCount > 0 && (
            <div className="rounded-xl p-3" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#6366f1" }}>
                Plan Progress
              </div>
              <div className="space-y-1.5">
                {LAYERS.map(l => {
                  const ls = layerStates[l.id];
                  const es = ensureStates[l.id];
                  return (
                    <div key={l.id} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: ls.loading ? "#f59e0b" : ls.generated ? "#6366f1" : "#334155" }}
                      />
                      {es.ensured && (
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: "#22c55e" }}
                        />
                      )}
                      {es.loading && !es.ensured && (
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                          style={{ background: "#4ade80" }}
                        />
                      )}
                      <span className="text-[10px] flex-1" style={{ color: es.ensured ? "#94a3b8" : ls.generated ? "#64748b" : "#475569" }}>
                        L{l.num}: {l.label}
                      </span>
                      {es.ensured && <span className="text-[9px]" style={{ color: "#4ade80" }}>✓</span>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px]" style={{ color: "#6366f1" }}>Generated</span>
                    <span className="text-[9px]" style={{ color: "#6366f1" }}>{generatedCount}/6</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{ width: `${(generatedCount / 6) * 100}%`, background: "linear-gradient(90deg,#6366f1,#a855f7)" }}
                    />
                  </div>
                </div>
                {LAYERS.some(l => ensureStates[l.id].ensured) && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px]" style={{ color: "#4ade80" }}>Ensured</span>
                      <span className="text-[9px]" style={{ color: "#4ade80" }}>
                        {LAYERS.filter(l => ensureStates[l.id].ensured).length}/6
                      </span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: `${(LAYERS.filter(l => ensureStates[l.id].ensured).length / 6) * 100}%`,
                          background: "linear-gradient(90deg,#22c55e,#4ade80)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: Layer Workspace ──────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Layer Tab Bar */}
          <div
            className="flex overflow-x-auto flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(99,102,241,0.12)" }}
          >
            {LAYERS.map(layer => {
              const ls = layerStates[layer.id];
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    color: isActive ? "#a5b4fc" : "#475569",
                    borderBottom: isActive ? "2px solid #6366f1" : "2px solid transparent",
                    background: isActive ? "rgba(99,102,241,0.07)" : "transparent",
                  }}
                >
                  <span>{layer.icon}</span>
                  <span>L{layer.num}: {layer.label}</span>
                  {ensureStates[layer.id].ensured ? (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#22c55e" }} />
                  ) : ls.generated ? (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#6366f1" }} />
                  ) : null}
                  {(ls.loading || ensureStates[layer.id].loading) && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#f59e0b" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Layer Content Area */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Layer Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{currentLayer.icon}</span>
                <div>
                  <div className="text-[15px] font-bold text-white">
                    Layer {currentLayer.num}: {currentLayer.label}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.55)" }}>
                    {currentLayer.desc}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {currentState.generated && (
                  <button
                    onClick={() => ensureLayer(activeLayer)}
                    disabled={currentEnsureState.loading || currentState.loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
                    style={{
                      background: currentEnsureState.loading ? "rgba(34,197,94,0.04)" : currentEnsureState.ensured ? "rgba(34,197,94,0.18)" : "rgba(34,197,94,0.12)",
                      border: `1px solid ${currentEnsureState.ensured ? "rgba(34,197,94,0.50)" : "rgba(34,197,94,0.30)"}`,
                      color: currentEnsureState.loading ? "#475569" : "#4ade80",
                      cursor: (currentEnsureState.loading || currentState.loading) ? "not-allowed" : "pointer",
                    }}
                  >
                    {currentEnsureState.loading ? (
                      <><span className="animate-spin inline-block">⟳</span> Ensuring…</>
                    ) : currentEnsureState.ensured ? (
                      <><span>✓</span> Re-Ensure Layer</>
                    ) : (
                      <><span>✓</span> Ensure This Layer</>
                    )}
                  </button>
                )}
                <button
                  onClick={() => generateLayer(activeLayer)}
                  disabled={currentState.loading || currentEnsureState.loading}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
                  style={{
                    background: currentState.loading ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.18)",
                    border: "1px solid rgba(99,102,241,0.35)",
                    color: currentState.loading ? "#475569" : "#a5b4fc",
                    cursor: (currentState.loading || currentEnsureState.loading) ? "not-allowed" : "pointer",
                  }}
                >
                  {currentState.loading ? (
                    <><span className="animate-spin inline-block">⟳</span> Generating…</>
                  ) : (
                    <><span>✦</span> Generate {currentLayer.label}</>
                  )}
                </button>
                {currentState.generated && !currentState.loading && (
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)", color: "#a5b4fc" }}
                  >
                    💾 Save
                  </button>
                )}
              </div>
            </div>

            {/* Context Tags */}
            <div className="flex items-center gap-2 flex-wrap mb-5">
              {contextTags.map((tag, i) => {
                const [fg, bg] = TAG_COLORS[i % TAG_COLORS.length];
                return (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: bg, border: `1px solid ${fg}30`, color: fg }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>

            {/* AI Output Block */}
            {currentState.content && (
              <div
                className="rounded-xl p-5 mb-4"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.20)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#818cf8" }}>
                    {currentState.generated ? "✦ AI-Generated Business System" : "⟳ Generating business system…"}
                  </div>
                  {currentState.generated && !currentEnsureState.ensured && !currentEnsureState.loading && (
                    <div className="text-[10px]" style={{ color: "rgba(148,163,184,0.45)" }}>
                      Run <span style={{ color: "#4ade80" }}>✓ Ensure This Layer</span> to validate quality
                    </div>
                  )}
                </div>
                <pre
                  className="text-[12px] whitespace-pre-wrap leading-relaxed font-sans"
                  style={{ color: "rgba(226,232,240,0.92)" }}
                >
                  {currentState.content}
                  {currentState.loading && (
                    <span
                      className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse"
                      style={{ background: "#6366f1", verticalAlign: "text-bottom" }}
                    />
                  )}
                </pre>
              </div>
            )}

            {/* Everything-Ensurer Output Block */}
            {currentEnsureState.content && (
              <div
                className="rounded-xl p-5 mb-5"
                style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.22)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#4ade80" }}>
                    {currentEnsureState.ensured ? "✓ Everything-Ensured — Quality Validated" : "⟳ Running quality validation…"}
                  </div>
                  {currentEnsureState.ensured && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {["Complete", "Consistent", "Realistic", "Compliant", "Clear", "Expanded"].map((v, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                          style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <pre
                  className="text-[12px] whitespace-pre-wrap leading-relaxed font-sans"
                  style={{ color: "rgba(220,240,220,0.92)" }}
                >
                  {currentEnsureState.content}
                  {currentEnsureState.loading && (
                    <span
                      className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse"
                      style={{ background: "#22c55e", verticalAlign: "text-bottom" }}
                    />
                  )}
                </pre>
              </div>
            )}

            {/* Pre-generation CTA */}
            {!currentState.content && (
              <div
                className="rounded-xl px-4 py-3 mb-5 text-[12px]"
                style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.14)", color: "rgba(148,163,184,0.65)" }}
              >
                Click <strong style={{ color: "#a5b4fc" }}>Generate {currentLayer.label}</strong> to produce a complete,
                AI-generated {currentLayer.label.toLowerCase()} system tailored to your business profile: {ctx.industry} ·{" "}
                {ctx.region} · {ctx.size} · {ctx.stage} stage.
                The framework structure below shows what will be generated.
              </div>
            )}

            {/* Seed Framework */}
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "#334155" }}
              >
                Framework Structure
              </div>
              <SeedCard layer={activeLayer} />
            </div>
          </div>
        </div>
      </div>
      {showSaveModal && (
        <SaveToProjectModal
          content={currentState.content}
          label={`${currentLayer.label} — Business Design`}
          defaultFileType="Document"
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
