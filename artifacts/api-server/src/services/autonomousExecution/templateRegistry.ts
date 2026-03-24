// ═══════════════════════════════════════════════════════════════════════════
// templateRegistry.ts
// Stores reusable deterministic templates with variable injection.
// Categories: business plans, emails, campaigns, workflows, documents.
// Zero AI usage — all output is deterministic.
// ═══════════════════════════════════════════════════════════════════════════

import type { Capability } from "./capabilityRegistry";

export interface Template {
  id:           string;
  name:         string;
  capability:   Capability;
  description:  string;
  variables:    string[];          // required variable keys
  optionalVars: string[];          // optional variable keys
  body:         string;            // template body with {{VAR}} placeholders
  outputType:   string;
}

// ── Template Store ────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  // ── Business Plans ───────────────────────────────────────────────────────
  {
    id: "business-plan-standard",
    name: "Standard Business Plan",
    capability: "BUSINESS_PLANNING",
    description: "Structured business plan with all key sections",
    variables: ["company_name", "industry", "target_market"],
    optionalVars: ["revenue_model", "location", "team_size"],
    outputType: "document",
    body: `# Business Plan — {{company_name}}

## Executive Summary
{{company_name}} operates in the {{industry}} industry, serving {{target_market}}.
{{#revenue_model}}Revenue model: {{revenue_model}}.{{/revenue_model}}

## Company Overview
- **Industry**: {{industry}}
- **Target Market**: {{target_market}}
{{#location}}- **Location**: {{location}}{{/location}}
{{#team_size}}- **Team Size**: {{team_size}}{{/team_size}}

## Problem Statement
{{target_market}} faces significant challenges that {{company_name}} is positioned to solve through innovative solutions in the {{industry}} space.

## Solution
{{company_name}} delivers a comprehensive solution tailored to {{target_market}}, leveraging best-in-class practices within the {{industry}} sector.

## Market Opportunity
The {{industry}} market presents a substantial addressable opportunity. {{target_market}} represents a growing segment with increasing demand for quality solutions.

## Revenue Model
{{#revenue_model}}{{revenue_model}}{{/revenue_model}}{{^revenue_model}}Subscription + Service fees{{/revenue_model}}

## Competitive Advantage
- Deep domain expertise in {{industry}}
- Purpose-built for {{target_market}}
- Scalable, technology-enabled delivery

## Go-to-Market Strategy
1. Direct outreach to {{target_market}}
2. Content marketing and SEO
3. Strategic partnerships within {{industry}}
4. Referral and loyalty programs

## Financial Projections
- Year 1: Establish foundation, acquire first 100 customers
- Year 2: Scale operations, expand team
- Year 3: Market leadership position

## Key Milestones
- [ ] MVP launch
- [ ] First 10 paying customers
- [ ] Break-even
- [ ] Series A readiness`,
  },

  // ── Email Templates ───────────────────────────────────────────────────────
  {
    id: "cold-outreach-email",
    name: "Cold Outreach Email",
    capability: "EMAIL_MARKETING",
    description: "Professional cold outreach sequence",
    variables: ["sender_name", "company", "recipient_role", "value_prop"],
    optionalVars: ["product", "cta"],
    outputType: "email",
    body: `Subject: Quick question for {{recipient_role}}s at [their company]

Hi [First Name],

I\u2019m {{sender_name}} from {{company}}. I noticed you\u2019re in a {{recipient_role}} role and thought you\u2019d appreciate what we\u2019ve built.

{{value_prop}}

{{#product}}We do this through {{product}}, which has helped similar teams {{value_prop}}.{{/product}}

{{#cta}}{{cta}}{{/cta}}{{^cta}}Would you have 15 minutes this week for a brief call?{{/cta}}

Best,
{{sender_name}}
{{company}}`,
  },
  {
    id: "welcome-email",
    name: "Customer Welcome Email",
    capability: "EMAIL_MARKETING",
    description: "Onboarding welcome email for new customers",
    variables: ["customer_name", "company", "product_name"],
    optionalVars: ["support_email", "next_steps"],
    outputType: "email",
    body: `Subject: Welcome to {{product_name}}, {{customer_name}}!

Hi {{customer_name}},

Welcome to {{product_name}}! We\u2019re thrilled to have you on board.

Here\u2019s how to get started:
{{#next_steps}}
{{next_steps}}
{{/next_steps}}
{{^next_steps}}
1. Log in to your dashboard
2. Complete your profile setup
3. Explore the key features
4. Reach out if you need anything
{{/next_steps}}

{{#support_email}}Questions? Email us at {{support_email}}.{{/support_email}}

Cheers,
The {{company}} Team`,
  },
  {
    id: "re-engagement-email",
    name: "Re-engagement Email",
    capability: "EMAIL_MARKETING",
    description: "Win back inactive customers",
    variables: ["customer_name", "product_name", "company"],
    optionalVars: ["offer", "last_activity"],
    outputType: "email",
    body: `Subject: We miss you, {{customer_name}}

Hi {{customer_name}},

It\u2019s been a while since you\u2019ve been active on {{product_name}}, and we wanted to check in.

{{#offer}}As a thank-you for being a valued member, here\u2019s something special for you: {{offer}}{{/offer}}

We\u2019ve made some exciting improvements since you last visited. Come back and see what\u2019s new.

[View What\u2019s New]

We\u2019re here if you need anything.

The {{company}} Team`,
  },

  // ── Campaign Templates ────────────────────────────────────────────────────
  {
    id: "product-launch-campaign",
    name: "Product Launch Campaign",
    capability: "AD_CAMPAIGN",
    description: "Full product launch campaign framework",
    variables: ["product_name", "company", "audience", "launch_date"],
    optionalVars: ["key_benefit", "price"],
    outputType: "campaign",
    body: `# {{product_name}} Launch Campaign

## Campaign Overview
- **Product**: {{product_name}}
- **Company**: {{company}}
- **Target Audience**: {{audience}}
- **Launch Date**: {{launch_date}}
{{#price}}- **Price**: {{price}}{{/price}}

## Messaging Framework

### Primary Message
{{product_name}} is here — built for {{audience}}.

### Key Benefit
{{#key_benefit}}{{key_benefit}}{{/key_benefit}}{{^key_benefit}}Save time, increase revenue, do more with less.{{/key_benefit}}

### Social Proof Hook
Join thousands of {{audience}} already using {{product_name}}.

## Channel Strategy
1. **Email** (Day -7, -3, 0, +1): Announcement, reminder, launch, follow-up
2. **Social Media**: Teaser posts starting Day -14, launch day announcement
3. **Paid Ads**: Retargeting + cold audience starting Day -7
4. **PR/Outreach**: Press release + influencer briefing Day -5

## Launch Week Schedule
- Day -7: Soft announcement to email list
- Day -3: \u201cCountdown\u201d post on social
- Day 0 ({{launch_date}}): Full launch — all channels fire
- Day +1: Follow-up email to non-openers
- Day +7: Recap + social proof post`,
  },

  // ── Workflow Templates ────────────────────────────────────────────────────
  {
    id: "lead-nurture-workflow",
    name: "Lead Nurture Workflow",
    capability: "WORKFLOW_AUTOMATION",
    description: "Automated lead nurturing sequence",
    variables: ["product_name", "sales_cycle_days"],
    optionalVars: ["demo_link", "case_study"],
    outputType: "workflow",
    body: `# Lead Nurture Workflow — {{product_name}}

## Trigger
New lead enters CRM (form fill, ad click, or manual entry).

## Steps

### Step 1 — Immediate (Day 0)
- **Action**: Send welcome email
- **Channel**: Email
- **Template**: welcome-email

### Step 2 — Day 2
- **Action**: Send educational content (problem awareness)
- **Channel**: Email
- **Condition**: If not opened Step 1 email, resend with new subject

### Step 3 — Day 5
- **Action**: Send case study or social proof
{{#case_study}}- **Content**: {{case_study}}{{/case_study}}
- **Channel**: Email + LinkedIn (if connected)

### Step 4 — Day 8
- **Action**: Send demo invitation
{{#demo_link}}- **Link**: {{demo_link}}{{/demo_link}}
- **Channel**: Email

### Step 5 — Day {{sales_cycle_days}}
- **Action**: Final follow-up + soft close
- **Channel**: Email
- **Condition**: If no response, move to \u201cCold\u201d segment

## Exit Conditions
- Lead books a demo → Exit to \u201cDemo Booked\u201d flow
- Lead unsubscribes → Remove from all sequences
- Lead converts → Move to onboarding workflow`,
  },
  {
    id: "project-kickoff-workflow",
    name: "Project Kickoff Workflow",
    capability: "PROJECT_MANAGEMENT",
    description: "Standard project kickoff checklist and workflow",
    variables: ["project_name", "team_lead", "deadline"],
    optionalVars: ["client", "budget"],
    outputType: "workflow",
    body: `# Project Kickoff — {{project_name}}

## Project Details
- **Project**: {{project_name}}
- **Lead**: {{team_lead}}
- **Deadline**: {{deadline}}
{{#client}}- **Client**: {{client}}{{/client}}
{{#budget}}- **Budget**: {{budget}}{{/budget}}

## Kickoff Checklist

### Pre-Kickoff (Week -1)
- [ ] Define project scope and success criteria
- [ ] Assemble the project team
- [ ] Prepare kickoff agenda
- [ ] Set up project management tools

### Kickoff Meeting Agenda
1. Introductions (10 min)
2. Project overview and goals (15 min)
3. Roles and responsibilities (10 min)
4. Timeline and milestones (15 min)
5. Risks and mitigations (10 min)
6. Communication plan (10 min)
7. Q&A and next steps (10 min)

### Post-Kickoff (Week 1)
- [ ] Distribute meeting notes
- [ ] Set up recurring check-ins
- [ ] Create task assignments in PM tool
- [ ] Establish reporting cadence

## Milestone Framework
| Milestone | Target Date | Owner |
|-----------|-------------|-------|
| Discovery complete | Week 2 | {{team_lead}} |
| Draft v1 | Week 4 | {{team_lead}} |
| Review + revisions | Week 5 | {{team_lead}} |
| Final delivery | {{deadline}} | {{team_lead}} |`,
  },

  // ── Strategy Templates ────────────────────────────────────────────────────
  {
    id: "go-to-market-strategy",
    name: "Go-to-Market Strategy",
    capability: "STRATEGY_GENERATION",
    description: "Structured GTM strategy document",
    variables: ["product_name", "target_market", "channels"],
    optionalVars: ["pricing", "differentiator"],
    outputType: "strategy",
    body: `# Go-to-Market Strategy — {{product_name}}

## Target Market
{{target_market}}

## Core Value Proposition
{{product_name}} helps {{target_market}} achieve their goals faster and more effectively.
{{#differentiator}}Our key differentiator: {{differentiator}}{{/differentiator}}

## Channels
{{channels}}

## Customer Journey
1. **Awareness**: Target audience discovers {{product_name}} through {{channels}}
2. **Consideration**: Educational content builds trust and demonstrates value
3. **Decision**: Trial, demo, or free tier reduces friction
4. **Retention**: Onboarding + success cadence ensures long-term value
5. **Advocacy**: Happy customers refer others

## 90-Day Launch Plan
- **Days 1\u201330**: Foundation — set up channels, create core content, identify first 10 prospects
- **Days 31\u201360**: Activation — launch campaigns, begin outreach, collect feedback
- **Days 61\u201390**: Optimization — double down on what\u2019s working, cut what isn\u2019t

## KPIs
{{#pricing}}- MRR target based on {{pricing}} pricing{{/pricing}}
- Customer Acquisition Cost (CAC)
- Time to first value (TTFV)
- Net Promoter Score (NPS)
- Monthly Active Users (MAU)`,
  },
];

// ── Public API ────────────────────────────────────────────────────────────

export function getAllTemplates(): Template[] {
  return TEMPLATES;
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function findTemplatesForCapability(cap: Capability): Template[] {
  return TEMPLATES.filter(t => t.capability === cap);
}

export function findBestTemplate(
  cap: Capability,
  context: Record<string, unknown>,
): Template | null {
  const candidates = findTemplatesForCapability(cap);
  if (!candidates.length) return null;

  // Score by how many required variables the context satisfies
  const scored = candidates.map(t => {
    const satisfied = t.variables.filter(v => v in context).length;
    return { template: t, score: satisfied };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.template ?? null;
}

export function renderTemplate(
  template: Template,
  vars: Record<string, string | number | boolean>,
): string {
  let output = template.body;

  // Replace {{VAR}} placeholders
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    output = output.replace(pattern, String(value));
  }

  // Handle {{#KEY}}...{{/KEY}} conditional blocks — render if var present
  output = output.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, content) => (key in vars ? content : ""),
  );

  // Handle {{^KEY}}...{{/KEY}} inverse blocks — render if var absent
  output = output.replace(
    /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, content) => (!(key in vars) ? content : ""),
  );

  // Strip any remaining unfilled placeholders
  output = output.replace(/\{\{[^}]+\}\}/g, "");

  return output.trim();
}
