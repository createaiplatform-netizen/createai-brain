// Auto-generated app — Science Explainer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "scienceexplainer",
  title: "Science Explainer",
  icon: "🔭",
  color: "#0369a1",
  description: "Scientific concepts, experiments, discoveries, and the history of science.",
  engines: [
    {
      id: "ConceptExplainEngine",
      name: "Science Concept Explainer",
      icon: "💡",
      tagline: "Clarity architect",
      description: "Explains scientific concepts with accuracy, clarity, and appropriate depth for any audience.",
      placeholder: "What scientific concept needs a clear explanation?",
      example: "e.g. How CRISPR gene editing works and why it's considered both revolutionary and dangerous",
      color: "#0369a1",
    },
    {
      id: "ExperimentDesignEngine",
      name: "Experiment Designer",
      icon: "🧪",
      tagline: "Method architect",
      description: "Designs scientific experiments with hypothesis, controls, variables, and interpretation.",
      placeholder: "What scientific question should I design an experiment to test?",
      example: "e.g. Designing an experiment to test whether plants grow faster with music in the room",
      color: "#0284c7",
    },
    {
      id: "ScienceHistoryEngine",
      name: "Science History",
      icon: "📜",
      tagline: "History architect",
      description: "Traces the history of a scientific discovery — who found it, how, and what resistance it faced.",
      placeholder: "What scientific discovery or revolution should I trace historically?",
      example: "e.g. The history of germ theory — from Pasteur and Lister to the resistance they faced from the medical establishment",
      color: "#0369a1",
    },
    {
      id: "ScientificDebateEngine",
      name: "Scientific Debate",
      icon: "⚖️",
      tagline: "Debate architect",
      description: "Maps current scientific debates — what is consensus, what is contested, and why.",
      placeholder: "What scientific question has active debate or multiple schools of thought?",
      example: "e.g. The debate about whether dark matter exists or whether MOND theory is correct",
      color: "#0284c7",
    },
    {
      id: "ScienceFictionScienceEngine",
      name: "Science in Fiction",
      icon: "🚀",
      tagline: "Reality-checker",
      description: "Analyzes the science in science fiction — what's accurate, what's plausible, and what's impossible.",
      placeholder: "What sci-fi concept, technology, or scenario should I analyze scientifically?",
      example: "e.g. How realistic is the terraforming of Mars as depicted in The Martian?",
      color: "#0369a1",
    }
  ],
};

export function ScienceExplainerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
