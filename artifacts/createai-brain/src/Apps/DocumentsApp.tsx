import React, { useState, useEffect, useCallback, useRef } from "react";
import { OutputFormatter } from "@/components/OutputFormatter";
import { SaveToProjectModal } from "@/components/SaveToProjectModal";
import { relativeTime } from "@/ael/time";

// ─── Types ─────────────────────────────────────────────────────────────────

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

interface Doc {
  id: string;
  title: string;
  body: string;
  docType: string;
  tags: string;
  projectId: string | null;
  isPinned: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

type Tab = "files" | "docs";

const DOC_TYPES = ["Note", "Report", "Proposal", "Contract", "SOP", "Meeting Notes", "Template", "Research", "Plan", "Other"];

function fileTypeIcon(type: string) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("video"))                        return "🎬";
  if (t.includes("audio") || t.includes("music")) return "🎵";
  if (t.includes("image") || t.includes("photo")) return "🖼️";
  if (t.includes("sheet") || t.includes("spread")) return "📊";
  if (t.includes("present") || t.includes("slide")) return "🎯";
  if (t.includes("report"))                       return "📋";
  if (t.includes("brand") || t.includes("kit"))   return "🎨";
  if (t.includes("template"))                     return "📐";
  if (t.includes("guide"))                        return "📖";
  if (t.includes("note"))                         return "📝";
  if (t.includes("contract") || t.includes("sop")) return "📜";
  return "📄";
}

// ─── API helpers ────────────────────────────────────────────────────────────

async function apiFetchDocs(): Promise<Doc[]> {
  try {
    const r = await fetch("/api/documents", { credentials: "include" });
    if (!r.ok) return [];
    const d = await r.json() as { documents: Doc[] };
    return d.documents ?? [];
  } catch { return []; }
}

async function apiCreateDoc(title: string, body: string, docType: string, tags: string): Promise<Doc | null> {
  try {
    const r = await fetch("/api/documents", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, docType, tags }),
    });
    if (!r.ok) return null;
    const d = await r.json() as { document: Doc };
    return d.document;
  } catch { return null; }
}

async function apiUpdateDoc(id: string, updates: Partial<Pick<Doc, "title" | "body" | "docType" | "tags" | "isPinned">>): Promise<Doc | null> {
  try {
    const r = await fetch(`/api/documents/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!r.ok) return null;
    const d = await r.json() as { document: Doc };
    return d.document;
  } catch { return null; }
}

async function apiDeleteDoc(id: string): Promise<boolean> {
  try {
    const r = await fetch(`/api/documents/${id}`, { method: "DELETE", credentials: "include" });
    return r.ok;
  } catch { return false; }
}

async function apiFetchProjectFiles(): Promise<DbFile[]> {
  try {
    const r = await fetch("/api/projects/all-files", { credentials: "include" });
    if (!r.ok) return [];
    const d = await r.json() as { files: DbFile[] };
    return d.files ?? [];
  } catch { return []; }
}

// ─── New Document Modal ─────────────────────────────────────────────────────

function NewDocModal({ onClose, onCreate }: { onClose: () => void; onCreate: (doc: Doc) => void }) {
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("Note");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const doc = await apiCreateDoc(title.trim(), body, docType, tags);
    setSaving(false);
    if (doc) { onCreate(doc); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-3xl flex flex-col overflow-hidden"
        style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.10)", maxHeight: "90vh" }}>
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-xl">📄</span>
          <h3 className="text-[16px] font-bold text-white flex-1">New Document</h3>
          <button onClick={onClose} className="text-[20px] text-gray-500 hover:text-white transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">Title *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Document title…"
              className="w-full rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">Type</label>
              <select value={docType} onChange={e => setDocType(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-[13px] text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">Tags</label>
              <input value={tags} onChange={e => setTags(e.target.value)}
                placeholder="e.g. legal, q1, internal"
                className="w-full rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">Content (optional)</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Start writing or leave blank to fill in later…"
              rows={5}
              className="w-full rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 font-mono resize-none outline-none leading-relaxed"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }} />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!title.trim() || saving}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            {saving ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating…</> : "Create Document"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Doc Detail View ────────────────────────────────────────────────────────

function DocDetail({ doc, onBack, onUpdate, onDelete }: {
  doc: Doc;
  onBack: () => void;
  onUpdate: (d: Doc) => void;
  onDelete: (id: string) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [body, setBody] = useState(doc.body);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updated = await apiUpdateDoc(doc.id, { title: title.trim(), body });
    setSaving(false);
    if (updated) { onUpdate(updated); setSaved(true); setEditMode(false); setTimeout(() => setSaved(false), 2000); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    const ok = await apiDeleteDoc(doc.id);
    if (ok) { onDelete(doc.id); onBack(); }
  };

  const handlePin = async () => {
    const updated = await apiUpdateDoc(doc.id, { isPinned: !doc.isPinned });
    if (updated) onUpdate(updated);
  };

  return (
    <div className="p-5 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={() => { setEditMode(false); onBack(); }}
          className="flex items-center gap-1 text-[13px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: "#818cf8" }}>
          <span className="text-[18px] font-light">‹</span> Documents
        </button>
        <div className="flex-1" />
        {saved && <span className="text-[11px] font-medium text-green-400 animate-fade-up">✓ Saved</span>}
        <button onClick={handlePin} title={doc.isPinned ? "Unpin" : "Pin"}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] transition-all"
          style={{ background: doc.isPinned ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.06)", color: doc.isPinned ? "#fbbf24" : "#6b7280" }}>
          📌
        </button>
        {editMode ? (
          <button onClick={handleSave} disabled={saving}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            {saving ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving</span></> : "Save"}
          </button>
        ) : (
          <button onClick={() => setEditMode(true)}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.22)" }}>
            Edit
          </button>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.20)" }}>
          {fileTypeIcon(doc.docType)}
        </div>
        <div className="flex-1 min-w-0">
          {editMode ? (
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              className="w-full bg-transparent text-[18px] font-bold text-white outline-none border-b pb-1"
              style={{ borderColor: "rgba(99,102,241,0.40)" }} />
          ) : (
            <h2 className="text-[17px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>{doc.title}</h2>
          )}
          <p className="text-[11px] text-gray-500 mt-1">
            {doc.docType}
            {doc.tags && ` · ${doc.tags}`}
            {` · Updated ${relativeTime(doc.updatedAt)}`}
          </p>
        </div>
      </div>

      {editMode ? (
        <textarea value={body} onChange={e => setBody(e.target.value)}
          className="w-full rounded-xl p-4 text-[13px] text-white font-mono resize-none outline-none leading-relaxed"
          style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
          rows={18} />
      ) : (
        <div className="rounded-2xl p-5 max-h-[52vh] overflow-y-auto"
          style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {doc.body
            ? <OutputFormatter content={doc.body} />
            : <p className="text-[13px] text-gray-600 text-center py-8">No content yet — click Edit to add content.</p>
          }
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setShowSaveModal(true)}
          className="flex-1 text-[12px] font-semibold py-2.5 rounded-xl text-white transition-all"
          style={{ background: "rgba(99,102,241,0.70)" }}>
          💾 Save to Project
        </button>
        <button onClick={() => {
            const blob = new Blob([doc.body], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url;
            a.download = `${doc.title.replace(/\s+/g, "_")}.txt`; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex-1 text-[12px] font-semibold py-2.5 rounded-xl transition-all"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}>
          ↓ Export
        </button>
        <button onClick={handleDelete}
          className="px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
          style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" }}>
          ✕
        </button>
      </div>

      {showSaveModal && (
        <SaveToProjectModal
          content={doc.body}
          label={doc.title}
          defaultFileType={doc.docType}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

// ─── File Detail View ───────────────────────────────────────────────────────

function FileDetail({ file, onBack, onChange }: {
  file: DbFile;
  onBack: () => void;
  onChange: (f: DbFile) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(file.content || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${file.projectId}/files/${file.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      });
      onChange({ ...file, content: editedContent });
      setSaved(true); setEditMode(false); setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  };

  const content = editMode ? editedContent : (file.content || "");

  return (
    <div className="p-5 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1 text-[13px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: "#818cf8" }}>
          <span className="text-[18px] font-light">‹</span> Documents
        </button>
        <div className="flex-1" />
        {saved && <span className="text-[11px] font-medium text-green-400">✓ Saved</span>}
        {editMode ? (
          <button onClick={handleSave} disabled={saving}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-xl text-white flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            {saving ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving</span></> : "Save"}
          </button>
        ) : (
          <button onClick={() => { setEditedContent(file.content || ""); setEditMode(true); }}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.22)" }}>
            Edit
          </button>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.20)" }}>
          {fileTypeIcon(file.fileType)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[17px] font-bold text-white">{file.name}</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {file.fileType} · {file.projectIcon ?? ""} {file.projectName ?? "Unknown Project"} · {file.size}
          </p>
        </div>
      </div>

      {editMode ? (
        <textarea value={editedContent} onChange={e => setEditedContent(e.target.value)} autoFocus
          className="w-full rounded-xl p-4 text-[13px] text-white font-mono resize-none outline-none leading-relaxed"
          style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}
          rows={16} />
      ) : (
        <div className="rounded-2xl p-5 max-h-[52vh] overflow-y-auto"
          style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {content
            ? <OutputFormatter content={content} />
            : <p className="text-[13px] text-gray-600 text-center py-8">No content yet — click Edit to add content.</p>
          }
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setShowSaveModal(true)}
          className="flex-1 text-[12px] font-semibold py-2.5 rounded-xl text-white"
          style={{ background: "rgba(99,102,241,0.70)" }}>
          💾 Copy to Project
        </button>
        <button onClick={() => {
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url;
            a.download = `${file.name.replace(/\s+/g, "_")}.txt`; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex-1 text-[12px] font-semibold py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.10)" }}>
          ↓ Export
        </button>
      </div>

      {showSaveModal && (
        <SaveToProjectModal
          content={content}
          label={file.name}
          defaultFileType={file.fileType}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────

export function DocumentsApp() {
  const [tab, setTab] = useState<Tab>("docs");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [files, setFiles] = useState<DbFile[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [selectedFile, setSelectedFile] = useState<DbFile | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [showNewDoc, setShowNewDoc] = useState(false);

  useEffect(() => {
    apiFetchDocs().then(d => { setDocs(d); setLoadingDocs(false); });
    apiFetchProjectFiles().then(f => { setFiles(f); setLoadingFiles(false); });
  }, []);

  const handleDocCreate = (doc: Doc) => setDocs(prev => [doc, ...prev]);
  const handleDocUpdate = (doc: Doc) => setDocs(prev => prev.map(d => d.id === doc.id ? doc : d));
  const handleDocDelete = (id: string) => { setDocs(prev => prev.filter(d => d.id !== id)); setSelectedDoc(null); };
  const handleFileChange = (f: DbFile) => { setFiles(prev => prev.map(x => x.id === f.id ? f : x)); setSelectedFile(f); };

  if (selectedDoc) {
    return <DocDetail doc={selectedDoc} onBack={() => setSelectedDoc(null)} onUpdate={d => { handleDocUpdate(d); setSelectedDoc(d); }} onDelete={handleDocDelete} />;
  }
  if (selectedFile) {
    return <FileDetail file={selectedFile} onBack={() => setSelectedFile(null)} onChange={handleFileChange} />;
  }

  const docTypes = ["All", ...Array.from(new Set(docs.map(d => d.docType))).sort()];
  const fileTypes = ["All", ...Array.from(new Set(files.map(f => f.fileType))).sort()];
  const currentTypes = tab === "docs" ? docTypes : fileTypes;

  const filteredDocs = docs.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.tags.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || d.docType === filterType;
    return matchSearch && matchType;
  });

  const filteredFiles = files.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || (f.projectName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || f.fileType === filterType;
    return matchSearch && matchType;
  });

  const pinnedDocs = filteredDocs.filter(d => d.isPinned);
  const unpinnedDocs = filteredDocs.filter(d => !d.isPinned);
  const isLoading = tab === "docs" ? loadingDocs : loadingFiles;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 pb-3 flex-shrink-0 space-y-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <h2 className="text-[20px] font-bold text-white" style={{ letterSpacing: "-0.03em" }}>Documents</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {tab === "docs" ? `${docs.length} standalone doc${docs.length !== 1 ? "s" : ""}` : `${files.length} project file${files.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {tab === "docs" && (
            <button onClick={() => setShowNewDoc(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              + New Doc
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {([["docs","📄 My Documents"], ["files","📁 Project Files"]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); setFilterType("All"); }}
              className="flex-1 py-2 text-[12px] font-semibold transition-all"
              style={tab === t
                ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }
                : { background: "transparent", color: "#475569" }}>
              {label}
            </button>
          ))}
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={tab === "docs" ? "Search documents or tags…" : "Search by name or project…"}
          className="w-full rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-gray-600 outline-none"
          style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.10)" }} />

        {currentTypes.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {currentTypes.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                style={filterType === t
                  ? { background: "rgba(99,102,241,0.20)", borderColor: "rgba(99,102,241,0.45)", color: "#818cf8" }
                  : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.45)" }}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2 py-12 justify-center text-[13px] text-gray-500">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : tab === "docs" ? (
          filteredDocs.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-5xl">📝</p>
              <p className="text-[16px] font-bold text-white">
                {search || filterType !== "All" ? "No matching documents" : "No documents yet"}
              </p>
              {!search && filterType === "All" && (
                <p className="text-[13px] text-gray-500 max-w-xs mx-auto">
                  Click "New Doc" to create your first standalone document — notes, proposals, contracts, SOPs and more.
                </p>
              )}
            </div>
          ) : (
            <>
              {pinnedDocs.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 mb-2 px-1">📌 Pinned</p>
                  {pinnedDocs.map(doc => (
                    <DocCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} />
                  ))}
                </div>
              )}
              {unpinnedDocs.map(doc => (
                <DocCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} />
              ))}
            </>
          )
        ) : (
          filteredFiles.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-5xl">📁</p>
              <p className="text-[16px] font-bold text-white">
                {search || filterType !== "All" ? "No matching files" : "No project files yet"}
              </p>
              {!search && filterType === "All" && (
                <p className="text-[13px] text-gray-500 max-w-xs mx-auto">
                  Create files in any project using ProjectOS, or save content from any generator app.
                </p>
              )}
            </div>
          ) : (
            filteredFiles.map(file => (
              <button key={file.id}
                onClick={() => setSelectedFile(file)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.30)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  {fileTypeIcon(file.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px] text-white truncate">{file.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {file.fileType} · {file.projectIcon ?? ""} {file.projectName ?? "Unknown"}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] text-gray-600">{file.size}</p>
                  <p className="text-[10px] text-gray-700">{file.created}</p>
                </div>
              </button>
            ))
          )
        )}
      </div>

      {showNewDoc && <NewDocModal onClose={() => setShowNewDoc(false)} onCreate={handleDocCreate} />}
    </div>
  );
}

function DocCard({ doc, onClick }: { doc: Doc; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all mb-1.5"
      style={{ background: "rgba(14,18,42,0.70)", border: "1px solid rgba(255,255,255,0.07)" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.30)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.15)" }}>
        {fileTypeIcon(doc.docType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-[13px] text-white truncate">{doc.title}</p>
          {doc.isPinned && <span className="text-[10px]">📌</span>}
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
          {doc.docType}
          {doc.tags && ` · ${doc.tags}`}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-[10px] text-gray-600">{relativeTime(doc.updatedAt)}</p>
        {doc.body && <p className="text-[10px] text-gray-700 mt-0.5">{doc.body.length} chars</p>}
      </div>
    </button>
  );
}
