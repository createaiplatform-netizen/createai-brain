// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM CONTROLLER — barrel export
//
// Import from "@/controller" to access the complete unified system controller.
// Every engine, series, image, document, and export goes through here.
//
// ┌─ PLATFORM CONTRACT ─────────────────────────────────────────────────────┐
// │ All AI generation in this codebase flows exclusively through this       │
// │ module. No app, engine module, series, or hook may call /api/openai/*   │
// │ directly, implement SSE stream readers, or bypass this barrel.          │
// │                                                                         │
// │ Full contract → artifacts/createai-brain/PLATFORM_CONTRACT.md           │
// └─────────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════

// Core controller class + module-level utilities
export { PlatformController, APP_ENGINE_REGISTRY }    from "./PlatformController";
export { streamEngine, streamSeries, streamChat, streamBrainstorm, streamProjectChat, generateImage, exportToPDF, exportToMarkdown, exportToText } from "./PlatformController";
export type {
  EngineRunHandle, EngineRunRequest, SeriesRunRequest,
  OutputMeta, ProcessedOutput, SaveOutputOpts,
  ActivityEntry, AppEngineConfig, ImageGenOpts,
} from "./PlatformController";

// Shared context / intelligence layer
export { contextStore, useContextStore } from "@/store/platformContextStore";
export type { OutputRecord, SessionContext, InsightRecord, ContextStoreState } from "@/store/platformContextStore";

// React context + provider
export { PlatformProvider, usePlatformContext }        from "./ControllerContext";

// React hooks
export { usePlatform, useEngineRun, useSeriesRun, useDocumentOutput, useImageGenerate } from "./hooks";
export type { EngineRunState, SeriesRunState, SeriesSection, ImageGenerateState }        from "./hooks";

// Publishing pipeline + billing hooks (req 13 + 14)
export { checkBillingEligibility, publishProject, unpublishProject } from "./PlatformController";
export type { BillingEligibility } from "./PlatformController";
