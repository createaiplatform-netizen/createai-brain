// ─── Guide Engine ────────────────────────────────────────────────────────────
// Returns contextual, multi-paragraph guide text for any platform state.
// Follows the Full Business Standard — always real, always complete, never empty.

import { getIndustryConfig, type PlatformMode, type PlatformFilters } from "./universeConfig";

export interface GuideContext {
  mode: PlatformMode;
  section: "welcome" | "tiles" | "detail" | "metrics" | "simulation" | "profile" | "filters";
  filters: PlatformFilters;
  activeTileTitle?: string;
  scenarioType?: string;
  profileOrgName?: string;
}

interface GuideParagraph {
  heading: string;
  body: string;
}

export interface GuideResponse {
  title: string;
  intro: string;
  paragraphs: GuideParagraph[];
  nextSteps: string[];
  tip: string;
}

export function getGuideResponse(ctx: GuideContext): GuideResponse {
  const config = getIndustryConfig(ctx.filters.industry);
  const orgLabel = ctx.profileOrgName ? `your ${ctx.profileOrgName} team` : `your ${config.label} organization`;

  switch (ctx.mode) {
    case "demo":
      return getDemoGuide(ctx, config.label, config.entityPluralLabel, orgLabel);
    case "test":
      return getTestGuide(ctx, config.label, config.entityPluralLabel, orgLabel);
    case "simulation":
      return getSimulationGuide(ctx, config.label, orgLabel);
    default:
      return getDemoGuide(ctx, config.label, config.entityPluralLabel, orgLabel);
  }
}

function getDemoGuide(ctx: GuideContext, industry: string, entities: string, orgLabel: string): GuideResponse {
  const sectionGuides: Record<string, GuideResponse> = {
    welcome: {
      title: `${industry} Business Platform — Demo`,
      intro: `You're exploring a complete, professional ${industry} operations platform — not a mockup, not a prototype. Every workflow, document, role, and metric shown is structured to the same standard a real ${industry} business would operate at. Start by clicking any workflow tile to see the full depth.`,
      paragraphs: [
        {
          heading: "Business-grade completeness",
          body: `Every tile represents a real operational workflow with defined stages, document templates, role assignments, SLA targets, compliance checkpoints, and AI automation opportunities. Nothing is placeholder — every element works, every detail is meaningful.`,
        },
        {
          heading: "Industry-specific structure",
          body: `This workspace is configured for ${industry}. Workflows, metrics, document types, and compliance references are specific to this industry — not generic. Filter by region to activate jurisdiction-specific regulatory context. Filter by role and department to see what your team would actually see on day one.`,
        },
        {
          heading: "Demo → Test → Activate",
          body: `You are in Demo Mode. When you're ready to go deeper, switch to Test Mode (top bar) to set up a real organizational profile and explore with your actual context. Run Simulation Mode to stress-test the system under high volume, staffing gaps, or compliance audits. When satisfied, click Activate Platform to begin deployment.`,
        },
      ],
      nextSteps: [
        "Click any workflow tile to see its complete stage breakdown",
        "Switch to Metrics view to see the full KPI dashboard with benchmarks",
        "Change the industry filter to explore a different domain",
        "Switch to Test Mode to evaluate with your real organizational context",
      ],
      tip: `The AI Score on each tile (0-100) is the automation opportunity index. Tiles scoring 80+ are high-priority targets — typically rules-based, high-volume workflows where AI eliminates manual overhead by 40-70%.`,
    },
    tiles: {
      title: "Operational Workflow Map",
      intro: `These tiles represent the complete operational workflow set for a ${industry} organization — every core process from intake through close. Each workflow is fully structured: named stages, stage owners, documents, compliance gates, and AI automation points.`,
      paragraphs: [
        {
          heading: "What each tile shows",
          body: `Workflow name and icon · Volume count (entities currently in this workflow) · Average processing time (realistic for this workflow type) · Status badge (Active / Pending / Review / Blocked) · Department owner · AI Opportunity Score (0-100). Color coding gives you immediate health-at-a-glance visibility.`,
        },
        {
          heading: "AI Opportunity Scores",
          body: `A score of 80+ means this workflow is a strong automation candidate — typically high-volume, rule-based, and currently creating significant manual overhead. A score of 50-79 means AI assists but humans remain in the loop at key decision points. Below 50 means the workflow requires deep human judgment — AI supports but does not replace.`,
        },
        {
          heading: "Status intelligence",
          body: `Blocked workflows have an identified bottleneck — typically at an Approval Gate or Quality Review stage. Review workflows have flagged items that need human attention. Pending workflows are queued waiting for a trigger event. AI surfaces blocked and review items first in any operational dashboard.`,
        },
      ],
      nextSteps: [
        "Click any tile to open the full workflow breakdown with stages, documents, and roles",
        "Look for Blocked status tiles — those have identified bottlenecks the AI has already flagged",
        "Tiles with AI Score 80+ are your highest-leverage automation targets",
        "Switch to Metrics view to see how these workflows are performing against KPI benchmarks",
      ],
      tip: `In a live deployment, Blocked workflow tiles trigger automatic escalation alerts to the responsible supervisor. The AI generates a root-cause analysis and suggests specific remediation steps — no manual investigation needed.`,
    },
    detail: {
      title: `Workflow Detail: ${ctx.activeTileTitle || "Complete Breakdown"}`,
      intro: `You're viewing the complete operational breakdown of this workflow. Every stage is structured with a defined owner, expected duration, associated document, risk rating, compliance checkpoint, and AI automation opportunity. This is what real deployment looks like — not a wireframe.`,
      paragraphs: [
        {
          heading: "Stage-by-stage architecture",
          body: `Each stage has: a named owner (role, not person), expected duration with variance range, the specific document created or updated at that stage, a risk rating (Low/Med/High) based on compliance and error exposure, and an AI automation score. Click any stage to expand its full detail including sub-steps, escalation paths, and SLA targets.`,
        },
        {
          heading: "Document flow and compliance",
          body: `Every stage produces or updates a specific document. The Documents tab shows the complete document set for this workflow — with template structure, required fields, approval signatures, version control requirements, and retention period. In a live system, these connect directly to your document management platform.`,
        },
        {
          heading: "AI intervention points",
          body: `Stages with AI scores above 75 are prime automation targets. Typical AI interventions in these stages: intelligent intake routing (eliminating manual assignment), document pre-population from prior records, compliance flag detection before the approval gate, anomaly detection in numeric fields, and automated reminder and escalation management.`,
        },
      ],
      nextSteps: [
        "Review the high-risk stages (red indicator) — these are your compliance exposure points",
        "Check the Related Workflows tab to understand upstream and downstream dependencies",
        "Note the document templates — these map directly to your current record systems",
        "Switch to Simulation Mode to see how this workflow degrades under stress conditions",
      ],
      tip: `The Approval Gate is the most common bottleneck across all industries. AI pre-screening — checking for missing fields, compliance flags, and incomplete signatures before submission — reduces rework at the gate by an estimated 40-60% in comparable deployments.`,
    },
    metrics: {
      title: `${industry} KPI Dashboard`,
      intro: `This is a complete, structured KPI dashboard for a ${industry} organization — not a generic metrics list. Every metric has a realistic current value, trend direction, benchmark comparison, and AI-generated insight. Benchmarks are based on industry norms; your actual values will vary based on org size, process maturity, and staffing model.`,
      paragraphs: [
        {
          heading: "Reading each metric card",
          body: `Current value → Trend direction (↑ up / ↓ down / → flat) with percentage → Benchmark comparison → Status indicator (Green = on target / Yellow = approaching threshold / Red = action required). Every metric in Red status triggers an automatic AI investigation in a live deployment.`,
        },
        {
          heading: "AI-powered anomaly detection",
          body: `In a live system, each metric is monitored continuously. Unusual patterns — a sudden 15% drop in throughput, a spike in error rates, a compliance metric approaching a regulatory threshold — trigger automatic alerts before they become incidents. Predictive models can forecast metric trajectories 30-90 days ahead with confidence intervals.`,
        },
        {
          heading: "Benchmark sources",
          body: `Industry benchmarks are derived from operational data across comparable ${industry} organizations. They account for org size, staffing ratios, geographic regulatory context, and technology maturity level. Use them as starting targets — your specific context will refine them during the Test phase.`,
        },
      ],
      nextSteps: [
        "Identify any metrics showing Warning or Critical status and investigate the root cause",
        "Switch to Simulation Mode to see how these metrics change under specific stress scenarios",
        "Move to Test Mode to calibrate these benchmarks against your actual baseline numbers",
        "Ask the AI Guide to explain any metric or benchmark in detail",
      ],
      tip: `Any metric that trends in the wrong direction for 3+ consecutive measurement periods should trigger a root-cause review. In this platform, that review is automatically initiated by the AI — generating a draft analysis and recommended response plan within minutes.`,
    },
    filters: {
      title: "Precision Context Configuration",
      intro: `These filters configure the platform for your exact operational context. Industry, region, role, department, and org type are not cosmetic — they change the workflows, compliance references, document types, metric benchmarks, and AI guidance shown throughout the entire workspace.`,
      paragraphs: [
        {
          heading: "Why context precision matters",
          body: `A healthcare clinic in California (HIPAA, Medi-Cal) operates differently from one in Ontario (OHIP, PHIPA), England (NHS, CQC), or Australia (Medicare Australia, TGA). A construction firm in Texas (OSHA 1926, Texas lien law) follows different rules than one in Germany (DGUV) or the UAE (Tasneef). This platform adapts terminology, currency, regulatory references, workflow patterns, and benchmarks to your exact region — worldwide.`,
        },
        {
          heading: "Role and department filtering",
          body: `A Director-level view prioritizes cross-department KPIs, compliance summaries, and strategic metrics. A frontline operations view prioritizes individual workflow queues, daily action items, and SLA status. A compliance officer view surfaces regulatory flags, audit trails, and risk indicators. Everyone sees exactly what they need — nothing they don't.`,
        },
      ],
      nextSteps: [
        "Set your industry first — this changes the entire workflow and document set",
        "Select your region to activate relevant regulatory compliance context",
        "Set your role and department to get tailored guidance in the AI panel",
        "Try different org types to see how volume and complexity baselines shift",
      ],
      tip: `Your filter settings are saved automatically between sessions. In Test Mode, your profile (set during login) pre-populates these filters so you start in your exact operational context from session one.`,
    },
  };

  return sectionGuides[ctx.section] || sectionGuides.welcome;
}

function getTestGuide(ctx: GuideContext, industry: string, entities: string, orgLabel: string): GuideResponse {
  const roleLabel = ctx.filters.role || "operations leader";
  const sectionGuides: Record<string, GuideResponse> = {
    welcome: {
      title: `Test Mode — ${industry} Operational Sandbox`,
      intro: `Test Mode is a structured evaluation environment calibrated to ${orgLabel}. Everything you see — workflow volumes, metrics, entities, document types, and AI guidance — is shaped to your real organizational context. Your data stays local. Nothing leaves your browser.`,
      paragraphs: [
        {
          heading: "Your context is live",
          body: `The platform has configured itself based on your profile: ${industry} industry, ${ctx.filters.state || "your region"}, ${roleLabel} role${ctx.filters.department ? `, ${ctx.filters.department} department` : ""}. Workflow tiles now reflect the volume patterns, compliance requirements, and role priorities relevant to your actual situation — not a generic demo.`,
        },
        {
          heading: "Real operational patterns, illustrative data",
          body: `In Test Mode, you'll see more entities, richer metrics, and guidance that speaks directly to your role and department. A billing manager sees billing-specific workflows, denial rates, and payer mix metrics. A director sees cross-department KPIs and strategic risk indicators. The data is illustrative, but the structure is real — this is exactly what your team would see on day one of deployment.`,
        },
        {
          heading: "Evaluate, then activate",
          body: `Use Test Mode to fully evaluate the platform against your real operational questions. When you're confident it meets your needs, click Activate Platform (top bar) to begin deployment. If you want to stress-test the system first, switch to Simulation Mode to run scenarios — high volume, staff shortage, compliance audit, system outage.`,
        },
      ],
      nextSteps: [
        "Review your profile settings in the left panel — update if needed",
        "Click workflow tiles to see processes relevant to your role and department",
        "Check the Metrics view for KPIs calibrated to your organizational context",
        "Run Simulation Mode to stress-test the platform before activating",
        "Click Activate Platform when ready to begin deployment",
      ],
      tip: `Your profile and filter settings persist between sessions. Return anytime to continue your evaluation — everything you've explored is exactly what you'll get in a live deployment.`,
    },
    detail: {
      title: `${roleLabel} View: ${ctx.activeTileTitle || "Workflow Detail"}`,
      intro: `In Test Mode, this workflow is calibrated for ${orgLabel}. The stages, document types, role assignments, and AI intervention points reflect how this process would actually operate in your environment — not a generic industry example.`,
      paragraphs: [
        {
          heading: "Your role in this workflow",
          body: `As a ${roleLabel}, your primary ownership points are the Review and Approval stages — where your oversight ensures quality, compliance, and SLA adherence. The platform surfaces incomplete items and compliance flags to you automatically, before they reach the gate, so you're never surprised by a failed approval.`,
        },
        {
          heading: "Highest-value AI opportunities for your context",
          body: `For ${orgLabel}, the highest-value AI intervention in this workflow is at the initial routing stage — intelligent assignment based on case type, complexity, and staff capacity. In comparable ${industry} organizations, this eliminates 35-55% of manual coordination overhead. The second-highest opportunity is at the documentation stage — AI pre-population of known fields from prior records reduces entry time by up to 70%.`,
        },
        {
          heading: "Compliance and risk for your region",
          body: `Compliance requirements for ${ctx.filters.state || "your region"} are embedded in this workflow's structure. Regulatory gates appear at the correct stages. Document retention requirements are set. Any stage that touches a regulated data type has an automatic audit trail — no manual logging required.`,
        },
      ],
      nextSteps: [
        "Review stages where your role is the primary owner — these are your key touchpoints",
        "Check the Documents tab to see template structures and required fields",
        "Note stages with High risk rating — these are your compliance exposure points",
        "Switch to Simulation Mode to see how this workflow degrades under staffing or volume stress",
      ],
      tip: `In a live deployment, every action you take in an Approval stage is automatically logged with a timestamp, user identity, and decision rationale. Full audit trail — no extra work required.`,
    },
    metrics: {
      title: `${industry} KPIs — Your Operational Context`,
      intro: `These metrics are calibrated for ${orgLabel} — adjusted for your industry, regional regulatory context, and org type. Use them as your evaluation baseline. In a live deployment, these connect to your real data and update continuously.`,
      paragraphs: [
        {
          heading: "Calibration to your context",
          body: `Volume-based metrics reflect realistic throughput for a ${ctx.filters.orgType || "mid-size"} ${industry} organization in ${ctx.filters.state || "your region"}. Compliance metrics reflect your region's specific regulatory thresholds. Benchmarks are compared against similar organizations — same industry, same scale, similar complexity.`,
        },
        {
          heading: "What changes when you go live",
          body: `In a live deployment, every metric connects to a real data source. Your actual volumes, real error rates, real SLA adherence, real compliance scores — all flowing in automatically. AI monitors each metric continuously and flags anomalies within minutes, not after your weekly report.`,
        },
      ],
      nextSteps: [
        "Compare these benchmarks against your current operational reality",
        "Identify the 2-3 metrics that matter most to your leadership team",
        "Switch to Simulation Mode to see how these metrics respond to stress scenarios",
        "Ask the AI Guide to explain how any specific metric would improve post-activation",
      ],
      tip: `If any metric benchmark looks significantly off from your reality, that's valuable data. Note it — during your implementation, your dedicated deployment specialist will calibrate all baselines to your actual operational data.`,
    },
  };

  return sectionGuides[ctx.section] || sectionGuides.welcome;
}

function getSimulationGuide(ctx: GuideContext, industry: string, orgLabel: string): GuideResponse {
  const scenarioLabel = ctx.scenarioType || "Stress Scenario";

  return {
    title: `Simulation Engine — ${scenarioLabel}`,
    intro: `You're running a professional-grade operational simulation for ${orgLabel}. The results below model system behavior under the exact parameters you've configured — volume level, risk exposure, staffing shortfall, and timeframe. All values are illustrative projections, not operational predictions.`,
    paragraphs: [
      {
        heading: "How to read the simulation results",
        body: `Impact Analysis shows which operational areas are affected and how severely. Severity ratings follow a four-tier model: Critical (SLA breach or regulatory violation risk), High (significant degradation requiring immediate response), Medium (noticeable impact, manageable with adjustments), Low (within tolerance, monitor only). Start with Critical and High items — those are your action priorities.`,
      },
      {
        heading: "Department and timeline intelligence",
        body: `The Department View shows which teams absorb the most stress under this scenario — and by how much. The Timeline view shows day-by-day cascade: when problems first appear, when they peak, when recovery begins, and what full normalization looks like. Use this to build your contingency response calendar.`,
      },
      {
        heading: "From simulation to action plan",
        body: `The Recommendations panel translates simulation results into a prioritized action plan — specific, ordered steps based on best practices for ${industry} organizations facing this scenario type. This is your starting draft for a real contingency plan. In a live deployment, the platform generates this automatically when real metrics approach simulation thresholds.`,
      },
    ],
    nextSteps: [
      "Review Critical and High severity impacts first — these drive your response priorities",
      "Check the Department View to identify your most vulnerable team under this scenario",
      "Read every recommendation in the Actions panel — these are your contingency steps",
      "Adjust sliders to find the threshold where your system moves from High to Critical",
      "Click Activate Platform to deploy these contingency workflows in your live system",
    ],
    tip: `The most dangerous combination in any ${industry} simulation is simultaneous high volume and high risk — this overwhelms both operational capacity and compliance safeguards at the same time. If your scenario hits Critical on this combination, contingency planning and pre-positioned AI automation are not optional.`,
  };
}
