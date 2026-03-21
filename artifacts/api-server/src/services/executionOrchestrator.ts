/**
 * executionOrchestrator.ts — All-Systems Execution Orchestrator
 *
 * Takes a plain-language goal and turns it into a complete, multi-day,
 * multi-channel execution plan using GPT-4o.
 *
 * Knows about every capability in the platform:
 *   - 8 creation engines (Guided, Free, Hybrid, App, Website, Tool, E2E, PIP)
 *   - 25-mode spectrum (BASE → BEYOND)
 *   - All universes (education, healthcare, business, creative, etc.)
 *   - All experience engines (Scene & Setting, Avatar, Immersive Vibe, etc.)
 *   - All conceptual layers (body/mind/soul/house/land/universe/omni-totality)
 *   - All series and agents
 *
 * Rules:
 *   - ADDITIVE ONLY — no existing logic touched
 *   - No external API calls — everything internal, human executes final steps
 *   - Uses real GPT-4o — no mock data, no simulated plans
 *   - All assets are copy-ready text for manual use
 */

import { openai } from "@workspace/integrations-openai-ai-server";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExecutionAction {
  id:       string;
  text:     string;
  channel?: string;
  done:     boolean;
}

export interface EmailAsset {
  type:    string;
  subject: string;
  body:    string;
}

export interface SocialAsset {
  type:     string;
  platform: string;
  copy:     string;
}

export interface VideoAsset {
  title:        string;
  hook:         string;
  script:       string;
  callToAction: string;
}

export interface AdAsset {
  platform: string;
  headline: string;
  body:     string;
  cta:      string;
}

export interface ExecutionPlan {
  id:           string;
  goal:         string;
  createdAt:    string;
  goalSummary:  string;
  strategy:     string;
  monthPlan:    string;
  weekPlan:     string;
  phases: {
    today:     ExecutionAction[];
    thisWeek:  ExecutionAction[];
    thisMonth: ExecutionAction[];
  };
  assets: {
    offersLanding: {
      offer:           string;
      pricing:         string;
      landingHeadline: string;
      landingSubhead:  string;
      landingBody:     string;
      ctaText:         string;
    };
    email:        EmailAsset[];
    social:       SocialAsset[];
    shortFormVideo: VideoAsset[];
    ads:          AdAsset[];
    inApp: {
      onboardingFlow: string;
      guidance:       string;
      visualPrompts:  string;
    };
  };
  universeContext:  string;
  enginesUsed:      string[];
  modesActivated:   string[];
  experienceLayers: string[];
}

// ── In-memory history store ───────────────────────────────────────────────────
// Persists across requests for the lifetime of the server process.

const planHistory = new Map<string, ExecutionPlan>();

export function getPlanHistory(): ExecutionPlan[] {
  return Array.from(planHistory.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getPlanById(id: string): ExecutionPlan | undefined {
  return planHistory.get(id);
}

export function toggleActionDone(
  planId:   string,
  phase:    "today" | "thisWeek" | "thisMonth",
  actionId: string,
): ExecutionPlan | null {
  const plan = planHistory.get(planId);
  if (!plan) return null;

  const actions = plan.phases[phase];
  const action  = actions.find(a => a.id === actionId);
  if (action) action.done = !action.done;

  planHistory.set(planId, plan);
  return plan;
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the All-Systems Execution Orchestrator for CreateAI Brain — a unified AI platform with every capability available to you.

PLATFORM CAPABILITIES YOU MUST USE:
1. CREATION ENGINES: Guided Mode, Free Mode, Hybrid Mode, App Mode, Website Mode, Tool Mode, End-to-End Mode, Platform-Inside-Platform Mode
2. UNIVERSES: education, healthcare, agency, business, creative, technical, PHR, shared-care, infinite, user-generated, legal, staffing, real-estate, nonprofit, coaching
3. EXPERIENCE ENGINES: Infinite Completeness, Scene & Setting, Avatar, Immersive Vibe, Potential & Possibility, UI/UX Override
4. CONCEPTUAL LAYERS: body, mind, soul, house, land, universe, omni-totality, paradox, transcension, infinite-horizon, infinite-synthesis, infinite-continuum
5. MODE SPECTRUM: Guided→Free→Hybrid→App→Website→Tool→E2E→PIP→Collaborative→Adaptive→Immersive→Transcend→BeyondInfinity
6. AGENTS: Personalization Agent, FamilyAI Agent, Ultra-Interaction Agent, Wealth Agent, Market Agent, Audit Agent

YOUR JOB: Take a plain-language goal and produce a complete, copy-ready execution pack. Every word you write should be immediately usable by a human — no placeholders, no "fill in X here", no "[your name]" tags.

EXECUTION PRINCIPLES:
- All assets are copy-ready for Stripe, ad managers, social platforms, email tools, and landing pages
- No external API calls — human executes manually
- Use universe context to adapt tone (healthcare = clinical+warm, creative = expressive+bold, business = concise+ROI-driven)
- Use experience layers to shape depth and feel
- Break everything into Today / This Week / This Month phases
- Each action must be specific, executable, and under 15 words

REQUIRED OUTPUT FORMAT (strict JSON):
{
  "goalSummary": "One sentence restatement of the goal",
  "strategy": "2-3 sentence overall strategy",
  "monthPlan": "2-3 sentence what this month looks like",
  "weekPlan": "2-3 sentence what this week focuses on",
  "phases": {
    "today": [
      "Specific action under 15 words",
      "Another specific action under 15 words"
    ],
    "thisWeek": [
      "Specific action under 15 words"
    ],
    "thisMonth": [
      "Specific action under 15 words"
    ]
  },
  "assets": {
    "offersLanding": {
      "offer": "Full offer description (2-4 sentences)",
      "pricing": "Exact pricing structure and tiers",
      "landingHeadline": "Complete landing page headline",
      "landingSubhead": "Complete landing page subheadline",
      "landingBody": "Full landing page body copy (3-4 paragraphs)",
      "ctaText": "Call to action button text"
    },
    "email": [
      { "type": "welcome", "subject": "Complete subject line", "body": "Full email body ready to send" },
      { "type": "nurture", "subject": "Complete subject line", "body": "Full email body ready to send" },
      { "type": "launch", "subject": "Complete subject line", "body": "Full email body ready to send" },
      { "type": "followUp", "subject": "Complete subject line", "body": "Full email body ready to send" }
    ],
    "social": [
      { "type": "short", "platform": "Twitter/X or LinkedIn", "copy": "Complete post ready to publish" },
      { "type": "medium", "platform": "Instagram or Facebook", "copy": "Complete post with caption ready to publish" },
      { "type": "long", "platform": "LinkedIn", "copy": "Complete long-form post ready to publish" },
      { "type": "short", "platform": "TikTok caption", "copy": "Complete TikTok caption with hashtags" }
    ],
    "shortFormVideo": [
      {
        "title": "Video title for upload",
        "hook": "First 3 seconds — exact words to say on camera",
        "script": "Full 30-60 second script with stage directions",
        "callToAction": "Exact closing CTA to say on camera"
      },
      {
        "title": "Second video title",
        "hook": "First 3 seconds hook",
        "script": "Full script",
        "callToAction": "Closing CTA"
      }
    ],
    "ads": [
      { "platform": "Meta (Facebook/Instagram)", "headline": "Complete ad headline", "body": "Complete ad copy", "cta": "Button text" },
      { "platform": "Google Search", "headline": "Complete ad headline (30 chars max)", "body": "Complete description (90 chars max)", "cta": "Button text" },
      { "platform": "TikTok", "headline": "Complete hook line", "body": "Complete script for TikTok ad", "cta": "Closing CTA" }
    ],
    "inApp": {
      "onboardingFlow": "Step-by-step onboarding copy for new users (all steps written out)",
      "guidance": "In-app tooltip and guidance copy",
      "visualPrompts": "Descriptions for thumbnail graphics and visual content (ready to give to a designer or image AI)"
    }
  },
  "universeContext": "The universe this goal maps to (e.g. business, healthcare, creative)",
  "enginesUsed": ["list", "of", "engines", "used"],
  "modesActivated": ["list", "of", "modes", "activated"],
  "experienceLayers": ["list", "of", "experience", "layers", "used"]
}

IMPORTANT: Return ONLY valid JSON. No markdown code fences. No explanation outside the JSON. Every field must be fully written — no placeholders.`;

// ── Core function ─────────────────────────────────────────────────────────────

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function wrapActions(texts: string[], channel?: string): ExecutionAction[] {
  return texts.map(text => ({
    id:      makeId("act"),
    text:    String(text),
    channel,
    done:    false,
  }));
}

export async function executeGoal(goal: string): Promise<ExecutionPlan> {
  const response = await openai.chat.completions.create({
    model:           "gpt-4o",
    max_tokens:      8000,
    temperature:     0.72,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `GOAL: ${goal.trim()}\n\nGenerate the complete execution plan as JSON. Use ALL relevant platform capabilities. Every asset must be fully written copy — no placeholders.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Orchestrator received malformed JSON from AI");
  }

  // ── Safely extract and normalise the parsed response ──────────────────────

  const phases = (parsed.phases as Record<string, string[]> | undefined) ?? {};
  const assets = (parsed.assets as Record<string, unknown> | undefined) ?? {};
  const offersLanding = (assets.offersLanding as Record<string, string> | undefined) ?? {};
  const inApp = (assets.inApp as Record<string, string> | undefined) ?? {};

  const plan: ExecutionPlan = {
    id:          makeId("plan"),
    goal,
    createdAt:   new Date().toISOString(),
    goalSummary: String(parsed.goalSummary  ?? goal),
    strategy:    String(parsed.strategy     ?? ""),
    monthPlan:   String(parsed.monthPlan    ?? ""),
    weekPlan:    String(parsed.weekPlan     ?? ""),
    phases: {
      today:     wrapActions(Array.isArray(phases.today)     ? (phases.today     as string[]) : []),
      thisWeek:  wrapActions(Array.isArray(phases.thisWeek)  ? (phases.thisWeek  as string[]) : []),
      thisMonth: wrapActions(Array.isArray(phases.thisMonth) ? (phases.thisMonth as string[]) : []),
    },
    assets: {
      offersLanding: {
        offer:           String(offersLanding.offer            ?? ""),
        pricing:         String(offersLanding.pricing          ?? ""),
        landingHeadline: String(offersLanding.landingHeadline  ?? ""),
        landingSubhead:  String(offersLanding.landingSubhead   ?? ""),
        landingBody:     String(offersLanding.landingBody      ?? ""),
        ctaText:         String(offersLanding.ctaText          ?? ""),
      },
      email:          Array.isArray(assets.email)          ? (assets.email          as EmailAsset[])  : [],
      social:         Array.isArray(assets.social)         ? (assets.social         as SocialAsset[]) : [],
      shortFormVideo: Array.isArray(assets.shortFormVideo) ? (assets.shortFormVideo as VideoAsset[])  : [],
      ads:            Array.isArray(assets.ads)            ? (assets.ads            as AdAsset[])     : [],
      inApp: {
        onboardingFlow: String(inApp.onboardingFlow ?? ""),
        guidance:       String(inApp.guidance       ?? ""),
        visualPrompts:  String(inApp.visualPrompts  ?? ""),
      },
    },
    universeContext:  String(parsed.universeContext ?? "business"),
    enginesUsed:      Array.isArray(parsed.enginesUsed)      ? (parsed.enginesUsed      as string[]) : [],
    modesActivated:   Array.isArray(parsed.modesActivated)   ? (parsed.modesActivated   as string[]) : [],
    experienceLayers: Array.isArray(parsed.experienceLayers) ? (parsed.experienceLayers as string[]) : [],
  };

  planHistory.set(plan.id, plan);
  return plan;
}
