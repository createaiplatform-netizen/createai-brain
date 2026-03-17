// Auto-generated app — System Designer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "systemdesigner",
  title: "System Designer",
  icon: "🏗️",
  color: "#475569",
  description: "System architecture, design patterns, technical documentation, and engineering clarity.",
  engines: [
    {
      id: "ArchitectureDiagramEngine",
      name: "Architecture Description",
      icon: "🗺️",
      tagline: "Architecture architect",
      description: "Describes system architectures in clear language for technical and non-technical audiences.",
      placeholder: "What system needs to be explained and who is the audience?",
      example: "e.g. Our microservices architecture to a CTO who is evaluating whether to invest more or consolidate",
      color: "#475569",
    },
    {
      id: "TechnicalDecisionEngine",
      name: "Technical Decision Record",
      icon: "📋",
      tagline: "Decision architect",
      description: "Writes architectural decision records (ADRs) with context, options, decision, and consequences.",
      placeholder: "What technical decision was made and what were the alternatives?",
      example: "e.g. We chose PostgreSQL over MongoDB and need to document why for future engineers",
      color: "#334155",
    },
    {
      id: "APIDesignEngine",
      name: "API Design Guide",
      icon: "🔌",
      tagline: "API architect",
      description: "Designs RESTful and GraphQL API structures with naming conventions, error handling, and versioning.",
      placeholder: "What does this API need to do and who will consume it?",
      example: "e.g. An API for a healthcare system that external insurance companies will query for patient eligibility",
      color: "#475569",
    },
    {
      id: "ScalabilityEngine",
      name: "Scalability Analysis",
      icon: "📈",
      tagline: "Scale architect",
      description: "Analyzes scalability constraints and designs solutions for growth bottlenecks.",
      placeholder: "What is your current system and what scale do you need to reach?",
      example: "e.g. Our Django app handles 1K users and we need it to handle 100K — where will it break?",
      color: "#334155",
    },
    {
      id: "TechDebtEngine",
      name: "Tech Debt Analyzer",
      icon: "🔧",
      tagline: "Debt architect",
      description: "Analyzes technical debt and designs prioritized paydown plans.",
      placeholder: "What technical debt exists in your system and what is causing the most pain?",
      example: "e.g. We have 5 years of accumulated tech debt and need to communicate the paydown plan to executives",
      color: "#475569",
    }
  ],
};

export function SystemDesignerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
