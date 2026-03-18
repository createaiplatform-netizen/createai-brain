import { Router } from "express";
import { db, opportunities } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logTractionEvent } from "../lib/tractionLogger";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function runStage(systemPrompt: string, userContent: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userContent  },
    ],
    temperature: 0.7,
    max_tokens:  1800,
  });
  return res.choices[0]?.message?.content ?? "";
}

function parseJSON<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) as T : fallback;
  } catch { return fallback; }
}

// ─── System prompts ───────────────────────────────────────────────────────────

const SIGNAL_ANALYSIS_PROMPT = `You are a B2B market intelligence analyst and lead generation strategist.

When given any input — an idea, product description, content, pitch, or context — extract a structured signal profile that will drive the entire lead generation cycle.

Respond ONLY with JSON in this exact shape:
{
  "businessContext": "concise 1-sentence summary of what's being offered",
  "icp": {
    "companySize": "startup | smb | mid-market | enterprise",
    "industries": ["industry1", "industry2", "industry3"],
    "buyerPersonas": ["persona1", "persona2"],
    "geographies": ["region1", "region2"],
    "techStack": ["relevant_tech1", "relevant_tech2"],
    "urgencySignals": ["signal1", "signal2", "signal3"]
  },
  "painPoints": ["pain1", "pain2", "pain3", "pain4"],
  "valueProposition": "clear statement of the unique value offered",
  "competitiveAngle": "what makes this stand out vs alternatives",
  "keywordTriggers": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "idealDealSize": "$ estimate or range",
  "salesMotion": "PLG | SLG | hybrid | inbound | outbound",
  "urgency": "high | medium | low",
  "readinessScore": 0-100
}`;

const LEAD_IDENTIFICATION_PROMPT = `You are an expert B2B sales development representative with deep expertise in lead research and qualification.

Given a signal analysis profile, generate 8 highly qualified, realistic leads. Each lead must be specific and plausible.

Respond ONLY with JSON in this exact shape:
{
  "leads": [
    {
      "id": "lead_1",
      "firstName": "string",
      "lastName": "string",
      "role": "exact job title",
      "company": "real-sounding company name",
      "companySize": "1-10 | 11-50 | 51-200 | 201-500 | 501-2000 | 2000+",
      "industry": "string",
      "linkedin": "linkedin.com/in/firstname-lastname-company",
      "email": "firstname@companydomain.com",
      "location": "City, Country",
      "fitScore": 0-100,
      "priority": "Critical | High | Medium | Low",
      "primaryPain": "specific pain point this lead has",
      "triggerEvent": "recent event that makes them ready to buy now",
      "estimatedValue": "$X,000 - $X,000",
      "approachAngle": "one-sentence hook for outreach",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Generate exactly 8 leads. Vary industries and company sizes. Make them realistic and specific.`;

const OUTREACH_PROMPT = `You are a world-class B2B sales copywriter who writes emails that get replies.

Given a signal analysis and the top leads, write personalized cold outreach for the top 3 leads (sorted by fitScore, highest first).

Rules:
- Subject line: under 50 chars, curiosity-driven, no spam words
- Email body: 4-6 sentences max, hyper-personalized, reference their specific trigger event
- End with ONE clear CTA — a 15-minute call or specific question
- No fluff, no buzzwords, no "I hope this finds you well"
- Tone: confident, peer-to-peer, not salesy

Respond ONLY with JSON:
{
  "outreach": [
    {
      "leadId": "lead_1",
      "leadName": "Full Name",
      "company": "Company Name",
      "subject": "subject line here",
      "body": "full email body here (use \\n for line breaks)",
      "followUpDay3": "short 2-sentence follow-up for day 3",
      "followUpDay7": "short 2-sentence follow-up for day 7",
      "channel": "email | linkedin | both"
    }
  ]
}`;

const DELIVERABLE_PROMPT = `You are a senior business consultant and deal strategist.

Given a signal analysis and lead profile, create ONE complete, ready-to-send business deliverable — a full proposal one-pager that can be attached to the outreach email.

Include:
- Executive summary (2-3 sentences)
- Problem statement (3 bullet points)
- Solution overview (3-4 bullet points)  
- Why us / differentiators (3 bullet points)
- Proof points / social proof (2-3 bullets — can be hypothetical for demo)
- Engagement options (3 tiers: Starter, Growth, Enterprise — with approximate investment ranges)
- Next steps (numbered list of 3)
- CTA line

Respond ONLY with JSON:
{
  "deliverable": {
    "type": "Proposal One-Pager",
    "title": "string",
    "executiveSummary": "string",
    "problemStatement": ["bullet1", "bullet2", "bullet3"],
    "solutionOverview": ["bullet1", "bullet2", "bullet3", "bullet4"],
    "differentiators": ["bullet1", "bullet2", "bullet3"],
    "proofPoints": ["bullet1", "bullet2", "bullet3"],
    "engagementTiers": [
      { "name": "Starter",    "price": "$X,000/mo", "includes": ["feature1", "feature2"] },
      { "name": "Growth",     "price": "$X,000/mo", "includes": ["feature1", "feature2", "feature3"] },
      { "name": "Enterprise", "price": "Custom",    "includes": ["feature1", "feature2", "feature3", "feature4"] }
    ],
    "nextSteps": ["step1", "step2", "step3"],
    "ctaLine": "string"
  }
}`;

// ─── POST /api/lead-cycle/run ─────────────────────────────────────────────────
router.post("/run", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { input } = req.body as { input?: string };
  if (!input?.trim()) { res.status(400).json({ error: "input is required" }); return; }

  try {
    // ── Stage 1: Signal Analysis ──────────────────────────────────────────────
    const stage1Raw = await runStage(SIGNAL_ANALYSIS_PROMPT, `Analyze this input for lead generation:\n\n${input}`);
    const signals = parseJSON<Record<string, unknown>>(stage1Raw, {});

    // ── Stage 2: Lead Identification ──────────────────────────────────────────
    const stage2Input = `Signal Profile:\n${JSON.stringify(signals, null, 2)}\n\nOriginal Input:\n${input}`;
    const stage2Raw = await runStage(LEAD_IDENTIFICATION_PROMPT, stage2Input);
    const leadData  = parseJSON<{ leads?: RawLead[] }>(stage2Raw, { leads: [] });
    const leads     = leadData.leads ?? [];

    // ── Stage 3: Opportunity Creation — persist top leads to DB ──────────────
    const sortedLeads = [...leads].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
    const createdOpps: number[] = [];

    for (const lead of sortedLeads.slice(0, 6)) {
      const [opp] = await db.insert(opportunities).values({
        userId:         req.user.id,
        title:          `${lead.firstName} ${lead.lastName} — ${lead.company}`,
        description:    `${lead.role} at ${lead.company} (${lead.industry}). Primary pain: ${lead.primaryPain}. Trigger: ${lead.triggerEvent}`,
        type:           "Lead",
        status:         "New",
        priority:       lead.priority ?? "Medium",
        score:          lead.fitScore ?? 50,
        market:         lead.industry,
        estimatedValue: lead.estimatedValue,
        confidence:     (lead.fitScore ?? 0) >= 75 ? "High" : (lead.fitScore ?? 0) >= 50 ? "Medium" : "Low",
        source:         "Lead Cycle Engine",
        aiInsight:      lead.approachAngle,
        tags:           (lead.tags ?? []).join(","),
        isStarred:      (lead.fitScore ?? 0) >= 85,
      }).returning({ id: opportunities.id });
      createdOpps.push(opp.id);
    }

    // ── Stage 4: Outreach Generation ──────────────────────────────────────────
    const top3  = sortedLeads.slice(0, 3);
    const stage4Input = `Signal Profile:\n${JSON.stringify(signals, null, 2)}\n\nTop 3 Leads:\n${JSON.stringify(top3, null, 2)}`;
    const stage4Raw   = await runStage(OUTREACH_PROMPT, stage4Input);
    const outreachData = parseJSON<{ outreach?: OutreachItem[] }>(stage4Raw, { outreach: [] });
    const outreach     = outreachData.outreach ?? [];

    // ── Stage 5: Deliverable Creation ─────────────────────────────────────────
    const stage5Input = `Signal Profile:\n${JSON.stringify(signals, null, 2)}\n\nTop Lead:\n${JSON.stringify(sortedLeads[0] ?? {}, null, 2)}`;
    const stage5Raw   = await runStage(DELIVERABLE_PROMPT, stage5Input);
    const deliverableData = parseJSON<{ deliverable?: Deliverable }>(stage5Raw, {});
    const deliverable = deliverableData.deliverable ?? null;

    // ── Log traction event ────────────────────────────────────────────────────
    logTractionEvent({
      userId:    req.user.id,
      eventType: "engine_run",
      category:  "lead-cycle",
      metadata:  { engine: "lead-cycle", leadsGenerated: leads.length, oppsCreated: createdOpps.length },
    });

    res.json({
      success:         true,
      cycleId:         `lc_${Date.now()}`,
      input:           input.slice(0, 120) + (input.length > 120 ? "…" : ""),
      signals,
      leads:           sortedLeads,
      opportunityIds:  createdOpps,
      outreach,
      deliverable,
      meta: {
        leadsGenerated:  leads.length,
        oppsCreated:     createdOpps.length,
        outreachDrafted: outreach.length,
        timestamp:       new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("POST /lead-cycle/run error:", err);
    res.status(500).json({ error: "Lead cycle failed", detail: String(err) });
  }
});

// ─── GET /api/lead-cycle/history ─────────────────────────────────────────────
router.get("/history", async (req, res) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const list = await db.query.opportunities.findMany({
      where: (o, { and, eq }) => and(eq(o.userId, req.user!.id), eq(o.source, "Lead Cycle Engine")),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: 50,
    });
    res.json({ opportunities: list });
  } catch (err) {
    console.error("GET /lead-cycle/history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface RawLead {
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

export default router;
