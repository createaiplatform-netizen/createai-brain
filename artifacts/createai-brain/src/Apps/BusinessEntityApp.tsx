import React, { useState, useRef, useCallback } from "react";
import { GLOBAL_REGION_GROUPS, getAllIndustries } from "@/engine/universeConfig";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";
import { streamEngine } from "@/controller";

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityLayerId =
  | "brand" | "model" | "operations" | "ecosystem"
  | "growth" | "compliance" | "expansion";

interface EntityContext {
  entityName: string;
  description: string;
  industry: string;
  region: string;
  audience: string;
  stage: string;
}

interface LayerState {
  content: string;
  loading: boolean;
  generated: boolean;
}

// ─── Layer Config ──────────────────────────────────────────────────────────────

const ENTITY_LAYERS: {
  id: EntityLayerId; num: number; icon: string; label: string; desc: string; action: string;
}[] = [
  { id: "brand",      num: 1, icon: "🎨", label: "Brand & Positioning",         desc: "Identity, audience, value proposition, and market differentiation",            action: "brand-positioning"      },
  { id: "model",      num: 2, icon: "💰", label: "Business Model & Revenue",    desc: "Monetization models, pricing tiers, and complete revenue flow architecture",   action: "business-model-revenue"  },
  { id: "operations", num: 3, icon: "⚙️", label: "Operations & Workflows",      desc: "Roles, responsibilities, processes, and end-to-end customer journeys",         action: "operations-workflows"    },
  { id: "ecosystem",  num: 4, icon: "🧩", label: "Product & Feature Ecosystem", desc: "Supporting tools, features, and sub-products that expand the business",        action: "product-ecosystem"       },
  { id: "growth",     num: 5, icon: "📈", label: "Growth & Market Strategy",    desc: "Marketing, acquisition, retention, and market expansion strategies",            action: "growth-strategy"         },
  { id: "compliance", num: 6, icon: "🛡️", label: "Compliance & Safety",         desc: "Legal, ethical, and regulatory boundaries for your region and industry",       action: "compliance-safety"       },
  { id: "expansion",  num: 7, icon: "🚀", label: "Expansion Layer",             desc: "Additional verticals, integrations, partnerships, and future opportunities",    action: "expansion-entity"        },
];

const STAGES = ["Concept", "Early-Stage", "Growing", "Scaling", "Mature"];

const DEFAULT_CTX: EntityContext = {
  entityName: "",
  description: "",
  industry: "Healthcare",
  region: "California",
  audience: "",
  stage: "Concept",
};

// ─── Seed Framework Cards ──────────────────────────────────────────────────────

const SEED_DATA: Record<EntityLayerId, { heading: string; points: string[] }[]> = {
  brand: [
    {
      heading: "Identity & Voice",
      points: [
        "Brand name rationale, tagline, and consistent identity across all touchpoints",
        "Visual language direction: color palette, typography tone, iconography style",
        "Brand voice definition: professional, approachable, expert, empowering — or a unique mix",
        "Differentiation statement: what makes this entity distinct from all alternatives",
      ],
    },
    {
      heading: "Audience & Value Proposition",
      points: [
        "Primary audience: demographics, psychographics, and behavioral profile",
        "Secondary audience: adjacent segments reachable with minimal adaptation",
        "Core value proposition: the precise problem solved and the outcome delivered",
        "Competitive positioning map: better, different, or more accessible than alternatives",
      ],
    },
  ],
  model: [
    {
      heading: "Revenue Streams",
      points: [
        "Primary model: subscription, project-based, licensing, usage-based, or hybrid",
        "Secondary revenue: consulting, training, marketplace commissions, or data services",
        "Pricing tiers: Starter, Professional, Enterprise — each with feature differentiation",
        "Revenue mix targets: % recurring vs. transactional vs. strategic partnerships",
      ],
    },
    {
      heading: "Economics & Projections",
      points: [
        "Customer acquisition cost, lifetime value, and payback period estimates",
        "Gross margin targets by tier and revenue stream",
        "12-month revenue ramp: months 1–3 launch, 4–6 growth, 7–12 scale with targets",
        "Break-even analysis and key financial milestones with named success metrics",
      ],
    },
  ],
  operations: [
    {
      heading: "Core Roles & Ownership",
      points: [
        "Founding/Leadership: strategy, investor relations, product vision ownership",
        "Operations: delivery execution, quality assurance, vendor and partner management",
        "Sales & Client Success: acquisition, structured onboarding, retention, expansion",
        "Finance & Compliance: billing, financial reporting, regulatory adherence tracking",
      ],
    },
    {
      heading: "Customer Journey Design",
      points: [
        "Awareness → Consideration → Decision: touchpoints and conversion triggers at each stage",
        "Onboarding: structured first-30-days experience with defined success milestones",
        "Ongoing delivery: recurring touchpoints, QBRs, and value demonstration moments",
        "Retention & expansion: renewal triggers, upsell moments, and referral mechanisms",
      ],
    },
  ],
  ecosystem: [
    {
      heading: "Core Product Suite",
      points: [
        "Flagship offering: the primary product that anchors the brand and drives 70%+ of revenue",
        "Companion tools: features or modules that extend and deepen the flagship's value",
        "Self-service tier: a lighter offering at a lower price point for volume acquisition",
        "Enterprise tier: custom-configured, high-touch, premium delivery for large accounts",
      ],
    },
    {
      heading: "Ecosystem Extensions",
      points: [
        "Marketplace or directory: connect users with vetted service providers or partners",
        "Education layer: courses, certifications, or training content with recurring revenue",
        "Community platform: peer networking, user-generated content, and engagement loops",
        "API or integration layer: let third-party tools embed within or connect to the platform",
      ],
    },
  ],
  growth: [
    {
      heading: "Acquisition Strategy",
      points: [
        "Organic: thought leadership content, SEO, and community presence in key channels",
        "Paid: targeted advertising where the primary audience is most concentrated",
        "Partnerships: referral agreements, co-marketing deals, and distribution channels",
        "Outbound: direct prospect outreach with a personalized, problem-first pitch",
      ],
    },
    {
      heading: "Retention & Expansion",
      points: [
        "Onboarding excellence: reduce time-to-value to maximize early-stage retention",
        "Success cadence: structured check-ins tied to measurable client milestones",
        "Upsell triggers: identify behavioral and milestone signals for tier upgrade moments",
        "Referral program: incentivize advocates with credits, commissions, or recognition",
      ],
    },
  ],
  compliance: [
    {
      heading: "Legal & Regulatory Framework",
      points: [
        "Business structure, registration, and operating jurisdiction requirements",
        "Industry-specific licensing, certifications, or accreditations required to operate",
        "Data privacy: GDPR, CCPA, HIPAA, PIPEDA, or applicable regional data laws",
        "Contracts: service agreements, IP ownership clauses, NDAs, and liability limits",
      ],
    },
    {
      heading: "Ethical & Safety Standards",
      points: [
        "Content standards: accuracy, transparency, non-deception in all communications",
        "Automation boundaries: what is automated vs. what requires mandatory human review",
        "Consumer protection: refund policy, dispute resolution, and accessibility standards",
        "Vendor ethics: vetting standards for all third-party partners and service providers",
      ],
    },
  ],
  expansion: [
    {
      heading: "Near-Term Expansion",
      points: [
        "Adjacent product lines achievable with the current team and operational infrastructure",
        "Geographic markets requiring minimal adaptation, translation, or compliance changes",
        "Partnership types that accelerate reach — resellers, affiliates, channel partners",
        "Platform plays that embed this business into other commonly-used industry workflows",
      ],
    },
    {
      heading: "Long-Term Vision",
      points: [
        "Category leadership: what this entity becomes the definitive solution for globally",
        "Network effects: mechanisms that make the platform more valuable as it scales",
        "Strategic acquisition targets: complementary tools or teams to absorb for acceleration",
        "Exit or independence path: acquisition readiness, IPO criteria, or founder liquidity",
      ],
    },
  ],
};

function SeedCard({ layer }: { layer: EntityLayerId }) {
  const sections = SEED_DATA[layer] ?? [];
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(16,185,129,0.12)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#10b981" }}>
            {s.heading}
          </div>
          <ul className="space-y-1.5">
            {s.points.map((p, j) => (
              <li
                key={j}
                className="flex items-start gap-2 text-[12px]"
                style={{ color: "rgba(148,163,184,0.8)" }}
              >
                <span className="flex-shrink-0 mt-0.5" style={{ color: "#10b981" }}>→</span>
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

export function BusinessEntityApp() {
  const industries = getAllIndustries().filter(i => i.id !== "generic");

  const [ctx, setCtx] = useState<EntityContext>(DEFAULT_CTX);
  const [activeLayer, setActiveLayer] = useState<EntityLayerId>("brand");
  const [layerStates, setLayerStates] = useState<Record<EntityLayerId, LayerState>>(() => {
    const init: Partial<Record<EntityLayerId, LayerState>> = {};
    ENTITY_LAYERS.forEach(l => { init[l.id] = { content: "", loading: false, generated: false }; });
    return init as Record<EntityLayerId, LayerState>;
  });
  const [generatingAll, setGeneratingAll] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const abortRefs = useRef<Partial<Record<EntityLayerId, AbortController>>>({});

  const updateCtx = useCallback(<K extends keyof EntityContext>(key: K, val: EntityContext[K]) => {
    setCtx(prev => ({ ...prev, [key]: val }));
  }, []);

  const generateLayer = useCallback(async (layerId: EntityLayerId, ctxOverride?: EntityContext) => {
    const layer = ENTITY_LAYERS.find(l => l.id === layerId);
    if (!layer) return;

    abortRefs.current[layerId]?.abort();
    const ctrl = new AbortController();
    abortRefs.current[layerId] = ctrl;

    setLayerStates(prev => ({ ...prev, [layerId]: { content: "", loading: true, generated: false } }));

    try {
      let text = "";
      const c = ctxOverride ?? ctx;
      await streamEngine({
        engineId: "UniversalStrategyEngine",
        topic: [
          `BUSINESS ENTITY — SECTION: ${layer.label}`,
          `Entity: ${c.entityName}`,
          c.description ? `Description: ${c.description}` : "",
          `Industry: ${c.industry}`,
          `Region: ${c.region}`,
          c.audience ? `Audience: ${c.audience}` : "",
          `Stage: ${c.stage}`,
          `\nGenerate the ${layer.label} section with full detail and real-world specifics.`,
        ].filter(Boolean).join("\n"),
        signal: ctrl.signal,
        onChunk: chunk => {
          text += chunk;
          setLayerStates(prev => ({ ...prev, [layerId]: { content: text, loading: true, generated: false } }));
        },
      });
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
    if (!ctx.entityName.trim()) return;
    setGeneratingAll(true);
    const snapshot = { ...ctx };
    for (const layer of ENTITY_LAYERS) {
      await generateLayer(layer.id, snapshot);
    }
    setGeneratingAll(false);
  }, [ctx, generateLayer]);

  const currentLayer = ENTITY_LAYERS.find(l => l.id === activeLayer)!;
  const currentState = layerStates[activeLayer];
  const generatedCount = ENTITY_LAYERS.filter(l => layerStates[l.id].generated).length;
  const hasEntity = ctx.entityName.trim().length > 0;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "hsl(231,47%,6%)", color: "#e2e8f0" }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(16,185,129,0.15)" }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="text-[15px] font-bold text-white">🧬 Business Entity Engine</div>
            {hasEntity && (
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: "rgba(16,185,129,0.14)",
                  border: "1px solid rgba(16,185,129,0.30)",
                  color: "#34d399",
                }}
              >
                {ctx.entityName}
              </span>
            )}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.55)" }}>
            7-layer conceptual entity design · transforms any product, platform, or idea into a complete structured business
          </div>
        </div>
        <button
          onClick={generateAll}
          disabled={generatingAll || !hasEntity}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: !hasEntity
              ? "rgba(255,255,255,0.04)"
              : generatingAll
              ? "rgba(16,185,129,0.06)"
              : "rgba(16,185,129,0.18)",
            border: `1px solid ${!hasEntity ? "rgba(255,255,255,0.10)" : "rgba(16,185,129,0.40)"}`,
            color: !hasEntity ? "#334155" : generatingAll ? "#475569" : "#34d399",
            cursor: !hasEntity || generatingAll ? "not-allowed" : "pointer",
          }}
        >
          {generatingAll ? (
            <><span className="animate-spin inline-block">⟳</span> Building Entity…</>
          ) : (
            <><span>✦</span> Build Full Entity</>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel: Entity Profile ──────────────────────────────────────── */}
        <div
          className="w-64 flex-shrink-0 overflow-y-auto p-4 space-y-4"
          style={{ borderRight: "1px solid rgba(16,185,129,0.12)", background: "rgba(0,0,0,0.18)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#10b981" }}>
            Entity Profile
          </div>

          {/* Entity Name */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">
              Product / Platform / Idea *
            </div>
            <input
              value={ctx.entityName}
              onChange={e => updateCtx("entityName", e.target.value)}
              placeholder="e.g. CareConnect, HireFlow Pro, GreenLeaf Market..."
              autoFocus
              className="w-full text-white text-[12px] px-3 py-2 rounded-lg outline-none"
              style={{
                background: "rgba(16,185,129,0.06)",
                border: `1px solid ${ctx.entityName ? "rgba(16,185,129,0.42)" : "rgba(16,185,129,0.20)"}`,
              }}
            />
          </div>

          {/* Description */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">
              One-Line Description
            </div>
            <textarea
              value={ctx.description}
              onChange={e => updateCtx("description", e.target.value)}
              placeholder="e.g. An AI-powered platform that connects patients with care coordinators in real time..."
              rows={3}
              className="w-full text-white text-[10px] px-2.5 py-2 rounded-lg outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,185,129,0.18)" }}
            />
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
                    background: ctx.industry === ind.label ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.industry === ind.label ? "rgba(16,185,129,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.industry === ind.label ? "#34d399" : "#475569",
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
              style={{ background: "rgba(14,18,42,0.85)", border: "1px solid rgba(16,185,129,0.22)" }}
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

          {/* Target Audience */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Target Audience</div>
            <input
              value={ctx.audience}
              onChange={e => updateCtx("audience", e.target.value)}
              placeholder="e.g. Independent clinics, mid-size HR teams..."
              className="w-full text-white text-[11px] px-2.5 py-2 rounded-lg outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,185,129,0.18)" }}
            />
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
                    background: ctx.stage === s ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.stage === s ? "rgba(16,185,129,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.stage === s ? "#34d399" : "#475569",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Tracker */}
          {generatedCount > 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#10b981" }}>
                Entity Progress
              </div>
              <div className="space-y-1.5">
                {ENTITY_LAYERS.map(l => {
                  const ls = layerStates[l.id];
                  return (
                    <div key={l.id} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: ls.loading ? "#f59e0b" : ls.generated ? "#10b981" : "#334155",
                        }}
                      />
                      <span
                        className="text-[10px]"
                        style={{ color: ls.generated ? "#94a3b8" : "#475569" }}
                      >
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
                    width: `${(generatedCount / 7) * 100}%`,
                    background: "linear-gradient(90deg,#10b981,#34d399)",
                  }}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[9px]" style={{ color: "#10b981" }}>
                  {generatedCount}/7 layers complete
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: 7 Layers ─────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Layer Tab Bar */}
          <div
            className="flex overflow-x-auto flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(16,185,129,0.12)" }}
          >
            {ENTITY_LAYERS.map(layer => {
              const ls = layerStates[layer.id];
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    color: isActive ? "#34d399" : "#475569",
                    borderBottom: isActive ? "2px solid #10b981" : "2px solid transparent",
                    background: isActive ? "rgba(16,185,129,0.07)" : "transparent",
                  }}
                >
                  <span>{layer.icon}</span>
                  <span>L{layer.num}: {layer.label}</span>
                  {ls.generated && !ls.loading && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "#10b981" }}
                    />
                  )}
                  {ls.loading && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                      style={{ background: "#f59e0b" }}
                    />
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
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.55)" }}>
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
                  disabled={currentState.loading || !hasEntity}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold flex-shrink-0 transition-all"
                  style={{
                    background: !hasEntity
                      ? "rgba(255,255,255,0.03)"
                      : currentState.loading
                      ? "rgba(16,185,129,0.04)"
                      : "rgba(16,185,129,0.16)",
                    border: `1px solid ${!hasEntity ? "rgba(255,255,255,0.08)" : "rgba(16,185,129,0.35)"}`,
                    color: !hasEntity ? "#334155" : currentState.loading ? "#475569" : "#34d399",
                    cursor: !hasEntity || currentState.loading ? "not-allowed" : "pointer",
                  }}
                >
                  {currentState.loading ? (
                    <><span className="animate-spin inline-block">⟳</span> Building…</>
                  ) : (
                    <><span>✦</span> Build {currentLayer.label}</>
                  )}
                </button>
              </div>
            </div>

            {/* Entity Context Tags */}
            {hasEntity && (
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {[
                  { label: ctx.entityName,                             color: "#10b981" },
                  { label: ctx.industry,                               color: "#6366f1" },
                  { label: ctx.region,                                 color: "#0ea5e9" },
                  { label: ctx.stage,                                  color: "#f59e0b" },
                  ...(ctx.audience ? [{ label: ctx.audience,           color: "#a855f7" }] : []),
                  ...(ctx.description ? [{ label: ctx.description.slice(0, 60) + (ctx.description.length > 60 ? "…" : ""), color: "#64748b" }] : []),
                ].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: `${tag.color}18`, border: `1px solid ${tag.color}30`, color: tag.color }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}

            {/* No Entity CTA */}
            {!hasEntity && (
              <div
                className="rounded-xl px-4 py-4 mb-5 text-[12px]"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  color: "rgba(148,163,184,0.65)",
                }}
              >
                Enter your <strong style={{ color: "#34d399" }}>product, platform, or idea name</strong> in the left panel to get started.
                The engine will transform it into a complete, structured business entity across all 7 layers — branding, revenue model,
                operations, product ecosystem, growth strategy, compliance, and expansion.
              </div>
            )}

            {/* AI Output Block */}
            {currentState.content && (
              <div
                className="rounded-xl p-5 mb-5"
                style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.22)" }}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#34d399" }}>
                  {currentState.generated
                    ? `✦ ${ctx.entityName} — ${currentLayer.label}`
                    : `⟳ Building ${currentLayer.label}…`}
                </div>
                <pre
                  className="text-[12px] whitespace-pre-wrap leading-relaxed font-sans"
                  style={{ color: "rgba(226,232,240,0.92)" }}
                >
                  {currentState.content}
                  {currentState.loading && (
                    <span
                      className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse"
                      style={{ background: "#10b981", verticalAlign: "text-bottom" }}
                    />
                  )}
                </pre>
              </div>
            )}

            {/* Pre-generation CTA */}
            {!currentState.content && hasEntity && (
              <div
                className="rounded-xl px-4 py-3 mb-5 text-[12px]"
                style={{
                  background: "rgba(16,185,129,0.04)",
                  border: "1px solid rgba(16,185,129,0.12)",
                  color: "rgba(148,163,184,0.65)",
                }}
              >
                Click <strong style={{ color: "#34d399" }}>Build {currentLayer.label}</strong> to generate a complete,
                AI-built {currentLayer.label.toLowerCase()} for{" "}
                <strong style={{ color: "#34d399" }}>{ctx.entityName}</strong> — fully structured, detailed, and adapted to{" "}
                {ctx.industry} · {ctx.region} · {ctx.stage} stage. The framework below shows what will be produced.
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
          label={`${currentLayer.label} — Entity Design`}
          defaultFileType="Document"
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
