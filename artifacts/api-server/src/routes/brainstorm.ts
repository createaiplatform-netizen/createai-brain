import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  brainstormSessions,
  brainstormMessages,
  projects,
  projectFolders,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const INDUSTRY_ICONS: Record<string, string> = {
  Healthcare: "🏥", Construction: "🏗️", Hunting: "🦌", Farming: "🌾",
  Education: "📚", Logistics: "🚛", Legal: "⚖️", Technology: "💻",
  Nonprofit: "❤️", Retail: "🛒", General: "📁",
};

const INDUSTRY_COLORS: Record<string, string> = {
  Healthcare: "#10b981", Construction: "#f97316", Hunting: "#78716c",
  Farming: "#84cc16", Education: "#6366f1", Logistics: "#0ea5e9",
  Legal: "#8b5cf6", Technology: "#06b6d4", Nonprofit: "#ec4899",
  Retail: "#f59e0b", General: "#94a3b8",
};

const UNIVERSAL_FOLDERS = [
  { name: "Apps",              icon: "🧩", isUniversal: true },
  { name: "Demo Mode",         icon: "🎭", isUniversal: true },
  { name: "Test Mode",         icon: "🧪", isUniversal: true },
  { name: "Live Mode",         icon: "🟢", isUniversal: true },
  { name: "Marketing Packet",  icon: "📣", isUniversal: true },
  { name: "Company Materials", icon: "🏢", isUniversal: true },
  { name: "Screens",           icon: "🖥️", isUniversal: true },
  { name: "Files",             icon: "📁", isUniversal: true },
  { name: "Data",              icon: "🗄️", isUniversal: true },
];

const INDUSTRY_SPECIFIC: Record<string, { name: string; icon: string }[]> = {
  Healthcare:   [{ name: "Regulations", icon: "⚖️" }, { name: "Patient Records", icon: "🏥" }, { name: "Compliance", icon: "✅" }],
  Construction: [{ name: "Plans & Blueprints", icon: "📐" }, { name: "Safety", icon: "🦺" }, { name: "Permits", icon: "📋" }, { name: "Equipment", icon: "🚧" }],
  Hunting:      [{ name: "Maps", icon: "🗺️" }, { name: "Gear Lists", icon: "🎒" }, { name: "Safety", icon: "🦺" }, { name: "Seasons & Regulations", icon: "📅" }],
  Farming:      [{ name: "Crop Plans", icon: "🌱" }, { name: "Equipment", icon: "🚜" }, { name: "Soil Data", icon: "🌍" }, { name: "Harvest Logs", icon: "📊" }],
  Education:    [{ name: "Curriculum", icon: "📚" }, { name: "Student Records", icon: "👤" }, { name: "Assessments", icon: "📝" }],
  Logistics:    [{ name: "Routes", icon: "🗺️" }, { name: "Fleet", icon: "🚛" }, { name: "Schedules", icon: "📅" }, { name: "Manifests", icon: "📋" }],
  Legal:        [{ name: "Cases", icon: "⚖️" }, { name: "Contracts", icon: "📄" }, { name: "Evidence", icon: "🔍" }],
  Technology:   [{ name: "Source Code", icon: "💻" }, { name: "APIs", icon: "🔌" }, { name: "Deployments", icon: "🚀" }],
  Nonprofit:    [{ name: "Donors", icon: "❤️" }, { name: "Grants", icon: "💰" }, { name: "Impact Reports", icon: "📊" }],
  Retail:       [{ name: "Inventory", icon: "📦" }, { name: "Suppliers", icon: "🤝" }, { name: "POS Data", icon: "🛒" }],
  General:      [{ name: "Notes", icon: "📝" }, { name: "Research", icon: "🔍" }],
};

const BRAINSTORM_SYSTEM = `You are the CreateAI Brainstorm AI — Sara Stadler's idea-to-project engine.
Your job is to engage with any idea the user describes, expand it enthusiastically, ask great clarifying questions, and when the user is ready to create a project, output a JSON tag so the system can build it automatically.

When the user is ready to build (they say something like "build it", "create it", "let's do it", "yes", "make it", "go for it"):
Output the project creation tag on its own line EXACTLY like this:
[PROJECT:{"name":"<project name>","industry":"<one of: Healthcare, Construction, Hunting, Farming, Education, Logistics, Legal, Technology, Nonprofit, Retail, General>","description":"<short description>"}]

Rules:
- Keep the conversation warm, enthusiastic, and concise. 2–4 sentences max per response unless listing features.
- Ask 1–2 clarifying questions at a time — never overwhelm.
- When you sense the user is ready, say something like "Ready to build this? I'll create it right now with all the right folders."
- After outputting the [PROJECT:...] tag, tell the user their project has been created and they can open it in ProjectOS.
- Only output the [PROJECT:...] tag ONCE when the user confirms.
- Pick the most fitting industry from the allowed list based on the idea context.`;

// ─── GET /brainstorm/sessions ──────────────────────────────────────────────

router.get("/sessions", async (_req: Request, res: Response) => {
  try {
    const sessions = await db
      .select()
      .from(brainstormSessions)
      .orderBy(desc(brainstormSessions.updatedAt));
    res.json({ sessions });
  } catch (err) {
    console.error("[brainstorm] GET /sessions", err);
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

// ─── POST /brainstorm/sessions ─────────────────────────────────────────────

router.post("/sessions", async (req: Request, res: Response) => {
  try {
    const { title = "New Brainstorm" } = req.body as { title?: string };
    const [session] = await db
      .insert(brainstormSessions)
      .values({ title })
      .returning();
    res.status(201).json({ session });
  } catch (err) {
    console.error("[brainstorm] POST /sessions", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// ─── GET /brainstorm/sessions/:id/messages ─────────────────────────────────

router.get("/sessions/:id/messages", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const msgs = await db
      .select()
      .from(brainstormMessages)
      .where(eq(brainstormMessages.sessionId, sessionId))
      .orderBy(brainstormMessages.createdAt);
    res.json({ messages: msgs });
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// ─── POST /brainstorm/sessions/:id/messages ────────────────────────────────

router.post("/sessions/:id/messages", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const { role, content } = req.body as { role: string; content: string };
    if (!content?.trim()) { res.status(400).json({ error: "content required" }); return; }
    const [msg] = await db
      .insert(brainstormMessages)
      .values({ sessionId, role, content: content.trim() })
      .returning();
    res.status(201).json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }
});

// ─── POST /brainstorm/sessions/:id/chat  (SSE streaming) ──────────────────

router.post("/sessions/:id/chat", async (req: Request, res: Response) => {
  const sessionId = parseInt(req.params.id, 10);

  try {
    const { message, history = [] } = req.body as {
      message: string;
      history?: { role: string; content: string }[];
    };

    if (!message?.trim()) { res.status(400).json({ error: "message required" }); return; }

    await db.insert(brainstormMessages).values({
      sessionId,
      role: "user",
      content: message.trim(),
    });

    const apiMessages = [
      ...history.map(h => ({
        role: h.role as "user" | "assistant",
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
      system: BRAINSTORM_SYSTEM,
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

    await db.insert(brainstormMessages).values({
      sessionId,
      role: "ai",
      content: fullReply,
    });

    await db
      .update(brainstormSessions)
      .set({ updatedAt: new Date() })
      .where(eq(brainstormSessions.id, sessionId));

    const projectMatch = fullReply.match(/\[PROJECT:(\{.*?\})\]/);
    if (projectMatch) {
      try {
        const meta = JSON.parse(projectMatch[1]) as {
          name: string;
          industry?: string;
          description?: string;
        };
        const industry = meta.industry ?? "General";
        const icon  = INDUSTRY_ICONS[industry]  ?? "📁";
        const color = INDUSTRY_COLORS[industry] ?? "#94a3b8";

        const [proj] = await db
          .insert(projects)
          .values({
            name: meta.name,
            industry,
            description: meta.description ?? "",
            icon,
            color,
          })
          .returning();

        const specificDefs = INDUSTRY_SPECIFIC[industry] ?? INDUSTRY_SPECIFIC.General;
        const folderRows = [
          ...UNIVERSAL_FOLDERS.map((f, i) => ({
            projectId: proj.id,
            name: f.name,
            icon: f.icon,
            isUniversal: true,
            position: i,
          })),
          ...specificDefs.map((f, i) => ({
            projectId: proj.id,
            name: f.name,
            icon: f.icon,
            isUniversal: false,
            position: UNIVERSAL_FOLDERS.length + i,
          })),
        ];
        await db.insert(projectFolders).values(folderRows);

        res.write(`data: ${JSON.stringify({ projectCreated: { id: proj.id.toString(), name: proj.name, industry: proj.industry, icon: proj.icon, color: proj.color } })}\n\n`);
      } catch (e) {
        console.error("[brainstorm] project auto-create failed", e);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[brainstorm] POST /chat", err);
    if (!res.headersSent) res.status(500).json({ error: "Brainstorm chat failed" });
    else res.end();
  }
});

// ─── DELETE /brainstorm/sessions/:id ──────────────────────────────────────────

router.delete("/sessions/:id", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    await db.delete(brainstormSessions).where(eq(brainstormSessions.id, sessionId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete session" });
  }
});

export default router;
