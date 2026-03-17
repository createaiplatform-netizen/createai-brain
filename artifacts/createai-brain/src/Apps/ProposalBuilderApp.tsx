// Auto-generated app — Proposal Builder
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "proposalbuilder",
  title: "Proposal Builder",
  icon: "📨",
  color: "#7c3aed",
  description: "Business proposals, RFP responses, grant applications, and client pitches.",
  engines: [
    {
      id: "ProposalExecutiveEngine",
      name: "Proposal Executive Summary",
      icon: "⭐",
      tagline: "Proposal opener",
      description: "Writes proposal executive summaries that capture the client's problem and your solution with urgency.",
      placeholder: "What problem is the client facing and what is your solution?",
      example: "e.g. A hospital system needs to reduce readmission rates — we provide predictive discharge planning software",
      color: "#7c3aed",
    },
    {
      id: "SolutionSectionEngine",
      name: "Solution Section",
      icon: "💡",
      tagline: "Solution architect",
      description: "Writes the solution section of proposals — approach, methodology, and deliverables.",
      placeholder: "What is your proposed solution and how will you deliver it?",
      example: "e.g. Our 90-day consulting engagement redesigning their patient intake workflow across 5 clinics",
      color: "#6d28d9",
    },
    {
      id: "BudgetJustificationEngine",
      name: "Budget Justification",
      icon: "💰",
      tagline: "Cost justifier",
      description: "Writes budget justification narratives that frame costs as investments with clear ROI.",
      placeholder: "What is the project budget and what value does it deliver?",
      example: "e.g. A $250,000 software implementation expected to save $1.2M in operational costs over 3 years",
      color: "#7c3aed",
    },
    {
      id: "RFPResponseEngine",
      name: "RFP Response",
      icon: "📋",
      tagline: "RFP architect",
      description: "Structures and writes RFP responses section by section, hitting every evaluation criterion.",
      placeholder: "What are the RFP requirements and your qualifications?",
      example: "e.g. RFP for city government EHR modernization — we have 10 years of public sector health IT experience",
      color: "#6d28d9",
    },
    {
      id: "GrantApplicationEngine",
      name: "Grant Application",
      icon: "🏆",
      tagline: "Grant writer",
      description: "Writes grant applications — statement of need, project narrative, goals, and evaluation plan.",
      placeholder: "What is the grant, the need you're addressing, and your proposed project?",
      example: "e.g. An NEA grant for a community theater program serving incarcerated youth",
      color: "#7c3aed",
    }
  ],
};

export function ProposalBuilderApp() {
  return <GenericEngineApp config={CONFIG} />;
}
