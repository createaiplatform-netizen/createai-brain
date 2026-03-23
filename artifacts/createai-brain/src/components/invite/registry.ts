/**
 * Invite Registry — Universal Invitation Engine
 * -----------------------------------------------
 * Single source of truth. Add an entry here → surface appears automatically
 * in InvitePanel, InviteCard, ShareHelpers, and EmbeddedInvite.
 * No component changes ever needed.
 */

export interface ShareText {
  sms?:   string;
  email?: string;
}

export interface InviteSurface {
  id:         string;
  title:      string;
  tagline:    string;       // one sentence shown beneath the title
  link:       string;       // path (relative) or full URL
  joinLabel?: string;       // CTA button text (default "Join")
  icon?:      string;       // emoji
  color?:     string;       // accent hex (default sage)
  category?:  string;       // e.g. "internal" | "app" | "invite" | "social"
  featured?:  boolean;      // shown first / highlighted in panel
  routeHint?: string;       // route prefix that makes this surface contextually relevant
  shareText?: ShareText;    // plain-text snippets for SMS / email
  hidden?:    boolean;      // exclude from panel without deleting
}

export const SURFACES: InviteSurface[] = [

  // ── Invite & Share (always shown first) ──────────────────────────────────
  {
    id:        "invite-someone",
    title:     "Invite Someone",
    tagline:   "Send anyone a direct link to join CreateAI Brain with one tap.",
    link:      "/broadcast",
    joinLabel: "Send Invite",
    icon:      "🤝",
    color:     "#9CAF88",
    category:  "invite",
    featured:  true,
    shareText: {
      sms:   "Hey! Join me on CreateAI Brain — the AI OS for your business. Sign up here: {{link}}",
      email: "Hi,\n\nI've been using CreateAI Brain and thought you'd love it. It's an AI operating system that handles your entire business. Join here: {{link}}\n\nSee you inside!",
    },
  },
  {
    id:        "share-this",
    title:     "Share This",
    tagline:   "Share CreateAI Brain with your network — one link, every surface.",
    link:      "/",
    joinLabel: "Share Now",
    icon:      "🔗",
    color:     "#7a9068",
    category:  "invite",
    featured:  true,
    shareText: {
      sms:   "Check out CreateAI Brain — an AI OS that runs your whole business: {{link}}",
      email: "Hi,\n\nWanted to share CreateAI Brain with you. It's an AI platform that covers healthcare, legal, staffing, family, and more. Try it here: {{link}}",
    },
  },

  // ── Core platform ─────────────────────────────────────────────────────────
  {
    id:        "platform",
    title:     "CreateAI Brain",
    tagline:   "The AI operating system for your entire business.",
    link:      "/",
    joinLabel: "Get Started",
    icon:      "🧠",
    color:     "#7a9068",
    category:  "internal",
    routeHint: "/",
  },
  {
    id:        "dashboard",
    title:     "Dashboard",
    tagline:   "Your command center — live metrics, quick actions, and everything in one view.",
    link:      "/dashboard",
    joinLabel: "Open Dashboard",
    icon:      "🎛️",
    color:     "#7a9068",
    category:  "internal",
    routeHint: "/dashboard",
  },
  {
    id:        "onboarding",
    title:     "Start Here",
    tagline:   "Set up your workspace in minutes and launch your first AI workflow.",
    link:      "/onboarding",
    joinLabel: "Start Setup",
    icon:      "🚀",
    color:     "#9CAF88",
    category:  "internal",
    routeHint: "/onboarding",
  },
  {
    id:        "whats-new",
    title:     "What's New",
    tagline:   "See the latest features, updates, and improvements as they ship.",
    link:      "/evolution",
    joinLabel: "See Updates",
    icon:      "✨",
    color:     "#c97b2e",
    category:  "internal",
    routeHint: "/evolution",
  },
  {
    id:        "settings",
    title:     "Settings",
    tagline:   "Customize your workspace, integrations, and notification preferences.",
    link:      "/settings",
    joinLabel: "Open Settings",
    icon:      "⚙️",
    color:     "#6b7280",
    category:  "internal",
    routeHint: "/settings",
  },

  // ── Broadcast ─────────────────────────────────────────────────────────────
  {
    id:        "broadcast",
    title:     "Broadcast Network",
    tagline:   "Receive live emergency alerts the moment they fire.",
    link:      "/broadcast",
    joinLabel: "Join Broadcast",
    icon:      "📡",
    color:     "#9CAF88",
    category:  "internal",
    routeHint: "/broadcast",
    shareText: {
      sms:   "Join the CreateAI Brain Broadcast Network for live alerts: {{link}}",
      email: "Subscribe to the CreateAI Brain Broadcast Network to receive live platform alerts directly to your device: {{link}}",
    },
  },

  // ── Spaces & hubs ─────────────────────────────────────────────────────────
  {
    id:        "family",
    title:     "Family Universe",
    tagline:   "A private, secure space for your family — built inside CreateAI Brain.",
    link:      "/family",
    joinLabel: "Enter Family Hub",
    icon:      "🏡",
    color:     "#5a7d8a",
    category:  "internal",
    routeHint: "/family",
  },
  {
    id:        "projects",
    title:     "Projects",
    tagline:   "Create, manage, and ship every project with AI at every step.",
    link:      "/projects",
    joinLabel: "Open Projects",
    icon:      "📁",
    color:     "#7a9068",
    category:  "internal",
    routeHint: "/project",
  },
  {
    id:        "global-expansion",
    title:     "Global Expansion Hub",
    tagline:   "Launch your business into new markets with AI-powered global strategy.",
    link:      "/global-expansion",
    joinLabel: "Explore Global",
    icon:      "🌐",
    color:     "#4a90d9",
    category:  "internal",
    routeHint: "/global-expansion",
  },

  // ── Apps ──────────────────────────────────────────────────────────────────
  {
    id:        "health",
    title:     "HealthOS",
    tagline:   "AI-powered healthcare management for your entire practice.",
    link:      "/apps/health",
    joinLabel: "Open HealthOS",
    icon:      "🏥",
    color:     "#4a90d9",
    category:  "app",
    routeHint: "/apps/health",
  },
  {
    id:        "legal",
    title:     "Legal Practice Manager",
    tagline:   "Manage cases, clients, and compliance with AI precision.",
    link:      "/apps/legal",
    joinLabel: "Open Legal PM",
    icon:      "⚖️",
    color:     "#7c5cbf",
    category:  "app",
    routeHint: "/apps/legal",
  },
  {
    id:        "staffing",
    title:     "StaffingOS",
    tagline:   "Global staffing and workforce management, fully automated.",
    link:      "/apps/staffing",
    joinLabel: "Open StaffingOS",
    icon:      "🌍",
    color:     "#c97b2e",
    category:  "app",
    routeHint: "/apps/staffing",
  },
];

/** Look up a surface by id. */
export function getSurface(id: string): InviteSurface | undefined {
  return SURFACES.find(s => s.id === id && !s.hidden);
}

/** All visible surfaces. */
export function getVisibleSurfaces(): InviteSurface[] {
  return SURFACES.filter(s => !s.hidden);
}

/**
 * Returns surfaces relevant to the given route, sorted so:
 * 1. Route-matching surfaces appear first
 * 2. Featured surfaces appear second
 * 3. Rest follow
 */
export function getSurfacesForRoute(route: string): InviteSurface[] {
  return getVisibleSurfaces().sort((a, b) => {
    const aMatch = a.routeHint && route.startsWith(a.routeHint) ? -2 : 0;
    const bMatch = b.routeHint && route.startsWith(b.routeHint) ? -2 : 0;
    const aFeat  = a.featured ? -1 : 0;
    const bFeat  = b.featured ? -1 : 0;
    return (aMatch + aFeat) - (bMatch + bFeat);
  });
}
