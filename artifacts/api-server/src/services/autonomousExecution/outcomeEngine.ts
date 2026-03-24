// ═══════════════════════════════════════════════════════════════════════════
// outcomeEngine.ts  —  TOP LAYER
// Receives goal + context.
// Generates strategy → selects engines → executes → validates → retries.
// Logs every step. Returns full execution result.
// ═══════════════════════════════════════════════════════════════════════════

import { planOutcome, type ExecutionPlan, type PlanStep } from "./strategyPlanner";
import { selectPrimaryEngine, selectFallbackEngine } from "./engineSelector";
import { gatedAICall } from "./aiGatekeeper";
import { recordEngineResult, recordOutcomeResult } from "./feedbackStore";

// ── Result types ──────────────────────────────────────────────────────────

export interface StepResult {
  stepIndex:    number;
  description:  string;
  capability:   string;
  engineUsed:   string;
  success:      boolean;
  output:       string;
  source:       "template" | "cache" | "deterministic" | "ai";
  durationMs:   number;
  retried:      boolean;
  fallbackUsed: boolean;
  logs:         string[];
}

export interface OutcomeResult {
  outcomeId:    string;
  goal:         string;
  plan:         ExecutionPlan;
  success:      boolean;
  steps:        StepResult[];
  enginesUsed:  string[];
  aiCallCount:  number;
  tokensSaved:  number;
  totalMs:      number;
  summary:      string;
  error?:       string;
}

// ── Step executor ─────────────────────────────────────────────────────────

async function executeStep(
  step: PlanStep,
  goal: string,
): Promise<StepResult> {
  const logs: string[] = [];
  const t0 = Date.now();
  let fallbackUsed = false;
  let retried = false;

  logs.push(`[Step ${step.stepIndex}] Starting: ${step.description}`);
  logs.push(`[Step ${step.stepIndex}] Capability: ${step.capability}`);

  // Select primary engine
  const primary = await selectPrimaryEngine(step.capability, step.context);
  let engineId = primary?.engineId ?? "ai-gatekeeper";
  logs.push(`[Step ${step.stepIndex}] Engine selected: ${engineId} (score: ${primary?.score?.toFixed(2) ?? "n/a"})`);

  // Execute via AI gatekeeper (checks templates → cache → deterministic → AI)
  let gkResult = await gatedAICall(step.capability, step.context, goal);
  logs.push(`[Step ${step.stepIndex}] Source: ${gkResult.source} | TokensSaved: ${gkResult.tokensSaved}`);

  const success = gkResult.output.length > 10;

  if (!success) {
    // Retry with fallback engine
    retried = true;
    logs.push(`[Step ${step.stepIndex}] Primary attempt insufficient — trying fallback engine`);
    const fallback = await selectFallbackEngine(step.capability, step.context, [engineId]);
    if (fallback) {
      engineId = fallback.engineId;
      fallbackUsed = true;
      gkResult = await gatedAICall(step.capability, { ...step.context, fallback: true }, goal);
      logs.push(`[Step ${step.stepIndex}] Fallback engine: ${engineId} | Source: ${gkResult.source}`);
    }
  }

  const durationMs = Date.now() - t0;
  const finalSuccess = gkResult.output.length > 10;

  await recordEngineResult(engineId, finalSuccess, durationMs);
  logs.push(`[Step ${step.stepIndex}] Done in ${durationMs}ms — success: ${finalSuccess}`);

  return {
    stepIndex:    step.stepIndex,
    description:  step.description,
    capability:   step.capability,
    engineUsed:   engineId,
    success:      finalSuccess,
    output:       gkResult.output,
    source:       gkResult.source,
    durationMs,
    retried,
    fallbackUsed,
    logs,
  };
}

// ── Parallel group executor ───────────────────────────────────────────────

async function executeStepGroup(
  steps: PlanStep[],
  goal: string,
  log: (msg: string) => void,
): Promise<StepResult[]> {
  if (steps.length === 0) return [];

  const parallel = steps.filter(s => s.canParallel);
  const serial   = steps.filter(s => !s.canParallel);

  const results: StepResult[] = [];

  // Serial steps run one at a time
  for (const step of serial) {
    log(`[OutcomeEngine] → Serial step ${step.stepIndex}: ${step.description}`);
    const r = await executeStep(step, goal);
    results.push(r);
  }

  // Parallel steps run concurrently
  if (parallel.length > 0) {
    log(`[OutcomeEngine] → Running ${parallel.length} steps in parallel`);
    const parallelResults = await Promise.all(
      parallel.map(step => executeStep(step, goal)),
    );
    results.push(...parallelResults);
  }

  return results.sort((a, b) => a.stepIndex - b.stepIndex);
}

// ── Main entry point ──────────────────────────────────────────────────────

export async function executeOutcome(
  goal: string,
  context: Record<string, unknown>,
): Promise<OutcomeResult> {
  const outcomeId = `outcome_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const t0 = Date.now();
  const globalLogs: string[] = [];
  const log = (msg: string) => { globalLogs.push(msg); console.log(msg); };

  log(`[OutcomeEngine] Starting execution: "${goal.slice(0, 80)}"`);
  log(`[OutcomeEngine] outcomeId: ${outcomeId}`);

  // 1. Generate execution plan
  log(`[OutcomeEngine] Generating strategy plan…`);
  let plan: ExecutionPlan;
  try {
    plan = await planOutcome(goal, context);
    log(`[OutcomeEngine] Plan generated (${plan.source}): ${plan.totalSteps} steps`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log(`[OutcomeEngine] FATAL — Plan generation failed: ${errMsg}`);
    return {
      outcomeId,
      goal,
      plan: { planId: "error", goal, totalSteps: 0, steps: [], estimatedMs: 0, source: "deterministic" },
      success: false,
      steps: [],
      enginesUsed: [],
      aiCallCount: 0,
      tokensSaved: 0,
      totalMs: Date.now() - t0,
      summary: "Failed to generate execution plan.",
      error: errMsg,
    };
  }

  // 2. Separate serial (first pass) from parallel-eligible steps
  const firstSerial  = plan.steps.filter(s => !s.canParallel);
  const parallelable = plan.steps.filter(s => s.canParallel);

  // 3. Execute
  log(`[OutcomeEngine] Executing ${firstSerial.length} serial + ${parallelable.length} parallel steps`);

  const allResults: StepResult[] = [];

  for (const step of firstSerial) {
    log(`[OutcomeEngine] Serial step ${step.stepIndex}: ${step.description}`);
    const r = await executeStep(step, goal);
    allResults.push(r);
    if (!r.success && step.required) {
      log(`[OutcomeEngine] Required step ${step.stepIndex} failed — halting sequence`);
      break;
    }
  }

  if (parallelable.length > 0) {
    const parallelResults = await Promise.all(
      parallelable.map(step => executeStep(step, goal)),
    );
    allResults.push(...parallelResults);
  }

  allResults.sort((a, b) => a.stepIndex - b.stepIndex);

  // 4. Aggregate results
  const enginesUsed   = [...new Set(allResults.map(r => r.engineUsed))];
  const aiCallCount   = allResults.filter(r => r.source === "ai").length;
  const tokensSaved   = allResults.filter(r => r.tokensSaved).length;
  const totalMs       = Date.now() - t0;
  const requiredSteps = plan.steps.filter(s => s.required);
  const successCount  = allResults.filter(r => r.success && requiredSteps.some(s => s.stepIndex === r.stepIndex)).length;
  const overallSuccess = successCount >= Math.ceil(requiredSteps.length * 0.7);

  // 5. Record outcome for feedback learning
  await recordOutcomeResult(goal, overallSuccess);

  // 6. Build summary
  const summary = [
    `Execution ${overallSuccess ? "succeeded" : "partially completed"} in ${totalMs}ms.`,
    `${allResults.filter(r => r.success).length}/${allResults.length} steps succeeded.`,
    `Engines used: ${enginesUsed.join(", ")}.`,
    `AI calls made: ${aiCallCount} | Steps handled without AI: ${tokensSaved}.`,
    aiCallCount === 0 ? "All steps resolved without AI — maximum efficiency." : `${tokensSaved} steps saved tokens via templates/cache/deterministic logic.`,
  ].join(" ");

  log(`[OutcomeEngine] Complete — ${summary}`);

  return {
    outcomeId,
    goal,
    plan,
    success:     overallSuccess,
    steps:       allResults,
    enginesUsed,
    aiCallCount,
    tokensSaved,
    totalMs,
    summary,
  };
}
