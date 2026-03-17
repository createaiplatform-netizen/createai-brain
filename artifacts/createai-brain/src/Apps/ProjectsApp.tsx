import React, { useState } from "react";
import { useOS } from "@/os/OSContext";
import { BrainGen, generateProjectPackage, ProjectPackage, ProjectDeliverable } from "@/engine/BrainGen";
import { UNIVERSAL_MODULES } from "@/engine/InfiniteExpansionEngine";

interface PlatformProject {
  name: string;
  mode: "LIVE" | "DEMO" | "BUILDING";
  pages: number;
  icon: string;
  color: string;
  slug: string;
  appUrl: string;
  live: boolean;
  description: string;
  entities: string[];
}

const PROJECTS: PlatformProject[] = [
  {
    name: "Healthcare System – HealthOS",
    mode: "DEMO",
    pages: 7,
    icon: "🏥",
    color: "#0d9488",
    slug: "health-os",
    appUrl: "/health-os/",
    live: true,
    description: "Full clinical EHR platform with patient records, appointments, billing, prescriptions, and department management.",
    entities: ["Patients", "Doctors", "Appointments", "Medical Records", "Prescriptions", "Billing", "Departments"],
  },
  {
    name: "Global Staffing – StaffingOS",
    mode: "BUILDING",
    pages: 6,
    icon: "👔",
    color: "#2563eb",
    slug: "staffing-os",
    appUrl: "/staffing-os/",
    live: false,
    description: "End-to-end staffing platform: candidate tracking, job requisitions, interviews, placements, and client management.",
    entities: ["Candidates", "Clients", "Job Requisitions", "Submissions", "Interviews", "Placements"],
  },
  {
    name: "Construction Management – ConstructOS",
    mode: "BUILDING",
    pages: 7,
    icon: "🏗️",
    color: "#d97706",
    slug: "construct-os",
    appUrl: "/construct-os/",
    live: false,
    description: "Construction project management: sites, crews, tasks, materials, schedules, and incident tracking.",
    entities: ["Projects", "Sites", "Crews", "Tasks", "Materials", "Schedules", "Incidents"],
  },
];

function openStandalone(proj: PlatformProject) {
  if (!proj.live) return;
  window.open(proj.appUrl, "_blank", "noopener");
}

function NewProjectForm({ onBack, onCreated }: { onBack: () => void; onCreated?: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("Healthcare");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), industry, description: description.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      setCreated(true);
      onCreated?.();
    } catch {
      setError("Could not create project. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (created) {
    return (
      <div className="p-6 space-y-5 text-center">
        <div className="py-6">
          <p className="text-4xl mb-3">✅</p>
          <h2 className="text-xl font-bold text-foreground">Project Created!</h2>
          <p className="text-[13px] text-muted-foreground mt-1">"{name}" is live in your workspace with all standard folders scaffolded.</p>
        </div>
        <button onClick={onBack} className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity">← Back to Projects</button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>
      <h2 className="text-xl font-bold text-foreground">New Project</h2>

      {error && (
        <div className="px-3 py-2 rounded-xl text-[12px] text-red-600" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}>
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Project Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Client Portal v2"
            className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project for?"
            rows={2}
            className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Industry</label>
          <div className="grid grid-cols-3 gap-2">
            {["Healthcare", "Finance", "Education", "Construction", "Retail", "General"].map(ind => (
              <button key={ind} onClick={() => setIndustry(ind)}
                className={`py-2 rounded-xl text-[12px] font-semibold border transition-all ${industry === ind ? "bg-primary text-white border-primary" : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"}`}>
                {ind}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleCreate} disabled={!name.trim() || creating}
          className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
          {creating ? (
            <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Project…</>
          ) : "Create Project"}
        </button>
        <p className="text-[11px] text-muted-foreground text-center">Creates a real project with your standard folder structure in the database.</p>
      </div>
    </div>
  );
}

// ─── Auto-Create View (UCP-X Project Add-On) ─────────────────────────────────

const INDUSTRY_OPTIONS = UNIVERSAL_MODULES.map(m => ({ value: m.name, label: `${m.icon} ${m.name}` }));

function AutoCreateView({ onBack }: { onBack: () => void }) {
  const [projectName, setProjectName] = useState("");
  const [industry, setIndustry] = useState("Healthcare");
  const [objective, setObjective] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pkg, setPkg] = useState<ProjectPackage | null>(null);
  const [openDeliverable, setOpenDeliverable] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function handleGenerate() {
    setGenerating(true);
    setPkg(null);
    setOpenDeliverable(null);
    setTimeout(() => {
      const result = generateProjectPackage(projectName, industry, objective);
      setPkg(result);
      setGenerating(false);
      setOpenDeliverable(result.deliverables[0].id);
    }, 1400);
  }

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const active = pkg?.deliverables.find(d => d.id === openDeliverable);

  if (pkg) {
    return (
      <div className="p-5 space-y-4">
        <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>

        {/* Package header */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-bold text-[15px] text-foreground">{pkg.projectName}</p>
              <p className="text-[11px] text-indigo-600">{pkg.industry} · UCP-X Auto-Created · {pkg.deliverables.length} deliverables</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground italic">{pkg.objective}</p>
        </div>

        {/* Deliverable picker */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {pkg.deliverables.map(d => (
            <button key={d.id} onClick={() => setOpenDeliverable(d.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all
                ${openDeliverable === d.id ? "bg-primary text-white border-primary shadow-sm" : "bg-background border-border/40 text-muted-foreground hover:border-primary/30"}`}>
              <span>{d.icon}</span>
              <span>{d.label}</span>
            </button>
          ))}
        </div>

        {/* Active deliverable */}
        {active && (
          <div className="bg-background border border-border/50 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/20">
              <p className="font-bold text-[13px] text-foreground">{active.icon} {active.label}</p>
              <button onClick={() => handleCopy(active.id, active.content)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${copied === active.id ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                {copied === active.id ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[340px]">
              <pre className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed font-mono">{active.content}</pre>
            </div>
          </div>
        )}

        {/* Copy all / regenerate */}
        <div className="flex gap-2">
          <button onClick={() => handleCopy("all", pkg.deliverables.map(d => `=== ${d.label} ===\n${d.content}`).join("\n\n"))}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold border transition-all ${copied === "all" ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border/40 hover:bg-muted/80"}`}>
            {copied === "all" ? "✓ All Copied!" : "📋 Copy All Deliverables"}
          </button>
          <button onClick={() => { setPkg(null); }}
            className="px-4 py-2.5 rounded-xl text-[12px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
            ↺ Edit
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">All content is conceptual · Powered by UCP-X Project Auto-Creation Add-On · Additive only · Core intact</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">✨ Auto-Create Project</h2>
        <p className="text-[12px] text-muted-foreground">Enter once — get a complete project package instantly. Brochure, website, app wireframe, workflow map, marketing kit, training module, and live dashboard spec.</p>
      </div>

      {/* Manifest badge */}
      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
        <span className="text-base">⚡</span>
        <p className="text-[10px] text-indigo-700 font-semibold">UCP-X Project Auto-Creation Add-On · 7 deliverables per project · All industries · Additive only</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Project Name</label>
          <input value={projectName} onChange={e => setProjectName(e.target.value)}
            placeholder="e.g. SmartClinic Platform, Revenue Ops Hub…"
            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Industry</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            {INDUSTRY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-foreground block mb-1.5">Project Objective <span className="text-muted-foreground font-normal">(optional)</span></label>
          <textarea value={objective} onChange={e => setObjective(e.target.value)}
            placeholder="e.g. Streamline patient intake, automate compliance reporting, replace manual invoicing…"
            rows={3}
            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>

        {/* What you'll get */}
        <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
          <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">What gets generated</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { icon: "🗂️", label: "Brochure / PDF" },
              { icon: "🌐", label: "Website Copy" },
              { icon: "📱", label: "App Wireframe" },
              { icon: "🔄", label: "Workflow Map" },
              { icon: "📣", label: "Marketing Kit" },
              { icon: "🎯", label: "Training Module" },
              { icon: "📊", label: "Dashboard KPIs" },
            ].map(d => (
              <div key={d.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{d.icon}</span><span>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} disabled={generating}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-[14px]">
          {generating
            ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Full Package…</>
            : <>✨ Auto-Create Full Project Package</>
          }
        </button>
      </div>
    </div>
  );
}

interface DbProject {
  id: string;
  name: string;
  industry: string;
  icon: string;
  color: string;
  created: string;
  status?: string;
}

// ─── Member types ─────────────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  addedAt: string;
}

const ROLES = ["Owner", "Editor", "Viewer", "Commenter"];

// ─── TeamPanel ───────────────────────────────────────────────────────────────
function TeamPanel({ projectId }: { projectId: string }) {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addName, setAddName] = React.useState("");
  const [addEmail, setAddEmail] = React.useState("");
  const [addRole, setAddRole] = React.useState("Viewer");
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/members`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { members: [] })
      .then((d: { members: Member[] }) => setMembers(d.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  React.useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!addName.trim() && !addEmail.trim()) { setError("Enter a name or email."); return; }
    setAdding(true); setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim(), email: addEmail.trim(), role: addRole }),
      });
      const data = await res.json() as { member?: Member; error?: string };
      if (data.member) {
        setMembers(prev => [...prev, data.member!]);
        setAddName(""); setAddEmail(""); setAddRole("Viewer");
        setSuccess("Member added."); setTimeout(() => setSuccess(null), 3000);
      } else { setError(data.error ?? "Failed to add member"); }
    } catch { setError("Network error"); }
    finally { setAdding(false); }
  };

  const handleRoleChange = async (m: Member, role: string) => {
    const prev = members;
    setMembers(ms => ms.map(x => x.id === m.id ? { ...x, role } : x));
    try {
      await fetch(`/api/projects/${projectId}/members/${m.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
    } catch { setMembers(prev); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    setRemoving(id);
    try {
      await fetch(`/api/projects/${projectId}/members/${id}`, { method: "DELETE", credentials: "include" });
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch {}
    finally { setRemoving(null); }
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-6">
      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Loading members…
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add member form */}
      <div className="bg-muted/40 rounded-2xl border border-border/30 p-4 space-y-3">
        <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Invite Member</p>
        <div className="space-y-2">
          <input value={addName} onChange={e => setAddName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20" />
          <input value={addEmail} onChange={e => setAddEmail(e.target.value)}
            placeholder="Email address (optional)"
            className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20" />
          <div className="flex gap-2">
            <select value={addRole} onChange={e => setAddRole(e.target.value)}
              className="flex-1 bg-background border border-border/50 rounded-xl px-3 py-2 text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={handleAdd} disabled={adding}
              className="bg-primary text-white font-semibold text-[13px] px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              {adding ? "…" : "+ Add"}
            </button>
          </div>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
        {success && <p className="text-[11px] text-green-600">{success}</p>}
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-2xl">👥</p>
          <p className="text-[13px] text-muted-foreground">No members yet. Add collaborators above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3.5 bg-background rounded-2xl border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[12px] font-bold text-primary flex-shrink-0">
                {m.name[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{m.name}</p>
                {m.email && <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>}
              </div>
              <select value={m.role} onChange={e => handleRoleChange(m, e.target.value)}
                className="text-[11px] font-semibold bg-muted px-2 py-1 rounded-lg text-foreground outline-none border border-border/30 flex-shrink-0">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => handleRemove(m.id)} disabled={removing === m.id}
                className="text-[11px] text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40">
                {removing === m.id ? "…" : "✕"}
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground text-center">Members are stored per project in the database.</p>
    </div>
  );
}

// ─── DbProjectDetail ─────────────────────────────────────────────────────────
type DbProjectTab = "overview" | "team";

function DbProjectDetail({ project, onBack }: { project: DbProject; onBack: () => void }) {
  const { openApp } = useOS();
  const [tab, setTab] = React.useState<DbProjectTab>("overview");

  return (
    <div className="p-6 space-y-5">
      <button onClick={onBack} className="text-primary text-sm font-medium">‹ Projects</button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: (project.color || "#6366f1") + "22" }}>
          {project.icon || "📁"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground truncate">{project.name}</h2>
          <p className="text-[12px] text-muted-foreground">{project.industry} · Created {project.created}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex rounded-xl overflow-hidden border border-border/40">
        {([["overview", "📋 Overview"], ["team", "👥 Team"]] as [DbProjectTab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-[12px] font-semibold transition-all"
            style={tab === t
              ? { background: "rgba(99,102,241,0.18)", color: "#818cf8" }
              : { background: "transparent", color: "#64748b" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🏭", label: "Industry",  value: project.industry },
              { icon: "📅", label: "Created",   value: project.created },
              { icon: "🔖", label: "Status",    value: project.status === "archived" ? "Archived" : "Active" },
              { icon: "🆔", label: "Project ID", value: `#${project.id}` },
            ].map(item => (
              <div key={item.label} className="p-3 bg-background rounded-xl border border-border/50 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">{item.icon} {item.label}</p>
                <p className="text-[13px] font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
          <button onClick={() => openApp("projos" as never)}
            className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
            Open in ProjectOS →
          </button>
        </div>
      )}

      {tab === "team" && <TeamPanel projectId={project.id} />}
    </div>
  );
}

// ─── Main ProjectsApp ────────────────────────────────────────────────────────
export function ProjectsApp() {
  const { openApp } = useOS();
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAutoCreate, setShowAutoCreate] = useState(false);
  const [dbProjects, setDbProjects] = useState<DbProject[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [selectedDbProject, setSelectedDbProject] = useState<DbProject | null>(null);

  const loadProjects = React.useCallback(() => {
    setLoadingDb(true);
    fetch("/api/projects", { credentials: "include" })
      .then(r => r.ok ? r.json() : { projects: [] })
      .then((data: { projects: DbProject[] }) => { setDbProjects(data.projects ?? []); })
      .catch(() => {}).finally(() => setLoadingDb(false));
  }, []);

  React.useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this project? You can restore it any time.")) return;
    setArchiving(id);
    try {
      await fetch(`/api/projects/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      setDbProjects(prev => prev.map(p => p.id === id ? { ...p, status: "archived" } : p));
    } catch {}
    finally { setArchiving(null); }
  };

  const handleRestore = async (id: string) => {
    setArchiving(id);
    try {
      await fetch(`/api/projects/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      setDbProjects(prev => prev.map(p => p.id === id ? { ...p, status: "active" } : p));
    } catch {}
    finally { setArchiving(null); }
  };

  const activeProjects = dbProjects.filter(p => (p.status ?? "active") === "active");
  const archivedProjects = dbProjects.filter(p => p.status === "archived");
  const visibleProjects = showArchived ? archivedProjects : activeProjects;

  if (selectedDbProject) return <DbProjectDetail project={selectedDbProject} onBack={() => setSelectedDbProject(null)} />;
  if (showNewForm) return <NewProjectForm
    onBack={() => setShowNewForm(false)}
    onCreated={loadProjects}
  />;
  if (showAutoCreate) return <AutoCreateView onBack={() => setShowAutoCreate(false)} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Projects</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowAutoCreate(true)}
            className="text-sm font-medium px-3 py-2 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
            ✨ Auto-Create
          </button>
          <button onClick={() => openApp("projos" as any)}
            className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
            + New in ProjectOS
          </button>
        </div>
      </div>

      {/* ── Real DB Projects ───────────────────────────────────────── */}
      {(loadingDb || dbProjects.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex-1">My Projects</p>
            {!loadingDb && dbProjects.length > 0 && (
              <div className="flex rounded-lg overflow-hidden border border-border/40">
                <button onClick={() => setShowArchived(false)}
                  className="text-[10px] font-semibold px-2.5 py-1 transition-all"
                  style={!showArchived ? { background: "rgba(99,102,241,0.15)", color: "#818cf8" } : { color: "#64748b" }}>
                  Active ({activeProjects.length})
                </button>
                <button onClick={() => setShowArchived(true)}
                  className="text-[10px] font-semibold px-2.5 py-1 transition-all"
                  style={showArchived ? { background: "rgba(99,102,241,0.15)", color: "#818cf8" } : { color: "#64748b" }}>
                  Archived ({archivedProjects.length})
                </button>
              </div>
            )}
          </div>
          {loadingDb
            ? <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-2">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            : visibleProjects.length === 0
              ? <div className="text-center py-6 text-[13px] text-muted-foreground">
                  {showArchived ? "No archived projects." : "No active projects. Create one with + New in ProjectOS."}
                </div>
              : <div className="space-y-2">
                  {visibleProjects.map(proj => (
                    <div key={proj.id} className="bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all overflow-hidden"
                      style={proj.status === "archived" ? { opacity: 0.75 } : {}}>
                      <div className="flex items-center gap-4 p-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: (proj.color || "#6366f1") + "22" }}>
                          {proj.icon || "📁"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[14px] text-foreground truncate">{proj.name}</p>
                            {proj.status === "archived" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(100,116,139,0.12)", color: "#94a3b8" }}>Archived</span>
                            )}
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{proj.industry} · Created {proj.created}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {proj.status === "archived" ? (
                            <button onClick={() => handleRestore(proj.id)} disabled={archiving === proj.id}
                              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                              style={{ background: "rgba(34,197,94,0.10)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.20)" }}>
                              {archiving === proj.id ? "…" : "↩ Restore"}
                            </button>
                          ) : (
                            <>
                              <button onClick={() => handleArchive(proj.id)} disabled={archiving === proj.id}
                                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                style={{ background: "rgba(100,116,139,0.08)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.15)" }}>
                                {archiving === proj.id ? "…" : "Archive"}
                              </button>
                              <button onClick={() => setSelectedDbProject(proj)}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                                Open →
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
          }
        </div>
      )}

      {/* ── Platform Demo Projects ─────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">Platform Demo Projects</p>
        <div className="space-y-3">
          {PROJECTS.map(proj => (
            <div key={proj.slug} className="bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: proj.color + "18", border: `1.5px solid ${proj.color}30` }}>
                  {proj.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[14px] text-foreground">{proj.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      proj.mode === "LIVE"     ? "bg-green-100 text-green-700" :
                      proj.mode === "DEMO"     ? "bg-teal-100 text-teal-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {proj.mode === "BUILDING" ? "🔨 Building" : proj.mode === "DEMO" ? "✓ Live Demo" : "✓ Live"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{proj.description}</p>
                </div>
              </div>

              {/* Entities chips */}
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {proj.entities.map(e => (
                  <span key={e} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                    style={{ background: proj.color + "12", color: proj.color }}>
                    {e}
                  </span>
                ))}
              </div>

              {/* Footer action */}
              <div className="border-t border-border/30 px-4 py-2.5 flex items-center justify-between bg-muted/20">
                <p className="text-[11px] text-muted-foreground">
                  {proj.live ? `${proj.pages} pages · Real database · Full backend` : "Coming soon — database and backend ready"}
                </p>
                {proj.live ? (
                  <button
                    onClick={() => openStandalone(proj)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
                    style={{ backgroundColor: proj.color }}>
                    <span>↗</span><span>Open App</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
