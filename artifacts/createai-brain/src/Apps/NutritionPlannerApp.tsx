// Auto-generated app — Nutrition Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "nutritionplanner",
  title: "Nutrition Planner",
  icon: "🥗",
  color: "#16a34a",
  description: "Nutrition planning, diet design, macro balance, and evidence-based eating guidance.",
  engines: [
    {
      id: "NutritionPlanEngine",
      name: "Nutrition Plan Designer",
      icon: "🥗",
      tagline: "Nutrition architect",
      description: "Designs personalized nutrition plans with macro targets, meal timing, and food variety.",
      placeholder: "What are your health goals, dietary restrictions, and food preferences?",
      example: "e.g. Trying to reduce inflammation, vegetarian, hate cooking, very food sensitive to texture",
      color: "#16a34a",
    },
    {
      id: "MacroCalculatorEngine",
      name: "Macro Calculator",
      icon: "🔢",
      tagline: "Macro architect",
      description: "Calculates and explains optimal macro ratios for specific health and body composition goals.",
      placeholder: "What is your goal, body stats, and activity level?",
      example: "e.g. 5'8, 185 lbs, 32% body fat, moderately active, goal of losing fat and maintaining muscle",
      color: "#15803d",
    },
    {
      id: "MealPrepEngine",
      name: "Meal Prep Planner",
      icon: "🍱",
      tagline: "Prep architect",
      description: "Designs efficient meal prep systems that minimize time while maximizing nutritional variety.",
      placeholder: "How many people are you prepping for and how much time can you spend per week?",
      example: "e.g. Prepping for 2 adults, 2 hours on Sunday, Mediterranean-ish diet, avoiding ultra-processed food",
      color: "#16a34a",
    },
    {
      id: "NutritionMythEngine",
      name: "Nutrition Myth Buster",
      icon: "💡",
      tagline: "Evidence architect",
      description: "Analyzes nutrition claims against current evidence — what's supported, what's marketing, and what's unclear.",
      placeholder: "What nutrition claim or diet trend do you want analyzed against the evidence?",
      example: "e.g. Is the carnivore diet actually healthy or is it marketing dressed up as ancestral wisdom?",
      color: "#15803d",
    },
    {
      id: "FoodRelationshipEngine",
      name: "Healthy Food Relationship",
      icon: "💙",
      tagline: "Mindfulness architect",
      description: "Designs approaches to improving the psychological relationship with food — guilt-free, sustainable eating.",
      placeholder: "What is your current relationship with food and what would you like it to be?",
      example: "e.g. I eat well for weeks then binge when stressed — the cycle makes me feel like a failure",
      color: "#16a34a",
    }
  ],
};

export function NutritionPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
