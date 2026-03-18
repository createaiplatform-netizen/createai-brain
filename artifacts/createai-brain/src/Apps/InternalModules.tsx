import React, { useState } from "react";

// ─── Pipeline View ─────────────────────────────────────────────────────────────

interface PipelineFile {
  id: string;
  name: string;
  content?: string;
}

const PIPELINE_STAGES = ["Idea", "Draft", "Refining", "Final"] as const;
type PipelineStage = typeof PIPELINE_STAGES[number];
const STAGE_COLORS: Record<PipelineStage, string> = {
  "Idea": "#475569", "Draft": "#6366f1", "Refining": "#f59e0b", "Final": "#10b981",
};

export function PipelineView({ projectName, files }: { projectName: string; files: PipelineFile[] }) {
  const [fileStages, setFileStages] = useState<Record<string, PipelineStage>>({});
  const getStage = (id: string): PipelineStage => fileStages[id] ?? "Idea";
  const moveFile = (id: string, s: PipelineStage) => setFileStages(p => ({ ...p, [id]: s }));

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-5">
        <p className="text-[15px] font-bold text-white mb-1">🔄 Production Pipeline</p>
        <p className="text-[11px]" style={{ color: "#475569" }}>
          Move documents through your production workflow — Idea → Draft → Refining → Final.
          &nbsp;{projectName}
        </p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {PIPELINE_STAGES.map(stage => {
          const col = STAGE_COLORS[stage];
          const stageFiles = files.filter(f => getStage(f.id) === stage);
          return (
            <div key={stage} className="flex-shrink-0 w-56">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: col }} />
                <p className="text-[11px] font-bold" style={{ color: col }}>{stage}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto"
                  style={{ background: `${col}18`, color: col }}>{stageFiles.length}</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[120px] rounded-2xl p-2"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                {stageFiles.map(f => (
                  <div key={f.id} className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                    <p className="text-[11px] font-semibold text-white mb-2 truncate">{f.name}</p>
                    <p className="text-[9px] mb-2.5 truncate" style={{ color: "#475569" }}>
                      {(f.content ?? "").length > 0 ? `${Math.ceil((f.content ?? "").length / 5)} words` : "Empty"}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {PIPELINE_STAGES.filter(s => s !== stage).map(s => (
                        <button key={s} onClick={() => moveFile(f.id, s)}
                          className="text-[9px] px-2 py-1 rounded-lg transition-all"
                          style={{ background: `${STAGE_COLORS[s]}12`, color: STAGE_COLORS[s], border: `1px solid ${STAGE_COLORS[s]}25` }}>
                          → {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {stageFiles.length === 0 && (
                  <div className="flex-1 flex items-center justify-center py-6">
                    <p className="text-[10px]" style={{ color: "#334155" }}>No documents yet</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Safety Banner ─────────────────────────────────────────────────────────────
// Shown in all restricted/regulated sections
export function SafetyBanner({ label }: { label: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3 mb-4 rounded-xl"
      style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.20)" }}>
      <span className="text-sm flex-shrink-0 mt-0.5">⚠️</span>
      <div className="flex-1">
        <p className="text-[11px] font-semibold" style={{ color: "#f59e0b" }}>Internal / Educational Use Only</p>
        <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: "#78716c" }}>
          {label} All content here is for internal planning, training, and educational purposes only.
          Nothing in this module constitutes legal, medical, financial, or regulatory advice or certification.
          Activate real-world features only after appropriate legal review and authorization.
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "#78716c" }}>✕</button>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHead({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="text-xl">{icon}</span>
        <h2 className="text-[15px] font-bold text-white">{title}</h2>
      </div>
      {sub && <p className="text-[11px] leading-relaxed" style={{ color: "#64748b" }}>{sub}</p>}
    </div>
  );
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {children}
    </div>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 mb-5 flex-wrap">
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)}
          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
          style={active === t
            ? { background: "rgba(99,102,241,0.28)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.40)" }
            : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.07)" }
          }>{t}</button>
      ))}
    </div>
  );
}

// ─── Pill badge ───────────────────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. SALES MODULE
// ══════════════════════════════════════════════════════════════════════════════

const OUTREACH_TEMPLATES = [
  {
    id: "cold-email",
    name: "Cold Email — Value Lead",
    category: "Email",
    subject: "Quick question about [Pain Point]",
    body: `Hi [First Name],

I noticed [Company] is [specific observation — growing team / launching product / entering market].

Most [role] I talk to are struggling with [specific pain point]. We helped [similar company] solve this and [specific result].

Worth a 15-minute call this week to see if it's relevant?

[Your name]`,
  },
  {
    id: "follow-up",
    name: "Follow-Up (No Response)",
    category: "Email",
    subject: "Re: Quick question",
    body: `Hi [First Name],

Just bumping this up — I know your inbox is busy.

One question: Is [pain point] a current priority, or should I check back in [timeframe]?

Either answer is totally fine.

[Your name]`,
  },
  {
    id: "linkedin-connect",
    name: "LinkedIn Connection Request",
    category: "Social",
    subject: "(Connection message)",
    body: `Hi [First Name] — I work with [type of company] on [topic]. Your background at [Company] caught my eye. Would love to connect.`,
  },
  {
    id: "call-opener",
    name: "Discovery Call Opener",
    category: "Call Script",
    subject: "Opening 60 seconds",
    body: `"Thanks for making time, [Name]. My goal for today is just to understand what's going on at [Company] — I promise I won't pitch you anything unless it's a clear fit.

Quick agenda: I'll ask a few questions about [topic], share what we do in 2 minutes, and then you decide if there's a reason to keep talking. Sound fair?"`,
  },
  {
    id: "objection-price",
    name: "Objection: Too Expensive",
    category: "Objection Handling",
    subject: "Price objection",
    body: `"I hear you — budget is always a real constraint. Can I ask: what would it need to deliver for it to be worth the investment?

If we can quantify the value, it usually becomes a math problem, not a price problem. What outcome are you actually trying to get?"`,
  },
  {
    id: "proposal-close",
    name: "Proposal / Closing Email",
    category: "Email",
    subject: "Your [Product] Proposal — [Company]",
    body: `Hi [First Name],

As discussed, here's a summary of what we're proposing:

WHAT WE'LL DELIVER:
• [Deliverable 1]
• [Deliverable 2]
• [Deliverable 3]

INVESTMENT: $[Amount] / [period]

WHAT HAPPENS NEXT:
1. You confirm by [date]
2. We send the agreement
3. Kickoff call within 48 hours

Any final questions before we move forward?

[Your name]`,
  },
];

const CRM_PIPELINE: { stage: string; color: string; deals: { name: string; value: string; days: number }[] }[] = [
  {
    stage: "Prospecting",
    color: "#64748b",
    deals: [
      { name: "Acme Corp", value: "$12,000", days: 2 },
      { name: "TechStart Inc", value: "$8,500", days: 5 },
    ],
  },
  {
    stage: "Discovery",
    color: "#6366f1",
    deals: [
      { name: "BuildFast Co", value: "$24,000", days: 8 },
      { name: "Nova Labs", value: "$6,000", days: 3 },
    ],
  },
  {
    stage: "Proposal",
    color: "#f59e0b",
    deals: [
      { name: "Synapse AI", value: "$40,000", days: 14 },
    ],
  },
  {
    stage: "Negotiation",
    color: "#8b5cf6",
    deals: [
      { name: "CreatorOS", value: "$18,000", days: 21 },
    ],
  },
  {
    stage: "Won",
    color: "#10b981",
    deals: [
      { name: "Orbits Media", value: "$15,000", days: 0 },
    ],
  },
];

export function SalesModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("Templates");
  const [selectedTemplate, setSelectedTemplate] = useState(OUTREACH_TEMPLATES[0]);
  const [copyLabel, setCopyLabel] = useState("Copy");

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${selectedTemplate.subject}\n\n${selectedTemplate.body}`);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy"), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="📈" title="Sales Module"
        sub={`Outreach templates, pipeline, scripts, and training tools for ${projectName}.`} />
      <SafetyBanner label="This module provides educational sales frameworks and internal planning tools only." />
      <TabBar tabs={["Templates", "Pipeline", "Training"]} active={tab} onChange={setTab} />

      {tab === "Templates" && (
        <div className="grid grid-cols-2 gap-4">
          {/* Template list */}
          <div className="flex flex-col gap-2">
            {OUTREACH_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setSelectedTemplate(t)}
                className="flex flex-col text-left px-3.5 py-3 rounded-xl transition-all"
                style={{
                  background: selectedTemplate.id === t.id ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedTemplate.id === t.id ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)"}`,
                }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold text-white truncate">{t.name}</span>
                </div>
                <Pill label={t.category} color={
                  t.category === "Email" ? "#6366f1" :
                  t.category === "Call Script" ? "#10b981" :
                  t.category === "Objection Handling" ? "#f59e0b" : "#8b5cf6"
                } />
              </button>
            ))}
          </div>
          {/* Template preview */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[12px] font-bold text-white">{selectedTemplate.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>Subject: {selectedTemplate.subject}</p>
              </div>
              <button onClick={handleCopy}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.30)" }}>
                {copyLabel}
              </button>
            </div>
            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap"
              style={{ color: "#94a3b8", fontFamily: "inherit" }}>
              {selectedTemplate.body}
            </pre>
          </Card>
        </div>
      )}

      {tab === "Pipeline" && (
        <div>
          <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>
            Internal CRM pipeline view — mock data for planning and training purposes only.
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {CRM_PIPELINE.map(col => (
              <div key={col.stage} className="flex-shrink-0 w-48">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} />
                  <span className="text-[11px] font-bold" style={{ color: col.color }}>{col.stage}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto"
                    style={{ background: `${col.color}18`, color: col.color }}>{col.deals.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {col.deals.map(d => (
                    <div key={d.name} className="rounded-xl p-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <p className="text-[11px] font-semibold text-white mb-1">{d.name}</p>
                      <p className="text-[10px]" style={{ color: col.color }}>{d.value}</p>
                      {d.days > 0 && (
                        <p className="text-[9px] mt-1" style={{ color: "#475569" }}>{d.days}d in stage</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Training" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: "🎯", title: "Discovery Question Bank", desc: "100 questions to uncover pain, budget, timeline, and decision process.", prompts: ["What's the cost of not solving this?", "Who else is affected by this problem?", "What have you tried before?", "What does success look like in 90 days?"] },
            { icon: "🥊", title: "Objection Roleplay", desc: "Common objections with scripted responses for practice.", prompts: ["We already have a solution", "Not the right time", "Need to talk to my team", "Send me more information"] },
            { icon: "🧠", title: "Value Framing", desc: "How to articulate ROI and connect your solution to business outcomes.", prompts: ["Lead with problem, not product", "Quantify the pain before the gain", "Feature → Benefit → Impact chain", "3-number ROI formula"] },
            { icon: "📊", title: "Pipeline Hygiene", desc: "Patterns for keeping your pipeline clean and deals moving.", prompts: ["Next step should always be scheduled", "If no meeting, no deal", "Deal age warning: 30/60/90 days", "Qualification criteria checklist"] },
          ].map(card => (
            <Card key={card.title}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{card.icon}</span>
                <p className="text-[12px] font-bold text-white">{card.title}</p>
              </div>
              <p className="text-[10px] mb-3" style={{ color: "#64748b" }}>{card.desc}</p>
              <div className="flex flex-col gap-1.5">
                {card.prompts.map(p => (
                  <div key={p} className="text-[10px] px-2.5 py-1.5 rounded-lg"
                    style={{ background: "rgba(99,102,241,0.08)", color: "#94a3b8", border: "1px solid rgba(99,102,241,0.12)" }}>
                    {p}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. OPERATIONS MODULE
// ══════════════════════════════════════════════════════════════════════════════

const SOP_TEMPLATES = [
  {
    id: "onboarding-sop",
    name: "New Employee Onboarding",
    category: "HR",
    steps: [
      "Send welcome email with first-day logistics (Day -3)",
      "Prepare workstation, accounts, and access credentials (Day -1)",
      "Introduction to team + culture walkthrough (Day 1, 9am)",
      "Role-specific training schedule (Days 1–5)",
      "30-day check-in meeting with manager",
      "60-day feedback session",
      "90-day performance alignment",
    ],
  },
  {
    id: "release-sop",
    name: "Product Release Checklist",
    category: "Engineering",
    steps: [
      "Feature freeze — no new code merged",
      "QA regression suite run and all criticals resolved",
      "Release notes drafted and reviewed",
      "Staging environment final validation",
      "Customer communications prepared",
      "Rollback plan documented and tested",
      "Release window confirmed with stakeholders",
      "Deploy to production",
      "Post-deploy monitoring for 2 hours",
      "Incident response team on standby",
    ],
  },
  {
    id: "support-escalation",
    name: "Support Escalation Process",
    category: "Support",
    steps: [
      "Tier 1 attempts resolution within 30 minutes",
      "If unresolved, classify severity (P1/P2/P3)",
      "P1: Escalate to on-call engineer immediately",
      "P2: Escalate to product lead within 2 hours",
      "P3: Log in backlog, respond within 24 hours",
      "Customer notified at each stage transition",
      "Root cause documented after resolution",
    ],
  },
  {
    id: "content-workflow",
    name: "Content Production Workflow",
    category: "Marketing",
    steps: [
      "Ideation — topic selected from content calendar",
      "Brief created (audience, goal, format, keywords)",
      "First draft written",
      "Internal review (accuracy + brand voice)",
      "Edit and revise",
      "Design assets created (cover, social cards)",
      "SEO review and metadata added",
      "Schedule and publish",
      "Distribute across channels",
      "Performance tracked at 7 and 30 days",
    ],
  },
];

export function OpsModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("SOPs");
  const [selectedSop, setSelectedSop] = useState(SOP_TEMPLATES[0]);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (i: number) =>
    setCheckedSteps(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const AUTOMATION_IDEAS = [
    { icon: "📧", title: "Onboarding Email Sequence", trigger: "New user signs up", action: "Send 5-email sequence over 14 days" },
    { icon: "📊", title: "Weekly Metrics Digest", trigger: "Every Monday 8am", action: "Compile key metrics and email to team" },
    { icon: "🔔", title: "Stale Deal Alert", trigger: "Deal inactive for 14 days", action: "Notify owner and log reminder task" },
    { icon: "📝", title: "Post-Call Summary", trigger: "Sales call ends", action: "AI summarizes notes and updates CRM" },
    { icon: "✅", title: "Release Checklist Auto-Start", trigger: "PR merged to main", action: "Create release checklist task set" },
    { icon: "🎯", title: "Support SLA Monitor", trigger: "Ticket open for 24h", action: "Escalate and alert on-call lead" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="⚙️" title="Operations Module"
        sub={`SOPs, checklists, workflows, and automation suggestions for ${projectName}.`} />
      <SafetyBanner label="All workflows and SOPs here are internal planning templates only." />
      <TabBar tabs={["SOPs", "Automations", "Tracker"]} active={tab} onChange={tab => { setTab(tab); setCheckedSteps(new Set()); }} />

      {tab === "SOPs" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            {SOP_TEMPLATES.map(s => (
              <button key={s.id} onClick={() => { setSelectedSop(s); setCheckedSteps(new Set()); }}
                className="flex flex-col text-left px-3.5 py-3 rounded-xl transition-all"
                style={{
                  background: selectedSop.id === s.id ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedSop.id === s.id ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)"}`,
                }}>
                <p className="text-[11px] font-semibold text-white mb-1">{s.name}</p>
                <Pill label={s.category} color="#10b981" />
              </button>
            ))}
          </div>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-bold text-white">{selectedSop.name}</p>
              <span className="text-[9px]" style={{ color: "#475569" }}>
                {checkedSteps.size}/{selectedSop.steps.length} done
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(checkedSteps.size / selectedSop.steps.length) * 100}%`, background: "#10b981" }} />
            </div>
            <div className="flex flex-col gap-2">
              {selectedSop.steps.map((step, i) => (
                <button key={i} onClick={() => toggleStep(i)}
                  className="flex items-start gap-2.5 text-left transition-all"
                  style={{ opacity: checkedSteps.has(i) ? 0.55 : 1 }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: checkedSteps.has(i) ? "#10b981" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${checkedSteps.has(i) ? "#10b981" : "rgba(255,255,255,0.15)"}`,
                    }}>
                    {checkedSteps.has(i) && <span className="text-[8px] text-white font-bold">✓</span>}
                  </div>
                  <span className="text-[11px] leading-relaxed"
                    style={{ color: checkedSteps.has(i) ? "#475569" : "#94a3b8", textDecoration: checkedSteps.has(i) ? "line-through" : "none" }}>
                    {step}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "Automations" && (
        <div>
          <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>
            Automation blueprint library — identify repetitive patterns and design the logic before building.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {AUTOMATION_IDEAS.map(a => (
              <Card key={a.title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{a.icon}</span>
                  <p className="text-[12px] font-bold text-white">{a.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg px-2.5 py-2" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                    <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: "#818cf8" }}>Trigger</p>
                    <p style={{ color: "#94a3b8" }}>{a.trigger}</p>
                  </div>
                  <div className="rounded-lg px-2.5 py-2" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: "#34d399" }}>Action</p>
                    <p style={{ color: "#94a3b8" }}>{a.action}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "Tracker" && (
        <div>
          <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>
            Operational health overview — key process metrics at a glance.
          </p>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "SOPs Documented", value: "4", color: "#6366f1" },
              { label: "Active Checklists", value: "2", color: "#10b981" },
              { label: "Automations Mapped", value: "6", color: "#f59e0b" },
              { label: "Ops Coverage", value: "74%", color: "#8b5cf6" },
            ].map(m => (
              <div key={m.label} className="rounded-2xl p-4 text-center"
                style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
                <p className="text-[22px] font-bold mb-1" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[10px]" style={{ color: "#64748b" }}>{m.label}</p>
              </div>
            ))}
          </div>
          <Card>
            <p className="text-[11px] font-bold text-white mb-3">Recent Activity</p>
            {[
              { label: "Product Release Checklist started", time: "2h ago", color: "#6366f1" },
              { label: "Support Escalation SOP reviewed", time: "Yesterday", color: "#10b981" },
              { label: "Onboarding workflow updated", time: "3d ago", color: "#f59e0b" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <p className="text-[11px] flex-1" style={{ color: "#94a3b8" }}>{item.label}</p>
                <p className="text-[9px]" style={{ color: "#334155" }}>{item.time}</p>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. SUPPORT MODULE
// ══════════════════════════════════════════════════════════════════════════════

const KB_ARTICLES = [
  { id: "getting-started", title: "Getting Started Guide", category: "Onboarding", reads: 142, content: `GETTING STARTED GUIDE\n\nStep 1: Create your account and verify your email.\nStep 2: Set up your profile and preferences.\nStep 3: Create your first project — choose a type and name it.\nStep 4: Your workspace will be scaffolded with industry-standard documents.\nStep 5: Open the AI agent and ask it to walk you through your workspace.\nStep 6: Start filling in or generating content for your documents.\n\nTips:\n• Use the AI agent for any document you're stuck on.\n• The folder system mirrors a professional workflow — follow it.\n• Save frequently; your work is auto-saved when you click outside the editor.` },
  { id: "ai-agent", title: "Using the AI Project Agent", category: "Features", reads: 98, content: `USING THE PROJECT AI AGENT\n\nThe Project Agent knows everything inside your project.\nIt specializes in your project type (film, startup, app, etc.).\n\nHow to get the best results:\n• Be specific: "Write the full logline for my film" not "help me with the logline"\n• Ask for complete content: "Generate the full executive summary"\n• Use it for feedback: "What's missing from this document?"\n• Use it for planning: "What should I work on next?"\n\nThe agent does NOT:\n• Have access to other projects\n• Browse the internet\n• Store anything outside your project` },
  { id: "publish", title: "Publishing a Project", category: "Features", reads: 74, content: `PUBLISHING A PROJECT\n\nPublishing is optional and requires your explicit action.\n\nSteps:\n1. Open the project workspace\n2. Click the "Publish" button in the header\n3. Review the publishing checklist\n4. Confirm the billing check\n5. Confirm publish\n6. Your project URL will be displayed\n\nImportant:\n• Only you can publish your project — it does not happen automatically\n• You can unpublish at any time from the same button\n• Published projects are visible to anyone with the URL\n• Unpublishing reverts the project to private immediately` },
  { id: "file-types", title: "Supported File Types", category: "Reference", reads: 55, content: `SUPPORTED FILE TYPES\n\nDocument (.txt, written content)\nSpreadsheet (structured data tables)\nPresentation (slide outlines)\nImage (reference, mood boards)\nVideo (links to hosted video)\nAudio (reference clips)\n\nAll files live inside your project's folder structure.\nYou can create files from the + Add File button.\nThe AI agent can generate content for Document-type files.` },
];

const FLOW_STEPS: Record<string, string[]> = {
  "Can't log in": ["Clear your browser cache and cookies", "Try a different browser", "Check if Caps Lock is on", "Use 'Forgot password' to reset", "Check your email for a verification link if new account", "Contact support if none of these work"],
  "AI not responding": ["Check your internet connection", "Refresh the page and try again", "Ensure you're inside a project workspace (AI requires an active project)", "Try a shorter message first", "If streaming stops mid-response, click the send button again", "Clear your project chat history and try fresh"],
  "Files not saving": ["Click somewhere outside the editor to trigger auto-save", "Look for the 'Saved' confirmation in the file header", "If editing, click the explicit Save button", "Check your internet connection", "Refresh and check if your content is preserved (it usually is)"],
  "Project not loading": ["Refresh the page", "Check if the project appears in the sidebar", "Click the project name in the sidebar to reopen it", "Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)", "If still missing, contact support — your data is safe"],
};

export function SupportModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("Knowledge Base");
  const [selectedArticle, setSelectedArticle] = useState(KB_ARTICLES[0]);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (i: number) =>
    setCompletedSteps(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="🎧" title="Support Module"
        sub={`Knowledge base, guided troubleshooting, and ticket flows for ${projectName}.`} />
      <TabBar tabs={["Knowledge Base", "Troubleshoot", "Tickets"]} active={tab} onChange={t => { setTab(t); setSelectedIssue(null); setCompletedSteps(new Set()); }} />

      {tab === "Knowledge Base" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            {KB_ARTICLES.map(a => (
              <button key={a.id} onClick={() => setSelectedArticle(a)}
                className="flex flex-col text-left px-3.5 py-3 rounded-xl transition-all"
                style={{
                  background: selectedArticle.id === a.id ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedArticle.id === a.id ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)"}`,
                }}>
                <p className="text-[11px] font-semibold text-white mb-1">{a.title}</p>
                <div className="flex items-center gap-2">
                  <Pill label={a.category} color="#6366f1" />
                  <span className="text-[9px]" style={{ color: "#334155" }}>{a.reads} reads</span>
                </div>
              </button>
            ))}
          </div>
          <Card>
            <p className="text-[12px] font-bold text-white mb-3">{selectedArticle.title}</p>
            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8", fontFamily: "inherit" }}>
              {selectedArticle.content}
            </pre>
          </Card>
        </div>
      )}

      {tab === "Troubleshoot" && (
        <div>
          <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>Select an issue and follow the guided steps to resolve it.</p>
          <div className="flex flex-col gap-2 mb-5">
            {Object.keys(FLOW_STEPS).map(issue => (
              <button key={issue} onClick={() => { setSelectedIssue(issue); setCompletedSteps(new Set()); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background: selectedIssue === issue ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedIssue === issue ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)"}`,
                }}>
                <span className="text-base">🔍</span>
                <span className="text-[12px] font-medium text-white">{issue}</span>
              </button>
            ))}
          </div>
          {selectedIssue && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-bold text-white">{selectedIssue}</p>
                <span className="text-[9px]" style={{ color: "#475569" }}>{completedSteps.size}/{FLOW_STEPS[selectedIssue].length} steps</span>
              </div>
              <div className="flex flex-col gap-2">
                {FLOW_STEPS[selectedIssue].map((step, i) => (
                  <button key={i} onClick={() => toggleStep(i)}
                    className="flex items-start gap-2.5 text-left"
                    style={{ opacity: completedSteps.has(i) ? 0.5 : 1 }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: completedSteps.has(i) ? "#10b981" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${completedSteps.has(i) ? "#10b981" : "rgba(255,255,255,0.15)"}`,
                      }}>
                      {completedSteps.has(i) && <span className="text-[8px] text-white font-bold">✓</span>}
                    </div>
                    <span className="text-[11px] leading-relaxed" style={{ color: completedSteps.has(i) ? "#475569" : "#94a3b8" }}>
                      {step}
                    </span>
                  </button>
                ))}
              </div>
              {completedSteps.size === FLOW_STEPS[selectedIssue].length && (
                <div className="mt-4 px-3 py-2.5 rounded-xl text-center"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.20)" }}>
                  <p className="text-[11px] font-semibold" style={{ color: "#34d399" }}>All steps completed ✓</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#475569" }}>Issue resolved? If not, submit a support ticket below.</p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {tab === "Tickets" && (
        <div>
          <SafetyBanner label="Ticket system is an internal planning tool." />
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Open", value: "3", color: "#f59e0b" },
              { label: "In Progress", value: "1", color: "#6366f1" },
              { label: "Resolved", value: "12", color: "#10b981" },
            ].map(m => (
              <div key={m.label} className="rounded-2xl p-4 text-center"
                style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
                <p className="text-[22px] font-bold mb-1" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[10px]" style={{ color: "#64748b" }}>{m.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: "TKT-004", title: "AI agent stops mid-response on long replies", priority: "P2", status: "In Progress", age: "2h" },
              { id: "TKT-005", title: "Can't export file to PDF", priority: "P3", status: "Open", age: "1d" },
              { id: "TKT-006", title: "Team member invite not received", priority: "P3", status: "Open", age: "3d" },
              { id: "TKT-007", title: "Mobile layout breaks on iPad Mini", priority: "P3", status: "Open", age: "5d" },
            ].map(t => (
              <div key={t.id} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "#475569" }}>{t.id}</span>
                <p className="text-[11px] text-white flex-1 truncate">{t.title}</p>
                <Pill label={t.priority} color={t.priority === "P2" ? "#f59e0b" : "#64748b"} />
                <Pill label={t.status} color={t.status === "In Progress" ? "#6366f1" : "#f59e0b"} />
                <span className="text-[9px] flex-shrink-0" style={{ color: "#334155" }}>{t.age}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. COMPLIANCE READINESS MODULE
// ══════════════════════════════════════════════════════════════════════════════

const COMPLIANCE_FRAMEWORKS = [
  {
    id: "hipaa",
    name: "HIPAA Readiness",
    badge: "NOT CERTIFIED — Readiness Template Only",
    badgeColor: "#f59e0b",
    icon: "🏥",
    disclaimer: "This is an educational readiness checklist only. It does NOT constitute real HIPAA compliance, certification, or legal advice. Do not use this with real patient data until formally certified by a qualified compliance officer.",
    categories: [
      {
        name: "Administrative Safeguards",
        items: [
          { label: "Designated Security Officer appointed", done: false },
          { label: "Risk Analysis conducted and documented", done: false },
          { label: "Workforce training program in place", done: false },
          { label: "Access management procedures documented", done: false },
          { label: "Incident response plan written", done: false },
          { label: "Business Associate Agreements (BAAs) in place", done: false },
        ],
      },
      {
        name: "Physical Safeguards",
        items: [
          { label: "Facility access controls documented", done: false },
          { label: "Workstation use policies in place", done: false },
          { label: "Device and media controls documented", done: false },
        ],
      },
      {
        name: "Technical Safeguards",
        items: [
          { label: "Unique user identification implemented", done: false },
          { label: "Automatic logoff after inactivity configured", done: false },
          { label: "Audit controls implemented and logging enabled", done: false },
          { label: "Data in transit encrypted (TLS 1.2+)", done: false },
          { label: "Data at rest encrypted", done: false },
        ],
      },
    ],
  },
  {
    id: "soc2",
    name: "SOC 2 Readiness",
    badge: "NOT CERTIFIED — Readiness Template Only",
    badgeColor: "#6366f1",
    icon: "🔒",
    disclaimer: "This is an educational readiness checklist only. It does NOT constitute real SOC 2 certification. SOC 2 certification requires a formal audit by an accredited CPA firm. Do not claim SOC 2 compliance based on this checklist.",
    categories: [
      {
        name: "Security (CC6)",
        items: [
          { label: "Logical access controls implemented", done: false },
          { label: "Multi-factor authentication enforced", done: false },
          { label: "Vulnerability management program in place", done: false },
          { label: "Penetration testing conducted", done: false },
          { label: "Security monitoring and alerting configured", done: false },
        ],
      },
      {
        name: "Availability (A1)",
        items: [
          { label: "SLA targets defined and monitored", done: false },
          { label: "Incident response plan documented", done: false },
          { label: "Business continuity plan in place", done: false },
          { label: "Disaster recovery tested", done: false },
        ],
      },
      {
        name: "Confidentiality (C1)",
        items: [
          { label: "Data classification policy documented", done: false },
          { label: "Confidential data handling procedures in place", done: false },
          { label: "Data retention and disposal policy written", done: false },
        ],
      },
    ],
  },
  {
    id: "gdpr",
    name: "GDPR Readiness",
    badge: "NOT LEGAL ADVICE — Readiness Template Only",
    badgeColor: "#8b5cf6",
    icon: "🇪🇺",
    disclaimer: "This is an educational readiness checklist only. It does NOT constitute legal advice or GDPR compliance certification. Consult a qualified EU data protection attorney before processing EU personal data.",
    categories: [
      {
        name: "Data Governance",
        items: [
          { label: "Data Protection Officer (DPO) identified or appointed", done: false },
          { label: "Records of Processing Activities (RoPA) maintained", done: false },
          { label: "Lawful basis for each data processing activity documented", done: false },
          { label: "Privacy policy updated and accessible", done: false },
        ],
      },
      {
        name: "Data Subject Rights",
        items: [
          { label: "Process for handling subject access requests (SARs) in place", done: false },
          { label: "Right to erasure (right to be forgotten) workflow documented", done: false },
          { label: "Data portability mechanism implemented", done: false },
        ],
      },
      {
        name: "Breach Response",
        items: [
          { label: "72-hour breach notification process documented", done: false },
          { label: "Internal breach log maintained", done: false },
          { label: "DPA notification template prepared", done: false },
        ],
      },
    ],
  },
];

export function ComplianceModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("HIPAA Readiness");
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>(
    Object.fromEntries(COMPLIANCE_FRAMEWORKS.map(f => [f.id, new Set<string>()]))
  );

  const activeFramework = COMPLIANCE_FRAMEWORKS.find(f => f.name === tab) ?? COMPLIANCE_FRAMEWORKS[0];

  const toggleItem = (fwId: string, key: string) => {
    setCheckedItems(prev => {
      const n = { ...prev };
      const s = new Set(n[fwId]);
      s.has(key) ? s.delete(key) : s.add(key);
      n[fwId] = s;
      return n;
    });
  };

  const totalItems = activeFramework.categories.reduce((a, c) => a + c.items.length, 0);
  const doneItems = checkedItems[activeFramework.id]?.size ?? 0;
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="📋" title="Compliance Readiness"
        sub={`Draft readiness checklists for ${projectName}. Educational templates only — not legal or regulatory advice.`} />
      <div className="mb-4 px-4 py-3 rounded-xl"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
        <p className="text-[11px] font-bold mb-1" style={{ color: "#f87171" }}>⛔ Restricted — Educational Use Only</p>
        <p className="text-[10px] leading-relaxed" style={{ color: "#78716c" }}>
          None of the content in this module constitutes legal, regulatory, or compliance advice.
          These are educational readiness templates designed to help you understand what real compliance involves.
          Do not use these checklists as a substitute for formal audits, legal counsel, or certified compliance programs.
          All regulated functionality remains restricted until legally authorized.
        </p>
      </div>
      <TabBar tabs={COMPLIANCE_FRAMEWORKS.map(f => f.name)} active={tab} onChange={setTab} />

      {/* Framework disclaimer */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
        style={{ background: `${activeFramework.badgeColor}10`, border: `1px solid ${activeFramework.badgeColor}25` }}>
        <span className="text-base">{activeFramework.icon}</span>
        <div className="flex-1">
          <p className="text-[10px] font-bold" style={{ color: activeFramework.badgeColor }}>{activeFramework.badge}</p>
          <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: "#78716c" }}>{activeFramework.disclaimer}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: activeFramework.badgeColor }} />
        </div>
        <span className="text-[11px] font-bold flex-shrink-0" style={{ color: activeFramework.badgeColor }}>
          {doneItems}/{totalItems} ({pct}%)
        </span>
      </div>

      {/* Categories + items */}
      <div className="flex flex-col gap-5">
        {activeFramework.categories.map(cat => (
          <div key={cat.name}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#475569" }}>{cat.name}</p>
            <div className="flex flex-col gap-1.5">
              {cat.items.map((item, i) => {
                const key = `${cat.name}:${i}`;
                const done = checkedItems[activeFramework.id]?.has(key);
                return (
                  <button key={key} onClick={() => toggleItem(activeFramework.id, key)}
                    className="flex items-start gap-2.5 text-left px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: done ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${done ? "rgba(16,185,129,0.20)" : "rgba(255,255,255,0.07)"}`,
                      opacity: done ? 0.75 : 1,
                    }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: done ? "#10b981" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${done ? "#10b981" : "rgba(255,255,255,0.15)"}`,
                      }}>
                      {done && <span className="text-[8px] text-white font-bold">✓</span>}
                    </div>
                    <span className="text-[11px] leading-relaxed"
                      style={{ color: done ? "#475569" : "#94a3b8", textDecoration: done ? "line-through" : "none" }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. ENTERPRISE DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

export function EnterpriseDashboard({ projectCount, fileCount, projectName }: {
  projectCount: number;
  fileCount: number;
  projectName: string;
}) {
  const EVENTS = [
    { type: "project.created", msg: "New project scaffolded", time: "just now", color: "#6366f1" },
    { type: "file.generated", msg: "AI generated document content", time: "2m ago", color: "#10b981" },
    { type: "publish.attempted", msg: "Billing check triggered", time: "15m ago", color: "#f59e0b" },
    { type: "member.added", msg: "Team member invited", time: "1h ago", color: "#8b5cf6" },
    { type: "file.saved", msg: "File content updated", time: "2h ago", color: "#0ea5e9" },
    { type: "chat.completed", msg: "Project agent interaction logged", time: "3h ago", color: "#34d399" },
  ];

  const METRICS = [
    { label: "Active Projects", value: String(projectCount), color: "#6366f1", icon: "📂" },
    { label: "Total Documents", value: String(fileCount), color: "#10b981", icon: "📄" },
    { label: "AI Interactions", value: "∞", color: "#8b5cf6", icon: "🤖" },
    { label: "System Health", value: "100%", color: "#10b981", icon: "✅" },
  ];

  const JOBS = [
    { name: "scaffold-engine", status: "idle", last: "2m ago" },
    { name: "ai-stream-gateway", status: "active", last: "now" },
    { name: "context-store-sync", status: "active", last: "now" },
    { name: "publish-pipeline", status: "idle", last: "15m ago" },
    { name: "file-content-save", status: "idle", last: "2h ago" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="🏢" title="Enterprise Dashboard"
        sub={`Internal system overview for ${projectName}. All metrics are session-local. Future-ready for real-time data.`} />
      <SafetyBanner label="This dashboard is an internal monitoring view only. All data is local/session-scoped." />

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {METRICS.map(m => (
          <div key={m.label} className="rounded-2xl p-4"
            style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{m.icon}</span>
              <p className="text-[10px]" style={{ color: m.color }}>{m.label}</p>
            </div>
            <p className="text-[24px] font-bold" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Internal Event Stream */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-white">Internal Event Stream</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: "pulse 2s infinite" }} />
              <span className="text-[9px]" style={{ color: "#34d399" }}>Live</span>
            </div>
          </div>
          <div className="flex flex-col gap-0">
            {EVENTS.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2"
                style={{ borderBottom: i < EVENTS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-mono" style={{ color: "#475569" }}>{e.type}</p>
                  <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>{e.msg}</p>
                </div>
                <span className="text-[9px] flex-shrink-0" style={{ color: "#334155" }}>{e.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Internal Jobs */}
        <Card>
          <p className="text-[12px] font-bold text-white mb-3">Internal Job Registry</p>
          <div className="flex flex-col gap-2">
            {JOBS.map(j => (
              <div key={j.name} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: j.status === "active" ? "#10b981" : "#334155" }} />
                <p className="text-[11px] flex-1 font-mono" style={{ color: "#94a3b8" }}>{j.name}</p>
                <span className="text-[9px]" style={{ color: j.status === "active" ? "#34d399" : "#475569" }}>
                  {j.status === "active" ? "running" : `idle · ${j.last}`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)" }}>
            <p className="text-[10px]" style={{ color: "#64748b" }}>
              ℹ️ Jobs are architected for future real-time activation. Currently session-scoped and restricted from external dispatch.
            </p>
          </div>
        </Card>
      </div>

      {/* Reliability patterns (future-ready) */}
      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>
          Enterprise Reliability Patterns (Future-Ready)
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: "🔄", name: "Redundancy", status: "Architected", color: "#475569" },
            { icon: "📊", name: "Monitoring", status: "Session-local", color: "#6366f1" },
            { icon: "⚡", name: "Event Bus", status: "Architected", color: "#475569" },
            { icon: "🛡️", name: "Circuit Breaker", status: "Architected", color: "#475569" },
          ].map(p => (
            <div key={p.name} className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-xl">{p.icon}</span>
              <p className="text-[10px] font-semibold text-white mt-1 mb-0.5">{p.name}</p>
              <p className="text-[9px]" style={{ color: p.color }}>{p.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. STRATEGY MODULE
// ══════════════════════════════════════════════════════════════════════════════

const STRATEGY_FRAMEWORKS = [
  {
    id: "swot",
    name: "SWOT Analysis",
    icon: "🎯",
    description: "Map Strengths, Weaknesses, Opportunities, and Threats to clarify your position.",
    quadrants: [
      { label: "Strengths", color: "#10b981", placeholder: "What do you do better than anyone else?\nWhat unique resources do you have?\nWhat do customers praise you for?" },
      { label: "Weaknesses", color: "#f59e0b", placeholder: "Where do you lose to competitors?\nWhat resources are you missing?\nWhat customer complaints recur?" },
      { label: "Opportunities", color: "#6366f1", placeholder: "What market trends favor you?\nWhat problems are underserved?\nWhere could you expand?" },
      { label: "Threats", color: "#f87171", placeholder: "What are competitors doing?\nWhat regulatory risks exist?\nWhat could make you obsolete?" },
    ],
  },
  {
    id: "roadmap",
    name: "Strategic Roadmap",
    icon: "🗺️",
    description: "Plan your horizon across Now, Next, and Later with clear themes and outcomes.",
    quadrants: [],
  },
  {
    id: "okr",
    name: "OKR Framework",
    icon: "📊",
    description: "Set Objectives and Key Results to align team effort with business outcomes.",
    quadrants: [],
  },
];

const ROADMAP_ROWS = [
  { horizon: "Now (Q1)", color: "#10b981", items: ["Core product stability", "First 100 customers", "Team onboarding SOP"] },
  { horizon: "Next (Q2–Q3)", color: "#6366f1", items: ["Feature set expansion", "Marketing engine live", "Partnership pipeline"] },
  { horizon: "Later (Q4+)", color: "#f59e0b", items: ["Enterprise offering", "Geographic expansion", "Series A readiness"] },
];

const OKR_SAMPLE = [
  {
    objective: "Achieve strong product-market fit",
    color: "#6366f1",
    krs: [
      { label: "NPS score ≥ 50", progress: 60 },
      { label: "Monthly active users: 1,000", progress: 40 },
      { label: "Churn rate < 5%/month", progress: 75 },
    ],
  },
  {
    objective: "Build a repeatable revenue engine",
    color: "#10b981",
    krs: [
      { label: "MRR: $25,000", progress: 30 },
      { label: "CAC payback < 6 months", progress: 55 },
      { label: "3 new partnership deals", progress: 20 },
    ],
  },
];

export function StrategyModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("SWOT Analysis");
  const [swotText, setSwotText] = useState<Record<string, string>>({});

  const swotFw = STRATEGY_FRAMEWORKS[0];

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="🎯" title="Strategy Module"
        sub={`Strategic frameworks, roadmaps, and planning tools for ${projectName}.`} />
      <SafetyBanner label="All strategy frameworks are educational planning templates only — not financial or legal advice." />
      <TabBar tabs={STRATEGY_FRAMEWORKS.map(f => f.name)} active={tab} onChange={setTab} />

      {tab === "SWOT Analysis" && (
        <div>
          <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>
            Fill in each quadrant to map your current strategic position. Save your notes to share with your team.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {swotFw.quadrants.map(q => (
              <div key={q.label} className="rounded-2xl p-4"
                style={{ background: `${q.color}08`, border: `1px solid ${q.color}22` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: q.color }} />
                  <p className="text-[12px] font-bold" style={{ color: q.color }}>{q.label}</p>
                </div>
                <textarea
                  value={swotText[q.label] ?? ""}
                  onChange={e => setSwotText(prev => ({ ...prev, [q.label]: e.target.value }))}
                  placeholder={q.placeholder}
                  rows={5}
                  className="w-full resize-none text-[11px] leading-relaxed rounded-xl px-3 py-2.5 outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#94a3b8",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Strategic Roadmap" && (
        <div>
          <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>
            A horizon-based roadmap helps you sequence work across short, medium, and long-term timeframes.
          </p>
          <div className="flex flex-col gap-3">
            {ROADMAP_ROWS.map(row => (
              <div key={row.horizon} className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
                  <p className="text-[12px] font-bold" style={{ color: row.color }}>{row.horizon}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {row.items.map(item => (
                    <div key={item} className="px-3 py-1.5 rounded-xl text-[11px]"
                      style={{ background: `${row.color}12`, color: "#94a3b8", border: `1px solid ${row.color}25` }}>
                      {item}
                    </div>
                  ))}
                  <button className="px-3 py-1.5 rounded-xl text-[10px]"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#475569", border: "1px dashed rgba(255,255,255,0.12)" }}>
                    + Add item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "OKR Framework" && (
        <div>
          <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>
            Objectives are ambitious qualitative goals. Key Results are measurable outcomes that tell you if you hit the objective.
          </p>
          <div className="flex flex-col gap-4">
            {OKR_SAMPLE.map(okr => (
              <div key={okr.objective} className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🎯</span>
                  <p className="text-[12px] font-bold text-white">{okr.objective}</p>
                </div>
                <div className="flex flex-col gap-3 pl-2">
                  {okr.krs.map(kr => (
                    <div key={kr.label}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px]" style={{ color: "#94a3b8" }}>{kr.label}</p>
                        <span className="text-[10px] font-bold" style={{ color: okr.color }}>{kr.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${kr.progress}%`, background: okr.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. UX / CONTENT MODULE
// ══════════════════════════════════════════════════════════════════════════════

const UX_CHECKLISTS = [
  {
    id: "ux-audit",
    name: "UX Audit Checklist",
    icon: "🔍",
    items: [
      "Can a new user understand what this does in under 10 seconds?",
      "Is the primary action on every screen immediately obvious?",
      "Are error messages human-readable and actionable?",
      "Does the onboarding flow explain value before asking for effort?",
      "Are empty states helpful — do they guide the user to the next step?",
      "Is information hierarchy clear (most important → least important)?",
      "Are all interactive elements large enough for touch (≥ 44px)?",
      "Does the UI work at 150% browser zoom?",
      "Are all form fields labeled (not just placeholder-labeled)?",
      "Does focus order match visual reading order?",
    ],
  },
  {
    id: "content-audit",
    name: "Content Quality Audit",
    icon: "✍️",
    items: [
      "Is every headline benefit-focused, not feature-focused?",
      "Is the reading level appropriate for the target audience (aim for grade 8)?",
      "Are all CTAs specific (not just 'Click here' or 'Learn more')?",
      "Is there consistent terminology throughout (no mixed names for the same thing)?",
      "Is every piece of copy earning its space — could any be cut?",
      "Are there any passive voice constructions that could be made active?",
      "Is the brand voice consistent across all touchpoints?",
      "Are pricing/plan names clear without explanation?",
      "Does every major page have a clear next step?",
      "Is there social proof where it matters most?",
    ],
  },
];

const IMPROVEMENT_SUGGESTIONS = [
  { area: "Navigation", priority: "High", suggestion: "Reduce top-level navigation items to 5 or fewer. Every extra item competes with every other item." },
  { area: "Onboarding", priority: "High", suggestion: "Show value before requesting any setup. The first screen should demonstrate what the user will get, not ask them to fill out a form." },
  { area: "Copywriting", priority: "Medium", suggestion: "Replace feature descriptions with outcome descriptions. 'AI writes your documents' → 'Walk in with an idea, walk out with a complete document.'" },
  { area: "Empty States", priority: "Medium", suggestion: "Every empty state should include an action. 'No projects yet' + a button is 10× better than 'No projects yet' alone." },
  { area: "Error Handling", priority: "Medium", suggestion: "Every error message needs three components: what went wrong, why it happened, what to do now." },
  { area: "Mobile", priority: "High", suggestion: "Test the primary user flow on a phone at arm's length. If it requires precision tapping, it will fail for most users." },
  { area: "Loading States", priority: "Low", suggestion: "Show skeleton screens instead of spinners for content areas. It feels 40% faster even when it isn't." },
  { area: "Accessibility", priority: "Medium", suggestion: "Add visible focus rings that are styled (not the default browser ring). This helps keyboard users without hurting visual design." },
];

export function UXContentModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("UX Audit");
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<number>>>({});

  const toggleItem = (checklistId: string, i: number) => {
    setCheckedItems(prev => {
      const n = { ...prev };
      const s = new Set(n[checklistId] ?? []);
      s.has(i) ? s.delete(i) : s.add(i);
      n[checklistId] = s;
      return n;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="✨" title="UX / Content Module"
        sub={`Review checklists and improvement suggestions for ${projectName}.`} />
      <SafetyBanner label="All UX and content guidance here is educational best-practice only." />
      <TabBar tabs={["UX Audit", "Content Audit", "Improvement Ideas"]} active={tab} onChange={setTab} />

      {(tab === "UX Audit" || tab === "Content Audit") && (() => {
        const cl = UX_CHECKLISTS[tab === "UX Audit" ? 0 : 1];
        const done = checkedItems[cl.id]?.size ?? 0;
        const total = cl.items.length;
        return (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(done / total) * 100}%`, background: "#6366f1" }} />
              </div>
              <span className="text-[11px] font-bold flex-shrink-0" style={{ color: "#818cf8" }}>{done}/{total}</span>
            </div>
            <div className="flex flex-col gap-2">
              {cl.items.map((item, i) => {
                const isDone = checkedItems[cl.id]?.has(i);
                return (
                  <button key={i} onClick={() => toggleItem(cl.id, i)}
                    className="flex items-start gap-2.5 text-left px-3 py-3 rounded-xl transition-all"
                    style={{
                      background: isDone ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isDone ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.07)"}`,
                      opacity: isDone ? 0.65 : 1,
                    }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: isDone ? "#6366f1" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${isDone ? "#6366f1" : "rgba(255,255,255,0.15)"}`,
                      }}>
                      {isDone && <span className="text-[8px] text-white font-bold">✓</span>}
                    </div>
                    <span className="text-[11px] leading-relaxed"
                      style={{ color: isDone ? "#475569" : "#94a3b8", textDecoration: isDone ? "line-through" : "none" }}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {tab === "Improvement Ideas" && (
        <div className="flex flex-col gap-3">
          {IMPROVEMENT_SUGGESTIONS.map(s => (
            <div key={s.area} className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[12px] font-bold text-white">{s.area}</p>
                <Pill label={s.priority}
                  color={s.priority === "High" ? "#f87171" : s.priority === "Medium" ? "#f59e0b" : "#64748b"} />
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "#94a3b8" }}>{s.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. MARKETING MODULE
// ══════════════════════════════════════════════════════════════════════════════

const CONTENT_CALENDAR_WEEK: { day: string; items: { type: string; title: string; channel: string; color: string }[] }[] = [
  { day: "Mon", items: [{ type: "Blog", title: "How to [Topic]", channel: "Website + LinkedIn", color: "#6366f1" }] },
  { day: "Tue", items: [{ type: "Social", title: "Behind the scenes", channel: "Instagram + TikTok", color: "#8b5cf6" }] },
  { day: "Wed", items: [{ type: "Email", title: "Weekly value newsletter", channel: "Email list", color: "#10b981" }] },
  { day: "Thu", items: [{ type: "Video", title: "Tutorial: [Topic]", channel: "YouTube + Shorts", color: "#f59e0b" }] },
  { day: "Fri", items: [{ type: "Podcast", title: "Guest interview drop", channel: "Spotify + Apple", color: "#ef4444" }] },
  { day: "Sat", items: [{ type: "Community", title: "Reddit / Discord engage", channel: "Community", color: "#06b6d4" }] },
  { day: "Sun", items: [{ type: "Plan", title: "Next-week content plan", channel: "Internal", color: "#475569" }] },
];

const BRAND_VOICE_ARCHETYPES = [
  { name: "The Expert", traits: ["Authoritative", "Precise", "Confident"], tone: "We explain complex ideas simply, without dumbing them down.", example: "Here's exactly what the data shows — and what to do about it." },
  { name: "The Friend", traits: ["Warm", "Casual", "Relatable"], tone: "We talk like a knowledgeable friend, not a faceless corporation.", example: "Honestly? Most people get this wrong. Here's what actually works." },
  { name: "The Challenger", traits: ["Bold", "Provocative", "Direct"], tone: "We challenge assumptions and say the thing others won't.", example: "The conventional advice is wrong. Here's the truth." },
  { name: "The Guide", traits: ["Supportive", "Clear", "Patient"], tone: "We lead users step by step without making them feel lost.", example: "You've got this. Let's walk through it together." },
];

const CAMPAIGN_BRIEF = `CAMPAIGN BRIEF — [CAMPAIGN NAME]

OBJECTIVE
Goal: □ Awareness  □ Lead gen  □ Conversion  □ Retention
Target metric: _______________  |  Target value: _______________

TARGET AUDIENCE
Primary persona: _______________
Key pain points: 1. ___ 2. ___ 3. ___

CORE MESSAGE
"For [audience], [product] is the [category] that [differentiator] because [proof]."

MESSAGING PILLARS (3 max)
1. _______________  2. _______________  3. _______________

CHANNELS + TIMELINE
Channel 1: ___  |  Start: ___  |  End: ___
Channel 2: ___  |  Start: ___  |  End: ___

BUDGET
Total: $___  |  Content ___% | Paid ___% | Tools ___%

SUCCESS METRICS
Primary KPI: ___  |  Target: ___
Secondary KPI: ___  |  Target: ___

ASSETS NEEDED
□ Copy / scripts  □ Design  □ Video  □ Landing page
□ Email sequence  □ Ad creatives  □ Social graphics`;

export function MarketingModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("Content Calendar");
  const [selectedArchetype, setSelectedArchetype] = useState(BRAND_VOICE_ARCHETYPES[0]);
  const [briefCopied, setBriefCopied] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="📣" title="Marketing Module"
        sub={`Content calendar, brand voice, and campaign planning for ${projectName}.`} />
      <SafetyBanner label="All marketing frameworks are educational planning templates only." />
      <TabBar tabs={["Content Calendar", "Brand Voice", "Campaign Brief"]} active={tab} onChange={setTab} />

      {tab === "Content Calendar" && (
        <div>
          <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>Weekly content cadence across channels. Adapt each slot to your schedule.</p>
          <div className="grid grid-cols-7 gap-2">
            {CONTENT_CALENDAR_WEEK.map(day => (
              <div key={day.day}>
                <p className="text-[9px] font-bold text-center mb-2" style={{ color: "#475569" }}>{day.day}</p>
                {day.items.map(item => (
                  <div key={item.title} className="rounded-xl p-2"
                    style={{ background: `${item.color}10`, border: `1px solid ${item.color}22` }}>
                    <p className="text-[8px] font-bold mb-0.5" style={{ color: item.color }}>{item.type}</p>
                    <p className="text-[9px] text-white mb-1 leading-snug">{item.title}</p>
                    <p className="text-[7px]" style={{ color: "#475569" }}>{item.channel}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Brand Voice" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            {BRAND_VOICE_ARCHETYPES.map(a => (
              <button key={a.name} onClick={() => setSelectedArchetype(a)}
                className="text-left px-3.5 py-3 rounded-xl transition-all"
                style={{
                  background: selectedArchetype.name === a.name ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedArchetype.name === a.name ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.08)"}`,
                }}>
                <p className="text-[12px] font-bold text-white mb-1.5">{a.name}</p>
                <div className="flex gap-1 flex-wrap">{a.traits.map(t => <Pill key={t} label={t} color="#6366f1" />)}</div>
              </button>
            ))}
          </div>
          <Card>
            <p className="text-[12px] font-bold text-white mb-3">{selectedArchetype.name}</p>
            <div className="mb-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <p className="text-[9px] font-bold mb-1" style={{ color: "#818cf8" }}>Tone principle</p>
              <p className="text-[11px] italic" style={{ color: "#94a3b8" }}>{selectedArchetype.tone}</p>
            </div>
            <div className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <p className="text-[9px] font-bold mb-1" style={{ color: "#34d399" }}>Example line</p>
              <p className="text-[11px] italic" style={{ color: "#94a3b8" }}>"{selectedArchetype.example}"</p>
            </div>
          </Card>
        </div>
      )}

      {tab === "Campaign Brief" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px]" style={{ color: "#64748b" }}>Copy the brief template and fill it in for your campaign.</p>
            <button onClick={() => { navigator.clipboard.writeText(CAMPAIGN_BRIEF); setBriefCopied(true); setTimeout(() => setBriefCopied(false), 2000); }}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.30)" }}>
              {briefCopied ? "Copied!" : "Copy Brief"}
            </button>
          </div>
          <Card><pre className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8", fontFamily: "inherit" }}>{CAMPAIGN_BRIEF}</pre></Card>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. PRODUCT MODULE
// ══════════════════════════════════════════════════════════════════════════════

const RICE_FEATURES = [
  { name: "Onboarding improvements", reach: 80, impact: 3, confidence: 90, effort: 2 },
  { name: "AI export to PDF", reach: 60, impact: 2, confidence: 70, effort: 3 },
  { name: "Mobile responsive pass", reach: 90, impact: 2, confidence: 80, effort: 5 },
  { name: "Real-time collaboration", reach: 40, impact: 3, confidence: 60, effort: 8 },
  { name: "Template marketplace", reach: 55, impact: 2, confidence: 50, effort: 6 },
  { name: "Voice-to-document draft", reach: 35, impact: 3, confidence: 65, effort: 4 },
];

const PRD_TEMPLATE = `PRODUCT REQUIREMENTS DOCUMENT — [FEATURE NAME]
Version: 1.0  |  Author: [Name]  |  Status: □ Draft  □ Review  □ Approved

PROBLEM STATEMENT
What problem are we solving?
Who has this problem?  |  Frequency: ___
Current workaround: ___

GOALS + METRICS
Primary goal: ___  |  Metric: ___  |  Target: ___
Secondary: ___  |  Metric: ___  |  Target: ___

USER STORIES
□ As a [user], I want to [action] so that [outcome].
□ As a [user], I want to [action] so that [outcome].
□ As a [user], I want to [action] so that [outcome].

REQUIREMENTS
MUST HAVE (P0): ___  ___  ___
SHOULD HAVE (P1): ___  ___
NICE TO HAVE (P2): ___
OUT OF SCOPE: ___

OPEN QUESTIONS
□ [Question]  |  Owner: ___  |  Due: ___
□ [Question]  |  Owner: ___  |  Due: ___`;

const PRODUCT_METRICS_MAP = [
  { category: "Acquisition", color: "#6366f1", metrics: ["Signups / week", "CAC", "Traffic → Trial conversion", "Top channel"] },
  { category: "Activation", color: "#8b5cf6", metrics: ["Time to first value", "Onboarding completion %", "Activation milestone %", "Day 1 retention"] },
  { category: "Retention", color: "#10b981", metrics: ["DAU / MAU", "Day 7 retention", "Day 30 retention", "Churn rate/mo"] },
  { category: "Revenue", color: "#f59e0b", metrics: ["MRR / ARR", "ARPU", "LTV", "Expansion MRR"] },
  { category: "Referral", color: "#ef4444", metrics: ["NPS score", "Referral rate", "Organic %", "Community size"] },
];

export function ProductModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("PRD Builder");
  const [prdCopied, setPrdCopied] = useState(false);

  const riceScores = RICE_FEATURES.map(f => ({
    ...f, score: Math.round((f.reach * f.impact * (f.confidence / 100)) / f.effort),
  })).sort((a, b) => b.score - a.score);
  const maxScore = riceScores[0]?.score ?? 1;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="📦" title="Product Module"
        sub={`PRD templates, feature prioritization, and product metrics for ${projectName}.`} />
      <SafetyBanner label="All product frameworks are educational planning templates." />
      <TabBar tabs={["PRD Builder", "RICE Prioritization", "Product Metrics"]} active={tab} onChange={setTab} />

      {tab === "PRD Builder" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px]" style={{ color: "#64748b" }}>Structured PRD template. Copy and fill in for your feature.</p>
            <button onClick={() => { navigator.clipboard.writeText(PRD_TEMPLATE); setPrdCopied(true); setTimeout(() => setPrdCopied(false), 2000); }}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.30)" }}>
              {prdCopied ? "Copied!" : "Copy PRD"}
            </button>
          </div>
          <Card><pre className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8", fontFamily: "inherit" }}>{PRD_TEMPLATE}</pre></Card>
        </div>
      )}

      {tab === "RICE Prioritization" && (
        <div>
          <p className="text-[11px] mb-3" style={{ color: "#64748b" }}>
            RICE = (Reach × Impact × Confidence%) ÷ Effort. Higher = higher priority.
          </p>
          <div className="flex flex-col gap-2">
            {riceScores.map((f, i) => (
              <div key={f.name} className="rounded-xl px-3 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3 mb-1.5">
                  <p className="text-[11px] text-white flex-1">{f.name}</p>
                  <p className="text-[13px] font-bold" style={{ color: i === 0 ? "#10b981" : "#6366f1" }}>{f.score}</p>
                  <Pill label={i === 0 ? "P0" : i <= 2 ? "P1" : "P2"} color={i === 0 ? "#10b981" : i <= 2 ? "#6366f1" : "#475569"} />
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(f.score / maxScore) * 100}%`, background: i === 0 ? "#10b981" : "#6366f1" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Product Metrics" && (
        <div className="flex flex-col gap-4">
          {PRODUCT_METRICS_MAP.map(cat => (
            <div key={cat.category}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                <p className="text-[11px] font-bold" style={{ color: cat.color }}>{cat.category}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {cat.metrics.map(m => (
                  <div key={m} className="px-3 py-2 rounded-xl"
                    style={{ background: `${cat.color}08`, border: `1px solid ${cat.color}18` }}>
                    <p className="text-[11px]" style={{ color: "#94a3b8" }}>{m}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 10. HR / PEOPLE MODULE
// ══════════════════════════════════════════════════════════════════════════════

const JD_TEMPLATE = `JOB DESCRIPTION — [ROLE TITLE]
[Company]  |  [Location / Remote]  |  [Full-time / Contract]
Compensation: $[Range]  |  Equity: [Range]

ABOUT THE ROLE
[2–3 sentences: What does this person do? Why does this role exist? Impact?]

WHAT YOU'LL DO
• [Core responsibility 1]
• [Core responsibility 2]
• [Core responsibility 3]
• [Core responsibility 4]
• [Core responsibility 5]

WHAT WE'RE LOOKING FOR
Must have: [Requirement]  [Requirement]  [Requirement]
Nice to have: [Requirement]  [Requirement]

WHY JOIN US
• [Culture / mission]
• [Growth / learning]
• [Team / product]
• [Compensation / benefits]

HOW TO APPLY
[What to send, where to send it, what you're looking for in applications]`;

const INTERVIEW_SECTIONS_HR = [
  { section: "Role Fit", color: "#6366f1", questions: ["Walk me through your background and why this role?", "Most relevant project — what was your specific contribution?", "What does great work look like in this type of role?", "What would excellent performance look like in 90 days?"] },
  { section: "Problem Solving", color: "#10b981", questions: ["Difficult problem you solved — how did you approach it?", "Competing priorities — how did you decide what to do first?", "Decision made with incomplete information — what happened?", "Time you were wrong — what did you learn?"] },
  { section: "Collaboration", color: "#f59e0b", questions: ["Team environment where you do your best work?", "Time you disagreed with a teammate or manager?", "How do you communicate progress and blockers async?", "Time you helped someone else grow or succeed?"] },
  { section: "Values Fit", color: "#8b5cf6", questions: ["What kind of work energizes you most?", "Something you've learned recently, inside or outside work?", "What does accountability mean to you?", "Questions you have for us?"] },
];

const PLAN_903060_HR = [
  { horizon: "30 Days — Learn", color: "#6366f1", items: ["Meet every team member 1:1", "Shadow key workflows", "Read all internal docs", "Identify top 3 unknowns", "Deliver one small visible win"] },
  { horizon: "60 Days — Contribute", color: "#10b981", items: ["Own first real project", "Propose process improvements", "Establish working rhythm", "Build trust with 3 key collaborators", "Share what you've learned with team"] },
  { horizon: "90 Days — Drive", color: "#f59e0b", items: ["Own a meaningful outcome end-to-end", "Identify the most important thing to fix next quarter", "Present findings to leadership", "Have a clear picture of where to grow", "Initiate something proactively"] },
];

export function HRModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("Job Description");
  const [jdCopied, setJdCopied] = useState(false);
  const [selectedSection, setSelectedSection] = useState(INTERVIEW_SECTIONS_HR[0]);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="🤝" title="HR / People Module"
        sub={`Hiring templates, interview frameworks, and onboarding plans for ${projectName}.`} />
      <SafetyBanner label="All HR frameworks are educational templates. Actual hiring requires qualified HR practice and legal guidance." />
      <TabBar tabs={["Job Description", "Interview Framework", "30/60/90 Plan"]} active={tab} onChange={setTab} />

      {tab === "Job Description" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px]" style={{ color: "#64748b" }}>Structured JD template. Copy and customise for each role.</p>
            <button onClick={() => { navigator.clipboard.writeText(JD_TEMPLATE); setJdCopied(true); setTimeout(() => setJdCopied(false), 2000); }}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.30)" }}>
              {jdCopied ? "Copied!" : "Copy JD"}
            </button>
          </div>
          <Card><pre className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8", fontFamily: "inherit" }}>{JD_TEMPLATE}</pre></Card>
        </div>
      )}

      {tab === "Interview Framework" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            {INTERVIEW_SECTIONS_HR.map(s => (
              <button key={s.section} onClick={() => setSelectedSection(s)}
                className="text-left px-3.5 py-3 rounded-xl transition-all"
                style={{
                  background: selectedSection.section === s.section ? `${s.color}14` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedSection.section === s.section ? `${s.color}35` : "rgba(255,255,255,0.08)"}`,
                }}>
                <p className="text-[12px] font-bold mb-1" style={{ color: s.color }}>{s.section}</p>
                <p className="text-[10px]" style={{ color: "#475569" }}>{s.questions.length} questions</p>
              </button>
            ))}
          </div>
          <Card>
            <p className="text-[12px] font-bold mb-3" style={{ color: selectedSection.color }}>{selectedSection.section}</p>
            <div className="flex flex-col gap-2">
              {selectedSection.questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: `${selectedSection.color}08`, border: `1px solid ${selectedSection.color}15` }}>
                  <span className="text-[9px] font-bold flex-shrink-0 mt-0.5" style={{ color: selectedSection.color }}>Q{i + 1}</span>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#94a3b8" }}>{q}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "30/60/90 Plan" && (
        <div className="flex flex-col gap-4">
          {PLAN_903060_HR.map(phase => (
            <Card key={phase.horizon}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: phase.color }} />
                <p className="text-[12px] font-bold" style={{ color: phase.color }}>{phase.horizon}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {phase.items.map(item => (
                  <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${phase.color}08` }}>
                    <span className="text-[9px] flex-shrink-0" style={{ color: phase.color }}>→</span>
                    <p className="text-[11px]" style={{ color: "#94a3b8" }}>{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 11. FINANCE MODULE (EDUCATIONAL ONLY — NOT FINANCIAL ADVICE)
// ══════════════════════════════════════════════════════════════════════════════

const BUDGET_CATEGORIES_FIN = [
  { name: "Payroll & Contractors", monthly: 18000, color: "#6366f1", icon: "👥" },
  { name: "Software & Tools", monthly: 2400, color: "#8b5cf6", icon: "🛠️" },
  { name: "Marketing & Ads", monthly: 5000, color: "#f59e0b", icon: "📣" },
  { name: "Infrastructure (Cloud)", monthly: 800, color: "#10b981", icon: "☁️" },
  { name: "Office & Operations", monthly: 1200, color: "#06b6d4", icon: "🏢" },
  { name: "Legal & Finance", monthly: 1000, color: "#ef4444", icon: "⚖️" },
  { name: "Research & Development", monthly: 3000, color: "#a78bfa", icon: "🔬" },
  { name: "Travel & Events", monthly: 600, color: "#f97316", icon: "✈️" },
];

const UNIT_ECONOMICS_FIN = [
  { metric: "Customer Acquisition Cost (CAC)", formula: "Total Sales + Marketing ÷ New Customers", example: "$5,000 ÷ 20 customers = $250 CAC", color: "#f59e0b" },
  { metric: "Customer Lifetime Value (LTV)", formula: "Avg Revenue Per User × Avg Lifespan", example: "$50/mo × 24 months = $1,200 LTV", color: "#6366f1" },
  { metric: "LTV : CAC Ratio", formula: "LTV ÷ CAC (healthy target: ≥ 3:1)", example: "$1,200 ÷ $250 = 4.8:1 ✓", color: "#10b981" },
  { metric: "CAC Payback Period", formula: "CAC ÷ Monthly Revenue Per Customer", example: "$250 ÷ $50/mo = 5 months", color: "#8b5cf6" },
  { metric: "Gross Margin", formula: "(Revenue − COGS) ÷ Revenue × 100%", example: "($1,000 − $300) ÷ $1,000 = 70%", color: "#34d399" },
  { metric: "Monthly Burn Rate", formula: "Total Cash Out − Total Cash In", example: "$28,000 out − $10,000 in = $18,000 burn", color: "#f87171" },
];

const FUNDING_CHECKLIST_FIN = [
  { category: "Financials", color: "#6366f1", items: ["12-month P&L statement prepared", "Cash flow statement current", "Balance sheet accurate", "Cap table clean and updated", "Revenue model documented"] },
  { category: "Legal", color: "#f87171", items: ["Incorporation documents in order", "All IP owned by the company", "Employment / contractor agreements in place", "Data privacy policy published", "No undisclosed liabilities"] },
  { category: "Product", color: "#10b981", items: ["Core metrics dashboarded", "Customer testimonials documented", "Product roadmap 12 months out", "Competitive landscape documented", "Technical architecture overview prepared"] },
  { category: "Team", color: "#f59e0b", items: ["Org chart up to date", "Key person risk identified", "Advisor agreements in place", "Equity vesting documented", "Open roles and hiring plan documented"] },
];

export function FinanceModule({ projectName }: { projectName: string }) {
  const [tab, setTab] = useState("Budget Planner");
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<number>>>({});
  const totalMonthly = BUDGET_CATEGORIES_FIN.reduce((a, c) => a + c.monthly, 0);

  const toggleItem = (cat: string, i: number) => setCheckedItems(prev => {
    const n = { ...prev };
    const s = new Set(n[cat] ?? []);
    s.has(i) ? s.delete(i) : s.add(i);
    n[cat] = s;
    return n;
  });

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <SectionHead icon="💰" title="Finance Module"
        sub={`Budget planning, unit economics, and funding readiness for ${projectName}.`} />
      <div className="mb-4 px-4 py-3 rounded-xl"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
        <p className="text-[11px] font-bold mb-1" style={{ color: "#f87171" }}>⛔ Educational Use Only — Not Financial Advice</p>
        <p className="text-[10px] leading-relaxed" style={{ color: "#78716c" }}>
          All numbers, formulas, and templates here are illustrative educational tools only.
          Nothing here constitutes financial advice, accounting, or investment guidance.
          Consult a qualified financial professional before making real decisions.
        </p>
      </div>
      <TabBar tabs={["Budget Planner", "Unit Economics", "Funding Readiness"]} active={tab} onChange={setTab} />

      {tab === "Budget Planner" && (
        <div>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 rounded-2xl px-3.5 py-3" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
              <p className="text-[20px] font-bold" style={{ color: "#818cf8" }}>${totalMonthly.toLocaleString()}</p>
              <p className="text-[10px]" style={{ color: "#475569" }}>Monthly run rate (illustrative)</p>
            </div>
            <div className="flex-1 rounded-2xl px-3.5 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
              <p className="text-[20px] font-bold" style={{ color: "#f87171" }}>${(totalMonthly * 12).toLocaleString()}</p>
              <p className="text-[10px]" style={{ color: "#475569" }}>Annual projection (illustrative)</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {BUDGET_CATEGORIES_FIN.map(cat => {
              const pct = Math.round((cat.monthly / totalMonthly) * 100);
              return (
                <div key={cat.name} className="rounded-xl px-3.5 py-2.5"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{cat.icon}</span>
                    <p className="text-[11px] text-white flex-1">{cat.name}</p>
                    <p className="text-[11px] font-bold" style={{ color: cat.color }}>${cat.monthly.toLocaleString()}</p>
                    <p className="text-[9px] ml-1" style={{ color: "#475569" }}>{pct}%</p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct * 2.5}%`, background: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "Unit Economics" && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px]" style={{ color: "#64748b" }}>Core unit economics every business should understand. Replace examples with your numbers.</p>
          {UNIT_ECONOMICS_FIN.map(u => (
            <div key={u.metric} className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[12px] font-bold mb-2" style={{ color: u.color }}>{u.metric}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg px-2.5 py-2" style={{ background: `${u.color}08`, border: `1px solid ${u.color}18` }}>
                  <p className="text-[8px] font-bold uppercase mb-1" style={{ color: u.color }}>Formula</p>
                  <p style={{ color: "#94a3b8" }}>{u.formula}</p>
                </div>
                <div className="rounded-lg px-2.5 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[8px] font-bold uppercase mb-1" style={{ color: "#475569" }}>Example</p>
                  <p style={{ color: "#64748b" }}>{u.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Funding Readiness" && (
        <div>
          <SafetyBanner label="Internal preparation checklist only — not legal or financial advice." />
          <div className="flex flex-col gap-4">
            {FUNDING_CHECKLIST_FIN.map(cat => {
              const done = checkedItems[cat.category]?.size ?? 0;
              return (
                <Card key={cat.category}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-bold" style={{ color: cat.color }}>{cat.category}</p>
                    <span className="text-[9px]" style={{ color: "#475569" }}>{done}/{cat.items.length}</span>
                  </div>
                  <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(done / cat.items.length) * 100}%`, background: cat.color }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {cat.items.map((item, i) => {
                      const isDone = checkedItems[cat.category]?.has(i);
                      return (
                        <button key={i} onClick={() => toggleItem(cat.category, i)}
                          className="flex items-start gap-2.5 text-left" style={{ opacity: isDone ? 0.55 : 1 }}>
                          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: isDone ? cat.color : "rgba(255,255,255,0.06)", border: `1px solid ${isDone ? cat.color : "rgba(255,255,255,0.15)"}` }}>
                            {isDone && <span className="text-[8px] text-white font-bold">✓</span>}
                          </div>
                          <span className="text-[11px] leading-relaxed"
                            style={{ color: isDone ? "#475569" : "#94a3b8", textDecoration: isDone ? "line-through" : "none" }}>
                            {item}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
