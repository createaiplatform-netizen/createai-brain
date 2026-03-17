// Auto-generated app — Critical Thinking Coach
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "criticalthinking",
  title: "Critical Thinking Coach",
  icon: "🧩",
  color: "#0891b2",
  description: "Logical analysis, cognitive bias identification, decision auditing, and reasoning improvement.",
  engines: [
    {
      id: "BiasAuditEngine",
      name: "Bias Audit",
      icon: "🔍",
      tagline: "Bias detector",
      description: "Identifies cognitive biases affecting a decision, belief, or analysis and suggests debiasing strategies.",
      placeholder: "Describe the decision or belief you want to audit for bias",
      example: "e.g. I keep hiring people from the same two universities and think they just work harder",
      color: "#0891b2",
    },
    {
      id: "AssumptionExposureEngine",
      name: "Assumption Exposure",
      icon: "👁️",
      tagline: "Assumption architect",
      description: "Surfaces hidden assumptions in arguments, plans, and beliefs that are being treated as facts.",
      placeholder: "What argument, plan, or belief should I audit for hidden assumptions?",
      example: "e.g. Our business plan assumes remote teams are less productive than in-person — is that an assumption?",
      color: "#0e7490",
    },
    {
      id: "SecondOrderEngine",
      name: "Second Order Thinking",
      icon: "♟️",
      tagline: "Consequence architect",
      description: "Maps second and third-order consequences of decisions and actions.",
      placeholder: "What decision or action should I trace the downstream consequences of?",
      example: "e.g. If we raise prices 30%, what happens? And what happens as a result of what happens?",
      color: "#0891b2",
    },
    {
      id: "PremortemEngine",
      name: "Pre-mortem Analysis",
      icon: "🔮",
      tagline: "Failure architect",
      description: "Runs a pre-mortem on a plan — imagining it failed and working backwards to find the causes.",
      placeholder: "What plan or project should I run a pre-mortem on?",
      example: "e.g. Our plan to launch a new product in a market we've never competed in, in 6 months",
      color: "#0e7490",
    },
    {
      id: "SteelManEngine",
      name: "Steel Man Builder",
      icon: "🛡️",
      tagline: "Empathy architect",
      description: "Builds the strongest possible version of an opposing argument — better than the opponent would.",
      placeholder: "What position do you disagree with that should be steelmanned?",
      example: "e.g. The argument that social media companies should face zero government regulation",
      color: "#0891b2",
    }
  ],
};

export function CriticalThinkingCoachApp() {
  return <GenericEngineApp config={CONFIG} />;
}
