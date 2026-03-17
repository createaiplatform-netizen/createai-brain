// Auto-generated app — Dimension Builder
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "dimensionbuilder",
  title: "Dimension Builder",
  icon: "🌀",
  color: "#6366f1",
  description: "Alternate dimensions, parallel worlds, pocket realities, and planes of existence.",
  engines: [
    {
      id: "PhysicsRulesEngine",
      name: "Physics Rules",
      icon: "⚛️",
      tagline: "Physics architect",
      description: "Designs how physics works differently in this dimension — gravity, time, causality, light.",
      placeholder: "What physical law is different in this dimension and why?",
      example: "e.g. A dimension where time moves backwards — entropy decreases and things grow less complex",
      color: "#6366f1",
    },
    {
      id: "DimensionAestheticEngine",
      name: "Dimension Aesthetic",
      icon: "🎨",
      tagline: "Sensory architect",
      description: "Designs how this dimension looks, sounds, feels, and registers on the senses.",
      placeholder: "What is the fundamental nature of this dimension?",
      example: "e.g. A dimension made entirely of memory — the landscape is assembled from things people have forgotten",
      color: "#4f46e5",
    },
    {
      id: "DimensionInhabitantsEngine",
      name: "Dimension Inhabitants",
      icon: "👻",
      tagline: "Inhabitants architect",
      description: "Designs the entities that live in this dimension and how they relate to physical-world beings.",
      placeholder: "What kind of beings evolved to live in this dimension?",
      example: "e.g. Beings made of pure mathematics who experience themselves as equations and humans as noise",
      color: "#6366f1",
    },
    {
      id: "DimensionAccessEngine",
      name: "Dimension Access Rules",
      icon: "🚪",
      tagline: "Access architect",
      description: "Designs the rules for entering, navigating, and leaving this dimension.",
      placeholder: "How do people or things enter this dimension?",
      example: "e.g. A dimension you can only enter at the moment between sleeping and waking",
      color: "#4f46e5",
    },
    {
      id: "DimensionConflictEngine",
      name: "Dimension Conflict",
      icon: "⚔️",
      tagline: "Conflict architect",
      description: "Designs conflicts between dimensions — border wars, dimensional bleed, and reality collapse.",
      placeholder: "What is the conflict between this dimension and the physical world?",
      example: "e.g. A dimension of perfect order bleeding into our chaotic world, eliminating randomness everywhere it touches",
      color: "#6366f1",
    }
  ],
};

export function DimensionBuilderApp() {
  return <GenericEngineApp config={CONFIG} />;
}
