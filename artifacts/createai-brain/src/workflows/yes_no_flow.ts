// ═══════════════════════════════════════════════════════════════════════════
// YES / NO FLOW — Decision branch step.
// Presents a clear choice after the AI finishes generating.
// ═══════════════════════════════════════════════════════════════════════════

export interface YesNoOption {
  id:      string;
  label:   string;
  icon:    string;
  hint:    string;
  style:   "primary" | "secondary" | "danger";
}

/** Standard post-generation decisions. */
export const SAVE_DECISIONS: YesNoOption[] = [
  { id: "save",       label: "Save to Vault",  icon: "💾", hint: "Store in your Output Vault for later",   style: "primary"   },
  { id: "refine",     label: "Refine output",  icon: "✏️", hint: "Edit or adjust the content",             style: "secondary" },
  { id: "regenerate", label: "Regenerate",     icon: "🔄", hint: "Run the AI again with the same topic",   style: "secondary" },
  { id: "new",        label: "Start over",     icon: "✨", hint: "Clear everything and try something new", style: "danger"    },
];

/** Finds an option by its ID. */
export function findDecision(id: string): YesNoOption | undefined {
  return SAVE_DECISIONS.find(d => d.id === id);
}
