// ─── Project Intelligence: Lifecycle + Document Generation ───────────────────
//
// Two endpoints:
//
//   GET  /:projectId/lifecycle
//     Scores each project file for completion (empty / started / complete).
//     Returns an overall score, per-file breakdown, and the next recommended action.
//
//   POST /:projectId/generate-all  (SSE)
//     Generates content for all empty/started files in the project using the
//     type-aware Project Agent. Streams progress events and saves to DB.
//     SSE events:
//       { type: "start",      totalFiles }
//       { type: "file_start", fileId, fileName, index, total }
//       { type: "file_chunk", fileId, content }
//       { type: "file_done",  fileId, fileName }
//       { type: "complete",   generated }
//       { type: "error",      message }
//
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type IRouter, type Request, type Response } from "express";
import { eq }     from "drizzle-orm";
import { db, projects, projectFiles } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { audit }  from "../middlewares/auditLogger";

const router: IRouter = Router();

// ─── Auth guard ───────────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response): string | null {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.user!.id;
}

// ─── Lifecycle scoring ────────────────────────────────────────────────────────
//
// A file is scored by how many template bracket placeholders remain.
// Templates are generated with patterns like [PROJECT NAME], [Date], [XX].
// If the user has written real content, these are replaced or removed.

const BRACKET_RE = /\[[A-Z][A-Z\s\/&'.,\-#%*0-9]{1,40}\]/g;

function scoreContent(content: string): "empty" | "started" | "complete" {
  const text = content.trim();
  if (text.length < 80) return "empty"; // basically nothing there
  const brackets = text.match(BRACKET_RE) ?? [];
  if (brackets.length >= 6) return "empty";    // still mostly template
  if (brackets.length >= 1) return "started";  // partially filled
  return "complete";
}

// Next recommended action based on project state
function recommendedAction(
  complete: number,
  started: number,
  empty: number,
  projectType: string,
): string {
  const total = complete + started + empty;
  if (total === 0) return "Start by opening a file and working with the Project Agent.";
  if (complete === total) return "All documents complete — your project is fully documented.";
  if (started > 0) return `Continue working on ${started} in-progress document${started > 1 ? "s" : ""}.`;
  if (empty === total) return `Use "Generate All Documents" to auto-fill all ${empty} ${projectType} documents with AI.`;
  return `${complete} of ${total} documents done — ${empty} still need content.`;
}

// ─── GET /:projectId/lifecycle ────────────────────────────────────────────────

router.get(
  "/:projectId/lifecycle",
  audit("read_project_lifecycle", "project_lifecycle"),
  async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;

    try {
      const projectId = parseInt(req.params.projectId as string, 10);

      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project || project.userId !== userId) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const files = await db
        .select()
        .from(projectFiles)
        .where(eq(projectFiles.projectId, projectId));

      const scored = files.map(f => ({
        id:     f.id.toString(),
        name:   f.name,
        folder: f.folderId?.toString() ?? null,
        status: scoreContent(f.content ?? ""),
      }));

      const summary = scored.reduce(
        (acc, f) => { acc[f.status]++; return acc; },
        { empty: 0, started: 0, complete: 0 },
      );

      const total = scored.length;
      const score = total === 0 ? 0 : Math.round(
        ((summary.complete + summary.started * 0.4) / total) * 100,
      );

      res.json({
        score,
        summary: { ...summary, total },
        files: scored,
        nextAction: recommendedAction(
          summary.complete,
          summary.started,
          summary.empty,
          project.industry ?? "General",
        ),
        projectType: project.industry ?? "General",
        projectName: project.name,
      });
    } catch (err) {
      console.error("[lifecycle] GET", err);
      res.status(500).json({ error: "Failed to score project lifecycle" });
    }
  },
);

// ─── Type-aware system prompt (mirrors projectChat.ts logic) ─────────────────

const TYPE_EXPERTISE: Record<string, string> = {
  "Film / Movie":    "professional film development expert with deep knowledge of the full production pipeline: development, pre-production, production, post-production, and distribution",
  "Documentary":     "documentary development and production specialist who understands research, pitch, field production, post, and distribution",
  "Video Game":      "senior game designer and studio producer with expertise across the full game development lifecycle",
  "Mobile App":      "senior product manager and mobile app strategist with expertise across iOS, Android, and cross-platform development",
  "Web App / SaaS":  "SaaS product and growth expert with deep knowledge of building web applications from discovery to retention",
  "Business":        "seasoned business strategist and operator with expertise in building and scaling companies",
  "Startup":         "startup advisor with experience across idea validation, product-market fit, fundraising, and scaling",
  "Physical Product":"consumer product development expert with knowledge of design, manufacturing, supply chain, and launch",
  "Book / Novel":    "professional book editor and author coach with expertise in story structure, character, prose craft, and publishing",
  "Music / Album":   "music industry professional with expertise in artist development, music production, and release strategy",
  "Podcast":         "podcast producer and growth strategist with expertise in show development, audio production, and audience building",
  "Online Course":   "instructional designer and course launch specialist who understands curriculum design and course marketing",
};

function buildGeneratorSystem(projectName: string, projectType: string, allFileNames: string[]): string {
  const expertise = TYPE_EXPERTISE[projectType] ?? `expert in ${projectType} projects`;
  const fileList  = allFileNames.length > 0
    ? `\n\nFull project document set (${allFileNames.length} files):\n${allFileNames.map(n => `• ${n}`).join("\n")}`
    : "";
  return `You are a ${expertise}. You are generating professional documents for "${projectName}" — a ${projectType} project.

Rules:
- Write complete, professional, immediately usable content — never leave placeholders or [BRACKETS]
- Be specific to the project name and type — no generic lorem ipsum
- Use industry-standard structure and terminology
- Match the length and depth a professional would produce for this document type
- Write as if you are the lead expert on this specific project${fileList}`;
}

// ─── POST /:projectId/generate-all  (SSE streaming) ──────────────────────────

router.post(
  "/:projectId/generate-all",
  audit("ai_generate_all_documents", "ai_generation"),
  async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;

    const projectId = parseInt(req.params.projectId as string, 10);

    try {
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project || project.userId !== userId) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const allFiles = await db
        .select()
        .from(projectFiles)
        .where(eq(projectFiles.projectId, projectId));

      // Only generate for empty/started files — never overwrite complete user work
      const { fileIds }: { fileIds?: string[] } = req.body ?? {};
      const targetFiles = fileIds && fileIds.length > 0
        ? allFiles.filter(f => fileIds.includes(f.id.toString()))
        : allFiles.filter(f => scoreContent(f.content ?? "") !== "complete");

      if (targetFiles.length === 0) {
        res.json({ message: "All documents are already complete.", generated: 0 });
        return;
      }

      // ── SSE setup ──────────────────────────────────────────────────────────
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sse = (obj: Record<string, unknown>) =>
        res.write(`data: ${JSON.stringify(obj)}\n\n`);

      sse({ type: "start", totalFiles: targetFiles.length });

      const systemPrompt = buildGeneratorSystem(
        project.name,
        project.industry ?? "General",
        allFiles.map(f => f.name),
      );

      let generated = 0;

      for (let i = 0; i < targetFiles.length; i++) {
        const file = targetFiles[i]!;

        sse({
          type:     "file_start",
          fileId:   file.id.toString(),
          fileName: file.name,
          index:    i + 1,
          total:    targetFiles.length,
        });

        try {
          const userMessage =
            `Write the complete, professional "${file.name}" document for "${project.name}". ` +
            `This is a ${project.industry ?? "General"} project. ` +
            `Generate all sections with full, specific, substantive content. ` +
            `No placeholders. No brackets. Write as a leading professional would for this exact project.`;

          const stream = await openai.chat.completions.create({
            model:    "gpt-4o-mini",
            stream:   true,
            system:   systemPrompt,
            messages: [{ role: "user" as const, content: userMessage }],
          } as Parameters<typeof openai.chat.completions.create>[0]);

          let fullContent = "";

          for await (const chunk of stream as AsyncIterable<{ choices: { delta: { content?: string } }[] }>) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) {
              fullContent += delta;
              sse({ type: "file_chunk", fileId: file.id.toString(), content: delta });
            }
          }

          // Save generated content to DB
          await db
            .update(projectFiles)
            .set({ content: fullContent })
            .where(eq(projectFiles.id, file.id));

          sse({ type: "file_done", fileId: file.id.toString(), fileName: file.name });
          generated++;
        } catch (fileErr) {
          console.error(`[generate-all] file ${file.name} failed:`, fileErr);
          sse({ type: "file_error", fileId: file.id.toString(), fileName: file.name, message: "Generation failed for this file — skipping." });
        }
      }

      sse({ type: "complete", generated });
      res.end();
    } catch (err) {
      console.error("[generate-all] POST", err);
      if (!res.headersSent) res.status(500).json({ error: "Document generation failed" });
      else {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Generation failed" })}\n\n`);
        res.end();
      }
    }
  },
);

export default router;
