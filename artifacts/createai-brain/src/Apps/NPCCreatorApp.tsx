// Auto-generated app — NPC Creator
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "npccreator",
  title: "NPC Creator",
  icon: "🎭",
  color: "#7c3aed",
  description: "Non-player character creation — personality, motivation, dialogue, and behavior design.",
  engines: [
    {
      id: "NPCPersonalityEngine",
      name: "NPC Personality",
      icon: "🧠",
      tagline: "Character architect",
      description: "Designs NPC personalities with traits, quirks, voice, and behavioral patterns.",
      placeholder: "What role does this NPC play in the world and story?",
      example: "e.g. A shopkeeper who has been in the same village for 50 years and has watched three wars pass through",
      color: "#7c3aed",
    },
    {
      id: "NPCDialogueEngine",
      name: "NPC Dialogue Tree",
      icon: "💬",
      tagline: "Dialogue architect",
      description: "Designs NPC dialogue trees with branching responses, player relationship states, and secret reveals.",
      placeholder: "Who is this NPC and what do they know or want from the player?",
      example: "e.g. A spy who is pretending to be a merchant and slowly reveals information as trust is built",
      color: "#6d28d9",
    },
    {
      id: "NPCMotivationEngine",
      name: "NPC Motivation",
      icon: "❤️",
      tagline: "Motivation architect",
      description: "Designs NPC motivations that create coherent behavior across all situations.",
      placeholder: "What is this NPC's backstory and what do they want?",
      example: "e.g. An NPC who helps the player but whose actual goal is to use them to get revenge on a third party",
      color: "#7c3aed",
    },
    {
      id: "NPC_AIBehaviorEngine",
      name: "NPC AI Behavior",
      icon: "🤖",
      tagline: "Behavior architect",
      description: "Designs NPC behavior states, schedules, and reactive systems for game AI.",
      placeholder: "What is this NPC's daily routine and how should they react to different player actions?",
      example: "e.g. A guard NPC with patrol routes, alert states, and personality that affects how quickly they escalate",
      color: "#6d28d9",
    },
    {
      id: "NPCRelationshipEngine",
      name: "NPC Relationship System",
      icon: "🔗",
      tagline: "Relationship architect",
      description: "Designs relationship systems between NPCs and players — trust, reputation, and faction alignment.",
      placeholder: "What relationship dynamics should matter in your game?",
      example: "e.g. A faction system where helping one group automatically creates enemies of another",
      color: "#7c3aed",
    }
  ],
};

export function NPCCreatorApp() {
  return <GenericEngineApp config={CONFIG} />;
}
