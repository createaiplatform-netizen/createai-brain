/**
 * publicSurfaces.ts — Canonical registry of public-eligible platform surfaces.
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the backend: discovery API, sitemap, metadata,
 * External Bridge fan-out, and agent surface enumeration.
 *
 * SELF-EXPANSION RULE: Adding a new entry here automatically:
 *   1. Exposes it via GET /api/discovery/surfaces (JSON, no auth)
 *   2. Adds it to /sitemap.xml
 *   3. Includes it in the External Bridge refresh broadcast
 *   4. Makes it describable by agents
 * No other files need changing.
 */

export interface PublicSurface {
  id:          string;
  title:       string;
  tagline:     string;
  path:        string;          // relative path (no origin)
  icon:        string;
  category:    "platform" | "tool" | "invite" | "broadcast" | "hub";
  priority:    string;          // sitemap priority 0.00–1.00
  changefreq:  "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  noindex?:    boolean;         // exclude from sitemap/discovery if true
  ogImage?:    string;          // optional custom OG image path
}

export const PUBLIC_SURFACES: PublicSurface[] = [
  // ── Core platform ─────────────────────────────────────────────────────────
  {
    id:         "home",
    title:      "CreateAI Brain — The AI OS for Everything You Do",
    tagline:    "365+ intelligent tools in one OS: healthcare, legal, staffing, family, finance, and more. Replace $100K+ in software.",
    path:       "/",
    icon:       "🧠",
    category:   "platform",
    priority:   "1.00",
    changefreq: "daily",
  },
  {
    id:         "discover",
    title:      "Discover CreateAI Brain",
    tagline:    "Browse every surface, space, tool, and hub. Find the right AI for any job.",
    path:       "/discover",
    icon:       "🔍",
    category:   "platform",
    priority:   "0.92",
    changefreq: "daily",
  },
  {
    id:         "createai-digital",
    title:      "CreateAI Brain — Platform Home",
    tagline:    "The complete AI-powered business operating system by Lakeside Trinity LLC.",
    path:       "/createai-digital",
    icon:       "🌐",
    category:   "platform",
    priority:   "0.96",
    changefreq: "weekly",
  },
  {
    id:         "public-bridge",
    title:      "CreateAI Brain — Public Portal",
    tagline:    "Explore and join the CreateAI Brain ecosystem without an account.",
    path:       "/public",
    icon:       "🌐",
    category:   "platform",
    priority:   "0.88",
    changefreq: "weekly",
  },
  {
    id:         "platform-status",
    title:      "Platform Status — CreateAI Brain",
    tagline:    "Live status of all 17 CreateAI Brain endpoints and services.",
    path:       "/platform-status",
    icon:       "📊",
    category:   "platform",
    priority:   "0.72",
    changefreq: "hourly",
  },

  // ── Broadcast & sharing ───────────────────────────────────────────────────
  {
    id:         "broadcast",
    title:      "Broadcast Network — CreateAI Brain",
    tagline:    "Subscribe to live alerts and emergency broadcasts across the CreateAI Brain network.",
    path:       "/broadcast",
    icon:       "📡",
    category:   "broadcast",
    priority:   "0.88",
    changefreq: "daily",
  },

  // ── Invite & join ─────────────────────────────────────────────────────────
  {
    id:         "join",
    title:      "Join CreateAI Brain",
    tagline:    "Sign up with an invite code and get instant access to 365+ AI tools.",
    path:       "/join/landing",
    icon:       "🤝",
    category:   "invite",
    priority:   "0.85",
    changefreq: "weekly",
  },
  {
    id:         "real-market",
    title:      "Real Market — CreateAI Brain",
    tagline:    "Browse and purchase AI tools, templates, and packages from the CreateAI marketplace.",
    path:       "/real-market",
    icon:       "🛒",
    category:   "platform",
    priority:   "0.78",
    changefreq: "daily",
  },
  {
    id:         "semantic-store",
    title:      "Semantic Store — CreateAI Brain",
    tagline:    "AI-powered product discovery and purchase. Find the exact tool for your industry.",
    path:       "/semantic-store",
    icon:       "🏪",
    category:   "platform",
    priority:   "0.80",
    changefreq: "daily",
  },

  // ── Industry tools (public SEO landing pages) ─────────────────────────────
  {
    id:         "healthcare",
    title:      "HealthOS — AI Healthcare Management",
    tagline:    "AI-powered healthcare management for your entire practice. Patients, records, billing, compliance.",
    path:       "/for/healthcare",
    icon:       "🏥",
    category:   "tool",
    priority:   "0.90",
    changefreq: "weekly",
  },
  {
    id:         "legal",
    title:      "Legal Practice Manager — AI for Law",
    tagline:    "Manage cases, clients, documents, and compliance with AI precision.",
    path:       "/for/legal",
    icon:       "⚖️",
    category:   "tool",
    priority:   "0.90",
    changefreq: "weekly",
  },
  {
    id:         "staffing",
    title:      "StaffingOS — Global AI Staffing",
    tagline:    "Global staffing, workforce management, and talent acquisition — fully automated.",
    path:       "/for/staffing",
    icon:       "🌍",
    category:   "tool",
    priority:   "0.90",
    changefreq: "weekly",
  },
  {
    id:         "finance",
    title:      "AI Finance Suite — CreateAI Brain",
    tagline:    "AI-driven financial management, forecasting, and reporting for any organization.",
    path:       "/for/finance",
    icon:       "💰",
    category:   "tool",
    priority:   "0.88",
    changefreq: "weekly",
  },
  {
    id:         "education",
    title:      "AI Education Suite — CreateAI Brain",
    tagline:    "Curriculum design, lesson plans, assessments, and student management powered by AI.",
    path:       "/for/education",
    icon:       "📚",
    category:   "tool",
    priority:   "0.88",
    changefreq: "weekly",
  },
  {
    id:         "real-estate",
    title:      "AI Real Estate Suite — CreateAI Brain",
    tagline:    "Property analysis, client management, contracts, and market intelligence — AI-powered.",
    path:       "/for/real-estate",
    icon:       "🏘️",
    category:   "tool",
    priority:   "0.88",
    changefreq: "weekly",
  },
  {
    id:         "nonprofit",
    title:      "AI Nonprofit Suite — CreateAI Brain",
    tagline:    "Grant writing, donor management, impact reporting, and volunteer coordination with AI.",
    path:       "/for/nonprofits",
    icon:       "💚",
    category:   "tool",
    priority:   "0.86",
    changefreq: "weekly",
  },

  // ── Family hub ────────────────────────────────────────────────────────────
  {
    id:         "family-hub",
    title:      "Family Universe — CreateAI Brain",
    tagline:    "A private, secure AI space for your entire family — goals, memories, banking, and more.",
    path:       "/public/family",
    icon:       "🏡",
    category:   "hub",
    priority:   "0.85",
    changefreq: "weekly",
  },
];

/** All surfaces eligible for public indexing (non-noindex). */
export function getIndexableSurfaces(): PublicSurface[] {
  return PUBLIC_SURFACES.filter(s => !s.noindex);
}

/** Find a surface by id. */
export function getPublicSurface(id: string): PublicSurface | undefined {
  return PUBLIC_SURFACES.find(s => s.id === id);
}
