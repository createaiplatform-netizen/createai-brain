// Auto-generated app — Lyrics Writer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "lyricswriter",
  title: "Lyrics Writer",
  icon: "🎵",
  color: "#7c3aed",
  description: "Song lyrics, rhyme schemes, verse/chorus structures, and lyrical storytelling.",
  engines: [
    {
      id: "ChorusEngine",
      name: "Chorus Designer",
      icon: "🎤",
      tagline: "Hook architect",
      description: "Writes memorable choruses with strong hooks, repetition, emotional climax, and singability.",
      placeholder: "What is the song's theme and emotional core?",
      example: "e.g. A pop chorus about the specific loneliness of being surrounded by people who don't know you",
      color: "#7c3aed",
    },
    {
      id: "VerseEngine",
      name: "Verse Writer",
      icon: "📝",
      tagline: "Narrative architect",
      description: "Writes verses that tell the story, establish character, and build to the chorus.",
      placeholder: "What story or scene should the verse portray?",
      example: "e.g. An R&B verse describing the exact moment you realize a relationship is already over",
      color: "#6d28d9",
    },
    {
      id: "RhymeSchemeEngine",
      name: "Rhyme Scheme Designer",
      icon: "🔤",
      tagline: "Sound architect",
      description: "Designs and executes specific rhyme schemes — perfect, slant, internal — for any lyrical section.",
      placeholder: "What lyrical content needs a rhyme scheme designed?",
      example: "e.g. I need ABAB perfect rhyme for a verse about leaving home for the first time",
      color: "#7c3aed",
    },
    {
      id: "BridgeEngine",
      name: "Bridge Builder",
      icon: "🌉",
      tagline: "Bridge architect",
      description: "Writes song bridges that provide emotional contrast and lyrical resolution before the final chorus.",
      placeholder: "What shift or revelation should the bridge provide?",
      example: "e.g. A bridge that shifts from anger to grief — realizing the anger was covering the sadness",
      color: "#6d28d9",
    },
    {
      id: "LyricalMetaphorEngine",
      name: "Lyrical Metaphor",
      icon: "🌊",
      tagline: "Metaphor architect",
      description: "Develops extended metaphors that can carry an entire song's emotional weight.",
      placeholder: "What emotion or experience needs a metaphorical vehicle for this song?",
      example: "e.g. Feeling trapped in a life that looks perfect from the outside — find me a metaphor",
      color: "#7c3aed",
    }
  ],
};

export function LyricsWriterApp() {
  return <GenericEngineApp config={CONFIG} />;
}
