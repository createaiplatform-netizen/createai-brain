// Auto-generated app — IP Protection Studio
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "ipprotection",
  title: "IP Protection Studio",
  icon: "🛡️",
  color: "#7c3aed",
  description: "Intellectual property, trademark strategy, copyright guidance, and IP portfolio design.",
  engines: [
    {
      id: "TrademarkStrategyEngine",
      name: "Trademark Strategy",
      icon: "™️",
      tagline: "Mark architect",
      description: "Designs trademark strategies — what to protect, strength assessment, and registration approach.",
      placeholder: "What brand name, logo, or slogan are you considering trademarking?",
      example: "e.g. A new brand name 'Velara' for a health supplement line — assess strength and risk",
      color: "#7c3aed",
    },
    {
      id: "CopyrightGuideEngine",
      name: "Copyright Guide",
      icon: "©️",
      tagline: "Rights architect",
      description: "Explains copyright ownership, fair use, work for hire, and licensing in practical terms.",
      placeholder: "What copyright question or situation do you need guidance on?",
      example: "e.g. A freelancer created a logo for us — do we own it or do they?",
      color: "#6d28d9",
    },
    {
      id: "PatentIdeaEngine",
      name: "Patent Idea Analyzer",
      icon: "💡",
      tagline: "Patent architect",
      description: "Analyzes invention ideas for patentability — novelty, non-obviousness, and prior art considerations.",
      placeholder: "Describe your invention or process innovation",
      example: "e.g. A physical device that uses ambient temperature differential to charge small electronics",
      color: "#7c3aed",
    },
    {
      id: "TradeSecretEngine",
      name: "Trade Secret Protection",
      icon: "🔒",
      tagline: "Secret architect",
      description: "Designs trade secret protection strategies — what qualifies and how to protect it.",
      placeholder: "What confidential business information are you trying to protect?",
      example: "e.g. Our customer acquisition formula that has 3x the efficiency of industry standard",
      color: "#6d28d9",
    },
    {
      id: "LicensingStrategyEngine",
      name: "Licensing Strategy",
      icon: "🤝",
      tagline: "Licensing architect",
      description: "Designs IP licensing strategies — royalty structures, exclusive vs non-exclusive, and territory rights.",
      placeholder: "What IP are you licensing and what is the licensing relationship?",
      example: "e.g. Licensing our patented medical device design to manufacturers in Southeast Asia",
      color: "#7c3aed",
    }
  ],
};

export function IPProtectionStudioApp() {
  return <GenericEngineApp config={CONFIG} />;
}
