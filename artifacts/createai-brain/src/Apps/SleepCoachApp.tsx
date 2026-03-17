// Auto-generated app — Sleep Coach
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "sleepcoach",
  title: "Sleep Coach",
  icon: "🌙",
  color: "#4f46e5",
  description: "Sleep optimization, insomnia strategies, sleep hygiene, and circadian rhythm coaching.",
  engines: [
    {
      id: "SleepHygieneEngine",
      name: "Sleep Hygiene Designer",
      icon: "🛏️",
      tagline: "Sleep architect",
      description: "Designs personalized sleep hygiene protocols based on specific sleep challenges.",
      placeholder: "What are your sleep problems and what does your current routine look like?",
      example: "e.g. Take 1-2 hours to fall asleep, phone in bed, work stress, irregular schedule on weekends",
      color: "#4f46e5",
    },
    {
      id: "InsomniaEngine",
      name: "Insomnia Protocol",
      icon: "🌙",
      tagline: "Insomnia architect",
      description: "Designs evidence-based insomnia interventions using CBT-I principles.",
      placeholder: "What type of insomnia do you experience and how long has it been happening?",
      example: "e.g. Wake at 3am and can't get back to sleep — this has been happening for 6 months",
      color: "#3730a3",
    },
    {
      id: "CircadianEngine",
      name: "Circadian Rhythm Optimizer",
      icon: "☀️",
      tagline: "Rhythm architect",
      description: "Designs circadian rhythm optimization strategies — light exposure, timing, and temperature.",
      placeholder: "What is your target wake and sleep time and what is your current pattern?",
      example: "e.g. Need to wake at 5:30am for work but naturally want to sleep until 8am and stay up until midnight",
      color: "#4f46e5",
    },
    {
      id: "NapStrategyEngine",
      name: "Nap Strategy",
      icon: "💤",
      tagline: "Recovery architect",
      description: "Designs optimal napping strategies that improve performance without disrupting night sleep.",
      placeholder: "What is your schedule and what are you trying to achieve with napping?",
      example: "e.g. I work night shifts 3 days a week and need to be mentally sharp — how should I nap?",
      color: "#3730a3",
    },
    {
      id: "SleepEnvironmentEngine",
      name: "Sleep Environment",
      icon: "🏠",
      tagline: "Environment architect",
      description: "Designs the optimal sleep environment — temperature, light, sound, and bedding recommendations.",
      placeholder: "What does your current sleep environment look like and what disrupts your sleep?",
      example: "e.g. Light sleeper, partner snores, urban apartment with street noise and neighbor's TV",
      color: "#4f46e5",
    }
  ],
};

export function SleepCoachApp() {
  return <GenericEngineApp config={CONFIG} />;
}
