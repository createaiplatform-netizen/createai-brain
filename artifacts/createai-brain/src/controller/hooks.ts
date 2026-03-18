// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM HOOKS — All apps and engines access the controller through these.
//
//  usePlatform()         — full platform access
//  useEngineRun(id)      — streaming engine run with auto-parse
//  useSeriesRun(id)      — multi-engine series with per-section state
//  useDocumentOutput()   — document processing and save utilities
//  useImageGenerate()    — image generation via DALL-E 3
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from "react";
import { usePlatformContext } from "./ControllerContext";
import {
  ALL_ENGINES,
  ALL_SERIES,
  getEngine,
  getSeries,
  getEnginesByCategory,
  type EngineDefinition,
  type SeriesDefinition,
} from "@/engine/CapabilityEngine";
import type { DocumentSchema } from "@/engines/document/DocumentSchema";
import type {
  EngineRunRequest,
  SeriesRunRequest,
  OutputMeta,
  SaveOutputOpts,
  ImageGenOpts,
} from "./PlatformController";

// ─── usePlatform ──────────────────────────────────────────────────────────────

export function usePlatform() {
  const { controller } = usePlatformContext();
  return {
    controller,
    engines:      ALL_ENGINES,
    series:       ALL_SERIES,
    engineCount:  ALL_ENGINES.length,
    seriesCount:  ALL_SERIES.length,
    getEngine,
    getSeries,
    getEnginesByCategory,
    getEnginesForSeries: (id: string)     => controller.getEnginesForSeries(id),
    getEnginesForApp:    (appId: string)  => controller.getEnginesForApp(appId),
    getSeriesForApp:     (appId: string)  => controller.getSeriesForApp(appId),
    getAppConfig:        (appId: string)  => controller.getAppConfig(appId),
    routeToEngine:       (intent: string, docType?: string) => controller.routeToEngine(intent, docType),
    routeToSeries:       (intent: string) => controller.routeToSeries(intent),
    runEngine:           (opts: EngineRunRequest) => controller.runEngine(opts),
    runSeries:           (opts: SeriesRunRequest) => controller.runSeries(opts),
    processOutput:       (text: string, meta?: OutputMeta) => controller.processOutput(text, meta),
    saveOutput:          (opts: SaveOutputOpts) => controller.saveOutput(opts),
    generateImage:       (prompt: string, opts?: ImageGenOpts) => controller.generateImage(prompt, opts),
    exportToPDF:         (title?: string) => controller.exportToPDF(title),
    exportToMarkdown:    (content: string, filename: string) => controller.exportToMarkdown(content, filename),
    exportToText:        (content: string, filename: string) => controller.exportToText(content, filename),
    getActivityHistory:  () => controller.getActivityHistory(),
  };
}

// ─── useEngineRun ─────────────────────────────────────────────────────────────

export interface EngineRunState {
  run:       (topic: string, opts?: { context?: string; mode?: string; autoSave?: boolean; projectId?: string }) => void;
  abort:     () => void;
  reset:     () => void;
  output:    string;
  document:  DocumentSchema | null;
  status:    "idle" | "running" | "done" | "error";
  error:     string | null;
  savedId:   string | null;
  isRunning: boolean;
  isDone:    boolean;
}

export function useEngineRun(engineId: string): EngineRunState {
  const { controller } = usePlatformContext();
  const [output,   setOutput]   = useState("");
  const [status,   setStatus]   = useState<"idle" | "running" | "done" | "error">("idle");
  const [error,    setError]    = useState<string | null>(null);
  const [document, setDocument] = useState<DocumentSchema | null>(null);
  const [savedId,  setSavedId]  = useState<string | null>(null);
  const handleRef = useRef<{ abort: () => void } | null>(null);

  const run = useCallback(
    (topic: string, opts?: { context?: string; mode?: string; autoSave?: boolean; projectId?: string }) => {
      setOutput(""); setDocument(null); setSavedId(null); setError(null); setStatus("running");
      const engine = getEngine(engineId);

      handleRef.current = controller.runEngine({
        engineId,
        topic,
        context: opts?.context,
        mode:    opts?.mode,
        onChunk: (text) => setOutput(prev => prev + text),
        onDone: async (finalText) => {
          const processed = controller.processOutput(finalText, {
            engineId,
            engineName: engine?.name,
            title:      topic.slice(0, 80),
          });
          setDocument(processed.document);
          setStatus("done");

          if (opts?.autoSave && finalText.trim()) {
            const id = await controller.saveOutput({
              engineId,
              engineName: engine?.name ?? engineId,
              title:      topic.slice(0, 80),
              content:    finalText,
              projectId:  opts?.projectId,
            });
            if (id) setSavedId(id);
          }
        },
        onError: (err) => { setError(err); setStatus("error"); },
      });
    },
    [engineId, controller],
  );

  const abort = useCallback(() => { handleRef.current?.abort(); setStatus("idle"); }, []);
  const reset = useCallback(() => { setOutput(""); setDocument(null); setError(null); setSavedId(null); setStatus("idle"); }, []);

  return { run, abort, reset, output, document, status, error, savedId, isRunning: status === "running", isDone: status === "done" };
}

// ─── useSeriesRun ─────────────────────────────────────────────────────────────

export interface SeriesSection {
  engineId:   string;
  engineName: string;
  text:       string;
  status:     "pending" | "running" | "done";
}

export interface SeriesRunState {
  run:          (topic: string, context?: string) => void;
  abort:        () => void;
  reset:        () => void;
  sections:     SeriesSection[];
  status:       "idle" | "running" | "done" | "error";
  error:        string | null;
  currentIndex: number;
  allOutput:    string;
  seriesDef:    SeriesDefinition | undefined;
  isRunning:    boolean;
  isDone:       boolean;
}

export function useSeriesRun(seriesId: string): SeriesRunState {
  const { controller } = usePlatformContext();
  const seriesDef = getSeries(seriesId);

  const makeInitial = (): SeriesSection[] =>
    (seriesDef?.engines ?? []).map(eid => ({
      engineId:   eid,
      engineName: getEngine(eid)?.name ?? eid,
      text:       "",
      status:     "pending" as const,
    }));

  const [sections,     setSections]     = useState<SeriesSection[]>(makeInitial);
  const [status,       setStatus]       = useState<"idle" | "running" | "done" | "error">("idle");
  const [error,        setError]        = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const handleRef = useRef<{ abort: () => void } | null>(null);

  const run = useCallback((topic: string, context?: string) => {
    setSections(makeInitial());
    setStatus("running"); setError(null); setCurrentIndex(0);

    handleRef.current = controller.runSeries({
      seriesId, topic, context,
      onSectionStart: (engineId, index) => {
        setCurrentIndex(index);
        setSections(prev => prev.map((s, i) => i === index ? { ...s, status: "running" } : s));
      },
      onChunk: (text, _eid, index) => {
        setSections(prev => prev.map((s, i) => i === index ? { ...s, text: s.text + text } : s));
      },
      onSectionDone: (_eid, index) => {
        setSections(prev => prev.map((s, i) => i === index ? { ...s, status: "done" } : s));
      },
      onDone:  () => { setStatus("done"); setCurrentIndex(-1); },
      onError: (err) => { setError(err); setStatus("error"); },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId, controller]);

  const abort = useCallback(() => { handleRef.current?.abort(); setStatus("idle"); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reset = useCallback(() => { setSections(makeInitial()); setStatus("idle"); setError(null); setCurrentIndex(-1); }, []);

  const allOutput = sections.map(s => `## ${s.engineName}\n\n${s.text}`).join("\n\n---\n\n");

  return { run, abort, reset, sections, status, error, currentIndex, allOutput, seriesDef, isRunning: status === "running", isDone: status === "done" };
}

// ─── useDocumentOutput ────────────────────────────────────────────────────────

export function useDocumentOutput() {
  const { controller } = usePlatformContext();

  const processText  = useCallback((text: string, meta?: OutputMeta) => controller.processOutput(text, meta).document, [controller]);
  const saveDocument = useCallback((opts: SaveOutputOpts)             => controller.saveOutput(opts),                  [controller]);
  const toMarkdown   = useCallback((content: string, name: string)   => controller.exportToMarkdown(content, name),   [controller]);
  const toText       = useCallback((content: string, name: string)   => controller.exportToText(content, name),       [controller]);
  const toPDF        = useCallback((title?: string)                  => controller.exportToPDF(title),                [controller]);

  return { processText, saveDocument, toMarkdown, toText, toPDF };
}

// ─── useImageGenerate ─────────────────────────────────────────────────────────

export interface ImageGenerateState {
  generate:   (prompt: string, opts?: ImageGenOpts) => void;
  imageUrl:   string | null;
  status:     "idle" | "generating" | "done" | "error";
  error:      string | null;
  reset:      () => void;
}

export function useImageGenerate(): ImageGenerateState {
  const { controller } = usePlatformContext();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status,   setStatus]   = useState<"idle" | "generating" | "done" | "error">("idle");
  const [error,    setError]    = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, opts?: ImageGenOpts) => {
    if (!prompt.trim()) return;
    setStatus("generating"); setError(null); setImageUrl(null);
    try {
      const result = await controller.generateImage(prompt.trim(), opts);
      setImageUrl(result.url);
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  }, [controller]);

  const reset = useCallback(() => { setImageUrl(null); setStatus("idle"); setError(null); }, []);

  return { generate, imageUrl, status, error, reset };
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { EngineDefinition, SeriesDefinition };
export type { EngineRunRequest, SeriesRunRequest, OutputMeta, SaveOutputOpts, ImageGenOpts };
