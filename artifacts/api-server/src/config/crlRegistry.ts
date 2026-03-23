/**
 * crlRegistry.ts — CreateAI Resolution Layer (CRL) Registry
 * ──────────────────────────────────────────────────────────
 * Single source of truth for all CRL namespaces, TLDs, and resolution patterns.
 *
 * CRL is an internal naming system that replaces traditional DNS at the
 * software layer. Apps, users, and spaces are addressed by CRL URIs:
 *
 *   brain://tools/writer        → https://createai.digital/
 *   family://bank               → https://createai.digital/family-hub
 *   os://settings               → https://createai.digital/settings
 *   hub://healthcare            → https://createai.digital/for/healthcare
 *   user://me                   → https://createai.digital/settings
 *   space://projects            → https://createai.digital/projects
 *   invite://broadcast          → https://createai.digital/broadcast
 *   api://discovery/surfaces    → https://createai.digital/api/discovery/surfaces
 *   store://semantic            → https://createai.digital/semantic-store
 *
 * To add a new namespace: append to NAMESPACES. Zero code changes elsewhere.
 */

import { getCanonicalBaseUrl } from "../utils/publicUrl.js";

export type CRLScheme =
  | "brain"
  | "family"
  | "os"
  | "hub"
  | "user"
  | "space"
  | "invite"
  | "api"
  | "store"
  | "agent"
  | "pulse"
  | string; // extensible

export interface CRLNamespace {
  scheme:      CRLScheme;
  label:       string;
  description: string;
  icon:        string;
  baseRoute:   string;            // default path when no sub-path given
  resolver:    (path: string, base: string) => string; // maps sub-path → full URL
  examples:    { uri: string; resolves: string }[];
  public:      boolean;           // visible without auth
}

export interface CRLRecord {
  uri:         string;            // e.g. brain://tools/writer
  scheme:      string;
  path:        string;
  resolvedUrl: string;
  label:       string;
  description: string;
  icon:        string;
  public:      boolean;
}

// ── Industry hub slugs (auto-resolved by hub://) ────────────────────────────
const HUB_SLUGS: Record<string, string> = {
  healthcare:   "/for/healthcare",
  legal:        "/for/legal",
  staffing:     "/for/staffing",
  finance:      "/for/finance",
  education:    "/for/education",
  "real-estate":"/for/real-estate",
  nonprofits:   "/for/nonprofits",
  entrepreneurs:"/for/entrepreneurs",
  creators:     "/for/creators",
  consultants:  "/for/consultants",
  technology:   "/for/technology",
  retail:       "/for/retail",
};

// ── OS surface map (os://) ───────────────────────────────────────────────────
const OS_PATHS: Record<string, string> = {
  "":             "/",
  dashboard:      "/dashboard",
  settings:       "/settings",
  billing:        "/billing",
  library:        "/output-library",
  "output-library": "/output-library",
  projects:       "/projects",
  team:           "/team",
  analytics:      "/analytics",
  cmd:            "/",           // opens command palette via ?cmd=open
  command:        "/",
  data:           "/data",
  evolution:      "/evolution",
  admin:          "/admin",
};

// ── Family surface map (family://) ──────────────────────────────────────────
const FAMILY_PATHS: Record<string, string> = {
  "":         "/family-hub",
  hub:        "/family-hub",
  bank:       "/family-hub",
  goals:      "/family-hub",
  memories:   "/family-hub",
  habits:     "/family-hub",
  wellness:   "/family-hub",
  kids:       "/family/kids",
  portal:     "/family-portal-intro",
  intro:      "/family-portal-intro",
  share:      "/family-portal-intro",
};

// ── Agent names (agent://) ───────────────────────────────────────────────────
const AGENT_PATHS: Record<string, string> = {
  ucpx:    "/command-center",
  nova:    "/family-hub",
  atlas:   "/family-hub",
  aurora:  "/family-hub",
  brain:   "/above-transcend",
  semantic:"/semantic-store",
};

// ── NAMESPACE REGISTRY ───────────────────────────────────────────────────────

export const NAMESPACES: CRLNamespace[] = [
  {
    scheme:      "brain",
    label:       "Brain Platform",
    description: "Core CreateAI Brain platform — apps, tools, and engines",
    icon:        "🧠",
    baseRoute:   "/",
    public:      false,
    resolver:    (path, base) => {
      if (!path || path === "/") return base + "/";
      const clean = path.replace(/^\//, "");
      // brain://apps/{id} → /apps/{id}
      if (clean.startsWith("apps/") || clean.startsWith("tools/"))
        return base + "/" + clean.replace(/^(apps|tools)\//, "");
      return base + "/" + clean;
    },
    examples: [
      { uri: "brain://", resolves: "/" },
      { uri: "brain://tools/writer", resolves: "/" },
      { uri: "brain://dashboard", resolves: "/dashboard" },
    ],
  },
  {
    scheme:      "family",
    label:       "Family Universe",
    description: "Private family AI space — bank, goals, agents, memories",
    icon:        "🏡",
    baseRoute:   "/family-hub",
    public:      false,
    resolver:    (path, base) => {
      const clean = path.replace(/^\//, "");
      if (clean.startsWith("agents/")) {
        const agent = clean.replace("agents/", "").toLowerCase();
        return base + (AGENT_PATHS[agent] ?? "/family-hub");
      }
      return base + (FAMILY_PATHS[clean] ?? "/family-hub");
    },
    examples: [
      { uri: "family://", resolves: "/family-hub" },
      { uri: "family://bank", resolves: "/family-hub" },
      { uri: "family://agents/nova", resolves: "/family-hub" },
      { uri: "family://kids", resolves: "/family/kids" },
    ],
  },
  {
    scheme:      "os",
    label:       "OS Layer",
    description: "Operating system surfaces — settings, dashboard, library, command palette",
    icon:        "💻",
    baseRoute:   "/",
    public:      false,
    resolver:    (path, base) => {
      const clean = path.replace(/^\//, "").toLowerCase();
      const resolved = OS_PATHS[clean];
      if (resolved !== undefined) return base + resolved + (clean === "cmd" ? "?cmd=open" : "");
      return base + "/" + clean;
    },
    examples: [
      { uri: "os://dashboard", resolves: "/dashboard" },
      { uri: "os://settings", resolves: "/settings" },
      { uri: "os://library", resolves: "/output-library" },
      { uri: "os://cmd", resolves: "/?cmd=open" },
    ],
  },
  {
    scheme:      "hub",
    label:       "Industry Hubs",
    description: "Vertical industry AI hubs — healthcare, legal, staffing, and more",
    icon:        "🏭",
    baseRoute:   "/for/healthcare",
    public:      true,
    resolver:    (path, base) => {
      const slug = path.replace(/^\//, "").toLowerCase();
      return base + (HUB_SLUGS[slug] ?? `/for/${slug}`);
    },
    examples: [
      { uri: "hub://healthcare", resolves: "/for/healthcare" },
      { uri: "hub://legal", resolves: "/for/legal" },
      { uri: "hub://staffing", resolves: "/for/staffing" },
    ],
  },
  {
    scheme:      "user",
    label:       "User Identity",
    description: "User identity and profile surfaces",
    icon:        "👤",
    baseRoute:   "/settings",
    public:      false,
    resolver:    (path, base) => {
      const clean = path.replace(/^\//, "").toLowerCase();
      if (!clean || clean === "me") return base + "/settings";
      return base + "/u/" + clean;
    },
    examples: [
      { uri: "user://me", resolves: "/settings" },
      { uri: "user://sara", resolves: "/u/sara" },
    ],
  },
  {
    scheme:      "space",
    label:       "Shared Spaces",
    description: "Collaborative project and output spaces",
    icon:        "🗂️",
    baseRoute:   "/projects",
    public:      false,
    resolver:    (path, base) => {
      const clean = path.replace(/^\//, "").toLowerCase();
      const map: Record<string, string> = {
        "":          "/projects",
        projects:    "/projects",
        output:      "/output-library",
        library:     "/output-library",
        team:        "/team",
        data:        "/data",
        analytics:   "/analytics",
        billing:     "/billing",
      };
      return base + (map[clean] ?? "/" + clean);
    },
    examples: [
      { uri: "space://projects", resolves: "/projects" },
      { uri: "space://output", resolves: "/output-library" },
      { uri: "space://team", resolves: "/team" },
    ],
  },
  {
    scheme:      "invite",
    label:       "Invite & Broadcast",
    description: "Invite, discovery, and broadcast surfaces",
    icon:        "🤝",
    baseRoute:   "/join",
    public:      true,
    resolver:    (path, base) => {
      const clean = path.replace(/^\//, "").toLowerCase();
      const map: Record<string, string> = {
        "":          "/join",
        join:        "/join",
        broadcast:   "/broadcast",
        discover:    "/discover",
        share:       "/broadcast",
        subscribe:   "/api/opt-in/info",
      };
      return base + (map[clean] ?? "/" + clean);
    },
    examples: [
      { uri: "invite://join", resolves: "/join" },
      { uri: "invite://broadcast", resolves: "/broadcast" },
      { uri: "invite://discover", resolves: "/discover" },
    ],
  },
  {
    scheme:      "api",
    label:       "Internal API",
    description: "Direct CRL addressing of internal API endpoints",
    icon:        "⚡",
    baseRoute:   "/api",
    public:      true,
    resolver:    (path, base) => {
      const clean = path.replace(/^\//, "");
      return base + "/api/" + clean;
    },
    examples: [
      { uri: "api://discovery/surfaces", resolves: "/api/discovery/surfaces" },
      { uri: "api://opt-in", resolves: "/api/opt-in" },
      { uri: "api://platform/self-map", resolves: "/api/platform/self-map" },
    ],
  },
  {
    scheme:      "store",
    label:       "Semantic Store",
    description: "Product and service marketplace",
    icon:        "🛒",
    baseRoute:   "/semantic-store",
    public:      true,
    resolver:    (path, base) => {
      const clean = path.replace(/^\//, "");
      if (!clean || clean === "semantic") return base + "/semantic-store";
      return base + "/semantic-store/" + clean;
    },
    examples: [
      { uri: "store://", resolves: "/semantic-store" },
      { uri: "store://semantic", resolves: "/semantic-store" },
    ],
  },
  {
    scheme:      "agent",
    label:       "Platform Agents",
    description: "AI agents — UCPXAgent, Nova, Atlas, Aurora, Brain, Semantic",
    icon:        "🤖",
    baseRoute:   "/command-center",
    public:      false,
    resolver:    (path, base) => {
      const name = path.replace(/^\//, "").toLowerCase();
      return base + (AGENT_PATHS[name] ?? "/command-center");
    },
    examples: [
      { uri: "agent://ucpx", resolves: "/command-center" },
      { uri: "agent://nova", resolves: "/family-hub" },
      { uri: "agent://brain", resolves: "/above-transcend" },
    ],
  },
  {
    scheme:      "pulse",
    label:       "GlobalPulse",
    description: "Broadcast and event stream surfaces",
    icon:        "📡",
    baseRoute:   "/broadcast",
    public:      true,
    resolver:    (path, base) => {
      const clean = path.replace(/^\//, "").toLowerCase();
      const map: Record<string, string> = {
        "":        "/broadcast",
        stream:    "/api/global-pulse/stream",
        rss:       "/api/global-pulse/feed.xml",
        feed:      "/api/global-pulse/feed.xml",
        subscribe: "/api/opt-in",
        broadcast: "/broadcast",
      };
      return base + (map[clean] ?? "/" + clean);
    },
    examples: [
      { uri: "pulse://broadcast", resolves: "/broadcast" },
      { uri: "pulse://stream", resolves: "/api/global-pulse/stream" },
      { uri: "pulse://rss", resolves: "/api/global-pulse/feed.xml" },
    ],
  },
];

// ── Registry lookup helpers ───────────────────────────────────────────────────

export function getNamespace(scheme: string): CRLNamespace | undefined {
  return NAMESPACES.find(n => n.scheme === scheme);
}

export function getAllSchemes(): string[] {
  return NAMESPACES.map(n => n.scheme);
}

/** Register a new namespace at runtime (no restart required). */
export function registerNamespace(ns: CRLNamespace): void {
  const existing = NAMESPACES.findIndex(n => n.scheme === ns.scheme);
  if (existing >= 0) {
    NAMESPACES[existing] = ns;
  } else {
    NAMESPACES.push(ns);
  }
}

/** Resolve a full CRL URI to a real URL using the registry. */
export function resolveCRL(uri: string, baseOverride?: string): CRLRecord | null {
  const base = baseOverride ?? getCanonicalBaseUrl();

  // Parse: scheme://path
  const match = uri.match(/^([a-z][a-z0-9+\-.]*):\/\/(.*)$/i);
  if (!match) return null;

  const [, scheme, path] = match;
  const ns = getNamespace(scheme.toLowerCase());
  if (!ns) return null;

  const resolvedUrl = ns.resolver(path, base);

  return {
    uri,
    scheme,
    path,
    resolvedUrl,
    label:       ns.label,
    description: ns.description,
    icon:        ns.icon,
    public:      ns.public,
  };
}
