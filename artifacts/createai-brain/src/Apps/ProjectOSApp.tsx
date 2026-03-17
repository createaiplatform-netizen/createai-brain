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

// ─── Storage ──────────────────────────────────────────────────────────────────

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem("projos_projects");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProjects(projects: Project[]) {
  try { localStorage.setItem("projos_projects", JSON.stringify(projects)); } catch {}
}

function makeProject(name: string, industry: string): Project {
  const specific = (INDUSTRY_SPECIFIC[industry] ?? INDUSTRY_SPECIFIC.General)
    .map((f, i) => ({ ...f, id: `spec-${i}`, universal: false, count: 0 }));
  const folders: ProjectFolder[] = [
    ...UNIVERSAL_FOLDERS.map(f => ({ ...f, count: 0 })),
    ...specific,
  ];
  return {
    id: `proj_${Date.now()}`,
    name,
    industry,
    icon: INDUSTRY_ICONS[industry] ?? "📁",
    color: INDUSTRY_COLORS[industry] ?? "#94a3b8",
    created: new Date().toLocaleDateString(),
    folders,
    files: [],
    subApps: [],
  };
}

// ─── SSE Mini AI Helper ───────────────────────────────────────────────────────

async function streamMiniAI(
  message: string,
  projectName: string,
  onChunk: (t: string) => void,
  signal: AbortSignal,
) {
  const res = await fetch("/api/openai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      systemContext: `You are a mini AI helper embedded inside the "${projectName}" project on the CreateAI Brain platform. You help the user organize files, create new files, add sub-apps, update content, and navigate their project. Be concise, practical, and action-oriented. Answer in 2–4 sentences max unless a list is needed.`,
    }),
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
      const line = part.startsWith("data: ") ? part.slice(6) : null;
      if (!line) continue;
      try {
        const p = JSON.parse(line);
        if (p.content) onChunk(p.content);
        if (p.done) return;
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
  const [projects, setProjects] = useState<Project[]>(loadProjects);
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
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;

  // Persist
  useEffect(() => { saveProjects(projects); }, [projects]);

  // Auto-scroll AI
  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMessages]);

  const createProject = useCallback(() => {
    if (!newProjName.trim()) return;
    const proj = makeProject(newProjName.trim(), newProjIndustry);
    setProjects(prev => [...prev, proj]);
    setActiveProjectId(proj.id);
    setActiveFolderId(null);
    setShowNewProject(false);
    setNewProjName("");
    setNewProjIndustry("General");
  }, [newProjName, newProjIndustry]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  }, [activeProjectId]);

  const addFile = useCallback(() => {
    if (!activeProject || !newFileName.trim()) return;
    const file: ProjectFile = {
      id: `file_${Date.now()}`,
      name: newFileName.trim(),
      type: newFileType,
      size: "—",
      created: new Date().toLocaleDateString(),
      folderId: activeFolderId ?? "files",
    };
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id ? { ...p, files: [...p.files, file] } : p
    ));
    setShowAddFile(false);
    setNewFileName("");
    setNewFileType("Document");
  }, [activeProject, newFileName, newFileType, activeFolderId]);

  const deleteFile = useCallback((fileId: string) => {
    if (!activeProject) return;
    setProjects(prev => prev.map(p =>
      p.id === activeProject.id ? { ...p, files: p.files.filter(f => f.id !== fileId) } : p
    ));
  }, [activeProject]);

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
    setAiMessages(prev => [...prev, { role: "user", text: msg }]);
    setAiLoading(true);
    aiAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiAbortRef.current = ctrl;
    let reply = "";
    setAiMessages(prev => [...prev, { role: "ai", text: "" }]);
    try {
      await streamMiniAI(msg, activeProject.name, chunk => {
        reply += chunk;
        setAiMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "ai", text: reply };
          return updated;
        });
      }, ctrl.signal);
    } catch {}
    setAiLoading(false);
  }, [aiInput, aiLoading, activeProject]);

  const handleDashboardAction = (actionId: string) => {
    switch (actionId) {
      case "ai":       setShowAI(true); break;
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
          {projects.length === 0 && (
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
                          className="group flex items-center gap-3 px-4 py-3 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <span className="text-lg flex-shrink-0">
                            {file.type === "Document" ? "📄" : file.type === "Spreadsheet" ? "📊" : file.type === "Image" ? "🖼️" : file.type === "Video" ? "🎬" : "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-white truncate">{file.name}</div>
                            <div className="text-[10px]" style={{ color: "#334155" }}>
                              {file.type} · Added {file.created}
                              {viewMode === "advanced" && ` · ${file.size}`}
                            </div>
                          </div>
                          <button
                            onClick={() => setDeleteTarget({ type: "file", id: file.id, label: file.name })}
                            className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg text-[10px]"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Mini AI Helper Panel ──────────────────────────────────── */}
            {showAI && (
              <div
                className="w-72 flex-shrink-0 flex flex-col"
                style={{ borderLeft: "1px solid rgba(6,182,212,0.20)", background: "rgba(0,20,25,0.60)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                  style={{ borderBottom: "1px solid rgba(6,182,212,0.15)" }}
                >
                  <div>
                    <div className="text-[12px] font-bold" style={{ color: "#22d3ee" }}>🤖 AI Helper</div>
                    <div className="text-[9px]" style={{ color: "#334155" }}>{activeProject.name}</div>
                  </div>
                  <button onClick={() => setShowAI(false)} className="text-[11px]" style={{ color: "#334155" }}>✕</button>
                </div>
                <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                  {aiMessages.length === 0 && (
                    <div className="text-center py-6">
                      <div className="text-2xl mb-2">🤖</div>
                      <div className="text-[11px]" style={{ color: "#334155" }}>
                        Ask me to create files, organize folders, add sub-apps, update content, or customize this project.
                      </div>
                    </div>
                  )}
                  {aiMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-[85%] px-3 py-2 rounded-xl text-[11px] leading-relaxed"
                        style={m.role === "user"
                          ? { background: "rgba(6,182,212,0.20)", color: "#e2e8f0" }
                          : { background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }
                        }
                      >
                        {m.text || (aiLoading && i === aiMessages.length - 1 ? (
                          <span className="animate-pulse">●●●</span>
                        ) : "")}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="flex gap-2 p-3 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(6,182,212,0.15)" }}
                >
                  <input
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendAI()}
                    placeholder="Ask the AI helper…"
                    className="flex-1 text-white text-[11px] px-3 py-2 rounded-xl outline-none"
                    style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.22)" }}
                  />
                  <button
                    onClick={sendAI}
                    disabled={aiLoading || !aiInput.trim()}
                    className="px-3 py-2 rounded-xl text-[12px]"
                    style={{
                      background: aiLoading ? "rgba(6,182,212,0.06)" : "rgba(6,182,212,0.20)",
                      color: "#22d3ee",
                      border: "1px solid rgba(6,182,212,0.30)",
                    }}
                  >
                    {aiLoading ? "⟳" : "↑"}
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
                {["Document","Spreadsheet","Image","Video","Script","Other"].map(t => (
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
    </div>
  );
}
