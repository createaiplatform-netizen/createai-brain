// Auto-generated app — Alien Species Forge
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "alienspecies",
  title: "Alien Species Forge",
  icon: "👾",
  color: "#7c3aed",
  description: "Xenobiology, alien civilizations, first contact protocols, and interstellar cultures.",
  engines: [
    {
      id: "XenobiologyEngine",
      name: "Xenobiology Designer",
      icon: "🧬",
      tagline: "Life system architect",
      description: "Designs alien biology — physiology, senses, reproduction, lifespan, and evolutionary history.",
      placeholder: "What kind of planet does this species come from and what ecological niche do they fill?",
      example: "e.g. A species from a gas giant that evolved in layers of ammonia cloud without ever touching solid ground",
      color: "#7c3aed",
    },
    {
      id: "AlienCivilizationEngine",
      name: "Alien Civilization",
      icon: "🏛️",
      tagline: "Culture architect",
      description: "Designs alien civilization structure — governance, religion, art, technology, and social hierarchy.",
      placeholder: "What are the biological and ecological foundations of this civilization?",
      example: "e.g. A hive-mind species that has never experienced individual consciousness or private thought",
      color: "#6d28d9",
    },
    {
      id: "FirstContactEngine",
      name: "First Contact Protocol",
      icon: "📡",
      tagline: "Contact architect",
      description: "Designs first contact scenarios, communication challenges, and diplomatic protocols.",
      placeholder: "Describe the two species making first contact and their communication abilities",
      example: "e.g. Humans meeting a species that communicates entirely through bioluminescence and smell",
      color: "#7c3aed",
    },
    {
      id: "AlienLanguageEngine",
      name: "Alien Language System",
      icon: "🔤",
      tagline: "Xenolinguist",
      description: "Designs alien communication systems — not just words, but the physics and biology of their language.",
      placeholder: "How does this species perceive and communicate? What senses do they use?",
      example: "e.g. A species that communicates through time — they talk in memories, not words",
      color: "#6d28d9",
    },
    {
      id: "AlienTechEngine",
      name: "Alien Technology",
      icon: "🛸",
      tagline: "Xenotech architect",
      description: "Designs alien technology that is genuinely alien — built on different physics, biology, and assumptions.",
      placeholder: "What principles does this civilization's technology operate on?",
      example: "e.g. A civilization that never discovered electricity but developed biotechnology to its ultimate limits",
      color: "#7c3aed",
    }
  ],
};

export function AlienSpeciesForgeApp() {
  return <GenericEngineApp config={CONFIG} />;
}
