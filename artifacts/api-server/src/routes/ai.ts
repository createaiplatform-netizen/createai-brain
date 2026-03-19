import { Router, type IRouter, type Request, type Response } from "express";
import { db, projects, projectFolders } from "@workspace/db";
import { container }        from "../container";
import { EXECUTION_STORE }  from "../container/tokens";
import type { ExecutionStore } from "../observability/ExecutionStore";
import {
  UNIVERSAL_FOLDERS,
  INDUSTRY_SPECIFIC,
  INDUSTRY_ICONS,
  INDUSTRY_COLORS,
} from "./projects";

const router: IRouter = Router();

// ─── GET /api/ai/health ───────────────────────────────────────────────────────
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: Date.now() });
});

// ─── GET /api/ai/dashboard ────────────────────────────────────────────────────
router.get("/dashboard", (_req: Request, res: Response) => {
  try {
    const store = container.get<ExecutionStore>(EXECUTION_STORE);
    const data  = store.list();
    res.json({ status: "success", data });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
});

// ─── POST /api/ai/generate-project ───────────────────────────────────────────
router.post("/generate-project", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const { projectName, projectType = "General" } = req.body as {
      projectName?: string;
      projectType?: string;
    };

    if (!projectName?.trim()) {
      res.status(400).json({ status: "error", message: "projectName is required" });
      return;
    }

    const icon  = INDUSTRY_ICONS[projectType]  ?? "📁";
    const color = INDUSTRY_COLORS[projectType] ?? "#94a3b8";

    const [project] = await db
      .insert(projects)
      .values({
        name:        projectName.trim(),
        industry:    projectType,
        description: "",
        icon,
        color,
        userId,
      })
      .returning();

    const universalRows = UNIVERSAL_FOLDERS.map((f) => ({
      projectId: project.id,
      name:      f.name,
      icon:      f.icon,
      userId,
    }));

    const specificDefs  = INDUSTRY_SPECIFIC[projectType] ?? INDUSTRY_SPECIFIC["General"];
    const specificRows  = specificDefs.map((f) => ({
      projectId: project.id,
      name:      f.name,
      icon:      f.icon,
      userId,
    }));

    await db.insert(projectFolders).values([...universalRows, ...specificRows]);

    res.json({ status: "success", project });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
});

export default router;
