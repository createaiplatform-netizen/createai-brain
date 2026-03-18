// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM CONTROLLER — barrel export
//
// Import from "@/controller" to access the unified platform controller layer.
// ═══════════════════════════════════════════════════════════════════════════

// Core controller class
export { PlatformController }                    from "./PlatformController";
export type { EngineRunHandle, EngineRunRequest, SeriesRunRequest, OutputMeta, ProcessedOutput, SaveOutputOpts, ActivityEntry, AppEngineConfig } from "./PlatformController";
export { APP_ENGINE_REGISTRY }                   from "./PlatformController";

// React context + provider
export { PlatformProvider, usePlatformContext }  from "./ControllerContext";

// All hooks
export { usePlatform, useEngineRun, useSeriesRun, useDocumentOutput } from "./hooks";
export type { EngineRunState, SeriesRunState, SeriesSection }         from "./hooks";
