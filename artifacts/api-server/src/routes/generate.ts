/**
 * generate.ts — UltraMax Unified Project Generation Pipeline
 *
 * POST /generate — Single SSE endpoint replacing /movie/generate + /render/generate
 *   • Cinematographic DALL-E prompts (anamorphic lens, film stock, color grade)
 *   • GPT branching choices injected for Film pivotal scenes
 *   • HTML5 game/app code validation + automatic retry on failure
 *   • Partial manifest checkpointing after every frame (enables session resume)
 *   • Generated game/app HTML persisted and serveable via GET /generate/serve/:projectId
 *
 * GET /generate/serve/:projectId?type=game|app — returns stored HTML
 */

import { Router, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, projects, projectFiles } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ─── Types ───────────────────────────────────────────────────────────────────

export type RenderMode =
  | "cinematic" | "game" | "app" | "book"
  | "course"    | "pitch" | "showcase"
  | "music"     | "podcast" | "document";

export interface SceneChoice { label: string; targetIndex: number; }

export interface SceneManifest {
  sceneIndex:  number;
  title:       string;
  imageUrl:    string;
  dialogue:    string;
  cameraDir:   string;
  musicCue:    string;
  moodColor:   string;
  durationSec: number;
  isPivotal?:  boolean;
  choices?:    SceneChoice[];
}

export interface RenderFrame {
  index:        number;
  title:        string;
  imageUrl:     string;
  content:      string;
  subContent?:  string;
  badge?:       string;
  moodColor?:   string;
  durationSec?: number;
}

export interface UnifiedManifest {
  projectName:   string;
  projectType:   string;
  renderMode:    RenderMode;
  titleCard:     { title: string; tagline: string; creditLines: string[] };
  scenes?:       SceneManifest[];
  frames?:       RenderFrame[];
  generatedCode?: string;
  serveUrl?:     string;
  generatedAt:   string;
}

// ─── SSE helper ───────────────────────────────────────────────────────────────

function sse(res: Response, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── Mode detection ───────────────────────────────────────────────────────────

function detectRenderMode(industry: string): RenderMode {
  if (["Film / Movie", "Documentary"].includes(industry))   return "cinematic";
  if (industry === "Video Game")                             return "game";
  if (["Mobile App", "Web App / SaaS"].includes(industry))  return "app";
  if (industry === "Book / Novel")                           return "book";
  if (industry === "Online Course")                          return "course";
  if (["Business", "Startup"].includes(industry))            return "pitch";
  if (industry === "Physical Product")                       return "showcase";
  if (industry === "Music / Album")                          return "music";
  if (industry === "Podcast")                                return "podcast";
  return "document";
}

// ─── File prioritiser ────────────────────────────────────────────────────────

function prioritiseFiles(
  files: { name: string; content: string | null; fileType: string | null }[],
  keywords: string[],
): string {
  return [...files]
    .sort((a, b) => {
      const aS = keywords.findIndex(k => a.name.toLowerCase().includes(k));
      const bS = keywords.findIndex(k => b.name.toLowerCase().includes(k));
      return (aS === -1 ? 99 : aS) - (bS === -1 ? 99 : bS);
    })
    .map(f => f.content ?? "")
    .filter(c => c.trim())
    .join("\n\n")
    .slice(0, 6000);
}

// ─── AI helpers ──────────────────────────────────────────────────────────────

async function dalleImage(
  prompt: string,
  size: "1792x1024" | "1024x1024" = "1792x1024",
): Promise<string> {
  try {
    const img = await openai.images.generate({
      model: "dall-e-3", prompt: prompt.slice(0, 1000),
      n: 1, size, quality: "standard",
    });
    return img.data?.[0]?.url ?? "";
  } catch { return ""; }
}

async function gptJSON<T>(
  system: string,
  user: string,
  maxTokens = 400,
): Promise<T | null> {
  try {
    const r = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: maxTokens, temperature: 0.8,
    });
    const raw = r.choices[0]?.message?.content?.trim() ?? "{}";
    return JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()) as T;
  } catch { return null; }
}

async function gptText(
  system: string,
  user: string,
  maxTokens = 1200,
): Promise<string> {
  try {
    const r = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: maxTokens, temperature: 0.85,
    });
    return r.choices[0]?.message?.content?.trim() ?? "";
  } catch { return ""; }
}

// ─── Cinematographic DALL-E prompt builders ───────────────────────────────────

const FILM_STOCK: Record<string, string> = {
  warm:  "Kodak Vision3 500T film stock, warm golden tones",
  cool:  "Fuji Eterna 500T film stock, cool blue-green tones",
  gritty:"Kodak 5219 pushed 2 stops, high contrast, grain",
  clean: "ARRI LogC color science, clean natural tones",
};

const LENS_STYLE: Record<string, string> = {
  epic:       "anamorphic 2.39:1, oval bokeh, horizontal lens flares",
  intimate:   "spherical 1.85:1, shallow depth of field, 50mm equivalent",
  wide:       "ultra-wide 14mm, dramatic perspective, deep focus",
  telephoto:  "200mm telephoto compression, background blur, shallow focus",
};

function cinematicDallePrompt(
  scene: { location: string; description: string; moodColor?: string },
  projectName: string,
  index: number,
): string {
  const lensKeys = Object.keys(LENS_STYLE);
  const stockKeys = Object.keys(FILM_STOCK);
  const lens  = LENS_STYLE[lensKeys[index % lensKeys.length]!]!;
  const stock = FILM_STOCK[stockKeys[index % stockKeys.length]!]!;
  return [
    `Cinematic film still, ${lens}, ${stock},`,
    `shot on ARRI ALEXA 35, award-winning cinematography,`,
    `"${projectName}",`,
    scene.location ? `location: ${scene.location},` : "",
    scene.description.slice(0, 160),
    `dramatic depth of field, professional color grading, photorealistic, IMAX quality`,
  ].filter(Boolean).join(" ");
}

// ─── Code validator ───────────────────────────────────────────────────────────

interface ValidationResult { valid: boolean; issues: string[] }

function validateGameHTML(html: string): ValidationResult {
  const issues: string[] = [];
  if (!html.includes("requestAnimationFrame")) issues.push("missing game loop (requestAnimationFrame)");
  if (!html.toLowerCase().includes("canvas"))  issues.push("missing canvas element");
  if (!html.includes("</html>"))               issues.push("incomplete HTML document");
  if (html.length < 2000)                      issues.push("code too short to be a real game");
  return { valid: issues.length === 0, issues };
}

function validateAppHTML(html: string): ValidationResult {
  const issues: string[] = [];
  if (!html.includes("<!DOCTYPE") && !html.includes("<html")) issues.push("not a valid HTML document");
  if (!html.includes("</script>"))                            issues.push("missing JavaScript");
  if (!html.includes("</style>") && !html.includes("style"))  issues.push("missing CSS");
  if (html.length < 1500)                                     issues.push("code too short to be a real app");
  return { valid: issues.length === 0, issues };
}

// ─── Partial checkpoint ───────────────────────────────────────────────────────

async function saveCheckpoint(
  pid: number,
  existingFiles: { id: number; name: string }[],
  partial: object,
  mode: string,
): Promise<void> {
  const name = `_checkpoint_${mode}`;
  const json = JSON.stringify(partial, null, 2);
  const existing = existingFiles.find(f => f.name === name);
  try {
    if (existing) {
      await db.update(projectFiles)
        .set({ content: json, updatedAt: new Date() })
        .where(eq(projectFiles.id, existing.id));
    } else {
      await db.insert(projectFiles).values({
        projectId: pid, name, content: json, fileType: "json",
        size: `${Math.round(json.length / 1024)} KB`,
      });
    }
  } catch { /* non-fatal checkpoint failure */ }
}

// ─── Title card ───────────────────────────────────────────────────────────────

async function makeTitleCard(
  name: string,
  mode: RenderMode,
): Promise<UnifiedManifest["titleCard"]> {
  const label: Record<RenderMode, string> = {
    cinematic: "film", game: "video game", app: "app", book: "book",
    course: "online course", pitch: "pitch deck", showcase: "product showcase",
    music: "album", podcast: "podcast", document: "document",
  };
  const tc = await gptJSON<{ tagline?: string; creditLines?: string[] }>(
    "Generate title cards for creative projects. Return only valid JSON.",
    `Project: "${name}", type: ${label[mode]}\nReturn JSON: {"tagline":"one compelling tagline","creditLines":["Created by ...","A ${name} Production","${new Date().getFullYear()}"]}`,
    120,
  );
  return { title: name, tagline: tc?.tagline ?? "", creditLines: tc?.creditLines ?? [] };
}

// ─── Mode handlers ────────────────────────────────────────────────────────────

// FILM ─ enhanced cinematic handler with branching choices
async function handleFilm(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
): Promise<SceneManifest[]> {
  // Parse screenplay scenes
  const parseScenes = (text: string) => {
    const hRe = /^(INT\.|EXT\.|INT\/EXT\.?|EXT\/INT\.?)[^\n]+/gim;
    const hs: { text: string; index: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = hRe.exec(text)) !== null) hs.push({ text: m[0].trim(), index: m.index });
    if (hs.length >= 2) {
      return hs.slice(0, 7).map((h, i) => {
        const body  = text.slice(h.index, hs[i + 1]?.index ?? text.length).trim();
        const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
        const dash  = h.text.indexOf(" - ");
        return {
          title:       h.text.slice(0, 70),
          location:    dash !== -1 ? h.text.slice(0, dash).replace(/^(INT\.|EXT\.)[^\s]*/i, "").trim() : "",
          time:        dash !== -1 ? h.text.slice(dash + 3).trim() : "DAY",
          description: lines.slice(1, 5).join(" ").slice(0, 320),
          dialogue:    lines.slice(5, 12).join("\n").slice(0, 500),
        };
      });
    }
    // Beat sheet fallback
    const beats = text.split("\n").filter(l => /^[□–\-•*]\s/.test(l.trim()) && l.length > 20);
    if (beats.length >= 3) return beats.slice(0, 7).map((b, i) => ({
      title: `Scene ${i + 1}`, location: "", time: "DAY",
      description: b.replace(/^[□–\-•*]\s/, "").trim().slice(0, 320), dialogue: "",
    }));
    // Paragraph fallback
    const paras = text.split(/\n{2,}/).filter(p => p.trim().length > 30);
    const chunk = Math.max(1, Math.floor(paras.length / 6));
    return Array.from({ length: Math.min(6, Math.ceil(paras.length / chunk)) }, (_, i) => ({
      title: `Scene ${i + 1}`, location: "", time: "DAY",
      description: paras.slice(i * chunk, (i + 1) * chunk).join(" ").slice(0, 320),
      dialogue: "",
    }));
  };

  const rawScenes = parseScenes(content);
  const MAX       = Math.min(rawScenes.length, 6);
  sse(res, { type: "start", total: MAX });

  const scenes: SceneManifest[] = [];

  for (let i = 0; i < MAX; i++) {
    const s = rawScenes[i]!;

    // Enhanced DALL-E 3 keyframe
    sse(res, { type: "progress", frame: i + 1, total: MAX, step: "visual", message: `Scene ${i + 1}/${MAX} — cinematic keyframe…` });
    const imageUrl = await dalleImage(
      cinematicDallePrompt({ location: s.location, description: s.description }, project.name, i),
      "1792x1024",
    );

    // GPT — dialogue + camera + music + branching choices
    sse(res, { type: "progress", frame: i + 1, total: MAX, step: "script", message: `Scene ${i + 1}/${MAX} — dialogue and direction…` });
    const isPivotal = i > 0 && i < MAX - 1 && i % 2 !== 0;

    const gpt = await gptJSON<{
      dialogue?: string; cameraDir?: string; musicCue?: string;
      moodHex?: string; durationSec?: number;
      isPivotal?: boolean; choices?: SceneChoice[];
    }>(
      `You are the director of "${project.name}" (${project.industry}). Return only valid JSON.`,
      [
        `Scene ${i + 1}/${MAX}: "${s.title}"`,
        s.location    ? `Location: ${s.location}, ${s.time}` : "",
        s.description ? `Action: ${s.description.slice(0, 220)}` : "",
        s.dialogue    ? `Draft: ${s.dialogue.slice(0, 180)}` : "",
        "",
        `Return JSON:`,
        `{`,
        `  "dialogue": "2-4 lines of punchy dialogue or narration, each line prefixed CHARACTER: or NARRATOR:",`,
        `  "cameraDir": "one-sentence camera direction with specific lens and movement",`,
        `  "musicCue": "one-line music/sound direction with mood and instrumentation",`,
        `  "moodHex": "#rrggbb hex for scene mood color",`,
        `  "durationSec": 45,`,
        isPivotal ? `  "isPivotal": true,` : `  "isPivotal": false,`,
        isPivotal ? `  "choices": [{"label": "...", "targetIndex": ${Math.min(i + 1, MAX - 1)}}, {"label": "...", "targetIndex": ${Math.max(i - 1, 0)}}]` : `  "choices": []`,
        `}`,
      ].filter(Boolean).join("\n"),
      500,
    );

    const scene: SceneManifest = {
      sceneIndex:  i,
      title:       s.title,
      imageUrl,
      dialogue:    gpt?.dialogue ?? (s.dialogue.slice(0, 280) || s.description.slice(0, 180)),
      cameraDir:   gpt?.cameraDir   ?? "",
      musicCue:    gpt?.musicCue    ?? "",
      moodColor:   gpt?.moodHex     ?? "#1e293b",
      durationSec: typeof gpt?.durationSec === "number" ? gpt.durationSec : 45,
      isPivotal:   gpt?.isPivotal   ?? false,
      choices:     gpt?.choices?.length ? gpt.choices : undefined,
    };

    scenes.push(scene);
    sse(res, { type: "scene_done", scene: i + 1, total: MAX, data: scene });

    // Checkpoint
    await saveCheckpoint(pid, files, { scenes, partialAt: new Date().toISOString() }, "cinematic");
  }

  return scenes;
}

// GAME ─ DALL-E concept art + GPT full HTML5 game + validation + retry
async function handleGame(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
  manifest: UnifiedManifest,
): Promise<void> {
  const artTitles = ["Title Screen Art", "Gameplay Scene", "Main Character", "World Environment"];
  sse(res, { type: "start", total: artTitles.length + 1 });

  for (let i = 0; i < artTitles.length; i++) {
    sse(res, { type: "progress", frame: i + 1, total: artTitles.length + 1, step: "visual", message: `Generating ${artTitles[i]}…` });
    const imageUrl = await dalleImage(
      `Video game concept art, Unreal Engine 5 quality, physically based rendering, ray tracing, 4K, "${project.name}", ${artTitles[i]}, vibrant professional game art, ${content.slice(0, 80)}`,
      "1024x1024",
    );
    const frame: RenderFrame = { index: i, title: artTitles[i]!, imageUrl, content: `${artTitles[i]} — ${project.name}`, badge: `Art ${i + 1}` };
    manifest.frames!.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: artTitles.length + 1, data: frame });
    await saveCheckpoint(pid, files, manifest, "game");
  }

  sse(res, { type: "progress", frame: artTitles.length + 1, total: artTitles.length + 1, step: "code", message: "Generating playable game code…" });

  const gamePromptSystem = `You are an expert HTML5 game developer. Generate a complete, self-contained, genuinely playable browser game. Return ONLY the HTML document starting with <!DOCTYPE html>. Absolutely no explanation, no markdown fences, no comments outside the code.`;
  const gamePromptUser = `GAME DESIGN DOCUMENT:\n${content.slice(0, 3000)}\n\nCreate a complete self-contained HTML5 canvas game for "${project.name}":
REQUIREMENTS (all mandatory):
- Pure HTML + vanilla JS + inline CSS — zero external dependencies
- MUST include requestAnimationFrame game loop
- MUST include <canvas> element with getContext("2d")
- Title screen → gameplay loop → game over/win screen
- Keyboard: Arrow/WASD movement, Space = action (shoot/jump)
- Touch: on-screen D-pad and action button for mobile
- Score display, lives/health, particle or visual effects  
- Characters and mechanic from the GDD above
- Genuinely fun for 2+ minutes
- Zero console errors
Return ONLY the complete HTML starting with <!DOCTYPE html>`;

  let gameCode = await gptText(gamePromptSystem, gamePromptUser, 4096);

  // Validate + retry once
  const validation = validateGameHTML(gameCode);
  if (!validation.valid) {
    sse(res, { type: "status", message: `Code issues detected (${validation.issues.join(", ")}) — retrying with stricter prompt…` });
    gameCode = await gptText(
      gamePromptSystem,
      `${gamePromptUser}\n\nCRITICAL: Previous attempt failed these checks: ${validation.issues.join(", ")}. Make absolutely sure this version passes all of them. The game MUST have requestAnimationFrame, MUST have canvas, MUST be complete HTML.`,
      4096,
    );
  }

  manifest.generatedCode = gameCode;
  sse(res, { type: "code_ready", codeType: "game", preview: "Playable HTML5 game generated", validation: validateGameHTML(gameCode) });
}

// APP ─ UI screens + GPT interactive prototype + validation + retry
async function handleApp(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
  manifest: UnifiedManifest,
): Promise<void> {
  const screens = ["Dashboard / Home Screen", "Core Feature View", "Profile / Settings"];
  sse(res, { type: "start", total: screens.length + 1 });

  for (let i = 0; i < screens.length; i++) {
    sse(res, { type: "progress", frame: i + 1, total: screens.length + 1, step: "visual", message: `Generating ${screens[i]}…` });
    const imageUrl = await dalleImage(
      `Modern app UI mockup, Figma design system, 8pt grid, #6366f1 indigo accent, Inter font, clean minimal design, "${project.name}", ${screens[i]}, professional product design, ${content.slice(0, 60)}`,
      "1792x1024",
    );
    const frame: RenderFrame = { index: i, title: screens[i]!, imageUrl, content: screens[i]!, badge: `Screen ${i + 1}` };
    manifest.frames!.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: screens.length + 1, data: frame });
    await saveCheckpoint(pid, files, manifest, "app");
  }

  sse(res, { type: "progress", frame: screens.length + 1, total: screens.length + 1, step: "code", message: "Generating interactive prototype…" });

  const appSystem = `You are an expert frontend developer. Generate a complete, self-contained, interactive web app prototype. Return ONLY the HTML starting with <!DOCTYPE html>. No markdown, no explanation.`;
  const appUser = `PROJECT REQUIREMENTS:\n${content.slice(0, 3000)}\n\nGenerate an interactive prototype for "${project.name}":
- Pure HTML + inline CSS + inline JS (no CDN, no imports)
- Multiple views (dashboard, core feature, settings) with JS show/hide routing
- Fully interactive: buttons respond, forms validate, realistic mock data
- Design: white bg, #6366f1 accent, Inter/system-sans, rounded-xl, subtle shadows
- Responsive: mobile + desktop (CSS flexbox/grid)
- Navigation sidebar or top nav
- Core feature demonstrates main value from PRD
- Must run with zero console errors
Return ONLY complete HTML starting with <!DOCTYPE html>`;

  let appCode = await gptText(appSystem, appUser, 4096);

  const validation = validateAppHTML(appCode);
  if (!validation.valid) {
    sse(res, { type: "status", message: `App issues (${validation.issues.join(", ")}) — retrying…` });
    appCode = await gptText(appSystem, `${appUser}\n\nPrevious attempt failed: ${validation.issues.join(", ")}. Fix all issues.`, 4096);
  }

  manifest.generatedCode = appCode;
  sse(res, { type: "code_ready", codeType: "app", preview: "Interactive app prototype generated", validation: validateAppHTML(appCode) });
}

// BOOK ─ literary illustrations + full chapter prose
async function handleBook(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
  manifest: UnifiedManifest,
): Promise<void> {
  const chapterCount = 3;
  sse(res, { type: "start", total: chapterCount });
  for (let i = 0; i < chapterCount; i++) {
    sse(res, { type: "progress", frame: i + 1, total: chapterCount, step: "visual", message: `Chapter ${i + 1} — illustration…` });
    const imageUrl = await dalleImage(
      `Literary book illustration, Penguin Classics aesthetic, oil painting style, "${project.name}" chapter ${i + 1}, evocative mood, dramatic Rembrandt lighting, cinematic composition, ${content.slice(80 * i, 80 * (i + 1))}`,
      "1024x1024",
    );
    sse(res, { type: "progress", frame: i + 1, total: chapterCount, step: "text", message: `Chapter ${i + 1} — writing…` });
    const chapterText = await gptText(
      `You are a professional literary author writing "${project.name}". Write publishable literary fiction with vivid prose.`,
      `Write Chapter ${i + 1} based on: ${content.slice(0, 2500)}\n\n600-900 words with: hooking opening paragraph, scene development with dialogue, vivid setting descriptions, forward-pulling chapter ending. No chapter title — prose only.`,
      1500,
    );
    const frame: RenderFrame = { index: i, title: `Chapter ${i + 1}`, imageUrl, content: chapterText, badge: `Ch. ${i + 1}` };
    manifest.frames!.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: chapterCount, data: frame });
    await saveCheckpoint(pid, files, manifest, "book");
  }
}

// COURSE ─ module slides + lesson content + quiz
async function handleCourse(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
  manifest: UnifiedManifest,
): Promise<void> {
  const moduleCount = 4;
  sse(res, { type: "start", total: moduleCount });
  for (let i = 0; i < moduleCount; i++) {
    sse(res, { type: "progress", frame: i + 1, total: moduleCount, step: "visual", message: `Module ${i + 1} — slide…` });
    const imageUrl = await dalleImage(
      `Professional e-learning slide header, "${project.name}" module ${i + 1}, clean EdTech design, gradient background with white space, minimal typographic hierarchy, Coursera/Udemy quality visual`,
      "1792x1024",
    );
    sse(res, { type: "progress", frame: i + 1, total: moduleCount, step: "text", message: `Module ${i + 1} — lesson…` });
    const lesson = await gptText(
      `You are an expert instructional designer for "${project.name}". Be clear, practical, and engaging.`,
      `Write Module ${i + 1} based on: ${content.slice(0, 2000)}\n\nFormat:\n## Learning Objectives\n3 specific measurable objectives\n\n## Core Content\n3-4 sections with examples (400-500 words)\n\n## Practice Exercise\nOne hands-on activity\n\n## Quiz (3 questions)\nQ1: ...\nA) B) C) D) Correct: X\nQ2: ...\nA) B) C) D) Correct: X\nQ3: ...\nA) B) C) D) Correct: X`,
      1200,
    );
    const frame: RenderFrame = { index: i, title: `Module ${i + 1}`, imageUrl, content: lesson, badge: `Module ${i + 1}` };
    manifest.frames!.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: moduleCount, data: frame });
    await saveCheckpoint(pid, files, manifest, "course");
  }
}

// PITCH ─ slide visuals + investor-grade copy
async function handlePitch(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
  manifest: UnifiedManifest,
): Promise<void> {
  const slides = ["Problem & Market Opportunity", "Solution & Product", "Business Model & Revenue", "Traction & Milestones", "Team & Ask"];
  sse(res, { type: "start", total: slides.length });
  for (let i = 0; i < slides.length; i++) {
    sse(res, { type: "progress", frame: i + 1, total: slides.length, step: "visual", message: `Slide ${i + 1} — visual…` });
    const imageUrl = await dalleImage(
      `Professional pitch deck slide, "${project.name}", ${slides[i]}, investor-grade design, data visualization, clean indigo/white corporate palette, Y Combinator/a16z presentation quality`,
      "1792x1024",
    );
    sse(res, { type: "progress", frame: i + 1, total: slides.length, step: "text", message: `Slide ${i + 1} — copy…` });
    const copy = await gptText(
      `You are a top-tier startup pitch writer. Write investor-grade content with specific numbers.`,
      `Write "${slides[i]}" slide for "${project.name}".\nContext: ${content.slice(0, 1500)}\n\n5-8 bullet points of investor-quality content. Each bullet: one powerful specific claim. Include market size, numbers, differentiation.`,
      500,
    );
    const frame: RenderFrame = { index: i, title: slides[i]!, imageUrl, content: copy, badge: `Slide ${i + 1}` };
    manifest.frames!.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: slides.length, data: frame });
    await saveCheckpoint(pid, files, manifest, "pitch");
  }
}

// SHOWCASE ─ product photography + spec copy
async function handleShowcase(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
  manifest: UnifiedManifest,
): Promise<void> {
  const views = ["Hero Shot", "In-Use / Lifestyle", "Detail & Materials", "Packaging & Unboxing"];
  sse(res, { type: "start", total: views.length });
  for (let i = 0; i < views.length; i++) {
    sse(res, { type: "progress", frame: i + 1, total: views.length, step: "visual", message: `Rendering ${views[i]}…` });
    const imageUrl = await dalleImage(
      `Professional product photography, "${project.name}", ${views[i]}, pure white studio background, dramatic rim lighting, f/8 aperture deep focus, commercial advertising quality, shot on Phase One IQ4, ${content.slice(0, 80)}`,
      "1024x1024",
    );
    sse(res, { type: "progress", frame: i + 1, total: views.length, step: "text", message: `${views[i]} — copy…` });
    const copy = await gptText(
      `You are a professional product copywriter. Write concise, compelling product copy.`,
      `Write ${views[i]} copy for "${project.name}".\nContext: ${content.slice(0, 1000)}\n\nInclude: headline (8 words max), 3-sentence description, 4 key feature bullets. Specific materials, performance, and benefits.`,
      350,
    );
    const frame: RenderFrame = { index: i, title: views[i]!, imageUrl, content: copy, badge: views[i] };
    manifest.frames!.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: views.length, data: frame });
    await saveCheckpoint(pid, files, manifest, "showcase");
  }
}

// MUSIC ─ album art + full lyrics per track
async function handleMusic(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
  manifest: UnifiedManifest,
): Promise<void> {
  const trackCount = 5;
  sse(res, { type: "start", total: trackCount });
  for (let i = 0; i < trackCount; i++) {
    sse(res, { type: "progress", frame: i + 1, total: trackCount, step: "visual", message: `Track ${i + 1} — artwork…` });
    const imageUrl = await dalleImage(
      `Album cover art, "${project.name}" Track ${i + 1}, concept album aesthetic, vinyl record quality design, bold graphic style, music industry professional, ${content.slice(0, 60)}`,
      "1024x1024",
    );
    sse(res, { type: "progress", frame: i + 1, total: trackCount, step: "text", message: `Track ${i + 1} — lyrics…` });
    const lyrics = await gptText(
      `You are a professional songwriter. Write original, emotionally resonant lyrics that fit the album concept.`,
      `Write full lyrics for Track ${i + 1} of "${project.name}".\nConcept: ${content.slice(0, 1500)}\n\n[VERSE 1] 4-8 lines\n[PRE-CHORUS] 2-4 lines (optional)\n[CHORUS] 4-6 lines (the hook)\n[VERSE 2] 4-8 lines\n[CHORUS]\n[BRIDGE] 4-6 lines\n[CHORUS]\n[OUTRO] 2-4 lines\nAlso: BPM: [XX], Key: [key], Mood: [2-3 words]`,
      700,
    );
    const frame: RenderFrame = { index: i, title: `Track ${i + 1}`, imageUrl, content: lyrics, badge: `Track ${i + 1}` };
    manifest.frames!.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: trackCount, data: frame });
    await saveCheckpoint(pid, files, manifest, "music");
  }
}

// PODCAST ─ cover art + full episode script + show notes
async function handlePodcast(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
  manifest: UnifiedManifest,
): Promise<void> {
  sse(res, { type: "start", total: 3 });

  sse(res, { type: "progress", frame: 1, total: 3, step: "visual", message: "Generating cover art…" });
  const coverUrl = await dalleImage(
    `Podcast cover art, "${project.name}", professional broadcast identity, bold graphic design, typography space, compelling visual hierarchy, Spotify/Apple Podcasts thumbnail quality, ${content.slice(0, 60)}`,
    "1024x1024",
  );

  sse(res, { type: "progress", frame: 2, total: 3, step: "text", message: "Writing Episode 1 script…" });
  const script = await gptText(
    `You are a professional podcast writer and host. Write engaging conversational scripts that sound natural.`,
    `Write Episode 1 script for "${project.name}".\nConcept: ${content.slice(0, 2000)}\n\n[INTRO MUSIC — 10 seconds]\nHOST: [60-second hook]\n\n[SEGMENT 1 — 300 words]\n[SEGMENT 2 — key insight — 300 words]\n[SEGMENT 3 — takeaway — 200 words]\n\n[OUTRO]\nHOST: [60-second close with subscribe CTA]\n[OUTRO MUSIC]\n\nInclude [PAUSE], [EMPHASIS], [MUSIC] cues.`,
    1800,
  );

  const frame1: RenderFrame = { index: 0, title: "Episode 1", imageUrl: coverUrl, content: script, badge: "Ep. 1" };
  manifest.frames!.push(frame1);
  sse(res, { type: "frame_done", frame: 2, total: 3, data: frame1 });
  await saveCheckpoint(pid, files, manifest, "podcast");

  sse(res, { type: "progress", frame: 3, total: 3, step: "text", message: "Writing show notes…" });
  const notes = await gptText(
    `You are a podcast producer. Write compelling show notes that drive listens and shares.`,
    `Write show notes for Episode 1 of "${project.name}".\nEpisode: ${script.slice(0, 500)}\n\nInclude: description (100 words), 5 key topics, 3 timestamps, resources mentioned, Twitter/X caption (280 chars max).`,
    400,
  );
  const frame2: RenderFrame = { index: 1, title: "Show Notes", imageUrl: "", content: notes, badge: "Notes" };
  manifest.frames!.push(frame2);
  sse(res, { type: "frame_done", frame: 3, total: 3, data: frame2 });
}

// DOCUMENT ─ hero image + executive summary + analysis + recommendations
async function handleDocument(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  files: { id: number; name: string }[],
  pid: number,
  manifest: UnifiedManifest,
): Promise<void> {
  sse(res, { type: "start", total: 4 });

  sse(res, { type: "progress", frame: 1, total: 4, step: "visual", message: "Generating cover image…" });
  const heroUrl = await dalleImage(
    `Professional document cover, "${project.name}", ${project.industry}, clean editorial design, authoritative minimal visual, Harvard Business Review quality`,
    "1792x1024",
  );
  const coverFrame: RenderFrame = { index: 0, title: "Cover", imageUrl: heroUrl, content: "", badge: "Cover" };
  manifest.frames!.push(coverFrame);
  sse(res, { type: "frame_done", frame: 1, total: 4, data: coverFrame });

  const sections = ["Executive Summary", "Main Analysis", "Recommendations & Next Steps"];
  for (let i = 0; i < sections.length; i++) {
    sse(res, { type: "progress", frame: i + 2, total: 4, step: "text", message: `Writing ${sections[i]}…` });
    const text = await gptText(
      `You are a professional ${project.industry} consultant writing a high-quality document for "${project.name}".`,
      `Write the "${sections[i]}" section.\nSource: ${content.slice(0, 2000)}\n\n400-600 words, professional headings, specific actionable content. Be expert and concise.`,
      900,
    );
    const frame: RenderFrame = { index: i + 1, title: sections[i]!, imageUrl: "", content: text, badge: sections[i] };
    manifest.frames!.push(frame);
    sse(res, { type: "frame_done", frame: i + 2, total: 4, data: frame });
    await saveCheckpoint(pid, files, manifest, "document");
  }
}

// ─── POST /generate ───────────────────────────────────────────────────────────

router.post("/", async (req: Request, res: Response) => {
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

  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();

  // Keepalive — prevents proxies / browser from killing an idle SSE connection
  const _keepAlive = setInterval(() => { try { res.write(": keep-alive\n\n"); } catch {} }, 18_000);

  try {
    sse(res, { type: "status", message: "Loading project…" });
    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) {
      sse(res, { type: "error", message: "Project not found" }); res.end(); return;
    }

    const files = await db.select().from(projectFiles).where(eq(projectFiles.projectId, pid));
    if (!files.length) {
      sse(res, { type: "error", message: "No project files found. Add content first." }); res.end(); return;
    }

    const renderMode = detectRenderMode(project.industry ?? "General");

    // ── Check for existing checkpoint (session resume) ────────────────────────
    const checkpoint = files.find(f => f.name === `_checkpoint_${renderMode}`);
    if (checkpoint?.content) {
      try {
        const partial = JSON.parse(checkpoint.content) as { scenes?: SceneManifest[]; frames?: RenderFrame[] };
        const hasData = (partial.scenes?.length ?? 0) > 0 || (partial.frames?.length ?? 0) > 0;
        if (hasData) {
          sse(res, { type: "checkpoint_found", checkpoint: partial, renderMode });
          // Continue — frontend decides whether to resume or regenerate
        }
      } catch { /* malformed checkpoint — ignore */ }
    }

    const priorityKeywords: Record<RenderMode, string[]> = {
      cinematic: ["script", "screenplay", "beat", "scene", "treatment", "logline"],
      game:      ["gdd", "game design", "mechanic", "story", "character", "world"],
      app:       ["prd", "requirements", "feature", "user", "spec", "design"],
      book:      ["outline", "chapter", "character", "plot", "story", "manuscript"],
      course:    ["curriculum", "module", "lesson", "outline", "syllabus"],
      pitch:     ["pitch", "deck", "business", "model", "market", "team"],
      showcase:  ["spec", "product", "design", "material", "feature"],
      music:     ["concept", "track", "album", "lyric", "song", "creative"],
      podcast:   ["concept", "episode", "script", "format", "guest", "topic"],
      document:  ["summary", "overview", "plan", "report", "brief"],
    };

    const content = prioritiseFiles(files, priorityKeywords[renderMode]);
    if (!content.trim()) {
      sse(res, { type: "error", message: "Project files have no content yet. Write your content first." }); res.end(); return;
    }

    sse(res, { type: "status", message: `UltraMax pipeline — mode: ${renderMode}` });

    const manifest: UnifiedManifest = {
      projectName:  project.name,
      projectType:  project.industry ?? "General",
      renderMode,
      titleCard:    { title: project.name, tagline: "", creditLines: [] },
      frames:       renderMode !== "cinematic" ? [] : undefined,
      generatedAt:  new Date().toISOString(),
    };

    const fileRefs = files.map(f => ({ id: f.id, name: f.name }));

    // ── Run handler ───────────────────────────────────────────────────────────
    if (renderMode === "cinematic") {
      const scenes = await handleFilm(res, project, content, fileRefs, pid);
      manifest.scenes = scenes;
    } else {
      switch (renderMode) {
        case "game":     await handleGame(res, project, content, fileRefs, pid, manifest);      break;
        case "app":      await handleApp(res, project, content, fileRefs, pid, manifest);       break;
        case "book":     await handleBook(res, project, content, fileRefs, pid, manifest);      break;
        case "course":   await handleCourse(res, project, content, fileRefs, pid, manifest);   break;
        case "pitch":    await handlePitch(res, project, content, fileRefs, pid, manifest);    break;
        case "showcase": await handleShowcase(res, project, content, fileRefs, pid, manifest); break;
        case "music":    await handleMusic(res, project, content, fileRefs, pid, manifest);    break;
        case "podcast":  await handlePodcast(res, project, content, fileRefs, pid, manifest);  break;
        default:         await handleDocument(res, project, content, fileRefs, pid, manifest); break;
      }
    }

    // ── Title card ────────────────────────────────────────────────────────────
    sse(res, { type: "status", message: "Generating title card…" });
    manifest.titleCard = await makeTitleCard(project.name, renderMode);

    // ── Persist final manifest ────────────────────────────────────────────────
    const manifestJson = JSON.stringify(manifest, null, 2);
    const manifestName = renderMode === "cinematic"
      ? "Movie Production Manifest"
      : `Render Manifest — ${renderMode}`;

    const existingManifest = files.find(f => f.name === manifestName);
    if (existingManifest) {
      await db.update(projectFiles)
        .set({ content: manifestJson, updatedAt: new Date() })
        .where(eq(projectFiles.id, existingManifest.id));
    } else {
      await db.insert(projectFiles).values({
        projectId: pid, name: manifestName,
        content: manifestJson, fileType: "json",
        size: `${Math.round(manifestJson.length / 1024)} KB`,
      });
    }

    // ── Persist generated code + provide serve URL ────────────────────────────
    if (manifest.generatedCode) {
      const codeName  = renderMode === "game" ? "Generated Game — game.html" : "Generated App — app.html";
      const codeFiles = await db.select().from(projectFiles).where(
        and(eq(projectFiles.projectId, pid), eq(projectFiles.name, codeName))
      );
      if (codeFiles.length > 0) {
        await db.update(projectFiles)
          .set({ content: manifest.generatedCode, updatedAt: new Date() })
          .where(eq(projectFiles.id, codeFiles[0]!.id));
      } else {
        await db.insert(projectFiles).values({
          projectId: pid, name: codeName,
          content: manifest.generatedCode, fileType: "html",
          size: `${Math.round(manifest.generatedCode.length / 1024)} KB`,
        });
      }
      manifest.serveUrl = `/api/generate/serve/${pid}?type=${renderMode}`;
    }

    // ── Clean up checkpoint ───────────────────────────────────────────────────
    const cp = files.find(f => f.name === `_checkpoint_${renderMode}`);
    if (cp) {
      await db.update(projectFiles)
        .set({ content: "{}", updatedAt: new Date() })
        .where(eq(projectFiles.id, cp.id));
    }

    sse(res, { type: "done", manifest });
    res.end();

  } catch (err) {
    console.error("[generate] fatal:", err);
    sse(res, { type: "error", message: err instanceof Error ? err.message : String(err) });
    res.end();
  } finally {
    clearInterval(_keepAlive);
  }
});

// ─── GET /generate/serve/:projectId ──────────────────────────────────────────
// Serves the stored HTML5 game or app prototype as a standalone page

router.get("/serve/:projectId", async (req: Request, res: Response) => {
  const pid  = parseInt(String(req.params["projectId"] ?? "0"), 10);
  const type = (req.query.type as string) ?? "game";

  if (!pid || isNaN(pid)) {
    res.status(400).send("Invalid project ID");
    return;
  }

  const codeName = type === "app" ? "Generated App — app.html" : "Generated Game — game.html";

  try {
    const [file] = await db.select()
      .from(projectFiles)
      .where(and(eq(projectFiles.projectId, pid), eq(projectFiles.name, codeName)));

    if (!file?.content) {
      res.status(404).send(`<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;color:#64748b"><h2>No ${type} generated yet</h2><p>Generate a project first, then return here.</p></body></html>`);
      return;
    }

    res.setHeader("Content-Type",  "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.send(file.content);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

export default router;
