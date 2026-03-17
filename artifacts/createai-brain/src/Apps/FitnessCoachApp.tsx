// Auto-generated app — Fitness Coach
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "fitnesscoach",
  title: "Fitness Coach",
  icon: "💪",
  color: "#16a34a",
  description: "Workout plans, training programs, sports performance, and movement coaching.",
  engines: [
    {
      id: "WorkoutPlanEngine",
      name: "Workout Plan Designer",
      icon: "🏋️",
      tagline: "Training architect",
      description: "Designs personalized workout programs with exercises, sets, reps, progression, and rest protocols.",
      placeholder: "What are your fitness goals, experience level, and available equipment?",
      example: "e.g. I want to build muscle and lose fat, train 4x per week, have access to a full gym",
      color: "#16a34a",
    },
    {
      id: "MovementAssessmentEngine",
      name: "Movement Assessment",
      icon: "🔍",
      tagline: "Movement architect",
      description: "Assesses movement patterns and designs corrective exercise protocols for common dysfunctions.",
      placeholder: "What movement limitations, pain, or imbalances are you experiencing?",
      example: "e.g. My lower back hurts when squatting and I have a desk job — what's likely causing this?",
      color: "#15803d",
    },
    {
      id: "SportsPerformanceEngine",
      name: "Sports Performance",
      icon: "⚡",
      tagline: "Performance architect",
      description: "Designs sport-specific training to improve performance in your chosen sport.",
      placeholder: "What sport are you training for and what are your performance goals?",
      example: "e.g. Competitive tennis — I need to improve my first-step speed and staying power in long matches",
      color: "#16a34a",
    },
    {
      id: "RecoveryProtocolEngine",
      name: "Recovery Protocol",
      icon: "🌙",
      tagline: "Recovery architect",
      description: "Designs recovery protocols — sleep, nutrition timing, active recovery, and load management.",
      placeholder: "What is your training intensity and what recovery strategies do you currently use?",
      example: "e.g. Training 6 days a week for a marathon — I'm always sore and my times are getting worse",
      color: "#15803d",
    },
    {
      id: "NutritionTimingEngine",
      name: "Nutrition Timing",
      icon: "🥗",
      tagline: "Fueling architect",
      description: "Designs pre/intra/post workout nutrition strategies aligned with training goals.",
      placeholder: "What are your training goals and what does your current nutrition look like?",
      example: "e.g. Early morning lifting sessions 5x per week trying to gain 10 pounds of muscle",
      color: "#16a34a",
    }
  ],
};

export function FitnessCoachApp() {
  return <GenericEngineApp config={CONFIG} />;
}
