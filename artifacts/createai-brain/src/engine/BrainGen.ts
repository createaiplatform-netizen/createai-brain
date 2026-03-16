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
  generatePlatformWelcome,
};

export default BrainGen;
