// Auto-generated app — Prompt Engineer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "promptengineer",
  title: "Prompt Engineer",
  icon: "🤖",
  color: "#6366f1",
  description: "AI prompt design, chain-of-thought, system prompts, and prompt optimization.",
  engines: [
    {
      id: "SystemPromptEngine",
      name: "System Prompt Designer",
      icon: "⚙️",
      tagline: "Persona architect",
      description: "Designs system prompts that reliably shape AI behavior — persona, constraints, and output format.",
      placeholder: "What AI role or behavior do you need a system prompt for?",
      example: "e.g. A system prompt for a customer service AI that stays helpful even with hostile users",
      color: "#6366f1",
    },
    {
      id: "ChainOfThoughtEngine",
      name: "Chain of Thought Builder",
      icon: "🔗",
      tagline: "Reasoning architect",
      description: "Designs chain-of-thought prompt structures that improve AI reasoning on complex problems.",
      placeholder: "What complex problem needs better AI reasoning?",
      example: "e.g. A prompt that gets AI to analyze legal contracts for hidden liability without missing nuances",
      color: "#4f46e5",
    },
    {
      id: "FewShotEngine",
      name: "Few-Shot Example Designer",
      icon: "📚",
      tagline: "Example architect",
      description: "Designs high-quality few-shot examples that reliably calibrate AI output style and quality.",
      placeholder: "What output format and quality level do you need to calibrate?",
      example: "e.g. I need 3 examples that teach the AI to write product descriptions in my brand's specific voice",
      color: "#6366f1",
    },
    {
      id: "PromptAuditEngine",
      name: "Prompt Auditor",
      icon: "🔍",
      tagline: "Quality auditor",
      description: "Audits existing prompts for failure modes, ambiguity, and manipulation vulnerabilities.",
      placeholder: "Describe or paste the prompt you want audited",
      example: "e.g. My chatbot prompt keeps being convinced to break its rules by users who frame requests as hypotheticals",
      color: "#4f46e5",
    },
    {
      id: "OutputFormatEngine",
      name: "Output Format Designer",
      icon: "📋",
      tagline: "Format architect",
      description: "Designs structured output formats — JSON, markdown, tables — that AI reliably produces.",
      placeholder: "What data structure does your application need from the AI?",
      example: "e.g. I need AI to always return structured character profiles in valid JSON with specific fields",
      color: "#6366f1",
    }
  ],
};

export function PromptEngineerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
