// Auto-generated app — Mental Health Support
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "mentalhealth",
  title: "Mental Health Support",
  icon: "💙",
  color: "#6366f1",
  description: "Mental health education, CBT tools, coping strategies, and emotional resilience building.",
  engines: [
    {
      id: "CopingStrategyEngine",
      name: "Coping Strategy Designer",
      icon: "🛡️",
      tagline: "Coping architect",
      description: "Designs personalized coping strategies for anxiety, stress, and emotional overwhelm.",
      placeholder: "What mental health challenge are you navigating and what has worked before?",
      example: "e.g. Anxiety that spikes before big events — I know it's coming but don't know how to prepare",
      color: "#6366f1",
    },
    {
      id: "CBTEngine",
      name: "CBT Tool Designer",
      icon: "🧠",
      tagline: "CBT architect",
      description: "Designs CBT exercises — thought records, behavioral experiments, and cognitive restructuring.",
      placeholder: "What thought pattern or behavior is getting in the way?",
      example: "e.g. I catastrophize when projects go slightly wrong — my mind jumps to the worst possible outcome",
      color: "#4f46e5",
    },
    {
      id: "ResilienceEngine",
      name: "Resilience Builder",
      icon: "🌱",
      tagline: "Resilience architect",
      description: "Designs resilience-building practices for navigating chronic difficulty and recovering from setbacks.",
      placeholder: "What difficult circumstance are you building resilience for?",
      example: "e.g. A period of grief while still needing to show up for work and my family",
      color: "#6366f1",
    },
    {
      id: "AnxietyToolkitEngine",
      name: "Anxiety Toolkit",
      icon: "🧰",
      tagline: "Toolkit architect",
      description: "Builds a personalized anxiety management toolkit with immediate and long-term strategies.",
      placeholder: "What type of anxiety do you experience and in what situations?",
      example: "e.g. Social anxiety that is specific to professional settings — fine with friends, paralyzed in meetings",
      color: "#4f46e5",
    },
    {
      id: "MindfulSelfCompassionEngine",
      name: "Self-Compassion Practice",
      icon: "💗",
      tagline: "Compassion architect",
      description: "Designs self-compassion practices drawn from MSC research for people who are hard on themselves.",
      placeholder: "What situation or pattern calls for more self-compassion?",
      example: "e.g. I am relentlessly self-critical after any mistake and it takes days to recover my confidence",
      color: "#6366f1",
    }
  ],
};

export function MentalHealthSupportApp() {
  return <GenericEngineApp config={CONFIG} />;
}
