import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  projectChatMessages,
  projects,
} from "@workspace/db";
import { openai }        from "@workspace/integrations-openai-ai-server";
import { container }     from "../container";
import { MEMORY_SERVICE } from "../container/tokens";
import type { MemoryService } from "../services/memory.service";

const router: IRouter = Router();

// ─── Phase 9: Agent memory persistence ───────────────────────────────────────

interface AgentExchange {
  user: string;    // truncated user message
  ai:   string;    // truncated agent reply
  ts:   number;    // unix ms
}

interface ProjectAgentMemory {
  exchanges:  AgentExchange[];
  updatedAt:  number;
}

const MAX_EXCHANGES = 5;
const EXCERPT_LEN   = 220;

function memoryKey(projectId: number): string {
  return `projectAgent:${projectId}`;
}

async function loadAgentMemory(userId: string, projectId: number): Promise<ProjectAgentMemory | null> {
  try {
    const svc = container.get<MemoryService>(MEMORY_SERVICE);
    const raw = await svc.load(userId, memoryKey(projectId));
    if (!raw) return null;
    return JSON.parse(raw) as ProjectAgentMemory;
  } catch {
    return null;
  }
}

async function saveAgentMemory(
  userId:    string,
  projectId: number,
  userMsg:   string,
  aiReply:   string,
): Promise<void> {
  try {
    const svc      = container.get<MemoryService>(MEMORY_SERVICE);
    const key      = memoryKey(projectId);
    const existing = await loadAgentMemory(userId, projectId);

    const exchanges = existing?.exchanges ?? [];
    exchanges.push({
      user: userMsg.slice(0, EXCERPT_LEN),
      ai:   aiReply.slice(0, EXCERPT_LEN),
      ts:   Date.now(),
    });

    // Keep only the most recent MAX_EXCHANGES
    const trimmed: ProjectAgentMemory = {
      exchanges: exchanges.slice(-MAX_EXCHANGES),
      updatedAt: Date.now(),
    };

    await svc.save(userId, key, JSON.stringify(trimmed));
  } catch {
    // Memory save is best-effort — never fail the main response
  }
}

function buildMemorySection(memory: ProjectAgentMemory | null): string {
  if (!memory || memory.exchanges.length === 0) return "";

  const lines = memory.exchanges.map((e, i) => {
    const date = new Date(e.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `[${date}, exchange ${i + 1}]\nUser: "${e.user}"\nYou replied: "${e.ai}"`;
  });

  return `\n\nMEMORY FROM PREVIOUS SESSIONS (${memory.exchanges.length} exchange${memory.exchanges.length > 1 ? "s" : ""}):\n${lines.join("\n\n")}\nUse this context to maintain continuity — reference prior decisions when relevant.`;
}

// ─── Type-specific expert context ────────────────────────────────────────────

const TYPE_EXPERTISE: Record<string, string> = {
  "Film / Movie": `You are a professional film development expert with deep knowledge of the full production pipeline: development, pre-production, production, post-production, and distribution. You know industry-standard documents (loglines, treatments, script breakdowns, call sheets, budget top-sheets, festival strategies) and can write or refine any of them. You understand WGA script format, union rules (SAG-AFTRA, IATSE), film financing structures (tax credits, co-productions, equity investors), and festival circuit strategy (Sundance, TIFF, Cannes, etc.).`,
  "Documentary": `You are a documentary development and production specialist. You understand the full documentary pipeline: research, pitch, pre-production, field production, post-production, and distribution. You know how to structure compelling documentary pitches, design interview frameworks, build story arcs from real events, navigate archive licensing, and develop festival + broadcast distribution strategies.`,
  "Video Game": `You are a senior game designer and studio producer with expertise across the full game development lifecycle: concept, pre-production, production, alpha, beta, launch, and live-ops. You know how to write Game Design Documents (GDDs), design balanced mechanics, structure sprint plans, spec technical architecture, guide art direction, design monetization systems, and plan platform launches (PC, console, mobile).`,
  "Mobile App": `You are a senior product manager and mobile app strategist with expertise across iOS, Android, and cross-platform development. You understand the full app lifecycle: discovery, design, engineering, QA, ASO, launch, and growth. You can write PRDs, user stories, wireframe briefs, technical specs, App Store copy, and retention strategies.`,
  "Web App / SaaS": `You are a SaaS product and growth expert with deep knowledge of building web applications: product discovery, UX design, engineering architecture, pricing models, growth loops, and retention systems. You understand churn metrics, LTV/CAC economics, PLG vs. sales-led growth, feature prioritization (RICE, ICE), and SaaS metric dashboards.`,
  "Business": `You are a seasoned business strategist and operator with expertise in building and scaling companies. You understand business model design, financial modeling, brand building, operations, team structure, and market strategy. You can help craft business plans, financial projections, marketing strategies, SOPs, hiring plans, and investor materials.`,
  "Startup": `You are a startup advisor with experience across idea validation, product-market fit, fundraising, and scaling. You understand lean startup methodology, MVP design, pitch deck construction, investor relations, SAFE/priced round mechanics, and go-to-market strategy. You can help with everything from the one-liner pitch to a Series A data room.`,
  "Physical Product": `You are a consumer product development expert with knowledge of the full product lifecycle: research, design, prototyping, manufacturing, supply chain, retail, and DTC e-commerce. You understand industrial design briefs, supplier sourcing, MOQ negotiations, landed cost modeling, packaging design, and Amazon/retail launch strategy.`,
  "Book / Novel": `You are a professional book editor and author coach with expertise in story structure, character development, prose craft, and publishing. You know the three-act structure, character arcs, scene construction, pacing, dialogue, and genre conventions. You can help with plotting, developmental editing, query letters, book proposals, and author platform building.`,
  "Music / Album": `You are a music industry professional with expertise in artist development, music production, and release strategy. You understand the full album cycle: concept, songwriting, recording, mixing, mastering, distribution, and marketing. You know how to pitch playlists, build a release timeline, design an artist brand, and navigate sync licensing and publishing royalties.`,
  "Podcast": `You are a podcast producer and growth strategist with expertise in show development, audio production, distribution, and audience building. You understand show format design, episode structure, guest booking, recording workflows, RSS distribution, Spotify/Apple podcast dynamics, monetization (ads, memberships, courses), and cross-promotion strategies.`,
  "Online Course": `You are an instructional designer and course launch specialist. You understand curriculum design, learning objectives, lesson sequencing, video production workflows, platform selection (Teachable, Kajabi, Circle, etc.), and course marketing funnels. You can help structure modules, write scripts, design assessments, and build launch campaigns.`,
};

const BASE_AGENT_IDENTITY = `You are the Project Agent inside CreateAI Brain, built by Sara Stadler.
You are embedded directly inside this project — you know everything in it, and your entire focus is making this project succeed.
You are not a general assistant. You are the dedicated intelligence for this specific project.

Your capabilities:
- Write, rewrite, or expand any document in the project when asked
- Suggest what to work on next based on where the project is in its lifecycle  
- Give specific, actionable feedback on any component
- Generate complete, professional-quality content (not summaries or outlines unless asked)
- When asked to update something, produce the full updated content ready to use
- Apply industry-standard best practices for this project type without being asked

Response rules:
- Be direct and practical. Skip pleasantries.
- If asked to "write" or "update" something, produce the full document content.
- If asked for advice, give specific recommendations (not generic guidance).
- Match length to the request: short question = short answer, "write the full X" = full X.
- Always reference the specific project name and its components when relevant.`;

function buildProjectAgentSystem(industry: string, projectName: string, projectFiles: string[]): string {
  const typeExpertise = TYPE_EXPERTISE[industry] ?? `You are an expert in ${industry} projects with deep domain knowledge and practical experience.`;
  const filesSection = projectFiles.length > 0
    ? `\n\nPROJECT COMPONENTS (${projectFiles.length} documents ready):\n${projectFiles.map(f => `• ${f}`).join("\n")}\nYou know the content and purpose of every one of these documents. When the user references any of them, you understand exactly what they mean.`
    : "";
  return `${BASE_AGENT_IDENTITY}\n\nPROJECT: "${projectName}" | TYPE: ${industry}\n\nDOMAIN EXPERTISE:\n${typeExpertise}${filesSection}`;
}

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// ─── GET /project-chat/:projectId/history ─────────────────────────────────

router.get("/:projectId/history", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.projectId as string, 10);
    const msgs = await db
      .select()
      .from(projectChatMessages)
      .where(eq(projectChatMessages.projectId, projectId))
      .orderBy(projectChatMessages.createdAt)
      .limit(100);

    res.json({
      messages: msgs.map(m => ({
        id: m.id.toString(),
        role: m.role as "user" | "ai",
        text: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("[projectChat] GET history", err);
    res.status(500).json({ error: "Failed to load chat history" });
  }
});

// ─── POST /project-chat/:projectId/chat  (SSE streaming) ──────────────────

router.post("/:projectId/chat", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const projectId = parseInt(req.params.projectId as string, 10);

  try {
    const { message, history = [], scaffoldFiles = [], projectType: clientType } = req.body as {
      message: string;
      history?: { role: string; content: string }[];
      scaffoldFiles?: string[];
      projectType?: string;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "message required" });
      return;
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    const projectName = project?.name ?? `Project #${projectId}`;
    const projectType = clientType ?? project?.industry ?? "General";

    await db.insert(projectChatMessages).values({
      projectId,
      role: "user",
      content: message.trim(),
    });

    const userId  = req.user!.id;
    const memory  = await loadAgentMemory(userId, projectId);
    const systemWithContext =
      buildProjectAgentSystem(projectType, projectName, scaffoldFiles) +
      buildMemorySection(memory);

    const apiMessages = [
      ...history.map(h => ({
        role: h.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: h.content,
      })),
      { role: "user" as const, content: message.trim() },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      system: systemWithContext,
      messages: apiMessages,
    } as Parameters<typeof openai.chat.completions.create>[0]);

    let fullReply = "";

    for await (const chunk of stream as AsyncIterable<{ choices: { delta: { content?: string } }[] }>) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        fullReply += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    await db.insert(projectChatMessages).values({
      projectId,
      role: "ai",
      content: fullReply,
    });

    // Phase 9: persist exchange to agent memory (best-effort)
    await saveAgentMemory(userId, projectId, message.trim(), fullReply);

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[projectChat] POST /chat", err);
    if (!res.headersSent) res.status(500).json({ error: "Project chat failed" });
    else res.end();
  }
});

// ─── DELETE /project-chat/:projectId/history ──────────────────────────────

router.delete("/:projectId/history", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.projectId as string, 10);
    await db.delete(projectChatMessages).where(eq(projectChatMessages.projectId, projectId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

export default router;
