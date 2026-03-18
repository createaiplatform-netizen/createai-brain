import React, { useState } from "react";

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
