import React, { useState, useEffect } from "react";

interface Project {
  id: string;
  name: string;
  icon: string;
  industry: string;
}

interface Props {
  content: string;
  label: string;
  defaultFileType?: string;
  onClose: () => void;
}

export function SaveToProjectModal({ content, label, defaultFileType = "Document", onClose }: Props) {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<string>("");
  const [fileName, setFileName]   = useState(label.slice(0, 60));
  const [fileType, setFileType]   = useState(defaultFileType);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setProjects(d.projects ?? []);
        if (d.projects?.length) setSelected(d.projects[0].id);
      })
      .catch(() => setError("Could not load projects"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!selected || !fileName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selected}/files`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fileName.trim(),
          fileType,
          content,
          size: `${Math.round(content.length / 1024 * 10) / 10} KB`,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const selectedProject = projects.find(p => p.id === selected);
      fetch("/api/activity", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "file_saved",
          label: `Saved "${fileName.trim()}" to ${selectedProject?.name ?? "project"}`,
          icon: "💾",
          appId: "documents",
          projectId: selected,
        }),
      }).catch(() => {});
      setSaved(true);
      setTimeout(onClose, 1000);
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl" style={{ background: "#0d1117", border: "1px solid rgba(99,102,241,0.30)" }}>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-white">Save to Project</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Choose a project and name this file</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">✕</button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-xl text-[12px] text-red-400" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-6 text-slate-400 text-sm">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-slate-400 text-sm">No projects yet.</p>
            <p className="text-[11px] text-slate-500">Create a project in ProjectOS first, then save content here.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Project</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {projects.map(p => (
                  <button key={p.id} onClick={() => setSelected(p.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: selected === p.id ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selected === p.id ? "rgba(99,102,241,0.40)" : "rgba(255,255,255,0.07)"}`,
                    }}>
                    <span className="text-base">{p.icon || "📁"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.industry}</p>
                    </div>
                    {selected === p.id && <span className="text-[#818cf8] text-xs font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">File Name</label>
              <input
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder="Name this file…"
                className="w-full px-3 py-2.5 rounded-xl text-[13px] text-white outline-none"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">File Type</label>
              <div className="flex flex-wrap gap-1.5">
                {["Document","Script","Spreadsheet","Presentation","Video","Audio","Other"].map(t => (
                  <button key={t} onClick={() => setFileType(t)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all"
                    style={{
                      background: fileType === t ? "rgba(99,102,241,0.20)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${fileType === t ? "rgba(99,102,241,0.45)" : "transparent"}`,
                      color: fileType === t ? "#a5b4fc" : "#64748b",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!selected || !fileName.trim() || saving || saved}
              className="w-full py-3 rounded-xl text-[13px] font-bold transition-all"
              style={{
                background: saved ? "rgba(34,197,94,0.20)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: saved ? "#4ade80" : "white",
                opacity: (!selected || !fileName.trim() || saving) && !saved ? 0.5 : 1,
              }}>
              {saved ? "✓ Saved to Project!" : saving ? "Saving…" : "Save to Project"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
