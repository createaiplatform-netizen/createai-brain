import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import { db, projects, projectFolders } from "@workspace/db";
import { container }        from "../container";
import { EXECUTION_STORE }  from "../container/tokens";
import type { ExecutionStore, ExecutionRecord } from "../observability/ExecutionStore";
import { GraphResolver, type OrchestrateGraph } from "../orchestration/GraphResolver";
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
      .values({ name: projectName.trim(), industry: projectType, description: "", icon, color, userId })
      .returning();

    const universalRows = UNIVERSAL_FOLDERS.map((f) => ({ projectId: project.id, name: f.name, icon: f.icon, userId }));
    const specificDefs  = INDUSTRY_SPECIFIC[projectType] ?? INDUSTRY_SPECIFIC["General"];
    const specificRows  = specificDefs.map((f) => ({ projectId: project.id, name: f.name, icon: f.icon, userId }));

    await db.insert(projectFolders).values([...universalRows, ...specificRows]);

    res.json({ status: "success", project });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
});

// ─── Domain action registry ───────────────────────────────────────────────────

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
    throw new Error(
      `Action '${action}' is registered but not yet implemented. ` +
      `Define its handler in ai.ts → domainActions.`,
    );
  };
}

const domainActions: Record<string, ActionFn> = {
  project:  actionProject,
  staffing: notImplemented("staffing"),
  legal:    notImplemented("legal"),
  health:   notImplemented("health"),
  chat:     notImplemented("chat"),
};

// ─── Shared: run one action + record it ───────────────────────────────────────

interface ActionResult {
  status:     "completed" | "failed";
  result?:    unknown;
  error?:     string;
  durationMs: number;
}

async function runAction(
  action:    string,
  userId:    string,
  params:    Record<string, unknown>,
  requestId: string,
  store:     ExecutionStore,
): Promise<ActionResult> {
  const fn = domainActions[action];
  const executionId = crypto.randomUUID();
  const startedAt   = Date.now();

  if (!fn) {
    const durationMs = Date.now() - startedAt;
    store.save({
      executionId, requestId, userId,
      engineId: action, trace: [action], depth: 1, tokenUsage: 0,
      startedAt, endedAt: Date.now(), durationMs, status: "error",
      errorCode: `Unknown action '${action}'`,
    });
    return { status: "failed", error: `Unknown action '${action}'. Valid actions: ${Object.keys(domainActions).join(", ")}`, durationMs };
  }

  try {
    const result    = await fn(userId, params);
    const endedAt   = Date.now();
    const durationMs = endedAt - startedAt;

    const record: ExecutionRecord = {
      executionId, requestId, userId,
      engineId: action, trace: [action], depth: 1, tokenUsage: 0,
      startedAt, endedAt, durationMs, status: "success",
    };
    store.save(record);
    return { status: "completed", result, durationMs };
  } catch (err) {
    const endedAt   = Date.now();
    const durationMs = endedAt - startedAt;

    const record: ExecutionRecord = {
      executionId, requestId, userId,
      engineId: action, trace: [action], depth: 1, tokenUsage: 0,
      startedAt, endedAt, durationMs, status: "error",
      errorCode: (err as Error).message,
    };
    store.save(record);
    return { status: "failed", error: (err as Error).message, durationMs };
  }
}

// ─── POST /api/ai/orchestrate — flat sequential ───────────────────────────────
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

  for (const action of actions) {
    results[action] = await runAction(action, userId, params[action] ?? {}, requestId, store);
  }

  res.json({ status: "done", results });
});

// ─── POST /api/ai/orchestrate/graph — DAG parallel (Phase 7) ─────────────────
//
// Accepts: { graph: OrchestrateGraph }
//
// graph format:
//   {
//     "nodeA": { "action": "project", "params": { "projectName": "X" } },
//     "nodeB": { "action": "project", "params": { "projectName": "Y" }, "deps": ["nodeA"] }
//   }
//
// nodeB runs after nodeA and receives its output at params.$deps.nodeA
//
router.post("/orchestrate/graph", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ status: "error", message: "Unauthorized" });
    return;
  }

  const { graph } = req.body as { graph?: OrchestrateGraph };

  if (!graph || typeof graph !== "object" || Object.keys(graph).length === 0) {
    res.status(400).json({ status: "error", message: "graph must be a non-empty object" });
    return;
  }

  try {
    GraphResolver.validate(graph);
  } catch (err) {
    res.status(400).json({ status: "error", message: (err as Error).message });
    return;
  }

  const levels    = GraphResolver.levels(graph);
  const store     = container.get<ExecutionStore>(EXECUTION_STORE);
  const requestId = crypto.randomUUID();
  const outputs   = new Map<string, unknown>();
  const results: Record<string, unknown> = {};

  for (const level of levels) {
    await Promise.all(
      level.names.map(async (name) => {
        const node   = graph[name];
        const params = GraphResolver.buildParams(node, outputs);
        const result = await runAction(node.action, userId, params, requestId, store);
        outputs.set(name, result.result ?? null);
        results[name] = result;
      }),
    );
  }

  res.json({ status: "done", results, levelCount: levels.length });
});

// ─── POST /api/ai/orchestrate/stream — SSE streaming (Phase 8) ───────────────
//
// Accepts EITHER:
//   { actions: string[], params?: {...} }        — flat sequential
//   { graph: OrchestrateGraph }                  — DAG parallel
//
// SSE event shapes:
//   { type: "start",    node, action, level? }
//   { type: "done",     node, action, status, durationMs, result?, error? }
//   { type: "complete", totalDurationMs, nodeCount }
//
router.post("/orchestrate/stream", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ status: "error", message: "Unauthorized" });
    return;
  }

  const body = req.body as {
    actions?: string[];
    params?:  Record<string, Record<string, unknown>>;
    graph?:   OrchestrateGraph;
  };

  const isGraph = !!body.graph && typeof body.graph === "object";

  if (!isGraph && (!Array.isArray(body.actions) || body.actions.length === 0)) {
    res.status(400).json({ status: "error", message: "Provide either actions[] or graph" });
    return;
  }

  if (isGraph) {
    try {
      GraphResolver.validate(body.graph!);
    } catch (err) {
      res.status(400).json({ status: "error", message: (err as Error).message });
      return;
    }
  }

  res.writeHead(200, {
    "Content-Type":  "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection":    "keep-alive",
  });

  const emit = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const store     = container.get<ExecutionStore>(EXECUTION_STORE);
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let   nodeCount = 0;

  try {
    if (isGraph) {
      const graph   = body.graph!;
      const levels  = GraphResolver.levels(graph);
      const outputs = new Map<string, unknown>();

      for (let li = 0; li < levels.length; li++) {
        const level = levels[li];

        await Promise.all(
          level.names.map(async (name) => {
            const node   = graph[name];
            const params = GraphResolver.buildParams(node, outputs);

            emit({ type: "start", node: name, action: node.action, level: li });
            const result = await runAction(node.action, userId, params, requestId, store);
            outputs.set(name, result.result ?? null);
            nodeCount++;

            emit({ type: "done", node: name, action: node.action, ...result });
          }),
        );
      }
    } else {
      const params = body.params ?? {};

      for (const action of body.actions!) {
        emit({ type: "start", node: action, action });
        const result = await runAction(action, userId, params[action] ?? {}, requestId, store);
        nodeCount++;
        emit({ type: "done", node: action, action, ...result });
      }
    }

    emit({ type: "complete", totalDurationMs: Date.now() - startedAt, nodeCount });
  } catch (err) {
    emit({ type: "error", message: (err as Error).message });
  } finally {
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

export default router;
