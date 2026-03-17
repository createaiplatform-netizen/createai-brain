// Auto-generated app — Monster Forge
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "monsterforge",
  title: "Monster Forge",
  icon: "🐉",
  color: "#dc2626",
  description: "Monster and creature design — biology, behavior, ecology, lore, and narrative role.",
  engines: [
    {
      id: "MonsterBiologyEngine",
      name: "Monster Biology",
      icon: "🧬",
      tagline: "Biology architect",
      description: "Designs monster biology — anatomy, physiology, senses, diet, and evolutionary origin.",
      placeholder: "What kind of creature is this and what world do they come from?",
      example: "e.g. A predator that evolved in complete darkness, hunts by sensing bioelectric fields, and communicates by touch",
      color: "#dc2626",
    },
    {
      id: "MonsterLoreEngine",
      name: "Monster Lore",
      icon: "📜",
      tagline: "Mythology architect",
      description: "Creates the mythology, legends, and cultural significance of a monster in its world.",
      placeholder: "What kind of monster is this and what cultures encounter it?",
      example: "e.g. A sea creature that sailors have worshipped and feared for 3,000 years",
      color: "#b91c1c",
    },
    {
      id: "MonsterBehaviorEngine",
      name: "Monster Behavior",
      icon: "🧠",
      tagline: "Behavior architect",
      description: "Designs monster psychology and behavior — intelligence, social structure, territory, and threat response.",
      placeholder: "How intelligent is this creature and does it live alone or in groups?",
      example: "e.g. A pack hunter with near-human intelligence that sets traps and recognizes individual prey",
      color: "#dc2626",
    },
    {
      id: "MonsterEcologyEngine",
      name: "Monster Ecology",
      icon: "🌿",
      tagline: "Ecology architect",
      description: "Designs the ecological role of a monster — what it eats, what eats it, and how it shapes its environment.",
      placeholder: "What is this creature's role in its ecosystem?",
      example: "e.g. An apex predator that, when removed from a forest, causes overpopulation that destroys the trees",
      color: "#b91c1c",
    },
    {
      id: "MonsterNarrativeEngine",
      name: "Monster Narrative Role",
      icon: "🎭",
      tagline: "Story role architect",
      description: "Defines the narrative and symbolic role of a monster — what it represents thematically.",
      placeholder: "What should this monster mean in the story or world?",
      example: "e.g. A monster that only appears to people who have given up hope — does it feed on despair or respond to it?",
      color: "#dc2626",
    }
  ],
};

export function MonsterForgeApp() {
  return <GenericEngineApp config={CONFIG} />;
}
