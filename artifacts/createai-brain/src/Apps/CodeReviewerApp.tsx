// Auto-generated app — Code Reviewer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "codereviewer",
  title: "Code Reviewer",
  icon: "👨‍💻",
  color: "#16a34a",
  description: "Code review frameworks, best practices analysis, refactoring guides, and quality improvement.",
  engines: [
    {
      id: "CodeQualityEngine",
      name: "Code Quality Analysis",
      icon: "🔍",
      tagline: "Quality architect",
      description: "Analyzes code quality across dimensions: readability, maintainability, and testability.",
      placeholder: "Describe or paste the code you want quality analyzed",
      example: "e.g. A 200-line function that handles payment processing, logging, and email — all in one place",
      color: "#16a34a",
    },
    {
      id: "RefactoringGuideEngine",
      name: "Refactoring Guide",
      icon: "🔧",
      tagline: "Refactor architect",
      description: "Designs refactoring strategies for messy codebases with prioritized steps and risk assessment.",
      placeholder: "What codebase or code pattern needs refactoring?",
      example: "e.g. A monolith we want to break into microservices without breaking the app or the team",
      color: "#15803d",
    },
    {
      id: "CodePatternEngine",
      name: "Design Pattern Advisor",
      icon: "🏛️",
      tagline: "Pattern architect",
      description: "Recommends design patterns for specific problems with implementation guidance.",
      placeholder: "What software problem are you trying to solve with a pattern?",
      example: "e.g. I need to handle different payment providers (Stripe, PayPal, Square) without coupling my code to any of them",
      color: "#16a34a",
    },
    {
      id: "SecurityReviewEngine",
      name: "Security Review",
      icon: "🔒",
      tagline: "Security architect",
      description: "Identifies security vulnerabilities and recommends fixes for code and architecture.",
      placeholder: "What code or system needs a security review?",
      example: "e.g. Our authentication system — I want to know if there are common attack vectors we've missed",
      color: "#15803d",
    },
    {
      id: "TestStrategyEngine",
      name: "Test Strategy",
      icon: "🧪",
      tagline: "Testing architect",
      description: "Designs testing strategies — unit, integration, e2e — with coverage priorities and tool selection.",
      placeholder: "What system needs a test strategy and what is currently tested?",
      example: "e.g. A medical device software system with zero tests that is going through FDA approval",
      color: "#16a34a",
    }
  ],
};

export function CodeReviewerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
