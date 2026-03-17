// Auto-generated app — Game Narrative Studio
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "gamenarrative",
  title: "Game Narrative Studio",
  icon: "📖",
  color: "#6366f1",
  description: "Game story, lore writing, world canon, cutscene narrative, and environmental storytelling.",
  engines: [
    {
      id: "WorldCanonEngine",
      name: "World Canon Builder",
      icon: "📚",
      tagline: "Canon architect",
      description: "Builds consistent world canon — history, factions, rules, and the internal logic that prevents contradictions.",
      placeholder: "What is your game world and what canon conflicts exist?",
      example: "e.g. My game has three factions who fought 200 years ago — I need a history they all partially remember wrong",
      color: "#6366f1",
    },
    {
      id: "CutsceneNarrativeEngine",
      name: "Cutscene Writer",
      icon: "🎬",
      tagline: "Cutscene architect",
      description: "Writes cutscene scripts with direction notes, dialogue, and emotional beats.",
      placeholder: "What story moment does this cutscene cover and what should players feel?",
      example: "e.g. The moment the player character realizes the mentor has been manipulating them since the beginning",
      color: "#4f46e5",
    },
    {
      id: "EnvironmentalStoryEngine",
      name: "Environmental Storytelling",
      icon: "🏚️",
      tagline: "Space architect",
      description: "Designs environmental storytelling — what the space reveals without a single word of dialogue.",
      placeholder: "What happened in this location and what should players piece together from the environment?",
      example: "e.g. A house where a family clearly fled in a hurry — what details tell that story without any notes?",
      color: "#6366f1",
    },
    {
      id: "GameLogbookEngine",
      name: "Logbook & Codex Writer",
      icon: "📋",
      tagline: "Codex architect",
      description: "Writes in-world logbooks, journal entries, codex entries, and item descriptions with voice.",
      placeholder: "What type of document and whose perspective is it written from?",
      example: "e.g. A guard's logbook from the night something impossible happened in the castle treasury",
      color: "#4f46e5",
    },
    {
      id: "NarrativePacingEngine",
      name: "Narrative Pacing",
      icon: "⏱️",
      tagline: "Pacing architect",
      description: "Designs story pacing across gameplay — when to accelerate, breathe, reveal, and escalate.",
      placeholder: "What is the game's narrative arc and what is the current pacing issue?",
      example: "e.g. My game's midpoint feels slow — players have all the information but nothing has changed",
      color: "#6366f1",
    }
  ],
};

export function GameNarrativeStudioApp() {
  return <GenericEngineApp config={CONFIG} />;
}
