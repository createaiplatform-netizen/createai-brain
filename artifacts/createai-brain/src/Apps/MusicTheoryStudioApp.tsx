// Auto-generated app — Music Theory Studio
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "musictheory",
  title: "Music Theory Studio",
  icon: "🎶",
  color: "#4f46e5",
  description: "Music theory exploration, harmony, counterpoint, composition principles, and ear training.",
  engines: [
    {
      id: "HarmonyEngine",
      name: "Harmony Explainer",
      icon: "🎹",
      tagline: "Harmony architect",
      description: "Explains harmonic concepts — chord progressions, voice leading, tensions, and resolutions.",
      placeholder: "What harmonic concept do you want to understand or apply?",
      example: "e.g. Why the IV-V-I progression feels satisfying and how to make it feel less predictable",
      color: "#4f46e5",
    },
    {
      id: "ModeEngine",
      name: "Modes & Scales",
      icon: "🎵",
      tagline: "Scale architect",
      description: "Explains the emotional character, use, and composition applications of modes and exotic scales.",
      placeholder: "What mode, scale, or tonal system do you want to explore?",
      example: "e.g. The Dorian mode — what makes it feel different from minor and when should I use it?",
      color: "#3730a3",
    },
    {
      id: "CounterpointEngine",
      name: "Counterpoint",
      icon: "🎼",
      tagline: "Counterpoint architect",
      description: "Explains and applies counterpoint principles — voice independence, species counterpoint, and fugue.",
      placeholder: "What aspect of counterpoint do you want to understand or practice?",
      example: "e.g. First species counterpoint — the rules and the musical reasoning behind each rule",
      color: "#4f46e5",
    },
    {
      id: "RhythmEngine",
      name: "Rhythm & Meter",
      icon: "🥁",
      tagline: "Rhythm architect",
      description: "Explores rhythm, meter, polyrhythm, and syncopation — how rhythm creates feel and energy.",
      placeholder: "What rhythmic concept do you want to understand or apply?",
      example: "e.g. How do jazz and Afrobeat use polyrhythm differently?",
      color: "#3730a3",
    },
    {
      id: "FormAnalysisEngine",
      name: "Musical Form Analysis",
      icon: "🏛️",
      tagline: "Form architect",
      description: "Analyzes musical forms — sonata, rondo, theme and variations, 12-bar blues — and their logic.",
      placeholder: "What musical form do you want to understand or apply in composition?",
      example: "e.g. Sonata form — what are all the sections and what is each one's structural purpose?",
      color: "#4f46e5",
    }
  ],
};

export function MusicTheoryStudioApp() {
  return <GenericEngineApp config={CONFIG} />;
}
