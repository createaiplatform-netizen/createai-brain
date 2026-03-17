// Auto-generated app — Hiring Assistant
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "hiringassist",
  title: "Hiring Assistant",
  icon: "🤝",
  color: "#d97706",
  description: "Job descriptions, interview questions, offer letters, and hiring process design.",
  engines: [
    {
      id: "JobDescriptionEngine",
      name: "Job Description Writer",
      icon: "📋",
      tagline: "JD architect",
      description: "Writes inclusive, compelling job descriptions that attract the right candidates.",
      placeholder: "What role are you hiring for and what are the key responsibilities and qualifications?",
      example: "e.g. A Head of Customer Success for a B2B SaaS company at Series B with 150 enterprise clients",
      color: "#d97706",
    },
    {
      id: "InterviewQuestionEngine",
      name: "Interview Question Designer",
      icon: "❓",
      tagline: "Interview architect",
      description: "Designs structured interview question sets — behavioral, situational, and technical.",
      placeholder: "What role and competencies are you interviewing for?",
      example: "e.g. Interviewing senior engineers for a role requiring ownership, speed, and architectural thinking",
      color: "#b45309",
    },
    {
      id: "ScorecardEngine",
      name: "Hiring Scorecard",
      icon: "⭐",
      tagline: "Evaluation architect",
      description: "Designs structured hiring scorecards with competencies, rating criteria, and red flags.",
      placeholder: "What role and success criteria are you evaluating?",
      example: "e.g. A scorecard for hiring a VP of Sales who can transition the team from founder-led sales",
      color: "#d97706",
    },
    {
      id: "OfferLetterEngine",
      name: "Offer Letter Writer",
      icon: "✉️",
      tagline: "Offer craftsman",
      description: "Writes compelling offer letters that close candidates with clear terms and enthusiasm.",
      placeholder: "What is the role, compensation, and company context?",
      example: "e.g. Offer letter for a startup's first senior hire who has a competing offer from a larger company",
      color: "#b45309",
    },
    {
      id: "OnboardingPlanEngine",
      name: "Onboarding Plan",
      icon: "🚀",
      tagline: "Onboarding architect",
      description: "Designs 30-60-90 day onboarding plans with milestones, activities, and success metrics.",
      placeholder: "What role and what should the new hire achieve in their first 90 days?",
      example: "e.g. A new CMO joining a company that has never had a dedicated marketing function",
      color: "#d97706",
    }
  ],
};

export function HiringAssistantApp() {
  return <GenericEngineApp config={CONFIG} />;
}
