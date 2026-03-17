// Auto-generated app — ComicScript Studio
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "comicscript",
  title: "ComicScript Studio",
  icon: "💥",
  color: "#7c3aed",
  description: "Comic book and graphic novel script writing — panel descriptions, caption boxes, and visual storytelling.",
  engines: [
    {
      id: "PanelDescriptionEngine",
      name: "Panel Describer",
      icon: "🖼️",
      tagline: "Visual page architect",
      description: "Writes detailed panel descriptions with camera angle, action, emotion, and staging.",
      placeholder: "Describe the page or scene",
      example: "e.g. Page 1 of a noir comic where a detective finds a body that looks exactly like herself",
      color: "#7c3aed",
    },
    {
      id: "CaptionBoxEngine",
      name: "Caption Writer",
      icon: "📦",
      tagline: "Narration craftsman",
      description: "Writes caption boxes — inner monologue, omniscient narration, or time stamps.",
      placeholder: "What moment needs captioning?",
      example: "e.g. A superhero watching a city burn that she couldn't save, in retrospect narration",
      color: "#6d28d9",
    },
    {
      id: "ComicDialogueEngine",
      name: "Balloon Dialogue",
      icon: "💬",
      tagline: "Speech bubble writer",
      description: "Writes comic dialogue optimized for speech bubbles — punchy, visual, character-distinct.",
      placeholder: "What scene needs dialogue?",
      example: "e.g. A villain and hero who are secretly friends having a fight in public they both hate",
      color: "#5b21b6",
    },
    {
      id: "ArcSummaryEngine",
      name: "Story Arc Designer",
      icon: "🌀",
      tagline: "Arc planner",
      description: "Designs multi-issue story arcs with cliffhangers, reveals, and thematic escalation.",
      placeholder: "What is your comic series concept?",
      example: "e.g. A team of antiheroes who each secretly believe the others are the villain",
      color: "#7c3aed",
    },
    {
      id: "ComicCharacterDesignEngine",
      name: "Character Design Brief",
      icon: "🦸",
      tagline: "Visual character brief",
      description: "Writes design briefs for comic characters — silhouette, costume symbolism, color psychology.",
      placeholder: "Who is the character and what do they represent?",
      example: "e.g. A villain who was the original hero before the system broke them",
      color: "#6d28d9",
    }
  ],
};

export function ComicScriptStudioApp() {
  return <GenericEngineApp config={CONFIG} />;
}
