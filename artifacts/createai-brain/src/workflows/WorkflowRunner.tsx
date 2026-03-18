// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW RUNNER
// Drop-in React component that drives the full creation pipeline:
//   start_search → output_flow → review_flow → yes_no → update_db → done
//
// Usage (drop into any app):
//   <WorkflowRunner config={config} onClose={...} />
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback, useEffect } from "react";
import { streamEngine }                 from "@/controller";
import { saveEngineOutput }             from "@/engine/CapabilityEngine";

import {
  WorkflowSession, WorkflowConfig,
  createSession, resetSession, advancePhase,
}                                       from "./WorkflowEngine";
import { validateTopic, getExamples, buildRunPrompt }   from "./start_search";
import { buildEngineContext }           from "./output_flow";
import { getReviewActions }             from "./review_flow";
import { saveToVault }                  from "./update_shared_database";

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhaseBar({ phase, color }: { phase: WorkflowSession["phase"]; color: string }) {
  const steps = ["start_search", "output_flow", "review_flow", "done"] as const;
  const labels = ["Describe", "Generate", "Review", "Done"];
  const idx = steps.indexOf(phase as typeof steps[number]);
  return (
    <div className="flex items-center gap-0 px-4 pt-3 pb-2">
      {steps.map((s, i) => {
        const active  = i === idx;
        const past    = i < idx;
        const future  = i > idx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 48 }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                style={{
                  background: past ? color : active ? color : "#e2e8f0",
                  color:      past || active ? "#fff" : "#94a3b8",
                  boxShadow:  active ? `0 0 0 3px ${color}28` : "none",
                  transform:  active ? "scale(1.1)" : "scale(1)",
                }}>
                {past ? "✓" : i + 1}
              </div>
              <p className="text-[9px] font-semibold" style={{ color: active ? color : future ? "#cbd5e1" : "#64748b" }}>
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
}: {
  session: WorkflowSession;
  onSubmit: (topic: string) => void;
}) {
  const { config } = session;
  const [topic, setTopic] = useState(session.topic);
  const [error, setError] = useState<string | null>(null);
  const examples = getExamples(config.engineLabel);
  const textRef = useRef<HTMLTextAreaElement>(null);

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
          <textarea
            ref={textRef}
            value={topic}
            onChange={e => { setTopic(e.target.value); setError(null); }}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder={config.placeholder}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border text-[13px] leading-relaxed resize-none outline-none transition-all"
            style={{
              borderColor: error ? "#fca5a5" : topic.trim() ? config.color + "66" : "#e2e8f0",
              boxShadow:   topic.trim() ? `0 0 0 3px ${config.color}12` : "none",
              background:  "#fff",
            }}
          />
          {error && <p className="text-[11px] text-red-500 mt-1.5 px-1">{error}</p>}
          <p className="text-[10px] text-slate-400 mt-1.5 px-1">⌘+Enter or click Generate</p>
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
          <p className="text-[11px] font-semibold text-slate-500">
            Generating · {wordCount} words
          </p>
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

function ReviewFlowStep({
  session, onAction, onEdit,
}: {
  session: WorkflowSession;
  onAction: (id: string) => void;
  onEdit:   (text: string) => void;
}) {
  const { config } = session;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(session.editedOutput || session.output);
  const actions = getReviewActions(session.saved);
  const wordCount = (session.editedOutput || session.output).split(/\s+/).filter(Boolean).length;

  const handleAction = (id: string) => {
    if (id === "copy") {
      navigator.clipboard.writeText(session.editedOutput || session.output).catch(() => {});
      return;
    }
    if (id === "refine") { setEditing(true); return; }
    onAction(id);
  };

  const saveEdit = () => {
    onEdit(editText);
    setEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-3 overflow-y-auto">
      <div className="max-w-xl mx-auto w-full space-y-4">
        {/* Metadata bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
            <p className="text-[11px] font-semibold text-slate-500">Complete · {wordCount} words</p>
          </div>
          <button onClick={() => setEditing(e => !e)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
            style={{ color: config.color, background: config.color + "12" }}>
            {editing ? "Preview" : "Edit"}
          </button>
        </div>

        {/* Topic chip */}
        <div className="px-3 py-2 rounded-xl text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 truncate">
          🎯 {session.topic}
        </div>

        {/* Output */}
        {editing ? (
          <div className="space-y-2">
            <textarea value={editText} onChange={e => setEditText(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 rounded-2xl border border-indigo-200 text-[12px] leading-relaxed
                         resize-none outline-none focus:ring-2 bg-white"
              style={{ boxShadow: `0 0 0 3px ${config.color}10` }}
            />
            <div className="flex gap-2">
              <button onClick={saveEdit}
                className="px-4 py-2 rounded-xl text-white text-[12px] font-bold transition-colors"
                style={{ background: config.color }}>
                Apply edits
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[12px] font-bold hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 max-h-[320px] overflow-y-auto">
            <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap">
              {session.editedOutput || session.output}
            </p>
          </div>
        )}

        {/* Actions */}
        {!editing && (
          <div className="grid grid-cols-2 gap-2">
            {actions.map(a => (
              <button key={a.id} onClick={() => handleAction(a.id)}
                disabled={a.id === "save" && session.saved}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                style={a.style === "primary"
                  ? { background: config.color, color: "#fff", opacity: session.saved && a.id === "save" ? 0.6 : 1 }
                  : a.style === "secondary"
                  ? { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }
                  : { background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }
                }>
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DONE STEP ────────────────────────────────────────────────────────────────

function DoneStep({
  session, onNew, onColor,
}: { session: WorkflowSession; onNew: () => void; onColor: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-5">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
        style={{ background: `linear-gradient(135deg, ${onColor} 0%, ${onColor}88 100%)` }}>
        ✅
      </div>
      <div className="text-center">
        <p className="text-[17px] font-bold text-slate-800">Saved to Output Vault</p>
        <p className="text-[12px] text-slate-500 mt-1">
          "{session.topic.slice(0, 60)}{session.topic.length > 60 ? "…" : ""}"
        </p>
      </div>
      <button onClick={onNew}
        className="px-6 py-2.5 rounded-2xl text-[13px] font-bold text-white transition-all"
        style={{ background: `linear-gradient(135deg, ${onColor} 0%, ${onColor}cc 100%)`, boxShadow: `0 4px 16px ${onColor}33` }}>
        ✨ Create something new
      </button>
    </div>
  );
}

// ─── ERROR STEP ──────────────────────────────────────────────────────────────

function ErrorStep({ session, onRetry }: { session: WorkflowSession; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-4">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl bg-red-50 border border-red-200">
        ⚠️
      </div>
      <div className="text-center max-w-xs">
        <p className="text-[16px] font-bold text-slate-800">Something went wrong</p>
        <p className="text-[12px] text-slate-500 mt-1">{session.error ?? "An unexpected error occurred."}</p>
      </div>
      <button onClick={onRetry}
        className="px-6 py-2.5 rounded-2xl text-[13px] font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
        🔄 Try again
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface WorkflowRunnerProps {
  config: WorkflowConfig;
}

export function WorkflowRunner({ config }: WorkflowRunnerProps) {
  const [session, setSession] = useState<WorkflowSession>(() => createSession(config));
  const abortRef = useRef<AbortController | null>(null);

  // Keep config in sync if props change (e.g. different app)
  useEffect(() => {
    setSession(createSession(config));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.engineId]);

  // ── Run the AI engine ────────────────────────────────────────────────────
  const runEngine = useCallback(async (topic: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Move to output phase immediately
    setSession(s => advancePhase(s, "output_flow", { topic, output: "", editedOutput: "" }));

    try {
      const context = buildEngineContext(config.engineLabel, config.systemHint);
      const prompt  = buildRunPrompt(config.engineLabel, topic, config.systemHint);
      let accumulated = "";

      await streamEngine({
        engineId: config.engineId,
        topic:    prompt,
        context,
        signal:   ctrl.signal,
        onChunk:  chunk => {
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
      setSession(s => advancePhase(s, "error", { error: (err as Error).message ?? "Generation failed." }));
    }
  }, [config]);

  // ── Review actions ───────────────────────────────────────────────────────
  const handleReviewAction = useCallback(async (id: string) => {
    if (id === "save") {
      setSession(s => advancePhase(s, "update_db"));
      const result = await saveToVault(session);
      if (result.success) {
        setSession(s => advancePhase(s, "done", { saved: true }));
      } else {
        setSession(s => advancePhase(s, "error", { error: result.error ?? "Save failed." }));
      }
    } else if (id === "regenerate") {
      runEngine(session.topic);
    } else if (id === "new") {
      setSession(s => resetSession(s));
    }
  }, [session, runEngine]);

  const handleEdit = useCallback((text: string) => {
    setSession(s => ({ ...s, editedOutput: text }));
  }, []);

  const handleNew = useCallback(() => {
    setSession(s => resetSession(s));
  }, []);

  const { phase, config: cfg } = session;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Progress bar — only show on active phases */}
      {phase !== "error" && (
        <div className="bg-white border-b border-slate-100 shrink-0">
          <PhaseBar phase={phase} color={cfg.color} />
        </div>
      )}

      {/* Saving overlay */}
      {phase === "update_db" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: cfg.color, borderTopColor: "transparent" }} />
          <p className="text-[13px] font-semibold text-slate-500">Saving to Vault…</p>
        </div>
      )}

      {phase === "start_search" && (
        <StartSearchStep session={session} onSubmit={runEngine} />
      )}
      {phase === "output_flow" && (
        <OutputFlowStep session={session} />
      )}
      {phase === "review_flow" && (
        <ReviewFlowStep session={session} onAction={handleReviewAction} onEdit={handleEdit} />
      )}
      {phase === "done" && (
        <DoneStep session={session} onNew={handleNew} onColor={cfg.color} />
      )}
      {phase === "error" && (
        <ErrorStep session={session} onRetry={() => runEngine(session.topic)} />
      )}
    </div>
  );
}
