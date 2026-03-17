// Auto-generated app — Parenting Guide
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "parentingguide",
  title: "Parenting Guide",
  icon: "👨‍👩‍👧",
  color: "#d97706",
  description: "Parenting strategies, child development, discipline alternatives, and family communication.",
  engines: [
    {
      id: "DevelopmentStageEngine",
      name: "Child Development Guide",
      icon: "👶",
      tagline: "Development architect",
      description: "Explains developmental stages with age-appropriate expectations, challenges, and support strategies.",
      placeholder: "What age is your child and what behavior or challenge are you navigating?",
      example: "e.g. My 4-year-old has massive tantrums in public and I don't know if this is normal or something else",
      color: "#d97706",
    },
    {
      id: "DisciplineAlternativesEngine",
      name: "Discipline Alternatives",
      icon: "❤️",
      tagline: "Connection architect",
      description: "Designs positive discipline strategies that teach rather than punish — connected and effective.",
      placeholder: "What behavior are you trying to address and what have you tried?",
      example: "e.g. My 7-year-old hits when frustrated — timeouts aren't working and I don't want to escalate",
      color: "#b45309",
    },
    {
      id: "ConversationGuideEngine",
      name: "Difficult Conversation Guide",
      icon: "💬",
      tagline: "Conversation architect",
      description: "Guides age-appropriate conversations on difficult topics — death, divorce, race, sex, danger.",
      placeholder: "What topic do you need to discuss with your child and how old are they?",
      example: "e.g. My 8-year-old asked why their classmate's family doesn't look like ours",
      color: "#d97706",
    },
    {
      id: "TransitionSupportEngine",
      name: "Transition Support",
      icon: "🌱",
      tagline: "Transition architect",
      description: "Designs support strategies for major child transitions — new sibling, school, divorce, moving.",
      placeholder: "What transition is your child facing and what are the signs of struggle?",
      example: "e.g. New baby coming in 2 months and my 3-year-old already seems more clingy and regressive",
      color: "#b45309",
    },
    {
      id: "ScreenTimeEngine",
      name: "Screen Time Strategy",
      icon: "📱",
      tagline: "Balance architect",
      description: "Designs balanced, guilt-free screen time strategies appropriate for each developmental stage.",
      placeholder: "What ages are your children and what are your current screen time struggles?",
      example: "e.g. 6 and 9-year-olds who escalate into meltdowns when screens are turned off",
      color: "#d97706",
    }
  ],
};

export function ParentingGuideApp() {
  return <GenericEngineApp config={CONFIG} />;
}
