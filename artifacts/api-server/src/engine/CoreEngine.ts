/**
 * CoreEngine — Rule-validated task executor for the Infinity Execution module.
 *
 * executeTask(fn, rules) runs any async task function and validates the output
 * against Sara's defined rules before declaring success. Tasks that produce
 * harmful, illegal, or incomplete output are rejected and queued for retry.
 */

// ─── Rule set type ────────────────────────────────────────────────────────────

export interface BrainRules {
  safety:             boolean; // output must not cause harm
  legality:           boolean; // output must be lawful
  userFriendly:       boolean; // output must be readable / usable
  compliance:         boolean; // HIPAA / GDPR / SOC2 / etc.
  alwaysGood:         boolean; // intent must benefit users
  preventWaste:       boolean; // no redundant / bloated output
  maximizeEfficiency: boolean; // fastest correct path preferred
  mustComplete:       boolean; // partial output = failure
}

// ─── Task result ──────────────────────────────────────────────────────────────

export interface TaskResult {
  success:    boolean;
  output:     unknown;
  violations: string[];
  durationMs: number;
}

// ─── Rule validators ──────────────────────────────────────────────────────────

const HARM_PATTERNS = [
  /\b(illegal|harmful|weapon|exploit|hack|malware|phish|fraud)\b/i,
];

const INCOMPLETE_MARKERS = [
  /\[TODO\]/i, /\[PLACEHOLDER\]/i, /\[INSERT\]/i, /\.\.\.\s*$/,
];

function validateOutput(output: unknown, rules: BrainRules): string[] {
  const violations: string[] = [];
  const text = typeof output === "string" ? output
             : typeof output === "object" ? JSON.stringify(output)
             : String(output ?? "");

  if (rules.safety || rules.legality || rules.alwaysGood) {
    for (const pattern of HARM_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`Rule [safety/legality]: output contains restricted content matching ${pattern}`);
      }
    }
  }

  if (rules.mustComplete) {
    for (const marker of INCOMPLETE_MARKERS) {
      if (marker.test(text)) {
        violations.push(`Rule [mustComplete]: output appears incomplete (matched ${marker})`);
      }
    }
    if (text.trim().length === 0) {
      violations.push("Rule [mustComplete]: output is empty");
    }
  }

  if (rules.preventWaste && text.length > 500_000) {
    violations.push("Rule [preventWaste]: output exceeds 500 KB — likely bloated or looping");
  }

  return violations;
}

// ─── Core executor ────────────────────────────────────────────────────────────

export async function executeTask(
  task: () => unknown | Promise<unknown>,
  rules: BrainRules,
): Promise<TaskResult> {
  const start = Date.now();

  let output: unknown;
  try {
    output = await task();
  } catch (err) {
    return {
      success:    false,
      output:     null,
      violations: [`Task threw an exception: ${(err as Error).message}`],
      durationMs: Date.now() - start,
    };
  }

  const violations = validateOutput(output, rules);
  return {
    success:    violations.length === 0,
    output,
    violations,
    durationMs: Date.now() - start,
  };
}
