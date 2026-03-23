/**
 * Invite Registry — Universal Invitation Engine
 * -----------------------------------------------
 * Add a new surface here and it instantly appears in every InviteCard,
 * InvitePanel, and the global floating trigger. No component changes needed.
 */

export interface InviteSurface {
  id:         string;
  title:      string;
  tagline:    string;   // one sentence shown beneath the title
  link:       string;   // absolute path or full URL
  joinLabel?: string;   // button text (default "Join")
  icon?:      string;   // emoji
  color?:     string;   // accent hex (default sage)
  hidden?:    boolean;  // exclude from panel/picker without deleting
}

export const SURFACES: InviteSurface[] = [
  {
    id:        "broadcast",
    title:     "Broadcast Network",
    tagline:   "Receive live emergency alerts the moment they fire.",
    link:      "/broadcast",
    joinLabel: "Join Broadcast",
    icon:      "📡",
    color:     "#9CAF88",
  },
  {
    id:        "platform",
    title:     "CreateAI Brain",
    tagline:   "The AI operating system for your entire business.",
    link:      "/",
    joinLabel: "Get Started",
    icon:      "🧠",
    color:     "#7a9068",
  },
  {
    id:        "family",
    title:     "Family Universe",
    tagline:   "A private, secure space for your family — built inside CreateAI Brain.",
    link:      "/family",
    joinLabel: "Enter Family Hub",
    icon:      "🏡",
    color:     "#5a7d8a",
  },
  {
    id:        "health",
    title:     "HealthOS",
    tagline:   "AI-powered healthcare management for your entire practice.",
    link:      "/apps/health",
    joinLabel: "Open HealthOS",
    icon:      "🏥",
    color:     "#4a90d9",
  },
  {
    id:        "legal",
    title:     "Legal Practice Manager",
    tagline:   "Manage cases, clients, and compliance with AI precision.",
    link:      "/apps/legal",
    joinLabel: "Open Legal PM",
    icon:      "⚖️",
    color:     "#7c5cbf",
  },
  {
    id:        "staffing",
    title:     "StaffingOS",
    tagline:   "Global staffing and workforce management, fully automated.",
    link:      "/apps/staffing",
    joinLabel: "Open StaffingOS",
    icon:      "🌍",
    color:     "#c97b2e",
  },
];

/** Look up a surface by id. Returns undefined if not found. */
export function getSurface(id: string): InviteSurface | undefined {
  return SURFACES.find(s => s.id === id && !s.hidden);
}

/** All visible surfaces. */
export function getVisibleSurfaces(): InviteSurface[] {
  return SURFACES.filter(s => !s.hidden);
}
