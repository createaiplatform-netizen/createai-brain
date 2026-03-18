// ═══════════════════════════════════════════════════════════════════════════
// REVIEW FLOW — Helpers for the output review + edit step.
// ═══════════════════════════════════════════════════════════════════════════

/** Detects whether output contains markdown-style section headers. */
export function hasStructuredSections(output: string): boolean {
  return /^#+\s/m.test(output) || /^[A-Z][A-Z\s]{3,}:$/m.test(output);
}

/** Returns a trimmed, ready-to-display version of the output. */
export function prepareForReview(output: string): string {
  return output.trim();
}

/** Review action button descriptors. */
export interface ReviewAction {
  id:    "save" | "regenerate" | "refine" | "copy" | "close";
  label: string;
  icon:  string;
  style: "primary" | "secondary" | "ghost";
}

export function getReviewActions(saved: boolean): ReviewAction[] {
  return [
    { id: "save",       label: saved ? "Saved ✓" : "Save to Vault", icon: saved ? "✅" : "💾", style: "primary"   },
    { id: "refine",     label: "Refine",                             icon: "✏️",                 style: "secondary" },
    { id: "regenerate", label: "Regenerate",                         icon: "🔄",                 style: "secondary" },
    { id: "copy",       label: "Copy",                               icon: "📋",                 style: "ghost"     },
  ];
}
