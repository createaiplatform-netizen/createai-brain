/**
 * fileVersions.ts — File version history & one-click rollback
 *
 * Mounted under /projects (mergeParams: true) so path params from
 * the parent router are available.
 *
 *   GET  /projects/:id/files/:fileId/versions
 *         — list all saved versions (newest first, max 30)
 *
 *   POST /projects/:id/files/:fileId/versions/:versionId/rollback
 *         — restore a prior version; auto-saves current as snapshot first
 */

import { Router } from "express";
import { and, asc, desc, eq, lt } from "drizzle-orm";
import { db, fileVersions, projectFiles, projects } from "@workspace/db";
import type { Request, Response } from "express";

const router = Router({ mergeParams: true });

const MAX_VERSIONS_PER_FILE = 30;

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return (req.user as { id?: string })?.id ?? null;
}

// ─── GET /:id/files/:fileId/versions ────────────────────────────────────────
router.get("/:id/files/:fileId/versions", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const projectId = parseInt(req.params.id as string, 10);
  const fileId    = parseInt(req.params.fileId as string, 10);

  try {
    const [owner] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!owner) { res.status(404).json({ error: "Project not found" }); return; }

    const versions = await db.select().from(fileVersions)
      .where(and(eq(fileVersions.fileId, fileId), eq(fileVersions.projectId, projectId)))
      .orderBy(desc(fileVersions.versionNum))
      .limit(MAX_VERSIONS_PER_FILE);

    res.json({ versions });
  } catch (err) {
    console.error("[fileVersions] GET versions:", err);
    res.status(500).json({ error: "Failed to list versions" });
  }
});

// ─── POST /:id/files/:fileId/versions/:versionId/rollback ───────────────────
router.post("/:id/files/:fileId/versions/:versionId/rollback", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const projectId  = parseInt(req.params.id as string, 10);
  const fileId     = parseInt(req.params.fileId as string, 10);
  const versionId  = parseInt(req.params.versionId as string, 10);

  try {
    const [owner] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!owner) { res.status(404).json({ error: "Project not found" }); return; }

    const [target] = await db.select().from(fileVersions)
      .where(and(eq(fileVersions.id, versionId), eq(fileVersions.fileId, fileId)));
    if (!target) { res.status(404).json({ error: "Version not found" }); return; }

    // Snapshot current content before overwriting
    const [currentFile] = await db.select().from(projectFiles).where(eq(projectFiles.id, fileId));
    if (currentFile) {
      const [last] = await db.select().from(fileVersions)
        .where(eq(fileVersions.fileId, fileId))
        .orderBy(desc(fileVersions.versionNum))
        .limit(1);
      const nextNum = (last?.versionNum ?? 0) + 1;

      await db.insert(fileVersions).values({
        fileId, projectId, userId,
        content:    currentFile.content,
        versionNum: nextNum,
        label:      `Auto-saved before rollback to v${target.versionNum}`,
      });

      // Prune oldest versions beyond MAX_VERSIONS_PER_FILE
      const oldest = await db.select({ id: fileVersions.id, versionNum: fileVersions.versionNum })
        .from(fileVersions)
        .where(eq(fileVersions.fileId, fileId))
        .orderBy(asc(fileVersions.versionNum));
      if (oldest.length > MAX_VERSIONS_PER_FILE) {
        const toDelete = oldest.slice(0, oldest.length - MAX_VERSIONS_PER_FILE);
        for (const v of toDelete) {
          await db.delete(fileVersions).where(eq(fileVersions.id, v.id));
        }
      }
    }

    // Restore target content to the file
    await db.update(projectFiles)
      .set({ content: target.content, updatedAt: new Date() })
      .where(and(eq(projectFiles.id, fileId), eq(projectFiles.projectId, projectId)));

    res.json({ success: true, restoredVersion: target.versionNum, content: target.content });
  } catch (err) {
    console.error("[fileVersions] POST rollback:", err);
    res.status(500).json({ error: "Failed to rollback" });
  }
});

export default router;
