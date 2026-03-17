import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, projectMembers, projects } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return req.user!.id;
}

// ─── GET /projects/:projectId/members ─────────────────────────────────────
router.get("/:projectId/members", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { projectId } = req.params;
    const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId, 10)));
    if (!project || project.userId !== userId) { res.status(404).json({ error: "Project not found" }); return; }
    const rows = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
    res.json({ members: rows });
  } catch (err) {
    console.error("[members] GET /:projectId/members", err);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// ─── POST /projects/:projectId/members ────────────────────────────────────
router.post("/:projectId/members", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { projectId } = req.params;
    const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId, 10)));
    if (!project || project.userId !== userId) { res.status(404).json({ error: "Project not found" }); return; }
    const { memberId, role = "viewer" } = req.body as { memberId: string; role?: string };
    if (!memberId?.trim()) { res.status(400).json({ error: "memberId is required" }); return; }
    if (!["owner", "editor", "viewer"].includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }
    const existing = await db.select().from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)));
    if (existing.length > 0) { res.status(409).json({ error: "Member already exists" }); return; }
    const [row] = await db.insert(projectMembers).values({
      projectId, userId: memberId, addedByUserId: userId, role,
    }).returning();
    res.status(201).json({ member: row });
  } catch (err) {
    console.error("[members] POST /:projectId/members", err);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// ─── PUT /projects/:projectId/members/:memberId ───────────────────────────
router.put("/:projectId/members/:memberId", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { projectId, memberId } = req.params;
    const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId, 10)));
    if (!project || project.userId !== userId) { res.status(404).json({ error: "Project not found" }); return; }
    const { role } = req.body as { role: string };
    if (!["owner", "editor", "viewer"].includes(role)) { res.status(400).json({ error: "Invalid role" }); return; }
    await db.update(projectMembers).set({ role })
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[members] PUT /:projectId/members/:memberId", err);
    res.status(500).json({ error: "Failed to update member" });
  }
});

// ─── DELETE /projects/:projectId/members/:memberId ────────────────────────
router.delete("/:projectId/members/:memberId", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { projectId, memberId } = req.params;
    const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId, 10)));
    if (!project || project.userId !== userId) { res.status(404).json({ error: "Project not found" }); return; }
    await db.delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberId)));
    res.json({ ok: true });
  } catch (err) {
    console.error("[members] DELETE /:projectId/members/:memberId", err);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

export default router;
