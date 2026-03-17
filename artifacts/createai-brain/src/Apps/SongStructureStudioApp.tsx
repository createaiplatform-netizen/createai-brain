// Auto-generated app — Song Structure Studio
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "songstructure",
  title: "Song Structure Studio",
  icon: "🎼",
  color: "#0891b2",
  description: "Song arrangement, composition structure, genre conventions, and musical architecture.",
  engines: [
    {
      id: "SongArrangementEngine",
      name: "Song Arrangement",
      icon: "🎸",
      tagline: "Arrangement architect",
      description: "Designs full song arrangements — intro, verse, pre-chorus, chorus, bridge, outro with timing.",
      placeholder: "What genre and emotional arc should this song have?",
      example: "e.g. An indie folk song that starts intimate and builds to an anthemic finale in 3.5 minutes",
      color: "#0891b2",
    },
    {
      id: "GenreConventionsEngine",
      name: "Genre Conventions",
      icon: "🎵",
      tagline: "Genre architect",
      description: "Maps the conventions, expectations, and signature elements of any music genre.",
      placeholder: "What genre are you composing in and what aspects do you need to understand?",
      example: "e.g. K-pop structure — what makes it distinctive and what do listeners expect?",
      color: "#0e7490",
    },
    {
      id: "HookCraftEngine",
      name: "Hook Crafter",
      icon: "🎣",
      tagline: "Hook architect",
      description: "Designs melodic and rhythmic hooks — the part that sticks in your head after one listen.",
      placeholder: "What is the song's title and emotional center?",
      example: "e.g. A song called 'Almost' about a relationship that was perfect except for the timing",
      color: "#0891b2",
    },
    {
      id: "LyricalThemeEngine",
      name: "Lyrical Theme Development",
      icon: "🌊",
      tagline: "Theme architect",
      description: "Develops a song's lyrical theme across all sections for consistency and emotional progression.",
      placeholder: "What is the song's central theme and emotional journey?",
      example: "e.g. A concept album track about climate grief — helplessness turning to stubborn hope",
      color: "#0e7490",
    },
    {
      id: "ProductionNotesEngine",
      name: "Production Notes",
      icon: "🎚️",
      tagline: "Production guide",
      description: "Writes production notes describing the sonic palette, instrumentation, and arrangement choices.",
      placeholder: "What emotional effect should the production create?",
      example: "e.g. Production notes for a hip-hop track about generational trauma that should feel like inherited memory",
      color: "#0891b2",
    }
  ],
};

export function SongStructureStudioApp() {
  return <GenericEngineApp config={CONFIG} />;
}
