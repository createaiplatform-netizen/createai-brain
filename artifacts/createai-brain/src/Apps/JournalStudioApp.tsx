// Auto-generated app — Journal Studio
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "journal",
  title: "Journal Studio",
  icon: "📔",
  color: "#be185d",
  description: "Guided journaling, self-reflection prompts, emotional processing, and life writing.",
  engines: [
    {
      id: "ReflectionPromptEngine",
      name: "Reflection Prompts",
      icon: "🪞",
      tagline: "Depth architect",
      description: "Generates deep, specific journaling prompts that move beyond surface to genuine insight.",
      placeholder: "What area of your life do you want to reflect on?",
      example: "e.g. A relationship that ended and I haven't fully processed it yet",
      color: "#be185d",
    },
    {
      id: "GratitudePracticeEngine",
      name: "Gratitude Practice Designer",
      icon: "🌟",
      tagline: "Gratitude architect",
      description: "Designs personalized gratitude practices that go beyond listing to genuine appreciation.",
      placeholder: "What is your current life context and what are you grateful for?",
      example: "e.g. A difficult period where things are genuinely hard but I want to find what's still good",
      color: "#9d174d",
    },
    {
      id: "EmotionProcessEngine",
      name: "Emotion Processing Guide",
      icon: "💙",
      tagline: "Emotion architect",
      description: "Guides structured emotional processing for difficult experiences — naming, understanding, integrating.",
      placeholder: "What emotion or experience needs processing?",
      example: "e.g. Anger at someone I love that feels disproportionate and I don't understand why",
      color: "#be185d",
    },
    {
      id: "LifeReviewEngine",
      name: "Life Review Journaling",
      icon: "🌅",
      tagline: "Story architect",
      description: "Guides a structured life review — chapters, themes, turning points, and the story you're telling yourself.",
      placeholder: "What period of your life should we review and understand?",
      example: "e.g. My twenties — I want to understand what shaped me and what I was trying to figure out",
      color: "#9d174d",
    },
    {
      id: "IntentionSettingEngine",
      name: "Intention Setting",
      icon: "🎯",
      tagline: "Direction architect",
      description: "Designs meaningful intentions — not resolutions — rooted in values and expressed as qualities.",
      placeholder: "What period are you setting intentions for and what matters to you right now?",
      example: "e.g. Starting a new year after one that was defined by loss and needing to find forward motion",
      color: "#be185d",
    }
  ],
};

export function JournalStudioApp() {
  return <GenericEngineApp config={CONFIG} />;
}
