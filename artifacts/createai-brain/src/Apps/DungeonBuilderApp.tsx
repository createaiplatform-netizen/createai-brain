// Auto-generated app — Dungeon Builder
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "dungeonbuilder",
  title: "Dungeon Builder",
  icon: "🏰",
  color: "#475569",
  description: "Dungeon and environment design, encounter building, traps, puzzles, and atmosphere.",
  engines: [
    {
      id: "DungeonLayoutEngine",
      name: "Dungeon Layout",
      icon: "🗺️",
      tagline: "Spatial architect",
      description: "Designs dungeon layouts with rooms, corridors, secret passages, and spatial storytelling.",
      placeholder: "What is the dungeon's theme, size, and purpose in your world?",
      example: "e.g. An ancient dwarven mine that collapsed 300 years ago and is now home to something that adapted to the darkness",
      color: "#475569",
    },
    {
      id: "EncounterDesignEngine",
      name: "Encounter Designer",
      icon: "⚔️",
      tagline: "Encounter architect",
      description: "Designs combat and non-combat encounters with meaningful decisions and multiple solutions.",
      placeholder: "What is the encounter context and what player options should exist?",
      example: "e.g. Players encounter the villain's lieutenant — a fight they can't win, must negotiate, or flee from creatively",
      color: "#334155",
    },
    {
      id: "TrapDesignEngine",
      name: "Trap Designer",
      icon: "🪤",
      tagline: "Trap architect",
      description: "Designs clever, fair traps with telegraphing signs, multiple solutions, and interesting consequences.",
      placeholder: "What type of dungeon and what role do traps play in the design?",
      example: "e.g. Traps in a tomb designed by a paranoid lich who wanted puzzles, not just killing intruders",
      color: "#475569",
    },
    {
      id: "DungeonAtmosphereEngine",
      name: "Dungeon Atmosphere",
      icon: "🕯️",
      tagline: "Atmosphere architect",
      description: "Designs dungeon atmosphere — description language, sensory details, and tone-setting elements.",
      placeholder: "What feeling should players have while exploring this dungeon?",
      example: "e.g. A dungeon that used to be a place of celebration — the horror is how the joy became twisted",
      color: "#334155",
    },
    {
      id: "PuzzleDesignEngine",
      name: "Puzzle Designer",
      icon: "🧩",
      tagline: "Puzzle architect",
      description: "Designs puzzles that are challenging, fair, and satisfying — with multiple solution paths.",
      placeholder: "What is the dungeon theme and what skill should the puzzle test?",
      example: "e.g. A puzzle in a wizard's tower that tests observation rather than knowledge of the rules",
      color: "#475569",
    }
  ],
};

export function DungeonBuilderApp() {
  return <GenericEngineApp config={CONFIG} />;
}
