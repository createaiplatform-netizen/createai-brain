// Auto-generated app — Storyboarder
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "storyboarder",
  title: "Storyboarder",
  icon: "🎞️",
  color: "#7c3aed",
  description: "Scene-by-scene visual story planning — shot lists, visual beats, and narrative pacing.",
  engines: [
    {
      id: "ShotListEngine",
      name: "Shot List Designer",
      icon: "📷",
      tagline: "Visual sequence architect",
      description: "Designs shot-by-shot lists with framing, movement, lens choice, and emotional intent.",
      placeholder: "Describe the scene you need a shot list for",
      example: "e.g. A chase sequence through a night market where the pursuer and pursued both think they're the hero",
      color: "#7c3aed",
    },
    {
      id: "VisualBeatEngine",
      name: "Visual Beat Sheet",
      icon: "🎬",
      tagline: "Pacing architect",
      description: "Maps the visual beats of a sequence — what the audience sees at each emotional moment.",
      placeholder: "What story sequence needs visual mapping?",
      example: "e.g. A 5-minute opening sequence that establishes a world after technological collapse",
      color: "#6d28d9",
    },
    {
      id: "ColorPaletteNarrativeEngine",
      name: "Color Narrative",
      icon: "🎨",
      tagline: "Visual tone architect",
      description: "Designs the color palette strategy for a film or video — how color shifts track the story.",
      placeholder: "What is the film's story and emotional arc?",
      example: "e.g. A film that begins in a grey world and slowly gains color as a comatose patient recovers",
      color: "#7c3aed",
    },
    {
      id: "MontageEngine",
      name: "Montage Designer",
      icon: "⚡",
      tagline: "Sequence architect",
      description: "Designs montage sequences with pacing, rhythm, and emotional payoff.",
      placeholder: "What should the montage convey and where is it in the story?",
      example: "e.g. A training montage that also shows the emotional cost of the sacrifice",
      color: "#6d28d9",
    },
    {
      id: "OpeningSequenceEngine",
      name: "Opening Sequence",
      icon: "🌅",
      tagline: "Opening architect",
      description: "Designs film or video opening sequences that establish world, tone, and stakes in 3–7 minutes.",
      placeholder: "What is the film about and what feeling should the opening create?",
      example: "e.g. A film about a society that has erased memory of war — the opening is the day a memory returns",
      color: "#7c3aed",
    }
  ],
};

export function StoryboarderApp() {
  return <GenericEngineApp config={CONFIG} />;
}
