// Auto-generated app — Philosophy Explorer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "philosophyexplorer",
  title: "Philosophy Explorer",
  icon: "🦉",
  color: "#4f46e5",
  description: "Philosophical traditions, ethical frameworks, thought experiments, and applied ethics.",
  engines: [
    {
      id: "EthicalFrameworkEngine",
      name: "Ethical Framework Analyzer",
      icon: "⚖️",
      tagline: "Ethics architect",
      description: "Analyzes a moral question through consequentialist, deontological, virtue, and care ethics frameworks.",
      placeholder: "What ethical dilemma or question should I analyze?",
      example: "e.g. Is it ethical to use AI to predict which employees will quit and preemptively lay them off?",
      color: "#4f46e5",
    },
    {
      id: "ThoughtExperimentEngine",
      name: "Thought Experiment Designer",
      icon: "🧪",
      tagline: "Experiment architect",
      description: "Designs philosophical thought experiments that reveal intuitions and test moral principles.",
      placeholder: "What moral principle or intuition do you want to test?",
      example: "e.g. Design a thought experiment that tests whether the value of a life can be quantified",
      color: "#3730a3",
    },
    {
      id: "PhilosophyHistoryEngine",
      name: "Philosophy History",
      icon: "📜",
      tagline: "Tradition architect",
      description: "Traces the history of a philosophical question from ancient to contemporary thinkers.",
      placeholder: "What philosophical question or concept should I trace through history?",
      example: "e.g. How have philosophers understood personal identity from Locke through to Parfit and Dennett?",
      color: "#4f46e5",
    },
    {
      id: "AppliedEthicsEngine",
      name: "Applied Ethics",
      icon: "🏥",
      tagline: "Application architect",
      description: "Applies philosophical ethics to real-world professional dilemmas — medical, legal, business, tech.",
      placeholder: "What real-world ethical dilemma needs philosophical analysis?",
      example: "e.g. A doctor who can save 10 patients using resources that would save one specific patient they know personally",
      color: "#3730a3",
    },
    {
      id: "SocraticDialogueEngine",
      name: "Socratic Dialogue",
      icon: "💬",
      tagline: "Dialogue architect",
      description: "Designs Socratic dialogues that explore a philosophical question through question and answer.",
      placeholder: "What question or belief should the Socratic dialogue explore?",
      example: "e.g. A dialogue about whether justice is the same thing as what the powerful decide",
      color: "#4f46e5",
    }
  ],
};

export function PhilosophyExplorerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
