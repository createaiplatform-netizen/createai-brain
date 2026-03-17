// PRODUCT ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the product suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const PRODUCT_ENGINE_IDS = [
  "ProductDiscoveryEngine",
  "UserResearchEngine",
  "JTBDEngine",
  "ProductRoadmapEngine",
  "FeaturePrioritEngine",
  "UserStoryEngine",
  "DesignSprintEngine",
  "ProductMetricsEngine",
  "UsabilityTestEngine",
  "CompProdEngine",
  "ProdLaunchEngine",
  "DesignSysEngine",
  "FeedbackLoopEngine",
  "PrototypingEngine"
];

export function getProductEngines() {
  return ALL_ENGINES.filter(e => e.category === "product");
}

export const PRODUCT_ICON = "🔭";
export const PRODUCT_COLOR = "#F97316";
