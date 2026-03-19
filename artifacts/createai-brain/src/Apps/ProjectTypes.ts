// Canonical project type used across UltimateRenderEngineApp and all players

export type ProjectType =
  | "Film"
  | "Documentary"
  | "Game"
  | "App"
  | "WebApp"
  | "Book"
  | "Course"
  | "Pitch"
  | "Music"
  | "Podcast"
  | "PhysicalProduct"
  | "Business"
  | "Startup"
  | "General";

/** Maps the `industry` string stored on a project to the canonical ProjectType. */
export function industryToProjectType(industry: string | null | undefined): ProjectType {
  const map: Record<string, ProjectType> = {
    "Film / Movie":    "Film",
    "Documentary":     "Documentary",
    "Video Game":      "Game",
    "Mobile App":      "App",
    "Web App / SaaS":  "WebApp",
    "Book / Novel":    "Book",
    "Online Course":   "Course",
    "Business":        "Pitch",
    "Startup":         "Pitch",
    "Physical Product":"PhysicalProduct",
    "Music / Album":   "Music",
    "Podcast":         "Podcast",
  };
  return map[industry ?? ""] ?? "General";
}

export const FILM_TYPES: ProjectType[] = ["Film", "Documentary"];
