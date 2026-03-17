// Auto-generated app — Report Builder
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "reportbuilder",
  title: "Report Builder",
  icon: "📊",
  color: "#0369a1",
  description: "Business reports, executive summaries, board decks, and data narratives.",
  engines: [
    {
      id: "ExecutiveSummaryEngine",
      name: "Executive Summary",
      icon: "⭐",
      tagline: "Summary architect",
      description: "Writes executive summaries that are clear, concise, and decision-ready.",
      placeholder: "What report or situation needs an executive summary?",
      example: "e.g. A quarterly business review showing 40% growth but also rising churn",
      color: "#0369a1",
    },
    {
      id: "DataNarrativeEngine",
      name: "Data Narrative",
      icon: "📈",
      tagline: "Story in data",
      description: "Transforms data and metrics into compelling business narratives with insight and implication.",
      placeholder: "What data or metrics do you need to narrate?",
      example: "e.g. Q3 showed revenue up 30% but customer satisfaction dropped from 4.2 to 3.6",
      color: "#0284c7",
    },
    {
      id: "BoardUpdateEngine",
      name: "Board Update",
      icon: "🏢",
      tagline: "Board communicator",
      description: "Writes board-level updates: key metrics, strategic progress, risks, and asks.",
      placeholder: "What does the board need to know about this period?",
      example: "e.g. We hit revenue targets but missed on team growth and have two strategic decisions to make",
      color: "#0369a1",
    },
    {
      id: "AnnualReportEngine",
      name: "Annual Report Writer",
      icon: "📚",
      tagline: "Year-in-review architect",
      description: "Writes annual report sections: CEO letter, year in review, impact stories, and forward outlook.",
      placeholder: "What were the year's key achievements, challenges, and direction?",
      example: "e.g. A nonprofit that expanded to 3 new regions, survived a funding cut, and launched a new program",
      color: "#0284c7",
    },
    {
      id: "RecommendationEngine",
      name: "Recommendation Report",
      icon: "💡",
      tagline: "Decision architect",
      description: "Writes recommendation reports with situation analysis, options, pros/cons, and clear recommendation.",
      placeholder: "What decision needs a structured recommendation?",
      example: "e.g. Whether to build, buy, or partner for our new analytics capability",
      color: "#0369a1",
    }
  ],
};

export function ReportBuilderApp() {
  return <GenericEngineApp config={CONFIG} />;
}
