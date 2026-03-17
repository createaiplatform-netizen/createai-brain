// Auto-generated app — PoemForge
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "poemforge",
  title: "PoemForge",
  icon: "🌸",
  color: "#be185d",
  description: "Poetry creation and form exploration — sonnets to free verse, haiku to epic odes.",
  engines: [
    {
      id: "SonnetEngine",
      name: "Sonnet Forge",
      icon: "🌹",
      tagline: "Shakespearean craftsman",
      description: "Writes formal sonnets (Shakespearean and Petrarchan) with proper meter and volta.",
      placeholder: "What emotion or situation should the sonnet explore?",
      example: "e.g. The longing for someone you met once and never saw again but think about constantly",
      color: "#be185d",
    },
    {
      id: "FreeVerseEngine",
      name: "Free Verse Forge",
      icon: "🍃",
      tagline: "Open form poet",
      description: "Writes free verse poetry with rhythm, imagery, line breaks, and emotional architecture.",
      placeholder: "What should the poem be about?",
      example: "e.g. The feeling of watching your childhood home be demolished",
      color: "#9d174d",
    },
    {
      id: "HaikuEngine",
      name: "Haiku Master",
      icon: "🌊",
      tagline: "Minimalist poet",
      description: "Crafts haiku and tanka with proper syllabic structure and seasonal/natural imagery.",
      placeholder: "What moment, feeling, or image should the haiku capture?",
      example: "e.g. The silence after an argument where both people were right",
      color: "#be185d",
    },
    {
      id: "EpicPoetryEngine",
      name: "Epic Verse",
      icon: "⚡",
      tagline: "Epic tradition architect",
      description: "Writes epic and heroic poetry in the tradition of Homer, Milton, or Dante.",
      placeholder: "What heroic event or character should the epic poem chronicle?",
      example: "e.g. A leader who sacrificed their legacy to save a generation that never knew their name",
      color: "#9d174d",
    },
    {
      id: "LyricPoetryEngine",
      name: "Lyric Poet",
      icon: "🎵",
      tagline: "Emotional lyricist",
      description: "Writes lyric poetry — intimate, musical, first-person emotional expression.",
      placeholder: "What feeling or experience is the poem exploring?",
      example: "e.g. Grief that comes in waves years after the loss",
      color: "#be185d",
    },
    {
      id: "ConcretePoetryEngine",
      name: "Concrete Poet",
      icon: "🔷",
      tagline: "Visual form creator",
      description: "Designs concrete and shape poetry where the visual form mirrors the content.",
      placeholder: "What concept should shape this poem?",
      example: "e.g. A poem about erosion written in the shape of a crumbling cliff face",
      color: "#9d174d",
    }
  ],
};

export function PoemForgeApp() {
  return <GenericEngineApp config={CONFIG} />;
}
