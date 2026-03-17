import React, { useState, useRef, useCallback } from "react";
import { GLOBAL_REGION_GROUPS, getAllIndustries } from "@/engine/universeConfig";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectSectionId =
  | "overview" | "structure" | "operations" | "documents"
  | "tools" | "monetization" | "launch";

interface ProjectContext {
  project: string;
  industry: string;
  projectType: string;
  region: string;
  scale: string;
}

interface SectionState {
  content: string;
  loading: boolean;
  generated: boolean;
}

// ─── Section Config ───────────────────────────────────────────────────────────

const PROJECT_SECTIONS: {
  id: ProjectSectionId; num: number; icon: string; label: string; desc: string; action: string;
}[] = [
  { id: "overview",      num: 1, icon: "📋", label: "Project Overview",            desc: "Industry, project type, value proposition, and primary users",                          action: "project-overview"        },
  { id: "structure",     num: 2, icon: "🏗️", label: "Core Structure & Modules",    desc: "Main modules, what each is for, and how they connect into a complete system",          action: "core-structure-modules"  },
  { id: "operations",    num: 3, icon: "⚙️", label: "Operations & Workflows",       desc: "Daily, weekly, monthly workflows — roles, responsibilities, and step-by-step flows",  action: "operations-workflows-pb" },
  { id: "documents",     num: 4, icon: "📄", label: "Documents & Templates",        desc: "Actual written content: policies, forms, scripts, checklists, SOPs, and training",    action: "documents-templates"     },
  { id: "tools",         num: 5, icon: "🔧", label: "Tools, Systems & Setup",       desc: "Recommended tools, file organization, client tracking, and first-user onboarding",    action: "tools-systems-setup"     },
  { id: "monetization",  num: 6, icon: "💰", label: "Monetization & Pricing",       desc: "Revenue models, pricing structures, and service tiers with real figures",             action: "monetization-pricing-pb" },
  { id: "launch",        num: 7, icon: "🚀", label: "Launch & First 30 Days",       desc: "Zero-to-live steps, weekly action plan, and what success looks like at day 30",       action: "launch-30-days"          },
];

const PROJECT_TYPES = [
  "Platform / SaaS", "Agency / Service", "Marketplace", "Clinic / Practice",
  "Construction / Build", "Logistics / Ops", "Education / Training",
  "Nonprofit / Community", "E-commerce", "Consulting Firm",
];

const SCALES = ["Solo / 1-person", "Small Team (2–10)", "Mid-Size (10–50)", "Enterprise (50+)"];

const DEFAULT_CTX: ProjectContext = {
  project: "",
  industry: "Healthcare",
  projectType: "Platform / SaaS",
  region: "United States",
  scale: "Small Team (2–10)",
};

// ─── SSE Streaming Helper ─────────────────────────────────────────────────────

async function streamProjectSection(
  ctx: ProjectContext,
  action: string,
  onChunk: (text: string) => void,
  signal: AbortSignal,
) {
  const res = await fetch("/api/openai/project-builder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project: ctx.project,
      industry: ctx.industry,
      projectType: ctx.projectType,
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

const SEED_DATA: Record<ProjectSectionId, { heading: string; points: string[] }[]> = {
  overview: [
    {
      heading: "Project Identity",
      points: [
        "Industry and sub-industry classification with market context",
        "Project type: platform, agency, SaaS, marketplace, clinic, logistics hub, etc.",
        "One-sentence value proposition: what it does, for whom, and the exact outcome",
        "Primary users: who operates it, who uses it, and who benefits from it",
      ],
    },
    {
      heading: "Scope & Intent",
      points: [
        "Problem being solved: the specific gap this project fills in the industry",
        "Project boundaries: what is in scope and what is intentionally out of scope",
        "Success definition: what 'working well' looks like at 30, 90, and 365 days",
        "Stakeholder map: who needs to be involved to make this project function",
      ],
    },
  ],
  structure: [
    {
      heading: "Module Architecture",
      points: [
        "4–8 named modules or sections that make up the complete system",
        "What each module is responsible for and what problem it solves",
        "How modules connect and hand off to each other in the workflow",
        "Data and information flows between modules",
      ],
    },
    {
      heading: "Roles & Access Levels",
      points: [
        "Administrator role: full access, configuration, reporting, and oversight",
        "Operator role: day-to-day task execution, client interaction, data entry",
        "Client or end-user role: what they see, submit, and access",
        "Integration points: where external tools, systems, or partners connect",
      ],
    },
  ],
  operations: [
    {
      heading: "Daily Operations",
      points: [
        "Morning setup checklist: what the operator does before the first interaction",
        "Client or case intake: the step-by-step process for adding a new client or record",
        "Active work flow: the routine tasks that happen every operating day",
        "End-of-day closeout: records updated, follow-ups logged, next-day tasks set",
      ],
    },
    {
      heading: "Weekly & Monthly Cadence",
      points: [
        "Weekly review: pipeline, active cases, outstanding tasks, and team sync",
        "Monthly reporting: key metrics, financial summary, and client status review",
        "Role-specific responsibilities: who owns what on a recurring basis",
        "Example step-by-step flow: a complete walk-through of one core operational scenario",
      ],
    },
  ],
  documents: [
    {
      heading: "Policies & Procedures",
      points: [
        "Operating policy: the rules that govern how the project runs day-to-day",
        "Client/user policy: what clients can expect and what is required of them",
        "Data and privacy policy: how information is collected, stored, and protected",
        "Escalation and incident procedure: what happens when things go wrong",
      ],
    },
    {
      heading: "Templates & Scripts",
      points: [
        "Client intake form: every field needed to onboard a new client or project",
        "Service agreement / contract template: ready-to-use with fillable sections",
        "Phone and email scripts: for intake, follow-up, and difficult conversations",
        "SOPs and checklists: step-by-step procedures for all recurring tasks",
      ],
    },
  ],
  tools: [
    {
      heading: "Core Technology Stack",
      points: [
        "Project/case management: how to track active clients and work in progress",
        "Communication tools: how the team communicates internally and with clients",
        "Document storage: how files, forms, and records are organized and accessed",
        "Finance and billing: how invoices are created, sent, and tracked",
      ],
    },
    {
      heading: "Setup & Onboarding",
      points: [
        "Folder and file structure: recommended naming convention and hierarchy",
        "First client onboarding: exact steps to set up and serve the first real user",
        "Team onboarding: how a new team member gets up to speed in the first week",
        "System configuration: the settings and customizations needed before going live",
      ],
    },
  ],
  monetization: [
    {
      heading: "Revenue Architecture",
      points: [
        "Primary revenue model: how the project charges — per project, subscription, retainer, or hybrid",
        "Tier 1 (entry): name, price, what's included, and who it's for",
        "Tier 2 (core): name, price, what's included, and who it's for",
        "Tier 3 (premium or enterprise): name, price, and high-touch delivery description",
      ],
    },
    {
      heading: "Pricing Rationale",
      points: [
        "Market rate benchmarks: what comparable services charge in this industry and region",
        "Value-based justification: the dollar value the client gets vs. what they pay",
        "Upsell and add-on opportunities: additional services or features that increase revenue",
        "Payment terms and collection: how and when payment is requested and received",
      ],
    },
  ],
  launch: [
    {
      heading: "Pre-Launch Setup (Week 1–2)",
      points: [
        "Day 1–3: system setup, tool configuration, and document template creation",
        "Day 4–7: internal testing — run through every workflow end-to-end with test data",
        "Day 8–14: soft launch to 1–3 test clients or beta users — gather feedback",
        "Pre-launch checklist: everything that must be done before the first real client",
      ],
    },
    {
      heading: "Launch & Growth (Week 3–4+)",
      points: [
        "Week 3: first real clients onboarded — follow the intake and delivery workflow",
        "Week 4: review what worked, fix what didn't, update SOPs and templates",
        "30-day success definition: specific metrics that confirm the project is working",
        "Post-30-day priorities: what to focus on in months 2 and 3 to grow and improve",
      ],
    },
  ],
};

function SeedCard({ section }: { section: ProjectSectionId }) {
  const sectionData = SEED_DATA[section] ?? [];
  return (
    <div className="space-y-3">
      {sectionData.map((s, i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(6,182,212,0.12)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#22d3ee" }}>
            {s.heading}
          </div>
          <ul className="space-y-1.5">
            {s.points.map((p, j) => (
              <li
                key={j}
                className="flex items-start gap-2 text-[12px]"
                style={{ color: "rgba(148,163,184,0.8)" }}
              >
                <span className="flex-shrink-0 mt-0.5" style={{ color: "#06b6d4" }}>→</span>
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

export function ProjectBuilderApp() {
  const industries = getAllIndustries().filter(i => i.id !== "generic");

  const [ctx, setCtx] = useState<ProjectContext>(DEFAULT_CTX);
  const [activeSection, setActiveSection] = useState<ProjectSectionId>("overview");
  const [sectionStates, setSectionStates] = useState<Record<ProjectSectionId, SectionState>>(() => {
    const init: Partial<Record<ProjectSectionId, SectionState>> = {};
    PROJECT_SECTIONS.forEach(s => { init[s.id] = { content: "", loading: false, generated: false }; });
    return init as Record<ProjectSectionId, SectionState>;
  });
  const [generatingAll, setGeneratingAll] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const abortRefs = useRef<Partial<Record<ProjectSectionId, AbortController>>>({});

  const updateCtx = useCallback(<K extends keyof ProjectContext>(key: K, val: ProjectContext[K]) => {
    setCtx(prev => ({ ...prev, [key]: val }));
  }, []);

  const generateSection = useCallback(async (sectionId: ProjectSectionId, ctxOverride?: ProjectContext) => {
    const section = PROJECT_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;

    abortRefs.current[sectionId]?.abort();
    const ctrl = new AbortController();
    abortRefs.current[sectionId] = ctrl;

    setSectionStates(prev => ({ ...prev, [sectionId]: { content: "", loading: true, generated: false } }));

    try {
      let text = "";
      await streamProjectSection(ctxOverride ?? ctx, section.action, chunk => {
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
    if (!ctx.project.trim()) return;
    setGeneratingAll(true);
    const snapshot = { ...ctx };
    for (const section of PROJECT_SECTIONS) {
      await generateSection(section.id, snapshot);
    }
    setGeneratingAll(false);
  }, [ctx, generateSection]);

  const currentSection = PROJECT_SECTIONS.find(s => s.id === activeSection)!;
  const currentState = sectionStates[activeSection];
  const generatedCount = PROJECT_SECTIONS.filter(s => sectionStates[s.id].generated).length;
  const hasProject = ctx.project.trim().length > 0;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "hsl(195,45%,5%)", color: "#e2e8f0" }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(6,182,212,0.18)" }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="text-[15px] font-bold text-white">📋 Project File Builder</div>
            {hasProject && (
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold truncate max-w-[240px]"
                style={{
                  background: "rgba(6,182,212,0.14)",
                  border: "1px solid rgba(6,182,212,0.32)",
                  color: "#22d3ee",
                }}
              >
                {ctx.project.slice(0, 55)}{ctx.project.length > 55 ? "…" : ""}
              </span>
            )}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "rgba(148,163,184,0.50)" }}>
            7-section project file · any industry · writes actual document content — policies, scripts, SOPs, forms, ready to use today
          </div>
        </div>
        <button
          onClick={generateAll}
          disabled={generatingAll || !hasProject}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: !hasProject
              ? "rgba(255,255,255,0.04)"
              : generatingAll
              ? "rgba(6,182,212,0.06)"
              : "rgba(6,182,212,0.18)",
            border: `1px solid ${!hasProject ? "rgba(255,255,255,0.10)" : "rgba(6,182,212,0.42)"}`,
            color: !hasProject ? "#334155" : generatingAll ? "#475569" : "#22d3ee",
            cursor: !hasProject || generatingAll ? "not-allowed" : "pointer",
          }}
        >
          {generatingAll ? (
            <><span className="animate-spin inline-block">⟳</span> Building Project File…</>
          ) : (
            <><span>📋</span> Build Full Project File</>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ───────────────────────────────────────────────────────── */}
        <div
          className="w-64 flex-shrink-0 overflow-y-auto p-4 space-y-4"
          style={{ borderRight: "1px solid rgba(6,182,212,0.12)", background: "rgba(0,0,0,0.20)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#06b6d4" }}>
            Project Context
          </div>

          {/* Project Input */}
          <div>
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">
              Project Idea *
            </div>
            <textarea
              value={ctx.project}
              onChange={e => updateCtx("project", e.target.value)}
              placeholder="e.g. Healthcare platform for supportive home care, Construction project management system, Logistics coordination hub..."
              rows={4}
              autoFocus
              className="w-full text-white text-[11px] px-3 py-2 rounded-lg outline-none resize-none"
              style={{
                background: "rgba(6,182,212,0.07)",
                border: `1px solid ${ctx.project ? "rgba(6,182,212,0.42)" : "rgba(6,182,212,0.22)"}`,
              }}
            />
          </div>

          {/* Project Type */}
          <div>
            <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Project Type</div>
            <div className="space-y-1">
              {PROJECT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => updateCtx("projectType", t)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: ctx.projectType === t ? "rgba(6,182,212,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.projectType === t ? "rgba(6,182,212,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.projectType === t ? "#22d3ee" : "#475569",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
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
                    background: ctx.industry === ind.label ? "rgba(6,182,212,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.industry === ind.label ? "rgba(6,182,212,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.industry === ind.label ? "#22d3ee" : "#475569",
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
              style={{ background: "rgba(5,20,25,0.90)", border: "1px solid rgba(6,182,212,0.25)" }}
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
            <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Team Scale</div>
            <div className="space-y-1">
              {SCALES.map(s => (
                <button
                  key={s}
                  onClick={() => updateCtx("scale", s)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: ctx.scale === s ? "rgba(6,182,212,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${ctx.scale === s ? "rgba(6,182,212,0.48)" : "rgba(255,255,255,0.06)"}`,
                    color: ctx.scale === s ? "#22d3ee" : "#475569",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* What makes this different */}
          <div
            className="rounded-xl p-3"
            style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.18)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#06b6d4" }}>
              📄 Actual Document Output
            </div>
            <div className="space-y-1">
              {[
                "Written policies & procedures",
                "Filled-in intake forms",
                "Phone & email scripts",
                "Step-by-step SOPs",
                "Training outlines",
                "Ready-to-use checklists",
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#06b6d4" }} />
                  <span className="text-[10px]" style={{ color: "#475569" }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="text-[9px] mt-2" style={{ color: "rgba(6,182,212,0.55)" }}>
              Section 4 writes the actual content, not just what to write
            </div>
          </div>

          {/* Progress Tracker */}
          {generatedCount > 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.22)" }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#06b6d4" }}>
                File Progress
              </div>
              <div className="space-y-1.5">
                {PROJECT_SECTIONS.map(s => {
                  const ss = sectionStates[s.id];
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: ss.loading ? "#fbbf24" : ss.generated ? "#06b6d4" : "#334155" }}
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
                    width: `${(generatedCount / 7) * 100}%`,
                    background: "linear-gradient(90deg,#0891b2,#22d3ee)",
                  }}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[9px]" style={{ color: "#06b6d4" }}>
                  {generatedCount}/7 sections complete
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: 7 Sections ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Section Tab Bar */}
          <div
            className="flex overflow-x-auto flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(6,182,212,0.15)" }}
          >
            {PROJECT_SECTIONS.map(section => {
              const ss = sectionStates[section.id];
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    color: isActive ? "#22d3ee" : "#475569",
                    borderBottom: isActive ? "2px solid #06b6d4" : "2px solid transparent",
                    background: isActive ? "rgba(6,182,212,0.08)" : "transparent",
                  }}
                >
                  <span>{section.icon}</span>
                  <span>{section.num}. {section.label}</span>
                  {ss.generated && !ss.loading && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#06b6d4" }} />
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
                  disabled={currentState.loading || !hasProject}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold flex-shrink-0 transition-all"
                  style={{
                    background: !hasProject
                      ? "rgba(255,255,255,0.03)"
                      : currentState.loading
                      ? "rgba(6,182,212,0.05)"
                      : "rgba(6,182,212,0.18)",
                    border: `1px solid ${!hasProject ? "rgba(255,255,255,0.08)" : "rgba(6,182,212,0.38)"}`,
                    color: !hasProject ? "#334155" : currentState.loading ? "#475569" : "#22d3ee",
                    cursor: !hasProject || currentState.loading ? "not-allowed" : "pointer",
                  }}
                >
                  {currentState.loading ? (
                    <><span className="animate-spin inline-block">⟳</span> Building…</>
                  ) : (
                    <><span>📋</span> Build {currentSection.label}</>
                  )}
                </button>
              </div>
            </div>

            {/* Context Tags */}
            {hasProject && (
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {[
                  { label: ctx.projectType, color: "#06b6d4" },
                  { label: ctx.industry,    color: "#6366f1" },
                  { label: ctx.region,      color: "#0ea5e9" },
                  { label: ctx.scale,       color: "#f97316" },
                ].map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: `${tag.color}18`, border: `1px solid ${tag.color}30`, color: tag.color }}
                  >
                    {tag.label}
                  </span>
                ))}
                {currentSection.id === "documents" && (
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.30)", color: "#22d3ee" }}
                  >
                    📄 Full Document Content
                  </span>
                )}
              </div>
            )}

            {/* No Project CTA */}
            {!hasProject && (
              <div
                className="rounded-xl px-4 py-4 mb-5 text-[12px]"
                style={{
                  background: "rgba(6,182,212,0.05)",
                  border: "1px solid rgba(6,182,212,0.18)",
                  color: "rgba(148,163,184,0.65)",
                }}
              >
                Describe your <strong style={{ color: "#22d3ee" }}>project idea</strong> in the left panel.
                This engine builds a complete, 7-section project file for any industry — including{" "}
                <strong style={{ color: "#22d3ee" }}>actual written document content</strong>: policies, intake forms,
                phone scripts, SOPs, checklists, and training outlines. Not a structure — a file someone can start using today.
              </div>
            )}

            {/* AI Output Block */}
            {currentState.content && (
              <div
                className="rounded-xl p-5 mb-5"
                style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.25)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#22d3ee" }}>
                    {currentState.generated
                      ? `📋 ${currentSection.label} — Project File`
                      : `⟳ Building ${currentSection.label}…`}
                  </div>
                  {currentState.generated && (
                    <div className="flex items-center gap-1.5">
                      {["Real-World", "Complete", "Ready to Use"].map(badge => (
                        <span
                          key={badge}
                          className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide"
                          style={{ background: "rgba(6,182,212,0.16)", color: "#22d3ee" }}
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
                      style={{ background: "#06b6d4", verticalAlign: "text-bottom" }}
                    />
                  )}
                </pre>
              </div>
            )}

            {/* Pre-generation CTA */}
            {!currentState.content && hasProject && (
              <div
                className="rounded-xl px-4 py-3 mb-5 text-[12px]"
                style={{
                  background: "rgba(6,182,212,0.04)",
                  border: "1px solid rgba(6,182,212,0.14)",
                  color: "rgba(148,163,184,0.60)",
                }}
              >
                Click <strong style={{ color: "#22d3ee" }}>Build {currentSection.label}</strong> to generate
                {currentSection.id === "documents"
                  ? <> the <strong style={{ color: "#22d3ee" }}>actual written content</strong> for all policies, forms, scripts, SOPs, and checklists — ready to copy and use immediately</>
                  : <> the complete {currentSection.label.toLowerCase()} for this project — tailored to {ctx.projectType} · {ctx.industry} · {ctx.region}</>
                }.
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
          label={`${currentSection.label} — Project Plan`}
          defaultFileType="Document"
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
