// Auto-generated app — Dystopia Builder
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "dystopia",
  title: "Dystopia Builder",
  icon: "🏭",
  color: "#475569",
  description: "Dystopian world design — systems of control, resistance, collapse, and moral complexity.",
  engines: [
    {
      id: "ControlSystemEngine",
      name: "Control System",
      icon: "👁️",
      tagline: "Oppression architect",
      description: "Designs how the dystopian government maintains control — surveillance, propaganda, scarcity, fear.",
      placeholder: "What type of government or system controls this dystopia?",
      example: "e.g. A corporation that controls all food production and uses nutrition access as social credit",
      color: "#475569",
    },
    {
      id: "DystopiaOriginEngine",
      name: "Dystopia Origin",
      icon: "📅",
      tagline: "History architect",
      description: "Designs the historical path from our world to this dystopia — what choices led here.",
      placeholder: "What kind of dystopia is this and when does it take place?",
      example: "e.g. A society where climate catastrophe led to an 'emergency government' that never relinquished power",
      color: "#334155",
    },
    {
      id: "ResistanceEngine",
      name: "Resistance Movement",
      icon: "✊",
      tagline: "Resistance architect",
      description: "Designs underground resistance movements — structure, methods, ideology, and betrayal dynamics.",
      placeholder: "Who is resisting the system and why haven't they been crushed?",
      example: "e.g. A resistance movement that hides in plain sight by appearing to be a religious charity",
      color: "#475569",
    },
    {
      id: "DystopiaEverydayEngine",
      name: "Everyday Life",
      icon: "🏘️",
      tagline: "Daily life architect",
      description: "Designs what daily life actually looks like for ordinary citizens — survival, pleasure, and compromise.",
      placeholder: "What class of people and daily context do you want to explore?",
      example: "e.g. A middle-class family in a surveillance state who genuinely believe they have nothing to hide",
      color: "#334155",
    },
    {
      id: "DystopiaFallEngine",
      name: "Dystopia's Cracks",
      icon: "🔓",
      tagline: "Vulnerability architect",
      description: "Identifies the systemic weaknesses, contradictions, and cracks that could bring the dystopia down.",
      placeholder: "Describe the dystopian system and how it maintains power",
      example: "e.g. A society that needs creative thinkers to maintain the AI systems that surveil and control people",
      color: "#475569",
    }
  ],
};

export function DystopiaBuilderApp() {
  return <GenericEngineApp config={CONFIG} />;
}
