/**
 * movieGenerate.ts — Live AI movie production engine
 *
 *  POST /movie/generate   — SSE: parse project content → DALL-E 3 keyframes
 *                           + GPT dialogue/direction + manifest persisted to file
 */

import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, projects, projectFiles } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedScene {
  sceneIndex:  number;
  title:       string;
  location:    string;
  time:        string;
  description: string;
  dialogue:    string;
}

export interface SceneManifest {
  sceneIndex:  number;
  title:       string;
  imageUrl:    string;
  dialogue:    string;
  cameraDir:   string;
  musicCue:    string;
  moodColor:   string;
  durationSec: number;
}

export interface MovieManifest {
  projectName: string;
  titleCard:   { title: string; tagline: string; creditLines: string[] };
  scenes:      SceneManifest[];
  generatedAt: string;
}

// ─── Scene parser ─────────────────────────────────────────────────────────────

function parseScenes(content: string): ParsedScene[] {
  // Priority 1: Standard screenplay format (INT. / EXT.)
  const headingRe = /^(INT\.|EXT\.|INT\/EXT\.?|EXT\/INT\.?)[^\n]+/gim;
  const headings: Array<{ text: string; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(content)) !== null) {
    headings.push({ text: m[0].trim(), index: m.index });
  }

  if (headings.length >= 2) {
    return headings.slice(0, 8).map((h, i) => {
      const end  = headings[i + 1]?.index ?? content.length;
      const body = content.slice(h.index, end).trim();
      const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
      const dash  = h.text.indexOf(" - ");
      const location = dash !== -1 ? h.text.slice(0, dash).replace(/^(INT\.|EXT\.|INT\/EXT\.?|EXT\/INT\.?)\s*/i, "").trim() : h.text.slice(4, 50);
      const time     = dash !== -1 ? h.text.slice(dash + 3).trim() : "DAY";
      return {
        sceneIndex:  i,
        title:       h.text.slice(0, 70),
        location,
        time,
        description: lines.slice(1, 5).join(" ").slice(0, 350),
        dialogue:    lines.slice(5, 15).join("\n").slice(0, 600),
      };
    });
  }

  // Priority 2: Numbered scenes
  const numRe = /^(?:SCENE|Scene)\s*(\d+)[:\.\s]/gim;
  const numbered: Array<{ text: string; index: number }> = [];
  while ((m = numRe.exec(content)) !== null) {
    numbered.push({ text: m[0].trim(), index: m.index });
  }

  if (numbered.length >= 2) {
    return numbered.slice(0, 8).map((h, i) => {
      const end  = numbered[i + 1]?.index ?? content.length;
      const body = content.slice(h.index, end).trim();
      const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
      return {
        sceneIndex:  i,
        title:       h.text,
        location:    "",
        time:        "",
        description: lines.slice(1, 5).join(" ").slice(0, 350),
        dialogue:    lines.slice(5, 15).join("\n").slice(0, 600),
      };
    });
  }

  // Priority 3: Beat sheet items (□, –, *, or dashes)
  const beats = content.split("\n").filter(l => /^[□–\-•\*]\s/.test(l.trim()) && l.trim().length > 20);
  if (beats.length >= 3) {
    return beats.slice(0, 8).map((b, i) => ({
      sceneIndex:  i,
      title:       `Beat ${i + 1}`,
      location:    "",
      time:        "",
      description: b.replace(/^[□–\-•\*]\s/, "").trim().slice(0, 350),
      dialogue:    "",
    }));
  }

  // Last resort: split into 6 paragraph chunks
  const paragraphs = content.split(/\n{2,}/).filter(p => p.trim().length > 30);
  const chunk = Math.max(1, Math.floor(paragraphs.length / 6));
  return Array.from({ length: Math.min(6, Math.ceil(paragraphs.length / chunk)) }, (_, i) => ({
    sceneIndex:  i,
    title:       `Scene ${i + 1}`,
    location:    "",
    time:        "",
    description: paragraphs.slice(i * chunk, (i + 1) * chunk).join(" ").slice(0, 350),
    dialogue:    "",
  }));
}

// ─── SSE helper ──────────────────────────────────────────────────────────────

function sse(res: Response, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── POST /movie/generate ────────────────────────────────────────────────────

router.post("/generate", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { projectId } = req.body as { projectId?: string | number };
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }

  const pid = typeof projectId === "string" ? parseInt(projectId, 10) : projectId;

  // ── SSE headers ───────────────────────────────────────────────────────────
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();

  try {
    // 1. Load project
    sse(res, { type: "status", message: "Loading project…" });
    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) {
      sse(res, { type: "error", message: "Project not found" });
      res.end(); return;
    }

    // 2. Load all project files
    const files = await db.select().from(projectFiles).where(eq(projectFiles.projectId, pid));
    if (!files.length) {
      sse(res, { type: "error", message: "No project files found. Add a script or outline first." });
      res.end(); return;
    }

    // 3. Prioritise screenplay / script files for scene extraction
    const priority = ["script", "screenplay", "beat", "scene", "story", "outline", "treatment", "logline"];
    const sorted   = [...files].sort((a, b) => {
      const aS = priority.findIndex(k => a.name.toLowerCase().includes(k));
      const bS = priority.findIndex(k => b.name.toLowerCase().includes(k));
      return (aS === -1 ? 99 : aS) - (bS === -1 ? 99 : bS);
    });
    const combined = sorted.map(f => f.content ?? "").filter(c => c.trim()).join("\n\n");

    if (!combined.trim()) {
      sse(res, { type: "error", message: "Project files have no content. Write your script first." });
      res.end(); return;
    }

    // 4. Parse scenes
    sse(res, { type: "status", message: "Parsing scenes from your script…" });
    const rawScenes = parseScenes(combined);
    const MAX       = Math.min(rawScenes.length, 6);
    const scenes    = rawScenes.slice(0, MAX);

    sse(res, { type: "start", total: MAX, projectName: project.name, projectType: project.industry });

    // 5. Character context (best-effort)
    const charFile    = files.find(f => f.name.toLowerCase().includes("character"));
    const charContext = charFile ? charFile.content.slice(0, 600) : "";

    // 6. Generate each scene
    const manifest: SceneManifest[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]!;

      // ── 6a. DALL-E 3 keyframe ─────────────────────────────────────────────
      sse(res, {
        type: "progress", scene: i + 1, total: MAX, step: "visual",
        message: `Scene ${i + 1}/${MAX} — generating cinematic keyframe…`,
      });

      let imageUrl = "";
      try {
        const dallePrompt = [
          "Cinematic movie still, 35mm film, photorealistic, award-winning cinematography,",
          `"${project.name}"`,
          scene.location ? `location: ${scene.location}` : "",
          scene.time     ? `${scene.time} lighting` : "natural lighting",
          scene.description ? scene.description.slice(0, 180) : "",
          "ultra-high detail, dramatic depth of field, IMAX quality",
        ].filter(Boolean).join(" ");

        const img = await openai.images.generate({
          model:   "dall-e-3",
          prompt:  dallePrompt.slice(0, 1000),
          n:       1,
          size:    "1792x1024",
          quality: "standard",
        });
        imageUrl = img.data?.[0]?.url ?? "";
      } catch (imgErr) {
        console.error(`[movie] DALL-E scene ${i + 1}:`, imgErr);
        // Non-fatal — continue with blank image
      }

      // ── 6b. GPT — dialogue / direction / music ────────────────────────────
      sse(res, {
        type: "progress", scene: i + 1, total: MAX, step: "script",
        message: `Scene ${i + 1}/${MAX} — writing dialogue and direction…`,
      });

      let dialogue    = scene.dialogue.slice(0, 300) || scene.description.slice(0, 200);
      let cameraDir   = "";
      let musicCue    = "";
      let moodColor   = "#1e293b";
      let durationSec = 45;

      try {
        const gpt = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            {
              role: "system",
              content: [
                `You are the director and screenwriter for "${project.name}" (${project.industry}).`,
                charContext ? `Characters:\n${charContext}` : "",
              ].filter(Boolean).join("\n"),
            },
            {
              role: "user",
              content: [
                `Scene ${i + 1} of ${scenes.length}: "${scene.title}"`,
                scene.location    ? `Location: ${scene.location}` : "",
                scene.time        ? `Time: ${scene.time}` : "",
                scene.description ? `Description: ${scene.description.slice(0, 250)}` : "",
                scene.dialogue    ? `Draft dialogue: ${scene.dialogue.slice(0, 200)}` : "",
                "",
                "Return ONLY valid JSON (no markdown, no explanation):",
                `{"dialogue":"2-4 lines of punchy dialogue or narration. Each line prefixed with CHARACTER: or NARRATOR:","cameraDir":"One-sentence camera direction","musicCue":"One-line music/sound direction","moodHex":"#rrggbb hex for scene mood","durationSec":45}`,
              ].filter(Boolean).join("\n"),
            },
          ],
          max_tokens: 350,
          temperature: 0.82,
        });

        const raw = gpt.choices[0]?.message?.content?.trim() ?? "{}";
        // Strip markdown fences if present
        const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const p = JSON.parse(cleaned) as {
          dialogue?: string; cameraDir?: string; musicCue?: string;
          moodHex?: string; durationSec?: number;
        };
        dialogue    = p.dialogue    ?? dialogue;
        cameraDir   = p.cameraDir   ?? "";
        musicCue    = p.musicCue    ?? "";
        moodColor   = p.moodHex     ?? moodColor;
        durationSec = typeof p.durationSec === "number" ? p.durationSec : durationSec;
      } catch (gptErr) {
        console.error(`[movie] GPT scene ${i + 1}:`, gptErr);
      }

      const entry: SceneManifest = { sceneIndex: i, title: scene.title, imageUrl, dialogue, cameraDir, musicCue, moodColor, durationSec };
      manifest.push(entry);
      sse(res, { type: "scene_done", scene: i + 1, total: MAX, data: entry });
    }

    // 7. Title card + credits
    sse(res, { type: "status", message: "Generating title card and credits…" });
    let titleCard = { title: project.name, tagline: "", creditLines: [] as string[] };
    try {
      const tc = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: "You generate cinematic title cards. Return only valid JSON." },
          {
            role: "user",
            content: `Project: "${project.name}" (${project.industry})\nReturn JSON: {"tagline":"one compelling cinematic tagline","creditLines":["Written by ...","Directed by ...","A ${project.name} Production"]}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });
      const raw2   = tc.choices[0]?.message?.content?.trim() ?? "{}";
      const clean2 = raw2.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const p2     = JSON.parse(clean2) as { tagline?: string; creditLines?: string[] };
      titleCard    = { title: project.name, tagline: p2.tagline ?? "", creditLines: p2.creditLines ?? [] };
    } catch { /* non-fatal */ }

    // 8. Save manifest to project file
    const finalManifest: MovieManifest = {
      projectName: project.name,
      titleCard,
      scenes: manifest,
      generatedAt: new Date().toISOString(),
    };
    const manifestJson = JSON.stringify(finalManifest, null, 2);

    const existing = files.find(f => f.name === "Movie Production Manifest");
    if (existing) {
      await db.update(projectFiles)
        .set({ content: manifestJson, updatedAt: new Date() })
        .where(eq(projectFiles.id, existing.id));
    } else {
      await db.insert(projectFiles).values({
        projectId: pid,
        name:      "Movie Production Manifest",
        content:   manifestJson,
        fileType:  "json",
        size:      `${Math.round(manifestJson.length / 1024)} KB`,
      });
    }

    // 9. Done
    sse(res, { type: "done", manifest: finalManifest });
    res.end();

  } catch (err) {
    console.error("[movie] fatal:", err);
    sse(res, { type: "error", message: err instanceof Error ? err.message : String(err) });
    res.end();
  }
});

export default router;
