/**
 * renderEngine.ts — Universal AI Render Engine
 *
 * POST /render/generate — SSE streaming endpoint that converts project files into
 * real, type-specific outputs:
 *   Film / Documentary → DALL-E 3 cinematic keyframes + GPT dialogue (CinematicPlayer)
 *   Video Game         → DALL-E key art + GPT-generated HTML5 playable game (iframe)
 *   Mobile/Web App     → DALL-E UI screens + GPT-generated interactive HTML app (iframe)
 *   Book / Novel       → DALL-E chapter art + GPT full chapter text (reader + PDF)
 *   Online Course      → DALL-E slide images + GPT lesson content + quizzes
 *   Business / Startup → DALL-E pitch slides + GPT full pitch copy (deck + PDF)
 *   Physical Product   → DALL-E product renders + GPT spec sheet
 *   Music / Album      → DALL-E album art + GPT full lyrics per track
 *   Podcast            → DALL-E cover art + GPT full episode script (TTS on frontend)
 *   Everything else    → DALL-E hero + GPT full formatted document (reader + PDF)
 */

import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, projects, projectFiles } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ─── Types ───────────────────────────────────────────────────────────────────

export type RenderMode =
  | "cinematic" | "game" | "app" | "book"
  | "course"    | "pitch" | "showcase"
  | "music"     | "podcast" | "document";

export interface RenderFrame {
  index:       number;
  title:       string;
  imageUrl:    string;
  content:     string;
  subContent?: string;
  badge?:      string;
  moodColor?:  string;
  durationSec?: number;
}

export interface RenderManifest {
  projectName:   string;
  projectType:   string;
  renderMode:    RenderMode;
  titleCard:     { title: string; tagline: string; creditLines: string[] };
  frames:        RenderFrame[];
  generatedCode?: string;
  generatedAt:   string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sse(res: Response, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function detectRenderMode(industry: string): RenderMode {
  if (["Film / Movie", "Documentary"].includes(industry))  return "cinematic";
  if (industry === "Video Game")                           return "game";
  if (["Mobile App", "Web App / SaaS"].includes(industry)) return "app";
  if (industry === "Book / Novel")                         return "book";
  if (industry === "Online Course")                        return "course";
  if (["Business", "Startup"].includes(industry))          return "pitch";
  if (industry === "Physical Product")                     return "showcase";
  if (industry === "Music / Album")                        return "music";
  if (industry === "Podcast")                              return "podcast";
  return "document";
}

function prioritiseFiles(
  files: { name: string; content: string | null; fileType: string | null }[],
  keywords: string[]
): string {
  const sorted = [...files].sort((a, b) => {
    const aS = keywords.findIndex(k => a.name.toLowerCase().includes(k));
    const bS = keywords.findIndex(k => b.name.toLowerCase().includes(k));
    return (aS === -1 ? 99 : aS) - (bS === -1 ? 99 : bS);
  });
  return sorted.map(f => f.content ?? "").filter(c => c.trim()).join("\n\n").slice(0, 6000);
}

async function dalleImage(prompt: string, size: "1792x1024" | "1024x1024" = "1792x1024"): Promise<string> {
  try {
    const img = await openai.images.generate({
      model: "dall-e-3", prompt: prompt.slice(0, 1000),
      n: 1, size, quality: "standard",
    });
    return img.data?.[0]?.url ?? "";
  } catch { return ""; }
}

async function gptJSON<T>(systemPrompt: string, userPrompt: string, maxTokens = 400): Promise<T | null> {
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: maxTokens, temperature: 0.8,
    });
    const raw = resp.choices[0]?.message?.content?.trim() ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleaned) as T;
  } catch { return null; }
}

async function gptText(systemPrompt: string, userPrompt: string, maxTokens = 1200): Promise<string> {
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: maxTokens, temperature: 0.85,
    });
    return resp.choices[0]?.message?.content?.trim() ?? "";
  } catch { return ""; }
}

async function makeTitleCard(name: string, mode: RenderMode): Promise<RenderManifest["titleCard"]> {
  const modeLabel: Record<RenderMode, string> = {
    cinematic: "film", game: "game", app: "app", book: "book",
    course: "online course", pitch: "pitch deck", showcase: "product showcase",
    music: "album", podcast: "podcast episode", document: "document",
  };
  const tc = await gptJSON<{ tagline?: string; creditLines?: string[] }>(
    "Generate a title card for creative projects. Return only valid JSON.",
    `Project: "${name}", type: ${modeLabel[mode]}\nReturn JSON: {"tagline":"one compelling tagline","creditLines":["Created by ...","A ${name} Production","${new Date().getFullYear()}"]}`,
    120,
  );
  return { title: name, tagline: tc?.tagline ?? "", creditLines: tc?.creditLines ?? [] };
}

// ─── Mode handlers ────────────────────────────────────────────────────────────

// CINEMATIC ─ reuses exact same pattern as movieGenerate.ts
async function handleCinematic(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  const parseScenes = (text: string) => {
    const hRe = /^(INT\.|EXT\.|INT\/EXT\.?|EXT\/INT\.?)[^\n]+/gim;
    const hs: { text: string; index: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = hRe.exec(text)) !== null) hs.push({ text: m[0].trim(), index: m.index });
    if (hs.length >= 2) {
      return hs.slice(0, 6).map((h, i) => {
        const body  = text.slice(h.index, hs[i + 1]?.index ?? text.length).trim();
        const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
        const dash  = h.text.indexOf(" - ");
        return {
          title:       h.text.slice(0, 70),
          location:    dash !== -1 ? h.text.slice(0, dash).replace(/^(INT\.|EXT\.)[^\s]*/i, "").trim() : "",
          description: lines.slice(1, 5).join(" ").slice(0, 300),
          dialogue:    lines.slice(5, 12).join("\n").slice(0, 500),
        };
      });
    }
    const chunks = text.split(/\n{2,}/).filter(p => p.trim().length > 30).slice(0, 6);
    return chunks.map((c, i) => ({
      title: `Scene ${i + 1}`, location: "", description: c.slice(0, 300), dialogue: "",
    }));
  };

  const scenes = parseScenes(content);
  const MAX = Math.min(scenes.length, 6);
  sse(res, { type: "start", total: MAX });

  for (let i = 0; i < MAX; i++) {
    const s = scenes[i]!;
    sse(res, { type: "progress", frame: i + 1, total: MAX, step: "visual", message: `Scene ${i + 1}/${MAX} — cinematic keyframe…` });

    const imageUrl = await dalleImage(
      `Cinematic movie still, 35mm film, photorealistic, award-winning cinematography, "${project.name}", ${s.location || "interior"}, ${s.description.slice(0, 180)}, ultra detail, dramatic depth`,
      "1792x1024",
    );

    sse(res, { type: "progress", frame: i + 1, total: MAX, step: "script", message: `Scene ${i + 1}/${MAX} — writing dialogue…` });

    const gpt = await gptJSON<{
      dialogue?: string; cameraDir?: string; musicCue?: string; moodHex?: string; durationSec?: number;
    }>(
      `You are the director of "${project.name}".`,
      `Scene ${i + 1}: "${s.title}"\n${s.description.slice(0, 200)}\nReturn JSON only: {"dialogue":"2-4 lines, prefixed CHARACTER: or NARRATOR:","cameraDir":"one-sentence camera direction","musicCue":"one-line music direction","moodHex":"#rrggbb","durationSec":45}`,
    );

    const frame: RenderFrame = {
      index:       i,
      title:       s.title,
      imageUrl,
      content:     (gpt?.dialogue ?? s.dialogue.slice(0, 280)) || s.description.slice(0, 180),
      subContent:  `${gpt?.cameraDir ?? ""} | ${gpt?.musicCue ?? ""}`,
      badge:       `Scene ${i + 1}`,
      moodColor:   gpt?.moodHex     ?? "#1e293b",
      durationSec: gpt?.durationSec ?? 45,
    };
    manifest.frames.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: MAX, data: frame });
  }
}

// GAME ─ DALL-E key art + GPT full HTML5 playable game
async function handleGame(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  const artTitles = ["Title Screen Art", "Gameplay Scene", "Main Character Design", "World / Environment"];
  sse(res, { type: "start", total: artTitles.length });

  for (let i = 0; i < artTitles.length; i++) {
    sse(res, { type: "progress", frame: i + 1, total: artTitles.length, step: "visual", message: `Generating ${artTitles[i]}…` });
    const imageUrl = await dalleImage(
      `Video game concept art, ${project.name}, ${artTitles[i]}, vibrant colors, detailed 2D/3D hybrid style, professional game art, digital painting, ${content.slice(0, 80)}`,
      "1024x1024",
    );
    const frame: RenderFrame = {
      index: i, title: artTitles[i]!, imageUrl,
      content: `${artTitles[i]} — ${project.name}`,
      badge: `Art ${i + 1}`,
    };
    manifest.frames.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: artTitles.length, data: frame });
  }

  sse(res, { type: "progress", frame: artTitles.length + 1, total: artTitles.length + 1, step: "code", message: "Generating playable game code…" });

  const gameCode = await gptText(
    `You are an expert HTML5 game developer. Generate a complete, self-contained, genuinely playable browser game. Return ONLY the HTML document, starting with <!DOCTYPE html>. No explanation, no markdown fences.`,
    `GAME DESIGN DOCUMENT SUMMARY:\n${content.slice(0, 3000)}\n\nGenerate a complete self-contained HTML5 canvas game for "${project.name}". Requirements:
- Pure HTML + vanilla JS + CSS, zero external dependencies
- Title screen → actual gameplay loop (60fps requestAnimationFrame) → game over/win screen
- Keyboard: Arrow/WASD movement, Space = primary action (shoot/jump/interact)
- Touch: on-screen directional pad and action button for mobile
- Characters, setting, and core mechanic taken from the game design document above
- Score display, lives/health indicator, particle effects
- All graphics drawn with canvas API (shapes + text — no image URLs)
- Genuinely fun and playable for 2+ minutes
- Must run with zero console errors
Return ONLY the complete HTML starting with <!DOCTYPE html>`,
    4000,
  );
  manifest.generatedCode = gameCode;
  sse(res, { type: "code_ready", codeType: "game", preview: "Playable HTML5 game generated" });
}

// APP ─ DALL-E UI screens + GPT interactive HTML prototype
async function handleApp(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  const screens = ["Dashboard / Home Screen", "Core Feature Screen", "User Profile / Settings"];
  sse(res, { type: "start", total: screens.length });

  for (let i = 0; i < screens.length; i++) {
    sse(res, { type: "progress", frame: i + 1, total: screens.length, step: "visual", message: `Generating ${screens[i]}…` });
    const imageUrl = await dalleImage(
      `Clean modern mobile/web app UI screenshot, ${project.name}, ${screens[i]}, minimal design, indigo accent color, white background, professional UI, flat design, Figma-style mockup, ${content.slice(0, 60)}`,
      "1792x1024",
    );
    const frame: RenderFrame = {
      index: i, title: screens[i]!, imageUrl,
      content: screens[i]!, badge: `Screen ${i + 1}`,
    };
    manifest.frames.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: screens.length, data: frame });
  }

  sse(res, { type: "progress", frame: screens.length + 1, total: screens.length + 1, step: "code", message: "Generating interactive app prototype…" });

  const appCode = await gptText(
    `You are an expert frontend developer. Generate a complete, self-contained, interactive web app prototype. Return ONLY the HTML document, starting with <!DOCTYPE html>. No explanation, no markdown fences.`,
    `PROJECT REQUIREMENTS:\n${content.slice(0, 3000)}\n\nGenerate a complete self-contained interactive web app prototype for "${project.name}". Requirements:
- Pure HTML + inline CSS + inline JS, zero external dependencies or CDN links
- Multiple views (dashboard, core feature, profile/settings) with JS routing (show/hide divs)
- Fully interactive: buttons respond, forms validate, data displays with realistic mock data
- Design: white background, #6366f1 indigo accent, Geist/system-sans typography, rounded-xl corners, subtle shadows
- Responsive: works on mobile and desktop (CSS flexbox/grid)
- Navigation sidebar or top nav to switch between views
- Core feature view should demonstrate the main value proposition from the PRD
- All interactivity handled in memory (no server needed)
- Must run with zero console errors
Return ONLY the complete HTML starting with <!DOCTYPE html>`,
    4000,
  );
  manifest.generatedCode = appCode;
  sse(res, { type: "code_ready", codeType: "app", preview: "Interactive app prototype generated" });
}

// BOOK ─ DALL-E chapter illustrations + GPT full chapter text
async function handleBook(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  const chapterCount = 3;
  sse(res, { type: "start", total: chapterCount });

  for (let i = 0; i < chapterCount; i++) {
    sse(res, { type: "progress", frame: i + 1, total: chapterCount, step: "visual", message: `Chapter ${i + 1} — illustration…` });
    const imageUrl = await dalleImage(
      `Literary book illustration, chapter ${i + 1}, "${project.name}", evocative mood painting, dramatic lighting, cinematic composition, concept art style, ${content.slice(80 * i, 80 * i + 80)}`,
      "1024x1024",
    );

    sse(res, { type: "progress", frame: i + 1, total: chapterCount, step: "text", message: `Chapter ${i + 1} — writing…` });
    const chapterText = await gptText(
      `You are a professional author writing "${project.name}". Write in a compelling, publishable literary style. Use specific details and vivid prose.`,
      `Write Chapter ${i + 1} of "${project.name}" based on this material:\n${content.slice(0, 2500)}\n\nWrite a full chapter (600-900 words) with:\n- Opening paragraph that hooks immediately\n- Scene-by-scene development with dialogue\n- Vivid descriptions of setting and character\n- A chapter ending that pulls the reader forward\nDo not include a chapter title header — just the prose.`,
      1500,
    );

    const frame: RenderFrame = {
      index: i, title: `Chapter ${i + 1}`, imageUrl,
      content: chapterText, badge: `Ch. ${i + 1}`,
    };
    manifest.frames.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: chapterCount, data: frame });
  }
}

// COURSE ─ DALL-E slide images + GPT lesson content + quiz
async function handleCourse(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  const moduleCount = 4;
  sse(res, { type: "start", total: moduleCount });

  for (let i = 0; i < moduleCount; i++) {
    sse(res, { type: "progress", frame: i + 1, total: moduleCount, step: "visual", message: `Module ${i + 1} — slide…` });
    const imageUrl = await dalleImage(
      `Clean educational slide header image, module ${i + 1}, "${project.name}", professional e-learning design, gradient background, minimal typography, modern course aesthetic`,
      "1792x1024",
    );

    sse(res, { type: "progress", frame: i + 1, total: moduleCount, step: "text", message: `Module ${i + 1} — lesson content…` });
    const lesson = await gptText(
      `You are an expert instructional designer writing lessons for "${project.name}". Be clear, practical, and engaging.`,
      `Write Module ${i + 1} of "${project.name}" course based on:\n${content.slice(0, 2000)}\n\nModule structure:\n## Learning Objectives\n3 specific, measurable objectives\n\n## Core Content\n3-4 detailed sections with examples and explanations (400-500 words)\n\n## Practice Exercise\nOne hands-on activity the student can do right now\n\n## Quiz (3 questions)\nQ1: [question]\nA) B) C) D) — Correct: [letter]\nQ2: [question]\nA) B) C) D) — Correct: [letter]\nQ3: [question]\nA) B) C) D) — Correct: [letter]`,
      1200,
    );

    const frame: RenderFrame = {
      index: i, title: `Module ${i + 1}`, imageUrl,
      content: lesson, badge: `Module ${i + 1}`,
    };
    manifest.frames.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: moduleCount, data: frame });
  }
}

// PITCH ─ DALL-E slide visuals + GPT full pitch copy
async function handlePitch(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  const slides = [
    "Problem & Market Opportunity",
    "Solution & Product",
    "Business Model & Revenue",
    "Traction & Milestones",
    "Team & Ask",
  ];
  sse(res, { type: "start", total: slides.length });

  for (let i = 0; i < slides.length; i++) {
    sse(res, { type: "progress", frame: i + 1, total: slides.length, step: "visual", message: `Slide ${i + 1} — visual…` });
    const imageUrl = await dalleImage(
      `Professional pitch deck slide visual, "${project.name}", ${slides[i]}, clean corporate design, data visualization aesthetic, indigo and white color scheme, minimal elegant layout`,
      "1792x1024",
    );

    sse(res, { type: "progress", frame: i + 1, total: slides.length, step: "text", message: `Slide ${i + 1} — content…` });
    const copy = await gptText(
      `You are a top-tier startup pitch deck writer. Write compelling, investor-ready content. Be specific with numbers and market data.`,
      `Write the "${slides[i]}" slide for "${project.name}" pitch deck.\nProject context: ${content.slice(0, 1500)}\n\nWrite 5-8 bullet points of investor-quality pitch content. Each bullet: one powerful, specific claim. No fluff. Include market size, numbers, and differentiation where relevant.`,
      500,
    );

    const frame: RenderFrame = {
      index: i, title: slides[i]!, imageUrl,
      content: copy, badge: `Slide ${i + 1}`,
    };
    manifest.frames.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: slides.length, data: frame });
  }
}

// SHOWCASE ─ DALL-E product renders + GPT spec content
async function handleShowcase(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  const views = ["Hero Shot", "In-Use / Lifestyle", "Detail & Materials", "Packaging & Unboxing"];
  sse(res, { type: "start", total: views.length });

  for (let i = 0; i < views.length; i++) {
    sse(res, { type: "progress", frame: i + 1, total: views.length, step: "visual", message: `Rendering ${views[i]}…` });
    const imageUrl = await dalleImage(
      `Professional product photography, "${project.name}", ${views[i]}, white studio background, dramatic rim lighting, commercial advertising quality, ultra-sharp detail, ${content.slice(0, 80)}`,
      "1024x1024",
    );

    sse(res, { type: "progress", frame: i + 1, total: views.length, step: "text", message: `${views[i]} — copy…` });
    const copy = await gptText(
      `You are a professional product copywriter. Write concise, compelling product copy.`,
      `Write ${views[i]} copy for "${project.name}".\nProduct context: ${content.slice(0, 1000)}\n\nWrite: headline (8 words max), 3-sentence product description, and 4 key feature bullet points. Be specific about materials, performance, and benefits.`,
      350,
    );

    const frame: RenderFrame = {
      index: i, title: views[i]!, imageUrl,
      content: copy, badge: views[i],
    };
    manifest.frames.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: views.length, data: frame });
  }
}

// MUSIC ─ DALL-E album/track art + GPT full lyrics per track
async function handleMusic(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  const trackCount = 5;
  sse(res, { type: "start", total: trackCount });

  for (let i = 0; i < trackCount; i++) {
    sse(res, { type: "progress", frame: i + 1, total: trackCount, step: "visual", message: `Track ${i + 1} — artwork…` });
    const imageUrl = await dalleImage(
      `Album cover art, "${project.name}", track ${i + 1}, vibrant artistic style, music industry quality, concept album aesthetic, ${content.slice(0, 60)}`,
      "1024x1024",
    );

    sse(res, { type: "progress", frame: i + 1, total: trackCount, step: "text", message: `Track ${i + 1} — lyrics…` });
    const lyrics = await gptText(
      `You are a professional songwriter. Write original, emotionally resonant song lyrics that fit the album's concept.`,
      `Write full lyrics for Track ${i + 1} of "${project.name}".\nAlbum concept: ${content.slice(0, 1500)}\n\nWrite complete song lyrics with:\n[VERSE 1] (4-8 lines)\n[PRE-CHORUS] (2-4 lines, optional)\n[CHORUS] (4-6 lines, the hook)\n[VERSE 2] (4-8 lines)\n[CHORUS]\n[BRIDGE] (4-6 lines)\n[CHORUS]\n[OUTRO] (2-4 lines)\nAlso include: BPM: [XX], Key: [key], Mood: [2-3 adjectives]`,
      700,
    );

    const frame: RenderFrame = {
      index: i, title: `Track ${i + 1}`, imageUrl,
      content: lyrics, badge: `Track ${i + 1}`,
    };
    manifest.frames.push(frame);
    sse(res, { type: "frame_done", frame: i + 1, total: trackCount, data: frame });
  }
}

// PODCAST ─ DALL-E cover + GPT full episode script
async function handlePodcast(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  sse(res, { type: "start", total: 3 });

  sse(res, { type: "progress", frame: 1, total: 3, step: "visual", message: "Generating cover art…" });
  const coverUrl = await dalleImage(
    `Podcast cover art, "${project.name}", professional podcast artwork, bold typography space, compelling visual identity, broadcast quality, ${content.slice(0, 60)}`,
    "1024x1024",
  );

  sse(res, { type: "progress", frame: 2, total: 3, step: "text", message: "Writing Episode 1 script…" });
  const intro = await gptText(
    `You are a professional podcast writer and host. Write engaging, conversational scripts that sound natural when spoken.`,
    `Write a complete Episode 1 script for "${project.name}" podcast.\nShow concept: ${content.slice(0, 2000)}\n\nScript format:\n[INTRO MUSIC — 10 seconds]\nHOST: [compelling 60-second hook that grabs listeners immediately]\n\n[MAIN SEGMENT — 3 sections]\n[Section 1 — HOST monologue or interview Q&A — 300 words]\n[Section 2 — key insight or story — 300 words]\n[Section 3 — listener takeaway — 200 words]\n\n[OUTRO]\nHOST: [60-second close with CTA and subscribe ask]\n[OUTRO MUSIC — 10 seconds]\n\nInclude: [PAUSE], [EMPHASIS], and [MUSIC] cues throughout.`,
    1800,
  );

  const frame: RenderFrame = {
    index: 0, title: "Episode 1", imageUrl: coverUrl,
    content: intro, badge: "Ep. 1",
  };
  manifest.frames.push(frame);
  sse(res, { type: "frame_done", frame: 2, total: 3, data: frame });

  sse(res, { type: "progress", frame: 3, total: 3, step: "text", message: "Writing show notes…" });
  const notes = await gptText(
    `You are a podcast producer. Write compelling show notes that drive listens and shares.`,
    `Write show notes for Episode 1 of "${project.name}".\nEpisode content: ${intro.slice(0, 500)}\n\nInclude: Episode description (100 words), key topics covered (5 bullet points), timestamps (3 key moments), guest bio if applicable, links/resources mentioned, social media caption (Twitter/X 280 chars).`,
    400,
  );
  const notesFrame: RenderFrame = {
    index: 1, title: "Show Notes", imageUrl: "",
    content: notes, badge: "Notes",
  };
  manifest.frames.push(notesFrame);
  sse(res, { type: "frame_done", frame: 3, total: 3, data: notesFrame });
}

// DOCUMENT ─ DALL-E hero + GPT full formatted document
async function handleDocument(
  res: Response,
  project: { name: string; industry: string },
  content: string,
  manifest: RenderManifest,
) {
  sse(res, { type: "start", total: 4 });

  sse(res, { type: "progress", frame: 1, total: 4, step: "visual", message: "Generating hero image…" });
  const heroUrl = await dalleImage(
    `Professional document cover image, "${project.name}", ${project.industry}, clean editorial style, minimal design, authoritative visual`,
    "1792x1024",
  );
  manifest.frames.push({ index: 0, title: "Cover", imageUrl: heroUrl, content: "", badge: "Cover" });
  sse(res, { type: "frame_done", frame: 1, total: 4, data: manifest.frames[0]! });

  const sections = ["Executive Summary", "Main Analysis", "Recommendations & Next Steps"];
  for (let i = 0; i < sections.length; i++) {
    sse(res, { type: "progress", frame: i + 2, total: 4, step: "text", message: `Writing ${sections[i]}…` });
    const sectionText = await gptText(
      `You are a professional ${project.industry} consultant writing a high-quality document for "${project.name}".`,
      `Write the "${sections[i]}" section for "${project.name}".\nSource material: ${content.slice(0, 2000)}\n\nWrite a comprehensive, professional section (400-600 words) with proper headings, bullet points where appropriate, and specific actionable content. Be concise and expert.`,
      900,
    );
    const frame: RenderFrame = {
      index: i + 1, title: sections[i]!, imageUrl: "",
      content: sectionText, badge: sections[i],
    };
    manifest.frames.push(frame);
    sse(res, { type: "frame_done", frame: i + 2, total: 4, data: frame });
  }
}

// ─── POST /render/generate ────────────────────────────────────────────────────

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

  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();

  try {
    sse(res, { type: "status", message: "Loading project…" });
    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) {
      sse(res, { type: "error", message: "Project not found" }); res.end(); return;
    }

    const files = await db.select().from(projectFiles).where(eq(projectFiles.projectId, pid));
    if (!files.length) {
      sse(res, { type: "error", message: "No files found. Add content to your project first." }); res.end(); return;
    }

    const renderMode = detectRenderMode(project.industry ?? "General");
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
      sse(res, { type: "error", message: "Project files have no content yet." }); res.end(); return;
    }

    sse(res, { type: "status", message: `Render mode: ${renderMode} — starting generation…` });

    const manifest: RenderManifest = {
      projectName:  project.name,
      projectType:  project.industry ?? "General",
      renderMode,
      titleCard:    { title: project.name, tagline: "", creditLines: [] },
      frames:       [],
      generatedAt:  new Date().toISOString(),
    };

    // Run type-specific handler
    switch (renderMode) {
      case "cinematic": await handleCinematic(res, project, content, manifest); break;
      case "game":      await handleGame(res, project, content, manifest);      break;
      case "app":       await handleApp(res, project, content, manifest);       break;
      case "book":      await handleBook(res, project, content, manifest);      break;
      case "course":    await handleCourse(res, project, content, manifest);    break;
      case "pitch":     await handlePitch(res, project, content, manifest);     break;
      case "showcase":  await handleShowcase(res, project, content, manifest);  break;
      case "music":     await handleMusic(res, project, content, manifest);     break;
      case "podcast":   await handlePodcast(res, project, content, manifest);   break;
      default:          await handleDocument(res, project, content, manifest);  break;
    }

    // Title card
    sse(res, { type: "status", message: "Generating title card…" });
    manifest.titleCard = await makeTitleCard(project.name, renderMode);

    // Persist manifest
    const manifestJson = JSON.stringify(manifest, null, 2);
    const manifestName = `Render Manifest — ${renderMode}`;
    const existing = files.find(f => f.name === manifestName);
    if (existing) {
      await db.update(projectFiles)
        .set({ content: manifestJson, updatedAt: new Date() })
        .where(eq(projectFiles.id, existing.id));
    } else {
      await db.insert(projectFiles).values({
        projectId: pid,
        name:      manifestName,
        content:   manifestJson,
        fileType:  "json",
        size:      `${Math.round(manifestJson.length / 1024)} KB`,
      });
    }

    // If game/app code was generated, also save as its own file
    if (manifest.generatedCode) {
      const codeName = renderMode === "game" ? "Generated Game — game.html" : "Generated App — app.html";
      const codeExisting = files.find(f => f.name === codeName);
      if (codeExisting) {
        await db.update(projectFiles)
          .set({ content: manifest.generatedCode, updatedAt: new Date() })
          .where(eq(projectFiles.id, codeExisting.id));
      } else {
        await db.insert(projectFiles).values({
          projectId: pid,
          name:      codeName,
          content:   manifest.generatedCode,
          fileType:  "html",
          size:      `${Math.round(manifest.generatedCode.length / 1024)} KB`,
        });
      }
    }

    sse(res, { type: "done", manifest });
    res.end();

  } catch (err) {
    console.error("[render] fatal:", err);
    sse(res, { type: "error", message: err instanceof Error ? err.message : String(err) });
    res.end();
  }
});

export default router;
