// Auto-generated app — Budget Planner
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "budgetplanner",
  title: "Budget Planner",
  icon: "💰",
  color: "#16a34a",
  description: "Budget templates, financial narratives, cost justifications, and financial planning.",
  engines: [
    {
      id: "DepartmentBudgetEngine",
      name: "Department Budget",
      icon: "📊",
      tagline: "Budget architect",
      description: "Designs department budget structures with line items, justifications, and variance tracking.",
      placeholder: "What department, fiscal year, and strategic priorities are you budgeting for?",
      example: "e.g. A marketing budget for a SaaS company shifting from outbound to inbound for the first time",
      color: "#16a34a",
    },
    {
      id: "ROICalculatorEngine",
      name: "ROI Calculator Narrative",
      icon: "💡",
      tagline: "ROI communicator",
      description: "Writes ROI narratives that make financial returns tangible, credible, and compelling.",
      placeholder: "What investment are you justifying and what returns does it produce?",
      example: "e.g. A $500K investment in a new CRM that we estimate will increase close rate by 15%",
      color: "#15803d",
    },
    {
      id: "FinancialForecastEngine",
      name: "Financial Forecast Narrative",
      icon: "📈",
      tagline: "Forecast architect",
      description: "Writes financial forecast narratives with assumptions, scenarios, and sensitivity analysis explanation.",
      placeholder: "What are your revenue and cost projections and their key assumptions?",
      example: "e.g. We project $4M ARR next year assuming 20% growth from current customers and 10 new enterprise deals",
      color: "#16a34a",
    },
    {
      id: "BudgetRequestEngine",
      name: "Budget Request",
      icon: "📨",
      tagline: "Ask architect",
      description: "Writes compelling budget requests with justification, impact, and approval criteria.",
      placeholder: "What budget are you requesting and what will it achieve?",
      example: "e.g. Requesting $180K for 2 new engineers to support a product launch in Q3",
      color: "#15803d",
    },
    {
      id: "CostReductionEngine",
      name: "Cost Reduction Plan",
      icon: "✂️",
      tagline: "Efficiency architect",
      description: "Designs cost reduction plans with prioritized cuts, implementation timeline, and impact mitigation.",
      placeholder: "What budget needs to be reduced and by how much?",
      example: "e.g. We need to cut $400K from our $2M operating budget without reducing headcount",
      color: "#16a34a",
    }
  ],
};

export function BudgetPlannerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
