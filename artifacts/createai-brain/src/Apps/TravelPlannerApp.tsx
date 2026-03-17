// Auto-generated app — Travel Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "travelplanner",
  title: "Travel Planner",
  icon: "✈️",
  color: "#0891b2",
  description: "Trip planning, itineraries, travel writing, cultural guides, and adventure design.",
  engines: [
    {
      id: "ItineraryEngine",
      name: "Itinerary Designer",
      icon: "🗺️",
      tagline: "Journey architect",
      description: "Designs day-by-day trip itineraries with timing, activities, transitions, and local context.",
      placeholder: "Where are you going, how long is the trip, and what are your interests?",
      example: "e.g. 10 days in Japan for the first time — interested in food, architecture, nature, and avoiding tourist traps",
      color: "#0891b2",
    },
    {
      id: "CulturalContextEngine",
      name: "Cultural Context Guide",
      icon: "🌏",
      tagline: "Culture architect",
      description: "Provides deep cultural context — customs, etiquette, history, and how to engage respectfully.",
      placeholder: "What country or culture are you visiting?",
      example: "e.g. First trip to Morocco — what are the essential cultural norms I need to understand?",
      color: "#0e7490",
    },
    {
      id: "TravelWritingEngine",
      name: "Travel Writing",
      icon: "✍️",
      tagline: "Travel writer",
      description: "Transforms travel experiences into evocative travel writing — for blog, memoir, or personal record.",
      placeholder: "Describe the place or experience you want to write about",
      example: "e.g. A small fishing village in Portugal I visited on a grey morning in November",
      color: "#0891b2",
    },
    {
      id: "PackingListEngine",
      name: "Packing List Designer",
      icon: "🧳",
      tagline: "Packing architect",
      description: "Designs destination-specific packing lists optimized for activities, climate, and bag size.",
      placeholder: "Where are you going, for how long, what activities, and what bag size?",
      example: "e.g. 3 weeks in Southeast Asia — hiking, temples, beaches, and budget hostels with a 40L backpack",
      color: "#0e7490",
    },
    {
      id: "HiddenGemEngine",
      name: "Hidden Gem Finder",
      icon: "💎",
      tagline: "Discovery architect",
      description: "Identifies off-the-beaten-path experiences in any destination — what locals do but tourists miss.",
      placeholder: "What destination are you visiting and what kind of experience are you looking for?",
      example: "e.g. I'm spending 5 days in Barcelona and don't want to do anything in every tourist guide",
      color: "#0891b2",
    }
  ],
};

export function TravelPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
