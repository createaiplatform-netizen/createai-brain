// FINANCE ENGINE MODULE — CreateAI Brain
// Provides system prompt and series definitions for the finance suite.
import { ALL_ENGINES } from "./CapabilityEngine";

export const FINANCE_ENGINE_IDS = [
  "FinancialModelEngine",
  "RevenueRecEngine",
  "CashFlowEngine",
  "InvestmentThesisEngine",
  "FundraisingEngine",
  "TaxStrategyEngine",
  "EquityStructureEngine",
  "UnitEconomicsEngine",
  "MAEngine",
  "BudgetingEngine",
  "IPOReadinessEngine",
  "GrantWritingEngine",
  "CryptoFinanceEngine",
  "DebtStructureEngine",
  "FPAEngine",
  "TreasuryEngine",
  "InsuranceStrategyEngine"
];

export function getFinanceEngines() {
  return ALL_ENGINES.filter(e => e.category === "finance");
}

export const FINANCE_ICON = "📈";
export const FINANCE_COLOR = "#16A34A";
