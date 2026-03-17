// Auto-generated app — Research Assistant
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "researchassist",
  title: "Research Assistant",
  icon: "🔬",
  color: "#0369a1",
  description: "Research methodology, literature review frameworks, and academic investigation support.",
  engines: [
    {
      id: "ResearchQuestionEngine",
      name: "Research Question Designer",
      icon: "❓",
      tagline: "Question architect",
      description: "Designs focused, answerable research questions with scope, methodology alignment, and literature gap identification.",
      placeholder: "What topic are you researching and what do you want to understand?",
      example: "e.g. I want to understand how remote work affects creative collaboration in software teams",
      color: "#0369a1",
    },
    {
      id: "LiteratureReviewEngine",
      name: "Literature Review Framework",
      icon: "📚",
      tagline: "Review architect",
      description: "Designs literature review structures with search strategy, key themes, and synthesis approach.",
      placeholder: "What research question are you addressing and what field is it in?",
      example: "e.g. A literature review on the effectiveness of mindfulness interventions in clinical depression treatment",
      color: "#0284c7",
    },
    {
      id: "MethodologyEngine",
      name: "Methodology Designer",
      icon: "🧪",
      tagline: "Method architect",
      description: "Designs research methodologies — quantitative, qualitative, or mixed — with justified approach.",
      placeholder: "What is your research question and what resources do you have?",
      example: "e.g. Studying how social media use correlates with political polarization in teenagers",
      color: "#0369a1",
    },
    {
      id: "FindingsSynthesisEngine",
      name: "Findings Synthesis",
      icon: "🔗",
      tagline: "Synthesis architect",
      description: "Helps synthesize research findings into coherent insights with implications and limitations.",
      placeholder: "What did you find in your research and what patterns emerged?",
      example: "e.g. My interviews revealed 4 distinct patterns — I need help seeing what they mean together",
      color: "#0284c7",
    },
    {
      id: "AbstractEngine",
      name: "Abstract Writer",
      icon: "📄",
      tagline: "Abstract craftsman",
      description: "Writes academic abstracts with background, purpose, methods, results, and conclusions in 250 words.",
      placeholder: "Summarize your research study for me to write the abstract",
      example: "e.g. A study of nurse burnout during COVID comparing hospitals with and without peer support programs",
      color: "#0369a1",
    }
  ],
};

export function ResearchAssistantApp() {
  return <GenericEngineApp config={CONFIG} />;
}
