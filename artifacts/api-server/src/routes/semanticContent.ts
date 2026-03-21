/**
 * routes/semanticContent.ts
 * -------------------------
 * AI Content Generation Engine for the Semantic Product Layer.
 *
 * Every product in the catalog gets real AI-generated content — chapter outlines,
 * course modules, feature specs, track listings — format-specific and cached.
 *
 * GET  /api/semantic/content/:productId        — generate + return full content (JSON)
 * GET  /api/semantic/content/:productId/html   — content as styled HTML preview
 * GET  /api/semantic/content/:productId/text   — plain text for download
 * POST /api/semantic/content/batch             — pre-generate content for N products
 * GET  /api/semantic/content/status            — cache status + generation stats
 */

import { Router, type Request, type Response } from "express";
import { openai }             from "@workspace/integrations-openai-ai-server";
import { getRegistry, getFromRegistry } from "../semantic/registry.js";
import type { SemanticProduct } from "../semantic/types.js";

const router = Router();

// ── In-memory content cache ────────────────────────────────────────────────────

export interface ContentSection {
  heading: string;
  body: string;
}

export interface GeneratedContent {
  productId:    string;
  productTitle: string;
  format:       string;
  generatedAt:  string;
  tagline:      string;
  intro:        string;
  sections:     ContentSection[];
  keyTakeaways: string[];
  targetAudience: string;
  estimatedValue: string;
  wordCount:    number;
  readTime:     string;
}

const _cache = new Map<string, GeneratedContent>();
let _generationCount  = 0;
let _cacheHitCount    = 0;

// ── Format-specific prompt builders ───────────────────────────────────────────

function buildPrompt(p: SemanticProduct): string {
  const baseContext = `Product: "${p.title}"
Format: ${p.format}
Category: ${p.category}
Price: $${(p.priceCents / 100).toFixed(2)}
Tags: ${p.tags.join(", ")}
Short description: ${p.shortDescription}`;

  const formatInstructions: Record<string, string> = {
    ebook: `Generate a detailed ebook outline with:
- A compelling tagline (1 sentence)
- An intro paragraph (3-4 sentences about who this is for and what they'll gain)
- 8 chapter titles, each with a 2-sentence summary of what that chapter covers
- 5 key takeaways the reader will learn
- Target audience description (2 sentences)
- Estimated value statement ("This ebook replaces...")
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    course: `Generate a detailed course curriculum with:
- A compelling tagline (1 sentence)
- An intro paragraph (3-4 sentences about outcomes)
- 6 module titles, each with 3-4 lesson names listed as the body
- 5 skills students will master
- Target audience description (2 sentences)
- Estimated value statement ("This course delivers...")
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    template: `Generate a detailed template specification with:
- A compelling tagline (1 sentence)
- An intro paragraph about what the template automates
- 6 feature sections: Core Features, Customization Options, Use Cases, Included Sections, Technical Specs, Quick Start Guide — each with 3-4 bullet points as body
- 5 time/effort savings the template provides
- Target audience description (2 sentences)
- Estimated value statement ("This template replaces...")
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    audiobook: `Generate a detailed audiobook breakdown with:
- A compelling tagline (1 sentence)
- An intro paragraph about the listening experience
- 8 chapter/track titles, each with listening focus notes
- 5 insights listeners will absorb
- Target audience description (2 sentences)
- Estimated value statement
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    video: `Generate a detailed video content breakdown with:
- A compelling tagline (1 sentence)
- An intro paragraph about what the video teaches
- 6 segments/scenes with descriptions
- 5 actionable insights from the video
- Target audience description (2 sentences)
- Estimated value statement
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    plugin: `Generate a detailed plugin specification with:
- A compelling tagline (1 sentence)
- An intro paragraph about what problem it solves
- 6 sections: Core Features, Integration Guide, API Reference, Configuration Options, Use Cases, Performance Notes
- 5 productivity gains the plugin delivers
- Target audience description (2 sentences)
- Estimated value statement
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    software: `Generate a detailed software product specification with:
- A compelling tagline (1 sentence)
- An intro paragraph about the software's core value
- 6 sections: Key Features, Technical Architecture, Setup Guide, Integrations, Use Cases, Roadmap
- 5 business outcomes it enables
- Target audience description (2 sentences)
- Estimated value statement
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    graphic: `Generate a detailed graphic asset breakdown with:
- A compelling tagline (1 sentence)
- An intro paragraph about the design
- 6 sections: What's Included, Design System, Color Palette, Typography, Use Cases, Technical Specs
- 5 ways this graphic elevates the buyer's work
- Target audience description (2 sentences)
- Estimated value statement
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    music: `Generate a detailed music track breakdown with:
- A compelling tagline (1 sentence)
- An intro paragraph about the track's mood and use
- 6 sections: Track Overview, Mood & Energy, Instrumentation, Licensing Rights, Ideal Use Cases, Technical Specs (BPM, key, duration)
- 5 production value-adds this music delivers
- Target audience description (2 sentences)
- Estimated value statement
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    photo: `Generate a detailed photo asset breakdown with:
- A compelling tagline (1 sentence)
- An intro paragraph about the photo's composition and value
- 6 sections: Subject & Composition, Technical Specs, Licensing Rights, Ideal Use Cases, Editing Potential, Delivery Format
- 5 ways this photo elevates content
- Target audience description (2 sentences)
- Estimated value statement
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,

    "3D": `Generate a detailed 3D asset breakdown with:
- A compelling tagline (1 sentence)
- An intro paragraph about the 3D model's quality and applications
- 6 sections: Model Overview, Technical Specs (polygons, textures, rigging), File Formats, Compatibility, Use Cases, Import Guide
- 5 production capabilities this model unlocks
- Target audience description (2 sentences)
- Estimated value statement
Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`,
  };

  const instruction = formatInstructions[p.format] ??
    `Generate detailed content preview. Format as JSON: { tagline, intro, sections: [{heading, body}], keyTakeaways: [], targetAudience, estimatedValue }`;

  return `${baseContext}\n\n${instruction}\n\nIMPORTANT: Return ONLY valid JSON. No markdown. No code blocks. Pure JSON object.`;
}

// ── Content generator ─────────────────────────────────────────────────────────

async function generateContent(p: SemanticProduct): Promise<GeneratedContent> {
  if (_cache.has(p.id)) {
    _cacheHitCount++;
    return _cache.get(p.id)!;
  }

  const prompt = buildPrompt(p);

  const resp = await openai.chat.completions.create({
    model:       "gpt-4o",
    temperature: 0.7,
    max_tokens:  1200,
    messages: [
      { role: "system", content: "You are a world-class content strategist. Return only valid JSON matching the requested schema. No markdown. No code fences." },
      { role: "user",   content: prompt },
    ],
  });

  const raw = resp.choices[0]?.message?.content ?? "{}";

  let parsed: {
    tagline?: string;
    intro?: string;
    sections?: Array<{ heading?: string; body?: string }>;
    keyTakeaways?: string[];
    targetAudience?: string;
    estimatedValue?: string;
  } = {};

  try {
    parsed = JSON.parse(raw);
  } catch {
    // Try extracting JSON from response if wrapped in text
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { /* use empty */ }
    }
  }

  const sections: ContentSection[] = (parsed.sections ?? []).map(s => ({
    heading: String(s.heading ?? "Section"),
    body:    String(s.body ?? ""),
  }));

  const wordCount = [
    parsed.intro ?? "",
    ...sections.map(s => s.body),
    ...(parsed.keyTakeaways ?? []),
  ].join(" ").split(/\s+/).filter(Boolean).length;

  const content: GeneratedContent = {
    productId:      p.id,
    productTitle:   p.title,
    format:         p.format,
    generatedAt:    new Date().toISOString(),
    tagline:        parsed.tagline       ?? `The definitive ${p.format} for ${p.category}`,
    intro:          parsed.intro         ?? p.shortDescription,
    sections,
    keyTakeaways:   parsed.keyTakeaways  ?? [],
    targetAudience: parsed.targetAudience ?? `Professionals in the ${p.category} space`,
    estimatedValue: parsed.estimatedValue ?? `Replaces hours of manual research and creation`,
    wordCount,
    readTime:       `${Math.ceil(wordCount / 200)} min read`,
  };

  _cache.set(p.id, content);
  _generationCount++;
  console.log(`[ContentEngine] Generated ${p.format} content for "${p.title}" (${wordCount} words)`);

  return content;
}

// ── GET /status ───────────────────────────────────────────────────────────────
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    ok:              true,
    cacheSize:       _cache.size,
    generationCount: _generationCount,
    cacheHitCount:   _cacheHitCount,
    cachedProductIds: [..._cache.keys()],
  });
});

// ── GET /:productId ───────────────────────────────────────────────────────────
router.get("/:productId", async (req: Request, res: Response) => {
  try {
    await getRegistry();
    const product = getFromRegistry(String(req.params["productId"] ?? ""));
    if (!product) { res.status(404).json({ ok: false, error: "Product not found" }); return; }

    const content = await generateContent(product);
    res.json({ ok: true, fromCache: _cache.size > _generationCount + _cacheHitCount - 1, content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

// ── GET /:productId/text — plain text download ─────────────────────────────────
router.get("/:productId/text", async (req: Request, res: Response) => {
  try {
    await getRegistry();
    const product = getFromRegistry(String(req.params["productId"] ?? ""));
    if (!product) { res.status(404).send("Product not found"); return; }

    const content = await generateContent(product);
    const lines: string[] = [
      `${content.productTitle.toUpperCase()}`,
      `${content.tagline}`,
      ``,
      `OVERVIEW`,
      `--------`,
      content.intro,
      ``,
    ];

    content.sections.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.heading.toUpperCase()}`);
      lines.push(s.body);
      lines.push(``);
    });

    if (content.keyTakeaways.length > 0) {
      lines.push(`KEY TAKEAWAYS`);
      lines.push(`-------------`);
      content.keyTakeaways.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
      lines.push(``);
    }

    lines.push(`FOR: ${content.targetAudience}`);
    lines.push(`VALUE: ${content.estimatedValue}`);
    lines.push(`---`);
    lines.push(`Generated by CreateAI Brain · ${content.generatedAt}`);

    const filename = product.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}-preview.txt"`);
    res.send(lines.join("\n"));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).send(msg);
  }
});

// ── GET /:productId/html — styled HTML preview ─────────────────────────────────
router.get("/:productId/html", async (req: Request, res: Response) => {
  try {
    await getRegistry();
    const product = getFromRegistry(String(req.params["productId"] ?? ""));
    if (!product) { res.status(404).send("<h1>Not found</h1>"); return; }

    const content = await generateContent(product);

    const sectionsHtml = content.sections.map((s, i) => `
      <div style="margin-bottom:28px;">
        <h3 style="font-size:0.95rem;font-weight:800;color:#6366f1;margin:0 0 10px;display:flex;align-items:center;gap:8px;">
          <span style="background:#6366f1;color:white;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;flex-shrink:0;">${i+1}</span>
          ${s.heading}
        </h3>
        <p style="margin:0;color:#374151;font-size:0.9rem;line-height:1.7;padding-left:32px;">${s.body.replace(/\n/g, "<br>")}</p>
      </div>`).join("");

    const takeawaysHtml = content.keyTakeaways.length > 0
      ? `<div style="background:#ede9fe;border-radius:16px;padding:24px;margin-bottom:28px;">
          <h3 style="font-size:0.95rem;font-weight:800;color:#5b21b6;margin:0 0 16px;">Key Takeaways</h3>
          <ul style="margin:0;padding:0;list-style:none;">
            ${content.keyTakeaways.map(t => `<li style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;color:#374151;font-size:0.9rem;line-height:1.5;"><span style="color:#6366f1;font-weight:700;flex-shrink:0;">✓</span>${t}</li>`).join("")}
          </ul>
        </div>` : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${content.productTitle} — Content Preview</title>
  <style>* { box-sizing: border-box; margin: 0; padding: 0; }</style>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;padding:0;">
  <div style="background:linear-gradient(135deg,#6366f1,#818cf8);padding:40px 32px;text-align:center;color:white;">
    <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:999px;padding:4px 14px;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">${content.format} Preview</div>
    <h1 style="font-size:1.6rem;font-weight:800;line-height:1.3;margin-bottom:12px;">${content.productTitle}</h1>
    <p style="font-size:1rem;opacity:0.9;max-width:560px;margin:0 auto;">${content.tagline}</p>
  </div>
  <div style="max-width:720px;margin:0 auto;padding:40px 24px;">
    <div style="background:white;border-radius:16px;padding:28px;margin-bottom:24px;border:1px solid #f1f5f9;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <p style="font-size:1rem;line-height:1.8;color:#374151;">${content.intro}</p>
    </div>
    ${sectionsHtml}
    ${takeawaysHtml}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;font-size:0.85rem;color:#64748b;">
      <strong style="color:#1e293b;">Who this is for:</strong> ${content.targetAudience}<br><br>
      <strong style="color:#1e293b;">Value:</strong> ${content.estimatedValue}
    </div>
    <div style="text-align:center;margin-top:28px;">
      <a href="/api/semantic/content/${content.productId}/text"
         style="display:inline-block;background:#6366f1;color:white;text-decoration:none;border-radius:10px;padding:12px 28px;font-size:0.9rem;font-weight:700;margin-right:12px;">
        ↓ Download Text Version
      </a>
      <a href="/api/semantic/store/${content.productId}"
         style="display:inline-block;background:white;color:#6366f1;border:2px solid #6366f1;text-decoration:none;border-radius:10px;padding:12px 28px;font-size:0.9rem;font-weight:700;">
        ← Back to Product Page
      </a>
    </div>
    <p style="text-align:center;font-size:0.75rem;color:#94a3b8;margin-top:20px;">
      AI-generated preview · ${content.wordCount} words · ${content.readTime} · CreateAI Brain
    </p>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).send(`<h1>Error</h1><pre>${msg}</pre>`);
  }
});

// ── POST /batch — pre-generate content for top N products ─────────────────────
router.post("/batch", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number((req.body as { limit?: number }).limit ?? 5), 20);
    const products = await getRegistry();
    const targets  = products.slice(0, limit);

    const results = [];
    for (const p of targets) {
      try {
        const content = await generateContent(p);
        results.push({ productId: p.id, title: p.title, format: p.format, wordCount: content.wordCount, fromCache: _cache.has(p.id) && _generationCount === 0 });
      } catch (e) {
        results.push({ productId: p.id, title: p.title, error: (e as Error).message });
      }
    }

    res.json({ ok: true, generated: results.length, results, cacheSize: _cache.size });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

export { generateContent };
export default router;
