// Auto-generated app — Content Calendar
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "contentcalendar",
  title: "Content Calendar",
  icon: "📅",
  color: "#0f766e",
  description: "Content strategy, editorial calendars, campaign planning, and publishing schedules.",
  engines: [
    {
      id: "EditorialCalendarEngine",
      name: "Editorial Calendar",
      icon: "📅",
      tagline: "Schedule architect",
      description: "Designs 12-week content calendars by channel, format, audience, and business goal.",
      placeholder: "What is your brand, channels, and content goals?",
      example: "e.g. A B2B marketing agency targeting startup founders across LinkedIn and newsletter",
      color: "#0f766e",
    },
    {
      id: "ContentPillarEngine",
      name: "Content Pillars",
      icon: "🏛️",
      tagline: "Strategy architect",
      description: "Defines 3–5 content pillars with sub-topics, formats, and audience alignment.",
      placeholder: "What does your brand do and who is your audience?",
      example: "e.g. A mental health app for teenagers and their parents",
      color: "#0d9488",
    },
    {
      id: "CampaignBriefEngine",
      name: "Campaign Brief",
      icon: "🎯",
      tagline: "Campaign architect",
      description: "Writes full campaign briefs with objective, audience, messaging, channels, and success metrics.",
      placeholder: "What is the campaign goal and target audience?",
      example: "e.g. A product launch campaign for a sustainable packaging startup targeting e-commerce brands",
      color: "#0f766e",
    },
    {
      id: "RepurposingEngine",
      name: "Content Repurposer",
      icon: "♻️",
      tagline: "Content multiplier",
      description: "Transforms one piece of content into 5–8 formats across different channels.",
      placeholder: "What piece of content do you want to repurpose?",
      example: "e.g. A 3,000-word research report about employee burnout in tech companies",
      color: "#0d9488",
    },
    {
      id: "TrendingTopicsEngine",
      name: "Trending Topics",
      icon: "📈",
      tagline: "Opportunity spotter",
      description: "Identifies trending topics in your niche and generates content angle ideas to capitalize on them.",
      placeholder: "What is your industry and content focus?",
      example: "e.g. B2C fintech company targeting millennials who are financially anxious",
      color: "#0f766e",
    }
  ],
};

export function ContentCalendarApp() {
  return <GenericEngineApp config={CONFIG} />;
}
