// Auto-generated app — Art Critique Studio
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "artcritique",
  title: "Art Critique Studio",
  icon: "🖼️",
  color: "#be185d",
  description: "Art analysis, criticism frameworks, art history, and creative interpretation.",
  engines: [
    {
      id: "FormalAnalysisEngine",
      name: "Formal Analysis",
      icon: "🔍",
      tagline: "Visual architect",
      description: "Analyzes visual art through formal elements — line, shape, color, texture, space, and composition.",
      placeholder: "Describe the artwork you want to analyze formally",
      example: "e.g. Vermeer's Girl with a Pearl Earring — analyze the formal elements that create the painting's intimacy",
      color: "#be185d",
    },
    {
      id: "ContextualAnalysisEngine",
      name: "Contextual Analysis",
      icon: "📜",
      tagline: "Context architect",
      description: "Places artworks in historical, social, and cultural context to understand their meaning and reception.",
      placeholder: "What artwork needs contextual analysis?",
      example: "e.g. Picasso's Guernica — the political context, reception at the time, and evolving interpretation",
      color: "#9d174d",
    },
    {
      id: "ArtCriticismEngine",
      name: "Art Criticism Writer",
      icon: "✍️",
      tagline: "Critic architect",
      description: "Writes formal art criticism in the tradition of different critical schools — formalist, Marxist, feminist, psychoanalytic.",
      placeholder: "What artwork should I critique and from which critical perspective?",
      example: "e.g. Jeff Koons' Balloon Dog through a Marxist critical lens",
      color: "#be185d",
    },
    {
      id: "ArtHistoryEngine",
      name: "Art History Navigator",
      icon: "📚",
      tagline: "History architect",
      description: "Traces the history and development of art movements — their context, key works, and influence.",
      placeholder: "What art movement or period should I explore historically?",
      example: "e.g. Abstract Expressionism — its emergence, key figures, and why it was the first distinctly American art movement",
      color: "#9d174d",
    },
    {
      id: "ExhibitionTextEngine",
      name: "Exhibition Text Writer",
      icon: "🏛️",
      tagline: "Wall text architect",
      description: "Writes exhibition texts — wall labels, catalog essays, and exhibition introductions — for any artwork.",
      placeholder: "What artwork or exhibition needs wall text written?",
      example: "e.g. An exhibition of 12 photographs documenting industrial abandonment across the American Midwest",
      color: "#be185d",
    }
  ],
};

export function ArtCritiqueStudioApp() {
  return <GenericEngineApp config={CONFIG} />;
}
