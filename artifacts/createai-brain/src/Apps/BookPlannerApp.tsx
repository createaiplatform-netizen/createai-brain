// Auto-generated app — Book Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "bookplanner",
  title: "Book Planner",
  icon: "📚",
  color: "#6366f1",
  description: "Novel structure, chapter outlines, character development, and writing roadmaps.",
  engines: [
    {
      id: "NovelStructureEngine",
      name: "Novel Structure",
      icon: "📐",
      tagline: "Story architect",
      description: "Designs complete novel structure — three/five acts, chapters, word count targets, and arc beats.",
      placeholder: "What is your novel concept, genre, and approximate length?",
      example: "e.g. A literary thriller about a biographer who realizes the subject faked their death 30 years ago",
      color: "#6366f1",
    },
    {
      id: "ChapterOutlineEngine",
      name: "Chapter Outliner",
      icon: "📋",
      tagline: "Chapter architect",
      description: "Writes detailed chapter-by-chapter outlines with scene, purpose, and character movement.",
      placeholder: "What is your novel's premise and main plot line?",
      example: "e.g. A family saga spanning 4 generations where each chapter is told by a different family member",
      color: "#4f46e5",
    },
    {
      id: "WorldBuildingBriefEngine",
      name: "World Brief",
      icon: "🌍",
      tagline: "World brief writer",
      description: "Creates a comprehensive world-building brief for your novel's setting and rules.",
      placeholder: "What genre and world is your novel set in?",
      example: "e.g. A historical fantasy set in 1890s Mumbai where technology runs on spoken stories",
      color: "#6366f1",
    },
    {
      id: "WritingRoadmapEngine",
      name: "Writing Roadmap",
      icon: "🗺️",
      tagline: "Project planner",
      description: "Creates a realistic writing schedule with milestones, daily word targets, and accountability checkpoints.",
      placeholder: "What is your novel word count goal and available writing time per day?",
      example: "e.g. I have 90 minutes a day and want to finish an 80,000-word novel in 8 months",
      color: "#4f46e5",
    },
    {
      id: "QueryLetterEngine",
      name: "Query Letter",
      icon: "📮",
      tagline: "Agent query writer",
      description: "Writes compelling query letters for literary agents — hook, synopsis, bio, and why this agent.",
      placeholder: "Describe your novel's premise, protagonist, and conflict",
      example: "e.g. My novel is a 90,000-word psychological thriller about an art restorer who discovers forged memories",
      color: "#6366f1",
    }
  ],
};

export function BookPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
