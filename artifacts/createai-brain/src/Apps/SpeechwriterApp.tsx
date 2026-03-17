// Auto-generated app — Speechwriter
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "speechwriter",
  title: "Speechwriter",
  icon: "🎤",
  color: "#0891b2",
  description: "Speeches, toasts, keynotes, commencement addresses, and public remarks.",
  engines: [
    {
      id: "KeynoteEngine",
      name: "Keynote Speech",
      icon: "🎤",
      tagline: "Keynote architect",
      description: "Writes complete keynote speeches with opening story, key points, and memorable close.",
      placeholder: "What is the occasion, audience, and core message?",
      example: "e.g. A CEO keynote to 500 employees after a difficult year that ended with breakthrough success",
      color: "#0891b2",
    },
    {
      id: "ToastEngine",
      name: "Toast Writer",
      icon: "🥂",
      tagline: "Toast craftsman",
      description: "Writes wedding toasts, retirement speeches, and celebration remarks — warm, personal, and precise.",
      placeholder: "Who is the toast for, what is the occasion, and what do you want to say?",
      example: "e.g. A best man toast that roasts the groom lovingly without embarrassing him in front of his parents",
      color: "#0e7490",
    },
    {
      id: "MotivationalSpeechEngine",
      name: "Motivational Speech",
      icon: "🔥",
      tagline: "Inspiration architect",
      description: "Writes motivational speeches with emotional arc, story, and call to action.",
      placeholder: "Who is the audience and what should they feel moved to do?",
      example: "e.g. A speech to first-generation college graduates about not losing where they came from",
      color: "#0891b2",
    },
    {
      id: "CommencementEngine",
      name: "Commencement Address",
      icon: "🎓",
      tagline: "Wisdom architect",
      description: "Writes graduation commencement addresses — wise, warm, and forward-looking.",
      placeholder: "What is the institution, class year, and theme you want to address?",
      example: "e.g. A commencement for nursing graduates who trained during the pandemic and are now exhausted",
      color: "#0e7490",
    },
    {
      id: "PublicApologyEngine",
      name: "Apology & Accountability",
      icon: "🙏",
      tagline: "Integrity architect",
      description: "Writes genuine public apologies and accountability statements — no deflection, no excuses.",
      placeholder: "What happened and what does genuine accountability look like here?",
      example: "e.g. A public apology from an organization that failed its employees during a crisis",
      color: "#0891b2",
    }
  ],
};

export function SpeechwriterApp() {
  return <GenericEngineApp config={CONFIG} />;
}
