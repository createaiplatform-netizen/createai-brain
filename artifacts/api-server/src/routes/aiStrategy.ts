import { Router, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { aiStrategy } from "../services/domainEngines2.js";

const router = Router();

router.get("/",       (_req, res) => res.json({ ok: true, ...aiStrategy.stats(), recent: aiStrategy.list().slice(0, 5) }));
router.get("/stats",  (_req, res) => res.json({ ok: true, ...aiStrategy.stats() }));
router.get("/list",   (_req, res) => res.json({ ok: true, strategies: aiStrategy.list() }));

router.post("/generate", async (req: Request, res: Response) => {
  const { topic, context, industry, mode } = req.body as {
    topic: string; context: string; industry: string;
    mode: "analyze" | "plan" | "compete" | "grow" | "pivot";
  };

  if (!topic) { res.status(400).json({ error: "topic required" }); return; }

  const modePrompts: Record<string, string> = {
    analyze: "Analyze the current state, key strengths, weaknesses, opportunities, and threats.",
    plan:    "Create a concrete 90-day action plan with milestones and KPIs.",
    compete: "Map the competitive landscape and provide differentiation strategies.",
    grow:    "Identify the top 5 highest-leverage growth levers with execution steps.",
    pivot:   "Evaluate pivot options and recommend the strongest strategic direction.",
  };

  const systemPrompt = `You are CreateAI Brain's Strategic Intelligence Engine — a world-class business strategy advisor for Lakeside Trinity LLC (CreateAI Digital). You think like McKinsey, move like a startup, and operate like a Fortune 500 strategist.

Industry focus: ${industry || "General Business"}
Operating context: CreateAI Brain platform — autonomous revenue generation, multi-domain operations, AI-first tooling.

Provide responses that are:
- Immediately actionable with specific next steps
- Grounded in market reality, not theory
- Optimized for Sara Stadler's business goals (owner, Lakeside Trinity LLC)
- Formatted with clear headers, bullets, and metrics where applicable`;

  const userPrompt = `Topic: ${topic}
${context ? `Context: ${context}` : ""}

${modePrompts[mode ?? "analyze"]}

Provide a comprehensive strategic response.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const output = completion.choices[0]?.message?.content ?? "No response generated";
    const tokensUsed = completion.usage?.total_tokens ?? 0;

    const record = aiStrategy.record({ topic, context, industry, mode, output, tokensUsed, model: "gpt-4o" });
    res.json({ ok: true, strategy: record, output, tokensUsed });
  } catch (err: any) {
    const errorMsg = err?.message ?? "AI generation failed";
    // Still record the attempt with error info
    const record = aiStrategy.record({ topic, context, industry, mode, output: `Error: ${errorMsg}`, tokensUsed: 0, model: "gpt-4o" });
    res.status(500).json({ ok: false, error: errorMsg, record });
  }
});

export default router;
