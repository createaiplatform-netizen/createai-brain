// Auto-generated app — Dev Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "devplanner",
  title: "Dev Planner",
  icon: "🗂️",
  color: "#7c3aed",
  description: "Software development planning, sprint design, technical roadmaps, and estimation.",
  engines: [
    {
      id: "SprintPlanEngine",
      name: "Sprint Planner",
      icon: "🏃",
      tagline: "Sprint architect",
      description: "Designs sprint structures with stories, tasks, capacity, and realistic commitments.",
      placeholder: "What is the team's velocity, sprint length, and this sprint's goal?",
      example: "e.g. 5-person team, 2-week sprint, goal is to launch the beta onboarding flow",
      color: "#7c3aed",
    },
    {
      id: "TechnicalRoadmapEngine",
      name: "Technical Roadmap",
      icon: "🗺️",
      tagline: "Roadmap architect",
      description: "Creates technical roadmaps with prioritized initiatives, dependencies, and resource requirements.",
      placeholder: "What are the technical initiatives and constraints for the next 6-12 months?",
      example: "e.g. We need to rebuild our legacy API, migrate to the cloud, and ship 3 major features — prioritize this",
      color: "#6d28d9",
    },
    {
      id: "EstimationEngine",
      name: "Estimation Guide",
      icon: "⏱️",
      tagline: "Estimation architect",
      description: "Designs estimation approaches and helps think through complexity, risk, and uncertainty.",
      placeholder: "What feature or project needs estimation and what is known vs unknown?",
      example: "e.g. Estimate rebuilding our search system from keyword to semantic — we have no ML experience",
      color: "#7c3aed",
    },
    {
      id: "MVP_DefinitionEngine",
      name: "MVP Definition",
      icon: "🎯",
      tagline: "MVP architect",
      description: "Defines MVP scope that validates core assumptions without overbuilding.",
      placeholder: "What product are you building and what do you need to learn first?",
      example: "e.g. A marketplace for skilled trades — we don't know if supply or demand is the harder side to acquire",
      color: "#6d28d9",
    },
    {
      id: "PostmortemEngine",
      name: "Engineering Post-mortem",
      icon: "🔄",
      tagline: "Learning architect",
      description: "Designs blameless post-mortems that extract learning and systemic improvement.",
      placeholder: "What incident or failure needs a post-mortem analysis?",
      example: "e.g. A database migration caused 4 hours of downtime for 10,000 users last Thursday",
      color: "#7c3aed",
    }
  ],
};

export function DevPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
