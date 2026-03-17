// Auto-generated app — Recipe Creator
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "recipecreator",
  title: "Recipe Creator",
  icon: "👨‍🍳",
  color: "#ef4444",
  description: "Recipe design, meal planning, cuisine exploration, and culinary storytelling.",
  engines: [
    {
      id: "RecipeDesignEngine",
      name: "Recipe Designer",
      icon: "🍳",
      tagline: "Dish architect",
      description: "Designs original recipes with ingredient rationale, technique explanation, and variation options.",
      placeholder: "What dish, cuisine, or constraint should I design a recipe around?",
      example: "e.g. A plant-based version of a traditional Portuguese bacalhau dish that doesn't feel like a compromise",
      color: "#ef4444",
    },
    {
      id: "FlavorPairingEngine",
      name: "Flavor Pairing",
      icon: "🎨",
      tagline: "Flavor architect",
      description: "Identifies unexpected flavor pairings with scientific explanation and recipe applications.",
      placeholder: "What ingredients or flavors do you want to combine or build around?",
      example: "e.g. Miso, dark chocolate, and citrus — is there a dessert or sauce that can marry these?",
      color: "#dc2626",
    },
    {
      id: "MealPlanEngine",
      name: "Meal Plan Designer",
      icon: "📅",
      tagline: "Nutrition architect",
      description: "Designs weekly meal plans with nutritional balance, variety, prep efficiency, and shopping optimization.",
      placeholder: "What dietary needs, preferences, and cooking time do you have?",
      example: "e.g. 4 adults including one vegan, 45 minutes max per dinner, focused on Mediterranean flavors",
      color: "#ef4444",
    },
    {
      id: "CuisineExplorerEngine",
      name: "Cuisine Explorer",
      icon: "🌍",
      tagline: "Culture-on-plate architect",
      description: "Deep-dives into any cuisine's history, techniques, key ingredients, and essential dishes.",
      placeholder: "What cuisine do you want to explore and understand deeply?",
      example: "e.g. Georgian cuisine — I've never cooked it but heard it's remarkable",
      color: "#dc2626",
    },
    {
      id: "SubstitutionEngine",
      name: "Ingredient Substitution",
      icon: "🔄",
      tagline: "Adaptation architect",
      description: "Finds intelligent ingredient substitutions for dietary restrictions, allergies, or availability.",
      placeholder: "What ingredient needs substituting and what is it being used for in the recipe?",
      example: "e.g. I need to substitute eggs in a carbonara that remains creamy and rich",
      color: "#ef4444",
    }
  ],
};

export function RecipeCreatorApp() {
  return <GenericEngineApp config={CONFIG} />;
}
