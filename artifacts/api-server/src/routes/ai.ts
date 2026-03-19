import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { db, projects, projectFolders } from "@workspace/db";
import { container }        from "../container";
import { EXECUTION_STORE }  from "../container/tokens";
import type { ExecutionStore, ExecutionRecord } from "../observability/ExecutionStore";
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

// ─── Domain action registry ───────────────────────────────────────────────────
//
// Each action receives the calling userId and a free-form params object.
// Add new actions here as platform capabilities are defined.
//
type ActionFn = (userId: string, params: Record<string, unknown>) => Promise<unknown>;

async function actionProject(userId: string, params: Record<string, unknown>): Promise<unknown> {
  const projectName = (params.projectName as string | undefined)?.trim();
  const projectType = (params.projectType as string | undefined) ?? "General";

  if (!projectName) throw new Error("params.projectName is required for the 'project' action");

  const icon  = INDUSTRY_ICONS[projectType]  ?? "📁";
  const color = INDUSTRY_COLORS[projectType] ?? "#94a3b8";

  const [project] = await db
    .insert(projects)
    .values({ name: projectName, industry: projectType, description: "", icon, color, userId })
    .returning();

  const universalRows = UNIVERSAL_FOLDERS.map((f) => ({ projectId: project.id, name: f.name, icon: f.icon, userId }));
  const specificDefs  = INDUSTRY_SPECIFIC[projectType] ?? INDUSTRY_SPECIFIC["General"];
  const specificRows  = specificDefs.map((f) => ({ projectId: project.id, name: f.name, icon: f.icon, userId }));

  await db.insert(projectFolders).values([...universalRows, ...specificRows]);
  return { projectId: project.id, name: project.name, industry: project.industry };
}

function notImplemented(action: string): ActionFn {
  return async () => {
    throw new Error(`Action '${action}' is registered but not yet implemented. Define its handler in ai.ts → domainActions.`);
  };
}

const domainActions: Record<string, ActionFn> = {
  project:  actionProject,
  staffing: notImplemented("staffing"),
  legal:    notImplemented("legal"),
  health:   notImplemented("health"),
  chat:     notImplemented("chat"),
};

// ─── POST /api/ai/orchestrate ─────────────────────────────────────────────────
//
// Accepts:
//   { actions: string[], params?: { [action]: { ...actionParams } } }
//
// Returns:
//   { status: "done", results: { [action]: { status, result? | error? } } }
//
router.post("/orchestrate", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ status: "error", message: "Unauthorized" });
    return;
  }

  const { actions, params = {} } = req.body as {
    actions?: string[];
    params?: Record<string, Record<string, unknown>>;
  };

  if (!Array.isArray(actions) || actions.length === 0) {
    res.status(400).json({ status: "error", message: "actions must be a non-empty array" });
    return;
  }

  const store     = container.get<ExecutionStore>(EXECUTION_STORE);
  const requestId = crypto.randomUUID();
  const results: Record<string, unknown> = {};

  // Run actions sequentially — preserves predictable order and avoids race
  // conditions on shared DB resources. Switch to Promise.all if you need parallelism.
  for (const action of actions) {
    const fn = domainActions[action];

    if (!fn) {
      results[action] = { status: "unknown-action", error: `No handler registered for '${action}'. Valid actions: ${Object.keys(domainActions).join(", ")}` };
      continue;
    }

    const executionId = crypto.randomUUID();
    const startedAt   = Date.now();

    try {
      const result = await fn(userId, params[action] ?? {});
      const endedAt = Date.now();

      const record: ExecutionRecord = {
        executionId,
        requestId,
        userId,
        engineId:   action,
        trace:      [action],
        depth:      1,
        tokenUsage: 0,
        startedAt,
        endedAt,
        durationMs: endedAt - startedAt,
        status:     "success",
      };
      store.save(record);

      results[action] = { status: "completed", result };
    } catch (err) {
      const endedAt = Date.now();

      const record: ExecutionRecord = {
        executionId,
        requestId,
        userId,
        engineId:   action,
        trace:      [action],
        depth:      1,
        tokenUsage: 0,
        startedAt,
        endedAt,
        durationMs: endedAt - startedAt,
        status:     "error",
        errorCode:  (err as Error).message,
      };
      store.save(record);

      results[action] = { status: "failed", error: (err as Error).message };
    }
  }

  res.json({ status: "done", results });
});

export default router;
