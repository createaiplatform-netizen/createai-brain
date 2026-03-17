// Auto-generated app — Utopia Builder
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "utopia",
  title: "Utopia Builder",
  icon: "🌈",
  color: "#16a34a",
  description: "Utopian society design — what makes it work, what it costs, and who it might exclude.",
  engines: [
    {
      id: "UtopiaFoundationEngine",
      name: "Utopia Foundations",
      icon: "🏛️",
      tagline: "Foundation architect",
      description: "Designs the philosophical and practical foundations of a functioning utopian society.",
      placeholder: "What values and principles is this utopia built on?",
      example: "e.g. A post-scarcity society founded on the principle that the only meaningful work is art and care",
      color: "#16a34a",
    },
    {
      id: "UtopiaEconomyEngine",
      name: "Utopian Economy",
      icon: "💰",
      tagline: "Economy architect",
      description: "Designs the economic system that makes utopian resource abundance possible and sustainable.",
      placeholder: "How does this society produce and distribute resources?",
      example: "e.g. A gift economy where all production is automated and contribution is voluntary and recognized socially",
      color: "#15803d",
    },
    {
      id: "UtopiaGovernanceEngine",
      name: "Utopian Governance",
      icon: "⚖️",
      tagline: "Governance architect",
      description: "Designs how decisions are made in a utopian society — without coercion but still effectively.",
      placeholder: "How are collective decisions made in this society?",
      example: "e.g. A society using AI-augmented deliberative democracy where every citizen can participate in any decision",
      color: "#16a34a",
    },
    {
      id: "UtopiaExclusionEngine",
      name: "Utopia's Shadow",
      icon: "🌑",
      tagline: "Critique architect",
      description: "Examines who this utopia might exclude, erase, or harm — the price of its perfection.",
      placeholder: "Describe the utopia and who it was designed for",
      example: "e.g. A peaceful society that achieved harmony by removing everyone who couldn't adapt to its social norms",
      color: "#15803d",
    },
    {
      id: "UtopiaThreatsEngine",
      name: "Utopia Under Threat",
      icon: "⚠️",
      tagline: "Conflict architect",
      description: "Designs the forces that threaten this utopia — from within and without.",
      placeholder: "What could destabilize or destroy this utopia?",
      example: "e.g. A utopia that discovers an asteroid on a collision course — how does a society with no conflict experience crisis?",
      color: "#16a34a",
    }
  ],
};

export function UtopiaBuilderApp() {
  return <GenericEngineApp config={CONFIG} />;
}
