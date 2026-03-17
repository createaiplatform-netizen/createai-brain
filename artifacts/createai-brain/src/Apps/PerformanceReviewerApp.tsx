// Auto-generated app — Performance Reviewer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "perfreviewer",
  title: "Performance Reviewer",
  icon: "⭐",
  color: "#7c3aed",
  description: "Performance reviews, feedback frameworks, 360 reviews, and development plans.",
  engines: [
    {
      id: "PerformanceReviewEngine",
      name: "Performance Review Writer",
      icon: "📋",
      tagline: "Review architect",
      description: "Writes complete performance reviews — strengths, development areas, goals, and ratings — balanced and specific.",
      placeholder: "Describe the employee's role, performance highlights, and areas for growth",
      example: "e.g. A mid-level engineer who ships quality code but struggles with cross-team communication",
      color: "#7c3aed",
    },
    {
      id: "FeedbackFramingEngine",
      name: "Feedback Framer",
      icon: "💬",
      tagline: "Feedback architect",
      description: "Transforms vague feedback into specific, actionable, behavior-based statements.",
      placeholder: "What feedback do you need to give and to whom?",
      example: "e.g. A manager who micromanages and doesn't trust the team to make decisions without checking",
      color: "#6d28d9",
    },
    {
      id: "GoalSettingEngine",
      name: "Goal Setting Designer",
      icon: "🎯",
      tagline: "OKR architect",
      description: "Designs SMART goals and OKRs aligned to individual role, team priorities, and company strategy.",
      placeholder: "What is the role and what should this person achieve this quarter?",
      example: "e.g. A customer success manager who needs to reduce churn and expand accounts simultaneously",
      color: "#7c3aed",
    },
    {
      id: "PIPEngine",
      name: "Improvement Plan Designer",
      icon: "🔧",
      tagline: "PIP architect",
      description: "Designs performance improvement plans with clear expectations, milestones, and support mechanisms.",
      placeholder: "What performance gap needs addressing and what does success look like?",
      example: "e.g. A sales rep who has missed quota for 3 consecutive quarters despite coaching",
      color: "#6d28d9",
    },
    {
      id: "SelfReviewEngine",
      name: "Self-Review Writer",
      icon: "🪞",
      tagline: "Self-advocacy architect",
      description: "Helps employees write compelling self-reviews that highlight impact without boasting.",
      placeholder: "What did you accomplish this review period and what impact did it have?",
      example: "e.g. I redesigned our onboarding flow, reduced support tickets by 30%, and mentored 2 junior engineers",
      color: "#7c3aed",
    }
  ],
};

export function PerformanceReviewerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
