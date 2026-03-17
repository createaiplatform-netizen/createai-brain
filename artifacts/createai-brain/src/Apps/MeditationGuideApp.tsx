// Auto-generated app — Meditation Guide
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "meditationguide",
  title: "Meditation Guide",
  icon: "🧘",
  color: "#6366f1",
  description: "Meditation scripts, mindfulness practices, breathwork, and contemplative exercises.",
  engines: [
    {
      id: "GuidedMeditationEngine",
      name: "Guided Meditation Script",
      icon: "🎙️",
      tagline: "Presence architect",
      description: "Writes guided meditation scripts for any length, intention, and experience level.",
      placeholder: "What is the meditation's purpose and how long should it be?",
      example: "e.g. A 10-minute anxiety relief meditation for someone who has never meditated before",
      color: "#6366f1",
    },
    {
      id: "BreathworkEngine",
      name: "Breathwork Protocol",
      icon: "💨",
      tagline: "Breath architect",
      description: "Designs evidence-based breathwork protocols for specific goals — calm, energy, focus, or sleep.",
      placeholder: "What is the goal of this breathwork practice?",
      example: "e.g. A breathwork protocol to use before a high-stakes presentation",
      color: "#4f46e5",
    },
    {
      id: "BodyScanEngine",
      name: "Body Scan Script",
      icon: "🧬",
      tagline: "Soma architect",
      description: "Writes detailed body scan meditation scripts for stress relief and somatic awareness.",
      placeholder: "What is the context and how long should the body scan be?",
      example: "e.g. A 15-minute body scan for people recovering from chronic pain",
      color: "#6366f1",
    },
    {
      id: "LovingKindnessEngine",
      name: "Loving-Kindness Script",
      icon: "💙",
      tagline: "Compassion architect",
      description: "Writes loving-kindness (metta) meditation scripts in traditional and contemporary forms.",
      placeholder: "Who should the practice focus on and what is the practitioner's situation?",
      example: "e.g. A loving-kindness meditation for someone struggling to forgive a family member",
      color: "#4f46e5",
    },
    {
      id: "MindfulnessPracticeEngine",
      name: "Mindfulness Practice",
      icon: "🌸",
      tagline: "Presence architect",
      description: "Designs daily mindfulness practices embedded in ordinary activities — not requiring separate meditation time.",
      placeholder: "What is the person's daily routine and what moments could become mindfulness practices?",
      example: "e.g. A busy parent with two children who has 0 minutes for formal practice",
      color: "#6366f1",
    }
  ],
};

export function MeditationGuideApp() {
  return <GenericEngineApp config={CONFIG} />;
}
