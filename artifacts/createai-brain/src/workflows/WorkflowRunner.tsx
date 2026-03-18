// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW RUNNER
// Full creation pipeline:  start_search → output_flow → review_flow → done
//
// Features (v2):
//   • AI-powered refinement — type an instruction, re-run the engine
//   • Save to Vault          — one-click persist to Output Vault
//   • Save to Project        — opens SaveToProjectModal to file in any project
//   • View Vault link        — done screen opens Brain Hub / vault panel
//   • Graceful error recovery — retry keeps the topic, won't lose work
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from "react";
import { streamEngine }              from "@/controller";
import { useOS }                     from "@/os/OSContext";
import { SaveToProjectModal }        from "@/components/SaveToProjectModal";

import {
  WorkflowSession, WorkflowConfig,
  createSession, resetSession, advancePhase,
}                                    from "./WorkflowEngine";
import { validateTopic, getExamples, buildRunPrompt } from "./start_search";
import { buildEngineContext }        from "./output_flow";
import { saveToVault }               from "./update_shared_database";

// ─── Phase progress bar ───────────────────────────────────────────────────────

function PhaseBar({ phase, color }: { phase: WorkflowSession["phase"]; color: string }) {
  const steps  = ["start_search", "output_flow", "review_flow", "done"] as const;
  const labels = ["Describe", "Generate", "Review", "Done"];
  const idx    = steps.indexOf(phase as (typeof steps)[number]);
  return (
    <div className="flex items-center gap-0 px-4 pt-3 pb-2">
      {steps.map((s, i) => {
        const active = i === idx;
        const past   = i < idx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 48 }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                style={{
                  background: past || active ? color : "#e2e8f0",
                  color:      past || active ? "#fff" : "#94a3b8",
                  boxShadow:  active ? `0 0 0 3px ${color}28` : "none",
                  transform:  active ? "scale(1.1)" : "scale(1)",
                }}>
                {past ? "✓" : i + 1}
              </div>
              <p className="text-[9px] font-semibold"
                style={{ color: active ? color : i > idx ? "#cbd5e1" : "#64748b" }}>
                {labels[i]}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-1 mt-[-8px]"
                style={{ background: i < idx ? color : "#e2e8f0" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── START SEARCH ─────────────────────────────────────────────────────────────

function StartSearchStep({
  session, onSubmit,
}: { session: WorkflowSession; onSubmit: (topic: string) => void }) {
  const { config } = session;
  const [topic, setTopic]   = useState(session.topic);
  const [error, setError]   = useState<string | null>(null);
  const examples = getExamples(config.engineLabel);
  const textRef  = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { textRef.current?.focus(); }, []);

  const submit = () => {
    const err = validateTopic(topic);
    if (err) { setError(err); return; }
    setError(null);
    onSubmit(topic);
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-3 overflow-y-auto">
      <div className="max-w-xl mx-auto w-full space-y-4">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
            What do you want to create?
          </label>
          <textarea ref={textRef} value={topic} rows={4}
            onChange={e => { setTopic(e.target.value); setError(null); }}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder={config.placeholder}
            className="w-full px-4 py-3 rounded-2xl border text-[13px] leading-relaxed resize-none outline-none transition-all"
            style={{
              borderColor: error ? "#fca5a5" : topic.trim() ? config.color + "66" : "#e2e8f0",
              boxShadow:   topic.trim() ? `0 0 0 3px ${config.color}12` : "none",
              background:  "#fff",
            }}
          />
          {error && <p className="text-[11px] text-red-500 mt-1.5 px-1">{error}</p>}
          <p className="text-[10px] text-slate-400 mt-1.5 px-1">⌘ Enter to generate</p>
        </div>

        <button onClick={submit}
          className="w-full py-3 rounded-2xl text-[13px] font-bold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%)`,
            boxShadow:  `0 4px 16px ${config.color}33`,
          }}>
          ✨ Generate with {config.engineLabel}
        </button>

        {examples.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick starts</p>
            <div className="space-y-2">
              {examples.map((ex, i) => (
                <button key={i} onClick={() => { setTopic(ex); setError(null); }}
                  className="w-full text-left px-4 py-2.5 rounded-xl border border-slate-200 text-[12px] text-slate-600
                             hover:border-slate-300 hover:bg-slate-50 transition-all bg-white">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OUTPUT FLOW ──────────────────────────────────────────────────────────────

function OutputFlowStep({ session }: { session: WorkflowSession }) {
  const wordCount = session.output.split(/\s+/).filter(Boolean).length;
  return (
    <div className="flex-1 flex flex-col px-4 py-3 overflow-y-auto">
      <div className="max-w-xl mx-auto w-full space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: session.config.color }} />
          <p className="text-[11px] font-semibold text-slate-500">Generating · {wordCount} words</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 min-h-[200px]">
          <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap">
            {session.output || "…"}
          </p>
          {session.output && (
            <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REVIEW FLOW ─────────────────────────────────────────────────────────────
// Three editing modes:
//   "preview"  — read the output; action buttons available
//   "manual"   — free-text edit of the output
//   "ai"       — enter a refinement instruction; submits back to the engine

function ReviewFlowStep({
  session, onAction, onEdit, onAIRefine,
}: {
  session:     WorkflowSession;
  onAction:    (id: string) => void;
  onEdit:      (text: string) => void;
  onAIRefine:  (instruction: string) => void;
}) {
  const { config } = session;
  type EditMode = "preview" | "manual" | "ai";
  const [mode, setMode]               = useState<EditMode>("preview");
  const [editText, setEditText]       = useState(session.editedOutput || session.output);
  const [refinement, setRefinement]   = useState("");
  const [copyFlash, setCopyFlash]     = useState(false);
  const wordCount = (session.editedOutput || session.output).split(/\s+/).filter(Boolean).length;

  // Keep edit text in sync when session changes (e.g. after AI refinement)
  useEffect(() => {
    setEditText(session.editedOutput || session.output);
    setMode("preview");
  }, [session.editedOutput, session.output]);

  const handleCopy = () => {
    navigator.clipboard.writeText(session.editedOutput || session.output).catch(() => {});
    setCopyFlash(true);
    setTimeout(() => setCopyFlash(false), 1500);
  };

  const applyManualEdit = () => {
    onEdit(editText);
    setMode("preview");
  };

  const submitRefinement = () => {
    if (!refinement.trim()) return;
    onAIRefine(refinement.trim());
    setRefinement("");
    setMode("preview");
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-3 overflow-y-auto">
      <div className="max-w-xl mx-auto w-full space-y-3">

        {/* Status + mode toggles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
            <p className="text-[11px] font-semibold text-slate-500">Complete · {wordCount} words</p>
          </div>
          <div className="flex items-center gap-1">
            {(["preview", "manual", "ai"] as EditMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors capitalize"
                style={mode === m
                  ? { background: config.color, color: "#fff" }
                  : { background: config.color + "12", color: config.color }}>
                {m === "ai" ? "✨ AI refine" : m}
              </button>
            ))}
          </div>
        </div>

        {/* Topic chip */}
        <div className="px-3 py-2 rounded-xl text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 truncate">
          🎯 {session.topic}
        </div>

        {/* ── PREVIEW mode ─────────────────────────────────────────── */}
        {mode === "preview" && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 max-h-[300px] overflow-y-auto">
              <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                {session.editedOutput || session.output}
              </p>
            </div>

            {/* Primary actions */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onAction("save")} disabled={session.saved}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all col-span-1"
                style={{ background: config.color, opacity: session.saved ? 0.55 : 1 }}>
                {session.saved ? "✅ Saved" : "💾 Save to Vault"}
              </button>
              <button onClick={() => onAction("saveProject")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>
                🗂️ Save to Project
              </button>
            </div>

            {/* Secondary actions */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => onAction("regenerate")}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
                style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }}>
                🔄 Redo
              </button>
              <button onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
                style={{ background: "#fff", color: copyFlash ? "#22c55e" : "#64748b", border: "1px solid #e2e8f0" }}>
                {copyFlash ? "✓ Copied" : "📋 Copy"}
              </button>
              <button onClick={() => onAction("new")}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
                style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }}>
                ✨ New
              </button>
            </div>
          </>
        )}

        {/* ── MANUAL EDIT mode ─────────────────────────────────────── */}
        {mode === "manual" && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400">Edit the output directly, then click Apply.</p>
            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={12}
              className="w-full px-4 py-3 rounded-2xl border border-indigo-200 text-[12px] leading-relaxed resize-none outline-none focus:ring-2 bg-white"
              style={{ boxShadow: `0 0 0 3px ${config.color}10` }}
            />
            <div className="flex gap-2">
              <button onClick={applyManualEdit}
                className="px-4 py-2 rounded-xl text-white text-[12px] font-bold"
                style={{ background: config.color }}>
                Apply edits
              </button>
              <button onClick={() => setMode("preview")}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[12px] font-bold hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── AI REFINE mode ────────────────────────────────────────── */}
        {mode === "ai" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-[11px] font-semibold text-indigo-700 mb-1">How should the AI improve this?</p>
              <p className="text-[10px] text-indigo-500">
                e.g. "Make it shorter", "Add a pricing section", "Rewrite in a more formal tone"
              </p>
            </div>
            <textarea value={refinement} onChange={e => setRefinement(e.target.value)} rows={3}
              autoFocus
              placeholder="Describe what to change…"
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitRefinement(); }}
              className="w-full px-4 py-3 rounded-2xl border border-indigo-200 text-[13px] leading-relaxed resize-none outline-none focus:ring-2 bg-white"
              style={{ boxShadow: `0 0 0 3px ${config.color}10` }}
            />
            <div className="flex gap-2">
              <button onClick={submitRefinement} disabled={!refinement.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-[12px] font-bold transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%)` }}>
                ✨ Refine with AI
              </button>
              <button onClick={() => setMode("preview")}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[12px] font-bold hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DONE STEP ────────────────────────────────────────────────────────────────

function DoneStep({
  session, onNew, onViewVault,
}: { session: WorkflowSession; onNew: () => void; onViewVault: () => void }) {
  const color = session.config.color;
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-5">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
        style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)` }}>
        ✅
      </div>
      <div className="text-center">
        <p className="text-[17px] font-bold text-slate-800">Saved to Output Vault</p>
        <p className="text-[12px] text-slate-500 mt-1 max-w-[260px] mx-auto">
          "{session.topic.slice(0, 60)}{session.topic.length > 60 ? "…" : ""}"
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[220px]">
        <button onClick={onViewVault}
          className="w-full py-2.5 rounded-2xl text-[12px] font-bold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`,
            boxShadow: "0 4px 16px rgba(99,102,241,0.28)",
          }}>
          🧠 View in Brain Hub
        </button>
        <button onClick={onNew}
          className="w-full py-2.5 rounded-2xl text-[12px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
          ✨ Create something new
        </button>
      </div>
    </div>
  );
}

// ─── ERROR STEP ───────────────────────────────────────────────────────────────

function ErrorStep({ session, onRetry }: { session: WorkflowSession; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-4">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl bg-red-50 border border-red-200">
        ⚠️
      </div>
      <div className="text-center max-w-xs">
        <p className="text-[16px] font-bold text-slate-800">Something went wrong</p>
        <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
          {session.error ?? "An unexpected error occurred."}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={onRetry}
          className="px-5 py-2.5 rounded-2xl text-[13px] font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
          🔄 Try again
        </button>
        <button onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-2xl text-[13px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          Reload
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface WorkflowRunnerProps {
  config: WorkflowConfig;
}

export function WorkflowRunner({ config }: WorkflowRunnerProps) {
  const { openApp }  = useOS();
  const [session, setSession]           = useState<WorkflowSession>(() => createSession(config));
  const [showProjectModal, setProjectModal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Re-create session when the engine changes (different app opened)
  useEffect(() => {
    abortRef.current?.abort();
    setSession(createSession(config));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.engineId]);

  // ── Core engine runner (shared by initial generate + AI refinement) ───────
  const runEngine = useCallback(async (
    topic:   string,
    context?: string,
  ) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setSession(s => advancePhase(s, "output_flow", { topic, output: "", editedOutput: "" }));

    try {
      const resolvedContext = context ?? buildEngineContext(config.engineLabel, config.systemHint);
      const prompt          = buildRunPrompt(config.engineLabel, topic, config.systemHint);
      let accumulated = "";

      await streamEngine({
        engineId: config.engineId,
        topic:    prompt,
        context:  resolvedContext,
        signal:   ctrl.signal,
        onChunk: chunk => {
          accumulated += chunk;
          setSession(s => ({ ...s, output: accumulated }));
        },
        onDone: () => {
          setSession(s => advancePhase(s, "review_flow", {
            output:       accumulated,
            editedOutput: accumulated,
          }));
        },
        onError: err => {
          setSession(s => advancePhase(s, "error", { error: err }));
        },
      });
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setSession(s => advancePhase(s, "error", {
        error: (err as Error).message ?? "Generation failed.",
      }));
    }
  }, [config]);

  // ── AI Refinement ─────────────────────────────────────────────────────────
  // Sends the previous output + refinement instruction back to the engine.
  const runRefinement = useCallback((instruction: string) => {
    const currentOutput = session.editedOutput || session.output;
    const refinementContext = [
      buildEngineContext(config.engineLabel, config.systemHint),
      "",
      "PREVIOUS OUTPUT (improve this based on the refinement below):",
      currentOutput,
      "",
      "REFINEMENT INSTRUCTION:",
      instruction,
      "",
      "Return the complete improved output incorporating the refinement.",
    ].join("\n");

    runEngine(instruction, refinementContext);
  }, [session, config, runEngine]);

  // ── Review actions ────────────────────────────────────────────────────────
  const handleReviewAction = useCallback(async (id: string) => {
    switch (id) {
      case "save": {
        setSession(s => advancePhase(s, "update_db"));
        const result = await saveToVault(session);
        if (result.success) {
          setSession(s => advancePhase(s, "done", { saved: true }));
        } else {
          setSession(s => advancePhase(s, "error", { error: result.error ?? "Save to vault failed." }));
        }
        break;
      }
      case "saveProject": {
        setProjectModal(true);
        break;
      }
      case "regenerate": {
        runEngine(session.topic);
        break;
      }
      case "new": {
        setSession(s => resetSession(s));
        break;
      }
    }
  }, [session, runEngine]);

  const handleEdit       = useCallback((text: string) => {
    setSession(s => ({ ...s, editedOutput: text }));
  }, []);

  const handleNew        = useCallback(() => setSession(s => resetSession(s)), []);
  const handleViewVault  = useCallback(() => openApp("brainhub"), [openApp]);

  const { phase, config: cfg } = session;
  const outputForModal = session.editedOutput || session.output;

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* Phase progress bar */}
      {phase !== "error" && (
        <div className="bg-white border-b border-slate-100 shrink-0">
          <PhaseBar phase={phase} color={cfg.color} />
        </div>
      )}

      {/* Saving spinner overlay */}
      {phase === "update_db" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: cfg.color, borderTopColor: "transparent" }} />
          <p className="text-[13px] font-semibold text-slate-500">Saving to Vault…</p>
        </div>
      )}

      {phase === "start_search" && (
        <StartSearchStep session={session} onSubmit={topic => runEngine(topic)} />
      )}
      {phase === "output_flow" && (
        <OutputFlowStep session={session} />
      )}
      {phase === "review_flow" && (
        <ReviewFlowStep
          session={session}
          onAction={handleReviewAction}
          onEdit={handleEdit}
          onAIRefine={runRefinement}
        />
      )}
      {phase === "done" && (
        <DoneStep session={session} onNew={handleNew} onViewVault={handleViewVault} />
      )}
      {phase === "error" && (
        <ErrorStep session={session} onRetry={() => runEngine(session.topic)} />
      )}

      {/* Save to Project modal — portal over the app */}
      {showProjectModal && outputForModal && (
        <div className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto"
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg mx-auto mt-8 mb-8">
            <SaveToProjectModal
              content={outputForModal}
              label={`${cfg.engineLabel} — ${session.topic.slice(0, 50)}`}
              defaultFileType="Document"
              onClose={() => setProjectModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
