// Auto-generated app — Debate Prep
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "debateprep",
  title: "Debate Prep",
  icon: "🎤",
  color: "#dc2626",
  description: "Argument construction, rebuttal preparation, logical analysis, and debate strategy.",
  engines: [
    {
      id: "ArgumentBuilderEngine",
      name: "Argument Builder",
      icon: "⚡",
      tagline: "Logic architect",
      description: "Constructs the strongest possible argument for a position with premises, evidence, and reasoning.",
      placeholder: "What position do you need to argue and who are you arguing against?",
      example: "e.g. Arguing that algorithmic hiring tools increase bias rather than reduce it",
      color: "#dc2626",
    },
    {
      id: "RebuttalEngine",
      name: "Rebuttal Strategist",
      icon: "🛡️",
      tagline: "Counter-attack architect",
      description: "Anticipates opponent arguments and designs targeted rebuttals for each.",
      placeholder: "What position are you defending and what will opponents say?",
      example: "e.g. Defending mandatory paid parental leave against business cost objections",
      color: "#b91c1c",
    },
    {
      id: "FallacyDetectorEngine",
      name: "Fallacy Detector",
      icon: "🔍",
      tagline: "Logic auditor",
      description: "Identifies logical fallacies in arguments and explains how to exploit or fix them.",
      placeholder: "Describe or paste the argument you want analyzed for fallacies",
      example: "e.g. 'Violent video games cause violence — crime increased the same year gaming became mainstream'",
      color: "#dc2626",
    },
    {
      id: "SocraticQuestionEngine",
      name: "Socratic Questions",
      icon: "🤔",
      tagline: "Question architect",
      description: "Generates Socratic questions that expose hidden assumptions and weaken opponent positions.",
      placeholder: "What claim or position do you want to challenge Socratically?",
      example: "e.g. A claim that free markets always produce optimal social outcomes",
      color: "#b91c1c",
    },
    {
      id: "DebateStrategyEngine",
      name: "Debate Strategy",
      icon: "♟️",
      tagline: "Strategy architect",
      description: "Designs debate strategy — opening, middle, and closing — with psychological and rhetorical moves.",
      placeholder: "What is the debate topic, format, and your assigned position?",
      example: "e.g. Oxford-style debate, arguing that universal basic income is harmful — 8-minute opening",
      color: "#dc2626",
    }
  ],
};

export function DebatePrepApp() {
  return <GenericEngineApp config={CONFIG} />;
}
