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
      <div class="section-block">
        <h3 class="section-heading">
          <span class="section-num">${i+1}</span>
          ${s.heading}
        </h3>
        <p class="section-body">${s.body.replace(/\n/g, "<br>")}</p>
      </div>`).join("");

    const takeawaysHtml = content.keyTakeaways.length > 0
      ? `<div class="takeaways-box">
          <h3 class="takeaways-title">Key Takeaways</h3>
          <ul class="takeaways-list">
            ${content.keyTakeaways.map(t => `<li class="takeaway-item"><span class="check-icon">✓</span>${t}</li>`).join("")}
          </ul>
        </div>` : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${content.productTitle} — Content Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#f8fafc;color:#1e293b;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
    a{color:#6366f1;text-decoration:none}
    .skip-link{position:absolute;top:-100px;left:1rem;background:#6366f1;color:#fff;padding:.4rem 1rem;border-radius:6px;font-weight:700;z-index:999;transition:top .2s}
    .skip-link:focus{top:1rem}
    .hero-banner{background:linear-gradient(135deg,#6366f1 0%,#818cf8 100%);padding:48px 32px 52px;text-align:center;color:white;position:relative}
    .hero-banner::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:40px;background:#f8fafc;clip-path:ellipse(55% 100% at 50% 100%)}
    .format-pill{display:inline-block;background:rgba(255,255,255,.22);border-radius:99px;padding:4px 16px;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;margin-bottom:18px}
    .hero-title{font-size:1.85rem;font-weight:900;line-height:1.2;margin-bottom:14px;letter-spacing:-.03em}
    .hero-tagline{font-size:1.05rem;opacity:.88;max-width:540px;margin:0 auto;line-height:1.5}
    .wrap{max-width:740px;margin:0 auto;padding:48px 24px 64px}
    .intro-card{background:white;border-radius:18px;padding:28px 32px;margin-bottom:28px;border:1px solid #f1f5f9;box-shadow:0 2px 16px rgba(0,0,0,.06);font-size:1rem;line-height:1.85;color:#374151}
    .section-block{margin-bottom:32px}
    .section-heading{font-size:.95rem;font-weight:800;color:#6366f1;margin-bottom:12px;display:flex;align-items:center;gap:10px}
    .section-num{background:#6366f1;color:white;border-radius:50%;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;flex-shrink:0}
    .section-body{color:#374151;font-size:.92rem;line-height:1.75;padding-left:36px}
    .takeaways-box{background:#ede9fe;border-radius:18px;padding:26px 28px;margin-bottom:28px}
    .takeaways-title{font-size:.95rem;font-weight:800;color:#5b21b6;margin-bottom:16px}
    .takeaways-list{list-style:none}
    .takeaway-item{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;color:#374151;font-size:.9rem;line-height:1.55}
    .takeaway-item:last-child{margin-bottom:0}
    .check-icon{color:#6366f1;font-weight:800;flex-shrink:0;margin-top:1px}
    .audience-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:22px 24px;font-size:.88rem;color:#64748b;line-height:1.7;margin-bottom:28px}
    .audience-box strong{color:#1e293b;font-weight:700}
    .cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:20px}
    .btn-primary{display:inline-flex;align-items:center;gap:6px;background:#6366f1;color:white;border-radius:12px;padding:13px 28px;font-size:.92rem;font-weight:700;transition:all .15s;border:2px solid transparent}
    .btn-primary:hover{background:#4f46e5;transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.3)}
    .btn-outline{display:inline-flex;align-items:center;gap:6px;background:white;color:#6366f1;border:2px solid #6366f1;border-radius:12px;padding:13px 28px;font-size:.92rem;font-weight:700;transition:all .15s}
    .btn-outline:hover{background:#ede9fe;transform:translateY(-1px)}
    .meta-line{text-align:center;font-size:.72rem;color:#94a3b8}
    @media(max-width:640px){.hero-banner{padding:36px 20px 48px}.hero-title{font-size:1.5rem}.wrap{padding:32px 18px 48px}.cta-row{flex-direction:column;align-items:center}}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="hero-banner" role="banner">
  <div class="format-pill">${content.format} Preview</div>
  <h1 class="hero-title">${content.productTitle}</h1>
  <p class="hero-tagline">${content.tagline}</p>
</div>
<main id="main" class="wrap">
  <div class="intro-card">${content.intro}</div>
  ${sectionsHtml}
  ${takeawaysHtml}
  <div class="audience-box">
    <strong>Who this is for:</strong> ${content.targetAudience}<br><br>
    <strong>Value:</strong> ${content.estimatedValue}
  </div>
  <div class="cta-row">
    <a class="btn-primary" href="/api/semantic/content/${content.productId}/text">↓ Download Text Version</a>
    <a class="btn-outline" href="/api/semantic/store/${content.productId}">← Back to Product</a>
  </div>
  <p class="meta-line">AI-generated preview · ${content.wordCount} words · ${content.readTime} · CreateAI Brain</p>
</main>
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
