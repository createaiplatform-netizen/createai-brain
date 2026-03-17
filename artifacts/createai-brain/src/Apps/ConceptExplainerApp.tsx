// Auto-generated app — Concept Explainer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "conceptexplainer",
  title: "Concept Explainer",
  icon: "💡",
  color: "#7c3aed",
  description: "Explain any concept clearly at any complexity level — from beginner to expert.",
  engines: [
    {
      id: "ELI5Engine",
      name: "ELI5 Explainer",
      icon: "👶",
      tagline: "Simplicity architect",
      description: "Explains complex concepts as if to a 5-year-old — no jargon, only concrete analogies.",
      placeholder: "What concept do you want explained simply?",
      example: "e.g. How inflation works and why it makes things cost more even if nothing changed",
      color: "#7c3aed",
    },
    {
      id: "AnalogiesEngine",
      name: "Analogy Generator",
      icon: "🔗",
      tagline: "Analogy architect",
      description: "Creates 5 different analogies for the same concept using different domains to find what clicks.",
      placeholder: "What concept needs an analogy to make it clear?",
      example: "e.g. How neural networks learn — finding analogies from cooking, sports, childhood, music, and nature",
      color: "#6d28d9",
    },
    {
      id: "ExpertExplainerEngine",
      name: "Expert-Level Explainer",
      icon: "🎓",
      tagline: "Depth architect",
      description: "Explains concepts with full technical depth, nuance, and edge cases for expert audiences.",
      placeholder: "What concept should I explain at full technical depth?",
      example: "e.g. How transformer attention mechanisms work, including multi-head attention and positional encoding",
      color: "#7c3aed",
    },
    {
      id: "ConceptMapEngine",
      name: "Concept Map Builder",
      icon: "🗺️",
      tagline: "Relationship architect",
      description: "Maps how a concept connects to related ideas, prerequisites, and consequences.",
      placeholder: "What concept should I map in its broader intellectual landscape?",
      example: "e.g. Map how evolutionary game theory connects to economics, psychology, and political science",
      color: "#6d28d9",
    },
    {
      id: "MisconceptionEngine",
      name: "Misconception Fixer",
      icon: "⚠️",
      tagline: "Clarity architect",
      description: "Identifies and corrects common misconceptions about a topic with accurate replacements.",
      placeholder: "What topic has common misconceptions that need addressing?",
      example: "e.g. What do people get wrong about how vaccines work and create immunity?",
      color: "#7c3aed",
    }
  ],
};

export function ConceptExplainerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
