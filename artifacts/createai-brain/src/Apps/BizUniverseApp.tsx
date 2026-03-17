import React, { useState, useRef, useCallback } from "react";
import { GLOBAL_REGION_GROUPS, getAllIndustries } from "@/engine/universeConfig";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type UniverseLayerId =
  | "knowledge" | "concept" | "blueprint" | "monetization"
  | "ecosystem" | "visualization" | "expansion" | "safety";

interface UniverseContext {
  idea: string;
  industry: string;
  region: string;
  scale: string;
}

interface LayerState {
  content: string;
  loading: boolean;
  generated: boolean;
}

// ─── Layer Config ─────────────────────────────────────────────────────────────

const UNIVERSE_LAYERS: {
  id: UniverseLayerId; num: number; icon: string; label: string; desc: string; action: string;
}[] = [
  { id: "knowledge",     num: 1, icon: "🧠", label: "Knowledge & Context",          desc: "Industry patterns, technologies, and regional context adapted to your idea",       action: "knowledge-context"         },
  { id: "concept",       num: 2, icon: "💡", label: "Concept Expansion",             desc: "Break the idea into components, sub-components, and layered variations",           action: "concept-expansion"         },
  { id: "blueprint",     num: 3, icon: "📐", label: "Business Blueprint",            desc: "Branding, positioning, workflows, roles, and full operational structure",          action: "business-blueprint"        },
  { id: "monetization",  num: 4, icon: "💎", label: "Monetization & Value Design",   desc: "Pricing models, revenue streams, value architecture, and growth economics",        action: "monetization-value"        },
  { id: "ecosystem",     num: 5, icon: "🌐", label: "Product & Feature Ecosystem",   desc: "Supporting tools, features, sub-products, and the full platform ecosystem",        action: "product-ecosystem-universe" },
  { id: "visualization", num: 6, icon: "🎯", label: "Visualization & Interaction",   desc: "Conceptual VR/AR, digital twin, and interactive representation design",           action: "visualization-interaction" },
  { id: "expansion",     num: 7, icon: "🚀", label: "Expansion & Future Paths",      desc: "Verticals, integrations, partnership plays, and long-term growth trajectories",   action: "expansion-future"          },
  { id: "safety",        num: 8, icon: "🛡️", label: "Safety, Compliance & Integrity", desc: "Legal, ethical, regulatory, and safety validation across regions and industries", action: "safety-compliance-integrity" },
];

const SCALES = ["Solo / Freelance", "Small Team (2–10)", "Mid-Size (11–50)", "Growth (51–200)", "Enterprise (200+)"];

const DEFAULT_CTX: UniverseContext = {
  idea: "",
  industry: "Technology",
  region: "United States",
  scale: "Small Team (2–10)",
};

// ─── SSE Streaming Helper ─────────────────────────────────────────────────────

async function streamUniverseLayer(
  ctx: UniverseContext,
  action: string,
  onChunk: (text: string) => void,
  signal: AbortSignal,
) {
  const res = await fetch("/api/openai/biz-universe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idea: ctx.idea,
      industry: ctx.industry,
      region: ctx.region,
      scale: ctx.scale,
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

// ─── Seed Framework Cards ─────────────────────────────────────────────────────

const SEED_DATA: Record<UniverseLayerId, { heading: string; points: string[] }[]> = {
  knowledge: [
    {
      heading: "Industry Landscape",
      points: [
        "Dominant market patterns, emerging technologies, and structural shifts in this space",
        "Key players, market size, and competitive intensity across tiers",
        "Terminology and mental models used by practitioners in this region and industry",
        "Regulatory environment overview: what governs entry, operation, and growth",
      ],
    },
    {
      heading: "Contextual Fit",
      points: [
        "How this idea maps to existing categories — and where it creates a new one",
        "Adjacent industries and cross-sector opportunities that reinforce the concept",
        "Technology readiness: what infrastructure makes this idea viable right now",
        "Cultural and behavioral trends that make this the right moment to build",
      ],
    },
  ],
  concept: [
    {
      heading: "Core Concept Decomposition",
      points: [
        "Primary concept: the clearest, simplest version of what this is",
        "Sub-components: the 4–6 functional parts that make the concept work together",
        "Variations: 3 distinct interpretations or configurations of the same core idea",
        "Differentiating angles: what makes each variation interesting, viable, or defensible",
      ],
    },
    {
      heading: "Deeper Layers",
      points: [
        "Secondary implications: what else becomes possible once the core concept is live",
        "Dependency map: what the concept relies on — technology, behavior, infrastructure",
        "Edge cases and failure modes: where the concept might break and how to design around it",
        "Evolutionary path: how the concept changes and expands as it matures",
      ],
    },
  ],
  blueprint: [
    {
      heading: "Brand & Positioning",
      points: [
        "Brand identity: name rationale, tagline direction, and core brand promise",
        "Market positioning: how this is perceived relative to alternatives and substitutes",
        "Target customer: demographics, psychographics, and the specific problem being solved",
        "Differentiation statement: what makes this uniquely worth choosing over everything else",
      ],
    },
    {
      heading: "Operations & Team",
      points: [
        "Core roles: founder, operations, delivery, sales, and client success at launch",
        "Key processes: the 4–5 operational workflows that run the business day-to-day",
        "Customer journey: from first touchpoint through onboarding, delivery, and retention",
        "Operating cadence: the rhythm of daily, weekly, and monthly execution",
      ],
    },
  ],
  monetization: [
    {
      heading: "Revenue Architecture",
      points: [
        "Primary revenue model: subscription, services, licensing, usage-based, or hybrid",
        "Pricing tiers: 3 named tiers with real price points, feature differentiation, and ICP per tier",
        "Revenue mix: target % from each stream with rationale for diversification strategy",
        "Unit economics: CAC, LTV, gross margin, and payback period with real estimates",
      ],
    },
    {
      heading: "Value & Growth Economics",
      points: [
        "Value ladder: how customers move from free/low-tier to premium over time",
        "12-month revenue model: named milestones with specific targets per quarter",
        "Expansion revenue: the upsell, cross-sell, and renewal loops baked into the model",
        "Secondary monetization: data, partnerships, marketplace commissions, or education",
      ],
    },
  ],
  ecosystem: [
    {
      heading: "Core Platform",
      points: [
        "Flagship product: the central offering that everything else orbits around",
        "Feature modules: 5–7 specific features that add depth to the flagship",
        "Self-serve tier: a lighter entry point for volume acquisition and brand exposure",
        "Enterprise tier: custom-configured, high-touch delivery for premium accounts",
      ],
    },
    {
      heading: "Ecosystem Layers",
      points: [
        "Marketplace or directory: a layer that connects users with certified providers or partners",
        "Education platform: courses, certifications, and community content as a revenue stream",
        "API and integrations: how the platform connects into existing workflows",
        "Community and network: the flywheel that makes the ecosystem more valuable over time",
      ],
    },
  ],
  visualization: [
    {
      heading: "Digital & Interactive Representation",
      points: [
        "Dashboard concept: how the primary user interface organizes the core experience",
        "Data visualization layer: the key metrics, maps, or flows made visual for users",
        "Interactive simulation: what a user can configure, model, or test within the platform",
        "Demo mode: a guided walkthrough experience that communicates value before purchase",
      ],
    },
    {
      heading: "VR / AR & Digital Twin",
      points: [
        "3D/spatial concept: how the product or service could be experienced in immersive space",
        "Digital twin application: a virtual model of the real-world system this product manages",
        "Augmented overlay: how AR could enhance the physical experience of the product or service",
        "Future interaction model: how users might engage with this concept in a post-screen world",
      ],
    },
  ],
  expansion: [
    {
      heading: "Near-Term Expansion",
      points: [
        "Adjacent verticals: 2–3 neighboring markets reachable with minimal product adaptation",
        "Geographic markets: the top 2 next regions with adaptation requirements mapped out",
        "Partnership plays: resellers, channel partners, OEM, and white-label opportunities",
        "Platform integrations: 5–7 high-impact integrations ranked by revenue and retention value",
      ],
    },
    {
      heading: "Long-Term Vision",
      points: [
        "Category ownership: what this becomes the definitive global solution for",
        "Network effects: the mechanism that makes scale create compounding competitive advantage",
        "Strategic optionality: acquisition readiness, IPO criteria, or founder independence path",
        "2–5 year scenario: a concrete description of what this business looks like at full scale",
      ],
    },
  ],
  safety: [
    {
      heading: "Legal & Regulatory",
      points: [
        "Legal structure: recommended entity type, jurisdiction, and registration steps",
        "Industry regulations: all licenses, permits, certifications, and accreditations required",
        "Data and privacy: applicable laws (GDPR, CCPA, HIPAA, etc.) and obligations",
        "Contracts and IP: required agreements, IP ownership structure, and liability limits",
      ],
    },
    {
      heading: "Ethical & Integrity Standards",
      points: [
        "Content standards: accuracy, transparency, non-deception in all outputs and claims",
        "Automation guardrails: what the system automates vs. what requires human review",
        "Consumer protection: refund policy, dispute resolution, and accessibility obligations",
        "Supplier and partner ethics: vetting standards for third-party collaborators",
      ],
    },
  ],
};

function SeedCard({ layer }: { layer: UniverseLayerId }) {
  const sections = SEED_DATA[layer] ?? [];
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(139,92,246,0.12)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>
            {s.heading}
          </div>
          <ul className="space-y-1.5">
            {s.points.map((p, j) => (
              <li
                key={j}
                className="flex items-start gap-2 text-[12px]"
                style={{ color: "rgba(148,163,184,0.8)" }}
              >
                <span className="flex-shrink-0 mt-0.5" style={{ color: "#8b5cf6" }}>→</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export function BizUniverseApp() {
  const industries = getAllIndustries().filter(i => i.id !== "generic");

  const [ctx, setCtx] = useState<UniverseContext>(DEFAULT_CTX);
  const [activeLayer, setActiveLayer] = useState<UniverseLayerId>("knowledge");
  const [layerStates, setLayerStates] = useState<Record<UniverseLayerId, LayerState>>(() => {
    const init: Partial<Record<UniverseLayerId, LayerState>> = {};
    UNIVERSE_LAYERS.forEach(l => { init[l.id] = { content: "", loading: false, generated: false }; });
    return init as Record<UniverseLayerId, LayerState>;
  });
  const [generatingAll, setGeneratingAll] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const abortRefs = useRef<Partial<Record<UniverseLayerId, AbortController>>>({});

  const updateCtx = useCallback(<K extends keyof UniverseContext>(key: K, val: UniverseContext[K]) => {
    setCtx(prev => ({ ...prev, [key]: val }));
  }, []);

  const generateLayer = useCallback(async (layerId: UniverseLayerId, ctxOverride?: UniverseContext) => {
    const layer = UNIVERSE_LAYERS.find(l => l.id === layerId);
    if (!layer) return;

    abortRefs.current[layerId]?.abort();
    const ctrl = new AbortController();
    abortRefs.current[layerId] = ctrl;

    setLayerStates(prev => ({ ...prev, [layerId]: { content: "", loading: true, generated: false } }));

    try {
      let text = "";
      await streamUniverseLayer(ctxOverride ?? ctx, layer.action, chunk => {
        text += chunk;
        setLayerStates(prev => ({ ...prev, [layerId]: { content: text, loading: true, generated: false } }));
      }, ctrl.signal);
      setLayerStates(prev => ({ ...prev, [layerId]: { content: text, loading: false, generated: true } }));
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setLayerStates(prev => ({
          ...prev,
          [layerId]: { content: "[Generation failed — check your connection and try again]", loading: false, generated: false },
        }));
      }
    }
  }, [ctx]);

  const generateAll = useCallback(async () => {
    if (!ctx.idea.trim()) return;
    setGeneratingAll(true);
    const snapshot = { ...ctx };
    for (const layer of UNIVERSE_LAYERS) {
      await generateLayer(layer.id, snapshot);
    }
    setGeneratingAll(false);
  }, [ctx, generateLayer]);

  const currentLayer = UNIVERSE_LAYERS.find(l => l.id === activeLayer)!;
  const currentState = layerStates[activeLayer];
  const generatedCount = UNIVERSE_LAYERS.filter(l => layerStates[l.id].generated).length;
  const hasIdea = ctx.idea.trim().length > 0;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "hsl(256,40%,5%)", color: "#e2e8f0" }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.18)" }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="text-[15px] font-bold text-white">🌌 Biz Universe Engine</div>
            {hasIdea && (
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold truncate max-w-[220px]"
                style={{
                  background: "rgba(139,92,246,0.15)",
                  border: "1px solid rgba(139,92,246,0.35)",
                  color: "#c4b5fd",
                }}
              >
                {ctx.idea.slice(0, 50)}{ctx.idea.length > 50 ? "…" : ""}
              </span>
            )}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.50)" }}>
            8-layer universe engine · expands any idea into a complete, multi-layered business system · realness-ensured
          </div>
        </div>
        <button
          onClick={generateAll}
          disabled={generatingAll || !hasIdea}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: !hasIdea
              ? "rgba(255,255,255,0.04)"
              : generatingAll
              ? "rgba(139,92,246,0.06)"
              : "rgba(139,92,246,0.20)",
            border: `1px solid ${!hasIdea ? "rgba(255,255,255,0.10)" : "rgba(139,92,246,0.45)"}`,
            color: !hasIdea ? "#334155" : generatingAll ? "#475569" : "#c4b5fd",
            cursor: !hasIdea || generatingAll ? "not-allowed" : "pointer",
          }}
        >
          {generatingAll ? (
            <><span className="animate-spin inline-block">⟳</span> Expanding Universe…</>
          ) : (
            <><span>✦</span> Expand Full Universe</>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ───────────────────────────────────────────────────────── */}
        <div
          className="w-64 flex-shrink-0 overflow-y-auto p-4 space-y-4"
          style={{ borderRight: "1px solid rgba(139,92,246,0.12)", background: "rgba(0,0,0,0.20)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#8b5cf6" }}>
            Universe Context
          </div>

          {/* Idea Input */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">
              Idea / Concept *
            </div>
            <textarea
              value={ctx.idea}
              onChange={e => updateCtx("idea", e.target.value)}
              placeholder="Describe your idea, product, platform, service, or concept…"
              rows={4}
              autoFocus
              className="w-full text-white text-[11px] px-3 py-2 rounded-lg outline-none resize-none"
              style={{
                background: "rgba(139,92,246,0.07)",
                border: `1px solid ${ctx.idea ? "rgba(139,92,246,0.45)" : "rgba(139,92,246,0.22)"}`,
              }}
            />
          </div>

          {/* Industry */}
          <div>
            <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Industry</div>
            <div className="grid grid-cols-2 gap-1.5">
              {industries.slice(0, 12).map(ind => (
                <button
                  key={ind.id}
                  onClick={() => updateCtx("industry", ind.label)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium text-left transition-all"
                  style={{
                    background: ctx.industry === ind.label ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.industry === ind.label ? "rgba(139,92,246,0.50)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.industry === ind.label ? "#c4b5fd" : "#475569",
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
              style={{ background: "rgba(14,10,40,0.90)", border: "1px solid rgba(139,92,246,0.25)" }}
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

          {/* Scale */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Target Scale</div>
            <div className="space-y-1">
              {SCALES.map(s => (
                <button
                  key={s}
                  onClick={() => updateCtx("scale", s)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: ctx.scale === s ? "rgba(139,92,246,0.20)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.scale === s ? "rgba(139,92,246,0.50)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.scale === s ? "#c4b5fd" : "#475569",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Realness Ensurer Badge */}
          <div
            className="rounded-xl p-3"
            style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.18)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#8b5cf6" }}>
              ✦ Realness Ensurer
            </div>
            <div className="space-y-1">
              {[
                "Completeness",
                "Consistency",
                "Realism",
                "Structure",
                "Monetization",
                "Safety",
              ].map(check => (
                <div key={check} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#8b5cf6" }} />
                  <span className="text-[10px]" style={{ color: "#475569" }}>{check} Check</span>
                </div>
              ))}
            </div>
            <div className="text-[9px] mt-2" style={{ color: "rgba(139,92,246,0.55)" }}>
              Applied automatically to every output
            </div>
          </div>

          {/* Progress Tracker */}
          {generatedCount > 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.22)" }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#8b5cf6" }}>
                Universe Progress
              </div>
              <div className="space-y-1.5">
                {UNIVERSE_LAYERS.map(l => {
                  const ls = layerStates[l.id];
                  return (
                    <div key={l.id} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: ls.loading ? "#f59e0b" : ls.generated ? "#8b5cf6" : "#334155",
                        }}
                      />
                      <span className="text-[10px]" style={{ color: ls.generated ? "#94a3b8" : "#475569" }}>
                        L{l.num}: {l.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: `${(generatedCount / 8) * 100}%`,
                    background: "linear-gradient(90deg,#7c3aed,#c4b5fd)",
                  }}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[9px]" style={{ color: "#8b5cf6" }}>
                  {generatedCount}/8 layers complete
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: 8 Layers ─────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Layer Tab Bar */}
          <div
            className="flex overflow-x-auto flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}
          >
            {UNIVERSE_LAYERS.map(layer => {
              const ls = layerStates[layer.id];
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    color: isActive ? "#c4b5fd" : "#475569",
                    borderBottom: isActive ? "2px solid #8b5cf6" : "2px solid transparent",
                    background: isActive ? "rgba(139,92,246,0.08)" : "transparent",
                  }}
                >
                  <span>{layer.icon}</span>
                  <span>L{layer.num}: {layer.label}</span>
                  {ls.generated && !ls.loading && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#8b5cf6" }} />
                  )}
                  {ls.loading && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#f59e0b" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Layer Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Layer Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{currentLayer.icon}</span>
                <div>
                  <div className="text-[15px] font-bold text-white">
                    Layer {currentLayer.num}: {currentLayer.label}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.50)" }}>
                    {currentLayer.desc}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {currentState.generated && !currentState.loading && (
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)", color: "#a5b4fc" }}
                  >
                    💾 Save
                  </button>
                )}
                <button
                  onClick={() => generateLayer(activeLayer)}
                  disabled={currentState.loading || !hasIdea}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold flex-shrink-0 transition-all"
                  style={{
                    background: !hasIdea
                      ? "rgba(255,255,255,0.03)"
                      : currentState.loading
                      ? "rgba(139,92,246,0.05)"
                      : "rgba(139,92,246,0.18)",
                    border: `1px solid ${!hasIdea ? "rgba(255,255,255,0.08)" : "rgba(139,92,246,0.38)"}`,
                    color: !hasIdea ? "#334155" : currentState.loading ? "#475569" : "#c4b5fd",
                    cursor: !hasIdea || currentState.loading ? "not-allowed" : "pointer",
                  }}
                >
                  {currentState.loading ? (
                    <><span className="animate-spin inline-block">⟳</span> Expanding…</>
                  ) : (
                    <><span>✦</span> Expand {currentLayer.label}</>
                  )}
                </button>
              </div>
            </div>

            {/* Context Tags */}
            {hasIdea && (
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {[
                  { label: ctx.industry, color: "#6366f1" },
                  { label: ctx.region,   color: "#0ea5e9" },
                  { label: ctx.scale,    color: "#f59e0b" },
                ].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: `${tag.color}18`, border: `1px solid ${tag.color}30`, color: tag.color }}
                  >
                    {tag.label}
                  </span>
                ))}
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.30)", color: "#a78bfa" }}
                >
                  ✦ Realness-Ensured
                </span>
              </div>
            )}

            {/* No Idea CTA */}
            {!hasIdea && (
              <div
                className="rounded-xl px-4 py-4 mb-5 text-[12px]"
                style={{
                  background: "rgba(139,92,246,0.05)",
                  border: "1px solid rgba(139,92,246,0.18)",
                  color: "rgba(148,163,184,0.65)",
                }}
              >
                Describe your <strong style={{ color: "#c4b5fd" }}>idea, product, platform, or concept</strong> in the left panel.
                The engine will expand it into a complete, 8-layer business universe — knowledge context, concept expansion, blueprint, monetization,
                ecosystem, visualization, expansion paths, and safety — with the Realness Ensurer applied to every output automatically.
              </div>
            )}

            {/* AI Output Block */}
            {currentState.content && (
              <div
                className="rounded-xl p-5 mb-5"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.25)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>
                    {currentState.generated
                      ? `✦ ${currentLayer.label} — Universe Output`
                      : `⟳ Expanding ${currentLayer.label}…`}
                  </div>
                  {currentState.generated && (
                    <div className="flex items-center gap-1.5">
                      {["Complete", "Real", "Safe"].map(badge => (
                        <span
                          key={badge}
                          className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide"
                          style={{ background: "rgba(139,92,246,0.18)", color: "#a78bfa" }}
                        >
                          {badge}
                        </span>
                      ))}
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
                      style={{ background: "#8b5cf6", verticalAlign: "text-bottom" }}
                    />
                  )}
                </pre>
              </div>
            )}

            {/* Pre-generation CTA */}
            {!currentState.content && hasIdea && (
              <div
                className="rounded-xl px-4 py-3 mb-5 text-[12px]"
                style={{
                  background: "rgba(139,92,246,0.04)",
                  border: "1px solid rgba(139,92,246,0.14)",
                  color: "rgba(148,163,184,0.60)",
                }}
              >
                Click <strong style={{ color: "#c4b5fd" }}>Expand {currentLayer.label}</strong> to generate a complete,
                realness-ensured {currentLayer.label.toLowerCase()} for your idea — structured, detailed, and adapted to{" "}
                {ctx.industry} · {ctx.region} · {ctx.scale}. The framework below shows what will be produced.
              </div>
            )}

            {/* Seed Framework */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>
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
          label={`${currentLayer.label} — Universe`}
          defaultFileType="Document"
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
