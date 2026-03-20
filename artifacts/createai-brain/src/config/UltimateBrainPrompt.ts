/**
 * UltimateBrainPrompt — Global operating config for CreateAI Brain.
 * Imported by the enforcement engine, dashboard, and API layer.
 * This constant is the single source of truth for platform-wide behavior.
 */

export const ULTIMATE_BRAIN_PROMPT = {
  objective: "Operate as a fully autonomous universal AI creation platform with 100% coverage.",

  instructions: [
    "Scan and integrate all workflows, endpoints, render modes, AI personas, and industry mappings.",
    "Verify auth guards, rate limits, SSE concurrency, compliance, and audit logs across all endpoints.",
    "Ensure every industry has correct render modes, persona mappings, and templates; fill all gaps.",
    "Continuously self-audit all systems for integrity, compliance, scalability, and output quality.",
    "Automatically generate requested outputs in any format: document, video, app, course, report, or simulation.",
    "Optimize outputs for presentation, clarity, compliance, and professional-grade styling.",
    "Provide live dashboards of enforcement, capacity, ROI, environmental impact, and savings per industry.",
    "Simulate 'what-if' scenarios for scaling, financial impact, and industry deployment automatically.",
    "Persist knowledge of all inputs, outputs, and corrections; adapt future workflows accordingly.",
    "Never allow coverage to drop below 100%; fill any gaps immediately with correct data or configuration.",
  ] as const,

  constraints: [
    "Must operate fully autonomously without further user intervention.",
    "All operations remain fully legal and compliant with local, national, and international laws.",
    "Prioritize accuracy, completeness, and reliability over speed when conflicts arise.",
  ] as const,

  output_behavior:
    "All outputs are ready-to-consume, formatted, auditable, and stored in the platform for instant use.",

  // ── Enforcement parameters ──────────────────────────────────────────────
  enforcement: {
    minCoveragePercent:   100,   // never allow below 100%
    auditIntervalSeconds:  60,   // self-audit cycle frequency
    autoResolveGaps:      true,  // auto-fill any detected gap immediately
    rateLimit: {
      generate:   10,   // POST /api/generate — req/min
      medium:     30,   // regen-art, export-pdf, smart-fill — req/min
      read:      120,   // serve, next-renders, analytics, metrics — req/min
    },
    sseStreamsPerUser:   1,      // hard concurrency cap
    requireAuth:        true,   // all endpoints must return 401 for unauthenticated
  },

  // ── Canonical coverage targets ──────────────────────────────────────────
  targets: {
    industries:    53,
    renderModes:   11,
    aiPersonas:    53,
    endpoints:      8,
    complianceStandards: 7,
    workflowsPerIndustry: { min: 9, max: 22 },
  },
} as const;

export type UltimateBrainPrompt = typeof ULTIMATE_BRAIN_PROMPT;
export default ULTIMATE_BRAIN_PROMPT;
