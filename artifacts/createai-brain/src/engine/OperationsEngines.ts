// OPERATIONS ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the operations suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const OPERATIONS_ENGINE_IDS = [
  "SupplyChainEngine",
  "InventoryEngine",
  "QualityMgmtEngine",
  "ProcessMiningEngine",
  "LogisticsEngine",
  "ProcurementEngine",
  "VendorMgmtEngine",
  "LeanSixSigmaEngine",
  "ChangeManagementEngine",
  "BCPEngine",
  "KPIFrameworkEngine",
  "WorkflowAutoEngine",
  "CapacityPlanEngine",
  "OKREngine",
  "FieldOpsEngine",
  "FacilitiesEngine",
  "OpExEngine"
];

export function getOperationsEngines() {
  return ALL_ENGINES.filter(e => e.category === "operations");
}

export const OPERATIONS_ICON = "🔗";
export const OPERATIONS_COLOR = "#F59E0B";
