// Auto-generated app — Cultural Explorer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "culturalexplorer",
  title: "Cultural Explorer",
  icon: "🌍",
  color: "#0f766e",
  description: "Cultural analysis, anthropology, cross-cultural comparison, and cultural intelligence.",
  engines: [
    {
      id: "CultureDeepDiveEngine",
      name: "Culture Deep Dive",
      icon: "🔍",
      tagline: "Culture architect",
      description: "Deep-dives into a culture — its values, communication styles, relationship to time, hierarchy, and identity.",
      placeholder: "What culture do you want to understand deeply?",
      example: "e.g. Japanese culture — specifically the concepts that don't translate and shape how people interact",
      color: "#0f766e",
    },
    {
      id: "CrossCulturalEngine",
      name: "Cross-Cultural Comparison",
      icon: "⚖️",
      tagline: "Comparison architect",
      description: "Compares two cultures across key dimensions — communication, conflict, family, and work.",
      placeholder: "What two cultures are you comparing and what dimensions matter?",
      example: "e.g. American and German work culture — where the differences cause the most friction in international teams",
      color: "#0d9488",
    },
    {
      id: "CulturalIntelligenceEngine",
      name: "Cultural Intelligence Coach",
      icon: "🤝",
      tagline: "Intelligence architect",
      description: "Develops cultural intelligence for working across cultures — adaptive strategies and awareness.",
      placeholder: "What cultural context are you navigating and what is the challenge?",
      example: "e.g. Leading a team across 5 countries with very different relationships to authority and direct feedback",
      color: "#0f766e",
    },
    {
      id: "AnthropologyEngine",
      name: "Anthropology Lens",
      icon: "🦴",
      tagline: "Anthropology architect",
      description: "Applies anthropological frameworks to understanding human behavior, ritual, and social structure.",
      placeholder: "What human practice or social behavior needs anthropological analysis?",
      example: "e.g. Why do office meetings have the ritual structure they do — what anthropological function does the format serve?",
      color: "#0d9488",
    },
    {
      id: "CulturalNarrativeEngine",
      name: "Cultural Narrative",
      icon: "📖",
      tagline: "Story architect",
      description: "Explores the stories a culture tells itself — its myths, heroes, villains, and founding narratives.",
      placeholder: "What culture's narrative or mythology do you want to explore?",
      example: "e.g. The founding mythology of the United States and how it shapes contemporary political identity",
      color: "#0f766e",
    }
  ],
};

export function CulturalExplorerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
