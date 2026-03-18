import React, { useState, useEffect, useRef, useCallback } from "react";
import { MediaPlayer } from "../components/MediaPlayer";
import { streamProjectChat, contextStore } from "@/controller";
import { useUniversalResume } from "@/hooks/useUniversalResume";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "dashboard+folders" | "dashboard" | "folders" | "simple" | "advanced" | "tasks" | "team" | "opportunities";

// ─── Shared / Suggested Types ────────────────────────────────────────────────
interface SharedProject {
  id: string;
  name: string;
  industry: string;
  icon: string;
  color: string;
  status: string;
  role: string;
  ownerId: string;
}

interface SuggestedTemplate {
  id: string;
  icon: string;
  name: string;
  industry: string;
  description: string;
  tags: string[];
}

interface OpportunityItem {
  id: string;
  icon: string;
  title: string;
  category: string;
  summary: string;
  potential: string;
  effort: "Low" | "Medium" | "High";
}

// ─── Member Types ─────────────────────────────────────────────────────────────
interface ProjectMember {
  projectId: string;
  userId: string;
  addedByUserId: string;
  role: "owner" | "editor" | "viewer";
  createdAt?: string;
}

// ─── Task Types ───────────────────────────────────────────────────────────────
interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  dueAt?: string;
  createdAt: string;
}

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
  status?: "active" | "archived";
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

// ─── Suggested Project Templates ─────────────────────────────────────────────

const SUGGESTED_TEMPLATES: SuggestedTemplate[] = [
  {
    id: "st-freelance",
    icon: "💼",
    name: "Freelance Services Platform",
    industry: "Technology",
    description: "Package your skills as a full-service offering with pricing pages, client portal, and deliverable tracker.",
    tags: ["gigs", "services", "clients"],
  },
  {
    id: "st-digital-product",
    icon: "🎁",
    name: "Digital Product Launch",
    industry: "Retail",
    description: "Ready-to-sell templates, courses, or toolkits. Comes with marketing kit and checkout flow.",
    tags: ["product", "launch", "ecommerce"],
  },
  {
    id: "st-local-biz",
    icon: "🏪",
    name: "Local Business Presence",
    industry: "General",
    description: "Website, booking system, and social content calendar for any local service business.",
    tags: ["local", "booking", "community"],
  },
  {
    id: "st-consulting",
    icon: "📊",
    name: "Consulting Practice",
    industry: "Legal",
    description: "Client proposals, SOW templates, invoicing, and outcome reports — all in one workspace.",
    tags: ["consulting", "B2B", "professional"],
  },
  {
    id: "st-content",
    icon: "🎬",
    name: "Content Creator Studio",
    industry: "Technology",
    description: "Script-to-publish pipeline, audience tracker, sponsorship CRM, and brand kit.",
    tags: ["creator", "media", "brand"],
  },
  {
    id: "st-health",
    icon: "🏥",
    name: "Health & Wellness Practice",
    industry: "Healthcare",
    description: "Client intake, session notes, wellness plans, and compliance documentation.",
    tags: ["health", "coaching", "wellness"],
  },
];

// ─── Static Opportunity Feed ───────────────────────────────────────────────────

const STATIC_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "op-1", icon: "💻",
    title: "AI-Powered Resume Services",
    category: "Freelance Gig",
    summary: "High demand for personalized AI resume writing and LinkedIn optimization. $50–$150/client.",
    potential: "$3k–$8k/mo",
    effort: "Low",
  },
  {
    id: "op-2", icon: "📱",
    title: "Social Media Management Packages",
    category: "Service",
    summary: "Businesses actively hiring for monthly social media retainers. Package for 3–5 platforms.",
    potential: "$2k–$6k/mo",
    effort: "Medium",
  },
  {
    id: "op-3", icon: "🎓",
    title: "Online Course: AI Tools for Professionals",
    category: "Digital Product",
    summary: "Trending searches for AI productivity courses. One-time creation, recurring passive income.",
    potential: "$1k–$5k/launch",
    effort: "Medium",
  },
  {
    id: "op-4", icon: "🏗️",
    title: "Construction Project Management App",
    category: "Market Gap",
    summary: "Contractors need simple mobile-first tools for estimates, crew schedules, and client sign-offs.",
    potential: "$5k–$20k/mo SaaS",
    effort: "High",
  },
  {
    id: "op-5", icon: "🛒",
    title: "Done-For-You Etsy / Shopify Store",
    category: "Business Package",
    summary: "Fully branded print-on-demand store. Setup + handoff in 5 days. Growing buyer demand.",
    potential: "$800–$2k/store",
    effort: "Low",
  },
  {
    id: "op-6", icon: "📣",
    title: "Local Business Digital Marketing Retainer",
    category: "Service",
    summary: "Restaurants, salons, and gyms need consistent ad management. Flat-rate monthly package.",
    potential: "$1.5k–$4k/client",
    effort: "Medium",
  },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiListProjects(): Promise<Project[]> {
  try {
    const res = await fetch("/api/projects", { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json() as { projects: Project[] };
    return data.projects ?? [];
  } catch { return []; }
}

async function apiCreateProject(name: string, industry: string): Promise<Project | null> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { project: Project };
    fetch("/api/activity", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "project_created", label: `Created project "${name}"`, icon: "📁", appId: "projos", projectId: String(data.project?.id ?? "") }),
    }).catch(() => {});
    return data.project;
  } catch { return null; }
}

async function apiDeleteProject(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE", credentials: "include" });
    return res.ok;
  } catch { return false; }
}

async function apiSetProjectStatus(id: string, status: "active" | "archived"): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}/status`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch { return false; }
}

async function apiAddFile(projectId: string, name: string, fileType: string, folderId: string): Promise<ProjectFile | null> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, fileType, folderId: folderId || undefined }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { file: ProjectFile };
    fetch("/api/activity", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "file_created", label: `Created file "${name}"`, icon: "📄", appId: "projos", projectId }),
    }).catch(() => {});
    return data.file;
  } catch { return null; }
}

async function apiDeleteFile(projectId: string, fileId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, { method: "DELETE", credentials: "include" });
    return res.ok;
  } catch { return false; }
}

async function apiLoadFileContent(fileId: string): Promise<string> {
  try {
    const res = await fetch(`/api/projects/files/${fileId}`, { credentials: "include" });
    if (!res.ok) return "";
    const data = await res.json() as { file: ProjectFile };
    return data.file.content ?? "";
  } catch { return ""; }
}

async function apiSaveFileContent(projectId: string, fileId: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
      method: "PUT",
      credentials: "include",
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
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch { return false; }
}

async function apiListSharedProjects(): Promise<SharedProject[]> {
  try {
    const res = await fetch("/api/projects/shared-with-me", { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json() as { projects: SharedProject[] };
    return data.projects ?? [];
  } catch { return []; }
}

async function apiResetMySpace(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("/api/projects/reset-my-space", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { ok: false, message: "Failed to reset space." };
    return await res.json() as { ok: boolean; message: string };
  } catch { return { ok: false, message: "Network error." }; }
}

async function apiLoadChatHistory(projectId: string): Promise<{ role: "user" | "ai"; text: string }[]> {
  try {
    const res = await fetch(`/api/project-chat/${projectId}/history`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json() as { messages: { role: "user" | "ai"; text: string }[] };
    return data.messages ?? [];
  } catch { return []; }
}

// ─── Task API ─────────────────────────────────────────────────────────────────

async function apiListTasks(projectId: string): Promise<ProjectTask[]> {
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks`, { credentials: "include" });
    if (!res.ok) return [];
    return await res.json() as ProjectTask[];
  } catch { return []; }
}

async function apiCreateTask(projectId: string, title: string, status: ProjectTask["status"], priority: ProjectTask["priority"], description?: string): Promise<ProjectTask | null> {
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status, priority, description }),
    });
    if (!res.ok) return null;
    return await res.json() as ProjectTask;
  } catch { return null; }
}

async function apiUpdateTask(projectId: string, taskId: string, updates: Partial<Pick<ProjectTask, "status" | "priority" | "title" | "description">>): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch { return false; }
}

async function apiDeleteTask(projectId: string, taskId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE", credentials: "include",
    });
    return res.ok;
  } catch { return false; }
}

// ─── TaskBoard Component ──────────────────────────────────────────────────────

const TASK_COLS: { id: ProjectTask["status"]; label: string; icon: string; color: string }[] = [
  { id: "todo",        label: "To Do",      icon: "⬜", color: "#94a3b8" },
  { id: "in-progress", label: "In Progress", icon: "🔵", color: "#6366f1" },
  { id: "done",        label: "Done",       icon: "✅", color: "#34C759" },
];

const PRIORITY_COLORS: Record<ProjectTask["priority"], string> = {
  low: "#94a3b8", medium: "#FF9500", high: "#FF3B30",
};

function TaskBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState<ProjectTask["status"] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<ProjectTask["priority"]>("medium");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiListTasks(projectId).then(t => { setTasks(t); setLoading(false); });
  }, [projectId]);

  const handleAdd = async (status: ProjectTask["status"]) => {
    if (!newTitle.trim()) return;
    setSaving(true);
    const task = await apiCreateTask(projectId, newTitle.trim(), status, newPriority, newDesc.trim() || undefined);
    if (task) setTasks(prev => [...prev, task]);
    setNewTitle(""); setNewDesc(""); setNewPriority("medium"); setShowAdd(null);
    setSaving(false);
  };

  const handleMove = async (task: ProjectTask, newStatus: ProjectTask["status"]) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    await apiUpdateTask(projectId, task.id, { status: newStatus });
  };

  const handleDelete = async (task: ProjectTask) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    await apiDeleteTask(projectId, task.id);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "#475569", fontSize: 13 }}>
        Loading tasks…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, padding: "16px", overflowX: "auto", height: "100%", alignItems: "flex-start" }}>
      {TASK_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} style={{
            width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8,
            background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px",
            border: `1px solid ${col.color}22`,
          }}>
            {/* Column header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{col.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.label}</span>
                <span style={{
                  fontSize: 10, background: `${col.color}22`, color: col.color,
                  borderRadius: 20, padding: "1px 7px", fontWeight: 700,
                }}>{colTasks.length}</span>
              </div>
              <button
                onClick={() => { setShowAdd(col.id); setNewTitle(""); setNewDesc(""); setNewPriority("medium"); }}
                style={{
                  background: `${col.color}22`, border: `1px solid ${col.color}44`, borderRadius: 6,
                  width: 22, height: 22, color: col.color, cursor: "pointer", fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
            </div>

            {/* Add form */}
            {showAdd === col.id && (
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Task title…"
                  style={{
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6, padding: "6px 8px", color: "#e2e8f0", fontSize: 12,
                  }}
                  onKeyDown={e => { if (e.key === "Enter") handleAdd(col.id); if (e.key === "Escape") setShowAdd(null); }}
                />
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6, padding: "5px 8px", color: "#94a3b8", fontSize: 11,
                  }}
                />
                <div style={{ display: "flex", gap: 4 }}>
                  {(["low", "medium", "high"] as ProjectTask["priority"][]).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      style={{
                        flex: 1, background: newPriority === p ? `${PRIORITY_COLORS[p]}22` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${newPriority === p ? PRIORITY_COLORS[p] : "transparent"}`,
                        borderRadius: 5, padding: "4px 0", color: PRIORITY_COLORS[p],
                        fontSize: 10, cursor: "pointer", fontWeight: 600, textTransform: "capitalize",
                      }}
                    >{p}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleAdd(col.id)}
                    disabled={!newTitle.trim() || saving}
                    style={{
                      flex: 1, background: col.color, border: "none", borderRadius: 6,
                      padding: "6px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}
                  >{saving ? "…" : "Add Task"}</button>
                  <button
                    onClick={() => setShowAdd(null)}
                    style={{
                      background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6,
                      padding: "6px 10px", color: "#94a3b8", fontSize: 11, cursor: "pointer",
                    }}
                  >Cancel</button>
                </div>
              </div>
            )}

            {/* Tasks */}
            {colTasks.length === 0 && showAdd !== col.id && (
              <div style={{ fontSize: 11, color: "#334155", textAlign: "center", padding: "16px 0" }}>No tasks yet</div>
            )}
            {colTasks.map(task => (
              <div key={task.id} style={{
                background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "10px",
                border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, lineHeight: 1.4 }}>{task.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(task)}
                    style={{
                      background: "transparent", border: "none", color: "#475569",
                      cursor: "pointer", fontSize: 11, padding: "0 2px", flexShrink: 0,
                    }}
                    title="Delete"
                  >✕</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: 9, background: `${PRIORITY_COLORS[task.priority]}22`,
                    color: PRIORITY_COLORS[task.priority], borderRadius: 4, padding: "2px 6px",
                    fontWeight: 700, textTransform: "capitalize",
                  }}>{task.priority}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {TASK_COLS.filter(c => c.id !== task.status).map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleMove(task, c.id)}
                        title={`Move to ${c.label}`}
                        style={{
                          background: `${c.color}15`, border: `1px solid ${c.color}33`,
                          borderRadius: 4, padding: "2px 5px", color: c.color,
                          fontSize: 9, cursor: "pointer", fontWeight: 600,
                        }}
                      >{c.icon}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
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

  // Universal Resume — restore last project + view across sessions
  const { resumeState, setEntityId: _resumeSetProject, setView: _resumeSetView } =
    useUniversalResume("projos", { view: "dashboard+folders", entityId: null });

  const [activeProjectId, _setActiveProjectId] = useState<string | null>(resumeState.entityId);
  const [viewMode, _setViewMode] = useState<ViewMode>(resumeState.view as ViewMode ?? "dashboard+folders");

  const setActiveProjectId = (id: string | null) => { _setActiveProjectId(id); _resumeSetProject(id); };
  const setViewMode = (m: ViewMode) => { _setViewMode(m); _resumeSetView(m); };
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
  const [showArchived, setShowArchived] = useState(false);
  // ── Shared With Me / Suggested / Opportunities state ──
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [sharedLoading, setSharedLoading]   = useState(false);
  const [showSuggested, setShowSuggested]   = useState(false);
  const [showShared, setShowShared]         = useState(false);
  const [adoptingId, setAdoptingId]         = useState<string | null>(null);
  const [adoptedIds, setAdoptedIds]         = useState<string[]>([]);
  const [opportunities]                     = useState<OpportunityItem[]>(STATIC_OPPORTUNITIES);
  const [adoptingOpId, setAdoptingOpId]     = useState<string | null>(null);
  const [adoptedOpIds, setAdoptedOpIds]     = useState<string[]>([]);
  // ── Member/Team state ──
  const [members, setMembers]         = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [addMemberId, setAddMemberId] = useState("");
  const [addMemberRole, setAddMemberRole] = useState<"viewer" | "editor" | "owner">("viewer");
  const [addingMember, setAddingMember] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;
  const visibleProjects = projects.filter(p =>
    showArchived ? p.status === "archived" : (p.status ?? "active") === "active"
  );

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

  // Seed shared intelligence layer when active project changes
  useEffect(() => {
    if (activeProject) {
      contextStore.setSessionContext({
        projectId:   activeProject.id,
        projectName: activeProject.name,
      });
    }
  }, [activeProject]);

  // Load shared projects on mount
  useEffect(() => {
    setSharedLoading(true);
    apiListSharedProjects().then(list => {
      setSharedProjects(list);
      setSharedLoading(false);
    });
  }, []);

  // Adopt a suggested template → create real project
  const adoptSuggested = useCallback(async (template: SuggestedTemplate) => {
    if (adoptingId) return;
    setAdoptingId(template.id);
    const proj = await apiCreateProject(template.name, template.industry);
    if (proj) {
      setProjects(prev => [proj, ...prev]);
      setActiveProjectId(proj.id);
      setAdoptedIds(prev => [...prev, template.id]);
    }
    setAdoptingId(null);
  }, [adoptingId]);

  // Adopt opportunity → create a project from it
  const adoptOpportunity = useCallback(async (op: OpportunityItem) => {
    if (adoptingOpId) return;
    setAdoptingOpId(op.id);
    const proj = await apiCreateProject(op.title, "General");
    if (proj) {
      setProjects(prev => [proj, ...prev]);
      setActiveProjectId(proj.id);
      setAdoptedOpIds(prev => [...prev, op.id]);
      setViewMode("dashboard+folders");
    }
    setAdoptingOpId(null);
  }, [adoptingOpId]);

  // ── Load members when Team tab is active ────────────────────────────────
  useEffect(() => {
    if (viewMode !== "team" || !activeProjectId) return;
    setMembersLoading(true);
    setMemberError("");
    fetch(`/api/projects/${activeProjectId}/members`, { credentials: "include" })
      .then(r => r.json())
      .then((data: { members?: ProjectMember[]; error?: string }) => {
        if (data.members) setMembers(data.members);
        else setMemberError(data.error ?? "Failed to load members");
      })
      .catch(() => setMemberError("Network error"))
      .finally(() => setMembersLoading(false));
  }, [viewMode, activeProjectId]);

  const handleAddMember = useCallback(async () => {
    if (!addMemberId.trim() || !activeProjectId) return;
    setAddingMember(true); setMemberError("");
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/members`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: addMemberId.trim(), role: addMemberRole }),
      });
      const data = await res.json() as { member?: ProjectMember; error?: string };
      if (data.member) { setMembers(prev => [...prev, data.member!]); setAddMemberId(""); }
      else setMemberError(data.error ?? "Failed to add member");
    } catch { setMemberError("Network error"); }
    finally { setAddingMember(false); }
  }, [addMemberId, addMemberRole, activeProjectId]);

  const handleUpdateMemberRole = useCallback(async (memberId: string, role: "owner" | "editor" | "viewer") => {
    if (!activeProjectId) return;
    await fetch(`/api/projects/${activeProjectId}/members/${memberId}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setMembers(prev => prev.map(m => m.userId === memberId ? { ...m, role } : m));
  }, [activeProjectId]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!activeProjectId) return;
    await fetch(`/api/projects/${activeProjectId}/members/${memberId}`, {
      method: "DELETE", credentials: "include",
    });
    setMembers(prev => prev.filter(m => m.userId !== memberId));
  }, [activeProjectId]);

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

  const archiveProject = useCallback(async (id: string) => {
    const ok = await apiSetProjectStatus(id, "archived");
    if (ok) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: "archived" } : p));
      if (activeProjectId === id) setActiveProjectId(null);
    }
  }, [activeProjectId]);

  const restoreProject = useCallback(async (id: string) => {
    const ok = await apiSetProjectStatus(id, "active");
    if (ok) {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: "active" } : p));
    }
  }, []);

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
      await streamProjectChat({
        projectId: activeProject.id,
        message:   msg,
        history:   newHistory.slice(0, -1).map(m => ({
          role:    m.role === "user" ? "user" as const : "assistant" as const,
          content: m.text,
        })),
        signal:  ctrl.signal,
        onChunk: chunk => {
          reply += chunk;
          setAiMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "ai", text: reply };
            return updated;
          });
        },
      });
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
    { id: "tasks",             label: "📋 Tasks" },
    { id: "team",              label: "👥 Team" },
    { id: "opportunities",     label: "💡 Opportunities" },
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

        {/* Active / Archived toggle */}
        <div className="flex mx-3 mb-1 mt-1 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={() => setShowArchived(false)}
            className="flex-1 py-1.5 text-[10px] font-semibold transition-all"
            style={!showArchived ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" } : { background: "transparent", color: "#475569" }}
          >Active</button>
          <button
            onClick={() => setShowArchived(true)}
            className="flex-1 py-1.5 text-[10px] font-semibold transition-all"
            style={showArchived ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" } : { background: "transparent", color: "#475569" }}
          >Archived</button>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingProjects ? (
            <div className="px-4 py-6 text-center">
              <div className="text-2xl mb-2 animate-pulse">📂</div>
              <div className="text-[10px]" style={{ color: "#334155" }}>Loading projects…</div>
            </div>
          ) : visibleProjects.length === 0 && (
            <div className="px-4 py-6 text-center">
              <div className="text-2xl mb-2">{showArchived ? "🗂️" : "📂"}</div>
              <div className="text-[10px]" style={{ color: "#334155" }}>
                {showArchived ? "No archived projects" : "No projects yet"}
              </div>
            </div>
          )}
          {visibleProjects.map(proj => (
            <div
              key={proj.id}
              className="group flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all mb-0.5"
              style={{
                background: activeProjectId === proj.id
                  ? `${proj.color}18`
                  : "transparent",
                border: `1px solid ${activeProjectId === proj.id ? `${proj.color}35` : "transparent"}`,
              }}
              onClick={() => { if (!showArchived) { setActiveProjectId(proj.id); setActiveFolderId(null); } }}
            >
              <span className="text-base flex-shrink-0" style={{ opacity: showArchived ? 0.5 : 1 }}>{proj.icon}</span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] font-medium truncate"
                  style={{ color: activeProjectId === proj.id ? proj.color : showArchived ? "#475569" : "#94a3b8" }}
                >
                  {proj.name}
                </div>
                <div className="text-[9px]" style={{ color: "#334155" }}>{proj.industry}</div>
              </div>
              {showArchived ? (
                <button
                  onClick={e => { e.stopPropagation(); restoreProject(proj.id); }}
                  className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ color: "#34d399", background: "rgba(52,211,153,0.12)" }}
                  title="Restore project"
                >↩</button>
              ) : (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={e => { e.stopPropagation(); archiveProject(proj.id); }}
                    className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                    style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)" }}
                    title="Archive project"
                  >📦</button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget({ type: "project", id: proj.id, label: proj.name }); }}
                    className="text-[10px] px-1 py-0.5 rounded"
                    style={{ color: "#f87171", background: "rgba(239,68,68,0.12)" }}
                    title="Delete project"
                  >✕</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* New Project Button */}
        {!showArchived && (
          <div className="px-3 pt-2 pb-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setShowNewProject(true)}
              className="w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8" }}
            >
              <span>＋</span> New Project
            </button>
          </div>
        )}

        {/* ── Suggested Projects ─────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={() => setShowSuggested(p => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>
              💡 Suggested
            </div>
            <span className="text-[10px]" style={{ color: "#334155" }}>{showSuggested ? "▲" : "▼"}</span>
          </button>
          {showSuggested && (
            <div className="px-2 pb-2 space-y-1">
              {SUGGESTED_TEMPLATES.map(t => {
                const adopted = adoptedIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl p-2.5"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{t.icon}</span>
                      <span className="text-[11px] font-medium text-white truncate flex-1">{t.name}</span>
                    </div>
                    <p className="text-[9px] leading-relaxed mb-2" style={{ color: "#475569" }}>{t.description}</p>
                    <button
                      onClick={() => !adopted && adoptSuggested(t)}
                      disabled={adoptingId === t.id || adopted}
                      className="w-full py-1 rounded-lg text-[10px] font-semibold transition-all"
                      style={{
                        background: adopted ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.18)",
                        border: `1px solid ${adopted ? "rgba(16,185,129,0.30)" : "rgba(99,102,241,0.35)"}`,
                        color: adopted ? "#34d399" : "#818cf8",
                      }}
                    >
                      {adoptingId === t.id ? "Adopting…" : adopted ? "✓ Added" : "Adopt"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Shared With Me ─────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={() => setShowShared(p => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#475569" }}>
              👥 Shared With Me
              {sharedProjects.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                  style={{ background: "rgba(99,102,241,0.20)", color: "#818cf8" }}>
                  {sharedProjects.length}
                </span>
              )}
            </div>
            <span className="text-[10px]" style={{ color: "#334155" }}>{showShared ? "▲" : "▼"}</span>
          </button>
          {showShared && (
            <div className="px-2 pb-2">
              {sharedLoading ? (
                <div className="text-center py-3 text-[10px]" style={{ color: "#334155" }}>Loading…</div>
              ) : sharedProjects.length === 0 ? (
                <div className="text-center py-3 text-[10px]" style={{ color: "#334155" }}>
                  No shared projects yet.<br />Projects shared with you appear here.
                </div>
              ) : (
                <div className="space-y-1">
                  {sharedProjects.map(sp => (
                    <div
                      key={sp.id}
                      className="flex items-center gap-2 px-2 py-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-sm">{sp.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium truncate" style={{ color: sp.color }}>{sp.name}</div>
                        <div className="text-[9px]" style={{ color: "#334155" }}>{sp.industry} · {sp.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                🧠 Agent
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

              {/* ── Task Board ── */}
              {viewMode === "tasks" && (
                <div className="flex-1 overflow-hidden">
                  <TaskBoard projectId={activeProject.id} />
                </div>
              )}

              {/* ── Team / Members Panel ── */}
              {viewMode === "team" && (
                <div className="flex-1 overflow-y-auto p-5" style={{ maxWidth: "min(100%, 680px)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                    {/* Header */}
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
                        👥 Team Members — {activeProject.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                        Add collaborators by their user ID. Roles: viewer (read-only), editor (can edit files), owner (full access).
                      </div>
                    </div>

                    {/* Add member form */}
                    <div style={{
                      background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: 0.8 }}>
                        Add Member
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontSize: 11, color: "#94a3b8" }}>User ID</label>
                          <input
                            value={addMemberId}
                            onChange={e => setAddMemberId(e.target.value)}
                            placeholder="e.g. user-abc123"
                            style={{
                              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit",
                            }}
                            onKeyDown={e => { if (e.key === "Enter") handleAddMember(); }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontSize: 11, color: "#94a3b8" }}>Role</label>
                          <select
                            value={addMemberRole}
                            onChange={e => setAddMemberRole(e.target.value as "viewer" | "editor" | "owner")}
                            style={{
                              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, cursor: "pointer",
                            }}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="owner">Owner</option>
                          </select>
                        </div>
                        <button
                          onClick={handleAddMember}
                          disabled={addingMember || !addMemberId.trim()}
                          style={{
                            background: "#6366f1", border: "none", borderRadius: 8, padding: "8px 16px",
                            color: "#fff", fontSize: 13, fontWeight: 600, cursor: addingMember || !addMemberId.trim() ? "not-allowed" : "pointer",
                            opacity: !addMemberId.trim() ? 0.5 : 1,
                          }}
                        >{addingMember ? "Adding…" : "+ Add"}</button>
                      </div>
                      {memberError && (
                        <div style={{ fontSize: 12, color: "#ff6b6b", padding: "6px 8px", background: "rgba(255,59,48,0.1)", borderRadius: 6 }}>
                          ⚠️ {memberError}
                        </div>
                      )}
                    </div>

                    {/* Members list */}
                    {membersLoading ? (
                      <div style={{ fontSize: 13, color: "#64748b", padding: "20px 0", textAlign: "center" }}>
                        Loading members…
                      </div>
                    ) : members.length === 0 ? (
                      <div style={{
                        textAlign: "center", padding: "32px 0",
                        color: "#475569", fontSize: 13,
                      }}>
                        No team members yet. Add the first one above.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {members.map(member => {
                          const roleColors: Record<string, string> = {
                            owner: "#FF9500", editor: "#6366f1", viewer: "#34C759",
                          };
                          const roleColor = roleColors[member.role] ?? "#94a3b8";
                          return (
                            <div key={member.userId} style={{
                              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                            }}>
                              {/* Avatar */}
                              <div style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: `${roleColor}22`, border: `1px solid ${roleColor}44`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 14, fontWeight: 700, color: roleColor, flexShrink: 0,
                              }}>
                                {member.userId.slice(0, 2).toUpperCase()}
                              </div>
                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {member.userId}
                                </div>
                                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                  Added by {member.addedByUserId}
                                  {member.createdAt && ` · ${new Date(member.createdAt).toLocaleDateString()}`}
                                </div>
                              </div>
                              {/* Role selector */}
                              <select
                                value={member.role}
                                onChange={e => handleUpdateMemberRole(member.userId, e.target.value as "owner" | "editor" | "viewer")}
                                style={{
                                  background: `${roleColor}18`, border: `1px solid ${roleColor}40`,
                                  borderRadius: 6, padding: "4px 10px", color: roleColor,
                                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                                }}
                              >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="owner">Owner</option>
                              </select>
                              {/* Remove */}
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                style={{
                                  background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.25)",
                                  borderRadius: 6, padding: "4px 10px", color: "#ff6b6b",
                                  fontSize: 11, cursor: "pointer",
                                }}
                                title="Remove member"
                              >Remove</button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Role legend */}
                    <div style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10, padding: "12px 14px",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>ROLE PERMISSIONS</div>
                      {[
                        { role: "viewer", color: "#34C759", perms: "Read-only — can view files and tasks, cannot edit or delete" },
                        { role: "editor", color: "#6366f1", perms: "Can add/edit files, create tasks, and run AI — cannot delete the project or manage members" },
                        { role: "owner",  color: "#FF9500", perms: "Full access — same as project creator" },
                      ].map(r => (
                        <div key={r.role} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: r.color,
                            background: `${r.color}22`, borderRadius: 4, padding: "1px 7px", flexShrink: 0, marginTop: 1,
                          }}>{r.role.toUpperCase()}</span>
                          <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{r.perms}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Opportunities Panel ── */}
              {viewMode === "opportunities" && (
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="mb-5">
                    <div className="text-[15px] font-bold text-white mb-1">💡 Opportunity Engine</div>
                    <div className="text-[11px]" style={{ color: "#475569" }}>
                      Live-scanned opportunities — jobs, gigs, market gaps, and ready-to-launch packages.
                      Adopt any to instantly create a fully-structured project workspace.
                    </div>
                  </div>
                  <div className="space-y-3">
                    {opportunities.map(op => {
                      const adopted = adoptedOpIds.includes(op.id);
                      const effortColor = op.effort === "Low" ? "#34d399" : op.effort === "Medium" ? "#f59e0b" : "#f87171";
                      return (
                        <div
                          key={op.id}
                          className="rounded-2xl p-4"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">{op.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-[13px] font-bold text-white">{op.title}</span>
                                <span
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(99,102,241,0.18)", color: "#818cf8" }}
                                >
                                  {op.category}
                                </span>
                              </div>
                              <p className="text-[12px] leading-relaxed mb-2" style={{ color: "#64748b" }}>{op.summary}</p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "#475569" }}>Revenue</span>
                                  <span className="text-[11px] font-bold" style={{ color: "#a5b4fc" }}>{op.potential}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "#475569" }}>Effort</span>
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: `${effortColor}18`, color: effortColor }}
                                  >{op.effort}</span>
                                </div>
                                <button
                                  onClick={() => !adopted && adoptOpportunity(op)}
                                  disabled={adoptingOpId === op.id || adopted}
                                  className="ml-auto px-4 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                                  style={{
                                    background: adopted ? "rgba(16,185,129,0.12)" : "rgba(99,102,241,0.20)",
                                    border: `1px solid ${adopted ? "rgba(16,185,129,0.30)" : "rgba(99,102,241,0.40)"}`,
                                    color: adopted ? "#34d399" : "#818cf8",
                                  }}
                                >
                                  {adoptingOpId === op.id ? "Creating…" : adopted ? "✓ Project Created" : "Adopt Opportunity"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Folder + File View */}
              {viewMode !== "dashboard" && viewMode !== "tasks" && viewMode !== "team" && viewMode !== "opportunities" && (
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
                    <p className="text-[12px] font-bold" style={{ color: "#0f172a" }}>🧠 Project Agent</p>
                    <p className="text-[10px] truncate" style={{ color: "#6b7280" }}>{activeProject.name} · Knows everything inside this project</p>
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
                      <p className="text-[12px] font-semibold" style={{ color: "#0f172a" }}>🧠 Project Agent</p>
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
              {/* Media player placeholder for Video/Audio file types */}
              {!fileContentLoading && !fileContentEditing && (viewingFile.type === "Video" || viewingFile.type === "Audio") && (
                <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.40)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <MediaPlayer
                    type={viewingFile.type === "Video" ? "video" : "audio"}
                    title={viewingFile.name}
                    subtitle="No media source — text content below"
                  />
                </div>
              )}
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
