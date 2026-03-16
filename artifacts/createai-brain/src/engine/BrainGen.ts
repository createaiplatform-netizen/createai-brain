// ═══════════════════════════════════════════════════════════════════════════
// BRAINGEN — Universal Instant Content Generator
// Powers every app's "Generate" action with structured, immediate output.
// Uses ConversationEngine under the hood. No external API required.
// All output is conceptual, internal, fictional unless otherwise noted.
// ═══════════════════════════════════════════════════════════════════════════

import { ConversationEngine } from "./ConversationEngine";

// ─── Marketing generators ─────────────────────────────────────────────────

function mkId() { return `bg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export interface GenResult {
  id:        string;
  type:      string;
  topic:     string;
  content:   string;
  createdAt: Date;
  label:     string;
}

function result(type: string, topic: string, label: string, content: string): GenResult {
  return { id: mkId(), type, topic, label, content, createdAt: new Date() };
}

// ─── Social Post ──────────────────────────────────────────────────────────

const HOOKS: Record<string, string[]> = {
  Instagram: ["✨", "🔥", "💡", "🎯", "🚀"],
  LinkedIn:  ["I've been thinking about", "Here's what I've learned:", "A truth most people miss:", "3 things that changed my perspective:"],
  Twitter:   ["Hot take:", "Unpopular opinion:", "Thread 🧵", "Quick thought:"],
  Facebook:  ["Real talk —", "Has anyone else noticed", "Something I want to share:"],
  TikTok:    ["POV:", "Story time:", "Things nobody tells you:", "Wait for it…"],
  General:   ["✨", "💡", "🔑", "→"],
};

export function generateSocialPost(topic: string, platform: string, tone: string = "Professional"): GenResult {
  const hooks = HOOKS[platform] ?? HOOKS.General;
  const hook  = hooks[Math.floor(Math.random() * hooks.length)];
  const t     = capitalizeFirst(topic || "your brand");
  const isLinkedIn = platform === "LinkedIn";

  let content = "";
  if (isLinkedIn) {
    content = [
      `${hook} ${t}.`,
      ``,
      `Here's what matters most:`,
      ``,
      `▸ The right approach starts with understanding your audience deeply`,
      `▸ Clarity beats cleverness every single time`,
      `▸ Consistency builds the trust that converts`,
      `▸ Authentic stories outperform polished ads`,
      ``,
      `The brands winning right now aren't the loudest — they're the most relevant.`,
      ``,
      `What's your take on ${t}? Drop it in the comments.`,
      ``,
      `#${t.replace(/\s+/g, "")} #Marketing #Growth #Strategy`,
    ].join("\n");
  } else {
    content = [
      `${hook} ${t}`,
      ``,
      `Here's the thing nobody talks about:`,
      `When you focus on ${t}, everything changes.`,
      ``,
      `The results speak for themselves:`,
      `→ More clarity`,
      `→ Better outcomes`,
      `→ Stronger connections`,
      ``,
      `Ready to see the difference? Start today.`,
      ``,
      `#${platform} #${t.replace(/\s+/g, "")} #CreateAI`,
    ].join("\n");
  }

  return result("social", topic, `${platform} Post — ${t}`, content);
}

// ─── Email Sequence ───────────────────────────────────────────────────────

export function generateEmail(topic: string, emailType: string, tone: string = "Professional"): GenResult {
  const t = capitalizeFirst(topic || "your offer");
  const typeMap: Record<string, { subject: string; body: string[] }> = {
    "Welcome": {
      subject: `Welcome to ${t} — Here's What to Expect`,
      body: [
        `Hi [First Name],`,
        ``,
        `Welcome! We're so glad you're here.`,
        ``,
        `Here's what happens next:`,
        ``,
        `1. You'll get access to everything you need to get started`,
        `2. Our team will reach out within 1 business day`,
        `3. You'll receive your first value-packed resource shortly`,
        ``,
        `In the meantime, here's a quick overview of ${t}:`,
        ``,
        `→ [Key benefit 1]`,
        `→ [Key benefit 2]`,
        `→ [Key benefit 3]`,
        ``,
        `If you have any questions, just reply to this email.`,
        ``,
        `Warmly,`,
        `[Your Name]`,
        ``,
        `P.S. — Don't forget to check out [key resource link] to hit the ground running.`,
      ],
    },
    "Follow-Up": {
      subject: `Quick follow-up on ${t}`,
      body: [
        `Hi [First Name],`,
        ``,
        `Just checking in — did you get a chance to look at ${t}?`,
        ``,
        `I know your inbox is busy, so I'll keep this short:`,
        ``,
        `[Value proposition in one clear sentence]`,
        ``,
        `Here's what others are saying:`,
        `"[Testimonial or result quote]"`,
        ``,
        `If now isn't the right time, no worries. Just let me know when works best.`,
        ``,
        `Or, if you're ready to move forward, you can [call to action here].`,
        ``,
        `Best,`,
        `[Your Name]`,
      ],
    },
    "Nurture": {
      subject: `The #1 thing holding most people back with ${t}`,
      body: [
        `Hi [First Name],`,
        ``,
        `I want to share something that most people in our space don't talk about.`,
        ``,
        `The biggest barrier to success with ${t} isn't knowledge, resources, or time.`,
        ``,
        `It's [specific pain point or mindset block].`,
        ``,
        `Here's how to fix it:`,
        ``,
        `Step 1 — [Action]`,
        `Step 2 — [Action]`,
        `Step 3 — [Action]`,
        ``,
        `When you apply these consistently, you'll start to see [result].`,
        ``,
        `Try it this week and reply to let me know how it goes.`,
        ``,
        `[Your Name]`,
      ],
    },
    "Promotional": {
      subject: `[Limited] Access to ${t} — Ends Soon`,
      body: [
        `Hi [First Name],`,
        ``,
        `I wanted to reach out personally because this is time-sensitive.`,
        ``,
        `Right now, you can get access to ${t} at a special rate — but only until [date].`,
        ``,
        `Here's what's included:`,
        `✓ [Feature 1]`,
        `✓ [Feature 2]`,
        `✓ [Feature 3]`,
        `✓ [Bonus]`,
        ``,
        `After [date], the price returns to full rate.`,
        ``,
        `→ [CTA button text] — [link]`,
        ``,
        `Questions? Reply here.`,
        ``,
        `[Your Name]`,
        ``,
        `P.S. — This is for people who are serious about [outcome]. If that's you, this is worth it.`,
      ],
    },
  };

  const template = typeMap[emailType] ?? typeMap["Welcome"];
  const content  = `SUBJECT: ${template.subject}\n\n${template.body.join("\n")}`;
  return result("email", topic, `${emailType} Email — ${t}`, content);
}

// ─── Ad Copy ──────────────────────────────────────────────────────────────

export function generateAdCopy(topic: string, adType: string): GenResult {
  const t = capitalizeFirst(topic || "your product");
  const variants = [
    {
      label: "Headline A", text: [
        `HEADLINE: Stop Guessing — ${t} That Actually Works`,
        `SUBHEADLINE: Finally, a solution built for people who want results, not complexity.`,
        `BODY: [Problem statement]. That's why we built ${t}.`,
        `[3 bullet benefits]`,
        `CTA: Get Started Free`,
        `URGENCY: Limited spots available`,
      ].join("\n"),
    },
    {
      label: "Headline B", text: [
        `HEADLINE: The Simplest Way to [Result] — ${t}`,
        `SUBHEADLINE: Join [X] people already using it.`,
        `BODY: You don't need more tools. You need the right one. ${t} is built for [target audience].`,
        `CTA: Try It Free`,
        `SOCIAL PROOF: "It changed everything." — [Customer name]`,
      ].join("\n"),
    },
  ];

  const content = [
    `=== AD COPY VARIANTS: ${t} ===`,
    `Ad Type: ${adType}`,
    ``,
    ...variants.map((v, i) => `--- Variant ${i + 1}: ${v.label} ---\n${v.text}\n`),
    ``,
    `TARGETING SUGGESTION:`,
    `Audience: [Define your ideal customer — age, interest, problem]`,
    `Platforms: Facebook + Instagram Reels + Google Display`,
    `Budget: Start with $5–10/day to test, scale what converts`,
    ``,
    `NOTE: Replace all [bracketed placeholders] before publishing.`,
  ].join("\n");

  return result("ad", topic, `${adType} Ad — ${t}`, content);
}

// ─── Blog Post ────────────────────────────────────────────────────────────

export function generateBlog(topic: string, length: "short" | "medium" | "long" = "medium"): GenResult {
  const t = capitalizeFirst(topic || "this topic");
  const wordTarget = { short: "500 words", medium: "1,000 words", long: "2,000+ words" }[length];

  const content = [
    `# ${t}: Everything You Need to Know`,
    ``,
    `*Target length: ${wordTarget} · SEO-optimized · CreateAI Brain draft*`,
    ``,
    `## Introduction`,
    ``,
    `[Hook: Start with a bold statement, surprising statistic, or relatable question about ${t}.]`,
    ``,
    `In this guide, you'll learn:`,
    `- What ${t} actually means (and what it doesn't)`,
    `- Why it matters more than most people realize`,
    `- The practical steps to get started today`,
    ``,
    `## What Is ${t}?`,
    ``,
    `[Define the concept clearly and simply. Use plain language. Avoid jargon unless explained.]`,
    ``,
    `At its core, ${t} is about [core definition]. Most people think of it as [common misconception], but that misses the point.`,
    ``,
    `## Why ${t} Matters`,
    ``,
    `Here's why this topic is more relevant than ever:`,
    ``,
    `**1. [Reason 1]**`,
    `[Explanation — 2–3 sentences with supporting context]`,
    ``,
    `**2. [Reason 2]**`,
    `[Explanation]`,
    ``,
    `**3. [Reason 3]**`,
    `[Explanation]`,
    ``,
    `## How to Get Started with ${t}`,
    ``,
    `Follow these steps:`,
    ``,
    `### Step 1: [Action]`,
    `[Detailed explanation]`,
    ``,
    `### Step 2: [Action]`,
    `[Detailed explanation]`,
    ``,
    `### Step 3: [Action]`,
    `[Detailed explanation]`,
    ``,
    `## Common Mistakes to Avoid`,
    ``,
    `- ❌ [Mistake 1] — [Why it hurts / what to do instead]`,
    `- ❌ [Mistake 2] — [Why it hurts / what to do instead]`,
    `- ❌ [Mistake 3] — [Why it hurts / what to do instead]`,
    ``,
    `## Conclusion`,
    ``,
    `${t} doesn't have to be complicated. With the right approach and consistent effort, [desired outcome].`,
    ``,
    `The next step is simple: [specific CTA — what should the reader do right now?]`,
    ``,
    `---`,
    `*Draft generated by CreateAI Brain. Replace all [bracketed sections] with your specific details before publishing.*`,
  ].join("\n");

  return result("blog", topic, `Blog Post — ${t}`, content);
}

// ─── Video Script ─────────────────────────────────────────────────────────

export function generateVideoScript(topic: string, format: string): GenResult {
  const t = capitalizeFirst(topic || "this topic");

  const content = [
    `=== VIDEO SCRIPT: ${t} ===`,
    `Format: ${format} · CreateAI Brain draft`,
    ``,
    `[HOOK — 0:00–0:10]`,
    `(On camera, direct to lens)`,
    `"[Bold opening statement or question about ${t} that stops the scroll.]"`,
    ``,
    `[INTRO — 0:10–0:30]`,
    `"In this video, I'm going to show you [what the viewer will learn/gain]."`,
    `"If you stay till the end, you'll walk away with [specific takeaway]."`,
    ``,
    `[MAIN CONTENT — 0:30–2:30]`,
    ``,
    `POINT 1: [Key insight or step]`,
    `"[Explanation — 3–4 sentences. Keep it simple and relatable.]"`,
    `[B-roll suggestion: show [relevant visual]]`,
    ``,
    `POINT 2: [Key insight or step]`,
    `"[Explanation]"`,
    `[B-roll suggestion: screen recording / text overlay]`,
    ``,
    `POINT 3: [Key insight or step]`,
    `"[Explanation]"`,
    ``,
    `[SOCIAL PROOF — 2:30–2:45]`,
    `"[Quick reference to a result, story, or transformation — yours or a client's]"`,
    ``,
    `[CTA — 2:45–3:00]`,
    `"If this helped you, [like/subscribe/comment/click the link below]."`,
    `"And if you want to go deeper on ${t}, I've got [resource] linked right here."`,
    ``,
    `---`,
    `PRODUCTION NOTES:`,
    `- Total runtime target: ${format === "Short (60 sec)" ? "60 seconds" : format === "Long-form" ? "5–10 minutes" : "3–5 minutes"}`,
    `- Captions: recommended (80% of views with no sound)`,
    `- Thumbnail: close-up face + bold text overlay`,
    `- CTA in description: [link to offer / free resource]`,
    ``,
    `*Draft by CreateAI Brain. Replace [brackets] with your real content.*`,
  ].join("\n");

  return result("video", topic, `Video Script — ${t}`, content);
}

// ─── Campaign Planner ─────────────────────────────────────────────────────

export function generateCampaign(goal: string, audience: string, timeline: string): GenResult {
  const g = capitalizeFirst(goal || "your campaign");
  const a = capitalizeFirst(audience || "your audience");

  const content = [
    `=== CAMPAIGN PLAN: ${g} ===`,
    `Audience: ${a} · Timeline: ${timeline}`,
    ``,
    `OBJECTIVE`,
    `Primary goal: ${g}`,
    `Key metric: [Define the ONE number you're optimizing for]`,
    `Target: [Specific, measurable goal — e.g., 100 leads, $10K revenue]`,
    ``,
    `AUDIENCE PROFILE`,
    `Who: ${a}`,
    `Pain: [What keeps them up at night]`,
    `Desire: [What outcome they desperately want]`,
    `Objection: [Why they haven't acted yet]`,
    ``,
    `WEEK-BY-WEEK TIMELINE`,
    ``,
    `Week 1 — BUILD`,
    `  • Finalize offer and messaging`,
    `  • Create landing page / opt-in`,
    `  • Set up email automation`,
    `  • Schedule social content`,
    ``,
    `Week 2 — LAUNCH`,
    `  • Announce to existing audience`,
    `  • Run paid ads (if applicable)`,
    `  • Post daily social content`,
    `  • Send 2–3 emails`,
    ``,
    `Week 3 — AMPLIFY`,
    `  • Double down on what's working`,
    `  • Share testimonials and social proof`,
    `  • Send urgency/scarcity email`,
    `  • Retargeting ads for page visitors`,
    ``,
    `Week 4 — CLOSE`,
    `  • Final push — last-chance messaging`,
    `  • Personal outreach to warm leads`,
    `  • Analyze results, document learnings`,
    ``,
    `CONTENT PLAN`,
    `Social: 5 posts/week (2 educational, 2 promotional, 1 personal/story)`,
    `Email:  3–4 emails total (Welcome → Nurture → Offer → Last Chance)`,
    `Ads:    A/B test 2 headline variants, optimize for clicks → conversions`,
    ``,
    `SUCCESS METRICS`,
    `→ Open rate target: 35%+`,
    `→ Click rate target: 3%+`,
    `→ Conversion target: [define]`,
    `→ ROI target: [define]`,
    ``,
    `NOTE: Replace all [brackets] with your specific details.`,
    `*Campaign plan by CreateAI Brain — internal only.*`,
  ].join("\n");

  return result("campaign", goal, `Campaign — ${g} → ${a}`, content);
}

// ─── Document generator ───────────────────────────────────────────────────

export function generateDocument(topic: string, docType: string): GenResult {
  const t = capitalizeFirst(topic || "the topic");
  const content = ConversationEngine.generateSmartContent(`Create a ${docType} for: ${topic}`);
  return result("document", topic, `${docType} — ${t}`, content);
}

// ─── Generic smart generation ─────────────────────────────────────────────

export function generate(prompt: string): GenResult {
  const content = ConversationEngine.generateSmartContent(prompt);
  return result("general", prompt, prompt.slice(0, 60), content);
}

// ─── Project Auto-Creation (UCP-X Project Add-On) ─────────────────────────

export interface ProjectPackage {
  id: string;
  projectName: string;
  industry: string;
  objective: string;
  createdAt: Date;
  deliverables: ProjectDeliverable[];
}

export interface ProjectDeliverable {
  id: string;
  type: "brochure" | "website" | "app" | "workflow" | "marketing" | "training" | "dashboard";
  icon: string;
  label: string;
  content: string;
}

export function generateProjectPackage(projectName: string, industry: string, objective: string): ProjectPackage {
  const n = projectName || `${industry} Project`;
  const o = objective || `Build a comprehensive ${industry} solution`;

  const deliverables: ProjectDeliverable[] = [
    {
      id: mkId(), type: "brochure", icon: "🗂️", label: "Brochure / PDF",
      content: [
        `${n.toUpperCase()}`,
        `${industry} · Powered by CreateAI Brain`,
        ``,
        `OVERVIEW`,
        `${o}. This solution combines cutting-edge AI with proven ${industry} workflows to deliver measurable results for every stakeholder.`,
        ``,
        `KEY BENEFITS`,
        `• Fully integrated with existing ${industry} systems — zero disruption`,
        `• AI-guided workflows reduce manual processing time by 60–80%`,
        `• Real-time reporting and predictive analytics built in`,
        `• Onboarding in hours, not months`,
        `• Scalable from solo operator to enterprise`,
        ``,
        `WHAT'S INCLUDED`,
        `→ Core platform with ${industry}-specific module library`,
        `→ Embedded AI assistant for every user role`,
        `→ Automated workflow engine with single-entry propagation`,
        `→ Multi-channel output (email, SMS, dashboard, export)`,
        `→ Full training curriculum with certification paths`,
        ``,
        `GET STARTED`,
        `Contact: hello@createai.brain | createai.brain/start`,
        `All content is conceptual and for demonstration purposes.`,
      ].join("\n"),
    },
    {
      id: mkId(), type: "website", icon: "🌐", label: "Website Copy",
      content: [
        `— HERO —`,
        `Headline: ${n} — Built for ${industry} Professionals`,
        `Subhead: Stop managing. Start leading. AI handles the complexity so you can focus on results.`,
        `CTA: Start Free Trial  |  See a Live Demo`,
        ``,
        `— PROBLEM SECTION —`,
        `Heading: ${industry} Teams Are Buried in Busy Work`,
        `Copy: Manual processes, disconnected tools, and missing follow-through cost the average ${industry} team 12+ hours per week. There's a better way.`,
        ``,
        `— SOLUTION SECTION —`,
        `Heading: ${n} Automates What Slows You Down`,
        `Copy: One platform. Every workflow. All roles connected. Enter once — watch it flow everywhere.`,
        `Feature 1: AI-Generated Content — brochures, reports, and plans in seconds`,
        `Feature 2: Smart Workflows — tasks auto-assign, escalate, and complete`,
        `Feature 3: Live Dashboards — see everything, decide faster`,
        `Feature 4: Embedded AI Agents — guidance on every screen for every user`,
        ``,
        `— SOCIAL PROOF —`,
        `"This changed how our entire ${industry} team operates. 10/10." — Early Adopter (Simulated)`,
        ``,
        `— CTA FOOTER —`,
        `Heading: Ready to Transform Your ${industry} Operations?`,
        `CTA: Join the Waitlist  |  Book a Demo`,
        ``,
        `[All copy is conceptual — customize before publishing]`,
      ].join("\n"),
    },
    {
      id: mkId(), type: "app", icon: "📱", label: "App Wireframe",
      content: [
        `${n} — Mobile + Web App Structure`,
        `Industry: ${industry} | UCP-X Auto-Created`,
        ``,
        `SCREEN 1 — Dashboard`,
        `  • Live KPI tiles: [Primary Metric] [Secondary] [Alerts] [Tasks]`,
        `  • Recent activity feed`,
        `  • Quick-action bar: New Entry | Generate | Assign | Notify`,
        ``,
        `SCREEN 2 — Main Module (${industry}-specific)`,
        `  • List view with search + filter`,
        `  • Each item → detail view with AI summary`,
        `  • Status: Pending / In Progress / Complete / Escalated`,
        ``,
        `SCREEN 3 — AI Assistant`,
        `  • Chat interface with ${industry} context`,
        `  • Suggested actions: Generate Report | Create Plan | Send Update`,
        `  • Voice input supported`,
        ``,
        `SCREEN 4 — Workflows`,
        `  • Visual pipeline: Intake → Processing → Review → Output → Delivery`,
        `  • Role assignments auto-populated`,
        `  • Real-time status + bottleneck alerts`,
        ``,
        `SCREEN 5 — Reports`,
        `  • Auto-generated PDF/export`,
        `  • Trend charts, compliance logs, efficiency scores`,
        `  • Schedule: Daily | Weekly | Monthly | On-demand`,
        ``,
        `SCREEN 6 — Settings / Admin`,
        `  • Role management, notifications, integrations`,
        `  • Branding, language, accessibility`,
        ``,
        `[Wireframe is conceptual — all screens fully AI-generatable]`,
      ].join("\n"),
    },
    {
      id: mkId(), type: "workflow", icon: "🔄", label: "Workflow Map",
      content: [
        `${n} — Workflow Architecture`,
        `Engine: UCP-X Workflow System | Single-Entry Propagation`,
        ``,
        `ROLE MAPPING`,
        `  Primary: [End User / Operator] → enters data once`,
        `  Secondary: [Team Lead / Manager] → receives auto-routed tasks`,
        `  Specialist: [Domain Expert] → consulted when threshold triggers`,
        `  Admin: [System Admin] → full visibility + override capability`,
        `  External: [Vendor / Partner] → receives deliverables on completion`,
        ``,
        `WORKFLOW STEPS`,
        `  1. INTAKE → User submits input (web, mobile, voice, scan)`,
        `  2. VALIDATION → AI checks for completeness + compliance flags`,
        `  3. ROUTING → Auto-assigned to correct role/department/vendor`,
        `  4. PROCESSING → Automated + human steps run in parallel where possible`,
        `  5. REVIEW → Threshold check: auto-approve or escalate`,
        `  6. OUTPUT → Document/report/action generated automatically`,
        `  7. DISTRIBUTION → Email, SMS, platform notification, dashboard update`,
        `  8. FOLLOW-THROUGH → Task tracking, reminders, escalation if stalled`,
        `  9. FEEDBACK LOOP → PULSE agent measures outcome, feeds learning cycle`,
        ``,
        `MULTI-CHANNEL NOTIFICATIONS`,
        `  • Email: formatted summary with action links`,
        `  • SMS: critical alerts only`,
        `  • Platform: full detail with drill-down`,
        `  • Export: PDF/CSV on-demand`,
        ``,
        `COMPLIANCE & AUDIT`,
        `  • Every action logged with timestamp, user, and outcome`,
        `  • SENTINEL agent runs real-time compliance check at each step`,
        `  • Full audit trail exportable at any time`,
        ``,
        `[Workflow is live and self-improving — adapts based on usage patterns]`,
      ].join("\n"),
    },
    {
      id: mkId(), type: "marketing", icon: "📣", label: "Marketing Kit",
      content: [
        `${n} — Marketing Kit`,
        `Industry: ${industry}`,
        ``,
        `EMAIL SUBJECT LINES (A/B TEST)`,
        `A: "Your ${industry} team works too hard for this little output"`,
        `B: "What if ${industry} ran itself? (almost)"`,
        `C: "The ${industry} platform that actually follows through"`,
        ``,
        `30-SECOND ELEVATOR PITCH`,
        `"${n} is the AI platform built specifically for ${industry} teams. You enter information once, and it flows automatically to every person, system, and channel that needs it. Reports write themselves. Workflows execute without chasing. And an AI agent guides every user step by step. It's not another tool — it's the operating system your ${industry} team never had."`,
        ``,
        `3 KEY MESSAGES`,
        `1. Stop the follow-up loop: our AI handles every next step automatically`,
        `2. AI that actually knows ${industry}: pre-built for your exact workflows`,
        `3. ROI in 30 days or less: measurable time savings from week one`,
        ``,
        `SOCIAL HOOKS`,
        `LinkedIn: "We built ${n} because ${industry} teams deserve better than spreadsheets and email chains."`,
        `Twitter: "The ${industry} playbook just got an AI upgrade. ${n} is live."`,
        `Instagram: "What would you do with 10 extra hours per week? ${n} gives you that."`,
        ``,
        `AD COPY (SHORT)`,
        `Headline: AI-Powered ${industry} Operations`,
        `Body: From intake to output — fully automated. Try ${n} free.`,
        `CTA: Start Free  |  See How It Works`,
        ``,
        `[All copy is conceptual — customize tone and legal review before use]`,
      ].join("\n"),
    },
    {
      id: mkId(), type: "training", icon: "🎯", label: "Training Module",
      content: [
        `${n} — Training Curriculum`,
        `Delivery: Adaptive AI-Guided | Certification Required | Pass Threshold: 80%`,
        ``,
        `MODULE 1 — Platform Orientation (30 min)`,
        `  • What ${n} is and why it exists`,
        `  • Navigation: Dashboard, Modules, AI Assistant, Reports`,
        `  • Your role in the system`,
        `  • Assessment: 5 questions | Pass: 4/5`,
        ``,
        `MODULE 2 — Core ${industry} Workflows (45 min)`,
        `  • The 5-step standard workflow`,
        `  • How to enter, route, and track a work item`,
        `  • When to escalate vs. auto-approve`,
        `  • Practice scenario: complete 1 end-to-end workflow`,
        `  • Assessment: 8 questions | Pass: 7/8`,
        ``,
        `MODULE 3 — AI Assistant Proficiency (20 min)`,
        `  • How to use the AI assistant effectively`,
        `  • Generating reports, summaries, and action plans`,
        `  • Voice input and quick commands`,
        `  • Assessment: 5 questions | Pass: 4/5`,
        ``,
        `MODULE 4 — Compliance & Safety (30 min)`,
        `  • Regulatory requirements for ${industry}`,
        `  • Data handling, privacy, and audit trail`,
        `  • What to do when something goes wrong`,
        `  • Assessment: 10 questions | Pass: 9/10 (MANDATORY)`,
        ``,
        `CERTIFICATION`,
        `  Pass all 4 modules → receive ${n} Certified badge`,
        `  Certification valid 12 months | Re-test to renew`,
        `  Training adapts to your role and learning pace`,
        ``,
        `[All training content is conceptual and must be reviewed by subject-matter experts]`,
      ].join("\n"),
    },
    {
      id: mkId(), type: "dashboard", icon: "📊", label: "Dashboard KPIs",
      content: [
        `${n} — Live Dashboard Specification`,
        `Industry: ${industry} | Refresh: Real-time + 15-min batch`,
        ``,
        `PRIMARY KPIs (Top Row)`,
        `  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐`,
        `  │ Active Items    │ Completion Rate  │ Avg. Cycle Time │ Compliance Score│`,
        `  │ [Live Count]    │ [%] vs. Target   │ [Hrs] vs. SLA   │ [%] SENTINEL    │`,
        `  └─────────────────┴─────────────────┴─────────────────┴─────────────────┘`,
        ``,
        `SECONDARY KPIs (Second Row)`,
        `  • Items by Status: Pending | In Progress | Complete | Escalated`,
        `  • Volume trend: 7-day sparkline`,
        `  • Role workload distribution: bar chart`,
        `  • SLA breach risk: red/amber/green indicator`,
        ``,
        `WORKFLOW PIPELINE VIEW`,
        `  Intake → Validation → Routing → Processing → Review → Output → Delivered`,
        `  Show bottleneck alerts inline when step > 2× average dwell time`,
        ``,
        `AI INSIGHTS PANEL (Right Rail)`,
        `  • ORACLE: "Based on current trends, expect 23% volume increase in 14 days"`,
        `  • SENTINEL: "3 items approaching SLA threshold — review recommended"`,
        `  • VECTOR: "Efficiency score up 8% this week — top performer: [Role]"`,
        ``,
        `REPORTS AVAILABLE`,
        `  Daily summary · Weekly trend · Monthly executive · On-demand custom`,
        `  Export: PDF | CSV | Email | API`,
        ``,
        `[All KPI values are real-time placeholders — connect to your data source]`,
      ].join("\n"),
    },
  ];

  return {
    id: mkId(),
    projectName: n,
    industry,
    objective: o,
    createdAt: new Date(),
    deliverables,
  };
}

// ─── Batch generation ─────────────────────────────────────────────────────

export function generatePlatformWelcome(appName: string): string {
  return [
    `🧠 CreateAI Brain — ${appName}`,
    ``,
    `This app is AI-powered and fully active.`,
    `Type anything or tap any button to generate real content instantly.`,
    ``,
    `The Brain responds to every request immediately.`,
    `All output is structured, actionable, and ready to use.`,
  ].join("\n");
}

export const BrainGen = {
  generate,
  generateSocialPost,
  generateEmail,
  generateAdCopy,
  generateBlog,
  generateVideoScript,
  generateCampaign,
  generateDocument,
  generateProjectPackage,
  generatePlatformWelcome,
};

export default BrainGen;
