// Auto-generated app — Essay Writer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "essaywriter",
  title: "Essay Writer",
  icon: "📝",
  color: "#0369a1",
  description: "Academic, persuasive, and analytical essay writing — from thesis to conclusion.",
  engines: [
    {
      id: "ThesisBuilderEngine",
      name: "Thesis Builder",
      icon: "🎯",
      tagline: "Argument architect",
      description: "Constructs clear, defensible, specific thesis statements and argument maps.",
      placeholder: "What essay topic or question do you need to argue?",
      example: "e.g. Whether universal basic income would increase or decrease economic innovation",
      color: "#0369a1",
    },
    {
      id: "ArgumentStructureEngine",
      name: "Argument Structure",
      icon: "📐",
      tagline: "Logic architect",
      description: "Designs the logical structure of an essay — claim, evidence, reasoning, counterargument.",
      placeholder: "What is your main argument and who are you arguing against?",
      example: "e.g. Arguing that social media improves political participation despite increasing polarization",
      color: "#0284c7",
    },
    {
      id: "IntroductionEngine",
      name: "Essay Introduction",
      icon: "🚪",
      tagline: "Entry architect",
      description: "Writes essay introductions with hook, context, and thesis that demand to be read.",
      placeholder: "What is the essay's topic and thesis?",
      example: "e.g. An essay arguing that the industrial revolution caused more psychological damage than historians credit",
      color: "#0369a1",
    },
    {
      id: "EvidenceWeaveEngine",
      name: "Evidence Weaver",
      icon: "🔗",
      tagline: "Source integrator",
      description: "Integrates evidence, quotations, and citations smoothly into analytical prose.",
      placeholder: "What point are you making and what evidence supports it?",
      example: "e.g. Using Foucault's surveillance theory to analyze social media's self-censorship effect",
      color: "#0284c7",
    },
    {
      id: "CounterargumentEngine",
      name: "Counterargument Handler",
      icon: "⚖️",
      tagline: "Devil's advocate",
      description: "Generates strong counterarguments and models how to address and refute them.",
      placeholder: "What is your thesis and what might opponents say?",
      example: "e.g. My thesis argues for nuclear power expansion — what are the strongest objections?",
      color: "#0369a1",
    },
    {
      id: "ConclusionEngine",
      name: "Essay Conclusion",
      icon: "🏁",
      tagline: "Landing craftsman",
      description: "Writes conclusions that synthesize the argument, elevate the stakes, and leave an impression.",
      placeholder: "Summarize your essay's argument for me to conclude it",
      example: "e.g. An essay arguing that privacy is now a luxury good only wealthy people can afford",
      color: "#0284c7",
    }
  ],
};

export function EssayWriterApp() {
  return <GenericEngineApp config={CONFIG} />;
}
