// ─── CreateAI Workflow System ─────────────────────────────────────────────────
// All workflow modules are exported from here.

export type { WorkflowPhase, WorkflowConfig, WorkflowSession } from "./WorkflowEngine";
export { createSession, resetSession, advancePhase, PHASE_LABELS } from "./WorkflowEngine";

export { validateTopic, getExamples, buildRunPrompt } from "./start_search";

export { resolveEngineId, buildEngineContext } from "./output_flow";

export { hasStructuredSections, prepareForReview, getReviewActions } from "./review_flow";
export type { ReviewAction } from "./review_flow";

export { SAVE_DECISIONS, findDecision } from "./yes_no_flow";
export type { YesNoOption } from "./yes_no_flow";

export { saveToVault, prepareProjectFile } from "./update_shared_database";
export type { SaveResult } from "./update_shared_database";

export { WorkflowRunner } from "./WorkflowRunner";
