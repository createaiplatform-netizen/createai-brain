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
import { heavyLimiter, editLimiter } from "../middlewares/rateLimiters";

const router: IRouter = Router();

// ── In-process concurrency guard (H-06) ──────────────────────────────────────
// Prevents two simultaneous generate-all streams on the same project.
// Single-process safe; backed by a module-level Set so it survives requests.
const activeGenerations = new Set<number>();

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
  editLimiter,
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
  heavyLimiter,
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
  heavyLimiter,
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

      // ── Concurrency guard (H-06) ───────────────────────────────────────────
      if (activeGenerations.has(projectId)) {
        res.status(409).json({ error: "Generation already in progress for this project. Please wait." });
        return;
      }
      activeGenerations.add(projectId);

      // ── SSE setup ──────────────────────────────────────────────────────────
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      // Abort all in-flight OpenAI streams if client disconnects
      const abort = new AbortController();
      res.on("close", () => {
        abort.abort();
        activeGenerations.delete(projectId);
      });

      const sse = (obj: Record<string, unknown>) => {
        if (!res.writableEnded) res.write(`data: ${JSON.stringify(obj)}\n\n`);
      };

      sse({ type: "start", totalFiles: targetFiles.length });

      const genome    = (project.genome as ProjectGenome | null | undefined) ?? null;
      const systemPrompt = buildGeneratorSystem(
        project.name,
        project.industry ?? "General",
        allFiles.map(f => f.name),
        genome,
      );

      // ── Batched generation (4 concurrent max) ─────────────────────────────
      // Prevents spawning 30 simultaneous OpenAI streams which would exhaust
      // connection pool and cause unbounded memory/cost growth.
      const BATCH_SIZE = 4;
      let generated = 0;

      for (let i = 0; i < targetFiles.length; i += BATCH_SIZE) {
        if (abort.signal.aborted) break;
        const batch = targetFiles.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.allSettled(
          batch.map(async (file, batchIdx) => {
            const index = i + batchIdx;
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
              model:      "gpt-4o-mini",
              max_tokens: 2500,
              stream:     true,
              system:     systemPrompt,
              messages:   [{ role: "user" as const, content: userMessage }],
            } as Parameters<typeof openai.chat.completions.create>[0]);

            let fullContent = "";

            for await (const chunk of stream as AsyncIterable<{ choices: { delta: { content?: string } }[] }>) {
              if (abort.signal.aborted) break;
              const delta = chunk.choices[0]?.delta?.content ?? "";
              if (delta) {
                fullContent += delta;
                sse({ type: "file_chunk", fileId: file.id.toString(), content: delta });
              }
            }

            if (fullContent && !abort.signal.aborted) {
              await db
                .update(projectFiles)
                .set({ content: fullContent })
                .where(eq(projectFiles.id, file.id));
            }

            sse({ type: "file_done", fileId: file.id.toString(), fileName: file.name });
            return true;
          }),
        );

        generated += batchResults.filter(r => r.status === "fulfilled" && r.value === true).length;
      }

      sse({ type: "complete", generated });
      activeGenerations.delete(projectId);
      res.end();
    } catch (err) {
      console.error("[generate-all] POST", err);
      activeGenerations.delete(projectId);
      if (!res.headersSent) res.status(500).json({ error: "Document generation failed" });
      else {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Generation failed" })}\n\n`);
        res.end();
      }
    }
  },
);

// ─── POST /:projectId/instant-edit/:fileId  (SSE) ────────────────────────────
//
// Instant-edit AI agent: streams an AI-improved version of a single document
// directly back to the frontend and saves the result to the database.
//
// SSE events:
//   { type: "start",   mode, fileName }
//   { type: "chunk",   content }
//   { type: "done",    fileId, fileName }
//   { type: "error",   message }
//
// Body: { mode: "improve" | "rewrite" | "expand" | "summarize" | "proof", context?: string }

router.post(
  "/:projectId/instant-edit/:fileId",
  editLimiter,
  audit("ai_instant_edit", "ai_generation"),
  async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (!userId) return;

    const projectId = parseInt(req.params.projectId as string, 10);
    const fileId    = parseInt(req.params.fileId    as string, 10);

    const { mode = "improve", context = "" } = (req.body ?? {}) as {
      mode?: "improve" | "rewrite" | "expand" | "summarize" | "proof";
      context?: string;
    };

    try {
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project || project.userId !== userId) {
        res.status(404).json({ error: "Project not found" }); return;
      }

      const [file] = await db.select().from(projectFiles).where(eq(projectFiles.id, fileId));
      if (!file || file.projectId !== projectId) {
        res.status(404).json({ error: "File not found" }); return;
      }

      const currentContent = file.content ?? "";
      const projectType    = project.industry ?? "General";

      const modePrompts: Record<string, string> = {
        improve:   `You are an expert ${projectType} professional. Improve the following document: enhance clarity, completeness, and professional quality. Keep the existing structure and headings. Fill in all placeholder brackets with realistic, high-quality content specific to "${project.name}". Return only the improved document, no preamble.`,
        rewrite:   `You are an expert ${projectType} professional. Completely rewrite the following document for "${project.name}". Keep the same purpose and structure but use fresh language, deeper insight, and maximum professional quality. Fill all placeholders. Return only the rewritten document.`,
        expand:    `You are an expert ${projectType} professional. Significantly expand the following document for "${project.name}" by adding depth, detail, and actionable specifics in every section. Double the level of detail. Fill all placeholders. Return only the expanded document.`,
        summarize: `You are an expert ${projectType} professional. Distill the following document for "${project.name}" into its most essential points. Use bullet points where appropriate. Keep critical decisions and key data. Return only the condensed document.`,
        proof:     `You are an expert editor. Proofread and polish the following document for "${project.name}": fix all grammar, spelling, and punctuation; improve sentence flow; remove repetition; standardise formatting. Do not change content, only quality. Return only the corrected document.`,
      };

      const systemPrompt = modePrompts[mode] ?? modePrompts.improve;
      const userPrompt   = context
        ? `Additional context: ${context}\n\n---\n\n${currentContent || "[Document is empty — create from scratch]"}`
        : currentContent || `[Document is empty — create complete ${file.name} from scratch for "${project.name}"]`;

      // SSE headers
      res.setHeader("Content-Type",  "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection",    "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      // Abort stream on client disconnect
      const abort = new AbortController();
      res.on("close", () => abort.abort());

      const send = (data: unknown) => {
        if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      send({ type: "start", mode, fileName: file.name });

      const stream = await openai.chat.completions.create({
        model:       "gpt-4o",
        temperature: 0.4,
        max_tokens:  3000,
        stream:      true,
        messages: [
          { role: "system",  content: systemPrompt },
          { role: "user",    content: userPrompt   },
        ],
      } as Parameters<typeof openai.chat.completions.create>[0]);

      let fullContent = "";
      try {
        for await (const chunk of stream as AsyncIterable<{ choices: { delta: { content?: string } }[] }>) {
          if (abort.signal.aborted) break;
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullContent += delta;
            send({ type: "chunk", content: delta });
          }
        }
      } catch (streamErr: unknown) {
        if ((streamErr as { name?: string })?.name !== "AbortError") throw streamErr;
      }

      // Save to DB only if we got content and client is still connected
      if (fullContent.trim() && !abort.signal.aborted) {
        await db.update(projectFiles).set({ content: fullContent }).where(eq(projectFiles.id, fileId));
      }

      send({ type: "done", fileId, fileName: file.name });
      res.end();
    } catch (err) {
      console.error("[instant-edit] POST", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Instant edit failed" });
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Edit failed" })}\n\n`);
        res.end();
      }
    }
  },
);

export default router;
