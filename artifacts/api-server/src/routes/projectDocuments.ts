// ─── Project Intelligence: Lifecycle + Document Generation + Project Genome ───
//
// Endpoints:
//
//   GET  /:projectId/lifecycle
//     Scores each project file for completion (empty / started / complete).
//     Returns overall score, per-file breakdown, and next recommended action.
//
//   GET  /:projectId/genome
//     Returns the stored ProjectGenome (AI-generated structured project spec).
//     Returns { genome: null } if not yet generated.
//
//   POST /:projectId/genome
//     Generates and stores a ProjectGenome for the project using GPT-4o.
//     Accepts optional intent { audience, purpose, tone } in request body.
//     Returns { genome: ProjectGenome }.
//
//   POST /:projectId/generate-all  (SSE)
//     Generates content for all empty/started files IN PARALLEL using the
//     type-aware Project Agent. Streams progress events and saves to DB.
//
//     SSE events:
//       { type: "start",       totalFiles }
//       { type: "file_start",  fileId, fileName, index, total }
//       { type: "file_chunk",  fileId, content }
//       { type: "file_done",   fileId, fileName }
//       { type: "file_error",  fileId, fileName, message }
//       { type: "complete",    generated }
//       { type: "error",       message }
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

const BRACKET_RE = /\[[A-Z][A-Z\s\/&'.,\-#%*0-9]{1,40}\]/g;

function scoreContent(content: string): "empty" | "started" | "complete" {
  const text = content.trim();
  if (text.length < 80) return "empty";
  const brackets = text.match(BRACKET_RE) ?? [];
  if (brackets.length >= 6) return "empty";
  if (brackets.length >= 1) return "started";
  return "complete";
}

function recommendedAction(complete: number, started: number, empty: number, projectType: string): string {
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

      const files = await db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId));

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
        nextAction: recommendedAction(summary.complete, summary.started, summary.empty, project.industry ?? "General"),
        projectType: project.industry ?? "General",
        projectName: project.name,
      });
    } catch (err) {
      console.error("[lifecycle] GET", err);
      res.status(500).json({ error: "Failed to score project lifecycle" });
    }
  },
);

// ─── Project Genome ───────────────────────────────────────────────────────────
//
// A ProjectGenome is a structured AI-generated spec capturing:
//   vision      — purpose, audience, tone, differentiators
//   structure   — phases, key deliverables
//   assetPlan   — documents needed, visual style, copy themes
//   executionPlan — timeline, risks, tools
//   lifecycle   — current phase (IDEATION → SCOPING → PRODUCTION → POLISH),
//                 next actions

interface ProjectIntent {
  audience?:    string;
  purpose?:     string;
  tone?:        string;
  constraints?: string;
}

interface ProjectGenome {
  vision: {
    purpose:          string;
    audience:         string;
    tone:             string;
    differentiators:  string[];
  };
  structure: {
    phases:          string[];
    keyDeliverables: string[];
  };
  assetPlan: {
    documentsNeeded: string[];
    visualStyle:     string;
    copyThemes:      string[];
  };
  executionPlan: {
    estimatedTimeline: string;
    keyRisks:          string[];
    suggestedTools:    string[];
  };
  lifecycle: {
    currentPhase: "IDEATION" | "SCOPING" | "PRODUCTION" | "POLISH";
    nextActions:  string[];
  };
  generatedAt: string;
}

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

// GET /:projectId/genome — return stored genome (or null)
router.get(
  "/:projectId/genome",
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
      res.json({ genome: (project.genome as ProjectGenome) ?? null });
    } catch (err) {
      console.error("[genome] GET", err);
      res.status(500).json({ error: "Failed to fetch genome" });
    }
  },
);

// POST /:projectId/genome — generate + store genome
router.post(
  "/:projectId/genome",
  audit("ai_generate_genome", "project_genome"),
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

      const { intent }: { intent?: ProjectIntent } = req.body ?? {};
      const expertise = TYPE_EXPERTISE[project.industry ?? "General"] ?? `expert in ${project.industry} projects`;

      const intentBlock = intent
        ? `\nUser-provided intent:\n- Purpose: ${intent.purpose ?? "not specified"}\n- Audience: ${intent.audience ?? "not specified"}\n- Tone: ${intent.tone ?? "not specified"}${intent.constraints ? `\n- Constraints: ${intent.constraints}` : ""}`
        : "";

      const systemPrompt = `You are a ${expertise} and world-class project architect.
Generate a structured ProjectGenome JSON for a new project.
Return ONLY valid JSON — no markdown fences, no explanation, no extra text.`;

      const userMessage = `Generate a ProjectGenome for:
Project Name: "${project.name}"
Project Type: ${project.industry ?? "General"}${intentBlock}

Return exactly this JSON structure (all fields required, no extra keys):
{
  "vision": {
    "purpose": "one compelling sentence on what this project achieves",
    "audience": "specific description of who this is for",
    "tone": "one of: professional | creative | bold | cinematic | technical | friendly | inspiring",
    "differentiators": ["what makes this unique", "a second differentiator"]
  },
  "structure": {
    "phases": ["IDEATION — description", "PRODUCTION — description", "LAUNCH — description"],
    "keyDeliverables": ["deliverable 1", "deliverable 2", "deliverable 3", "deliverable 4"]
  },
  "assetPlan": {
    "documentsNeeded": ["doc 1", "doc 2", "doc 3"],
    "visualStyle": "description of visual direction and aesthetic",
    "copyThemes": ["theme 1", "theme 2"]
  },
  "executionPlan": {
    "estimatedTimeline": "X–Y weeks/months",
    "keyRisks": ["risk 1", "risk 2"],
    "suggestedTools": ["tool or resource 1", "tool or resource 2"]
  },
  "lifecycle": {
    "currentPhase": "IDEATION",
    "nextActions": ["immediate action 1", "immediate action 2", "immediate action 3"]
  }
}`;

      const completion = await openai.chat.completions.create({
        model:       "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userMessage },
        ],
      } as Parameters<typeof openai.chat.completions.create>[0]);

      const raw = (completion as { choices: { message: { content: string } }[] }).choices[0]?.message?.content ?? "{}";

      let genome: ProjectGenome;
      try {
        genome = JSON.parse(raw) as ProjectGenome;
      } catch {
        // Try stripping markdown fences if model added them anyway
        const stripped = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        genome = JSON.parse(stripped) as ProjectGenome;
      }

      genome.generatedAt = new Date().toISOString();

      // Store intent + genome in DB
      await db
        .update(projects)
        .set({
          genome: genome as unknown as Record<string, unknown>,
          intent: (intent ?? null) as unknown as Record<string, unknown> | null,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      res.json({ genome });
    } catch (err) {
      console.error("[genome] POST", err);
      res.status(500).json({ error: "Failed to generate genome" });
    }
  },
);

// ─── Document generator system prompt ────────────────────────────────────────

function buildGeneratorSystem(projectName: string, projectType: string, allFileNames: string[], genome?: ProjectGenome | null): string {
  const expertise = TYPE_EXPERTISE[projectType] ?? `expert in ${projectType} projects`;
  const fileList  = allFileNames.length > 0
    ? `\n\nFull project document set (${allFileNames.length} files):\n${allFileNames.map(n => `• ${n}`).join("\n")}`
    : "";
  const genomePart = genome?.vision
    ? `\n\nProject Vision: ${genome.vision.purpose}\nAudience: ${genome.vision.audience}\nTone: ${genome.vision.tone}`
    : "";
  return `You are a ${expertise}. You are generating professional documents for "${projectName}" — a ${projectType} project.${genomePart}

Rules:
- Write complete, professional, immediately usable content — never leave placeholders or [BRACKETS]
- Be specific to the project name and type — no generic lorem ipsum
- Use industry-standard structure and terminology
- Match the length and depth a professional would produce for this document type
- Write as if you are the lead expert on this specific project${fileList}`;
}

// ─── POST /:projectId/generate-all  (SSE, parallel) ──────────────────────────
//
// Runs all file generators CONCURRENTLY via Promise.allSettled —
// files that share no dependencies are generated in parallel, dramatically
// reducing total generation time (N files ≈ time of 1 file).
//
// SSE events interleave safely because Node.js is single-threaded;
// res.write() calls from concurrent async functions are serialised by the
// event loop without data corruption.

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

      const allFiles = await db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId));

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

      const genome    = (project.genome as ProjectGenome | null | undefined) ?? null;
      const systemPrompt = buildGeneratorSystem(
        project.name,
        project.industry ?? "General",
        allFiles.map(f => f.name),
        genome,
      );

      // ── Parallel generation via Promise.allSettled ─────────────────────────
      //
      // Each file generator:
      //   1. Emits file_start (with index for ordering in the UI)
      //   2. Streams token chunks as file_chunk events
      //   3. Saves completed content to DB
      //   4. Emits file_done (or file_error on failure)
      //
      // All generators run concurrently — no await between them.

      const results = await Promise.allSettled(
        targetFiles.map(async (file, index) => {
          sse({
            type:     "file_start",
            fileId:   file.id.toString(),
            fileName: file.name,
            index:    index + 1,
            total:    targetFiles.length,
          });

          const userMessage =
            `Write the complete, professional "${file.name}" document for "${project.name}". ` +
            `This is a ${project.industry ?? "General"} project. ` +
            (genome?.vision?.purpose ? `Project purpose: ${genome.vision.purpose}. ` : "") +
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

          await db
            .update(projectFiles)
            .set({ content: fullContent })
            .where(eq(projectFiles.id, file.id));

          sse({ type: "file_done", fileId: file.id.toString(), fileName: file.name });
          return true;
        }).map(p =>
          p.catch((fileErr: unknown) => {
            console.error("[generate-all] file failed:", fileErr);
            return false;
          }),
        ),
      );

      const generated = results.filter(r => r.status === "fulfilled" && r.value === true).length;

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
