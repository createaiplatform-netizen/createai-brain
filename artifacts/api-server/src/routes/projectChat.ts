import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  projectChatMessages,
  projects,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const PROJECT_CHAT_SYSTEM = `You are a Project AI Chat assistant embedded inside the CreateAI Brain platform, built by Sara Stadler.
You are helping the user work on a specific project. You know the project name and industry context.
Your job: help plan files, suggest folder structures, brainstorm features, help write content, and think through next steps.
Be concise, practical, and encouraging. 2–4 sentences per response unless the user asks for a list or detailed plan.
Always relate your suggestions back to the specific project context provided.`;

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
    const projectId = parseInt(req.params.projectId, 10);
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
  const projectId = parseInt(req.params.projectId, 10);

  try {
    const { message, history = [] } = req.body as {
      message: string;
      history?: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "message required" });
      return;
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    const projectContext = project
      ? `Project: "${project.name}" | Industry: ${project.industry} | Description: ${project.description || "No description"}`
      : `Project ID: ${projectId}`;

    await db.insert(projectChatMessages).values({
      projectId,
      role: "user",
      content: message.trim(),
    });

    const systemWithContext = `${PROJECT_CHAT_SYSTEM}\n\nCurrent project context:\n${projectContext}`;

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
    const projectId = parseInt(req.params.projectId, 10);
    await db.delete(projectChatMessages).where(eq(projectChatMessages.projectId, projectId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

export default router;
