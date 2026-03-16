// ─── Guide Engine ────────────────────────────────────────────────────────────
// Returns contextual, multi-paragraph guide text for any platform state.
// Always returns real, helpful content — never empty, never lorem ipsum.

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
      title: `Welcome to ${industry} Demo Mode`,
      intro: `You're exploring the CreateAI Brain platform in safe Demo Mode. Everything you see is illustrative — no real data, no accounts, no commitments. Use the filters on the left to customize the view for your specific context.`,
      paragraphs: [
        {
          heading: "What you're looking at",
          body: `This workspace is configured for the ${industry} industry. The tiles represent the primary workflows your teams run every day — from intake through final delivery. Each tile is fully interactive: click any one to drill into its stages, documents, roles, and AI automation opportunities.`,
        },
        {
          heading: "How to explore",
          body: `Use the left panel to filter by state, role, department, and org type. The workspace updates instantly. You can explore the Workflows view, the Metrics Strip, the entity list, and the deep drill-down panels — each layer reveals more detail about how the platform would operate in your context.`,
        },
        {
          heading: "When you're ready",
          body: `Switch to Test Mode (top bar) to set up a real profile, accept the NDA, and explore with richer, personalized data. Use Simulation Mode to run stress scenarios — high volume, staff shortage, audits, system outages — and see exactly how the platform responds.`,
        },
      ],
      nextSteps: [
        "Click any workflow tile to see its full detail",
        "Change the industry filter to explore a different domain",
        "Switch to Metrics view to see the KPI dashboard",
        "Try Test Mode for a personalized experience",
      ],
      tip: `Tip: The AI Score on each tile shows the automation opportunity (0-100). Higher scores mean more AI leverage available in that workflow.`,
    },
    tiles: {
      title: "Workflow Tiles Overview",
      intro: `These tiles represent the core operational workflows in a ${industry} environment. Each one is a self-contained process with defined stages, documents, roles, and performance metrics.`,
      paragraphs: [
        {
          heading: "Reading the tiles",
          body: `Each tile shows: the workflow name, current volume count, average processing time, status (active/pending/review/blocked), department owner, and AI Opportunity Score. The color of the status badge indicates health at a glance.`,
        },
        {
          heading: "AI Opportunity Scores",
          body: `The score in the bottom-right of each tile (0-100) represents how much AI can improve that workflow. Scores above 80 indicate high automation potential — typically repetitive, rule-based processes with large volume. Scores below 50 indicate workflows that still require significant human judgment.`,
        },
      ],
      nextSteps: [
        "Click a tile to see its full workflow breakdown",
        "Look for tiles with Blocked or Review status — those need attention",
        "Sort by AI Score to find your highest-leverage automation opportunities",
      ],
      tip: `Workflows with 🔴 Blocked status typically have a bottleneck at the Approval Gate or Quality Review stage.`,
    },
    detail: {
      title: `Deep Dive: ${ctx.activeTileTitle || "Workflow Detail"}`,
      intro: `You're now viewing the full breakdown of this workflow. Each stage has a defined owner, expected duration, associated document, risk level, and AI opportunity score.`,
      paragraphs: [
        {
          heading: "Understanding the stages",
          body: `The workflow is broken into 5-7 sequential stages. Hover over any stage to see its risk rating and AI opportunity. Red stages are high-risk bottlenecks. Green stages are well-optimized and candidates for automation.`,
        },
        {
          heading: "Document flow",
          body: `At each stage, a specific document is created or updated. The document list at the bottom shows the full set of records that flow through this workflow. In a live deployment, these would connect to your document management system.`,
        },
        {
          heading: "Where AI helps most",
          body: `Stages with AI Opportunity scores above 75 are strong automation candidates. Typical AI interventions include: intelligent routing, document pre-population, anomaly detection, automated compliance checks, and smart reminders.`,
        },
      ],
      nextSteps: [
        "Review the high-risk stages (marked in red) for improvement opportunities",
        "Check the Related Workflows section to understand dependencies",
        "Note the document types — these map to your existing record systems",
        "Switch to Simulation Mode to see how this workflow behaves under stress",
      ],
      tip: `The Approval Gate stage is the most common bottleneck. AI can flag incomplete submissions before they reach this stage, reducing rework by up to 40%.`,
    },
    metrics: {
      title: `${industry} KPI Dashboard`,
      intro: `These metrics represent a realistic performance baseline for a ${industry} organization. Benchmarks are based on industry norms — your actual numbers will vary based on org size, staffing, and process maturity.`,
      paragraphs: [
        {
          heading: "Reading the metrics",
          body: `Each card shows: current value, trend direction (↑ up / ↓ down / → flat), trend percentage, and benchmark comparison. Green status = good. Yellow = watch. Red = action required.`,
        },
        {
          heading: "AI-powered insights",
          body: `In a live deployment, each metric would be backed by real-time data and AI anomaly detection. Unusual patterns trigger automatic alerts before they become problems. Predictive models can forecast metric trajectories 30-90 days out.`,
        },
      ],
      nextSteps: [
        "Identify any metrics in Warning or Critical status",
        "Run a simulation to see how these metrics change under stress",
        "Switch to Test Mode to input your real baseline numbers",
      ],
      tip: `Metrics trending in the wrong direction for more than 3 consecutive periods automatically trigger an AI investigation and root-cause analysis.`,
    },
    filters: {
      title: "Customize Your View",
      intro: `Use the filters to configure the platform for your specific context. The workspace updates instantly based on your selections — no page reload needed.`,
      paragraphs: [
        {
          heading: "Filter options",
          body: `You can filter by: US State (affects regulatory context and compliance requirements), Industry (changes all workflows, entities, documents, and metrics), Role (tailors the guidance and priorities shown), Department (focuses the tile grid on department-specific workflows), and Org Type (adjusts complexity and volume baselines).`,
        },
        {
          heading: "Why this matters",
          body: `A healthcare clinic in California has different compliance requirements than a construction firm in Texas. A Director-level view shows different priorities than a frontline-staff view. The platform adapts everything — content, guidance, and AI recommendations — to your exact context.`,
        },
      ],
      nextSteps: [
        "Try changing the industry to see a completely different workflow set",
        "Set your role to get personalized guidance in the AI panel",
        "Select your state to activate relevant compliance context",
      ],
      tip: `Your filter preferences are saved automatically and persist between sessions.`,
    },
  };

  return sectionGuides[ctx.section] || sectionGuides.welcome;
}

function getTestGuide(ctx: GuideContext, industry: string, entities: string, orgLabel: string): GuideResponse {
  const sectionGuides: Record<string, GuideResponse> = {
    welcome: {
      title: `Test Mode — ${industry} Sandbox`,
      intro: `You're now in Test Mode. This is a protected sandbox where you can explore the platform using your real organizational context. Your profile is stored locally — nothing is sent externally.`,
      paragraphs: [
        {
          heading: "What's different in Test Mode",
          body: `Test Mode uses your profile (org name, state, industry, role, department) to personalize everything. Workflow counts, metrics, entity names, and AI guidance are all calibrated to your context. The data is still illustrative, but it's shaped to match what your organization would actually see.`,
        },
        {
          heading: "Richer data, real patterns",
          body: `In Test Mode, you'll see more entities, more detailed metrics, and AI guidance that speaks directly to your role. A billing manager sees billing-specific workflows and priorities. A director sees cross-department summaries and strategic KPIs. Everyone gets what they actually need.`,
        },
        {
          heading: "Next: Simulation Mode",
          body: `When you're ready to stress-test the platform, switch to Simulation Mode. You'll be able to define specific scenarios — high volume, staff shortage, audits, outages — and see exactly how your configured system responds. No guessing, no theory — pure scenario intelligence.`,
        },
      ],
      nextSteps: [
        "Review your profile settings in the left panel",
        "Explore workflows customized to your role and department",
        "Check the AI Guide for role-specific recommendations",
        "Switch to Simulation Mode when ready to stress test",
      ],
      tip: `Test Mode data persists between sessions. Update your profile anytime from the left panel to recalibrate the workspace.`,
    },
    detail: {
      title: `Your Role View: ${ctx.activeTileTitle || "Workflow Detail"}`,
      intro: `In Test Mode, the workflow detail is tailored to ${orgLabel}. The stages, documents, and roles shown reflect how this workflow would operate in your specific context.`,
      paragraphs: [
        {
          heading: "Your role in this workflow",
          body: `Based on your profile, you are positioned as a ${ctx.filters.role || "key stakeholder"} in this workflow. Your primary touchpoints are the Review and Approval stages, where your oversight ensures quality and compliance.`,
        },
        {
          heading: "Improvement opportunities",
          body: `For ${orgLabel}, the highest-value AI intervention in this workflow is at the initial routing stage — eliminating manual assignment reduces processing time by an estimated 35-55% based on comparable organizations.`,
        },
      ],
      nextSteps: [
        "Review the stages where your role is the primary owner",
        "Identify the documents your team creates most often",
        "Estimate time saved if AI automation is applied to the top 2 stages",
      ],
      tip: `Click 'Simulate This Workflow' to run a targeted stress test on just this process.`,
    },
  };

  return sectionGuides[ctx.section] || sectionGuides.welcome;
}

function getSimulationGuide(ctx: GuideContext, industry: string, orgLabel: string): GuideResponse {
  const scenarioLabel = ctx.scenarioType || "Custom Scenario";

  return {
    title: `Simulation: ${scenarioLabel}`,
    intro: `You're running a controlled simulation of the "${scenarioLabel}" scenario in a ${industry} environment. The results below reflect projected system behavior based on the parameters you've configured. All outputs are illustrative — not predictions.`,
    paragraphs: [
      {
        heading: "How to read the results",
        body: `The metrics panel shows before/after values for key KPIs. Red indicators mean the system would breach SLA or compliance thresholds under these conditions. The Impact Analysis breaks down which areas are most affected and by how much.`,
      },
      {
        heading: "Department and timeline views",
        body: `Switch to the Department View to see which teams take the most stress. The Timeline shows how the scenario unfolds day by day — when problems emerge, when recovery begins, and when normal operations resume.`,
      },
      {
        heading: "What to do with this",
        body: `Use the recommendations panel to identify your highest-priority response actions. These are generated based on best practices for ${industry} organizations facing similar scenarios. Document your response plan before switching to Live Mode.`,
      },
    ],
    nextSteps: [
      "Review the Critical and High severity impacts first",
      "Check the Department View to identify your most vulnerable team",
      "Read the AI-generated recommendations panel",
      "Adjust sliders to explore different intensity levels",
      "Export the simulation report for leadership review",
    ],
    tip: `Scenarios with high volume AND high risk simultaneously are the most challenging. If your organization scores Critical on that combination, contingency planning is urgent.`,
  };
}
