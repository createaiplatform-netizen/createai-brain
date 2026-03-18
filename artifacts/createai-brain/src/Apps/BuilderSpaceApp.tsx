// ═══════════════════════════════════════════════════════════════════════════
// BUILDER SPACE APP
// In-platform code review IDE.
// Every change is generated, shown, and held here until the user approves.
// Nothing applies automatically — the user reviews, edits, and confirms first.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BuilderProposal, BuilderFile, FileStatus, ProposalStatus,
  getProposals, applyProposal, discardProposal, deleteProposal, clearAll,
  updateProposalFile, computeDiff, seedDemoProposal, seedIdentityEngineProposal,
  getStats, addProposal,
} from "@/engine/BuilderSpaceEngine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FILE_STATUS_BADGE: Record<FileStatus, { label: string; cls: string; dot: string }> = {
  new:      { label: "NEW",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  modified: { label: "MOD",  cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400"  },
  deleted:  { label: "DEL",  cls: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500"   },
};

const STATUS_CFG: Record<ProposalStatus, { label: string; cls: string }> = {
  pending:   { label: "Pending Review", cls: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  applied:   { label: "Applied",        cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  discarded: { label: "Discarded",      cls: "text-slate-500 bg-slate-50 border-slate-200" },
};

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60)   return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function extIcon(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".jsx")) return "⚛";
  if (path.endsWith(".ts")  || path.endsWith(".js"))  return "𝒻";
  if (path.endsWith(".css") || path.endsWith(".scss")) return "🎨";
  if (path.endsWith(".json"))                          return "{}";
  if (path.endsWith(".md"))                            return "📝";
  return "📄";
}

// ─── Diff Viewer ──────────────────────────────────────────────────────────────

function DiffViewer({ file }: { file: BuilderFile }) {
  const hunks = useMemo(
    () => computeDiff(file.originalContent, file.proposedContent),
    [file.originalContent, file.proposedContent],
  );

  const addedCount   = hunks.filter(h => h.type === "added").length;
  const removedCount = hunks.filter(h => h.type === "removed").length;
  const hasChanges   = addedCount > 0 || removedCount > 0;

  if (!hasChanges && file.status !== "new" && file.status !== "deleted") {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400">
        <span className="text-lg mb-1">✓</span>
        <p className="text-[11px] font-semibold">No changes in this file</p>
      </div>
    );
  }

  let lineNum = 1;

  return (
    <div className="overflow-auto">
      {/* Stats row */}
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diff</span>
        {addedCount > 0 && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
            +{addedCount}
          </span>
        )}
        {removedCount > 0 && (
          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md">
            -{removedCount}
          </span>
        )}
        <span className="ml-auto text-[9px] text-slate-400">Synthetic — no live data affected</span>
      </div>

      {/* Diff lines */}
      <div className="font-mono text-[11px] leading-5">
        {hunks.map((hunk, idx) => {
          const num = lineNum++;
          const base =
            hunk.type === "added"   ? "bg-emerald-50 border-l-2 border-emerald-400" :
            hunk.type === "removed" ? "bg-rose-50 border-l-2 border-rose-400" :
            "bg-white border-l-2 border-transparent";
          const prefix =
            hunk.type === "added"   ? "+" :
            hunk.type === "removed" ? "−" :
            " ";
          const textCls =
            hunk.type === "added"   ? "text-emerald-800" :
            hunk.type === "removed" ? "text-rose-800" :
            "text-slate-700";

          return (
            <div key={idx} className={`flex items-start ${base} hover:brightness-95 transition-all`}>
              <span className="select-none flex-shrink-0 w-8 text-right pr-2 py-0.5 text-[10px] text-slate-300 bg-slate-50/80">
                {hunk.type !== "removed" ? num : ""}
              </span>
              <span className={`flex-shrink-0 w-5 text-center py-0.5 font-bold ${
                hunk.type === "added" ? "text-emerald-600" : hunk.type === "removed" ? "text-rose-600" : "text-slate-300"
              }`}>
                {prefix}
              </span>
              <span className={`flex-1 py-0.5 pr-3 whitespace-pre-wrap break-all ${textCls}`}>
                {hunk.content || " "}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Code Editor ──────────────────────────────────────────────────────────────

function CodeEditor({
  file, proposalId, onSave,
}: {
  file:       BuilderFile;
  proposalId: string;
  onSave:     () => void;
}) {
  const [value, setValue] = useState(file.proposedContent);
  const [dirty,  setDirty]  = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => { setValue(file.proposedContent); setDirty(false); setSaved(false); }, [file.path]);

  const handleChange = (v: string) => { setValue(v); setDirty(true); setSaved(false); };

  const handleSave = () => {
    updateProposalFile(proposalId, file.path, value);
    setDirty(false);
    setSaved(true);
    onSave();
    setTimeout(() => setSaved(false), 2000);
  };

  const lines = value.split("\n").length;

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
        <span className="text-[10px] text-slate-400 font-mono">{lines} lines</span>
        <span className="text-[9px] text-slate-300">·</span>
        <span className="text-[10px] text-slate-400 font-mono">{file.language.toUpperCase()}</span>
        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <span className="text-[10px] text-amber-600 font-semibold">● unsaved</span>
          )}
          {saved && (
            <span className="text-[10px] text-emerald-600 font-semibold">✓ saved</span>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              dirty
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}>
            Save
          </button>
        </div>
      </div>

      {/* Line-numbered editor */}
      <div className="flex-1 overflow-auto flex font-mono text-[11px] leading-5 min-h-0">
        {/* Line numbers */}
        <div className="select-none flex-shrink-0 w-8 bg-slate-50 border-r border-slate-100 py-2 text-right pr-2">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="text-[10px] text-slate-300 leading-5">{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={value}
          onChange={e => handleChange(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none outline-none p-2 text-slate-800 bg-white text-[11px] font-mono
                     leading-5 placeholder-slate-300 min-h-0"
          style={{ tabSize: 2 }}
          placeholder="// Proposed code will appear here…"
        />
      </div>
    </div>
  );
}

// ─── File Tree ────────────────────────────────────────────────────────────────

function FileTree({
  files, selected, onSelect,
}: {
  files:    BuilderFile[];
  selected: string;
  onSelect: (path: string) => void;
}) {
  return (
    <div className="py-2">
      {files.map(f => {
        const badge = FILE_STATUS_BADGE[f.status];
        const isSelected = f.path === selected;
        const name = f.path.split("/").pop() ?? f.path;
        const dir  = f.path.includes("/") ? f.path.slice(0, f.path.lastIndexOf("/")) : "";

        return (
          <button
            key={f.path}
            onClick={() => onSelect(f.path)}
            className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
              isSelected
                ? "bg-indigo-50 border-l-2 border-indigo-400"
                : "hover:bg-slate-50 border-l-2 border-transparent"
            }`}>
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[11.5px] font-semibold truncate ${isSelected ? "text-indigo-800" : "text-slate-800"}`}>
                {extIcon(name)} {name}
              </p>
              {dir && <p className="text-[9.5px] text-slate-400 truncate">{dir}</p>}
            </div>
            <span className={`flex-shrink-0 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md border ${badge.cls}`}>
              {badge.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Proposal List Card ───────────────────────────────────────────────────────

function ProposalListCard({
  proposal, onClick, onDiscard,
}: {
  proposal: BuilderProposal;
  onClick:  () => void;
  onDiscard:() => void;
}) {
  const st = STATUS_CFG[proposal.status];
  const newFiles = proposal.files.filter(f => f.status === "new").length;
  const modFiles = proposal.files.filter(f => f.status === "modified").length;

  return (
    <div
      className={`rounded-2xl border bg-white p-3.5 transition-all cursor-pointer hover:shadow-sm ${
        proposal.status === "pending"   ? "border-slate-200 hover:border-indigo-200" :
        proposal.status === "applied"   ? "border-emerald-200 opacity-80" :
        "border-slate-100 opacity-60"
      }`}
      onClick={proposal.status === "pending" ? onClick : undefined}>
      {/* Header row */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-900 leading-snug mb-0.5 truncate">{proposal.title}</p>
          <p className="text-[10.5px] text-slate-500 leading-snug line-clamp-2">{proposal.description}</p>
        </div>
        <span className={`flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>
          {st.label}
        </span>
      </div>

      {/* File summary */}
      <div className="flex items-center gap-2 mb-2.5">
        {newFiles > 0 && (
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
            +{newFiles} new
          </span>
        )}
        {modFiles > 0 && (
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
            ~{modFiles} changed
          </span>
        )}
        <span className="text-[9.5px] text-slate-400 ml-auto">{timeAgo(proposal.createdAt)}</span>
      </div>

      {/* Tags */}
      {proposal.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2.5">
          {proposal.tags.map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{t}</span>
          ))}
        </div>
      )}

      {/* Actions for pending */}
      {proposal.status === "pending" && (
        <div className="flex gap-2">
          <button onClick={e => { e.stopPropagation(); onClick(); }}
            className="flex-1 py-2 rounded-xl text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            Review & Apply
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDiscard(); }}
            className="py-2 px-3 rounded-xl text-[11px] font-bold bg-slate-50 border border-slate-200
                       text-slate-500 hover:bg-slate-100 transition-colors">
            ✕
          </button>
        </div>
      )}

      {/* Applied indicator */}
      {proposal.status === "applied" && (
        <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <span className="text-[11px] text-emerald-700 font-bold">✓ Applied and active</span>
        </div>
      )}
    </div>
  );
}

// ─── Proposal Detail ──────────────────────────────────────────────────────────

function ProposalDetail({
  proposal, onBack, onApply, onDiscard, onFileSave,
}: {
  proposal:   BuilderProposal;
  onBack:     () => void;
  onApply:    () => void;
  onDiscard:  () => void;
  onFileSave: () => void;
}) {
  const [selectedPath, setSelectedPath]  = useState(proposal.files[0]?.path ?? "");
  const [view, setView]                  = useState<"edit" | "diff">("diff");
  const [applying, setApplying]          = useState(false);
  const [applied, setApplied]            = useState(false);

  const selectedFile = useMemo(
    () => proposal.files.find(f => f.path === selectedPath) ?? proposal.files[0],
    [proposal.files, selectedPath],
  );

  const handleApply = () => {
    setApplying(true);
    setTimeout(() => {
      applyProposal(proposal.id);
      setApplying(false);
      setApplied(true);
      setTimeout(onApply, 1200);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-50">
          <button onClick={onBack}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800
                       px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
            ← Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-slate-900 truncate">{proposal.title}</p>
          </div>
          <span className="flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full
                           bg-indigo-50 text-indigo-700 border border-indigo-200">
            {proposal.status}
          </span>
        </div>

        {/* File tabs */}
        <div className="flex gap-1 px-3 py-1.5 overflow-x-auto scrollbar-hide">
          {proposal.files.map(f => {
            const name  = f.path.split("/").pop() ?? f.path;
            const badge = FILE_STATUS_BADGE[f.status];
            return (
              <button
                key={f.path}
                onClick={() => setSelectedPath(f.path)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10.5px]
                             font-bold border transition-colors ${
                  selectedPath === f.path
                    ? "bg-indigo-600 text-white border-transparent"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                <span className="truncate max-w-[100px]">{name}</span>
              </button>
            );
          })}
        </div>

        {/* Edit / Diff toggle */}
        {selectedFile && (
          <div className="flex gap-1 px-3 pb-2">
            {(["diff", "edit"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`flex-1 py-1.5 rounded-xl text-[10.5px] font-bold border transition-colors ${
                  view === v
                    ? "bg-slate-800 text-white border-transparent"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}>
                {v === "diff" ? "🔍 Diff" : "✏️ Edit"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── File panel ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto min-h-0 bg-white">
        {selectedFile ? (
          view === "diff" ? (
            <DiffViewer file={selectedFile} />
          ) : (
            <CodeEditor file={selectedFile} proposalId={proposal.id} onSave={onFileSave} />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p className="text-[12px]">Select a file</p>
          </div>
        )}
      </div>

      {/* ── Action bar ─────────────────────────────────────────────── */}
      {proposal.status === "pending" && (
        <div className="flex-shrink-0 border-t border-slate-100 bg-white p-3">
          {applied ? (
            <div className="flex items-center gap-2 justify-center py-2.5 rounded-2xl
                            bg-emerald-50 border border-emerald-200">
              <span className="text-[12px] font-bold text-emerald-700">✓ Proposal applied</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                disabled={applying}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[12px]
                             font-bold transition-all ${
                  applying
                    ? "bg-indigo-100 text-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200"
                }`}>
                {applying ? (
                  <><span className="w-3 h-3 rounded-full border-2 border-indigo-300 border-t-white animate-spin" />
                  <span>Applying…</span></>
                ) : (
                  <><span>✓</span><span>Apply Proposal</span></>
                )}
              </button>
              <button
                onClick={onDiscard}
                className="py-3 px-4 rounded-2xl text-[12px] font-bold bg-slate-50 border border-slate-200
                           text-slate-500 hover:bg-slate-100 transition-colors">
                ✕
              </button>
            </div>
          )}

          {/* Safety note */}
          <p className="text-[9.5px] text-slate-400 text-center mt-2">
            🛡️ Apply marks this proposal as approved. Changes are then executed safely on request.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── New Proposal Modal ───────────────────────────────────────────────────────

function NewProposalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle]   = useState("");
  const [desc,  setDesc]    = useState("");
  const [path,  setPath]    = useState("");
  const [code,  setCode]    = useState("");
  const [step,  setStep]    = useState<"info" | "file">("info");

  const handleCreate = () => {
    if (!title.trim()) return;
    addProposal({
      title:       title.trim(),
      description: desc.trim() || "Manual proposal",
      source:      "manual",
      tags:        [],
      files: path.trim() ? [{
        path:            path.trim(),
        language:        path.split(".").pop() ?? "ts",
        status:          "new",
        originalContent: "",
        proposedContent: code,
      }] : [],
    });
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full bg-white rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900">New Proposal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
        </div>

        {step === "info" ? (
          <>
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="What are you proposing?"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] outline-none
                           focus:border-indigo-400 transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                placeholder="Explain what this change does and why…"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[12px] outline-none
                           resize-none focus:border-indigo-400 transition-colors" />
            </div>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-[12px] font-bold bg-slate-50 border border-slate-200
                           text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button onClick={() => setStep("file")} disabled={!title.trim()}
                className="flex-1 py-3 rounded-2xl text-[12px] font-bold bg-indigo-600 text-white
                           hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">File Path (optional)</label>
              <input value={path} onChange={e => setPath(e.target.value)}
                placeholder="src/components/MyComponent.tsx"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[12px] font-mono outline-none
                           focus:border-indigo-400 transition-colors" />
            </div>
            {path.trim() && (
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Proposed Code</label>
                <textarea value={code} onChange={e => setCode(e.target.value)} rows={8}
                  placeholder="// Paste or write proposed code here…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[11px] font-mono outline-none
                             resize-none focus:border-indigo-400 transition-colors leading-5" />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep("info")}
                className="py-3 px-4 rounded-2xl text-[12px] font-bold bg-slate-50 border border-slate-200 text-slate-600">
                ← Back
              </button>
              <button onClick={handleCreate}
                className="flex-1 py-3 rounded-2xl text-[12px] font-bold bg-indigo-600 text-white hover:bg-indigo-700">
                Create Proposal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function BuilderSpaceApp() {
  const [proposals,   setProposals]   = useState<BuilderProposal[]>([]);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [filter,      setFilter]      = useState<"all" | "pending" | "applied">("pending");
  const [showNewModal,setShowNew]     = useState(false);

  const refresh = useCallback(() => {
    setProposals(getProposals());
  }, []);

  useEffect(() => {
    seedDemoProposal();
    seedIdentityEngineProposal();
    refresh();
  }, []);

  const stats = useMemo(() => {
    const total   = proposals.length;
    const pending = proposals.filter(p => p.status === "pending").length;
    const applied = proposals.filter(p => p.status === "applied").length;
    const files   = proposals.filter(p => p.status === "pending").reduce((s, p) => s + p.files.length, 0);
    return { total, pending, applied, files };
  }, [proposals]);

  const filtered = useMemo(() => {
    if (filter === "pending") return proposals.filter(p => p.status === "pending");
    if (filter === "applied") return proposals.filter(p => p.status === "applied");
    return proposals;
  }, [proposals, filter]);

  const selectedProposal = useMemo(
    () => proposals.find(p => p.id === selected) ?? null,
    [proposals, selected],
  );

  const handleDiscard = (id: string) => {
    discardProposal(id);
    if (selected === id) setSelected(null);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteProposal(id);
    if (selected === id) setSelected(null);
    refresh();
  };

  // ── Showing detail view ────────────────────────────────────────────────────
  if (selectedProposal) {
    return (
      <div className="flex flex-col h-full bg-white">
        <ProposalDetail
          proposal={selectedProposal}
          onBack={() => setSelected(null)}
          onApply={() => { setSelected(null); refresh(); }}
          onDiscard={() => { handleDiscard(selectedProposal.id); setSelected(null); }}
          onFileSave={() => refresh()}
        />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <div>
            <h1 className="text-[16px] font-bold text-slate-900">Builder Space</h1>
            <p className="text-[11px] text-slate-500">
              Changes proposed, never applied without your review.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold
                       bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-all">
            + New
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-1.5 px-4 py-3">
        {[
          { label: "Pending",  value: stats.pending, color: "text-indigo-700" },
          { label: "Applied",  value: stats.applied, color: "text-emerald-700" },
          { label: "Files",    value: stats.files,   color: "text-amber-700" },
          { label: "Total",    value: stats.total,   color: "text-slate-700" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white py-2 px-1.5 text-center">
            <p className={`text-[15px] font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex gap-1.5 px-4 pb-2">
        {(["pending", "applied", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-[10.5px] font-bold border transition-colors capitalize ${
              filter === f
                ? "bg-indigo-600 text-white border-transparent"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* ── Proposal list ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl">🔧</div>
            <div>
              <p className="text-[13px] font-bold text-slate-700 mb-1">
                {filter === "pending" ? "No pending proposals" : "Nothing here yet"}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                {filter === "pending"
                  ? "Describe a feature or improvement and it will appear here for review before anything changes."
                  : "Proposals you've applied will appear here."}
              </p>
            </div>
            {filter === "pending" && (
              <button onClick={() => setShowNew(true)}
                className="px-4 py-2.5 rounded-2xl text-[12px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                + Create Proposal
              </button>
            )}
          </div>
        ) : (
          <>
            {filtered.map(p => (
              <ProposalListCard
                key={p.id}
                proposal={p}
                onClick={() => setSelected(p.id)}
                onDiscard={() => handleDiscard(p.id)}
              />
            ))}

            {/* Platform directive footer */}
            <div className="rounded-2xl border border-slate-100 bg-white p-3.5 mt-2">
              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">Platform Promise</p>
              <p className="text-[10.5px] text-slate-500 leading-relaxed">
                Every change generated by the AI is presented here first.
                Nothing applies automatically. You review every file, edit the proposed code if needed,
                and confirm before anything takes effect. Your platform, your rules.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── New proposal modal ─────────────────────────────────────── */}
      {showNewModal && (
        <NewProposalModal
          onClose={() => setShowNew(false)}
          onCreated={() => refresh()}
        />
      )}
    </div>
  );
}
