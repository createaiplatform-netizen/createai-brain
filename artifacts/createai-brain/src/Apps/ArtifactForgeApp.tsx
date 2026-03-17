// Auto-generated app — Artifact Forge
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "artifactforge",
  title: "Artifact Forge",
  icon: "💎",
  color: "#d97706",
  description: "Magical artifacts, legendary items, cursed objects, and relics of power.",
  engines: [
    {
      id: "ArtifactOriginEngine",
      name: "Artifact Origin",
      icon: "📜",
      tagline: "Origin architect",
      description: "Designs the creation history, maker, and original purpose of a magical artifact.",
      placeholder: "What does this artifact do and who created it originally?",
      example: "e.g. A mirror that shows not your reflection but the moment of your death — who made it and why?",
      color: "#d97706",
    },
    {
      id: "ArtifactPowerEngine",
      name: "Artifact Powers",
      icon: "⚡",
      tagline: "Power architect",
      description: "Designs artifact abilities, limitations, costs, and conditions of use.",
      placeholder: "What kind of power does this artifact have and what are its rules?",
      example: "e.g. A sword that wins every battle but costs the wielder one memory per kill",
      color: "#b45309",
    },
    {
      id: "CurseEngine",
      name: "Curse Designer",
      icon: "😈",
      tagline: "Curse architect",
      description: "Designs curses — origin, mechanism, rules, conditions for lifting, and psychological effects.",
      placeholder: "What is the curse, who cast it, and what were the circumstances?",
      example: "e.g. A curse that makes the victim unable to lie but also unable to explain the truth they see",
      color: "#d97706",
    },
    {
      id: "ArtifactLoreEngine",
      name: "Artifact Lore",
      icon: "🗺️",
      tagline: "History architect",
      description: "Creates the artifact's history across time — who owned it, what happened, what was lost.",
      placeholder: "Describe the artifact and the world it exists in",
      example: "e.g. A crown that has been worn by 14 monarchs — 12 died violently and 2 disappeared",
      color: "#b45309",
    },
    {
      id: "ArtifactSentinceEngine",
      name: "Sentient Artifact",
      icon: "🤔",
      tagline: "Consciousness architect",
      description: "Designs artifacts with intelligence — personality, goals, values, and relationship with wielders.",
      placeholder: "What kind of consciousness does this artifact have and where did it come from?",
      example: "e.g. A sword that absorbed the soul of every warrior it killed and is now a council of 10,000 voices",
      color: "#d97706",
    }
  ],
};

export function ArtifactForgeApp() {
  return <GenericEngineApp config={CONFIG} />;
}
