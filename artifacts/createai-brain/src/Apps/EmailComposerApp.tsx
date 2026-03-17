// Auto-generated app — Email Composer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "emailcomposer",
  title: "Email Composer",
  icon: "📧",
  color: "#16a34a",
  description: "Professional emails, newsletters, follow-ups, and communication templates.",
  engines: [
    {
      id: "ProfessionalEmailEngine",
      name: "Professional Email",
      icon: "💼",
      tagline: "Email craftsman",
      description: "Writes clear, professional emails for any business context — tone-matched and purpose-driven.",
      placeholder: "What is the email for and what do you want to achieve?",
      example: "e.g. Following up with a prospect who went cold after a promising demo three weeks ago",
      color: "#16a34a",
    },
    {
      id: "DifficultyEmailEngine",
      name: "Difficult Email",
      icon: "⚠️",
      tagline: "Hard message writer",
      description: "Writes difficult emails — firing, declining, confronting, or delivering bad news with clarity and respect.",
      placeholder: "What difficult message needs to be communicated and to whom?",
      example: "e.g. Informing a long-time vendor we are ending our contract after 5 years",
      color: "#15803d",
    },
    {
      id: "ColdOutreachEngine",
      name: "Cold Outreach",
      icon: "🎯",
      tagline: "Cold email architect",
      description: "Writes cold outreach emails with hyper-personalized hooks, clear value, and low-friction CTAs.",
      placeholder: "Who are you reaching out to and what is your offer?",
      example: "e.g. Cold outreach to startup CTOs about our developer productivity analytics tool",
      color: "#16a34a",
    },
    {
      id: "NewsletterEngine",
      name: "Newsletter Writer",
      icon: "📰",
      tagline: "Newsletter architect",
      description: "Writes email newsletters with great subject lines, engaging body, and clear reader value.",
      placeholder: "What is the newsletter topic and who is your audience?",
      example: "e.g. A weekly newsletter for independent consultants about building a practice",
      color: "#15803d",
    },
    {
      id: "EmailSequenceBuilderEngine",
      name: "Email Sequence Builder",
      icon: "🔄",
      tagline: "Sequence architect",
      description: "Designs and writes multi-email sequences for onboarding, sales, or nurture campaigns.",
      placeholder: "What is the sequence goal and subscriber profile?",
      example: "e.g. A 5-email onboarding sequence for new users of a mental health journaling app",
      color: "#16a34a",
    }
  ],
};

export function EmailComposerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
