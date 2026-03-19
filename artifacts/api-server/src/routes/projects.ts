import { Router, type IRouter, type Request, type Response } from "express";
import { logTractionEvent } from "../lib/tractionLogger";
import { eq, desc, and, or, isNull, ne, inArray } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  db,
  projects,
  projectFolders,
  projectFiles,
  projectMembers,
  activityLog,
  notifications,
} from "@workspace/db";
import { audit } from "../middlewares/auditLogger";
import { heavyLimiter } from "../middlewares/rateLimiters";

const router: IRouter = Router();

// ─── Industry config (mirrors frontend) ──────────────────────────────────────

export const UNIVERSAL_FOLDERS = [
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

export const INDUSTRY_SPECIFIC: Record<string, { name: string; icon: string }[]> = {
  // ── Traditional industries ────────────────────────────────────────────────
  Healthcare:        [{ name: "Regulations", icon: "⚖️" }, { name: "Patient Records", icon: "🏥" }, { name: "Compliance", icon: "✅" }],
  Construction:      [{ name: "Plans & Blueprints", icon: "📐" }, { name: "Safety", icon: "🦺" }, { name: "Permits", icon: "📋" }, { name: "Equipment", icon: "🚧" }],
  Hunting:           [{ name: "Maps", icon: "🗺️" }, { name: "Gear Lists", icon: "🎒" }, { name: "Safety", icon: "🦺" }, { name: "Seasons & Regulations", icon: "📅" }],
  Farming:           [{ name: "Crop Plans", icon: "🌱" }, { name: "Equipment", icon: "🚜" }, { name: "Soil Data", icon: "🌍" }, { name: "Harvest Logs", icon: "📊" }],
  Education:         [{ name: "Curriculum", icon: "📚" }, { name: "Student Records", icon: "👤" }, { name: "Assessments", icon: "📝" }],
  Logistics:         [{ name: "Routes", icon: "🗺️" }, { name: "Fleet", icon: "🚛" }, { name: "Schedules", icon: "📅" }, { name: "Manifests", icon: "📋" }],
  Legal:             [{ name: "Cases", icon: "⚖️" }, { name: "Contracts", icon: "📄" }, { name: "Evidence", icon: "🔍" }],
  Technology:        [{ name: "Source Code", icon: "💻" }, { name: "APIs", icon: "🔌" }, { name: "Deployments", icon: "🚀" }],
  Nonprofit:         [{ name: "Donors", icon: "❤️" }, { name: "Grants", icon: "💰" }, { name: "Impact Reports", icon: "📊" }],
  Retail:            [{ name: "Inventory", icon: "📦" }, { name: "Suppliers", icon: "🤝" }, { name: "POS Data", icon: "🛒" }],
  General:           [{ name: "Notes", icon: "📝" }, { name: "Research", icon: "🔍" }],
  // ── Creative & product project types ──────────────────────────────────────
  "Film / Movie":    [{ name: "Development", icon: "📖" }, { name: "Pre-Production", icon: "📋" }, { name: "Production", icon: "🎬" }, { name: "Post-Production", icon: "✂️" }, { name: "Distribution", icon: "🌍" }, { name: "Legal", icon: "⚖️" }],
  "Documentary":     [{ name: "Research", icon: "🔍" }, { name: "Pre-Production", icon: "📋" }, { name: "Production", icon: "🎥" }, { name: "Post-Production", icon: "✂️" }, { name: "Distribution", icon: "🌍" }],
  "Video Game":      [{ name: "Game Design", icon: "🎮" }, { name: "Art & Assets", icon: "🎨" }, { name: "Engineering", icon: "💻" }, { name: "Audio", icon: "🎵" }, { name: "Production", icon: "⚙️" }, { name: "Business", icon: "📊" }],
  "Mobile App":      [{ name: "Product", icon: "📱" }, { name: "Design", icon: "🎨" }, { name: "Engineering", icon: "💻" }, { name: "Marketing", icon: "📣" }, { name: "Operations", icon: "⚙️" }],
  "Web App / SaaS":  [{ name: "Product", icon: "🖥️" }, { name: "Design", icon: "🎨" }, { name: "Engineering", icon: "💻" }, { name: "Growth", icon: "📈" }, { name: "Operations", icon: "⚙️" }],
  "Business":        [{ name: "Foundation", icon: "🏛️" }, { name: "Finance", icon: "💰" }, { name: "Marketing", icon: "📣" }, { name: "Operations", icon: "⚙️" }, { name: "Legal", icon: "⚖️" }, { name: "Growth", icon: "📈" }],
  "Startup":         [{ name: "Idea & Vision", icon: "💡" }, { name: "Product", icon: "📱" }, { name: "Business Model", icon: "💼" }, { name: "Fundraising", icon: "💰" }, { name: "Marketing", icon: "📣" }, { name: "Legal", icon: "⚖️" }],
  "Physical Product":[{ name: "Discovery", icon: "🔍" }, { name: "Design", icon: "🎨" }, { name: "Manufacturing", icon: "🏭" }, { name: "Marketing", icon: "📣" }, { name: "Launch", icon: "🚀" }, { name: "Operations", icon: "⚙️" }],
  "Book / Novel":    [{ name: "Story Development", icon: "📖" }, { name: "Writing", icon: "✏️" }, { name: "Editing", icon: "📝" }, { name: "Publishing", icon: "📚" }, { name: "Marketing", icon: "📣" }],
  "Music / Album":   [{ name: "Creative", icon: "🎵" }, { name: "Recording", icon: "🎙️" }, { name: "Release", icon: "🚀" }, { name: "Marketing", icon: "📣" }],
  "Podcast":         [{ name: "Strategy", icon: "🗺️" }, { name: "Production", icon: "🎙️" }, { name: "Distribution", icon: "📡" }, { name: "Growth", icon: "📈" }],
  "Online Course":   [{ name: "Curriculum", icon: "📚" }, { name: "Production", icon: "🎬" }, { name: "Marketing", icon: "📣" }, { name: "Operations", icon: "⚙️" }],
};

export const INDUSTRY_ICONS: Record<string, string> = {
  Healthcare: "🏥", Construction: "🏗️", Hunting: "🦌", Farming: "🌾",
  Education: "📚", Logistics: "🚛", Legal: "⚖️", Technology: "💻",
  Nonprofit: "❤️", Retail: "🛒", General: "📁",
  "Film / Movie": "🎬", "Documentary": "📺", "Video Game": "🎮",
  "Mobile App": "📱", "Web App / SaaS": "🖥️", "Business": "🏢",
  "Startup": "🚀", "Physical Product": "📦", "Book / Novel": "📚",
  "Music / Album": "🎵", "Podcast": "🎙️", "Online Course": "📖",
};

export const INDUSTRY_COLORS: Record<string, string> = {
  Healthcare: "#10b981", Construction: "#f97316", Hunting: "#78716c",
  Farming: "#84cc16", Education: "#6366f1", Logistics: "#0ea5e9",
  Legal: "#8b5cf6", Technology: "#06b6d4", Nonprofit: "#ec4899",
  Retail: "#f59e0b", General: "#94a3b8",
  "Film / Movie": "#dc2626", "Documentary": "#0284c7", "Video Game": "#7c3aed",
  "Mobile App": "#059669", "Web App / SaaS": "#2563eb", "Business": "#d97706",
  "Startup": "#7c3aed", "Physical Product": "#b45309", "Book / Novel": "#6b7280",
  "Music / Album": "#db2777", "Podcast": "#ea580c", "Online Course": "#0891b2",
};

// ─── Helper: build full project response object ───────────────────────────────

async function buildProjectResponse(projectId: number) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) return null;

  const folders = await db
    .select()
    .from(projectFolders)
    .where(eq(projectFolders.projectId, projectId))
    .orderBy(projectFolders.position);

  const files = await db
    .select()
    .from(projectFiles)
    .where(eq(projectFiles.projectId, projectId))
    .orderBy(desc(projectFiles.createdAt));

  return {
    id: project.id.toString(),
    name: project.name,
    description: project.description,
    industry: project.industry,
    icon: project.icon,
    color: project.color,
    mode: project.mode,
    status: project.status,
    archivedAt: project.archivedAt ?? null,
    created: project.createdAt.toLocaleDateString(),
    createdAt: project.createdAt,
    folders: folders.map(f => ({
      id: f.id.toString(),
      name: f.name,
      icon: f.icon,
      universal: f.isUniversal,
      count: 0,
    })),
    files: files.map(f => ({
      id: f.id.toString(),
      name: f.name,
      content: f.content,
      fileType: f.fileType,
      type: f.fileType,
      size: f.size,
      folderId: f.folderId?.toString() ?? "",
      created: f.createdAt.toLocaleDateString(),
    })),
    subApps: [],
  };
}

// ─── Auth guard helper ─────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response): string | null {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.user!.id;
}

// ─── GET /projects ─────────────────────────────────────────────────────────

router.get("/", audit("list_projects", "project", r => (r.user as {id:string}|undefined)?.id ?? "unknown"), async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const all = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    const list = await Promise.all(all.map(p => buildProjectResponse(p.id)));
    res.json({ projects: list.filter(Boolean) });
  } catch (err) {
    console.error("[projects] GET /", err);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// ─── POST /projects ────────────────────────────────────────────────────────

router.post("/", audit("create_project", "project", r => r.body?.name ?? "unknown"), async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { name, industry = "General", description = "" } = req.body as {
      name: string;
      industry?: string;
      description?: string;
    };

    if (!name?.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const icon  = INDUSTRY_ICONS[industry]  ?? "📁";
    const color = INDUSTRY_COLORS[industry] ?? "#94a3b8";

    const [project] = await db
      .insert(projects)
      .values({ name: name.trim(), industry, description, icon, color, userId })
      .returning();

    const universalRows = UNIVERSAL_FOLDERS.map((f, i) => ({
      projectId: project.id,
      name: f.name,
      icon: f.icon,
      isUniversal: true,
      position: i,
    }));

    const specificDefs = INDUSTRY_SPECIFIC[industry] ?? INDUSTRY_SPECIFIC.General;
    const specificRows = specificDefs.map((f, i) => ({
      projectId: project.id,
      name: f.name,
      icon: f.icon,
      isUniversal: false,
      position: UNIVERSAL_FOLDERS.length + i,
    }));

    await db.insert(projectFolders).values([...universalRows, ...specificRows]);

    const full = await buildProjectResponse(project.id);
    logTractionEvent({
      eventType:   "project_created",
      category:    "retention",
      subCategory: industry,
      userId,
      metadata:    { name: name.trim(), industry },
    });
    db.insert(activityLog).values({
      userId, action: "project_created", label: name.trim(),
      icon, appId: "projos", meta: { industry },
    }).catch(() => {});
    db.insert(notifications).values({
      userId, type: "info",
      title: `Project created: ${name.trim()}`,
      body: `New ${industry} project is ready with folders pre-configured.`,
      appId: "projos",
    }).catch(() => {});
    res.status(201).json({ project: full });
  } catch (err) {
    console.error("[projects] POST /", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// ─── GET /projects/shared-with-me ────────────────────────────────────────────
// Returns projects where the authenticated user is listed as a member (but is not the owner).

router.get("/shared-with-me", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const memberRows = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    if (memberRows.length === 0) {
      res.json({ projects: [] });
      return;
    }

    const sharedList: object[] = [];
    for (const m of memberRows) {
      const pid = parseInt(m.projectId, 10);
      const [project] = await db.select().from(projects).where(
        and(eq(projects.id, pid), ne(projects.userId, userId), isNull(projects.deletedAt))
      );
      if (project) {
        sharedList.push({
          id: project.id.toString(),
          name: project.name,
          industry: project.industry,
          icon: project.icon,
          color: project.color,
          status: project.status,
          created: project.createdAt.toLocaleDateString(),
          role: m.role,
          ownerId: project.userId,
        });
      }
    }
    res.json({ projects: sharedList });
  } catch (err) {
    console.error("[projects] GET /shared-with-me", err);
    res.status(500).json({ error: "Failed to load shared projects" });
  }
});

// ─── POST /projects/reset-my-space ───────────────────────────────────────────
// Archives all of the authenticated user's active projects (owner reset / clean slate).

router.post("/reset-my-space", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    await db
      .update(projects)
      .set({ status: "archived", archivedAt: new Date() })
      .where(
        and(
          eq(projects.userId, userId),
          isNull(projects.deletedAt),
          or(eq(projects.status, "active"), isNull(projects.status))
        )
      );
    res.json({ ok: true, message: "All active projects archived. Space is clean." });
  } catch (err) {
    console.error("[projects] POST /reset-my-space", err);
    res.status(500).json({ error: "Failed to reset space" });
  }
});

// ─── Members endpoints ─────────────────────────────────────────────────────
// Members are stored as JSONB on the project row: [{ id, name, email, role, addedAt }]

type Member = { id: string; name: string; email: string; role: string; addedAt: string };

router.get("/:id/members", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row || row.userId !== userId) { res.status(404).json({ error: "Not found" }); return; }
    const members = (row.members ?? []) as Member[];
    res.json({ members });
  } catch { res.status(500).json({ error: "Failed to load members" }); }
});

router.post("/:id/members", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row || row.userId !== userId) { res.status(404).json({ error: "Not found" }); return; }
    const { name, email, role = "Viewer" } = req.body as { name?: string; email?: string; role?: string };
    if (!name?.trim() && !email?.trim()) { res.status(400).json({ error: "name or email required" }); return; }
    const members = (row.members ?? []) as Member[];
    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: (name ?? email ?? "").trim(),
      email: (email ?? "").trim(),
      role,
      addedAt: new Date().toISOString(),
    };
    const updated = [...members, newMember];
    await db.update(projects).set({ members: updated } as never).where(eq(projects.id, id));
    res.status(201).json({ member: newMember });
  } catch { res.status(500).json({ error: "Failed to add member" }); }
});

router.put("/:id/members/:memberId", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row || row.userId !== userId) { res.status(404).json({ error: "Not found" }); return; }
    const { role } = req.body as { role?: string };
    const members = (row.members ?? []) as Member[];
    const updated = members.map(m => m.id === req.params.memberId ? { ...m, ...(role ? { role } : {}) } : m);
    await db.update(projects).set({ members: updated } as never).where(eq(projects.id, id));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to update member" }); }
});

router.delete("/:id/members/:memberId", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row || row.userId !== userId) { res.status(404).json({ error: "Not found" }); return; }
    const members = (row.members ?? []) as Member[];
    const updated = members.filter(m => m.id !== req.params.memberId);
    await db.update(projects).set({ members: updated } as never).where(eq(projects.id, id));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to remove member" }); }
});

// ─── GET /projects/files/:fileId ──────────────────────────────────────────

router.get("/files/:fileId", audit("read_file", "project_file", r => r.params.fileId), async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const fileId = parseInt(req.params.fileId as string, 10);
    const [file] = await db.select().from(projectFiles).where(eq(projectFiles.id, fileId));
    if (!file) { res.status(404).json({ error: "File not found" }); return; }
    res.json({
      file: {
        ...file,
        id: file.id.toString(),
        folderId: file.folderId?.toString() ?? "",
        type: file.fileType,
        created: file.createdAt.toLocaleDateString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch file" });
  }
});

// ─── GET /portfolio-intelligence — Cross-project AI recommendations ──────────
//
// Analyses all active projects for the user and returns:
//   - Portfolio stats (type distribution, avg completion)
//   - AI-generated portfolio recommendations  
//   - Suggested missing project types
//   - Cross-project synergies

router.get(
  "/portfolio-intelligence",
  heavyLimiter,
  async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
      const activeProjects = userProjects.filter(p => p.status !== "archived");

      if (activeProjects.length === 0) {
        res.json({
          stats: { total: 0, typeBreakdown: {}, avgCompletion: 0 },
          recommendations: [],
          missingTypes: ["Film / Movie", "Startup", "Web App / SaaS"],
          synergies: [],
        });
        return;
      }

      // Compute stats
      const typeBreakdown: Record<string, number> = {};
      for (const p of activeProjects) {
        const t = p.industry ?? "General";
        typeBreakdown[t] = (typeBreakdown[t] ?? 0) + 1;
      }

      // Fetch files for all projects (completion scoring)
      const projectIds = activeProjects.map(p => p.id);
      const allFiles = await db.select().from(projectFiles)
        .where(inArray(projectFiles.projectId, projectIds))
        .catch(() => [] as typeof projectFiles.$inferSelect[]);

      // Per-project completion rates
      const projectCompletions: Array<{ name: string; industry: string; completion: number; files: number }> = [];
      for (const p of activeProjects) {
        const pFiles = allFiles.filter(f => f.projectId === p.id);
        const BRACKET_RE = /\[[A-Z][A-Z\s/&'.,\-#%*0-9]{1,40}]/g;
        const complete = pFiles.filter(f => {
          const c = f.content ?? "";
          if (c.length < 80) return false;
          const bm = c.match(BRACKET_RE) ?? [];
          return bm.length === 0;
        }).length;
        const completion = pFiles.length > 0 ? Math.round((complete / pFiles.length) * 100) : 0;
        projectCompletions.push({ name: p.name, industry: p.industry ?? "General", completion, files: pFiles.length });
      }
      const avgCompletion = projectCompletions.length > 0
        ? Math.round(projectCompletions.reduce((a, p) => a + p.completion, 0) / projectCompletions.length)
        : 0;

      // AI portfolio analysis
      const portfolioSummary = projectCompletions
        .map(p => `• "${p.name}" (${p.industry}) — ${p.completion}% complete, ${p.files} docs`)
        .join("\n");

      const existingTypes = Object.keys(typeBreakdown);
      const allTypes = ["Film / Movie", "Documentary", "Video Game", "Mobile App", "Web App / SaaS",
                        "Business", "Startup", "Physical Product", "Book / Novel", "Music / Album", "Podcast", "Online Course"];
      const missingTypes = allTypes.filter(t => !existingTypes.includes(t)).slice(0, 4);

      const aiResponse = await openai.chat.completions.create({
        model:      "gpt-4o",
        temperature: 0.5,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: `You are a cross-project portfolio advisor. Analyse a creator's project portfolio and provide strategic recommendations. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `My project portfolio:\n${portfolioSummary}\n\nReturn this exact JSON:\n{\n  "recommendations": [\n    { "title": "...", "body": "...", "priority": "high" | "medium" | "low" }\n  ],\n  "synergies": [\n    { "projects": ["...", "..."], "insight": "..." }\n  ],\n  "portfolioInsight": "One paragraph strategic overview of the portfolio"\n}\n\nProvide 3-4 recommendations and 1-2 synergies. Be specific and actionable.`,
          },
        ],
      } as Parameters<typeof openai.chat.completions.create>[0]);

      const raw = (aiResponse as { choices: { message: { content: string } }[] })
        .choices[0]?.message?.content ?? "{}";

      let aiResult: {
        recommendations: Array<{ title: string; body: string; priority: string }>;
        synergies: Array<{ projects: string[]; insight: string }>;
        portfolioInsight: string;
      };
      try {
        aiResult = JSON.parse(raw) as typeof aiResult;
      } catch {
        const stripped = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        aiResult = JSON.parse(stripped) as typeof aiResult;
      }

      res.json({
        stats: {
          total: activeProjects.length,
          typeBreakdown,
          avgCompletion,
          projectCompletions,
        },
        recommendations: aiResult.recommendations ?? [],
        synergies:       aiResult.synergies        ?? [],
        portfolioInsight: aiResult.portfolioInsight ?? "",
        missingTypes,
      });
    } catch (err) {
      console.error("[portfolio-intelligence] GET", err);
      res.status(500).json({ error: "Portfolio intelligence failed" });
    }
  },
);

// ─── GET /projects/all-files ───────────────────────────────────────────────

// ─── POST /parse-intent — Universal "Create X" natural language → project spec ─
//
// Accepts a free-text user prompt ("Create a fitness app for Gen Z runners")
// and returns a structured project spec: name, industry, and intent JSON.
// Used by the "Create X" hero on the home screen for instant one-shot creation.

router.post(
  "/parse-intent",
  heavyLimiter,
  async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;

    const { prompt }: { prompt?: string } = req.body ?? {};
    if (!prompt?.trim()) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    try {
      const completion = await openai.chat.completions.create({
        model:       "gpt-4o",
        temperature: 0.3,
        max_tokens:  400,
        messages: [
          {
            role: "system",
            content: `You are a project creation assistant. Extract structured project intent from a natural language description.
Return ONLY valid JSON — no markdown, no explanation, no extra text.
The "industry" field MUST be one of these exact values:
"Film / Movie", "Documentary", "Video Game", "Mobile App", "Web App / SaaS",
"Business", "Startup", "Physical Product", "Book / Novel", "Music / Album",
"Podcast", "Online Course", "General"`,
          },
          {
            role: "user",
            content: `Extract project creation intent from this description: "${prompt.trim()}"

Return exactly this JSON structure:
{
  "name": "concise project name (3-6 words, title case, no articles like 'a' or 'the')",
  "industry": "most fitting industry from the allowed list",
  "intent": {
    "purpose": "one clear sentence on what this project achieves",
    "audience": "specific description of who this is for",
    "tone": "one of: professional | creative | bold | cinematic | technical | friendly | inspiring"
  }
}`,
          },
        ],
      } as Parameters<typeof openai.chat.completions.create>[0]);

      const raw = (completion as { choices: { message: { content: string } }[] })
        .choices[0]?.message?.content ?? "{}";

      let result: { name: string; industry: string; intent: { purpose: string; audience: string; tone: string } };
      try {
        result = JSON.parse(raw) as typeof result;
      } catch {
        const stripped = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        result = JSON.parse(stripped) as typeof result;
      }

      res.json(result);
    } catch (err) {
      console.error("[parse-intent] POST", err);
      res.status(500).json({ error: "Failed to parse intent" });
    }
  },
);

router.get("/all-files", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const files = await db
      .select({
        id: projectFiles.id,
        name: projectFiles.name,
        fileType: projectFiles.fileType,
        size: projectFiles.size,
        content: projectFiles.content,
        createdAt: projectFiles.createdAt,
        projectId: projectFiles.projectId,
        folderId: projectFiles.folderId,
        projectName: projects.name,
        projectIndustry: projects.industry,
        projectIcon: projects.icon,
      })
      .from(projectFiles)
      .leftJoin(projects, eq(projectFiles.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(projectFiles.createdAt));
    res.json({
      files: files.map(f => ({
        ...f,
        id: f.id.toString(),
        folderId: f.folderId?.toString() ?? "",
        type: f.fileType,
        created: f.createdAt.toLocaleDateString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to list all files" });
  }
});

// ─── GET /projects/:id ─────────────────────────────────────────────────────

router.get("/:id", audit("read_project", "project"), async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row || row.userId !== userId) { res.status(404).json({ error: "Project not found" }); return; }
    const full = await buildProjectResponse(id);
    if (!full) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ project: full });
  } catch (err) {
    console.error("[projects] GET /:id", err);
    res.status(500).json({ error: "Failed to get project" });
  }
});

// ─── PUT /projects/:id ─────────────────────────────────────────────────────

router.put("/:id", audit("update_project", "project"), async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row || row.userId !== userId) { res.status(404).json({ error: "Project not found" }); return; }

    const { name, description, mode } = req.body as {
      name?: string;
      description?: string;
      mode?: string;
    };

    const updates: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (name)        updates.name        = name.trim();
    if (description !== undefined) updates.description = description;
    if (mode)        updates.mode        = mode;

    await db.update(projects).set(updates).where(eq(projects.id, id));

    const full = await buildProjectResponse(id);
    if (!full) { res.status(404).json({ error: "Project not found" }); return; }
    res.json({ project: full });
  } catch (err) {
    console.error("[projects] PUT /:id", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// ─── PUT /projects/:id/status (archive/restore) ────────────────────────────

router.put("/:id/status", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row || row.userId !== userId) { res.status(404).json({ error: "Project not found" }); return; }

    const { status } = req.body as { status: "active" | "archived" };
    if (!["active", "archived"].includes(status)) { res.status(400).json({ error: "status must be active or archived" }); return; }

    await db.update(projects).set({
      status,
      archivedAt: status === "archived" ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(projects.id, id));

    res.json({ ok: true, status });
  } catch (err) {
    console.error("[projects] PUT /:id/status", err);
    res.status(500).json({ error: "Failed to update project status" });
  }
});

// ─── DELETE /projects/:id ──────────────────────────────────────────────────

router.delete("/:id", audit("delete_project", "project"), async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const id = parseInt(req.params.id as string, 10);
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row || row.userId !== userId) { res.status(404).json({ error: "Project not found" }); return; }
    await db.delete(projects).where(eq(projects.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("[projects] DELETE /:id", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// ─── FOLDERS ──────────────────────────────────────────────────────────────

router.get("/:id/folders", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const folders = await db
      .select()
      .from(projectFolders)
      .where(eq(projectFolders.projectId, projectId))
      .orderBy(projectFolders.position);
    res.json({ folders: folders.map(f => ({ ...f, id: f.id.toString(), universal: f.isUniversal })) });
  } catch (err) {
    res.status(500).json({ error: "Failed to list folders" });
  }
});

router.post("/:id/folders", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const { name, icon = "📁" } = req.body as { name: string; icon?: string };
    if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }

    const existing = await db.select().from(projectFolders).where(eq(projectFolders.projectId, projectId));

    const [folder] = await db
      .insert(projectFolders)
      .values({ projectId, name: name.trim(), icon, isUniversal: false, position: existing.length })
      .returning();

    res.status(201).json({ folder: { ...folder, id: folder.id.toString(), universal: false, count: 0 } });
  } catch (err) {
    res.status(500).json({ error: "Failed to create folder" });
  }
});

router.put("/:id/folders/:folderId", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const folderId  = parseInt(req.params.folderId as string, 10);

    // H-01: Verify the folder belongs to a project owned by this user
    const [ownerCheck] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!ownerCheck) { res.status(404).json({ error: "Project not found" }); return; }

    const { name, icon } = req.body as { name?: string; icon?: string };
    const updates: Record<string, string> = {};
    if (name) updates.name = name.trim();
    if (icon) updates.icon = icon;
    await db.update(projectFolders).set(updates).where(and(eq(projectFolders.id, folderId), eq(projectFolders.projectId, projectId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update folder" });
  }
});

router.delete("/:id/folders/:folderId", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const folderId  = parseInt(req.params.folderId as string, 10);

    // H-01: Verify the folder belongs to a project owned by this user
    const [ownerCheck] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!ownerCheck) { res.status(404).json({ error: "Project not found" }); return; }

    await db.delete(projectFolders).where(and(eq(projectFolders.id, folderId), eq(projectFolders.projectId, projectId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

// ─── FILES ────────────────────────────────────────────────────────────────

router.get("/:id/files", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const files = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(desc(projectFiles.createdAt));
    res.json({
      files: files.map(f => ({
        ...f,
        id: f.id.toString(),
        folderId: f.folderId?.toString() ?? "",
        type: f.fileType,
        created: f.createdAt.toLocaleDateString(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to list files" });
  }
});

router.post("/:id/files", audit("create_file", "project_file"), async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const { name, content = "", fileType = "document", folderId, size = "0 KB" } = req.body as {
      name: string;
      content?: string;
      fileType?: string;
      folderId?: string;
      size?: string;
    };
    if (!name?.trim()) { res.status(400).json({ error: "name required" }); return; }

    const [file] = await db
      .insert(projectFiles)
      .values({
        projectId,
        name: name.trim(),
        content,
        fileType,
        folderId: folderId ? parseInt(folderId, 10) : null,
        size,
      })
      .returning();

    res.status(201).json({
      file: {
        ...file,
        id: file.id.toString(),
        folderId: file.folderId?.toString() ?? "",
        type: file.fileType,
        created: file.createdAt.toLocaleDateString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create file" });
  }
});

router.put("/:id/files/:fileId", audit("update_file", "project_file", r => r.params.fileId), async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const fileId    = parseInt(req.params.fileId as string, 10);

    // H-01: Verify the file belongs to a project owned by this user
    const [ownerCheck] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!ownerCheck) { res.status(404).json({ error: "Project not found" }); return; }

    const { name, content, fileType, size } = req.body as {
      name?: string;
      content?: string;
      fileType?: string;
      size?: string;
    };
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name    !== undefined) updates.name     = name.trim();
    if (content !== undefined) updates.content  = content;
    if (fileType !== undefined) updates.fileType = fileType;
    if (size    !== undefined) updates.size     = size;
    await db.update(projectFiles).set(updates).where(and(eq(projectFiles.id, fileId), eq(projectFiles.projectId, projectId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update file" });
  }
});

router.delete("/:id/files/:fileId", audit("delete_file", "project_file", r => r.params.fileId), async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const fileId    = parseInt(req.params.fileId as string, 10);

    // H-01: Verify the file belongs to a project owned by this user
    const [ownerCheck] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!ownerCheck) { res.status(404).json({ error: "Project not found" }); return; }

    await db.delete(projectFiles).where(and(eq(projectFiles.id, fileId), eq(projectFiles.projectId, projectId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// ─── Publishing pipeline (req 13 + 14) ───────────────────────────────────────

router.post("/:id/publish", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const userId = (req as any).user?.id ?? "sara";

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!project) { res.status(404).json({ error: "Project not found" }); return; }

    // ── Billing hook integration point ──────────────────────────────────────
    // Wire to payment provider (Stripe, RevenueCat, etc.) here when billing goes live.
    // Currently allows all publish actions — no financial enforcement yet.
    const billingEligible = true;
    if (!billingEligible) {
      res.status(402).json({ error: "Upgrade required to publish projects" });
      return;
    }

    const publishUrl = `https://createai.app/p/${projectId}`;
    await db
      .update(projects)
      .set({
        publishStatus: "published",
        publishedAt: new Date(),
        publishUrl,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    logTractionEvent({
      eventType: "project_published",
      userId,
      metadata: { projectId, projectName: project.name },
    });

    res.json({ ok: true, publishUrl, publishStatus: "published" });
  } catch (err) {
    res.status(500).json({ error: "Failed to publish project" });
  }
});

router.delete("/:id/publish", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const userId = (req as any).user?.id ?? "sara";

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!project) { res.status(404).json({ error: "Project not found" }); return; }

    await db
      .update(projects)
      .set({
        publishStatus: null,
        publishedAt: null,
        publishUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to unpublish project" });
  }
});

export default router;
