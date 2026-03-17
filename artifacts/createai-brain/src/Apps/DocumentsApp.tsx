import React, { useState, useEffect, useCallback } from "react";
import { OutputFormatter } from "@/components/OutputFormatter";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";

interface DbFile {
  id: string;
  name: string;
  fileType: string;
  size: string;
  content: string;
  created: string;
  projectId: number;
  projectName: string | null;
  projectIcon: string | null;
}

function fileTypeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("video"))                    return "🎬";
  if (t.includes("audio") || t.includes("music")) return "🎵";
  if (t.includes("image") || t.includes("photo")) return "🖼️";
  if (t.includes("sheet") || t.includes("spread")) return "📊";
  if (t.includes("present") || t.includes("slide")) return "🎯";
  if (t.includes("report"))                   return "📋";
  if (t.includes("brand") || t.includes("kit")) return "🎨";
  if (t.includes("check") || t.includes("form")) return "✅";
  if (t.includes("template"))                 return "📐";
  if (t.includes("guide"))                    return "📖";
  return "📄";
}

export function DocumentsApp() {
  const [selectedFile, setSelectedFile] = useState<DbFile | null>(null);
  const [files, setFiles] = useState<DbFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [showSaveModal, setShowSaveModal] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/projects/all-files", { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setFiles(d.files ?? []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFiles(); }, []);

  const saveFileContent = async (content: string) => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${selectedFile.projectId}/files/${selectedFile.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, content } : f));
      setSelectedFile(prev => prev ? { ...prev, content } : null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  };

  const deleteFile = async (file: DbFile) => {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/projects/${file.projectId}/files/${file.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setFiles(prev => prev.filter(f => f.id !== file.id));
      setSelectedFile(null);
    } catch {}
  };

  const fileTypes = ["All", ...Array.from(new Set(files.map(f => f.fileType))).sort()];

  const filtered = files.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.projectName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || f.fileType === filterType;
    return matchSearch && matchType;
  });

  if (selectedFile) {
    const content = editMode ? editedContent : (selectedFile.content || "");
    return (
      <div className="p-5 space-y-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedFile(null); setEditMode(false); setEditedContent(""); }}
            className="flex items-center gap-1 text-[13px] font-medium hover:opacity-70 transition-opacity"
            style={{ color: "#818cf8" }}>
            <span className="text-[18px] font-light">‹</span> Documents
          </button>
          <div className="flex-1" />
          {saved && <span className="text-[11px] font-medium text-green-400 animate-fade-up">✓ Saved</span>}
          {editMode ? (
            <button onClick={() => { saveFileContent(editedContent); setEditMode(false); }} disabled={saving}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white flex items-center gap-1"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              {saving ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving</span></> : "Save"}
            </button>
          ) : (
            <button onClick={() => { setEditedContent(content); setEditMode(true); }}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.22)" }}>
              Edit
            </button>
          )}
        </div>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.20)" }}>
            {fileTypeIcon(selectedFile.fileType)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>{selectedFile.name}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {selectedFile.fileType} · {selectedFile.projectIcon ?? ""} {selectedFile.projectName ?? "Unknown Project"} · {selectedFile.size}
            </p>
          </div>
        </div>

        {editMode ? (
          <textarea value={editedContent} onChange={e => setEditedContent(e.target.value)}
            className="w-full rounded-xl p-4 text-[13px] text-foreground font-mono resize-none outline-none leading-relaxed"
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
            rows={16} autoFocus />
        ) : (
          <div className="rounded-2xl p-5 max-h-[52vh] overflow-y-auto"
            style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {content
              ? <OutputFormatter content={content} />
              : <p className="text-[13px] text-muted-foreground/60 text-center py-8">No content yet — click Edit to add content.</p>
            }
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setShowSaveModal(true)}
            className="flex-1 text-[12px] font-semibold py-2.5 rounded-xl transition-all text-white"
            style={{ background: "rgba(99,102,241,0.70)" }}>
            💾 Save to Another Project
          </button>
          <button onClick={() => {
              const blob = new Blob([content], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url;
              a.download = `${selectedFile.name.replace(/\s+/g, "_")}.txt`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 text-[12px] font-semibold py-2.5 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}>
            ↓ Export .txt
          </button>
          <button onClick={() => deleteFile(selectedFile)}
            className="px-4 py-2.5 rounded-xl transition-all text-[12px] font-semibold"
            style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" }}>
            ✕
          </button>
        </div>

        {showSaveModal && (
          <SaveToProjectModal
            content={content}
            label={selectedFile.name}
            defaultFileType={selectedFile.fileType}
            onClose={() => setShowSaveModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 pb-3 border-b flex-shrink-0 space-y-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <h2 className="text-[20px] font-bold text-foreground" style={{ letterSpacing: "-0.03em" }}>Documents</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">{files.length} file{files.length !== 1 ? "s" : ""} across all projects</p>
          </div>
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or project…"
          className="w-full rounded-xl px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
          style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }} />

        {fileTypes.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {fileTypes.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                style={filterType === t
                  ? { background: "rgba(99,102,241,0.20)", borderColor: "rgba(99,102,241,0.45)", color: "#818cf8" }
                  : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 py-12 justify-center text-[13px] text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading documents…
          </div>
        ) : filtered.length === 0 && files.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-5xl">📄</p>
            <p className="text-[16px] font-bold text-foreground">No documents yet</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Create files in any project using ProjectOS, or generate content in any app and save it with the "💾 Save to Project" button.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">No documents match your search.</div>
        ) : (
          filtered.map(file => (
            <button key={file.id}
              onClick={() => { setSelectedFile(file); setEditMode(false); setEditedContent(""); }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
              style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.30)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.15)" }}>
                {fileTypeIcon(file.fileType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-foreground truncate">{file.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {file.fileType} · {file.projectIcon ?? ""} {file.projectName ?? "Unknown"}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] text-muted-foreground/50">{file.size}</p>
                <p className="text-[10px] text-muted-foreground/40">{file.created}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
