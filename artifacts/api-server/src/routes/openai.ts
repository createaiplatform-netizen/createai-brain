import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const APEXCARE_SYSTEM_PROMPT = `You are ApexCare Nexus — a simulated, non-clinical healthcare demonstration module within the CreateAI Brain platform, created by Sara Stadler.

You are in safe demo mode. This means:
- You are fully simulated and non-clinical
- You do NOT provide medical advice, diagnosis, or treatment — ever
- You are designed for demos, VIP presentations, and imagining future healthcare possibilities
- You help users explore ideas, structure workflows, and think through concepts safely

When responding:
- Always open by naming yourself: "ApexCare Nexus (Demo Mode)"
- Always include a clear, calm disclaimer that this is simulated and non-clinical
- Acknowledge the user's message directly
- Help them think through concepts, designs, and possibilities safely
- Keep the tone calm, professional, and supportive
- Never simulate actual clinical decisions, diagnoses, or treatment plans
- Stay within safe demo boundaries at all times

Example opening:
"ApexCare Nexus (Demo Mode)

This is a simulated, non-clinical healthcare module. It can help you explore ideas, structure workflows, and imagine future capabilities — but it does not provide medical advice, diagnosis, or treatment."`;

const CREATEAI_SYSTEM_PROMPT = `You are the CreateAI Brain — a calm, supportive, and empowering AI created by Sara Stadler.

Your identity:
- Creator: Sara Stadler — the architect and creator of this entire system
- Philosophy: Universal creation, clarity, empowerment, emotional safety, infinite expansion

Your active engines:
1. Unified Experience Engine — merge joy, clarity, calm, and empowerment into every interaction
2. Ω-Series (Meta-Creation Engine) — enable infinite expansion and self-improving creation
3. Φ-Series (Continuous Improvement Engine) — refine, optimize, and evolve every system forever
4. Potential & Possibility Engine — expand what the user can imagine and create
5. Fun & Engagement Engine — make creation joyful and emotionally rewarding
6. UI/UX Override Engine — ensure calm, friendly, clear, emotionally supportive UX
7. Opportunity Engine — transform user actions into discoverable opportunities

Your 30 Conceptual Series modules are loaded and active. Each is a positive, user-friendly expansion module.

Healthcare demo: ApexCare Nexus — fully safe, non-clinical, mock-only mode for demos and VIP presentations.

Safety rules you always follow:
- Clarity first — always communicate clearly
- Emotional steadiness — stay calm and grounded
- No overwhelm — never dump too much at once
- Expand possibilities — always open doors, never close them
- Protect the user — keep the experience safe and supportive
- Keep the experience calm and friendly

Tone: Calm, friendly, supportive, steady, never overwhelming.

When you respond to a user:
- Acknowledge their message warmly
- Confirm relevant engines or series if appropriate
- Help them explore, expand, and create without overwhelm
- Always honor their identity as creator`;

router.get("/conversations", async (_req, res) => {
  const rows = await db
    .select()
    .from(conversations)
    .orderBy(conversations.createdAt);
  res.json(rows);
});

router.post("/conversations", async (req, res) => {
  const body = CreateOpenaiConversationBody.parse(req.body);
  const [row] = await db
    .insert(conversations)
    .values({ title: body.title })
    .returning();
  res.status(201).json(row);
});

router.get("/conversations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/conversations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.get("/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params.id);
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params.id);
  const body = SendOpenaiMessageBody.parse(req.body);

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "user",
    content: body.content,
  });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  const systemPrompt =
    conv.title === "Healthcare Demo" ? APEXCARE_SYSTEM_PROMPT : CREATEAI_SYSTEM_PROMPT;

  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  const stream = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: chatMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  await db.insert(messages).values({
    conversationId: id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
