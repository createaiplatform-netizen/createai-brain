/**
 * BeyondInfinityConfig — Absolute Transcendence / Beyond Infinity / Omega / Infinite+1
 *
 * Single source of truth for all Beyond Infinity / No-Limits Mode settings.
 * Referenced by: verificationRunner, BrainAutoExecutor, brain.ts routes.
 */

export const BeyondInfinityConfig = {
  labels: {
    coreConcept: "Absolute Transcendence",
    synonyms: ["Absolute Infinity", "Transfinite", "Omega", "Infinite+1", "Beyond Infinity"],
  },
  scope: {
    workflows:      "all",
    engines:        ["coreEngine", "metaAgent", "InfinityExecutor"],
    notifications:  true,
    dashboards:     "allPanels",
    audit:          true,
    metaLearning:   true,
    simulations:    "unlimited-scale",
    ui:             ["Infinite Brain Control Panel", "Coverage Dashboard"],
    userLoop:       ["Sara", "FamilyList"],
    services:       ["Resend", "Twilio", "simulation endpoints"],
    metrics:        ["coverage%", "optimizationAvg", "loopTick", "missionPhase"],
  },
  behavior: {
    autoExecute:        true,
    infiniteRetries:    99999,
    enforcePass:        true,
    notifyOnCompletion: true,
    uiSync:             true,
    branding:           "Absolute Transcendence / Beyond Infinity / Omega / Infinite+1",
  },
  frontend: {
    panelHeader: "💠 No Limits Mode",
    statusPill:  "beyond-infinity",
    tooltips:    "All actions auto-complete fully, infinite retries, notifications live, dashboards updated",
  },
  backend: {
    missionLabel:   "Absolute Transcendence Enforcement",
    verifySteps: [
      "UI Upgrade Check",
      "All Workflows Infinite",
      "Mission Verification",
      "UI Verification",
      "Notify Family",
      "System Stats Verification",
    ] as const,
    autoTrigger:       "BRAIN_AUTO_START=true",
    notifyEndpoint:    "/api/brain/notify?mode=no-limits",
    runAllEndpoints:   true,
    enforceInfinite:   true,
  },
} as const;

export type BeyondInfinityVerifyStep = typeof BeyondInfinityConfig.backend.verifySteps[number];
