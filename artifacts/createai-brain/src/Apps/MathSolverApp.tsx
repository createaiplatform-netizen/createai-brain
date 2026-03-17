// Auto-generated app — Math Solver
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "mathsolver",
  title: "Math Solver",
  icon: "🔢",
  color: "#7c3aed",
  description: "Mathematical problem solving, proof construction, and mathematical intuition building.",
  engines: [
    {
      id: "ProblemSolvingEngine",
      name: "Problem Solver",
      icon: "✏️",
      tagline: "Solution architect",
      description: "Solves mathematical problems step-by-step with full explanation of each step's reasoning.",
      placeholder: "What mathematical problem do you need solved?",
      example: "e.g. Find all prime factors of 2,310 and explain why the method works",
      color: "#7c3aed",
    },
    {
      id: "ConceptIntuitionEngine",
      name: "Mathematical Intuition",
      icon: "💡",
      tagline: "Intuition builder",
      description: "Builds mathematical intuition for abstract concepts using visual, geometric, and concrete explanations.",
      placeholder: "What mathematical concept feels abstract and needs intuitive grounding?",
      example: "e.g. Why does imaginary number i make sense and what does it actually mean geometrically?",
      color: "#6d28d9",
    },
    {
      id: "ProofConstructionEngine",
      name: "Proof Constructor",
      icon: "📐",
      tagline: "Proof architect",
      description: "Constructs mathematical proofs with clear logical steps, justified transitions, and conclusion.",
      placeholder: "What theorem or statement needs to be proved?",
      example: "e.g. Prove that the square root of 2 is irrational using proof by contradiction",
      color: "#7c3aed",
    },
    {
      id: "MathHistoryEngine",
      name: "Math History",
      icon: "📜",
      tagline: "History architect",
      description: "Traces the history of mathematical ideas — who discovered them, the context, and why they mattered.",
      placeholder: "What mathematical concept or branch should I trace historically?",
      example: "e.g. The history of the concept of zero and what civilizations had it before others",
      color: "#6d28d9",
    },
    {
      id: "ApplicationMathEngine",
      name: "Real-World Application",
      icon: "🌍",
      tagline: "Application architect",
      description: "Shows where a mathematical concept appears in the real world and why it matters practically.",
      placeholder: "What mathematical concept should I trace through real-world applications?",
      example: "e.g. Where does linear algebra appear in machine learning, physics, and economics?",
      color: "#7c3aed",
    }
  ],
};

export function MathSolverApp() {
  return <GenericEngineApp config={CONFIG} />;
}
