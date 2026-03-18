// ═══════════════════════════════════════════════════════════════════════════
// UPDATE SHARED DATABASE — Persistence step.
// Saves workflow output to the Output Vault (localStorage) and
// optionally as a file inside the active project.
// ═══════════════════════════════════════════════════════════════════════════

import { saveEngineOutput } from "@/engine/CapabilityEngine";
import type { WorkflowSession } from "./WorkflowEngine";

export interface SaveResult {
  success:    boolean;
  vaultId?:   string;
  error?:     string;
}

/**
 * Saves the workflow output to the Output Vault.
 * Uses saveEngineOutput from CapabilityEngine (which handles
 * localStorage persistence + background DB sync).
 */
export async function saveToVault(session: WorkflowSession): Promise<SaveResult> {
  try {
    const text = (session.editedOutput || session.output).trim();
    if (!text) return { success: false, error: "No output to save." };
    await saveEngineOutput({
      engineId:    session.config.engineId,
      engineName:  session.config.engineLabel,
      title:       session.topic,
      content:     text,
    });
    return { success: true };
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
