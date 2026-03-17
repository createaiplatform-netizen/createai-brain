// Auto-generated app — Item Forge
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "itemforge",
  title: "Item Forge",
  icon: "🗡️",
  color: "#d97706",
  description: "Game items, weapons, armor, consumables, and equipment design.",
  engines: [
    {
      id: "WeaponDesignEngine",
      name: "Weapon Designer",
      icon: "⚔️",
      tagline: "Weapon architect",
      description: "Designs weapons with gameplay purpose, visual identity, lore, and unique mechanical properties.",
      placeholder: "What type of weapon and what gameplay role should it fill?",
      example: "e.g. A sword that gets stronger the more it fails — its enchantment grows with defeat, not victory",
      color: "#d97706",
    },
    {
      id: "ArmorDesignEngine",
      name: "Armor Set Designer",
      icon: "🛡️",
      tagline: "Armor architect",
      description: "Designs armor sets with visual theme, protective purpose, set bonuses, and lore identity.",
      placeholder: "What type of armor and what identity should it project?",
      example: "e.g. Armor made from the shed scales of a dragon who chose to give them willingly — what does that mean mechanically?",
      color: "#b45309",
    },
    {
      id: "ConsumableDesignEngine",
      name: "Consumable Designer",
      icon: "🧪",
      tagline: "Consumable architect",
      description: "Designs potions, food, and consumable items with distinct effects and world-building flavor.",
      placeholder: "What type of game economy and what role should consumables play?",
      example: "e.g. A game where all healing is imperfect — consumables work but leave lasting effects",
      color: "#d97706",
    },
    {
      id: "LoreItemEngine",
      name: "Lore Item Designer",
      icon: "📜",
      tagline: "Lore architect",
      description: "Designs items that tell stories — flavor text, visual design, and world-building implications.",
      placeholder: "What story should this item tell through its existence?",
      example: "e.g. An ordinary-looking key that opens no door in the game world — but clearly opened something",
      color: "#b45309",
    },
    {
      id: "ItemEconomyEngine",
      name: "Item Economy",
      icon: "💰",
      tagline: "Economy architect",
      description: "Designs item economy systems — rarity, crafting, trading, and progression feel.",
      placeholder: "What game type and what should item acquisition feel like?",
      example: "e.g. An RPG where I want items to feel meaningful to find but not make the economy inflationary",
      color: "#d97706",
    }
  ],
};

export function ItemForgeApp() {
  return <GenericEngineApp config={CONFIG} />;
}
