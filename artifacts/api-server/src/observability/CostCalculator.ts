// ═══════════════════════════════════════════════════════════════════════════
// COST CALCULATOR — Configurable per-execution cost estimation.
//
// Pricing model:
//   • tokenRatePer1k   — USD per 1 000 tokens (default: $0.002 / 1k)
//   • msRate           — USD per millisecond    (default: $0.000001 / ms)
//   • engineMultipliers — per-engine cost scalar (default: 1.0 for all)
//
// These rates are intentionally conservative defaults. Configure via
// constructor to match your actual API costs and billing model.
//
// efficiencyScore — 0 (expensive) to 1 (near-zero cost). Computed on a
// log scale so small cost differences in the cheap range don't produce
// large score swings.
//
// No container import — pure dependency, wired through bootstrap.ts.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Pricing configuration ────────────────────────────────────────────────────

export interface PricingModel {
  /** USD cost per 1 000 tokens (input + output combined approximation). */
  tokenRatePer1k:    number;

  /** USD cost per millisecond of wall-clock execution time. */
  msRate:            number;

  /**
   * Optional per-engine multipliers applied on top of base rates.
   * Example: { "InfiniteExpansionEngine": 2.5, "UniversalCreativeEngine": 1.2 }
   * Defaults to 1.0 for any engine not listed.
   */
  engineMultipliers?: Record<string, number>;
}

const DEFAULT_PRICING: PricingModel = {
  tokenRatePer1k:    0.002,       // ~$2 per 1M tokens
  msRate:            0.000_001,   // ~$1 per 1M ms (~16 min)
  engineMultipliers: {},
};

// ─── Cost result ──────────────────────────────────────────────────────────────

export interface CostResult {
  /** Estimated total cost in USD for this execution. */
  costEstimate:    number;

  /**
   * Efficiency score 0–1. Higher = cheaper / more efficient.
   * 1.0 at zero cost, approaches 0 as cost grows (log scale).
   */
  efficiencyScore: number;
}

// ─── CostCalculator ───────────────────────────────────────────────────────────

export class CostCalculator {
  private readonly pricing: PricingModel;

  constructor(pricing?: Partial<PricingModel>) {
    this.pricing = {
      tokenRatePer1k:    pricing?.tokenRatePer1k    ?? DEFAULT_PRICING.tokenRatePer1k,
      msRate:            pricing?.msRate            ?? DEFAULT_PRICING.msRate,
      engineMultipliers: {
        ...DEFAULT_PRICING.engineMultipliers,
        ...pricing?.engineMultipliers,
      },
    };
  }

  /**
   * calculate — estimate cost and efficiency for one execution.
   *
   * @param engineId    Engine ID (used to look up multiplier)
   * @param tokenUsage  Estimated token count
   * @param durationMs  Wall-clock time in milliseconds
   */
  calculate(
    engineId:   string,
    tokenUsage: number,
    durationMs: number,
  ): CostResult {
    const multiplier  = this.pricing.engineMultipliers?.[engineId] ?? 1;
    const tokenCost   = (tokenUsage / 1_000) * this.pricing.tokenRatePer1k * multiplier;
    const timeCost    = durationMs * this.pricing.msRate * multiplier;
    const costEstimate = +(tokenCost + timeCost).toFixed(8);   // round to micro-cent

    // Log-scale efficiency: 1.0 at $0, ~0.5 at $0.10, ~0 at $10+
    const efficiencyScore = Math.max(0, +(1 - Math.log10(1 + costEstimate * 1_000) / 6).toFixed(4));

    return { costEstimate, efficiencyScore };
  }

  /** pricing — expose current pricing model for inspection/logging. */
  getPricing(): Readonly<PricingModel> {
    return this.pricing;
  }
}
