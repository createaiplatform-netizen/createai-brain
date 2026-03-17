// Auto-generated app — Health Coach
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "healthcoach",
  title: "Health Coach",
  icon: "🏥",
  color: "#16a34a",
  description: "Health planning, wellness strategies, lifestyle design, and preventive health guidance.",
  engines: [
    {
      id: "WellnessPlanEngine",
      name: "Wellness Plan Designer",
      icon: "🌱",
      tagline: "Wellness architect",
      description: "Designs comprehensive wellness plans covering sleep, movement, nutrition, stress, and social health.",
      placeholder: "What are your current health challenges and goals?",
      example: "e.g. 40 years old, high stress job, poor sleep, want to build sustainable health habits without overhauling my life",
      color: "#16a34a",
    },
    {
      id: "LifestyleAuditEngine",
      name: "Lifestyle Audit",
      icon: "🔍",
      tagline: "Audit architect",
      description: "Audits lifestyle habits across sleep, activity, nutrition, stress, and relationships for health impact.",
      placeholder: "Describe a typical week in your life and what feels most off-balance",
      example: "e.g. I sleep 5-6 hours, eat lunch at my desk, skip exercise most weeks, and feel vaguely anxious constantly",
      color: "#15803d",
    },
    {
      id: "ChronicManagementEngine",
      name: "Chronic Condition Guide",
      icon: "🩺",
      tagline: "Management architect",
      description: "Designs lifestyle and self-management strategies for chronic health conditions.",
      placeholder: "What chronic condition are you managing and what are the main challenges?",
      example: "e.g. Type 2 diabetes diagnosed 2 years ago — I manage it but struggle with dietary consistency",
      color: "#16a34a",
    },
    {
      id: "PreventiveHealthEngine",
      name: "Preventive Health Plan",
      icon: "🛡️",
      tagline: "Prevention architect",
      description: "Designs preventive health strategies based on age, family history, and risk factors.",
      placeholder: "What age are you, what is your family health history, and what risk factors concern you?",
      example: "e.g. 45 years old, father had heart disease at 55, desk job, occasional smoker in my 20s",
      color: "#15803d",
    },
    {
      id: "EnergyManagementEngine",
      name: "Energy Management",
      icon: "⚡",
      tagline: "Energy architect",
      description: "Designs energy management systems — when to push, when to recover, and how to sustain high performance.",
      placeholder: "What does your energy pattern look like across the day and week?",
      example: "e.g. I'm high energy until 2pm then crash, can't work after dinner, and am always depleted by Thursday",
      color: "#16a34a",
    }
  ],
};

export function HealthCoachApp() {
  return <GenericEngineApp config={CONFIG} />;
}
