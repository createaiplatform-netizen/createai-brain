/**
 * semantic/registry.ts
 * --------------------
 * The Semantic Product Registry.
 *
 * Pulls live products from Stripe and maps them to SemanticProduct objects.
 * Every product is automatically enriched with advertising-grade fields:
 * long descriptions, gallery images, SEO metadata, ad network fields,
 * bullet points, value propositions, and CTA copy.
 *
 * Cached in memory with a configurable refresh interval.
 */

import type { SemanticProduct } from "./types.js";
import { getUncachableStripeClient } from "../services/integrations/stripeClient.js";

let _registry: SemanticProduct[] = [];
let _lastRefresh = 0;
const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

// ── Utilities ─────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Deterministic number from a string (no randomness) */
function deterministicIdx(seed: string, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % max;
}

// ── Value pricing (display-only retail tier) ───────────────────────────────────
const FORMAT_VALUE_CENTS: Record<string, number> = {
  software:  4900,
  plugin:    4400,
  course:    4900,
  "3D":      3400,
  video:     2900,
  audiobook: 2400,
  ebook:     1900,
  template:  1700,
  graphic:   1400,
  photo:     1200,
  music:      900,
  digital:   2200,
};

// ── Format labels (human-friendly) ────────────────────────────────────────────
const FORMAT_LABELS: Record<string, string> = {
  ebook:     "PDF eBook",
  audiobook: "Audio Book",
  video:     "Video Download",
  course:    "Online Course",
  template:  "Editable Template",
  software:  "Software Download",
  plugin:    "Plugin / Extension",
  graphic:   "Graphic Asset",
  photo:     "Photo Collection",
  music:     "Music Track",
  "3D":      "3D Asset Pack",
  digital:   "Digital Download",
};

// ── Google Shopping taxonomy ───────────────────────────────────────────────────
const GOOGLE_CATEGORY_MAP: Record<string, string> = {
  "Writing & Content":    "Media > Books > Non-Fiction Books",
  "Education & Training": "Media > Books > Reference Books",
  "Productivity":         "Software > Business & Productivity Software",
  "Business & Finance":   "Software > Business & Productivity Software",
  "Marketing":            "Software > Business & Productivity Software",
  "Career & HR":          "Media > Books > Non-Fiction Books",
  "Health & Wellness":    "Health & Beauty > Health Care",
  "Research & Analytics": "Software > Business & Productivity Software",
  "Creative & Design":    "Software > Graphics & Design Software",
  "Media & Audio":        "Media > Music & Sound Recordings",
  "AI & Technology":      "Software > Business & Productivity Software",
  "Digital Products":     "Software",
};

// ── Category mapping from product name keywords ────────────────────────────────
const CATEGORY_KEYWORDS: Array<[string[], string]> = [
  [["writing", "writer", "copy", "blog", "content", "script", "story", "author"], "Writing & Content"],
  [["study", "learn", "training", "education", "course", "tutor", "quiz", "lesson"], "Education & Training"],
  [["productivity", "organizer", "planner", "schedule", "task", "time", "workflow", "habit"], "Productivity"],
  [["business", "finance", "invoice", "budget", "accounting", "sales", "revenue", "profit"], "Business & Finance"],
  [["marketing", "social", "brand", "seo", "email", "campaign", "funnel", "ads", "promo"], "Marketing"],
  [["interview", "resume", "career", "job", "hire", "portfolio", "recruit"], "Career & HR"],
  [["health", "fitness", "wellness", "meditation", "mental", "diet", "exercise", "nutrition"], "Health & Wellness"],
  [["research", "data", "analysis", "report", "insight", "survey", "analytics"], "Research & Analytics"],
  [["design", "graphic", "visual", "art", "creative", "photo", "image", "3d", "render"], "Creative & Design"],
  [["music", "audio", "sound", "podcast", "voice", "video", "media", "film"], "Media & Audio"],
  [["code", "software", "plugin", "app", "tool", "tech", "automation", "ai", "bot", "api"], "AI & Technology"],
];

function extractCategory(title: string, meta: Record<string, string>): string {
  if (meta["category"] && meta["category"] !== "Digital Products") return meta["category"];
  const lower = title.toLowerCase();
  for (const [keywords, category] of CATEGORY_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return "Digital Products";
}

function extractProductFamily(title: string): string {
  const colonPart = title.includes(":") ? title.split(":").slice(1).join(":").trim() : title;
  const withoutFormat = colonPart.replace(/\s*\([^)]+\)\s*$/, "").trim();
  return slugify(withoutFormat);
}

function extractFormat(name: string, meta: Record<string, string>): string {
  if (meta["format"]) return meta["format"];
  const match = name.match(/\(([^)]+)\)$/);
  if (match) return match[1];
  return "digital";
}

function extractTags(meta: Record<string, string>, title: string, format: string, category: string): string[] {
  if (meta["tags"]) return meta["tags"].split(",").map(t => t.trim()).filter(Boolean);
  const family = extractProductFamily(title);
  const lower = title.toLowerCase();
  const tags: string[] = [];
  if (family && family.length > 2) tags.push(family);
  if (format && format !== "digital") tags.push(format);
  const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (catSlug && catSlug !== "digital-products") tags.push(catSlug);
  const keywordMap: Record<string, string> = {
    "ai": "ai-powered", "automation": "automation", "productivity": "productivity",
    "writing": "writing", "business": "business", "marketing": "marketing",
    "social": "social-media", "finance": "finance", "career": "career",
    "design": "design", "health": "health", "research": "research",
    "training": "training", "music": "music", "video": "video",
    "code": "coding", "template": "template", "course": "course",
  };
  for (const [kw, tag] of Object.entries(keywordMap)) {
    if (lower.includes(kw) && !tags.includes(tag)) { tags.push(tag); if (tags.length >= 6) break; }
  }
  if (!tags.includes("createai")) tags.push("createai");
  return tags.slice(0, 6);
}

/** Generate 5-10 SEO keyword phrases for the product */
function generateKeywords(title: string, format: string, category: string, tags: string[]): string[] {
  const fmtLabel = FORMAT_LABELS[format] ?? "digital download";
  const lower = title.toLowerCase();
  const kws: string[] = [
    `${title} ${fmtLabel}`.toLowerCase(),
    `${title} download`.toLowerCase(),
    `${title} AI`.toLowerCase(),
    `${category.toLowerCase()} ${fmtLabel}`,
    `buy ${title.toLowerCase()}`,
  ];
  if (lower.includes("ai") || lower.includes("automation")) {
    kws.push(`AI ${fmtLabel} for ${category.toLowerCase()}`);
  }
  // Add tag-based keywords
  tags.slice(0, 3).forEach(t => kws.push(`${t} ${fmtLabel}`));
  // Add format-specific keywords
  const fmtKws: Record<string, string[]> = {
    ebook:     ["ebook download", "digital book", "PDF guide"],
    course:    ["online course", "e-learning", "self-paced course"],
    template:  ["editable template", "ready-to-use template", "professional template"],
    video:     ["video tutorial", "video download", "instructional video"],
    audiobook: ["audiobook download", "audio learning"],
    software:  ["software download", "AI software tool"],
    plugin:    ["plugin download", "tool extension"],
    graphic:   ["graphic design asset", "digital graphic", "design download"],
    music:     ["royalty-free music", "background music download"],
    photo:     ["stock photo", "AI photography", "commercial photo"],
    "3D":      ["3D asset", "3D model download", "CGI asset"],
  };
  (fmtKws[format] ?? []).forEach(k => kws.push(k));
  return [...new Set(kws)].slice(0, 10);
}

// ── Display title cleaner ──────────────────────────────────────────────────────
function cleanDisplayTitle(rawName: string): string {
  let t = rawName.replace(/^(AI Solution|AI Tool|Digital Product|CreateAI):\s*/i, "").trim();
  t = t.replace(/\s*\([^)]+\)\s*$/, "").trim();
  if (t === t.toUpperCase() || t === t.toLowerCase()) {
    t = t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  return t || rawName;
}

// ── Description generators ────────────────────────────────────────────────────

function generateFormatDescription(displayTitle: string, format: string, _category: string): string {
  const descriptors: Record<string, string[]> = {
    ebook: [
      `${displayTitle} is a comprehensive AI-authored guide packed with actionable frameworks, step-by-step processes, and real-world strategies you can apply immediately.`,
      `Download ${displayTitle} and unlock a structured, expert-level reference — instantly readable on any device, no subscription required.`,
    ],
    audiobook: [
      `${displayTitle} delivers expert knowledge in high-quality AI-narrated audio — learn on your commute, at the gym, or anywhere your day takes you.`,
      `Stream or download ${displayTitle} for an immersive audio learning experience crafted for busy professionals who want results without sitting at a desk.`,
    ],
    course: [
      `${displayTitle} is a complete self-paced learning system: structured modules, exercises, and milestone checkpoints that take you from zero to confident in your domain.`,
      `Master the skills in ${displayTitle} at your own pace — curated lessons, practical assignments, and a clear outcome built for real-world application.`,
    ],
    video: [
      `${displayTitle} is a professionally produced AI-generated video resource — visually compelling, concise, and built for immediate practical use.`,
      `Watch, rewatch, and implement with ${displayTitle}: a high-production video asset that condenses complex knowledge into clear, engaging visual content.`,
    ],
    template: [
      `${displayTitle} is a plug-and-play professional template — editable, well-structured, and ready to use the moment you download it.`,
      `Save hours of setup with ${displayTitle}: a polished, production-ready template built for immediate deployment in your workflow or business.`,
    ],
    software: [
      `${displayTitle} is a ready-to-deploy AI-powered software asset — functional, documented, and built to integrate seamlessly into your tech stack.`,
      `Get a head start with ${displayTitle}: fully functional software code, clean architecture, and clear documentation included.`,
    ],
    plugin: [
      `${displayTitle} extends your existing tools with AI-powered capability — install, configure, and immediately unlock new functionality in your stack.`,
      `Supercharge your workflow with ${displayTitle}: a precision-built plugin that adds intelligent automation where you need it most.`,
    ],
    graphic: [
      `${displayTitle} is a high-resolution, professionally designed graphic asset — ready to customize, brand, and publish across any channel.`,
      `Elevate your visual presence with ${displayTitle}: crisp, versatile graphic assets built for web, print, and social media at any scale.`,
    ],
    photo: [
      `${displayTitle} is a curated collection of AI-generated photography — commercially usable, visually striking, and instantly downloadable.`,
      `Use ${displayTitle} to elevate your brand visuals: unique, high-resolution images that stand out from overused stock photo libraries.`,
    ],
    music: [
      `${displayTitle} is a royalty-free AI-composed music track — ready for your videos, presentations, podcasts, and commercial projects without licensing headaches.`,
      `Set the perfect tone with ${displayTitle}: original AI-generated music crafted for professional use, available for unlimited commercial application.`,
    ],
    "3D": [
      `${displayTitle} is a production-ready 3D asset — fully textured, rigged where applicable, and optimized for real-time rendering engines and creative pipelines.`,
      `Integrate ${displayTitle} directly into your 3D projects: clean geometry, production-quality materials, and compatibility with leading 3D platforms.`,
    ],
    digital: [
      `${displayTitle} is a premium AI-generated digital resource — meticulously crafted for immediate download, professional use, and maximum practical value.`,
    ],
  };
  const fmtKey = format in descriptors ? format : "digital";
  const options = descriptors[fmtKey] ?? descriptors["digital"]!;
  const idx = displayTitle.length % options.length;
  return options[idx] ?? options[0] ?? `${displayTitle} — a premium AI-generated digital product ready for immediate download and use.`;
}

/** Generate a rich, ad-ready long description (300-500 chars) */
function generateLongDescription(displayTitle: string, format: string, category: string): string {
  const fmtLabel = FORMAT_LABELS[format] ?? "digital resource";
  const para1 = generateFormatDescription(displayTitle, format, category);

  const catBenefits: Record<string, string> = {
    "Writing & Content":    "Whether you're a blogger, marketer, or content creator, this resource will help you produce professional-grade content faster and with greater confidence.",
    "Education & Training": "Designed for curious learners and working professionals alike, it delivers structured, actionable knowledge you can use from day one.",
    "Productivity":         "Stop losing hours to disorganization. This resource gives you proven systems to reclaim your time and focus on what actually matters.",
    "Business & Finance":   "Built for entrepreneurs, founders, and finance professionals who need reliable tools to streamline operations and drive growth.",
    "Marketing":            "Power up your marketing stack with this resource. Drive more traffic, generate better leads, and convert with confidence.",
    "Career & HR":          "Whether you're hiring, job searching, or building your team, this resource gives you the edge you need to stand out.",
    "Health & Wellness":    "Your health is your most important asset. This resource gives you practical, evidence-informed tools to live and perform at your best.",
    "Research & Analytics": "Make smarter decisions with data. This resource equips you with frameworks and tools to analyze, interpret, and act on insights.",
    "Creative & Design":    "Unlock your creative potential with professional-grade assets. Ready to customize, brand, and ship — no design degree required.",
    "Media & Audio":        "High-quality media assets that elevate your projects. Royalty-free, instantly usable, and built for professional standards.",
    "AI & Technology":      "Leverage the power of AI without the complexity. This resource is built for builders, makers, and innovators who want results fast.",
    "Digital Products":     "A premium digital resource engineered for practical value. Download instantly, use immediately, see results quickly.",
  };

  const para2 = catBenefits[category] ?? catBenefits["Digital Products"]!;

  const deliveryPhrases = [
    `Delivered as an instant download — no waiting, no shipping.`,
    `Available immediately after purchase — start using it today.`,
    `Instant digital delivery. Compatible with all major platforms and devices.`,
    `Download instantly and get started right away. Works on desktop, tablet, and mobile.`,
  ];
  const para3 = deliveryPhrases[deterministicIdx(displayTitle, deliveryPhrases.length)];

  return `${para1}\n\n${para2} ${para3}`;
}

/** Generate 4-6 bullet points for the product page */
function generateBulletPoints(displayTitle: string, format: string, category: string): string[] {
  const fmtBullets: Record<string, string[]> = {
    ebook: [
      `Comprehensive ${displayTitle} guide — structured for fast learning`,
      "Instantly readable on Kindle, iPad, phone, or any PDF reader",
      "No subscription, no recurring fees — yours to keep forever",
      "Practical frameworks and step-by-step strategies included",
      "Optimized for both beginners and experienced practitioners",
    ],
    audiobook: [
      `High-quality AI narration — crisp, clear, and professionally paced`,
      "Listen on commutes, workouts, or any hands-free moment",
      "Full MP3/audio file — compatible with all audio players",
      "Absorb expert knowledge without screen time",
      "Instant digital download — start listening today",
    ],
    course: [
      `Structured curriculum — logical, progressive, and outcome-focused`,
      "Self-paced: learn on your schedule, at your own speed",
      "Includes exercises, checkpoints, and practical assignments",
      "Beginner-friendly with clear explanations throughout",
      "Lifetime access — revisit any module anytime",
    ],
    video: [
      `Professionally produced — clear visuals, crisp audio`,
      "Watch on any device: desktop, tablet, or smartphone",
      "Concise and action-oriented — no filler, all signal",
      "Downloadable video file for offline viewing",
      "Packed with visual demonstrations and real examples",
    ],
    template: [
      `Fully editable — customize fonts, colors, and content`,
      "Compatible with Word, Google Docs, Canva, and more",
      "Professional structure designed by expert practitioners",
      "Ready to use immediately — just fill in your details",
      "Saves hours of formatting and layout work",
    ],
    software: [
      `Production-ready code — clean, documented, and tested`,
      "Modular architecture for easy customization",
      "Well-commented codebase for fast onboarding",
      "Compatible with modern development environments",
      "Includes setup guide and deployment instructions",
    ],
    plugin: [
      `One-click install — no complex setup required`,
      "Seamlessly extends your existing tools and workflow",
      "Lightweight and performant — minimal impact on speed",
      "Full documentation and configuration guide included",
      "Compatible with major platforms and CMS systems",
    ],
    graphic: [
      `High-resolution files — print and web ready`,
      "Fully layered and editable in your favorite design tools",
      "Multiple format exports: PNG, SVG, PSD, and more",
      "Commercial license included — use in client projects",
      "Consistent professional style ready for branding",
    ],
    photo: [
      `High-resolution AI-generated photography`,
      "Commercially usable — no attribution required",
      "Unique images unavailable anywhere else online",
      "Multiple resolutions included for every use case",
      "Instant download in standard image formats",
    ],
    music: [
      `100% royalty-free — use in commercial projects freely`,
      "High-quality audio: mastered for streaming and broadcast",
      "MP3 and WAV formats included",
      "Unique AI composition — not found in any stock library",
      "Suitable for video, podcast, social media, and presentations",
    ],
    "3D": [
      `Production-ready geometry — optimized polygon count`,
      "Fully textured with PBR materials",
      "Compatible with Blender, Maya, Cinema 4D, and Unreal Engine",
      "Multiple file formats included: OBJ, FBX, GLTF",
      "Ready for real-time use in games and interactive applications",
    ],
    digital: [
      `Premium AI-generated content — professional grade`,
      "Instant digital delivery — no waiting required",
      "Designed for immediate practical application",
      "Compatible with all standard platforms and software",
      "Lifetime access — download and reuse anytime",
    ],
  };

  const catBonus: Record<string, string> = {
    "Health & Wellness":    "Evidence-informed content designed for real results",
    "Business & Finance":   "Developed with professional business frameworks",
    "Marketing":            "Conversion-optimized content for maximum ROI",
    "Education & Training": "Structured pedagogy for maximum knowledge retention",
    "AI & Technology":      "Built with cutting-edge AI development best practices",
    "Creative & Design":    "Aesthetic direction refined for modern design standards",
  };

  const bullets = (fmtBullets[format] ?? fmtBullets["digital"]).slice(0, 5);
  const bonus = catBonus[category];
  if (bonus && bullets.length < 6) bullets.push(bonus);
  return bullets;
}

/** Generate audience description */
function generateAudience(category: string, format: string): string {
  const catAudience: Record<string, string> = {
    "Writing & Content":    "Bloggers, content marketers, copywriters, and business owners who create content regularly",
    "Education & Training": "Students, lifelong learners, coaches, and professionals seeking to upskill",
    "Productivity":         "Entrepreneurs, remote workers, and busy professionals who want to get more done in less time",
    "Business & Finance":   "Founders, managers, accountants, and business owners who need reliable financial tools",
    "Marketing":            "Digital marketers, entrepreneurs, and growth hackers focused on customer acquisition",
    "Career & HR":          "Job seekers, HR professionals, hiring managers, and career coaches",
    "Health & Wellness":    "Individuals focused on improving their physical and mental wellbeing",
    "Research & Analytics": "Analysts, researchers, data scientists, and decision-makers who work with data",
    "Creative & Design":    "Graphic designers, brand strategists, content creators, and creative professionals",
    "Media & Audio":        "Video creators, podcasters, musicians, and media producers",
    "AI & Technology":      "Developers, entrepreneurs, and tech enthusiasts building with AI and automation",
    "Digital Products":     "Professionals, entrepreneurs, and creators seeking premium digital resources",
  };
  const fmtAudience: Record<string, string> = {
    ebook:     "readers and knowledge-seekers",
    course:    "active learners and skill-builders",
    template:  "people who value their time",
    software:  "developers and technical users",
    plugin:    "power users and developers",
    graphic:   "designers and content creators",
    music:     "creators and media producers",
    audiobook: "audio learners and commuters",
  };
  const base = catAudience[category] ?? catAudience["Digital Products"]!;
  const fmtNote = fmtAudience[format];
  return fmtNote ? `${base}, particularly ${fmtNote}` : base;
}

/** Generate a compelling one-liner value proposition */
function generateValueProp(displayTitle: string, format: string, category: string): string {
  const props: string[] = [
    `Get everything you need to master ${displayTitle} — instant access, no subscription.`,
    `Stop wasting time on ${category.toLowerCase()} challenges — ${displayTitle} gives you the roadmap.`,
    `Professional-grade ${FORMAT_LABELS[format] ?? "resource"} that delivers real results, instantly.`,
    `Skip the learning curve — ${displayTitle} is your shortcut to ${category.toLowerCase()} success.`,
    `Everything a professional needs for ${displayTitle} — ready to use today.`,
  ];
  return props[deterministicIdx(displayTitle + format, props.length)]!;
}

/** Generate CTA button text */
function generateCTA(format: string): string {
  const ctas: Record<string, string[]> = {
    ebook:     ["Download Your eBook Now", "Get Instant PDF Access", "Download eBook — $"],
    audiobook: ["Get Instant Audio Access", "Start Listening Now", "Download Audiobook"],
    course:    ["Enroll Now — Instant Access", "Start Learning Today", "Get Course Access"],
    video:     ["Download Video Now", "Get Instant Video Access", "Watch Immediately"],
    template:  ["Download Template Now", "Get Your Template", "Use This Template Today"],
    software:  ["Download Software Now", "Get Instant Access", "Download & Deploy"],
    plugin:    ["Install Plugin Now", "Get Plugin Access", "Download & Install"],
    graphic:   ["Download Graphics Now", "Get Instant Access", "Download Asset Pack"],
    music:     ["Download Track Now", "Get Royalty-Free Access", "Download & Use Today"],
    photo:     ["Download Photos Now", "Get Instant Access", "Download Photo Pack"],
    "3D":      ["Download 3D Asset Now", "Get Instant Access", "Download & Create"],
    digital:   ["Get Instant Access", "Download Now", "Buy & Download Instantly"],
  };
  const options = ctas[format] ?? ctas["digital"];
  return options![deterministicIdx(format, options!.length)]!;
}

/** Generate social proof teaser */
function generateSocialProof(category: string): string {
  const proofs = [
    `Loved by professionals in ${category.toLowerCase()} worldwide`,
    `Trusted by creators and entrepreneurs globally`,
    `Used by thousands of professionals to save time and get results`,
    `Rated highly by practitioners in the ${category.toLowerCase()} field`,
    `Part of the CreateAI Brain catalog — built for real-world results`,
  ];
  return proofs[deterministicIdx(category, proofs.length)]!;
}

// ── Image URL generators ───────────────────────────────────────────────────────

/** Primary cover image — 600x400 landscape */
function generateCoverImageUrl(displayTitle: string, format: string, category: string, existingUrl: string): string {
  if (existingUrl && existingUrl.startsWith("https://") && !existingUrl.includes("placehold")) return existingUrl;
  const catTerms: Record<string, string> = {
    "Writing & Content":    "writing,content,creative,desk",
    "Education & Training": "education,learning,study,knowledge",
    "Productivity":         "productivity,focus,workspace,planning",
    "Business & Finance":   "business,finance,professional,success",
    "Marketing":            "marketing,digital,brand,growth",
    "Career & HR":          "career,professional,workplace,growth",
    "Health & Wellness":    "health,wellness,fitness,calm",
    "Research & Analytics": "data,research,analysis,insights",
    "Creative & Design":    "design,creative,art,visual",
    "Media & Audio":        "media,audio,music,studio",
    "AI & Technology":      "technology,ai,innovation,digital",
    "Digital Products":     "digital,product,download,ai",
  };
  const terms = catTerms[category] ?? "digital,product,ai";
  const sig = deterministicIdx(displayTitle + format, 9999);
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(terms)}&sig=${sig}`;
}

/** Square thumbnail — 300x300 for ad feeds */
function generateThumbnailUrl(displayTitle: string, format: string, category: string): string {
  const catTerms: Record<string, string> = {
    "Writing & Content":    "writing,book,pen",
    "Education & Training": "education,study,learning",
    "Productivity":         "productivity,planner,work",
    "Business & Finance":   "business,finance,money",
    "Marketing":            "marketing,brand,digital",
    "Career & HR":          "career,resume,interview",
    "Health & Wellness":    "health,wellness,fitness",
    "Research & Analytics": "data,analytics,chart",
    "Creative & Design":    "design,art,creative",
    "Media & Audio":        "audio,music,media",
    "AI & Technology":      "technology,ai,code",
    "Digital Products":     "digital,download,product",
  };
  const terms = catTerms[category] ?? "product,digital";
  const sig = deterministicIdx(displayTitle + "thumb", 9999);
  return `https://source.unsplash.com/300x300/?${encodeURIComponent(terms)}&sig=${sig}`;
}

/** Gallery images — 3 contextual supplemental images */
function generateGalleryImages(displayTitle: string, category: string): string[] {
  const catTerms: Record<string, string> = {
    "Writing & Content":    "writing,notebook,creative",
    "Education & Training": "education,classroom,learning",
    "Productivity":         "productivity,workspace,organized",
    "Business & Finance":   "business,office,professional",
    "Marketing":            "marketing,strategy,growth",
    "Career & HR":          "career,interview,professional",
    "Health & Wellness":    "wellness,mindfulness,fitness",
    "Research & Analytics": "data,research,analysis",
    "Creative & Design":    "design,creative,art",
    "Media & Audio":        "studio,audio,production",
    "AI & Technology":      "technology,computer,digital",
    "Digital Products":     "digital,technology,minimal",
  };
  const terms = catTerms[category] ?? "digital,product";
  return [1, 2, 3].map(i => {
    const sig = deterministicIdx(displayTitle + "gallery" + i, 9999);
    return `https://source.unsplash.com/800x500/?${encodeURIComponent(terms)}&sig=${sig}`;
  });
}

/** Video preview URL — YouTube search for format+category (no autoplay, embed-safe) */
function generateVideoPreviewUrl(displayTitle: string, format: string): string {
  // Use a stable YouTube search URL as a preview reference (not an embed)
  // Real video embeds would require per-product YouTube video IDs
  const q = encodeURIComponent(`${displayTitle} ${format} preview`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

/** MPN / SKU */
function generateMPN(productId: string): string {
  return `CAB-${productId.slice(0, 8).toUpperCase()}`;
}

// ── Meta / SEO generators ─────────────────────────────────────────────────────

function generateMetaTitle(displayTitle: string, format: string): string {
  const fmtLabel = FORMAT_LABELS[format] ?? "Digital Download";
  const candidate = `${displayTitle} — ${fmtLabel} | CreateAI Brain`;
  return candidate.length <= 60 ? candidate : `${displayTitle} | CreateAI Brain`.slice(0, 60);
}

function generateMetaDescription(displayTitle: string, format: string, category: string, priceCents: number): string {
  const price = `$${(priceCents / 100).toFixed(2)}`;
  const fmtLabel = FORMAT_LABELS[format] ?? "digital download";
  const candidates = [
    `Download ${displayTitle} — a premium ${fmtLabel} for ${category.toLowerCase()} professionals. Instant access. ${price} one-time.`,
    `Get ${displayTitle}: top-rated ${fmtLabel} in ${category}. Instant download. ${price} — no subscription.`,
    `${displayTitle} ${fmtLabel} — professionally crafted for ${category.toLowerCase()}. Buy once, use forever. ${price}.`,
  ];
  const candidate = candidates[deterministicIdx(displayTitle, candidates.length)]!;
  return candidate.length <= 160 ? candidate : candidate.slice(0, 157) + "…";
}

function generateAltText(displayTitle: string, format: string): string {
  const fmtLabel = FORMAT_LABELS[format] ?? "digital product";
  return `${displayTitle} — ${fmtLabel} cover image by CreateAI Brain`;
}

/** OG image — 1200x630 landscape */
function generateOgImage(displayTitle: string, category: string): string {
  const catTerms: Record<string, string> = {
    "Writing & Content":    "writing,creative,desk,book",
    "Education & Training": "education,learning,knowledge",
    "Productivity":         "productivity,planning,success",
    "Business & Finance":   "business,finance,professional",
    "Marketing":            "marketing,growth,digital",
    "Career & HR":          "career,professional,success",
    "Health & Wellness":    "wellness,health,lifestyle",
    "Research & Analytics": "data,insights,analytics",
    "Creative & Design":    "creative,design,art",
    "Media & Audio":        "media,audio,studio",
    "AI & Technology":      "technology,innovation,digital",
    "Digital Products":     "digital,product,technology",
  };
  const terms = catTerms[category] ?? "digital,product";
  const sig = deterministicIdx(displayTitle + "og", 9999);
  return `https://source.unsplash.com/1200x630/?${encodeURIComponent(terms)}&sig=${sig}`;
}

// ── Main mapper ───────────────────────────────────────────────────────────────

function mapStripeToSemantic(
  product: { id: string; name: string; description: string | null; metadata: Record<string, string>; images: string[]; created: number; updated: number },
  price: { id: string; unit_amount: number | null } | null
): SemanticProduct {
  const meta = product.metadata || {};
  const format = extractFormat(product.name, meta);
  const displayTitle = cleanDisplayTitle(product.name);
  const title = displayTitle;
  const slug = slugify(product.name);
  const priceCents = price?.unit_amount ?? 1900;
  const category = extractCategory(displayTitle, meta);
  const tags = extractTags(meta, displayTitle, format, category);
  const valuePriceCents = FORMAT_VALUE_CENTS[format] ?? FORMAT_VALUE_CENTS["digital"] ?? 2200;

  // Description
  const OLD_FORMAT_PATTERN = /AI Solution:|AI Tool:|Digital Product:|\([a-z0-9A-Z]+\)\s*(uses|is built|provides|enables)/i;
  const stripeDesc = product.description ?? "";
  const useGenerated = !stripeDesc || OLD_FORMAT_PATTERN.test(stripeDesc);
  const description = useGenerated
    ? generateFormatDescription(displayTitle, format, category)
    : stripeDesc;
  const shortDescription = description.length > 140
    ? description.slice(0, 137) + "…"
    : description;

  // All advertising-grade fields — auto-generated, deterministic
  const coverImageUrl = generateCoverImageUrl(displayTitle, format, category, product.images?.[0] ?? "");
  const thumbnailUrl = generateThumbnailUrl(displayTitle, format, category);
  const galleryImageUrls = generateGalleryImages(displayTitle, category);
  const keywords = generateKeywords(displayTitle, format, category, tags);
  const metaTitle = generateMetaTitle(displayTitle, format);
  const metaDescription = generateMetaDescription(displayTitle, format, category, priceCents);
  const altText = generateAltText(displayTitle, format);
  const ogImage = generateOgImage(displayTitle, category);
  const audience = generateAudience(category, format);
  const valueProposition = generateValueProp(displayTitle, format, category);
  const callToAction = generateCTA(format);
  const socialProof = generateSocialProof(category);
  const bulletPoints = generateBulletPoints(displayTitle, format, category);
  const longDescription = generateLongDescription(displayTitle, format, category);
  const videoPreviewUrl = generateVideoPreviewUrl(displayTitle, format);
  const mpn = generateMPN(product.id);
  const googleProductCategory = GOOGLE_CATEGORY_MAP[category] ?? "Software";
  const formatLabel = FORMAT_LABELS[format] ?? "Digital Download";
  const structuredDataType =
    format === "ebook" ? "Book" :
    format === "course" ? "Course" :
    format === "music" ? "MusicRecording" : "Product";

  return {
    id: product.id,
    slug,
    title,
    description,
    shortDescription,
    longDescription,
    priceCents,
    valuePriceCents,
    currency: "usd",
    format,
    formatLabel,
    productType: "digital",
    category,
    tags,
    keywords,
    coverImageUrl,
    thumbnailUrl,
    galleryImageUrls,
    videoPreviewUrl,
    altText,
    metaTitle,
    metaDescription,
    ogImage,
    structuredDataType,
    brand: "CreateAI Brain",
    condition: "new",
    availability: "in stock",
    mpn,
    googleProductCategory,
    ageGroup: "adult",
    audience,
    valueProposition,
    callToAction,
    socialProof,
    bulletPoints,
    stripeProductId: product.id,
    stripePriceId: price?.id || "",
    stripePaymentLinkUrl: undefined,
    channels: {
      stripe: price?.id ? "live" : "pending",
      hostedPage: "live",
      shopifyCsv: "ready",
      woocommerceCsv: "ready",
      googleShopping: "ready",
      amazonFeed: "ready",
    },
    views: 0,
    sales: 0,
    revenueCents: 0,
    createdAt: new Date(product.created * 1000).toISOString(),
    updatedAt: new Date(product.updated * 1000).toISOString(),
  };
}

// ── Registry management ───────────────────────────────────────────────────────

export async function refreshRegistry(): Promise<number> {
  try {
    const stripe = await getUncachableStripeClient();

    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
    });

    const seen = new Set<string>();
    const semanticProducts: SemanticProduct[] = [];

    for (const price of prices.data) {
      const product = price.product as {
        id: string; name: string; description: string | null;
        metadata: Record<string, string>; images: string[];
        created: number; updated: number; deleted?: boolean;
      } | null;
      if (!product || product.deleted) continue;
      if (seen.has(product.id)) continue;
      seen.add(product.id);

      semanticProducts.push(mapStripeToSemantic(product, {
        id: price.id,
        unit_amount: price.unit_amount,
      }));
    }

    semanticProducts.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    _registry = semanticProducts;
    _lastRefresh = Date.now();
    console.log(`[SemanticLayer] Registry refreshed — ${_registry.length} products indexed with full ad-grade fields`);
    return _registry.length;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SemanticLayer] Registry refresh failed: ${msg}`);
    return _registry.length;
  }
}

export async function getRegistry(forceRefresh = false): Promise<SemanticProduct[]> {
  const stale = Date.now() - _lastRefresh > REFRESH_MS;
  if (forceRefresh || stale || _registry.length === 0) {
    await refreshRegistry();
  }
  return _registry;
}

export function getFromRegistry(idOrSlug: string): SemanticProduct | undefined {
  return _registry.find(p => p.id === idOrSlug || p.slug === idOrSlug);
}

export function getRegistrySnapshot(): { count: number; lastRefresh: string; stale: boolean } {
  return {
    count: _registry.length,
    lastRefresh: _lastRefresh ? new Date(_lastRefresh).toISOString() : "never",
    stale: Date.now() - _lastRefresh > REFRESH_MS,
  };
}
