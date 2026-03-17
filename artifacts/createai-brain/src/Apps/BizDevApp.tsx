import React, { useState, useRef, useCallback } from "react";
import { GLOBAL_REGION_GROUPS, getAllIndustries } from "@/engine/universeConfig";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type BizDevSectionId =
  | "concept" | "customers" | "offerings" | "operations"
  | "tools" | "monetization" | "marketing" | "legal" | "expansion";

interface BizDevContext {
  idea: string;
  industry: string;
  region: string;
  size: string;
  resources: string;
}

interface SectionState {
  content: string;
  loading: boolean;
  generated: boolean;
}

// ─── Section Config ───────────────────────────────────────────────────────────

const BIZ_SECTIONS: {
  id: BizDevSectionId; num: number; icon: string; label: string; desc: string; action: string;
}[] = [
  { id: "concept",      num: 1, icon: "💡", label: "Business Concept",            desc: "Clear concept, value proposition, and real market positioning",                        action: "business-concept"      },
  { id: "customers",    num: 2, icon: "👥", label: "Target Customers",             desc: "Ideal customer profiles, market sizing, and segmentation strategy",                   action: "target-customers"      },
  { id: "offerings",    num: 3, icon: "📦", label: "Offerings & Deliverables",     desc: "Realistic features, products, services, and what customers actually receive",         action: "offerings-deliverables" },
  { id: "operations",   num: 4, icon: "⚙️", label: "Operations & Workflows",       desc: "How the business actually runs — daily, weekly, monthly processes",                  action: "operations-workflows-biz" },
  { id: "tools",        num: 5, icon: "🔧", label: "Tools, Systems & Processes",   desc: "The real tools, software, and systems needed to operate this business",              action: "tools-systems"         },
  { id: "monetization", num: 6, icon: "💰", label: "Monetization & Revenue",       desc: "Pricing models, revenue strategy, and realistic financial projections",              action: "monetization-revenue"  },
  { id: "marketing",    num: 7, icon: "📣", label: "Marketing & Acquisition",      desc: "Go-to-market strategy, acquisition channels, and customer journey campaigns",        action: "marketing-acquisition" },
  { id: "legal",        num: 8, icon: "⚖️", label: "Legal, Compliance & Risk",     desc: "Legal structure, regulatory requirements, risk management, and liability controls", action: "legal-compliance-risk" },
  { id: "expansion",    num: 9, icon: "🚀", label: "Expansion & Future Lines",     desc: "Future product lines, market expansion, and long-term growth opportunities",        action: "expansion-future-lines" },
];

const SIZES = ["Solo / Freelance", "2–5 people", "6–15 people", "16–50 people", "50+ people"];

const DEFAULT_CTX: BizDevContext = {
  idea: "",
  industry: "Technology",
  region: "United States",
  size: "Solo / Freelance",
  resources: "",
};

// ─── SSE Streaming Helper ─────────────────────────────────────────────────────

async function streamBizDevSection(
  ctx: BizDevContext,
  action: string,
  onChunk: (text: string) => void,
  signal: AbortSignal,
) {
  const res = await fetch("/api/openai/biz-dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idea: ctx.idea,
      industry: ctx.industry,
      region: ctx.region,
      size: ctx.size,
      resources: ctx.resources,
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

const SEED_DATA: Record<BizDevSectionId, { heading: string; points: string[] }[]> = {
  concept: [
    {
      heading: "Business Concept",
      points: [
        "One-sentence concept statement: what it is, who it's for, and the result it delivers",
        "Core problem being solved — specific, observable, and real for the target customer",
        "Solution description — what the business does and how it delivers the outcome",
        "Unique value proposition — why this is the right solution vs. all alternatives",
      ],
    },
    {
      heading: "Market Positioning",
      points: [
        "Market category: where this business competes and how it is categorized",
        "Positioning statement: for [audience], [business name] is the [category] that [benefit]",
        "Competitive differentiation: 3 specific reasons this wins against direct alternatives",
        "Market timing: why now is the right moment to launch this specific business",
      ],
    },
  ],
  customers: [
    {
      heading: "Ideal Customer Profile",
      points: [
        "Primary ICP: demographics, role, industry, company size, and budget authority",
        "Psychographics: goals, fears, frustrations, and what success looks like for them",
        "Job-to-be-done: the specific outcome they hire this business to deliver",
        "Buying trigger: the event or condition that makes them ready to buy right now",
      ],
    },
    {
      heading: "Market Sizing",
      points: [
        "TAM: total addressable market with real data source and calculation method",
        "SAM: serviceable addressable market — who can actually be reached and served",
        "SOM: realistic first-year target market based on team size and go-to-market approach",
        "Secondary segments: 1–2 adjacent customer types reachable with minimal adaptation",
      ],
    },
  ],
  offerings: [
    {
      heading: "Core Offering",
      points: [
        "Primary product or service: exactly what is delivered, in what format, over what timeframe",
        "Scope definition: what is included and what is explicitly excluded",
        "Quality and outcome standards: what success looks like for the customer",
        "Differentiated features: 3–5 specific capabilities that competitors lack",
      ],
    },
    {
      heading: "Offering Architecture",
      points: [
        "Entry offering: a lower-commitment product or service to acquire new customers",
        "Core offering: the primary high-value product or service that drives revenue",
        "Premium tier: a high-touch, custom, or expanded version for the top 20% of clients",
        "Recurring element: a subscription, retainer, or renewal component for predictable revenue",
      ],
    },
  ],
  operations: [
    {
      heading: "Core Workflows",
      points: [
        "Lead-to-client workflow: from first contact through proposal, contract, and onboarding",
        "Delivery workflow: step-by-step process from kickoff to delivery to client sign-off",
        "Client success workflow: ongoing communication, check-ins, and retention touchpoints",
        "Admin workflow: billing, invoicing, bookkeeping, and reporting cadence",
      ],
    },
    {
      heading: "Operating Cadence",
      points: [
        "Daily: tasks, reviews, client communication, and production work",
        "Weekly: pipeline review, project status, team sync, and new content or outreach",
        "Monthly: financial review, client reporting, strategy check, and pipeline forecast",
        "Quarterly: pricing review, service refresh, team planning, and goal setting",
      ],
    },
  ],
  tools: [
    {
      heading: "Core Tech Stack",
      points: [
        "CRM: the tool used to manage contacts, deals, and client relationships",
        "Project management: the system used to manage delivery, tasks, and timelines",
        "Communication: email, video calls, messaging, and client portal tools",
        "Finance: invoicing, payments, bookkeeping, and financial reporting",
      ],
    },
    {
      heading: "Operations & Delivery Stack",
      points: [
        "Delivery tools: the software, platforms, or hardware used to produce the work",
        "Marketing stack: website, CMS, email marketing, social scheduling, and analytics",
        "Automation: tools that reduce manual work in sales, delivery, or client success",
        "Security and compliance: tools that protect client data and meet regulatory requirements",
      ],
    },
  ],
  monetization: [
    {
      heading: "Revenue Model",
      points: [
        "Primary model: project-based, retainer, subscription, productized service, or hybrid",
        "Pricing tier 1 (entry): name, price, what's included, ideal customer, conversion goal",
        "Pricing tier 2 (core): name, price, what's included, target revenue contribution",
        "Pricing tier 3 (premium): name, price, what's included, high-touch delivery model",
      ],
    },
    {
      heading: "Financial Targets",
      points: [
        "Month 1–3 revenue target: specific dollar figure with the client count required to hit it",
        "Month 4–6 revenue target: growth milestone with the operational changes that enable it",
        "Month 7–12 revenue target: scale milestone with the team or system changes required",
        "Break-even and margin: monthly cost structure, break-even point, and target margin %",
      ],
    },
  ],
  marketing: [
    {
      heading: "Go-to-Market Strategy",
      points: [
        "Primary acquisition channel: the one channel to dominate first with rationale",
        "Content strategy: specific topics, formats, and platforms matched to the ICP's behavior",
        "Outbound approach: direct outreach method, message, and sequence for cold acquisition",
        "Referral and word-of-mouth: the mechanism to turn clients into advocates systematically",
      ],
    },
    {
      heading: "Customer Journey Campaigns",
      points: [
        "Awareness campaign: how strangers learn the business exists and what it does",
        "Nurture campaign: how prospects move from aware to interested to ready-to-buy",
        "Conversion campaign: the specific offer, CTA, and follow-up that closes the sale",
        "Retention campaign: the post-sale communication that drives renewal and expansion",
      ],
    },
  ],
  legal: [
    {
      heading: "Legal Structure & Compliance",
      points: [
        "Recommended legal entity type and registration steps for this region and industry",
        "Licenses, permits, certifications, or accreditations required to operate legally",
        "Contracts required: service agreement, NDA, IP assignment, and consumer terms",
        "Data privacy obligations: GDPR, CCPA, HIPAA, or regional equivalent requirements",
      ],
    },
    {
      heading: "Risk Management",
      points: [
        "Top 5 business risks with probability, impact, and specific mitigation actions",
        "Insurance requirements: types, coverage levels, and recommended providers",
        "Financial risk controls: reserve requirements, payment terms, and bad debt protection",
        "Operational risk: single points of failure, key-person risk, and continuity planning",
      ],
    },
  ],
  expansion: [
    {
      heading: "Near-Term Growth",
      points: [
        "Product line 2: the next service or product to launch within 6–12 months",
        "Customer segment expansion: the adjacent segment to target after the primary is stable",
        "Geographic expansion: the next market to enter with specific adaptation requirements",
        "Partnership channel: a specific type of partner that accelerates reach or revenue",
      ],
    },
    {
      heading: "Long-Term Opportunities",
      points: [
        "Platform or productization play: how the business becomes a scalable product",
        "Recurring revenue maximization: how to shift to 70%+ recurring revenue over time",
        "Acquisition or partnership target: the type of business to absorb or deeply partner with",
        "Exit or independence path: criteria for acquisition, investment, or founder independence",
      ],
    },
  ],
};

function SeedCard({ section }: { section: BizDevSectionId }) {
  const sections = SEED_DATA[section] ?? [];
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(249,115,22,0.12)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#fb923c" }}>
            {s.heading}
          </div>
          <ul className="space-y-1.5">
            {s.points.map((p, j) => (
              <li
                key={j}
                className="flex items-start gap-2 text-[12px]"
                style={{ color: "rgba(148,163,184,0.8)" }}
              >
                <span className="flex-shrink-0 mt-0.5" style={{ color: "#f97316" }}>→</span>
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

export function BizDevApp() {
  const industries = getAllIndustries().filter(i => i.id !== "generic");

  const [ctx, setCtx] = useState<BizDevContext>(DEFAULT_CTX);
  const [activeSection, setActiveSection] = useState<BizDevSectionId>("concept");
  const [sectionStates, setSectionStates] = useState<Record<BizDevSectionId, SectionState>>(() => {
    const init: Partial<Record<BizDevSectionId, SectionState>> = {};
    BIZ_SECTIONS.forEach(s => { init[s.id] = { content: "", loading: false, generated: false }; });
    return init as Record<BizDevSectionId, SectionState>;
  });
  const [generatingAll, setGeneratingAll] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const abortRefs = useRef<Partial<Record<BizDevSectionId, AbortController>>>({});

  const updateCtx = useCallback(<K extends keyof BizDevContext>(key: K, val: BizDevContext[K]) => {
    setCtx(prev => ({ ...prev, [key]: val }));
  }, []);

  const generateSection = useCallback(async (sectionId: BizDevSectionId, ctxOverride?: BizDevContext) => {
    const section = BIZ_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;

    abortRefs.current[sectionId]?.abort();
    const ctrl = new AbortController();
    abortRefs.current[sectionId] = ctrl;

    setSectionStates(prev => ({ ...prev, [sectionId]: { content: "", loading: true, generated: false } }));

    try {
      let text = "";
      await streamBizDevSection(ctxOverride ?? ctx, section.action, chunk => {
        text += chunk;
        setSectionStates(prev => ({ ...prev, [sectionId]: { content: text, loading: true, generated: false } }));
      }, ctrl.signal);
      setSectionStates(prev => ({ ...prev, [sectionId]: { content: text, loading: false, generated: true } }));
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setSectionStates(prev => ({
          ...prev,
          [sectionId]: { content: "[Generation failed — check your connection and try again]", loading: false, generated: false },
        }));
      }
    }
  }, [ctx]);

  const generateAll = useCallback(async () => {
    if (!ctx.idea.trim()) return;
    setGeneratingAll(true);
    const snapshot = { ...ctx };
    for (const section of BIZ_SECTIONS) {
      await generateSection(section.id, snapshot);
    }
    setGeneratingAll(false);
  }, [ctx, generateSection]);

  const currentSection = BIZ_SECTIONS.find(s => s.id === activeSection)!;
  const currentState = sectionStates[activeSection];
  const generatedCount = BIZ_SECTIONS.filter(s => sectionStates[s.id].generated).length;
  const hasIdea = ctx.idea.trim().length > 0;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "hsl(22,40%,5%)", color: "#e2e8f0" }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(249,115,22,0.18)" }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="text-[15px] font-bold text-white">⚡ Real-World Business Planner</div>
            {hasIdea && (
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold truncate max-w-[220px]"
                style={{
                  background: "rgba(249,115,22,0.14)",
                  border: "1px solid rgba(249,115,22,0.32)",
                  color: "#fb923c",
                }}
              >
                {ctx.idea.slice(0, 50)}{ctx.idea.length > 50 ? "…" : ""}
              </span>
            )}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.50)" }}>
            9-section execution plan · grounded in real-world logic · no filler, no placeholders, ready to execute
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
              ? "rgba(249,115,22,0.06)"
              : "rgba(249,115,22,0.20)",
            border: `1px solid ${!hasIdea ? "rgba(255,255,255,0.10)" : "rgba(249,115,22,0.45)"}`,
            color: !hasIdea ? "#334155" : generatingAll ? "#475569" : "#fb923c",
            cursor: !hasIdea || generatingAll ? "not-allowed" : "pointer",
          }}
        >
          {generatingAll ? (
            <><span className="animate-spin inline-block">⟳</span> Building Plan…</>
          ) : (
            <><span>⚡</span> Build Full Plan</>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ───────────────────────────────────────────────────────── */}
        <div
          className="w-64 flex-shrink-0 overflow-y-auto p-4 space-y-4"
          style={{ borderRight: "1px solid rgba(249,115,22,0.12)", background: "rgba(0,0,0,0.20)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#f97316" }}>
            Business Context
          </div>

          {/* Idea Input */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">
              Business Idea *
            </div>
            <textarea
              value={ctx.idea}
              onChange={e => updateCtx("idea", e.target.value)}
              placeholder="Describe the business idea you want to plan and execute…"
              rows={4}
              autoFocus
              className="w-full text-white text-[11px] px-3 py-2 rounded-lg outline-none resize-none"
              style={{
                background: "rgba(249,115,22,0.07)",
                border: `1px solid ${ctx.idea ? "rgba(249,115,22,0.42)" : "rgba(249,115,22,0.22)"}`,
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
                    background: ctx.industry === ind.label ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.industry === ind.label ? "rgba(249,115,22,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.industry === ind.label ? "#fb923c" : "#475569",
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
              style={{ background: "rgba(30,15,5,0.90)", border: "1px solid rgba(249,115,22,0.25)" }}
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

          {/* Team Size */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Team Size</div>
            <div className="space-y-1">
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => updateCtx("size", s)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: ctx.size === s ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.size === s ? "rgba(249,115,22,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.size === s ? "#fb923c" : "#475569",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Existing Resources */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">
              Existing Resources / Skills
            </div>
            <textarea
              value={ctx.resources}
              onChange={e => updateCtx("resources", e.target.value)}
              placeholder="e.g. 5 years in healthcare admin, $10k starting capital, existing client network..."
              rows={3}
              className="w-full text-white text-[10px] px-2.5 py-2 rounded-lg outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(249,115,22,0.18)" }}
            />
          </div>

          {/* Ground Rules Badge */}
          <div
            className="rounded-xl p-3"
            style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.18)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#f97316" }}>
              ⚡ Execution Standards
            </div>
            <div className="space-y-1">
              {[
                "Grounded in real-world logic",
                "No placeholders or filler",
                "No unrealistic claims",
                "Feasible for a real business",
                "Complete and ready to execute",
              ].map(rule => (
                <div key={rule} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#f97316" }} />
                  <span className="text-[10px]" style={{ color: "#475569" }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Tracker */}
          {generatedCount > 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.22)" }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#f97316" }}>
                Plan Progress
              </div>
              <div className="space-y-1.5">
                {BIZ_SECTIONS.map(s => {
                  const ss = sectionStates[s.id];
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: ss.loading ? "#fbbf24" : ss.generated ? "#f97316" : "#334155",
                        }}
                      />
                      <span className="text-[10px]" style={{ color: ss.generated ? "#94a3b8" : "#475569" }}>
                        {s.num}. {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: `${(generatedCount / 9) * 100}%`,
                    background: "linear-gradient(90deg,#ea580c,#fb923c)",
                  }}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[9px]" style={{ color: "#f97316" }}>
                  {generatedCount}/9 sections complete
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: 9 Sections ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Section Tab Bar */}
          <div
            className="flex overflow-x-auto flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(249,115,22,0.15)" }}
          >
            {BIZ_SECTIONS.map(section => {
              const ss = sectionStates[section.id];
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    color: isActive ? "#fb923c" : "#475569",
                    borderBottom: isActive ? "2px solid #f97316" : "2px solid transparent",
                    background: isActive ? "rgba(249,115,22,0.08)" : "transparent",
                  }}
                >
                  <span>{section.icon}</span>
                  <span>{section.num}. {section.label}</span>
                  {ss.generated && !ss.loading && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#f97316" }} />
                  )}
                  {ss.loading && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#fbbf24" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Section Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Section Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{currentSection.icon}</span>
                <div>
                  <div className="text-[15px] font-bold text-white">
                    {currentSection.num}. {currentSection.label}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.50)" }}>
                    {currentSection.desc}
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
                  onClick={() => generateSection(activeSection)}
                  disabled={currentState.loading || !hasIdea}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold flex-shrink-0 transition-all"
                  style={{
                    background: !hasIdea
                      ? "rgba(255,255,255,0.03)"
                      : currentState.loading
                      ? "rgba(249,115,22,0.05)"
                      : "rgba(249,115,22,0.18)",
                    border: `1px solid ${!hasIdea ? "rgba(255,255,255,0.08)" : "rgba(249,115,22,0.38)"}`,
                    color: !hasIdea ? "#334155" : currentState.loading ? "#475569" : "#fb923c",
                    cursor: !hasIdea || currentState.loading ? "not-allowed" : "pointer",
                  }}
                >
                  {currentState.loading ? (
                    <><span className="animate-spin inline-block">⟳</span> Planning…</>
                  ) : (
                    <><span>⚡</span> Plan {currentSection.label}</>
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
                  { label: ctx.size,     color: "#f97316" },
                  ...(ctx.resources ? [{ label: ctx.resources.slice(0, 40) + (ctx.resources.length > 40 ? "…" : ""), color: "#64748b" }] : []),
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
                  style={{ background: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.28)", color: "#fb923c" }}
                >
                  ⚡ Real-World
                </span>
              </div>
            )}

            {/* No Idea CTA */}
            {!hasIdea && (
              <div
                className="rounded-xl px-4 py-4 mb-5 text-[12px]"
                style={{
                  background: "rgba(249,115,22,0.05)",
                  border: "1px solid rgba(249,115,22,0.18)",
                  color: "rgba(148,163,184,0.65)",
                }}
              >
                Describe your <strong style={{ color: "#fb923c" }}>business idea</strong> in the left panel to get started.
                This engine produces a complete, 9-section business plan grounded in real-world logic — executable from day one,
                with no placeholders, no vague content, and no unrealistic claims.
              </div>
            )}

            {/* AI Output Block */}
            {currentState.content && (
              <div
                className="rounded-xl p-5 mb-5"
                style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.25)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#fb923c" }}>
                    {currentState.generated
                      ? `⚡ ${currentSection.label} — Execution Plan`
                      : `⟳ Planning ${currentSection.label}…`}
                  </div>
                  {currentState.generated && (
                    <div className="flex items-center gap-1.5">
                      {["Grounded", "Complete", "Executable"].map(badge => (
                        <span
                          key={badge}
                          className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide"
                          style={{ background: "rgba(249,115,22,0.16)", color: "#fb923c" }}
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
                      style={{ background: "#f97316", verticalAlign: "text-bottom" }}
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
                  background: "rgba(249,115,22,0.04)",
                  border: "1px solid rgba(249,115,22,0.14)",
                  color: "rgba(148,163,184,0.60)",
                }}
              >
                Click <strong style={{ color: "#fb923c" }}>Plan {currentSection.label}</strong> to generate a complete,
                real-world {currentSection.label.toLowerCase()} — grounded in {ctx.industry} · {ctx.region} · {ctx.size},
                built specifically for your idea with no filler. The framework below shows exactly what will be produced.
              </div>
            )}

            {/* Seed Framework */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>
                Framework Structure
              </div>
              <SeedCard section={activeSection} />
            </div>
          </div>
        </div>
      </div>
      {showSaveModal && (
        <SaveToProjectModal
          content={currentState.content}
          label={`${currentSection.label} — Business Plan`}
          defaultFileType="Document"
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
