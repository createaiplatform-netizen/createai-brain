// Auto-generated app — Privacy Policy Studio
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "privacypolicy",
  title: "Privacy Policy Studio",
  icon: "🔐",
  color: "#dc2626",
  description: "Privacy policies, terms of service, GDPR compliance, and data governance language.",
  engines: [
    {
      id: "PrivacyPolicyDraftEngine",
      name: "Privacy Policy Drafter",
      icon: "📋",
      tagline: "Privacy architect",
      description: "Drafts privacy policy sections appropriate for your product type and jurisdiction.",
      placeholder: "What type of product is this, where are your users, and what data do you collect?",
      example: "e.g. A mobile health app collecting biometric and location data from users in the EU and US",
      color: "#dc2626",
    },
    {
      id: "GDPRComplianceEngine",
      name: "GDPR Compliance Guide",
      icon: "🇪🇺",
      tagline: "Compliance architect",
      description: "Guides GDPR compliance requirements — lawful bases, data subject rights, and processor agreements.",
      placeholder: "What business activity or data practice needs GDPR compliance guidance?",
      example: "e.g. We want to use customer email data for behavioral retargeting — what GDPR requirements apply?",
      color: "#b91c1c",
    },
    {
      id: "TermsOfServiceDraftEngine",
      name: "Terms of Service Drafter",
      icon: "📄",
      tagline: "Terms architect",
      description: "Drafts terms of service appropriate for your platform type and user relationship.",
      placeholder: "What type of platform and what user behaviors need to be governed?",
      example: "e.g. A social platform where users create content and we license it — what terms protect us and them?",
      color: "#dc2626",
    },
    {
      id: "DataRetentionEngine",
      name: "Data Retention Policy",
      icon: "🗄️",
      tagline: "Retention architect",
      description: "Designs data retention policies aligned with legal requirements and operational needs.",
      placeholder: "What types of data do you store and what regulations apply to your industry?",
      example: "e.g. A healthcare SaaS platform storing patient records subject to HIPAA",
      color: "#b91c1c",
    },
    {
      id: "CookiePolicyEngine",
      name: "Cookie Policy",
      icon: "🍪",
      tagline: "Cookie architect",
      description: "Drafts cookie policies and consent frameworks compliant with GDPR and ePrivacy requirements.",
      placeholder: "What cookies does your website use and where are your users?",
      example: "e.g. E-commerce site using analytics, advertising, and functional cookies with EU and US customers",
      color: "#dc2626",
    }
  ],
};

export function PrivacyPolicyStudioApp() {
  return <GenericEngineApp config={CONFIG} />;
}
