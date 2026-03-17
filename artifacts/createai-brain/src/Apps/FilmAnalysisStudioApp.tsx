// Auto-generated app — Film Analysis Studio
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "filmanalysis",
  title: "Film Analysis Studio",
  icon: "🎬",
  color: "#1d4ed8",
  description: "Film theory, screenplay analysis, cinematography, and cinema criticism.",
  engines: [
    {
      id: "FilmAnalysisEngine",
      name: "Film Analyzer",
      icon: "🎥",
      tagline: "Film architect",
      description: "Analyzes films through multiple frameworks — narrative, visual, thematic, and cultural.",
      placeholder: "What film do you want to analyze and what aspects interest you?",
      example: "e.g. Analyze Parasite's visual symbolism and how the vertical space (above/below ground) carries the class theme",
      color: "#1d4ed8",
    },
    {
      id: "ScreenplayAnalysisEngine",
      name: "Screenplay Analyzer",
      icon: "📝",
      tagline: "Script analyst",
      description: "Analyzes screenplays for structure, character, theme, and technique — professional coverage style.",
      placeholder: "What screenplay or script concept needs analysis?",
      example: "e.g. Analyze the structure of The Shawshank Redemption screenplay — what makes the pacing feel inevitable?",
      color: "#1e40af",
    },
    {
      id: "CinematographyEngine",
      name: "Cinematography Analyzer",
      icon: "📷",
      tagline: "Visual architect",
      description: "Analyzes cinematographic choices — framing, movement, lens, lighting — and their storytelling effect.",
      placeholder: "What film or sequence needs cinematography analysis?",
      example: "e.g. How Kubrick uses wide-angle lenses and symmetry in The Shining to create psychological unease",
      color: "#1d4ed8",
    },
    {
      id: "DirectorStyleEngine",
      name: "Director Style Analyzer",
      icon: "🎬",
      tagline: "Auteur architect",
      description: "Analyzes a director's distinctive visual and narrative style across their body of work.",
      placeholder: "Which director's style do you want to analyze?",
      example: "e.g. What makes a Wes Anderson film visually and narratively distinctive across his entire filmography?",
      color: "#1e40af",
    },
    {
      id: "FilmTheoryEngine",
      name: "Film Theory Explorer",
      icon: "📚",
      tagline: "Theory architect",
      description: "Applies film theory frameworks — psychoanalysis, feminism, auteur, structuralism — to specific films.",
      placeholder: "What film and which theoretical framework should I apply?",
      example: "e.g. Apply the male gaze theory to Blade Runner 2049 — is it complicit or critical?",
      color: "#1d4ed8",
    }
  ],
};

export function FilmAnalysisStudioApp() {
  return <GenericEngineApp config={CONFIG} />;
}
