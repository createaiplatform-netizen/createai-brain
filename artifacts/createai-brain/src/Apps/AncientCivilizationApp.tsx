// Auto-generated app — Ancient Civilization
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "ancientcivilization",
  title: "Ancient Civilization",
  icon: "🏛️",
  color: "#b45309",
  description: "Historical and fantasy ancient civilization design — rise, peak, and fall.",
  engines: [
    {
      id: "CivilizationRiseEngine",
      name: "Civilization Rise",
      icon: "🌅",
      tagline: "Origin architect",
      description: "Designs the geographic, ecological, and cultural conditions that gave rise to this civilization.",
      placeholder: "Where did this civilization emerge and what advantages did the location provide?",
      example: "e.g. A civilization that emerged in a river delta at the meeting point of three distinct ecosystems",
      color: "#b45309",
    },
    {
      id: "AncientEconomyEngine",
      name: "Ancient Economy",
      icon: "💰",
      tagline: "Economy architect",
      description: "Designs the economic foundation — what this civilization produced, traded, and valued.",
      placeholder: "What resources, technologies, and trade networks did this civilization control?",
      example: "e.g. An ancient civilization whose entire economy was based on controlling the only inland sea crossing",
      color: "#92400e",
    },
    {
      id: "AncientTechnologyEngine",
      name: "Ancient Technology",
      icon: "⚙️",
      tagline: "Technology architect",
      description: "Designs the technological achievements of this civilization and how they achieved them.",
      placeholder: "What technological achievements define this civilization?",
      example: "e.g. An ancient civilization that mastered hydraulics but never discovered the wheel",
      color: "#b45309",
    },
    {
      id: "CivilizationDeclineEngine",
      name: "Civilization Fall",
      icon: "🌅",
      tagline: "Collapse architect",
      description: "Designs the decline and fall of an ancient civilization — internal, external, and environmental causes.",
      placeholder: "What was this civilization at its peak and what began its decline?",
      example: "e.g. A civilization that collapsed because its religion required destroying one city's infrastructure every generation",
      color: "#92400e",
    },
    {
      id: "AncientLegacyEngine",
      name: "Ancient Legacy",
      icon: "🗿",
      tagline: "Legacy architect",
      description: "Designs what this civilization left behind — ruins, myths, knowledge, and influence on successors.",
      placeholder: "What did this civilization achieve and how is it remembered?",
      example: "e.g. A civilization that vanished completely but whose mathematical system is the foundation of all later cultures",
      color: "#b45309",
    }
  ],
};

export function AncientCivilizationApp() {
  return <GenericEngineApp config={CONFIG} />;
}
