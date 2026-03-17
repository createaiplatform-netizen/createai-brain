// Auto-generated app — Business Strategist
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "strategist",
  title: "Business Strategist",
  icon: "♟️",
  color: "#1d4ed8",
  description: "Business strategy, competitive analysis, market positioning, and growth planning.",
  engines: [
    {
      id: "CompetitiveAnalysisEngine",
      name: "Competitive Analysis",
      icon: "🔬",
      tagline: "Market intelligence",
      description: "Analyzes competitive landscape with positioning maps, strengths/weaknesses, and differentiation gaps.",
      placeholder: "What is your business and who are your main competitors?",
      example: "e.g. A healthcare SaaS competing against Epic, Athena, and Kareo for mid-size clinic billing",
      color: "#1d4ed8",
    },
    {
      id: "GrowthStrategyEngine",
      name: "Growth Strategy",
      icon: "📈",
      tagline: "Growth architect",
      description: "Designs 90-day growth strategies with prioritized initiatives, metrics, and resource allocation.",
      placeholder: "What is your business stage, goal, and biggest current constraint?",
      example: "e.g. We are post-product-market-fit but stuck at $2M ARR and don't know which growth lever to pull",
      color: "#1e40af",
    },
    {
      id: "MarketPositioningEngine",
      name: "Market Positioning",
      icon: "🎯",
      tagline: "Positioning architect",
      description: "Creates positioning statements, value propositions, and category design strategies.",
      placeholder: "What does your company do and who do you serve?",
      example: "e.g. An AI-powered legal research tool for solo practitioners who can't afford BigLaw pricing",
      color: "#1d4ed8",
    },
    {
      id: "SWOTEngine",
      name: "SWOT Analyst",
      icon: "⚖️",
      tagline: "Situation analyst",
      description: "Conducts deep SWOT analysis with strategic implications and priority action recommendations.",
      placeholder: "What business or strategic situation should I analyze?",
      example: "e.g. A brick-and-mortar bookstore chain deciding whether to expand into digital or double down on local",
      color: "#1e40af",
    },
    {
      id: "PivotStrategyEngine",
      name: "Pivot Strategist",
      icon: "🔄",
      tagline: "Pivot architect",
      description: "Evaluates pivot options with viability scoring, risk assessment, and execution roadmap.",
      placeholder: "What is your current business and why are you considering a pivot?",
      example: "e.g. Our B2C app is struggling but enterprise clients keep asking for the same core feature",
      color: "#1d4ed8",
    }
  ],
};

export function BusinessStrategistApp() {
  return <GenericEngineApp config={CONFIG} />;
}
