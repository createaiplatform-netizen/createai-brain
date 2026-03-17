// Auto-generated app — Future Civilization
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "futurecivilization",
  title: "Future Civilization",
  icon: "🔭",
  color: "#0f766e",
  description: "Far-future society design: post-scarcity, interstellar, post-human, and deep future.",
  engines: [
    {
      id: "PostScarcityEngine",
      name: "Post-Scarcity Society",
      icon: "♾️",
      tagline: "Abundance architect",
      description: "Designs post-scarcity civilizations — what happens to economy, identity, and meaning when resources are unlimited.",
      placeholder: "How did this civilization achieve post-scarcity and what replaced economic struggle?",
      example: "e.g. A society where molecular assemblers make any physical object for free — what do people do?",
      color: "#0f766e",
    },
    {
      id: "PostHumanEngine",
      name: "Post-Human Design",
      icon: "🤖",
      tagline: "Evolution architect",
      description: "Designs post-human civilizations where biological humanity has been transcended or altered.",
      placeholder: "What is the nature and degree of humanity's transformation?",
      example: "e.g. A civilization 3,000 years from now where 60% of minds are digital and 40% are biological",
      color: "#0d9488",
    },
    {
      id: "InterstellarCivilizationEngine",
      name: "Interstellar Civilization",
      icon: "⭐",
      tagline: "Galaxy architect",
      description: "Designs civilizations spanning multiple star systems — governance, communication lag, and cultural drift.",
      placeholder: "How many star systems does this civilization span and how long does travel take?",
      example: "e.g. A civilization spanning 40 light-years where messages take decades — what does governance look like?",
      color: "#0f766e",
    },
    {
      id: "FutureSocialStructureEngine",
      name: "Future Social Structure",
      icon: "🏙️",
      tagline: "Society architect",
      description: "Designs far-future social structures — family, identity, community, and meaning in transformed worlds.",
      placeholder: "What technologies and events shaped this future society's social fabric?",
      example: "e.g. A society where lifespan is 400 years — how does marriage, career, and family change?",
      color: "#0d9488",
    },
    {
      id: "CollapseRecoveryEngine",
      name: "Collapse & Recovery",
      icon: "🌱",
      tagline: "Resilience architect",
      description: "Designs civilizations that survived collapse and rebuilt — what they preserved and what they abandoned.",
      placeholder: "What kind of collapse did this civilization survive and how long did recovery take?",
      example: "e.g. A civilization 500 years after a pandemic that killed 80% — how do they remember and organize?",
      color: "#0f766e",
    }
  ],
};

export function FutureCivilizationApp() {
  return <GenericEngineApp config={CONFIG} />;
}
