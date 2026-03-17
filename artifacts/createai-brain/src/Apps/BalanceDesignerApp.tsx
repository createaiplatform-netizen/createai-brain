// Auto-generated app — Balance Designer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "balancedesigner",
  title: "Balance Designer",
  icon: "⚖️",
  color: "#0369a1",
  description: "Game balance, tuning, difficulty curves, and systemic design.",
  engines: [
    {
      id: "DifficultyEngine",
      name: "Difficulty Curve Designer",
      icon: "📈",
      tagline: "Difficulty architect",
      description: "Designs difficulty curves that challenge without frustrating — rubber-banding, scaling, and pacing.",
      placeholder: "What type of game and what should the difficulty experience feel like?",
      example: "e.g. An action game where veterans feel challenged but new players can still experience the story",
      color: "#0369a1",
    },
    {
      id: "NumbersBalanceEngine",
      name: "Numbers Tuning",
      icon: "🔢",
      tagline: "Tuning architect",
      description: "Designs numerical balance frameworks for damage, health, progression, and economy.",
      placeholder: "What game system needs numerical tuning and what is the current imbalance?",
      example: "e.g. Players are all choosing the same build because magic deals 3x more damage than physical attacks",
      color: "#0284c7",
    },
    {
      id: "ProgressionSystemEngine",
      name: "Progression System",
      icon: "⬆️",
      tagline: "Progression architect",
      description: "Designs player progression systems — XP curves, power gates, and meaningful upgrade choices.",
      placeholder: "What is the game's progression fantasy and how long should it take?",
      example: "e.g. An RPG where players should feel power growth across 40 hours without any single upgrade feeling mandatory",
      color: "#0369a1",
    },
    {
      id: "MultiplayerBalanceEngine",
      name: "Multiplayer Balance",
      icon: "👥",
      tagline: "Balance architect",
      description: "Designs multiplayer balance considerations — competitive integrity, counterplay, and dominant strategies.",
      placeholder: "What multiplayer game and what imbalances exist between options or characters?",
      example: "e.g. In my fighting game, high-speed characters are winning 70% of ranked matches — is it speed or something else?",
      color: "#0284c7",
    },
    {
      id: "EconomyBalanceEngine",
      name: "Game Economy Balance",
      icon: "💰",
      tagline: "Economy architect",
      description: "Designs and balances in-game economies — currency sinks, sources, inflation prevention, and meaningful choices.",
      placeholder: "What is the game's economy and what problems are you trying to prevent?",
      example: "e.g. My crafting game always ends up with players hoarding one resource and ignoring everything else",
      color: "#0369a1",
    }
  ],
};

export function BalanceDesignerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
