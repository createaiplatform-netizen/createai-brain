// Auto-generated app — Podcast Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "podcastplanner",
  title: "Podcast Planner",
  icon: "🎙️",
  color: "#d97706",
  description: "Podcast episodes, show notes, interview guides, and content strategy.",
  engines: [
    {
      id: "EpisodeOutlineEngine",
      name: "Episode Outline",
      icon: "📋",
      tagline: "Episode architect",
      description: "Designs episode outlines with intro hook, segment structure, key points, and outro call to action.",
      placeholder: "What is the episode topic and who is the target listener?",
      example: "e.g. An episode on why creators burn out and what the psychology behind it actually is",
      color: "#d97706",
    },
    {
      id: "ShowNotesEngine",
      name: "Show Notes Writer",
      icon: "📝",
      tagline: "Notes architect",
      description: "Writes compelling show notes with summary, timestamps, key takeaways, and resource links.",
      placeholder: "Summarize the episode content for me to write the show notes",
      example: "e.g. Episode where we discussed why most productivity advice fails and 3 evidence-based alternatives",
      color: "#b45309",
    },
    {
      id: "InterviewGuideEngine",
      name: "Interview Guide",
      icon: "❓",
      tagline: "Conversation architect",
      description: "Designs interview question guides — opening, deepening, provocative, and closing questions.",
      placeholder: "Who is the guest and what is the interview focus?",
      example: "e.g. Interviewing an ER doctor about what the pandemic permanently changed in their worldview",
      color: "#d97706",
    },
    {
      id: "PodcastSeriesEngine",
      name: "Series Planner",
      icon: "📚",
      tagline: "Series architect",
      description: "Plans multi-episode series with themes, episode order, and narrative arc.",
      placeholder: "What is the series topic and how many episodes?",
      example: "e.g. A 6-episode series on the science of friendship — from formation to maintenance to loss",
      color: "#b45309",
    },
    {
      id: "PodcastGrowthEngine",
      name: "Podcast Growth Strategy",
      icon: "📈",
      tagline: "Growth architect",
      description: "Designs podcast growth strategies — audience building, distribution, monetization, and partnerships.",
      placeholder: "What is your podcast, current audience size, and growth goal?",
      example: "e.g. A 50-episode business podcast with 800 listeners looking to reach 5,000 in 12 months",
      color: "#d97706",
    }
  ],
};

export function PodcastPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
