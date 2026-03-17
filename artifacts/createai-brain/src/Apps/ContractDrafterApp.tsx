// Auto-generated app — Contract Drafter
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "contractdraft",
  title: "Contract Drafter",
  icon: "📜",
  color: "#dc2626",
  description: "Contract templates, legal language, terms drafting, and agreement structures.",
  engines: [
    {
      id: "ServiceAgreementEngine",
      name: "Service Agreement",
      icon: "🤝",
      tagline: "Agreement architect",
      description: "Drafts service agreement structures with scope, payment terms, IP ownership, and termination clauses.",
      placeholder: "What service are you providing, to whom, and what are the key terms?",
      example: "e.g. A consulting agreement for 6 months of strategy work with a mid-size tech company",
      color: "#dc2626",
    },
    {
      id: "NDAAgreementEngine",
      name: "NDA Framework",
      icon: "🔒",
      tagline: "Confidentiality architect",
      description: "Drafts NDA frameworks — mutual and one-way — with appropriate scope and exclusions.",
      placeholder: "What is the relationship, what information is being protected, and how long?",
      example: "e.g. Mutual NDA for two companies exploring a potential acquisition",
      color: "#b91c1c",
    },
    {
      id: "PartnershipAgreementEngine",
      name: "Partnership Agreement",
      icon: "🤝",
      tagline: "Partnership architect",
      description: "Structures partnership agreements with roles, revenue split, decision rights, and exit terms.",
      placeholder: "What is the partnership structure and what are each party's contributions?",
      example: "e.g. Two founders partnering to build a product — one brings tech, one brings clients",
      color: "#dc2626",
    },
    {
      id: "TermsOfServiceEngine",
      name: "Terms of Service",
      icon: "📋",
      tagline: "Terms architect",
      description: "Drafts Terms of Service frameworks appropriate for SaaS, marketplace, or content platforms.",
      placeholder: "What type of product or platform do you need terms for?",
      example: "e.g. A marketplace that connects freelancers with clients and takes a 15% commission",
      color: "#b91c1c",
    },
    {
      id: "ContractReviewEngine",
      name: "Contract Review Notes",
      icon: "🔍",
      tagline: "Risk spotter",
      description: "Analyzes contract language and flags potential risks, ambiguities, and missing protections.",
      placeholder: "Describe or paste the contract clauses you want reviewed",
      example: "e.g. The payment terms say NET 90 with no late payment penalty — is this a risk for us?",
      color: "#dc2626",
    }
  ],
};

export function ContractDrafterApp() {
  return <GenericEngineApp config={CONFIG} />;
}
