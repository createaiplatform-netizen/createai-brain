// Auto-generated app — Planet Builder
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "planetbuilder",
  title: "Planet Builder",
  icon: "🪐",
  color: "#0369a1",
  description: "Planetary creation: geology, climate, terrain, atmosphere, and ecological systems.",
  engines: [
    {
      id: "PlanetaryGeologyEngine",
      name: "Planetary Geology",
      icon: "🏔️",
      tagline: "Geology architect",
      description: "Designs planetary geology — tectonic plates, mountain ranges, volcanic activity, and soil composition.",
      placeholder: "What type of star does this planet orbit and what is its size relative to Earth?",
      example: "e.g. A planet with 1.4 Earth gravity orbiting a red dwarf, tidally locked with one side always facing the star",
      color: "#0369a1",
    },
    {
      id: "ClimateSystemEngine",
      name: "Climate System",
      icon: "🌪️",
      tagline: "Climate architect",
      description: "Designs planetary climate with weather patterns, seasonal cycles, and atmospheric chemistry.",
      placeholder: "Describe the planet's orbit, tilt, and geography",
      example: "e.g. A planet with three moons creating complex tidal patterns and seasonal flooding every 18 months",
      color: "#0284c7",
    },
    {
      id: "OceanSystemEngine",
      name: "Ocean System",
      icon: "🌊",
      tagline: "Ocean architect",
      description: "Designs ocean systems — depths, currents, chemistry, and the life that inhabits them.",
      placeholder: "How much of this planet's surface is water and what is its chemistry?",
      example: "e.g. An ocean world with no land, where civilization developed entirely underwater",
      color: "#0369a1",
    },
    {
      id: "BiosphereEngine",
      name: "Biosphere Designer",
      icon: "🌿",
      tagline: "Biosphere architect",
      description: "Designs planetary biosphere — food webs, dominant lifeforms, ecological niches, and evolutionary pressures.",
      placeholder: "What are the planetary conditions that shaped life here?",
      example: "e.g. A planet where photosynthesis never evolved and all life is chemosynthetic",
      color: "#0284c7",
    },
    {
      id: "PlanetNameEngine",
      name: "Planet Naming System",
      icon: "🏷️",
      tagline: "Nomenclature architect",
      description: "Designs naming systems for planets, moons, continents, and geographical features.",
      placeholder: "What civilization named this planet and what phonological rules do they follow?",
      example: "e.g. An insectoid species that names features after their six sensory organs",
      color: "#0369a1",
    }
  ],
};

export function PlanetBuilderApp() {
  return <GenericEngineApp config={CONFIG} />;
}
