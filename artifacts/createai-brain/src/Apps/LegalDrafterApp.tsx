// Auto-generated app — Legal Drafter
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "legaldrafter",
  title: "Legal Drafter",
  icon: "⚖️",
  color: "#1d4ed8",
  description: "Legal document drafting, clause libraries, legal language, and document structures.",
  engines: [
    {
      id: "ClauseLibraryEngine",
      name: "Clause Library",
      icon: "📚",
      tagline: "Clause architect",
      description: "Drafts standard legal clauses — indemnification, limitation of liability, force majeure, and more.",
      placeholder: "What clause do you need drafted and for what type of agreement?",
      example: "e.g. A limitation of liability clause for a SaaS subscription agreement with enterprise clients",
      color: "#1d4ed8",
    },
    {
      id: "DocumentStructureEngine",
      name: "Document Structure",
      icon: "🗺️",
      tagline: "Structure architect",
      description: "Designs legal document structures with appropriate sections, numbering, and defined term strategy.",
      placeholder: "What type of legal document are you drafting and what is its purpose?",
      example: "e.g. A joint venture agreement between two companies co-developing a technology product",
      color: "#1e40af",
    },
    {
      id: "LegalPlainLanguageEngine",
      name: "Plain Language Translator",
      icon: "💬",
      tagline: "Clarity architect",
      description: "Translates complex legal language into plain English without losing legal accuracy.",
      placeholder: "Paste or describe the legal text you want translated to plain English",
      example: "e.g. The force majeure clause in our lease that our landlord wants us to waive",
      color: "#1d4ed8",
    },
    {
      id: "ContractRiskEngine",
      name: "Contract Risk Spotter",
      icon: "⚠️",
      tagline: "Risk architect",
      description: "Identifies contract provisions that create risk — one-sided clauses, missing protections, and traps.",
      placeholder: "Describe the contract or clause you want risk-analyzed",
      example: "e.g. Our vendor wants us to accept liability for all data breaches even if caused by their system",
      color: "#1e40af",
    },
    {
      id: "LegalComparisonEngine",
      name: "Jurisdiction Comparison",
      icon: "🌍",
      tagline: "Jurisdiction architect",
      description: "Compares how specific legal concepts differ across jurisdictions — US states, countries, legal systems.",
      placeholder: "What legal concept or requirement needs to be compared across jurisdictions?",
      example: "e.g. Non-compete agreement enforceability in California vs New York vs Texas",
      color: "#1d4ed8",
    }
  ],
};

export function LegalDrafterApp() {
  return <GenericEngineApp config={CONFIG} />;
}
