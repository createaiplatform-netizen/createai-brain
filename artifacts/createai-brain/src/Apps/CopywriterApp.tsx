// Auto-generated app — Copywriter
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "copywriter",
  title: "Copywriter",
  icon: "💡",
  color: "#d97706",
  description: "Sales copy, headlines, CTAs, landing pages, ads, and conversion-focused writing.",
  engines: [
    {
      id: "SalesCopyEngine",
      name: "Sales Copy Engine",
      icon: "💰",
      tagline: "Conversion architect",
      description: "Writes persuasive sales copy using AIDA, PAS, and other proven frameworks.",
      placeholder: "What are you selling and who is your customer?",
      example: "e.g. An online course teaching corporate professionals to negotiate their salary",
      color: "#d97706",
    },
    {
      id: "LandingPageEngine",
      name: "Landing Page Writer",
      icon: "🎯",
      tagline: "Page architect",
      description: "Writes complete landing pages: hero section, benefits, social proof, CTA, and FAQ.",
      placeholder: "What is the offer and who is the target customer?",
      example: "e.g. A landing page for a meal planning service targeting new parents with no time",
      color: "#b45309",
    },
    {
      id: "AdCopyEngine",
      name: "Ad Copy Engine",
      icon: "📢",
      tagline: "Ad craftsman",
      description: "Writes ad copy for Facebook, Google, LinkedIn, and Instagram with headline, body, and CTA variants.",
      placeholder: "What is the product/service and the key customer problem?",
      example: "e.g. A project management tool for remote teams who lose track of priorities",
      color: "#d97706",
    },
    {
      id: "EmailSequenceEngine",
      name: "Email Sequence",
      icon: "📧",
      tagline: "Sequence architect",
      description: "Writes 5-7 email welcome or nurture sequences that build trust and drive conversion.",
      placeholder: "What does your brand do and what action do you want subscribers to take?",
      example: "e.g. A coaching business that helps burned-out executives rediscover their purpose",
      color: "#b45309",
    },
    {
      id: "ProductDescriptionEngine",
      name: "Product Description",
      icon: "🏷️",
      tagline: "Feature-to-benefit translator",
      description: "Transforms product features into benefit-driven descriptions that sell without sounding like sales.",
      placeholder: "What is the product and who is it for?",
      example: "e.g. A noise-cancelling sleep mask with integrated speakers for shift workers",
      color: "#d97706",
    }
  ],
};

export function CopywriterApp() {
  return <GenericEngineApp config={CONFIG} />;
}
