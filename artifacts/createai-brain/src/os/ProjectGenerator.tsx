import React, { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedFile {
  id: string;
  name: string;
  content: string;
  type: string;
  folderId: string;
  size: string;
  created: string;
}

interface GeneratedFolder {
  id: string;
  name: string;
  icon: string;
  universal: boolean;
  count: number;
}

export interface GeneratedProject {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: string;
  color: string;
  created: string;
  folders: GeneratedFolder[];
  files: GeneratedFile[];
  features: string[];
  subApps: [];
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "analyzing",
    icon: "🧠",
    label: "Analyzing your brainstorm",
    sublabel: "Reading conversation and identifying the core idea…",
    color: "#6366f1",
  },
  {
    id: "structuring",
    icon: "🗂️",
    label: "Building project structure",
    sublabel: "Creating folders, organizing sections, mapping features…",
    color: "#8b5cf6",
  },
  {
    id: "writing",
    icon: "✍️",
    label: "Writing starter content",
    sublabel: "Generating project overview, roadmap, requirements, and more…",
    color: "#06b6d4",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepRow({
  step,
  status,
}: {
  step: (typeof STEPS)[0];
  status: "waiting" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 transition-all duration-500"
        style={{
          background:
            status === "done"
              ? "#f0fdf4"
              : status === "active"
              ? `${step.color}18`
              : "rgba(0,0,0,0.04)",
          border: `1.5px solid ${
            status === "done"
              ? "#86efac"
              : status === "active"
              ? `${step.color}40`
              : "rgba(0,0,0,0.07)"
          }`,
        }}
      >
        {status === "done" ? "✅" : step.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold leading-tight transition-all duration-300"
          style={{
            color:
              status === "done"
                ? "#15803d"
                : status === "active"
                ? "#0f172a"
                : "#9ca3af",
          }}
        >
          {step.label}
        </p>
        {status === "active" && (
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
            {step.sublabel}
          </p>
        )}
      </div>
      {status === "active" && (
        <div className="flex gap-1 flex-shrink-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ background: step.color, animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureTag({ text }: { text: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium"
      style={{ background: "rgba(99,102,241,0.08)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.15)" }}
    >
      <span className="text-[10px]">✦</span>
      {text}
    </div>
  );
}

function FileRow({ file, color }: { file: GeneratedFile; color: string }) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "doc";
  const icons: Record<string, string> = { md: "📝", txt: "📄", json: "📋", csv: "📊", pdf: "📑" };
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
      style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <span className="text-base flex-shrink-0">{icons[ext] ?? "📄"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium truncate" style={{ color: "#0f172a" }}>{file.name}</p>
        <p className="text-[10px]" style={{ color: "#9ca3af" }}>{file.size} · {file.created}</p>
      </div>
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProjectGeneratorProps {
  isOpen: boolean;
  sessionId: number;
  onClose: () => void;
  onProjectReady: (project: GeneratedProject) => void;
}

type Phase = "idle" | "running" | "done" | "error";

export function ProjectGenerator({
  isOpen,
  sessionId,
  onClose,
  onProjectReady,
}: ProjectGeneratorProps) {
  const [phase, setPhase]           = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [project, setProject]       = useState<GeneratedProject | null>(null);
  const [errorMsg, setErrorMsg]     = useState("");
  const [elapsed, setElapsed]       = useState(0);

  const run = useCallback(async () => {
    setPhase("running");
    setActiveStep(0);
    setProject(null);
    setErrorMsg("");
    setElapsed(0);

    const stepTimer = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next >= 6 && next < 14) setActiveStep(1);
        if (next >= 14) setActiveStep(2);
        return next;
      });
    }, 1000);

    try {
      const res = await fetch(`/api/brainstorm/sessions/${sessionId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      clearInterval(stepTimer);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        setErrorMsg(errData.error ?? "Project generation failed");
        setPhase("error");
        return;
      }

      const data = await res.json() as { project: GeneratedProject };
      setProject(data.project);
      setPhase("done");
    } catch (err) {
      clearInterval(stepTimer);
      setErrorMsg("Network error — please try again");
      setPhase("error");
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && phase === "idle") run();
  }, [isOpen, phase, run]);

  useEffect(() => {
    if (!isOpen) {
      setPhase("idle");
      setActiveStep(0);
      setProject(null);
      setErrorMsg("");
      setElapsed(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(4px)" }}
        onClick={phase === "done" || phase === "error" ? onClose : undefined}
      />

      {/* Panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="w-full max-w-[520px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 24px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
            pointerEvents: "all",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-6 py-5 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 12px rgba(99,102,241,0.30)" }}
            >
              {phase === "done" ? "🚀" : phase === "error" ? "⚠️" : "⚙️"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px]" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
                {phase === "done"
                  ? "Project Ready"
                  : phase === "error"
                  ? "Generation Failed"
                  : "Generating Project"}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
                {phase === "done"
                  ? `${project?.files.length ?? 0} files · ${project?.folders.length ?? 0} folders created`
                  : phase === "error"
                  ? "Something went wrong"
                  : "This usually takes 10–20 seconds…"}
              </p>
            </div>
            {(phase === "done" || phase === "error") && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all"
                style={{ color: "#9ca3af", background: "rgba(0,0,0,0.05)" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* ── Running / analyzing ── */}
            {phase === "running" && (
              <div className="px-6 py-6 space-y-4">
                <div
                  className="w-full rounded-2xl p-4 mb-2"
                  style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.12)" }}
                >
                  <p className="text-[12px] text-center font-medium" style={{ color: "#6366f1" }}>
                    ✦ CreateAI is reading your brainstorm and building a complete project for you
                  </p>
                </div>
                <div className="space-y-4">
                  {STEPS.map((step, i) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      status={i < activeStep ? "done" : i === activeStep ? "active" : "waiting"}
                    />
                  ))}
                </div>
                <div className="pt-2">
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min((elapsed / 20) * 100, 90)}%`,
                        background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Error ── */}
            {phase === "error" && (
              <div className="px-6 py-8 text-center space-y-4">
                <div className="text-4xl">😔</div>
                <p className="text-[14px] font-semibold" style={{ color: "#0f172a" }}>
                  Generation didn't complete
                </p>
                <p className="text-[12px] leading-relaxed max-w-xs mx-auto" style={{ color: "#6b7280" }}>
                  {errorMsg}
                </p>
                <button
                  onClick={run}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
                  style={{ background: "#6366f1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.30)" }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* ── Done ── */}
            {phase === "done" && project && (
              <div className="px-6 py-5 space-y-5">
                {/* Project card */}
                <div
                  className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: `${project.color}10`, border: `1.5px solid ${project.color}25` }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${project.color}20` }}
                  >
                    {project.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] leading-tight" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
                      {project.name}
                    </p>
                    <p className="text-[11px] mt-0.5 font-medium" style={{ color: project.color }}>
                      {project.industry}
                    </p>
                    <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "#4b5563" }}>
                      {project.description}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: "🗂️", count: project.folders.length, label: "Folders" },
                    { icon: "📄", count: project.files.length, label: "Starter Files" },
                    { icon: "✦", count: project.features.length, label: "Features" },
                  ].map(s => (
                    <div
                      key={s.label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}
                    >
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div className="font-bold text-[18px]" style={{ color: "#0f172a" }}>{s.count}</div>
                      <div className="text-[10px]" style={{ color: "#9ca3af" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Features */}
                {project.features.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9ca3af" }}>
                      Key Features
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.features.map((f, i) => (
                        <FeatureTag key={i} text={f} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated files */}
                {project.files.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9ca3af" }}>
                      Generated Files
                    </p>
                    <div className="space-y-2">
                      {project.files.map(f => (
                        <FileRow key={f.id} file={f} color={project.color} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {phase === "done" && project && (
            <div
              className="px-6 py-4 flex-shrink-0 flex items-center gap-3"
              style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
            >
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                style={{ background: "#f1f5f9", color: "#374151", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                Close
              </button>
              <button
                onClick={() => { onProjectReady(project); onClose(); }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "#fff",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}
              >
                Open in ProjectOS →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
