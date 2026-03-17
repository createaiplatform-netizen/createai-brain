// Auto-generated app — Finance Advisor
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "financeadvisor",
  title: "Finance Advisor",
  icon: "📈",
  color: "#16a34a",
  description: "Personal finance planning, investment education, budgeting, and financial goal mapping.",
  engines: [
    {
      id: "BudgetDesignEngine",
      name: "Budget Designer",
      icon: "💰",
      tagline: "Budget architect",
      description: "Designs personalized budget frameworks with categories, allocations, and adjustment strategies.",
      placeholder: "What is your income, fixed expenses, and financial goals?",
      example: "e.g. $85K income, $2,400 rent, $400 student loans — trying to save for a house in 4 years",
      color: "#16a34a",
    },
    {
      id: "DebtStrategyEngine",
      name: "Debt Strategy",
      icon: "🔗",
      tagline: "Debt architect",
      description: "Designs debt payoff strategies — avalanche, snowball, or hybrid — with timeline and interest savings.",
      placeholder: "What debts do you have, their rates, and minimum payments?",
      example: "e.g. $22K credit card at 24%, $15K student loan at 6%, $8K car loan at 5%",
      color: "#15803d",
    },
    {
      id: "InvestingFoundationsEngine",
      name: "Investing Foundations",
      icon: "📊",
      tagline: "Investment architect",
      description: "Explains investing fundamentals clearly — compound interest, asset allocation, index funds, risk.",
      placeholder: "What aspect of investing do you want to understand?",
      example: "e.g. I'm 28, just started a job with a 401k, and have no idea what to do with it",
      color: "#16a34a",
    },
    {
      id: "FinancialGoalMapEngine",
      name: "Financial Goal Map",
      icon: "🗺️",
      tagline: "Goal architect",
      description: "Maps 1-year, 5-year, and 10-year financial goals with milestone targets and required savings rates.",
      placeholder: "What are your financial goals and current situation?",
      example: "e.g. Buy a home in 5 years, retire at 55, and fund my child's education — 34 years old, $60K income",
      color: "#15803d",
    },
    {
      id: "InsurancePlanningEngine",
      name: "Insurance Planning",
      icon: "🛡️",
      tagline: "Protection architect",
      description: "Guides insurance coverage decisions — life, disability, health, and property — for your situation.",
      placeholder: "What is your life situation and what coverages are you uncertain about?",
      example: "e.g. Just had a baby, have a mortgage, self-employed with no employer benefits",
      color: "#16a34a",
    }
  ],
};

export function FinanceAdvisorApp() {
  return <GenericEngineApp config={CONFIG} />;
}
