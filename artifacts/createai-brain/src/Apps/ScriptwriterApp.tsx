// Auto-generated app — Scriptwriter
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "scriptwriter",
  title: "Scriptwriter",
  icon: "🎬",
  color: "#e11d48",
  description: "Professional screenplay and script writing studio — scenes, dialogue, structure, and pitch.",
  engines: [
    {
      id: "ScreenplayStructureEngine",
      name: "Screenplay Structure",
      icon: "📐",
      tagline: "Three-act architect",
      description: "Designs complete screenplay structure with act breaks, midpoint, and beat sheet.",
      placeholder: "What story do you want to structure?",
      example: "e.g. A detective who discovers the crime was committed by their future self",
      color: "#e11d48",
    },
    {
      id: "ScreenplayDialogueEngine",
      name: "Script Dialogue",
      icon: "💬",
      tagline: "Dialogue craftsman",
      description: "Writes character dialogue with subtext, rhythm, and voice distinction.",
      placeholder: "Describe the conversation scene",
      example: "e.g. Two spies who love each other meeting for the last time before one defects",
      color: "#be123c",
    },
    {
      id: "SceneHeaderEngine",
      name: "Scene Designer",
      icon: "🎥",
      tagline: "Scene architect",
      description: "Designs fully realized scenes with location, action, lighting, and emotional register.",
      placeholder: "What scene should I design?",
      example: "e.g. The moment a corrupt CEO realizes his own board has turned against him",
      color: "#9f1239",
    },
    {
      id: "PitchEngine",
      name: "Pitch Writer",
      icon: "📋",
      tagline: "Pitch craftsman",
      description: "Writes loglines, synopses, and treatment documents for pitching to producers.",
      placeholder: "What screenplay are you pitching?",
      example: "e.g. A sci-fi thriller about consciousness uploading that turns into a murder mystery",
      color: "#e11d48",
    },
    {
      id: "CharacterVoiceEngine",
      name: "Character Voice",
      icon: "🎭",
      tagline: "Voice differentiator",
      description: "Develops distinct character voices — speech patterns, vocabulary, cadence, and verbal tics.",
      placeholder: "Who is the character and what's their background?",
      example: "e.g. An aging jazz musician who raised her daughter alone and now meets her for the first time in 20 years",
      color: "#be123c",
    },
    {
      id: "ScriptNotesEngine",
      name: "Script Notes",
      icon: "📝",
      tagline: "Development analyst",
      description: "Provides professional script coverage and development notes: strengths, weaknesses, fixes.",
      placeholder: "Paste or describe your script for coverage",
      example: "e.g. My Act 2 feels flat — the protagonist doesn't change and the villain disappears for 30 pages",
      color: "#9f1239",
    }
  ],
};

export function ScriptwriterApp() {
  return <GenericEngineApp config={CONFIG} />;
}
