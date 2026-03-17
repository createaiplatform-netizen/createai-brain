// Auto-generated app — Presentation Builder
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "presentbuilder",
  title: "Presentation Builder",
  icon: "📊",
  color: "#6366f1",
  description: "Presentation outlines, slide structures, speaker notes, and pitch decks.",
  engines: [
    {
      id: "PresentationOutlineEngine",
      name: "Presentation Outline",
      icon: "📐",
      tagline: "Story architect",
      description: "Designs presentation structure with narrative arc, slide titles, and talking points.",
      placeholder: "What is the presentation topic, audience, and goal?",
      example: "e.g. A 20-minute board presentation on why we need to enter a new market segment",
      color: "#6366f1",
    },
    {
      id: "SlideTitleEngine",
      name: "Slide Title Writer",
      icon: "🏷️",
      tagline: "Clarity engineer",
      description: "Writes action-oriented slide titles that communicate the key insight, not just the topic.",
      placeholder: "What is the slide's message or data point?",
      example: "e.g. Customer retention dropped from 92% to 87% and we know why",
      color: "#4f46e5",
    },
    {
      id: "SpeakerNotesEngine",
      name: "Speaker Notes",
      icon: "🎤",
      tagline: "Speaker note writer",
      description: "Writes detailed speaker notes that guide delivery without reading verbatim.",
      placeholder: "What is the slide content and key points to convey?",
      example: "e.g. Slide showing 3 years of revenue growth with a dip in year 2 that we recovered from",
      color: "#6366f1",
    },
    {
      id: "PitchDeckEngine",
      name: "Pitch Deck Narrative",
      icon: "🚀",
      tagline: "Investor story architect",
      description: "Structures investor pitch decks with proven 12-slide frameworks and compelling narratives.",
      placeholder: "What does your startup do, what problem do you solve, and what stage are you at?",
      example: "e.g. A Series A pitch for a mental health platform for underserved rural communities",
      color: "#4f46e5",
    },
    {
      id: "DataSlideEngine",
      name: "Data Slide Narrative",
      icon: "📈",
      tagline: "Data story translator",
      description: "Transforms charts and data into slide narratives with insight headlines and business implications.",
      placeholder: "What does the data show and what should the audience conclude from it?",
      example: "e.g. Our cohort analysis shows customers who onboard in under 10 minutes have 3x lifetime value",
      color: "#6366f1",
    }
  ],
};

export function PresentationBuilderApp() {
  return <GenericEngineApp config={CONFIG} />;
}
