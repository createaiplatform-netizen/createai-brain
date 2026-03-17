import { Router, type IRouter, type Request, type Response } from "express";
import { logTractionEvent } from "../lib/tractionLogger";
import { eq, desc } from "drizzle-orm";
import {
  db,
  projects,
  projectFolders,
  projectFiles,
} from "@workspace/db";

const router: IRouter = Router();

// ─── Industry config (mirrors frontend) ──────────────────────────────────────

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

router.get("/", async (req: Request, res: Response) => {
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

router.post("/", async (req: Request, res: Response) => {
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
    res.status(201).json({ project: full });
  } catch (err) {
    console.error("[projects] POST /", err);
    res.status(500).json({ error: "Failed to create project" });
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

router.get("/files/:fileId", async (req: Request, res: Response) => {
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

// ─── GET /projects/all-files ───────────────────────────────────────────────

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

router.get("/:id", async (req: Request, res: Response) => {
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

router.put("/:id", async (req: Request, res: Response) => {
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

router.delete("/:id", async (req: Request, res: Response) => {
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
  if (!requireAuth(req, res)) return;
  try {
    const folderId = parseInt(req.params.folderId as string, 10);
    const { name, icon } = req.body as { name?: string; icon?: string };
    const updates: Record<string, string> = {};
    if (name) updates.name = name.trim();
    if (icon) updates.icon = icon;
    await db.update(projectFolders).set(updates).where(eq(projectFolders.id, folderId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update folder" });
  }
});

router.delete("/:id/folders/:folderId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const folderId = parseInt(req.params.folderId as string, 10);
    await db.delete(projectFolders).where(eq(projectFolders.id, folderId));
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

router.post("/:id/files", async (req: Request, res: Response) => {
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

router.put("/:id/files/:fileId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const fileId = parseInt(req.params.fileId as string, 10);
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
    await db.update(projectFiles).set(updates).where(eq(projectFiles.id, fileId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update file" });
  }
});

router.delete("/:id/files/:fileId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const fileId = parseInt(req.params.fileId as string, 10);
    await db.delete(projectFiles).where(eq(projectFiles.id, fileId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;
