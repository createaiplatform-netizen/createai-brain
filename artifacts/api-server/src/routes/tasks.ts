import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, projectTasks, projects } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return req.user!.id;
}

async function verifyProjectOwner(projectId: string, userId: string): Promise<boolean> {
  const [row] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId, 10)));
  return !!row && row.userId === userId;
}

// ─── GET /projects/:projectId/tasks ───────────────────────────────────────
router.get("/:projectId/tasks", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const projectId = req.params.projectId as string;
    const rows = await db
      .select()
      .from(projectTasks)
      .where(and(eq(projectTasks.projectId, projectId), eq(projectTasks.userId, userId)))
      .orderBy(desc(projectTasks.createdAt));
    res.json({ tasks: rows });
  } catch (err) {
    console.error("[tasks] GET /:projectId/tasks", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ─── POST /projects/:projectId/tasks ──────────────────────────────────────
router.post("/:projectId/tasks", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const projectId = req.params.projectId as string;
    const { title, description = "", status = "todo", priority = "medium", assignedTo, dueAt } = req.body as {
      title: string; description?: string; status?: string;
      priority?: string; assignedTo?: string; dueAt?: string;
    };
    if (!title?.trim()) { res.status(400).json({ error: "title is required" }); return; }
    const [row] = await db.insert(projectTasks).values({
      projectId, userId,
      title: title.trim(),
      description,
      status,
      priority,
      assignedTo: assignedTo ?? null,
      dueAt: dueAt ? new Date(dueAt) : null,
    }).returning();
    res.status(201).json({ task: row });
  } catch (err) {
    console.error("[tasks] POST /:projectId/tasks", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// ─── PUT /projects/:projectId/tasks/:taskId ───────────────────────────────
router.put("/:projectId/tasks/:taskId", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    const { title, description, status, priority, assignedTo, dueAt } = req.body as {
      title?: string; description?: string; status?: string;
      priority?: string; assignedTo?: string; dueAt?: string | null;
    };
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (status !== undefined) {
      updates.status = status;
      updates.completedAt = status === "done" ? new Date() : null;
    }
    if (priority !== undefined) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (dueAt !== undefined) updates.dueAt = dueAt ? new Date(dueAt) : null;

    const [row] = await db.update(projectTasks)
      .set(updates)
      .where(and(eq(projectTasks.id, taskId), eq(projectTasks.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Task not found" }); return; }
    res.json({ task: row });
  } catch (err) {
    console.error("[tasks] PUT /:projectId/tasks/:taskId", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ─── DELETE /projects/:projectId/tasks/:taskId ────────────────────────────
router.delete("/:projectId/tasks/:taskId", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    await db.delete(projectTasks)
      .where(and(eq(projectTasks.id, taskId), eq(projectTasks.userId, userId)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[tasks] DELETE /:projectId/tasks/:taskId", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
