import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "dashboard+folders" | "dashboard" | "folders" | "simple" | "advanced";

interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: string;
  created: string;
  folderId: string;
  content?: string;
}

interface ProjectFolder {
  id: string;
  name: string;
  icon: string;
  universal: boolean;
  count: number;
}

interface SubApp {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  industry: string;
  icon: string;
  color: string;
  created: string;
  folders: ProjectFolder[];
  files: ProjectFile[];
  subApps: SubApp[];
}

// ─── Universal Folders ────────────────────────────────────────────────────────

const UNIVERSAL_FOLDERS: Omit<ProjectFolder, "count">[] = [
  { id: "apps",       name: "Apps",              icon: "🧩", universal: true },
  { id: "demo",       name: "Demo Mode",         icon: "🎭", universal: true },
  { id: "test",       name: "Test Mode",         icon: "🧪", universal: true },
  { id: "live",       name: "Live Mode",         icon: "🟢", universal: true },
  { id: "marketing",  name: "Marketing Packet",  icon: "📣", universal: true },
  { id: "company",    name: "Company Materials", icon: "🏢", universal: true },
  { id: "screens",    name: "Screens",           icon: "🖥️", universal: true },
  { id: "files",      name: "Files",             icon: "📁", universal: true },
  { id: "data",       name: "Data",              icon: "🗄️", universal: true },
];

const INDUSTRY_SPECIFIC: Record<string, { name: string; icon: string }[]> = {
  Healthcare:    [{ name: "Regulations", icon: "⚖️" }, { name: "Patient Records", icon: "🏥" }, { name: "Compliance", icon: "✅" }],
  Construction:  [{ name: "Plans & Blueprints", icon: "📐" }, { name: "Safety", icon: "🦺" }, { name: "Permits", icon: "📋" }, { name: "Equipment", icon: "🚧" }],
  Hunting:       [{ name: "Maps", icon: "🗺️" }, { name: "Gear Lists", icon: "🎒" }, { name: "Safety", icon: "🦺" }, { name: "Seasons & Regulations", icon: "📅" }],
  Farming:       [{ name: "Crop Plans", icon: "🌱" }, { name: "Equipment", icon: "🚜" }, { name: "Soil Data", icon: "🌍" }, { name: "Harvest Logs", icon: "📊" }],
  Education:     [{ name: "Curriculum", icon: "📚" }, { name: "Student Records", icon: "👤" }, { name: "Assessments", icon: "📝" }],
  Logistics:     [{ name: "Routes", icon: "🗺️" }, { name: "Fleet", icon: "🚛" }, { name: "Schedules", icon: "📅" }, { name: "Manifests", icon: "📋" }],
  Legal:         [{ name: "Cases", icon: "⚖️" }, { name: "Contracts", icon: "📄" }, { name: "Evidence", icon: "🔍" }],
  Technology:    [{ name: "Source Code", icon: "💻" }, { name: "APIs", icon: "🔌" }, { name: "Deployments", icon: "🚀" }],
  Nonprofit:     [{ name: "Donors", icon: "❤️" }, { name: "Grants", icon: "💰" }, { name: "Impact Reports", icon: "📊" }],
  Retail:        [{ name: "Inventory", icon: "📦" }, { name: "Suppliers", icon: "🤝" }, { name: "POS Data", icon: "🛒" }],
  General:       [{ name: "Notes", icon: "📝" }, { name: "Research", icon: "🔍" }],
};

const INDUSTRIES = Object.keys(INDUSTRY_SPECIFIC);

const INDUSTRY_ICONS: Record<string, string> = {
  Healthcare: "🏥", Construction: "🏗️", Hunting: "🦌", Farming: "🌾",
  Education: "📚", Logistics: "🚛", Legal: "⚖️", Technology: "💻",
  Nonprofit: "❤️", Retail: "🛒", General: "📁",
};

const INDUSTRY_COLORS: Record<string, string> = {
  Healthcare: "#10b981", Construction: "#f97316", Hunting: "#78716c",
  Farming: "#84cc16", Education: "#6366f1", Logistics: "#0ea5e9",
  Legal: "#8b5cf6", Technology: "#06b6d4", Nonprofit: "#ec4899",
  Retail: "#f59e0b", General: "#94a3b8",
};

// ─── Dashboard Actions ────────────────────────────────────────────────────────

const DASHBOARD_ACTIONS = [
  { id: "apps",      icon: "🧩", label: "Apps",              color: "#6366f1" },
  { id: "modes",     icon: "🎛️", label: "Modes",             color: "#8b5cf6" },
  { id: "marketing", icon: "📣", label: "Marketing Packet",  color: "#f59e0b" },
  { id: "company",   icon: "🏢", label: "Company Packet",    color: "#10b981" },
  { id: "ai",        icon: "🤖", label: "AI Helper",         color: "#06b6d4" },
  { id: "addfile",   icon: "➕", label: "Add New File",      color: "#0ea5e9" },
  { id: "addsubapp", icon: "📱", label: "Add New Sub‑App",   color: "#ec4899" },
  { id: "search",    icon: "🔍", label: "Search Project",    color: "#f97316" },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiListProjects(): Promise<Project[]> {
  try {
    const res = await fetch("/api/projects");
    if (!res.ok) return [];
    const data = await res.json() as { projects: Project[] };
    return data.projects ?? [];
  } catch { return []; }
}

async function apiCreateProject(name: string, industry: string): Promise<Project | null> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { project: Project };
    return data.project;
  } catch { return null; }
}

async function apiDeleteProject(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    return res.ok;
  } catch { return false; }
}

async function apiAddFile(projectId: string, name: string, fileType: string, folderId: string): Promise<ProjectFile | null> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, fileType, folderId: folderId || undefined }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { file: ProjectFile };
    return data.file;
  } catch { return null; }
}

async function apiDeleteFile(projectId: string, fileId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, { method: "DELETE" });
    return res.ok;
  } catch { return false; }
}

async function apiLoadFileContent(fileId: string): Promise<string> {
  try {
    const res = await fetch(`/api/projects/files/${fileId}`);
    if (!res.ok) return "";
    const data = await res.json() as { file: ProjectFile };
    return data.file.content ?? "";
  } catch { return ""; }
}

async function apiSaveFileContent(projectId: string, fileId: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch { return false; }
}

async function apiUpdateProject(id: string, updates: { name?: string; description?: string }): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch { return false; }
}

async function apiLoadChatHistory(projectId: string): Promise<{ role: "user" | "ai"; text: string }[]> {
  try {
    const res = await fetch(`/api/project-chat/${projectId}/history`);
    if (!res.ok) return [];
    const data = await res.json() as { messages: { role: "user" | "ai"; text: string }[] };
    return data.messages ?? [];
  } catch { return []; }
}

// ─── SSE Project Chat ─────────────────────────────────────────────────────────

async function streamProjectChat(
  history: { role: "user" | "ai"; text: string }[],
  projectId: string,
  lastMessage: string,
  onChunk: (t: string) => void,
  signal: AbortSignal,
) {
  const historyForApi = history.slice(0, -1).map(m => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.text,
  }));
  const res = await fetch(`/api/project-chat/${projectId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: lastMessage, history: historyForApi }),
    signal,
  });
  if (!res.ok || !res.body) return;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += dec.decode(value, { stream: true });
    const parts = acc.split("\n\n");
    acc = parts.pop() ?? "";
    for (const part of parts) {
      if (!part.startsWith("data: ")) continue;
      const raw = part.slice(6).trim();
      if (raw === "[DONE]") return;
      try {
        const p = JSON.parse(raw) as { content?: string };
        if (p.content) onChunk(p.content);
      } catch {}
    }
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeleteConfirm({
  label, onConfirm, onCancel,
}: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }}
    >
      <div
        className="rounded-2xl p-6 w-80 shadow-2xl"
        style={{ background: "rgba(15,20,30,0.97)", border: "1px solid rgba(239,68,68,0.35)" }}
      >
        <div className="text-[15px] font-bold text-white mb-2">Delete "{label}"?</div>
        <div className="text-[12px] mb-5" style={{ color: "#94a3b8" }}>
          This action cannot be undone. Nothing else will break.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-[13px] font-medium"
            style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-[13px] font-medium"
            style={{ background: "rgba(239,68,68,0.18)", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchModal({
  projects, onClose,
}: { projects: Project[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const results: { type: string; label: string; project: string; icon: string }[] = [];
  if (q.trim()) {
    const lq = q.toLowerCase();
    for (const p of projects) {
      if (p.name.toLowerCase().includes(lq)) results.push({ type: "Project", label: p.name, project: p.name, icon: p.icon });
      for (const f of p.files) {
        if (f.name.toLowerCase().includes(lq)) results.push({ type: "File", label: f.name, project: p.name, icon: "📄" });
      }
      for (const folder of p.folders) {
        if (folder.name.toLowerCase().includes(lq)) results.push({ type: "Folder", label: folder.name, project: p.name, icon: folder.icon });
      }
      for (const sa of p.subApps) {
        if (sa.name.toLowerCase().includes(lq)) results.push({ type: "Sub-App", label: sa.name, project: p.name, icon: sa.icon });
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="w-[520px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "rgba(12,16,24,0.98)", border: "1px solid rgba(99,102,241,0.35)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-lg">🔍</span>
          <input
            ref={ref}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search all projects, files, folders, sub-apps…"
            className="flex-1 bg-transparent text-white text-[14px] outline-none"
            style={{ color: "#e2e8f0" }}
          />
          <button onClick={onClose} className="text-[11px]" style={{ color: "#475569" }}>ESC</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!q.trim() && (
            <div className="p-6 text-center text-[12px]" style={{ color: "#475569" }}>
              Start typing to search across all projects, files, folders, sub-apps, screens, and packets
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <div className="p-6 text-center text-[12px]" style={{ color: "#475569" }}>No results for "{q}"</div>
          )}
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span className="text-base">{r.icon}</span>
              <div className="flex-1">
                <div className="text-[13px] text-white">{r.label}</div>
                <div className="text-[10px]" style={{ color: "#475569" }}>{r.type} · {r.project}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export function ProjectOSApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard+folders");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjIndustry, setNewProjIndustry] = useState("General");
  const [showAI, setShowAI] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; label: string; projectId?: string } | null>(null);
  const [showAddFile, setShowAddFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("Document");
  const [showAddSubApp, setShowAddSubApp] = useState(false);
  const [newSubAppName, setNewSubAppName] = useState("");
  const [newSubAppIcon, setNewSubAppIcon] = useState("📱");
  const [showModes, setShowModes] = useState(false);
  const [activeMode, setActiveMode] = useState<"Demo" | "Test" | "Live">("Live");
  const [viewingFile, setViewingFile] = useState<ProjectFile | null>(null);
  const [fileContentText, setFileContentText] = useState("");
  const [fileContentEditing, setFileContentEditing] = useState(false);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileContentSaving, setFileContentSaving] = useState(false);
  const [fileContentSaved, setFileContentSaved] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [editProjectNameVal, setEditProjectNameVal] = useState("");
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;

  // Load projects from API on mount
  useEffect(() => {
    apiListProjects().then(list => {
      setProjects(list);
      setLoadingProjects(false);
    });
  }, []);

  // Auto-scroll AI
  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages]);

  const createProject = useCallback(async () => {
    if (!newProjName.trim()) return;
    const proj = await apiCreateProject(newProjName.trim(), newProjIndustry);
    if (proj) {
      setProjects(prev => [...prev, proj]);
      setActiveProjectId(proj.id);
      setActiveFolderId(null);
    }
    setShowNewProject(false);
    setNewProjName("");
    setNewProjIndustry("General");
  }, [newProjName, newProjIndustry]);

  const deleteProject = useCallback(async (id: string) => {
    await apiDeleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  }, [activeProjectId]);

  const addFile = useCallback(async () => {
    if (!activeProject || !newFileName.trim()) return;
    const file = await apiAddFile(activeProject.id, newFileName.trim(), newFileType, activeFolderId ?? "");
    if (file) {
      setProjects(prev => prev.map(p =>
        p.id === activeProject.id ? { ...p, files: [...p.files, file] } : p
      ));
    }
    setShowAddFile(false);
    setNewFileName("");
    setNewFileType("Document");
  }, [activeProject, newFileName, newFileType, activeFolderId]);

  const deleteFile = useCallback(async (fileId: string) => {
    if (!activeProject) return;
    await apiDeleteFile(activeProject.id, fileId);
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id ? { ...p, files: p.files.filter(f => f.id !== fileId) } : p
    ));
  }, [activeProject]);

  const openFileViewer = useCallback(async (file: ProjectFile) => {
    setViewingFile(file);
    setFileContentEditing(false);
    setFileContentSaved(false);
    if (file.content) {
      setFileContentText(file.content);
    } else {
      setFileContentLoading(true);
      const content = await apiLoadFileContent(file.id);
      setFileContentText(content);
      setFileContentLoading(false);
    }
  }, []);

  const saveFileContent = useCallback(async () => {
    if (!activeProject || !viewingFile) return;
    setFileContentSaving(true);
    const ok = await apiSaveFileContent(activeProject.id, viewingFile.id, fileContentText);
    setFileContentSaving(false);
    if (ok) {
      setFileContentSaved(true);
      setFileContentEditing(false);
      setProjects(prev => prev.map(p =>
        p.id === activeProject.id
          ? { ...p, files: p.files.map(f => f.id === viewingFile.id ? { ...f, content: fileContentText } : f) }
          : p
      ));
      setTimeout(() => setFileContentSaved(false), 2000);
    }
  }, [activeProject, viewingFile, fileContentText]);

  const renameProject = useCallback(async () => {
    if (!activeProject || !editProjectNameVal.trim()) return;
    const ok = await apiUpdateProject(activeProject.id, { name: editProjectNameVal.trim() });
    if (ok) {
      setProjects(prev => prev.map(p =>
        p.id === activeProject.id ? { ...p, name: editProjectNameVal.trim() } : p
      ));
    }
    setEditingProjectName(false);
  }, [activeProject, editProjectNameVal]);

  const addSubApp = useCallback(() => {
    if (!activeProject || !newSubAppName.trim()) return;
    const sa: SubApp = {
      id: `sa_${Date.now()}`,
      name: newSubAppName.trim(),
      icon: newSubAppIcon,
      description: "Custom sub-app",
    };
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id ? { ...p, subApps: [...p.subApps, sa] } : p
    ));
    setShowAddSubApp(false);
    setNewSubAppName("");
    setNewSubAppIcon("📱");
  }, [activeProject, newSubAppName, newSubAppIcon]);

  const deleteSubApp = useCallback((saId: string) => {
    if (!activeProject) return;
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id ? { ...p, subApps: p.subApps.filter(sa => sa.id !== saId) } : p
    ));
  }, [activeProject]);

  const sendAI = useCallback(async () => {
    if (!aiInput.trim() || aiLoading || !activeProject) return;
    const msg = aiInput.trim();
    setAiInput("");
    const newHistory = [...aiMessages, { role: "user" as const, text: msg }];
    setAiMessages([...newHistory, { role: "ai", text: "" }]);
    setAiLoading(true);
    aiAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiAbortRef.current = ctrl;
    let reply = "";
    try {
      await streamProjectChat([...newHistory], activeProject.id, msg, chunk => {
        reply += chunk;
        setAiMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "ai", text: reply };
          return updated;
        });
      }, ctrl.signal);
    } catch {}
    setAiLoading(false);
  }, [aiInput, aiLoading, activeProject, aiMessages]);

  const openAIPanel = useCallback(async () => {
    setShowAI(true);
    if (activeProject && aiMessages.length === 0) {
      const history = await apiLoadChatHistory(activeProject.id);
      if (history.length > 0) setAiMessages(history);
    }
  }, [activeProject, aiMessages.length]);

  const handleDashboardAction = (actionId: string) => {
    switch (actionId) {
      case "ai":       openAIPanel(); break;
      case "addfile":  setShowAddFile(true); break;
      case "addsubapp":setShowAddSubApp(true); break;
      case "search":   setShowSearch(true); break;
      case "modes":    setShowModes(true); break;
      case "apps":     setActiveFolderId("apps"); break;
      case "marketing":setActiveFolderId("marketing"); break;
      case "company":  setActiveFolderId("company"); break;
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "project") deleteProject(deleteTarget.id);
    if (deleteTarget.type === "file") deleteFile(deleteTarget.id);
    if (deleteTarget.type === "subapp") deleteSubApp(deleteTarget.id);
    setDeleteTarget(null);
  };

  const VIEW_MODES: { id: ViewMode; label: string }[] = [
    { id: "dashboard+folders", label: "Dashboard + Folders" },
    { id: "dashboard",         label: "Dashboard" },
    { id: "folders",           label: "Folders" },
    { id: "simple",            label: "Simple" },
    { id: "advanced",          label: "Advanced" },
  ];

  const activeFiles = activeFolderId
    ? (activeProject?.files ?? []).filter(f => f.folderId === activeFolderId)
    : (activeProject?.files ?? []);

  const MODE_COLORS: Record<string, string> = { Demo: "#8b5cf6", Test: "#f59e0b", Live: "#10b981" };

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: "hsl(225,40%,5%)", color: "#e2e8f0" }}
    >
      {/* ── Left Sidebar: Project List ────────────────────────────────────── */}
      <div
        className="w-56 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ borderRight: "1px solid rgba(99,102,241,0.15)", background: "rgba(0,0,0,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div className="text-[13px] font-bold text-white">ProjectOS</div>
            <div className="text-[9px]" style={{ color: "#475569" }}>Universal Platform</div>
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px]"
            style={{ background: "rgba(99,102,241,0.14)", color: "#818cf8" }}
            title="Search all"
          >🔍</button>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingProjects ? (
            <div className="px-4 py-6 text-center">
              <div className="text-2xl mb-2 animate-pulse">📂</div>
              <div className="text-[10px]" style={{ color: "#334155" }}>Loading projects…</div>
            </div>
          ) : projects.length === 0 && (
            <div className="px-4 py-6 text-center">
              <div className="text-2xl mb-2">📂</div>
              <div className="text-[10px]" style={{ color: "#334155" }}>No projects yet</div>
            </div>
          )}
          {projects.map(proj => (
            <div
              key={proj.id}
              className="group flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all mb-0.5"
              style={{
                background: activeProjectId === proj.id
                  ? `${proj.color}18`
                  : "transparent",
                border: `1px solid ${activeProjectId === proj.id ? `${proj.color}35` : "transparent"}`,
              }}
              onClick={() => { setActiveProjectId(proj.id); setActiveFolderId(null); }}
            >
              <span className="text-base flex-shrink-0">{proj.icon}</span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] font-medium truncate"
                  style={{ color: activeProjectId === proj.id ? proj.color : "#94a3b8" }}
                >
                  {proj.name}
                </div>
                <div className="text-[9px]" style={{ color: "#334155" }}>{proj.industry}</div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setDeleteTarget({ type: "project", id: proj.id, label: proj.name }); }}
                className="opacity-0 group-hover:opacity-100 text-[10px] px-1 py-0.5 rounded"
                style={{ color: "#f87171", background: "rgba(239,68,68,0.12)" }}
              >✕</button>
            </div>
          ))}
        </div>

        {/* New Project Button */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setShowNewProject(true)}
            className="w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2"
            style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8" }}
          >
            <span>＋</span> New Project
          </button>
        </div>
      </div>

      {/* ── Main Area ─────────────────────────────────────────────────────── */}
      {!activeProject ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">📂</div>
            <div className="text-[16px] font-semibold text-white mb-2">Select a project to open it</div>
            <div className="text-[12px] mb-6" style={{ color: "#475569" }}>
              Or create a new one — every project gets the same universal shell
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ background: "rgba(99,102,241,0.22)", border: "1px solid rgba(99,102,241,0.40)", color: "#818cf8" }}
            >
              ＋ Create First Project
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Project Top Bar ──────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.20)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{activeProject.icon}</span>
              <div>
                <div className="text-[14px] font-bold text-white">{activeProject.name}</div>
                <div className="text-[9px]" style={{ color: "#334155" }}>{activeProject.industry} · Created {activeProject.created}</div>
              </div>
              {/* Mode Badge */}
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer"
                style={{ background: `${MODE_COLORS[activeMode]}18`, border: `1px solid ${MODE_COLORS[activeMode]}35`, color: MODE_COLORS[activeMode] }}
                onClick={() => setShowModes(true)}
              >
                {activeMode === "Live" ? "🟢" : activeMode === "Demo" ? "🎭" : "🧪"} {activeMode} Mode
              </span>
            </div>
            {/* View Toggle */}
            <div className="flex items-center gap-1">
              {VIEW_MODES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: viewMode === v.id ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${viewMode === v.id ? "rgba(99,102,241,0.45)" : "transparent"}`,
                    color: viewMode === v.id ? "#818cf8" : "#475569",
                  }}
                >
                  {v.label}
                </button>
              ))}
              <button
                onClick={() => setShowAI(p => !p)}
                className="ml-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  background: showAI ? "rgba(6,182,212,0.20)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${showAI ? "rgba(6,182,212,0.45)" : "transparent"}`,
                  color: showAI ? "#22d3ee" : "#475569",
                }}
              >
                🤖 AI
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">

            {/* ── Project Content ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Dashboard */}
              {(viewMode === "dashboard+folders" || viewMode === "dashboard" || viewMode === "advanced") && (
                <div
                  className="flex-shrink-0 p-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.12)" }}
                >
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>
                    Dashboard
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {DASHBOARD_ACTIONS.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleDashboardAction(action.id)}
                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all"
                        style={{
                          background: `${action.color}10`,
                          border: `1px solid ${action.color}25`,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = `${action.color}22`;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = `${action.color}50`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = `${action.color}10`;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = `${action.color}25`;
                        }}
                      >
                        <span className="text-xl">{action.icon}</span>
                        <span className="text-[10px] font-medium leading-tight" style={{ color: action.color }}>
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Folder + File View */}
              {viewMode !== "dashboard" && (
                <div className="flex flex-1 overflow-hidden">

                  {/* Folder Tree */}
                  <div
                    className="w-52 flex-shrink-0 overflow-y-auto py-3"
                    style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {/* Universal folders */}
                    <div className="px-3 mb-1">
                      <div className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>Universal</div>
                      {activeProject.folders.filter(f => f.universal).map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => setActiveFolderId(activeFolderId === folder.id ? null : folder.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 transition-all"
                          style={{
                            background: activeFolderId === folder.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${activeFolderId === folder.id ? "rgba(99,102,241,0.35)" : "transparent"}`,
                          }}
                        >
                          <span className="text-sm">{folder.icon}</span>
                          <span className="text-[11px] flex-1 truncate" style={{ color: activeFolderId === folder.id ? "#818cf8" : "#64748b" }}>
                            {folder.name}
                          </span>
                          <span className="text-[9px]" style={{ color: "#334155" }}>
                            {activeProject.files.filter(f => f.folderId === folder.id).length || ""}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Project-specific folders */}
                    {activeProject.folders.filter(f => !f.universal).length > 0 && (
                      <div className="px-3 mt-3">
                        <div className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>
                          {activeProject.industry}
                        </div>
                        {activeProject.folders.filter(f => !f.universal).map(folder => (
                          <button
                            key={folder.id}
                            onClick={() => setActiveFolderId(activeFolderId === folder.id ? null : folder.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 transition-all"
                            style={{
                              background: activeFolderId === folder.id ? `${activeProject.color}18` : "rgba(255,255,255,0.02)",
                              border: `1px solid ${activeFolderId === folder.id ? `${activeProject.color}35` : "transparent"}`,
                            }}
                          >
                            <span className="text-sm">{folder.icon}</span>
                            <span
                              className="text-[11px] flex-1 truncate"
                              style={{ color: activeFolderId === folder.id ? activeProject.color : "#64748b" }}
                            >
                              {folder.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Sub-Apps */}
                    {(activeProject.subApps.length > 0 || viewMode === "advanced") && (
                      <div className="px-3 mt-3">
                        <div className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: "#334155" }}>Sub-Apps</div>
                        {activeProject.subApps.map(sa => (
                          <div
                            key={sa.id}
                            className="group flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5"
                            style={{ background: "rgba(255,255,255,0.02)" }}
                          >
                            <span className="text-sm">{sa.icon}</span>
                            <span className="text-[11px] flex-1 truncate" style={{ color: "#64748b" }}>{sa.name}</span>
                            <button
                              onClick={() => setDeleteTarget({ type: "subapp", id: sa.id, label: sa.name })}
                              className="opacity-0 group-hover:opacity-100 text-[9px]"
                              style={{ color: "#f87171" }}
                            >✕</button>
                          </div>
                        ))}
                        <button
                          onClick={() => setShowAddSubApp(true)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mt-1"
                          style={{ background: "rgba(236,72,153,0.08)", border: "1px dashed rgba(236,72,153,0.25)", color: "#f472b6" }}
                        >
                          <span className="text-[11px]">＋ Add Sub-App</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* File List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-[13px] font-semibold text-white">
                          {activeFolderId
                            ? activeProject.folders.find(f => f.id === activeFolderId)?.name ?? "Files"
                            : "All Files"}
                        </div>
                        <div className="text-[10px]" style={{ color: "#334155" }}>
                          {activeFiles.length} {activeFiles.length === 1 ? "file" : "files"}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAddFile(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium"
                        style={{ background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.30)", color: "#818cf8" }}
                      >
                        ＋ Add File
                      </button>
                    </div>

                    {activeFiles.length === 0 && (
                      <div
                        className="rounded-xl py-10 text-center"
                        style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
                      >
                        <div className="text-3xl mb-2">📄</div>
                        <div className="text-[12px]" style={{ color: "#334155" }}>No files here yet</div>
                        <button
                          onClick={() => setShowAddFile(true)}
                          className="mt-3 text-[11px]"
                          style={{ color: "#818cf8" }}
                        >
                          + Add the first file
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {activeFiles.map(file => (
                        <div
                          key={file.id}
                          className="group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                          onClick={() => openFileViewer(file)}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                        >
                          <span className="text-lg flex-shrink-0">
                            {file.type === "Document" ? "📄" : file.type === "Spreadsheet" ? "📊" : file.type === "Image" ? "🖼️" : file.type === "Video" ? "🎬" : file.type === "Audio" ? "🎵" : file.type === "Presentation" ? "🎯" : "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-white truncate">{file.name}</div>
                            <div className="text-[10px]" style={{ color: "#6b7280" }}>
                              {file.type} · Added {file.created}
                              {viewMode === "advanced" && ` · ${file.size}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>Open</span>
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteTarget({ type: "file", id: file.id, label: file.name }); }}
                              className="px-2 py-0.5 rounded-md text-[10px]"
                              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Project Chat Panel ────────────────────────────────────── */}
            {showAI && (
              <div
                className="w-80 flex-shrink-0 flex flex-col"
                style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", background: "#fff" }}
              >
                {/* Chat header */}
                <div
                  className="flex items-center gap-2.5 px-4 py-3.5 flex-shrink-0"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    🤖
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold" style={{ color: "#0f172a" }}>Project AI Chat</p>
                    <p className="text-[10px] truncate" style={{ color: "#6b7280" }}>{activeProject.name}</p>
                  </div>
                  <button onClick={() => setShowAI(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all"
                    style={{ color: "#9ca3af", background: "rgba(0,0,0,0.05)" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#ef4444")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#9ca3af")}
                  >✕</button>
                </div>

                {/* Messages */}
                <div ref={aiScrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
                  style={{ background: "#f8fafc" }}>
                  {aiMessages.length === 0 && (
                    <div className="flex flex-col items-center text-center pt-6 gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.15)" }}>
                        🤖
                      </div>
                      <p className="text-[12px] font-semibold" style={{ color: "#0f172a" }}>Project AI Chat</p>
                      <p className="text-[11px] leading-relaxed max-w-[220px]" style={{ color: "#6b7280" }}>
                        Ask me to add files, organize folders, plan features, or think through this project with you.
                      </p>
                      <div className="flex flex-col gap-1.5 w-full mt-1">
                        {[
                          "What files should this project have?",
                          "Suggest a folder structure",
                          "What features should I add first?",
                          "Help me plan the next steps",
                        ].map(chip => (
                          <button key={chip}
                            onClick={() => { setAiInput(chip); }}
                            className="text-[11px] px-3 py-2 rounded-xl text-left transition-all"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#374151" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.30)"; (e.currentTarget as HTMLElement).style.background = "#faf5ff"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiMessages.map((m, i) => {
                    const isLast = i === aiMessages.length - 1;
                    const showTyping = isLast && aiLoading && m.role === "ai" && !m.text;
                    return (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
                        {m.role === "ai" && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mb-0.5"
                            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                            🤖
                          </div>
                        )}
                        <div
                          className={`max-w-[82%] px-3 py-2.5 text-[12px] leading-relaxed ${m.role === "user" ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`}
                          style={m.role === "user"
                            ? { background: "#6366f1", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }
                            : { background: "#fff", color: "#0f172a", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }
                          }
                        >
                          {showTyping ? (
                            <div className="flex gap-1.5 py-0.5">
                              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "0ms" }} />
                              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "150ms" }} />
                              <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#6366f1", animationDelay: "300ms" }} />
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap">
                              {m.text}
                              {m.role === "ai" && aiLoading && isLast && m.text && (
                                <span className="inline-block w-0.5 h-3 rounded-sm animate-pulse align-middle ml-0.5"
                                  style={{ background: "#6366f1", opacity: 0.7 }} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="flex gap-2 p-3 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#fff" }}>
                  <input
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendAI()}
                    placeholder="Ask about this project…"
                    className="flex-1 text-[12px] px-3 py-2 rounded-xl outline-none transition-all"
                    style={{ background: "#f1f5f9", border: "1.5px solid transparent", color: "#0f172a" }}
                    onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.35)")}
                    onBlur={e => ((e.currentTarget as HTMLElement).style.borderColor = "transparent")}
                  />
                  <button
                    onClick={sendAI}
                    disabled={aiLoading || !aiInput.trim()}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: !aiLoading && aiInput.trim() ? "#6366f1" : "#e5e7eb",
                      color: !aiLoading && aiInput.trim() ? "#fff" : "#9ca3af",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* New Project */}
      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div
            className="w-96 rounded-2xl p-6 shadow-2xl"
            style={{ background: "rgba(12,16,24,0.98)", border: "1px solid rgba(99,102,241,0.35)" }}
          >
            <div className="text-[15px] font-bold text-white mb-4">Create New Project</div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Project Name</div>
                <input
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createProject()}
                  autoFocus
                  placeholder="e.g. Hunting Expedition 2026"
                  className="w-full text-white text-[13px] px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.30)" }}
                />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wide">Industry</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      onClick={() => setNewProjIndustry(ind)}
                      className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-[10px] font-medium text-left"
                      style={{
                        background: newProjIndustry === ind ? `${INDUSTRY_COLORS[ind]}18` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${newProjIndustry === ind ? `${INDUSTRY_COLORS[ind]}40` : "rgba(255,255,255,0.06)"}`,
                        color: newProjIndustry === ind ? INDUSTRY_COLORS[ind] : "#475569",
                      }}
                    >
                      <span>{INDUSTRY_ICONS[ind]}</span>
                      <span>{ind}</span>
                    </button>
                  ))}
                </div>
              </div>
              {newProjIndustry && (
                <div
                  className="rounded-xl px-3 py-2 text-[10px]"
                  style={{ background: "rgba(255,255,255,0.03)", color: "#475569" }}
                >
                  Auto-includes: {(INDUSTRY_SPECIFIC[newProjIndustry] ?? []).map(f => f.name).join(", ")}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowNewProject(false); setNewProjName(""); }}
                className="flex-1 py-2.5 rounded-xl text-[13px]"
                style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.10)" }}
              >Cancel</button>
              <button
                onClick={createProject}
                disabled={!newProjName.trim()}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{
                  background: newProjName.trim() ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${newProjName.trim() ? "rgba(99,102,241,0.50)" : "rgba(255,255,255,0.08)"}`,
                  color: newProjName.trim() ? "#818cf8" : "#334155",
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add File */}
      {showAddFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div
            className="w-80 rounded-2xl p-6 shadow-2xl"
            style={{ background: "rgba(12,16,24,0.98)", border: "1px solid rgba(99,102,241,0.35)" }}
          >
            <div className="text-[14px] font-bold text-white mb-4">Add New File</div>
            <div className="space-y-3">
              <input
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addFile()}
                autoFocus
                placeholder="File name…"
                className="w-full text-white text-[13px] px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.30)" }}
              />
              <div className="grid grid-cols-3 gap-1.5">
                {["Document","Spreadsheet","Presentation","Image","Video","Audio","Script","Other"].map(t => (
                  <button key={t} onClick={() => setNewFileType(t)}
                    className="py-1.5 rounded-lg text-[10px] font-medium"
                    style={{
                      background: newFileType === t ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${newFileType === t ? "rgba(99,102,241,0.40)" : "transparent"}`,
                      color: newFileType === t ? "#818cf8" : "#475569",
                    }}
                  >{t}</button>
                ))}
              </div>
              {activeFolderId && (
                <div className="text-[10px]" style={{ color: "#475569" }}>
                  → Saving to: {activeProject?.folders.find(f => f.id === activeFolderId)?.name ?? activeFolderId}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddFile(false)}
                className="flex-1 py-2 rounded-xl text-[12px]"
                style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
                Cancel
              </button>
              <button onClick={addFile} disabled={!newFileName.trim()}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                style={{
                  background: newFileName.trim() ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)",
                  color: newFileName.trim() ? "#818cf8" : "#334155",
                  border: `1px solid ${newFileName.trim() ? "rgba(99,102,241,0.45)" : "transparent"}`,
                }}>
                Add File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-App */}
      {showAddSubApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div
            className="w-80 rounded-2xl p-6 shadow-2xl"
            style={{ background: "rgba(12,16,24,0.98)", border: "1px solid rgba(236,72,153,0.30)" }}
          >
            <div className="text-[14px] font-bold text-white mb-4">Add Sub-App</div>
            <div className="space-y-3">
              <input
                value={newSubAppName}
                onChange={e => setNewSubAppName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSubApp()}
                autoFocus
                placeholder="Sub-app name…"
                className="w-full text-white text-[13px] px-3 py-2.5 rounded-xl outline-none"
                style={{ background: "rgba(236,72,153,0.07)", border: "1px solid rgba(236,72,153,0.25)" }}
              />
              <div>
                <div className="text-[9px] uppercase tracking-wide mb-1.5" style={{ color: "#475569" }}>Icon</div>
                <div className="flex gap-2 flex-wrap">
                  {["📱","💊","🗺️","📊","🛠️","🎬","📡","🔧","🌐","⚡"].map(emoji => (
                    <button key={emoji} onClick={() => setNewSubAppIcon(emoji)}
                      className="w-9 h-9 rounded-lg text-lg flex items-center justify-center"
                      style={{
                        background: newSubAppIcon === emoji ? "rgba(236,72,153,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${newSubAppIcon === emoji ? "rgba(236,72,153,0.40)" : "transparent"}`,
                      }}
                    >{emoji}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddSubApp(false)}
                className="flex-1 py-2 rounded-xl text-[12px]"
                style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
                Cancel
              </button>
              <button onClick={addSubApp} disabled={!newSubAppName.trim()}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                style={{
                  background: newSubAppName.trim() ? "rgba(236,72,153,0.20)" : "rgba(255,255,255,0.04)",
                  color: newSubAppName.trim() ? "#f472b6" : "#334155",
                  border: `1px solid ${newSubAppName.trim() ? "rgba(236,72,153,0.40)" : "transparent"}`,
                }}>
                Add Sub-App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      {showModes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setShowModes(false)}>
          <div
            className="w-72 rounded-2xl p-5 shadow-2xl"
            style={{ background: "rgba(12,16,24,0.98)", border: "1px solid rgba(99,102,241,0.30)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[14px] font-bold text-white mb-4">Switch Mode</div>
            {(["Demo","Test","Live"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setActiveMode(mode); setShowModes(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 text-left"
                style={{
                  background: activeMode === mode ? `${MODE_COLORS[mode]}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${activeMode === mode ? `${MODE_COLORS[mode]}40` : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <span className="text-xl">
                  {mode === "Demo" ? "🎭" : mode === "Test" ? "🧪" : "🟢"}
                </span>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: MODE_COLORS[mode] }}>{mode} Mode</div>
                  <div className="text-[10px]" style={{ color: "#475569" }}>
                    {mode === "Demo" ? "Demonstration-ready state" : mode === "Test" ? "Testing and QA environment" : "Live production operation"}
                  </div>
                </div>
                {activeMode === mode && <span className="ml-auto text-[10px]" style={{ color: MODE_COLORS[mode] }}>✓ Active</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Search */}
      {showSearch && <SearchModal projects={projects} onClose={() => setShowSearch(false)} />}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirm
          label={deleteTarget.label}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── File Content Viewer Modal ──────────────────────────────────── */}
      {viewingFile && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setViewingFile(null); }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-2xl flex-shrink-0">
                {viewingFile.type === "Document" ? "📄" : viewingFile.type === "Spreadsheet" ? "📊" : viewingFile.type === "Image" ? "🖼️" : viewingFile.type === "Video" ? "🎬" : viewingFile.type === "Audio" ? "🎵" : viewingFile.type === "Presentation" ? "🎯" : "📄"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-white truncate">{viewingFile.name}</p>
                <p className="text-[11px]" style={{ color: "#6b7280" }}>{viewingFile.type} · Added {viewingFile.created} · {viewingFile.size}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {fileContentSaved && (
                  <span className="text-[11px] font-medium text-green-400 px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)" }}>✓ Saved</span>
                )}
                {!fileContentEditing && (
                  <button
                    onClick={() => { setFileContentEditing(true); }}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}
                  >Edit</button>
                )}
                {fileContentEditing && (
                  <button
                    onClick={saveFileContent}
                    disabled={fileContentSaving}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-white"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                  >
                    {fileContentSaving ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : "Save"}
                  </button>
                )}
                <button
                  onClick={() => {
                    const blob = new Blob([fileContentText], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `${viewingFile.name.replace(/\s+/g, "_")}.txt`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[12px] font-semibold px-3 py-1.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.10)" }}
                >↓ Export</button>
                <button onClick={() => setViewingFile(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}
                >✕</button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {fileContentLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[13px]" style={{ color: "#6b7280" }}>Loading content…</span>
                </div>
              ) : fileContentEditing ? (
                <textarea
                  value={fileContentText}
                  onChange={e => setFileContentText(e.target.value)}
                  className="w-full h-full min-h-[50vh] rounded-xl p-4 text-[13px] text-white font-mono resize-none outline-none leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
                  autoFocus
                />
              ) : fileContentText ? (
                <div className="space-y-4">
                  {fileContentText.split(/\n(?=#{1,3} )/).map((section, i) => {
                    const lines = section.split("\n");
                    const heading = lines[0].replace(/^#{1,3} /, "");
                    const body = lines.slice(1).join("\n").trim();
                    const isHeading = /^#{1,3} /.test(lines[0]);
                    if (isHeading && body) {
                      return (
                        <div key={i} className={i > 0 ? "pt-4" : ""} style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.07)" } : {}}>
                          <h3 className="font-bold text-[14px] text-white mb-2">{heading}</h3>
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>{body}</p>
                        </div>
                      );
                    }
                    return (
                      <p key={i} className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8" }}>{section}</p>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="font-semibold text-white mb-1">No content yet</p>
                  <p className="text-[13px]" style={{ color: "#6b7280" }}>Click Edit to add content to this file.</p>
                  <button onClick={() => setFileContentEditing(true)}
                    className="mt-4 text-[13px] font-semibold text-white px-5 py-2.5 rounded-xl"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                    Start Writing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
