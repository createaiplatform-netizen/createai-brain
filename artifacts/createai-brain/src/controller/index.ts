// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM CONTROLLER — barrel export
//
// Import from "@/controller" to access the complete unified system controller.
// Every engine, series, image, document, and export goes through here.
// ═══════════════════════════════════════════════════════════════════════════

// Core controller class + module-level utilities
export { PlatformController, APP_ENGINE_REGISTRY }    from "./PlatformController";
export { streamEngine, streamSeries, streamChat, streamBrainstorm, generateImage, exportToPDF, exportToMarkdown, exportToText } from "./PlatformController";
export type {
  EngineRunHandle, EngineRunRequest, SeriesRunRequest,
  OutputMeta, ProcessedOutput, SaveOutputOpts,
  ActivityEntry, AppEngineConfig, ImageGenOpts,
} from "./PlatformController";

// React context + provider
export { PlatformProvider, usePlatformContext }        from "./ControllerContext";

// React hooks
export { usePlatform, useEngineRun, useSeriesRun, useDocumentOutput, useImageGenerate } from "./hooks";
export type { EngineRunState, SeriesRunState, SeriesSection, ImageGenerateState }        from "./hooks";
