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

// ─── PROJECT-FIRST CREATION RULE ─────────────────────────────────────────────
// When the user is inside a project context (activeProjectId in localStorage),
// this modal auto-selects that project so every created item lands in the
// correct project folder without any extra clicks.
function readActiveProjectId(): string | null {
  try {
    const raw = localStorage.getItem("cai_resume_projos");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { activeEntityId?: string };
    return parsed.activeEntityId ?? null;
  } catch {
    return null;
  }
}

// Map file type → folder id in the project
const FILE_TYPE_TO_FOLDER: Record<string, string> = {
  Document:     "files",
  Script:       "files",
  Spreadsheet:  "files",
  Presentation: "marketing",
  Video:        "marketing",
  Audio:        "marketing",
  "Ad Copy":    "marketing",
  "Blog Post":  "marketing",
  "Social Post":"marketing",
  Email:        "marketing",
};

export function SaveToProjectModal({ content, label, defaultFileType = "Document", onClose }: Props) {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<string>("");
  const [fileName, setFileName]   = useState(label.slice(0, 60));
  const [fileType, setFileType]   = useState(defaultFileType);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [savedProjectName, setSavedProjectName] = useState("");

  useEffect(() => {
    const activeId = readActiveProjectId();
    fetch("/api/projects", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        const list: Project[] = d.projects ?? [];
        setProjects(list);
        // PROJECT-FIRST: pre-select active project, then fallback to first
        if (activeId && list.some(p => p.id === activeId)) {
          setSelected(activeId);
        } else if (list.length) {
          setSelected(list[0].id);
        }
      })
      .catch(() => setError("Could not load projects"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!selected || !fileName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const folderId = FILE_TYPE_TO_FOLDER[fileType] ?? "files";
      const res = await fetch(`/api/projects/${selected}/files`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fileName.trim(),
          fileType,
          folderId,
          content,
          size: `${Math.round(content.length / 1024 * 10) / 10} KB`,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const selectedProject = projects.find(p => p.id === selected);
      setSavedProjectName(selectedProject?.name ?? "project");
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
      setTimeout(onClose, 1400);
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl"
        style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Save to Project</h3>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>Choose a project and name this file</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(0,0,0,0.04)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#9ca3af",
            }}
          >✕</button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 12px", borderRadius: 10, fontSize: 12, color: "#dc2626",
            background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.18)",
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "#9ca3af" }}>
            Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>No projects yet.</p>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>Create a project in ProjectOS first.</p>
          </div>
        ) : (
          <>
            {/* Project selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Project {readActiveProjectId() && projects.some(p => p.id === readActiveProjectId()) && (
                  <span style={{ color: "#4f46e5", textTransform: "none", fontWeight: 500, letterSpacing: 0 }}>
                    · auto-selected from context
                  </span>
                )}
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10, textAlign: "left",
                      background: selected === p.id ? "#eef2ff" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${selected === p.id ? "#c7d2fe" : "rgba(0,0,0,0.07)"}`,
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{p.icon || "📁"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </p>
                      <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{p.industry}</p>
                    </div>
                    {selected === p.id && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* File name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>File Name</label>
              <input
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder="Name this file…"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 13,
                  color: "#0f172a", background: "#f9fafb", border: "1px solid rgba(0,0,0,0.10)",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>

            {/* File type */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Type</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Document", "Script", "Spreadsheet", "Presentation", "Video", "Audio", "Other"].map(t => (
                  <button
                    key={t}
                    onClick={() => setFileType(t)}
                    style={{
                      fontSize: 10, fontWeight: 500, padding: "5px 10px", borderRadius: 8,
                      background: fileType === t ? "#eef2ff" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${fileType === t ? "#c7d2fe" : "rgba(0,0,0,0.08)"}`,
                      color: fileType === t ? "#4f46e5" : "#6b7280",
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Folder hint */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9ca3af",
              background: "rgba(79,70,229,0.04)", borderRadius: 8, padding: "7px 10px",
              border: "1px solid rgba(79,70,229,0.10)",
            }}>
              <span>📂</span>
              <span>
                Will be saved to the{" "}
                <strong style={{ color: "#4f46e5" }}>
                  {FILE_TYPE_TO_FOLDER[fileType] === "marketing" ? "Marketing Packet" : "Files"}
                </strong>{" "}
                folder of the selected project
              </span>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!selected || !fileName.trim() || saving || saved}
              style={{
                width: "100%", padding: "13px", borderRadius: 12, fontSize: 13,
                fontWeight: 700, border: "none", cursor: (!selected || !fileName.trim() || saving) && !saved ? "not-allowed" : "pointer",
                background: saved
                  ? "rgba(22,163,74,0.12)"
                  : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                color: saved ? "#16a34a" : "#fff",
                opacity: (!selected || !fileName.trim() || saving) && !saved ? 0.5 : 1,
                transition: "all 0.15s",
              }}
            >
              {saved
                ? `✓ Saved to ${savedProjectName}!`
                : saving ? "Saving…" : "Save to Project"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
