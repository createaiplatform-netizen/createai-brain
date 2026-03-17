// Auto-generated app — Relationship Coach
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "relationshipcoach",
  title: "Relationship Coach",
  icon: "💑",
  color: "#be185d",
  description: "Relationship communication, conflict resolution, boundary setting, and connection building.",
  engines: [
    {
      id: "CommunicationStrategyEngine",
      name: "Communication Strategy",
      icon: "💬",
      tagline: "Communication architect",
      description: "Designs communication strategies for difficult conversations — what to say, when, and how.",
      placeholder: "What conversation do you need to have and what is the relationship?",
      example: "e.g. I need to tell my partner I'm not happy with how we've been dividing household work",
      color: "#be185d",
    },
    {
      id: "ConflictResolutionEngine",
      name: "Conflict Resolution",
      icon: "🕊️",
      tagline: "Peace architect",
      description: "Designs conflict resolution approaches with de-escalation, understanding, and agreement strategies.",
      placeholder: "What is the conflict and what do both parties want?",
      example: "e.g. My co-founder and I disagree on strategy and it's affecting our working relationship",
      color: "#9d174d",
    },
    {
      id: "BoundarySettingEngine",
      name: "Boundary Setting",
      icon: "🚧",
      tagline: "Boundary architect",
      description: "Helps design and articulate personal boundaries clearly — without guilt, aggression, or over-explanation.",
      placeholder: "What boundary do you need to set and with whom?",
      example: "e.g. My mother calls me multiple times a day and I need to establish limits without hurting her",
      color: "#be185d",
    },
    {
      id: "ConnectionRitualEngine",
      name: "Connection Ritual Designer",
      icon: "🔥",
      tagline: "Connection architect",
      description: "Designs rituals and practices that maintain and deepen connection in relationships.",
      placeholder: "What type of relationship and what is the current connection quality?",
      example: "e.g. A long-distance friendship that's drifting apart because we never have time to talk",
      color: "#9d174d",
    },
    {
      id: "ApologyEngine",
      name: "Genuine Apology",
      icon: "🙏",
      tagline: "Repair architect",
      description: "Helps craft genuine, complete apologies that take responsibility without deflection.",
      placeholder: "What happened, what is your role, and what do you want to repair?",
      example: "e.g. I broke a promise to a close friend and it damaged their trust in me",
      color: "#be185d",
    }
  ],
};

export function RelationshipCoachApp() {
  return <GenericEngineApp config={CONFIG} />;
}
