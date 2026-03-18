// ═══════════════════════════════════════════════════════════════════════════
// UPDATE SHARED DATABASE — Persistence step.
// Saves workflow output to the Output Vault (localStorage + DB) and
// optionally formats it as a project file.
//
// Uses vaultAdd() from OutputVaultService which:
//   1. Writes to localStorage "cai_vault_entries" (OutputVaultPanel reads this)
//   2. Fires-and-forgets a POST to /api/documents for DB persistence
//
// NOTE: streamEngine() auto-saves the RAW generated output via
// contextStore.recordOutput → vaultAdd. This explicit save persists the
// EDITED version (if the user changed anything) so BrainHub vault reflects
// the final reviewed state.
// ═══════════════════════════════════════════════════════════════════════════

import { vaultAdd } from "@/services/OutputVaultService";
import type { WorkflowSession } from "./WorkflowEngine";

export interface SaveResult {
  success: boolean;
  vaultId?: string;
  error?:   string;
}

/**
 * Explicitly saves the current (possibly edited) output to the vault.
 * Synchronous — vault writes to localStorage immediately, DB sync is async.
 */
export function saveToVault(session: WorkflowSession): SaveResult {
  try {
    const text = (session.editedOutput || session.output).trim();
    if (!text) return { success: false, error: "No output to save." };

    const entry = vaultAdd(
      session.config.engineId,
      session.config.engineLabel,
      session.topic,
      text,
    );

    return { success: true, vaultId: entry.id };
  } catch (err) {
    console.error("[update_shared_database] saveToVault", err);
    return { success: false, error: (err as Error).message ?? "Save failed." };
  }
}

/**
 * Formats output as a project file object ready to be passed
 * to apiCreateProjectFile (from ProjectOSApp).
 */
export function prepareProjectFile(session: WorkflowSession): {
  name:    string;
  content: string;
  folder:  string;
} {
  const text = (session.editedOutput || session.output).trim();
  const name = session.topic.length > 50
    ? session.topic.slice(0, 50).trim() + "…"
    : session.topic;
  return {
    name:    `${session.config.engineLabel} — ${name}`,
    content: text,
    folder:  "AI Output",
  };
}
