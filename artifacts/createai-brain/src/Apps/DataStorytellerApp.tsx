// Auto-generated app — Data Storyteller
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "datastoryteller",
  title: "Data Storyteller",
  icon: "📊",
  color: "#0369a1",
  description: "Data narratives, visualization scripts, insight communication, and analytical storytelling.",
  engines: [
    {
      id: "InsightNarrativeEngine",
      name: "Insight Narrative",
      icon: "💡",
      tagline: "Insight architect",
      description: "Transforms data findings into compelling narratives that drive decision-making.",
      placeholder: "What data or finding needs to be communicated as a story?",
      example: "e.g. Our conversion rate is up 12% but revenue is down — the data tells a counterintuitive story",
      color: "#0369a1",
    },
    {
      id: "VisualizationScriptEngine",
      name: "Visualization Script",
      icon: "📈",
      tagline: "Visualization architect",
      description: "Writes D3.js or Plotly visualization descriptions and annotation copy for charts.",
      placeholder: "What data should be visualized and what should viewers understand?",
      example: "e.g. A chart showing 5-year customer lifetime value by acquisition channel — what annotations add insight?",
      color: "#0284c7",
    },
    {
      id: "DashboardNarrativeEngine",
      name: "Dashboard Narrative",
      icon: "🖥️",
      tagline: "Dashboard architect",
      description: "Writes dashboard header copy, metric descriptions, and contextual explanations for data dashboards.",
      placeholder: "What metrics does the dashboard show and who is the audience?",
      example: "e.g. A healthcare operations dashboard tracking bed occupancy, readmissions, and staff-to-patient ratios",
      color: "#0369a1",
    },
    {
      id: "AnomalyStoryEngine",
      name: "Anomaly Storyteller",
      icon: "⚠️",
      tagline: "Anomaly architect",
      description: "Turns data anomalies into clear investigative narratives with hypothesis and next steps.",
      placeholder: "What anomaly did you find in the data and what systems might explain it?",
      example: "e.g. Website traffic dropped 60% on a Tuesday with no deployment, no outage, and no news event",
      color: "#0284c7",
    },
    {
      id: "PredictiveNarrativeEngine",
      name: "Predictive Narrative",
      icon: "🔮",
      tagline: "Forecast architect",
      description: "Communicates predictive model outputs in plain language with appropriate uncertainty.",
      placeholder: "What does your predictive model say and who needs to understand it?",
      example: "e.g. Our churn model says 340 customers will leave next month — how do I explain this to non-technical executives?",
      color: "#0369a1",
    }
  ],
};

export function DataStorytellerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
