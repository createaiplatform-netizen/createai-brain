import React, { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ICP {
  companySize?: string;
  industries?: string[];
  buyerPersonas?: string[];
  geographies?: string[];
  urgencySignals?: string[];
}

interface Signals {
  businessContext?: string;
  icp?: ICP;
  painPoints?: string[];
  valueProposition?: string;
  competitiveAngle?: string;
  keywordTriggers?: string[];
  idealDealSize?: string;
  salesMotion?: string;
  urgency?: string;
  readinessScore?: number;
}

interface Lead {
  id?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  company?: string;
  companySize?: string;
  industry?: string;
  linkedin?: string;
  email?: string;
  location?: string;
  fitScore?: number;
  priority?: string;
  primaryPain?: string;
  triggerEvent?: string;
  estimatedValue?: string;
  approachAngle?: string;
  tags?: string[];
}

interface OutreachItem {
  leadId?: string;
  leadName?: string;
  company?: string;
  subject?: string;
  body?: string;
  followUpDay3?: string;
  followUpDay7?: string;
  channel?: string;
}

interface EngagementTier {
  name?: string;
  price?: string;
  includes?: string[];
}

interface Deliverable {
  type?: string;
  title?: string;
  executiveSummary?: string;
  problemStatement?: string[];
  solutionOverview?: string[];
  differentiators?: string[];
  proofPoints?: string[];
  engagementTiers?: EngagementTier[];
  nextSteps?: string[];
  ctaLine?: string;
}

interface CycleResult {
  cycleId: string;
  input: string;
  signals: Signals;
  leads: Lead[];
  opportunityIds: number[];
  outreach: OutreachItem[];
  deliverable: Deliverable | null;
  meta: {
    leadsGenerated: number;
    oppsCreated: number;
    outreachDrafted: number;
    timestamp: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  { id: 1, icon: "📡", label: "Signal Analysis",   sub: "Extracting ICP, pain points & market signals" },
  { id: 2, icon: "🎯", label: "Lead Identification", sub: "Generating 8 qualified, scored leads"          },
  { id: 3, icon: "💾", label: "Opportunity Sync",  sub: "Saving top leads to your pipeline"             },
  { id: 4, icon: "✉️", label: "Outreach Drafting", sub: "Writing personalized cold emails"              },
  { id: 5, icon: "📋", label: "Deliverable Build", sub: "Creating your proposal one-pager"              },
];

const PRIORITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Critical: { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
  High:     { bg: "#fff7ed", text: "#c2410c", dot: "#f97316" },
  Medium:   { bg: "#fefce8", text: "#92400e", dot: "#f59e0b" },
  Low:      { bg: "#f0fdf4", text: "#166534", dot: "#22c55e" },
};

const EXAMPLE_PROMPTS = [
  "I'm launching a B2B SaaS tool for HR teams that automates onboarding. Target: tech companies 50-500 employees, $200-800/mo per company.",
  "Our agency creates AI-powered video ads for DTC brands. We help brands that spend $10k+/mo on ads cut production costs by 60%.",
  "We built a compliance automation platform for fintech startups navigating SOC2 and ISO 27001. Perfect for Series A+ companies.",
  "I offer fractional CFO services to e-commerce businesses doing $1M-$10M revenue who need financial leadership without full-time cost.",
];

const URGENCY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  high:   { color: "#dc2626", bg: "#fef2f2", label: "High Urgency" },
  medium: { color: "#d97706", bg: "#fffbeb", label: "Medium Urgency" },
  low:    { color: "#16a34a", bg: "#f0fdf4", label: "Low Urgency" },
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function getApiBase() {
  const base = (import.meta as unknown as { env: { BASE_URL?: string } }).env.BASE_URL ?? "/";
  return base.replace(/\/$/, "");
}

function ScoreBadge({ score }: { score?: number }) {
  const s = score ?? 0;
  const color = s >= 80 ? "#16a34a" : s >= 60 ? "#d97706" : "#dc2626";
  const bg    = s >= 80 ? "#f0fdf4"  : s >= 60 ? "#fffbeb"  : "#fef2f2";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20,
      background: bg, border: `1px solid ${color}22`,
    }}>
      <div style={{
        width: 28, height: 4, borderRadius: 2,
        background: `linear-gradient(to right, ${color} ${s}%, rgba(0,0,0,0.08) ${s}%)`,
      }} />
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{s}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        background: copied ? "#f0fdf4" : "rgba(0,0,0,0.04)",
        border: `1px solid ${copied ? "rgba(22,163,74,0.3)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: 6, padding: "3px 8px", cursor: "pointer",
        fontSize: 10, fontWeight: 600, color: copied ? "#16a34a" : "#6b7280",
        transition: "all 0.15s",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StageProgress({ active, complete }: { active: number; complete: boolean }) {
  return (
    <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {STAGES.map((stage, i) => {
          const isDone    = complete || active > stage.id;
          const isCurrent = active === stage.id && !complete;
          const isPending = active < stage.id && !complete;
          return (
            <React.Fragment key={stage.id}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                  background: isDone ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                             : isCurrent ? "#fff"
                             : "rgba(0,0,0,0.04)",
                  border: isCurrent ? "2px solid #6366f1"
                         : isDone ? "none"
                         : "2px solid rgba(0,0,0,0.08)",
                  boxShadow: isCurrent ? "0 0 0 4px rgba(99,102,241,0.12)" : "none",
                  transition: "all 0.3s",
                  color: isDone ? "#fff" : undefined,
                  position: "relative",
                }}>
                  {isDone ? "✓" : isCurrent ? (
                    <span style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "2px solid #6366f1",
                      borderTopColor: "transparent",
                      display: "block",
                      animation: "spin 0.8s linear infinite",
                    }} />
                  ) : stage.icon}
                </div>
                <div style={{ textAlign: "center", minWidth: 0 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
                    color: isDone ? "#6366f1" : isCurrent ? "#0f172a" : "#9ca3af",
                    textTransform: "uppercase",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    maxWidth: 64,
                  }}>{stage.label}</div>
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <div style={{
                  height: 2, flex: 1, borderRadius: 1, marginBottom: 22,
                  background: isDone ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "rgba(0,0,0,0.08)",
                  transition: "background 0.4s",
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {active > 0 && !complete && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {STAGES[active - 1]?.sub ?? "Processing…"}
          </span>
        </div>
      )}
    </div>
  );
}

function SignalCard({ signals }: { signals: Signals }) {
  const urgCfg = URGENCY_CONFIG[signals.urgency ?? "medium"] ?? URGENCY_CONFIG.medium;
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>📡 Signal Profile</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {signals.urgency && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: urgCfg.bg, color: urgCfg.color }}>
              {urgCfg.label}
            </span>
          )}
          {signals.readinessScore !== undefined && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#eef2ff", color: "#4338ca" }}>
              Readiness {signals.readinessScore}/100
            </span>
          )}
          {signals.salesMotion && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#f3f4f6", color: "#374151" }}>
              {signals.salesMotion}
            </span>
          )}
        </div>
      </div>
      {signals.businessContext && (
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 12 }}>{signals.businessContext}</p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {signals.valueProposition && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)", gridColumn: "1/-1" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Value Prop</div>
            <div style={{ fontSize: 12, color: "#374151" }}>{signals.valueProposition}</div>
          </div>
        )}
        {signals.painPoints && signals.painPoints.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Pain Points</div>
            {signals.painPoints.slice(0, 4).map((p, i) => (
              <div key={i} style={{ fontSize: 11, color: "#374151", marginBottom: 3, display: "flex", gap: 5 }}>
                <span style={{ color: "#ef4444" }}>•</span>{p}
              </div>
            ))}
          </div>
        )}
        {signals.icp?.industries && signals.icp.industries.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Target Industries</div>
            {signals.icp.industries.map((ind, i) => (
              <div key={i} style={{ fontSize: 11, color: "#374151", marginBottom: 3, display: "flex", gap: 5 }}>
                <span style={{ color: "#6366f1" }}>•</span>{ind}
              </div>
            ))}
          </div>
        )}
        {signals.keywordTriggers && signals.keywordTriggers.length > 0 && (
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Keyword Triggers</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {signals.keywordTriggers.map((kw, i) => (
                <span key={i} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 12, background: "#f3f4f6", color: "#374151", border: "1px solid rgba(0,0,0,0.06)" }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, index }: { lead: Lead; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const pCfg = PRIORITY_COLORS[lead.priority ?? "Medium"] ?? PRIORITY_COLORS.Medium;
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12,
      overflow: "hidden", transition: "box-shadow 0.18s",
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${pCfg.dot}22, ${pCfg.dot}11)`,
          border: `1.5px solid ${pCfg.dot}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: pCfg.dot,
        }}>
          {(lead.firstName?.[0] ?? "?")}{(lead.lastName?.[0] ?? "")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
              {lead.firstName} {lead.lastName}
            </span>
            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: pCfg.bg, color: pCfg.text, fontWeight: 700 }}>
              {lead.priority}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
            {lead.role} · {lead.company} · {lead.industry}
          </div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <ScoreBadge score={lead.fitScore} />
          <span style={{ fontSize: 10, color: "#9ca3af" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "0 0 2px" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Email",    value: lead.email,          icon: "✉️" },
              { label: "Location", value: lead.location,       icon: "📍" },
              { label: "Size",     value: lead.companySize,    icon: "🏢" },
              { label: "Value",    value: lead.estimatedValue, icon: "💰" },
            ].map(({ label, value, icon }) => value ? (
              <div key={label} style={{ padding: "7px 9px", borderRadius: 8, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>{icon} {label}</div>
                <div style={{ fontSize: 11, color: "#374151", wordBreak: "break-all" }}>{value}</div>
              </div>
            ) : null)}
          </div>

          {lead.primaryPain && (
            <div style={{ padding: "9px 11px", borderRadius: 9, background: "#fef2f2", border: "1px solid rgba(239,68,68,0.15)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>🎯 Primary Pain</div>
              <div style={{ fontSize: 12, color: "#374151" }}>{lead.primaryPain}</div>
            </div>
          )}
          {lead.triggerEvent && (
            <div style={{ padding: "9px 11px", borderRadius: 9, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>⚡ Trigger Event</div>
              <div style={{ fontSize: 12, color: "#374151" }}>{lead.triggerEvent}</div>
            </div>
          )}
          {lead.approachAngle && (
            <div style={{ padding: "9px 11px", borderRadius: 9, background: "#f0fdf4", border: "1px solid rgba(22,163,74,0.15)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>💬 Approach Angle</div>
              <div style={{ fontSize: 12, color: "#374151", fontStyle: "italic" }}>"{lead.approachAngle}"</div>
            </div>
          )}
          {lead.linkedin && (
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 10, color: "#6b7280" }}>🔗 {lead.linkedin}</span>
              <CopyButton text={lead.linkedin} />
            </div>
          )}
          {lead.tags && lead.tags.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {lead.tags.map((t, i) => (
                <span key={i} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "#eef2ff", color: "#4338ca", fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OutreachCard({ item }: { item: OutreachItem }) {
  const [showFollowUps, setShowFollowUps] = useState(false);
  const fullEmail = `Subject: ${item.subject}\n\n${item.body}`;
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{item.leadName} · {item.company}</div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>
            via {item.channel === "linkedin" ? "LinkedIn" : item.channel === "both" ? "Email + LinkedIn" : "Email"}
          </div>
        </div>
        <CopyButton text={fullEmail} />
      </div>
      <div style={{ padding: "10px 12px", borderRadius: 9, background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)", marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Subject Line</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.subject}</div>
      </div>
      <div style={{ padding: "10px 12px", borderRadius: 9, background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)", marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Email Body</div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-line" }}>{item.body}</div>
      </div>
      {(item.followUpDay3 || item.followUpDay7) && (
        <>
          <button
            onClick={() => setShowFollowUps(f => !f)}
            style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showFollowUps ? 8 : 0 }}
          >
            {showFollowUps ? "▲ Hide" : "▼ Show"} follow-up sequence
          </button>
          {showFollowUps && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {item.followUpDay3 && (
                <div style={{ padding: "9px 11px", borderRadius: 8, background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.10)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Day 3 Follow-up</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{item.followUpDay3}</div>
                </div>
              )}
              {item.followUpDay7 && (
                <div style={{ padding: "9px 11px", borderRadius: 8, background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.10)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Day 7 Follow-up</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{item.followUpDay7}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DeliverableCard({ d }: { d: Deliverable }) {
  const fullText = [
    d.title ? `# ${d.title}` : "",
    d.executiveSummary ? `\nExecutive Summary:\n${d.executiveSummary}` : "",
    d.problemStatement?.length ? `\nProblem:\n${d.problemStatement.map(b => `• ${b}`).join("\n")}` : "",
    d.solutionOverview?.length ? `\nSolution:\n${d.solutionOverview.map(b => `• ${b}`).join("\n")}` : "",
    d.differentiators?.length ? `\nWhy Us:\n${d.differentiators.map(b => `• ${b}`).join("\n")}` : "",
    d.proofPoints?.length ? `\nProof:\n${d.proofPoints.map(b => `• ${b}`).join("\n")}` : "",
    d.engagementTiers?.length ? `\nEngagement Options:\n${d.engagementTiers.map(t => `${t.name}: ${t.price}\n${(t.includes ?? []).map(f => `  - ${f}`).join("\n")}`).join("\n\n")}` : "",
    d.nextSteps?.length ? `\nNext Steps:\n${d.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
    d.ctaLine ? `\n${d.ctaLine}` : "",
  ].filter(Boolean).join("\n");

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{
        padding: "14px 16px", background: "linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04))",
        borderBottom: "1px solid rgba(99,102,241,0.10)", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>📋 {d.title ?? "Proposal One-Pager"}</div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{d.type ?? "Business Proposal"} · Ready to send</div>
        </div>
        <CopyButton text={fullText} />
      </div>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {d.executiveSummary && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>Executive Summary</div>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, fontStyle: "italic" }}>{d.executiveSummary}</p>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {d.problemStatement && d.problemStatement.length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fef2f2", border: "1px solid rgba(239,68,68,0.10)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>❌ Problem</div>
              {d.problemStatement.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#374151", marginBottom: 3 }}>• {b}</div>)}
            </div>
          )}
          {d.solutionOverview && d.solutionOverview.length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f0fdf4", border: "1px solid rgba(22,163,74,0.10)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>✅ Solution</div>
              {d.solutionOverview.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#374151", marginBottom: 3 }}>• {b}</div>)}
            </div>
          )}
          {d.differentiators && d.differentiators.length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "#eef2ff", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>⭐ Why Us</div>
              {d.differentiators.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#374151", marginBottom: 3 }}>• {b}</div>)}
            </div>
          )}
          {d.proofPoints && d.proofPoints.length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fefce8", border: "1px solid rgba(234,179,8,0.15)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>🏆 Proof</div>
              {d.proofPoints.map((b, i) => <div key={i} style={{ fontSize: 11, color: "#374151", marginBottom: 3 }}>• {b}</div>)}
            </div>
          )}
        </div>
        {d.engagementTiers && d.engagementTiers.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>💰 Engagement Options</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {d.engagementTiers.map((tier, i) => (
                <div key={i} style={{
                  padding: "10px 11px", borderRadius: 10,
                  background: i === 1 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f8fafc",
                  border: i === 1 ? "none" : "1px solid rgba(0,0,0,0.07)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: i === 1 ? "#fff" : "#374151", marginBottom: 2 }}>{tier.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: i === 1 ? "#e0e7ff" : "#6366f1", marginBottom: 6 }}>{tier.price}</div>
                  {tier.includes?.map((f, j) => (
                    <div key={j} style={{ fontSize: 10, color: i === 1 ? "rgba(255,255,255,0.75)" : "#6b7280", marginBottom: 2 }}>• {f}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {d.nextSteps && d.nextSteps.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>🚀 Next Steps</div>
            {d.nextSteps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 12, color: "#374151" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#6366f1", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
        )}
        {d.ctaLine && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))", border: "1px solid rgba(99,102,241,0.15)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4338ca", textAlign: "center" }}>{d.ctaLine}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "leads" | "outreach" | "deliverable" | "signals";

export default function LeadCycleApp() {
  const [input, setInput]             = useState("");
  const [running, setRunning]         = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [result, setResult]           = useState<CycleResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<Tab>("leads");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runCycle = async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setResult(null);
    setError(null);

    const stageInterval = setInterval(() => {
      setActiveStage(prev => (prev < STAGES.length ? prev + 1 : prev));
    }, 4500);

    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/lead-cycle/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ input: input.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as CycleResult;
      clearInterval(stageInterval);
      setActiveStage(6);
      setResult(data);
      setActiveTab("leads");
    } catch (err) {
      clearInterval(stageInterval);
      setError(err instanceof Error ? err.message : "Cycle failed");
    } finally {
      setRunning(false);
    }
  };

  const tabs: { id: Tab; icon: string; label: string; count?: number }[] = [
    { id: "leads",      icon: "🎯", label: "Leads",      count: result?.leads.length },
    { id: "outreach",   icon: "✉️", label: "Outreach",   count: result?.outreach.length },
    { id: "deliverable",icon: "📋", label: "Proposal",   count: result?.deliverable ? 1 : undefined },
    { id: "signals",    icon: "📡", label: "Signals"     },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "hsl(220,20%,97%)" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        padding: "16px 24px 0", background: "#fff",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>🔄</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Lead Generation Cycle</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Paste any input → get qualified leads, outreach & a proposal in ~25 seconds</div>
          </div>
          {result && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid rgba(22,163,74,0.20)" }}>
                ✓ {result.meta.leadsGenerated} leads
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#eef2ff", color: "#4338ca", border: "1px solid rgba(99,102,241,0.20)" }}>
                ✓ {result.meta.oppsCreated} in pipeline
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Input area ── */}
      <div style={{
        padding: "16px 24px", background: "#fff",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ position: "relative" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); runCycle(); } }}
            placeholder="Paste any input here — a product description, idea, pitch, client brief, content piece, or context. The system will extract signals, generate leads, draft outreach, and build your proposal automatically."
            rows={4}
            style={{
              width: "100%", resize: "none", border: "1.5px solid rgba(99,102,241,0.20)",
              borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#0f172a",
              fontFamily: "inherit", lineHeight: 1.6, outline: "none",
              background: running ? "rgba(0,0,0,0.02)" : "#fff",
              transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
            onFocus={e => (e.target.style.borderColor = "rgba(99,102,241,0.50)")}
            onBlur={e => (e.target.style.borderColor = "rgba(99,102,241,0.20)")}
            disabled={running}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <div style={{ display: "flex", gap: 4, overflow: "hidden" }}>
              {EXAMPLE_PROMPTS.slice(0, 2).map((p, i) => (
                <button key={i}
                  onClick={() => { setInput(p); textareaRef.current?.focus(); }}
                  style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 8,
                    background: "#f3f4f6", border: "1px solid rgba(0,0,0,0.07)",
                    color: "#6b7280", cursor: "pointer", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180,
                  }}
                >
                  Example {i + 1}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>⌘↵ to run</span>
              <button
                onClick={runCycle}
                disabled={!input.trim() || running}
                style={{
                  padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                  background: (!input.trim() || running) ? "rgba(0,0,0,0.12)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  boxShadow: (!input.trim() || running) ? "none" : "0 2px 8px rgba(99,102,241,0.35)",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {running ? (
                  <><span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", display: "block", animation: "spin 0.7s linear infinite" }} /> Running…</>
                ) : "⚡ Activate Cycle"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid rgba(239,68,68,0.20)", fontSize: 12, color: "#dc2626" }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── Stage progress (while running or after) ── */}
      {(running || result) && (
        <StageProgress active={activeStage} complete={!running && !!result} />
      )}

      {/* ── Empty state ── */}
      {!running && !result && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🔄</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Automatic Lead Generation</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, maxWidth: 400 }}>
              Paste any information above — a pitch, product brief, idea, client request, or content piece — and the full 5-stage cycle activates automatically.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 440, width: "100%" }}>
            {STAGES.map(s => (
              <div key={s.id} style={{ padding: "10px 12px", borderRadius: 10, background: "#fff", border: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 440 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8 }}>Try one of these examples</div>
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button key={i}
                onClick={() => { setInput(p); textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(0, 0); }}
                style={{
                  fontSize: 12, padding: "9px 12px", borderRadius: 9, textAlign: "left",
                  background: "#fff", border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer",
                  color: "#374151", lineHeight: 1.5, transition: "border-color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.30)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)")}
              >
                <span style={{ fontSize: 10, color: "#9ca3af" }}>#{i + 1} · </span>
                {p.slice(0, 100)}{p.length > 100 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && !running && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tab bar */}
          <div style={{
            display: "flex", gap: 1, padding: "10px 24px 0",
            borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#fff",
            flexShrink: 0, overflowX: "auto",
          }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "8px 12px",
                  fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? "#4f46e5" : "#6b7280",
                  background: activeTab === tab.id ? "#f5f3ff" : "transparent",
                  border: activeTab === tab.id ? "1px solid #e0e7ff" : "1px solid transparent",
                  borderBottom: activeTab === tab.id ? "2px solid #4f46e5" : "2px solid transparent",
                  borderRadius: "8px 8px 0 0", cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.12s",
                }}
              >
                {tab.icon} {tab.label}
                {tab.count !== undefined && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: "#4f46e5", color: "#fff", borderRadius: 8, padding: "1px 5px" }}>{tab.count}</span>
                )}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingBottom: 10, flexShrink: 0 }}>
              <button
                onClick={() => { setResult(null); setActiveStage(0); setInput(""); }}
                style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >New Cycle</button>
            </div>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 24px" }}>

            {/* ── Leads tab ── */}
            {activeTab === "leads" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                  {result.leads.length} leads generated · {result.opportunityIds.length} added to your pipeline · Sorted by fit score
                </div>
                {result.leads.map((lead, i) => <LeadCard key={lead.id ?? i} lead={lead} index={i} />)}
              </div>
            )}

            {/* ── Outreach tab ── */}
            {activeTab === "outreach" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680 }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
                  Personalized outreach for top {result.outreach.length} leads · Click "Copy" to use immediately
                </div>
                {result.outreach.length > 0
                  ? result.outreach.map((item, i) => <OutreachCard key={i} item={item} />)
                  : <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No outreach generated</div>
                }
              </div>
            )}

            {/* ── Deliverable tab ── */}
            {activeTab === "deliverable" && (
              <div style={{ maxWidth: 720 }}>
                {result.deliverable
                  ? <DeliverableCard d={result.deliverable} />
                  : <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No deliverable generated</div>
                }
              </div>
            )}

            {/* ── Signals tab ── */}
            {activeTab === "signals" && (
              <div style={{ maxWidth: 680 }}>
                <SignalCard signals={result.signals} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
