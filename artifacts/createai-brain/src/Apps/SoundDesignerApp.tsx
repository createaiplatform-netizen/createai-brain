// Auto-generated app — Sound Designer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "sounddesigner",
  title: "Sound Designer",
  icon: "🔊",
  color: "#0f766e",
  description: "Sound design, audio world building, foley, and sonic identity systems.",
  engines: [
    {
      id: "FoleyEngine",
      name: "Foley Designer",
      icon: "🎭",
      tagline: "Sound architect",
      description: "Designs foley sound descriptions and recording approaches for film and media.",
      placeholder: "What scene or sequence needs foley sound design?",
      example: "e.g. A tense scene in a hospital corridor where silence is louder than the sounds",
      color: "#0f766e",
    },
    {
      id: "SonicIdentityEngine",
      name: "Sonic Identity",
      icon: "🎵",
      tagline: "Brand sound architect",
      description: "Designs brand sonic identities — earcons, audio logos, and sound personality systems.",
      placeholder: "What brand needs a sonic identity and what are its values?",
      example: "e.g. A mental health platform that needs to sound calm, trustworthy, and not clinical",
      color: "#0d9488",
    },
    {
      id: "EnvironmentSoundEngine",
      name: "Sound Environment",
      icon: "🌿",
      tagline: "Environment architect",
      description: "Designs the complete audio environment of a scene or space — background, texture, and detail.",
      placeholder: "What environment needs a complete audio design?",
      example: "e.g. A floating city market at dusk, with merchants packing up and the hum of antigravity engines",
      color: "#0f766e",
    },
    {
      id: "SoundSymbolismEngine",
      name: "Sound Symbolism",
      icon: "🔤",
      tagline: "Sound-meaning architect",
      description: "Explores how sounds carry meaning — phonaesthesia, earworms, and emotional sound design.",
      placeholder: "What meaning or emotion should this sound design evoke?",
      example: "e.g. A villain's leitmotif that should feel threatening but also strangely beautiful",
      color: "#0d9488",
    },
    {
      id: "MusicForFilmEngine",
      name: "Music Supervision",
      icon: "🎬",
      tagline: "Music supervisor",
      description: "Designs music supervision approaches — scoring philosophy, song placement, and emotional pacing.",
      placeholder: "What film or scene needs music supervision guidance?",
      example: "e.g. A coming-of-age film set in 1994 that should use period music purposefully, not just nostalgically",
      color: "#0f766e",
    }
  ],
};

export function SoundDesignerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
