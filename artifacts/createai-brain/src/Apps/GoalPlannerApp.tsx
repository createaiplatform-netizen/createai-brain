// Auto-generated app — Goal Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "goalplanner",
  title: "Goal Planner",
  icon: "🎯",
  color: "#d97706",
  description: "SMART goals, OKRs, milestone planning, accountability systems, and progress tracking.",
  engines: [
    {
      id: "GoalClarificationEngine",
      name: "Goal Clarifier",
      icon: "🔍",
      tagline: "Clarity architect",
      description: "Transforms vague wishes into specific, measurable, time-bound goals with clear success criteria.",
      placeholder: "What do you want to achieve and why does it matter to you?",
      example: "e.g. I want to get healthier but I don't know what that means or how to measure it",
      color: "#d97706",
    },
    {
      id: "MilestoneBreakdownEngine",
      name: "Milestone Breakdown",
      icon: "📋",
      tagline: "Path architect",
      description: "Breaks big goals into concrete milestones with deadlines, dependencies, and early wins.",
      placeholder: "What is your goal and what is your timeline?",
      example: "e.g. Write and publish my first book within 18 months while working full time",
      color: "#b45309",
    },
    {
      id: "ObstacleAnticipationEngine",
      name: "Obstacle Anticipator",
      icon: "🚧",
      tagline: "Resilience architect",
      description: "Identifies likely obstacles and designs specific pre-committed responses before they occur.",
      placeholder: "What is your goal and what has gotten in the way of similar goals before?",
      example: "e.g. I want to exercise 4x a week but always stop when work gets busy",
      color: "#d97706",
    },
    {
      id: "AccountabilitySystemEngine",
      name: "Accountability System",
      icon: "📊",
      tagline: "System architect",
      description: "Designs a personalized accountability system — check-ins, metrics, consequences, and support.",
      placeholder: "What goal do you need accountability for and what kind of accountability works for you?",
      example: "e.g. I'm saving $30K for a house in 2 years but I need external structure or I spend the money",
      color: "#b45309",
    },
    {
      id: "ReviewReflectEngine",
      name: "Goal Review System",
      icon: "🔄",
      tagline: "Review architect",
      description: "Designs weekly and monthly goal review rituals that maintain momentum without overwhelm.",
      placeholder: "What goals are you tracking and how much time can you spend on weekly review?",
      example: "e.g. 5 active goals across health, career, finance, and relationships — 30 minutes per week max",
      color: "#d97706",
    }
  ],
};

export function GoalPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
