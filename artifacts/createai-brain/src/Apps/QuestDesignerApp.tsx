// Auto-generated app — Quest Designer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "questdesigner",
  title: "Quest Designer",
  icon: "⚔️",
  color: "#dc2626",
  description: "Quest and mission design, narrative objectives, rewards, and player motivation.",
  engines: [
    {
      id: "MainQuestEngine",
      name: "Main Quest Designer",
      icon: "⚔️",
      tagline: "Epic architect",
      description: "Designs main story quest lines with narrative beats, player choices, and branching consequences.",
      placeholder: "What is the game's story and what is the main quest about?",
      example: "e.g. Main quest for an RPG where the hero discovers they were created to destroy the world they're trying to save",
      color: "#dc2626",
    },
    {
      id: "SideQuestEngine",
      name: "Side Quest Designer",
      icon: "🗺️",
      tagline: "Side story architect",
      description: "Designs compelling side quests with meaningful stories, unexpected twists, and memorable characters.",
      placeholder: "What world and tone does this side quest inhabit?",
      example: "e.g. A side quest in a dark fantasy game involving an old lighthouse keeper who may have caused a shipwreck",
      color: "#b91c1c",
    },
    {
      id: "QuestObjectiveEngine",
      name: "Quest Objective Designer",
      icon: "🎯",
      tagline: "Objective architect",
      description: "Designs diverse quest objectives beyond 'kill X' or 'fetch Y' — with player agency and emergent possibility.",
      placeholder: "What gameplay systems does your game have?",
      example: "e.g. A stealth RPG where I want objectives that can be solved with violence, diplomacy, or deception",
      color: "#dc2626",
    },
    {
      id: "RewardSystemEngine",
      name: "Reward System Designer",
      icon: "🏆",
      tagline: "Reward architect",
      description: "Designs intrinsic and extrinsic reward systems that maintain motivation and avoid feeling grindy.",
      placeholder: "What type of game and player motivation are you designing for?",
      example: "e.g. An open-world RPG where I want players to feel rewarded without making money meaningless",
      color: "#b91c1c",
    },
    {
      id: "FailureStateEngine",
      name: "Failure State Designer",
      icon: "💀",
      tagline: "Failure architect",
      description: "Designs meaningful failure states that teach, motivate, and don't frustrate.",
      placeholder: "What is the game type and what should failure feel like?",
      example: "e.g. A strategy game where losing a campaign should feel tragic but also fair and instructive",
      color: "#dc2626",
    }
  ],
};

export function QuestDesignerApp() {
  return <GenericEngineApp config={CONFIG} />;
}
