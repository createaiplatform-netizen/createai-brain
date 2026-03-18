// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW ENGINE — Core types, state machine, and session management.
// Every app in CreateAI Brain runs through this pipeline:
//   start_search → output_flow → review_flow → yes_no → update_db → done
// ═══════════════════════════════════════════════════════════════════════════

export type WorkflowPhase =
  | "start_search"   // user enters a topic / prompt
  | "output_flow"    // AI is streaming the response
  | "review_flow"    // user reads + edits the output
  | "yes_no"         // decision point (save / regenerate / refine)
  | "update_db"      // persisting to vault / project
  | "done"           // successfully saved
  | "error";         // something went wrong

export interface WorkflowConfig {
  /** The AI engine to call (from CapabilityEngine IDs) */
  engineId:    string;
  /** Human-readable label shown in headers/buttons */
  engineLabel: string;
  /** Accent color (CSS string) */
  color:       string;
  /** App icon emoji */
  icon:        string;
  /** Input placeholder text */
  placeholder: string;
  /** Quick-start example prompts */
  examples:    string[];
  /** Optional system-level context injected before the user topic */
  systemHint?: string;
}

export interface WorkflowSession {
  id:            string;
  config:        WorkflowConfig;
  phase:         WorkflowPhase;
  topic:         string;
  output:        string;
  editedOutput:  string;
  saved:         boolean;
  error:         string | null;
  startedAt:     number;
  completedAt:   number | null;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createSession(config: WorkflowConfig): WorkflowSession {
  return {
    id:           crypto.randomUUID(),
    config,
    phase:        "start_search",
    topic:        "",
    output:       "",
    editedOutput: "",
    saved:        false,
    error:        null,
    startedAt:    Date.now(),
    completedAt:  null,
  };
}

export function resetSession(session: WorkflowSession): WorkflowSession {
  return {
    ...session,
    id:           crypto.randomUUID(),
    phase:        "start_search",
    topic:        "",
    output:       "",
    editedOutput: "",
    saved:        false,
    error:        null,
    startedAt:    Date.now(),
    completedAt:  null,
  };
}

export function advancePhase(
  session: WorkflowSession,
  next: WorkflowPhase,
  patch?: Partial<WorkflowSession>,
): WorkflowSession {
  return {
    ...session,
    ...patch,
    phase:        next,
    completedAt:  next === "done" ? Date.now() : session.completedAt,
  };
}

// ─── Phase label helpers ──────────────────────────────────────────────────────

export const PHASE_LABELS: Record<WorkflowPhase, string> = {
  start_search: "What do you want to create?",
  output_flow:  "Generating…",
  review_flow:  "Review your output",
  yes_no:       "What would you like to do?",
  update_db:    "Saving…",
  done:         "Saved",
  error:        "Something went wrong",
};
