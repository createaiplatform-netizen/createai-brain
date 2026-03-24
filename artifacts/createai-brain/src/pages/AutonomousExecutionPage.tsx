import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAutonomousExecution, type PlanStep, type StepResult } from "@/hooks/aes/useAutonomousExecution";
import { ExecutionStepCard } from "@/components/aes/ExecutionStepCard";
import { ExecutionResults }  from "@/components/aes/ExecutionResults";
import { EngineStatsPanel }  from "@/components/aes/EngineStatsPanel";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      "#050A18",
  panel:   "rgba(255,255,255,0.03)",
  card:    "rgba(255,255,255,0.04)",
  border:  "rgba(255,255,255,0.08)",
  borderA: "rgba(99,102,241,0.40)",
  text:    "#e2e8f0",
  sub:     "#94a3b8",
  dim:     "#64748b",
  indigo:  "#6366f1",
  green:   "#10b981",
  red:     "#ef4444",
  orange:  "#f59e0b",
};

// ── Template types ────────────────────────────────────────────────────────────
interface Template {
  id:          string;
  name:        string;
  capability:  string;
  description: string;
  variables:   string[];
  outputType:  string;
}

// ── Step animation state ──────────────────────────────────────────────────────
type StepStatus = "pending" | "running" | "success" | "failed";

function useStepAnimation(
  planSteps: PlanStep[],
  results:   StepResult[],
  active:    boolean,
) {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  useEffect(() => {
    clear();
    if (!active || planSteps.length === 0) {
      setStepStatuses([]);
      setVisibleCount(0);
      return;
    }

    // Start with all pending
    const initial: StepStatus[] = planSteps.map(() => "pending");
    setStepStatuses(initial);
    setVisibleCount(planSteps.length);

    if (results.length > 0) {
      // Results are in — animate reveal sequentially
      let delay = 0;
      planSteps.forEach((_, i) => {
        const runDelay  = delay;
        const doneDelay = delay + 350;
        delay += 500;

        timerRefs.current.push(
          setTimeout(() => {
            setStepStatuses(prev => {
              const next = [...prev];
              next[i] = "running";
              return next;
            });
          }, runDelay),
        );
        timerRefs.current.push(
          setTimeout(() => {
            const r = results.find(r => r.stepIndex === i);
            setStepStatuses(prev => {
              const next = [...prev];
              next[i] = (r?.success ?? true) ? "success" : "failed";
              return next;
            });
          }, doneDelay),
        );
      });
    } else {
      // Still loading — pulse first step as running
      setStepStatuses(planSteps.map((_, i) => (i === 0 ? "running" : "pending")));
    }

    return clear;
  }, [active, planSteps.length, results.length, clear]);

  return { stepStatuses, visibleCount };
}

// ── Context key-value builder ─────────────────────────────────────────────────
interface ContextEntry { key: string; value: string; }

function ContextBuilder({
  entries, onChange,
}: {
  entries: ContextEntry[];
  onChange: (entries: ContextEntry[]) => void;
}) {
  const add = () => onChange([...entries, { key: "", value: "" }]);
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const update = (i: number, field: "key" | "value", val: string) => {
    const next = entries.map((e, idx) => idx === i ? { ...e, [field]: val } : e);
    onChange(next);
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    padding: "5px 9px",
    fontSize: 12,
    color: T.text,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.dim,
          letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Context (optional)
        </span>
        <button onClick={add} style={{
          background: "none", border: "none", color: T.indigo,
          cursor: "pointer", fontSize: 11, padding: 0, fontWeight: 600,
        }}>
          + Add field
        </button>
      </div>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            value={e.key}
            onChange={ev => update(i, "key", ev.target.value)}
            placeholder="key"
            style={{ ...inputStyle, flex: "0 0 35%" }}
          />
          <input
            value={e.value}
            onChange={ev => update(i, "value", ev.target.value)}
            placeholder="value"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={() => remove(i)} style={{
            background: "none", border: "none", color: T.dim,
            cursor: "pointer", fontSize: 14, padding: "0 4px", lineHeight: 1,
          }}>
            \u00D7
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Example goals ─────────────────────────────────────────────────────────────
const EXAMPLE_GOALS = [
  "Create a marketing campaign to acquire 100 new customers",
  "Build a complete business plan for a healthcare SaaS startup",
  "Automate the invoice and billing workflow for clients",
  "Hire a senior engineer — job post, interviews, compliance",
  "Launch a product with email, social, and paid ads",
  "Generate a go-to-market strategy for a new B2B product",
  "Set up lead generation and nurture workflow for SMBs",
  "Run a compliance audit and produce required legal documents",
];

// ── Right panel tab ───────────────────────────────────────────────────────────
type RightTab = "stats" | "templates";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AutonomousExecutionPage() {
  const { status, result, error, execute, reset } = useAutonomousExecution();

  const [goal,      setGoal]      = useState("");
  const [context,   setContext]   = useState<ContextEntry[]>([]);
  const [rightTab,  setRightTab]  = useState<RightTab>("stats");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tmplLoad,  setTmplLoad]  = useState(false);
  const goalRef = useRef<HTMLTextAreaElement>(null);

  const planSteps: PlanStep[] = result?.plan.steps ?? [];
  const results:  StepResult[] = result?.results ?? [];

  const isActive = status === "loading" || status === "success";
  const { stepStatuses } = useStepAnimation(planSteps, results, isActive);

  // Load templates
  useEffect(() => {
    setTmplLoad(true);
    fetch(`${BASE}/api/outcome/templates`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { templates: [] })
      .then(d => setTemplates(Array.isArray(d.templates) ? d.templates : []))
      .catch(() => {})
      .finally(() => setTmplLoad(false));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || status === "loading") return;
    const ctx: Record<string, string> = {};
    context.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) ctx[key.trim()] = value.trim();
    });
    await execute(goal.trim(), ctx);
  }, [goal, context, status, execute]);

  const handleReset = () => {
    reset();
    setGoal("");
    setContext([]);
    setTimeout(() => goalRef.current?.focus(), 50);
  };

  const injectTemplate = (t: Template) => {
    setGoal(t.name + " — " + t.description);
    setContext(t.variables.map(v => ({ key: v, value: "" })));
    setRightTab("stats");
    setTimeout(() => goalRef.current?.focus(), 50);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const sectionHead: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: T.dim, margin: "0 0 10px",
  };

  const btn = (primary = false, disabled = false): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 7, padding: "9px 20px", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700, fontSize: 13, border: "none", transition: "opacity 0.15s",
    opacity: disabled ? 0.5 : 1,
    background: primary
      ? (disabled ? "rgba(99,102,241,0.40)" : T.indigo)
      : "rgba(255,255,255,0.06)",
    color: primary ? "#fff" : T.sub,
  });

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "6px 0", borderRadius: 7, border: "none",
    cursor: "pointer", fontSize: 11, fontWeight: 700,
    background: active ? "rgba(99,102,241,0.14)" : "transparent",
    color: active ? T.indigo : T.dim,
    transition: "all 0.15s",
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      color: T.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* ── Top bar ── */}
      <div style={{
        borderBottom: `1px solid ${T.border}`,
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "rgba(0,0,0,0.30)",
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, color: "#fff", flexShrink: 0,
        }}>
          \u26A1
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>
            Autonomous Execution System
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: T.dim }}>
            Describe a goal — the system generates a strategy, selects engines, and executes autonomously
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {status !== "idle" && (
            <button onClick={handleReset} style={btn(false)}>
              \u21BA New Goal
            </button>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 6,
            background: "rgba(16,185,129,0.10)",
            border: "1px solid rgba(16,185,129,0.20)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%",
              background: T.green, display: "inline-block" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.green }}>
              AES Online
            </span>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ── Left column: input + plan + results ── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: 20,
          minWidth: 0,
        }}>

          {/* ── Goal form ── */}
          {status === "idle" || status === "error" ? (
            <form onSubmit={handleSubmit} style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 14, padding: 20,
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              <p style={sectionHead}>Define Your Goal</p>

              {/* Goal textarea */}
              <div>
                <textarea
                  ref={goalRef}
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="Describe what you want to achieve\u2026 e.g. \u201CLaunch a product campaign targeting healthcare companies\u201D"
                  rows={4}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${goal ? T.borderA : T.border}`,
                    borderRadius: 10, padding: "12px 14px",
                    fontSize: 14, color: T.text, outline: "none",
                    resize: "vertical", lineHeight: 1.55,
                    fontFamily: "inherit",
                    transition: "border-color 0.15s",
                  }}
                />
              </div>

              {/* Context builder */}
              <ContextBuilder entries={context} onChange={setContext} />

              {/* Example goals */}
              <div>
                <p style={{ ...sectionHead, marginBottom: 6 }}>Quick Examples</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {EXAMPLE_GOALS.slice(0, 5).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      style={{
                        background: "rgba(99,102,241,0.08)",
                        border: "1px solid rgba(99,102,241,0.18)",
                        borderRadius: 6, padding: "4px 10px",
                        fontSize: 11, color: T.indigo, cursor: "pointer",
                        fontWeight: 600, transition: "background 0.12s",
                        textAlign: "left",
                      }}
                    >
                      {g.length > 42 ? g.slice(0, 42) + "\u2026" : g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {status === "error" && error && (
                <div style={{
                  padding: "10px 12px", borderRadius: 8,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.22)",
                  fontSize: 12, color: T.red,
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button type="submit" disabled={!goal.trim()} style={btn(true, !goal.trim())}>
                  \u26A1 Execute Goal
                </button>
                <span style={{ fontSize: 11, color: T.dim }}>
                  \u2318+Enter to submit
                </span>
              </div>
            </form>
          ) : (
            /* Goal recap pill */
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(99,102,241,0.08)",
              border: `1px solid rgba(99,102,241,0.22)`,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>\u26A1</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 11, color: T.dim, marginBottom: 2 }}>
                  GOAL
                </p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text }}>
                  {result?.goal ?? goal}
                </p>
              </div>
            </div>
          )}

          {/* ── Loading state ── */}
          {status === "loading" && planSteps.length === 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "16px 20px", borderRadius: 12,
              background: T.card, border: `1px solid ${T.border}`,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${T.indigo}`,
                borderTopColor: "transparent",
                animation: "aes-spin 0.8s linear infinite",
              }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>
                  Generating execution plan\u2026
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: T.dim }}>
                  Strategy planner is analyzing your goal
                </p>
              </div>
            </div>
          )}

          {/* ── Execution plan ── */}
          {(planSteps.length > 0 || (result && planSteps.length === 0)) && (
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <p style={{ ...sectionHead, margin: 0 }}>Execution Plan</p>
                {result && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
                    background: result.plan.source === "deterministic"
                      ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    color: result.plan.source === "deterministic" ? T.green : T.orange,
                  }}>
                    {result.plan.source}
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontSize: 11, color: T.dim }}>
                  {planSteps.length} step{planSteps.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {planSteps.map((step, i) => (
                  <ExecutionStepCard
                    key={step.stepIndex}
                    plan={step}
                    result={results.find(r => r.stepIndex === step.stepIndex)}
                    status={stepStatuses[i] ?? "pending"}
                    index={i}
                    isLast={i === planSteps.length - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {status === "success" && result && (
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: 20,
            }}>
              <p style={sectionHead}>Execution Results</p>
              <ExecutionResults result={result} />
            </div>
          )}

          {/* ── Step outputs accordion ── */}
          {status === "success" && result && result.results.length > 0 && (
            <div style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: 20,
            }}>
              <p style={sectionHead}>Step Outputs</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.results.map(r => (
                  <StepOutputCard key={r.stepIndex} result={r} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: stats + templates ── */}
        <div style={{
          width: 300, flexShrink: 0,
          borderLeft: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column",
          background: "rgba(0,0,0,0.20)",
          overflowY: "auto",
        }}>
          {/* Tab switcher */}
          <div style={{
            padding: "10px 12px 0",
            borderBottom: `1px solid ${T.border}`,
            display: "flex", gap: 4,
            background: "rgba(0,0,0,0.10)",
          }}>
            <button style={tabBtn(rightTab === "stats")}
              onClick={() => setRightTab("stats")}>
              {"\uD83D\uDCCA"} Stats
            </button>
            <button style={tabBtn(rightTab === "templates")}
              onClick={() => setRightTab("templates")}>
              {"\uD83D\uDCCB"} Templates
            </button>
          </div>

          <div style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
            {rightTab === "stats" && <EngineStatsPanel />}

            {rightTab === "templates" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={sectionHead}>Pre-built Templates</p>
                {tmplLoad ? (
                  <p style={{ fontSize: 11, color: T.dim }}>Loading\u2026</p>
                ) : templates.length === 0 ? (
                  <p style={{ fontSize: 11, color: T.dim }}>No templates available.</p>
                ) : (
                  templates.map(t => (
                    <TemplateCard key={t.id} template={t} onUse={injectTemplate} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Spinner keyframes ── */}
      <style>{`
        @keyframes aes-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Step output card (expandable) ─────────────────────────────────────────────
function StepOutputCard({ result }: { result: StepResult }) {
  const [open, setOpen] = useState(false);
  const srcColors: Record<string, string> = {
    template: "#3b82f6", cache: "#8b5cf6",
    deterministic: "#10b981", ai: "#f59e0b",
  };
  const color = srcColors[result.source] ?? T.dim;
  return (
    <div style={{
      borderRadius: 9, overflow: "hidden",
      border: `1px solid ${T.border}`,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "rgba(255,255,255,0.03)",
          border: "none", cursor: "pointer",
          padding: "9px 12px", display: "flex", alignItems: "center", gap: 8,
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, color: T.text,
          padding: "1px 5px", borderRadius: 3,
          background: "rgba(255,255,255,0.07)" }}>
          {result.stepIndex + 1}
        </span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.text }}>
          {result.description}
        </span>
        <span style={{
          fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700,
          textTransform: "uppercase" as const, letterSpacing: "0.06em",
          background: `${color}1a`, color,
        }}>
          {result.source}
        </span>
        <span style={{ fontSize: 11, color: T.dim, flexShrink: 0 }}>
          {open ? "\u25B4" : "\u25BE"}
        </span>
      </button>
      {open && (
        <div style={{
          padding: "10px 12px",
          background: "rgba(0,0,0,0.25)",
          borderTop: `1px solid ${T.border}`,
          fontSize: 12, color: T.sub,
          whiteSpace: "pre-wrap", lineHeight: 1.65,
          maxHeight: 320, overflowY: "auto",
        }}>
          {result.output || "\u2014 No output returned"}
        </div>
      )}
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({
  template, onUse,
}: { template: Template; onUse: (t: Template) => void }) {
  return (
    <div style={{
      borderRadius: 9, padding: "10px 12px",
      background: T.card, border: `1px solid ${T.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text }}>
            {template.name}
          </p>
          <p style={{ margin: "3px 0 6px", fontSize: 11, color: T.dim }}>
            {template.description}
          </p>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const,
              letterSpacing: "0.06em", padding: "2px 6px", borderRadius: 4,
              background: "rgba(99,102,241,0.10)", color: "#6366f1",
            }}>
              {template.capability.replace(/_/g, " ")}
            </span>
            <span style={{
              fontSize: 9, padding: "2px 6px", borderRadius: 4,
              background: "rgba(255,255,255,0.05)", color: T.dim,
            }}>
              {template.outputType}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onUse(template)}
        style={{
          marginTop: 9, width: "100%",
          background: "rgba(99,102,241,0.10)",
          border: "1px solid rgba(99,102,241,0.22)",
          borderRadius: 7, padding: "6px 0",
          fontSize: 11, fontWeight: 700, color: "#6366f1",
          cursor: "pointer", transition: "background 0.12s",
        }}
      >
        Use Template
      </button>
    </div>
  );
}
