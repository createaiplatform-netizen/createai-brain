/**
 * DomainAppsBundle2.tsx — Extended Domain Engine Suite v2.0
 * 10 new full app screens for CreateAI Brain OS
 */

import React, { useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

function useFetch<T>(url: string, interval = 0) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    const load = () => fetch(url).then(r => r.json()).then(d => { if (!cancelled) { setData(d); setLoading(false); } }).catch(() => { if (!cancelled) setLoading(false); });
    load();
    if (interval) { const t = setInterval(load, interval); return () => { cancelled = true; clearInterval(t); }; }
    return () => { cancelled = true; };
  }, [url]);
  return { data, loading, reload: () => { setLoading(true); fetch(url).then(r => r.json()).then(d => { setData(d); setLoading(false); }); } };
}

const C = {
  page: { background: "#020617", minHeight: "100%", padding: "24px", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" } as React.CSSProperties,
  hdr: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" } as React.CSSProperties,
  icon: { fontSize: "28px" } as React.CSSProperties,
  title: { fontSize: "22px", fontWeight: 700, color: "#f8fafc" } as React.CSSProperties,
  sub: { fontSize: "13px", color: "#64748b", marginTop: "2px" } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  card: { background: "#0f172a", borderRadius: "12px", padding: "20px", border: "1px solid #1e293b" } as React.CSSProperties,
  cardLabel: { fontSize: "12px", color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "8px" },
  cardVal: { fontSize: "28px", fontWeight: 700, color: "#f8fafc" } as React.CSSProperties,
  cardSub: { fontSize: "12px", color: "#6366f1", marginTop: "4px" } as React.CSSProperties,
  section: { background: "#0f172a", borderRadius: "12px", padding: "20px", border: "1px solid #1e293b", marginBottom: "20px" } as React.CSSProperties,
  sectionTitle: { fontSize: "15px", fontWeight: 600, color: "#f8fafc", marginBottom: "16px" } as React.CSSProperties,
  btn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  btnSm: { background: "#6366f1", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  inp: { background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "10px 14px", color: "#f8fafc", fontSize: "14px", width: "100%", boxSizing: "border-box" as const },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } as React.CSSProperties,
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" } as React.CSSProperties,
  lbl: { fontSize: "12px", color: "#94a3b8", marginBottom: "6px" } as React.CSSProperties,
  fld: { marginBottom: "16px" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, fontSize: "11px", color: "#64748b", textTransform: "uppercase" as const, padding: "8px 12px", borderBottom: "1px solid #1e293b" },
  td: { padding: "10px 12px", fontSize: "13px", borderBottom: "1px solid #0f172a" },
  badge: (color: string) => ({ background: color + "20", color, borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 600 }),
  empty: { textAlign: "center" as const, color: "#475569", padding: "40px 0", fontSize: "14px" },
};

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div style={C.card}>
      <div style={C.cardLabel}>{icon} {label}</div>
      <div style={C.cardVal}>{value === 0 || value ? String(value) : "—"}</div>
      {sub && <div style={C.cardSub}>{sub}</div>}
    </div>
  );
}

function Loading() { return <div style={{ color: "#64748b", padding: "40px", textAlign: "center" }}>Loading...</div>; }

// ─── 1. Project Command App ───────────────────────────────────────────────────

export function ProjectsCmdApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/projects-cmd`, 15000);
  const [tab, setTab] = useState<"projects" | "tasks" | "new">("projects");
  const [form, setForm] = useState({ name: "", description: "", owner: "", priority: "medium", budget: "", dueDate: "" });
  const [taskForm, setTaskForm] = useState({ projectId: "", title: "", assignee: "", priority: "medium", estimatedHours: "", dueDate: "" });

  const submit = async () => {
    await fetch(`${API}/api/projects-cmd`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, budget: Number(form.budget) || 0 }) });
    reload(); setTab("projects"); setForm({ name: "", description: "", owner: "", priority: "medium", budget: "", dueDate: "" });
  };
  const submitTask = async () => {
    await fetch(`${API}/api/projects-cmd/task`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...taskForm, estimatedHours: Number(taskForm.estimatedHours) || 0 }) });
    reload(); setTaskForm({ projectId: "", title: "", assignee: "", priority: "medium", estimatedHours: "", dueDate: "" });
  };

  if (loading) return <div style={C.page}><Loading /></div>;

  const s = data ?? {};
  const statusColors: Record<string, string> = { planning: "#f59e0b", active: "#10b981", "on-hold": "#64748b", completed: "#6366f1", cancelled: "#ef4444" };
  const priorityColors: Record<string, string> = { low: "#64748b", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" };

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>🎯</span>
        <div>
          <div style={C.title}>Project Command</div>
          <div style={C.sub}>Full project management — replaces Asana, Jira, Monday.com</div>
        </div>
      </div>

      <div style={C.grid}>
        <StatCard icon="📁" label="Total Projects" value={s.totalProjects ?? 0} />
        <StatCard icon="✅" label="Total Tasks" value={s.totalTasks ?? 0} />
        <StatCard icon="🏆" label="Completed" value={`${s.completionRate ?? 0}%`} sub="completion rate" />
        <StatCard icon="💰" label="Total Budget" value={s.totalBudget ? `$${s.totalBudget.toLocaleString()}` : "$0"} />
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        {(["projects","tasks","new"] as const).map(t => (
          <button key={t} style={{ ...C.btn, background: tab === t ? "#6366f1" : "#1e293b", fontSize: "13px", padding: "8px 16px" }} onClick={() => setTab(t)}>
            {t === "new" ? "+ New Project" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "projects" && (
        <div style={C.section}>
          <div style={C.sectionTitle}>All Projects</div>
          {!(s.projects?.length) ? <div style={C.empty}>No projects yet. Create your first project.</div> : (
            <table style={C.table}>
              <thead><tr><th style={C.th}>Project</th><th style={C.th}>Owner</th><th style={C.th}>Priority</th><th style={C.th}>Status</th><th style={C.th}>Budget</th><th style={C.th}>Due</th></tr></thead>
              <tbody>{s.projects.map((p: any) => (
                <tr key={p.id}>
                  <td style={C.td}><div style={{ fontWeight: 600, color: "#f8fafc" }}>{p.name}</div><div style={{ fontSize: "11px", color: "#64748b" }}>{p.description}</div></td>
                  <td style={C.td}>{p.owner || "—"}</td>
                  <td style={C.td}><span style={C.badge(priorityColors[p.priority] ?? "#64748b")}>{p.priority}</span></td>
                  <td style={C.td}><span style={C.badge(statusColors[p.status] ?? "#64748b")}>{p.status}</span></td>
                  <td style={C.td}>${(p.budget || 0).toLocaleString()}</td>
                  <td style={C.td}>{p.dueDate || "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === "tasks" && (
        <div style={C.section}>
          <div style={C.sectionTitle}>All Tasks</div>
          <div style={{ marginBottom: "16px" }}>
            <div style={C.row}>
              <div style={C.fld}><div style={C.lbl}>Task Title</div><input style={C.inp} value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" /></div>
              <div style={C.fld}><div style={C.lbl}>Assignee</div><input style={C.inp} value={taskForm.assignee} onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Assignee name" /></div>
            </div>
            <div style={C.row}>
              <div style={C.fld}><div style={C.lbl}>Project ID</div><input style={C.inp} value={taskForm.projectId} onChange={e => setTaskForm(f => ({ ...f, projectId: e.target.value }))} placeholder="Project ID" /></div>
              <div style={C.fld}><div style={C.lbl}>Est. Hours</div><input style={C.inp} type="number" value={taskForm.estimatedHours} onChange={e => setTaskForm(f => ({ ...f, estimatedHours: e.target.value }))} placeholder="0" /></div>
            </div>
            <button style={C.btn} onClick={submitTask}>Add Task</button>
          </div>
          {!(s.projects?.length) ? <div style={C.empty}>No tasks yet.</div> : (
            <div style={{ color: "#64748b", fontSize: "13px" }}>Tasks are attached to projects. Select a project to see its tasks.</div>
          )}
        </div>
      )}

      {tab === "new" && (
        <div style={C.section}>
          <div style={C.sectionTitle}>Create New Project</div>
          <div style={C.row}><div style={C.fld}><div style={C.lbl}>Project Name *</div><input style={C.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Project name" /></div><div style={C.fld}><div style={C.lbl}>Owner</div><input style={C.inp} value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="Owner name" /></div></div>
          <div style={C.fld}><div style={C.lbl}>Description</div><input style={C.inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" /></div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>Priority</div><select style={C.inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
            <div style={C.fld}><div style={C.lbl}>Budget ($)</div><input style={C.inp} type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" /></div>
            <div style={C.fld}><div style={C.lbl}>Due Date</div><input style={C.inp} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
          </div>
          <button style={C.btn} onClick={submit} disabled={!form.name}>Create Project</button>
        </div>
      )}
    </div>
  );
}

// ─── 2. Partner Network App ───────────────────────────────────────────────────

export function PartnerNetApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/partners`, 15000);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", type: "affiliate", tier: "bronze", commissionRate: "0.10" });

  const submit = async () => {
    await fetch(`${API}/api/partners/enroll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, commissionRate: Number(form.commissionRate) }) });
    reload(); setShowForm(false); setForm({ name: "", email: "", type: "affiliate", tier: "bronze", commissionRate: "0.10" });
  };

  if (loading) return <div style={C.page}><Loading /></div>;
  const s = data ?? {};
  const tierColors: Record<string, string> = { bronze: "#cd7f32", silver: "#94a3b8", gold: "#f59e0b", platinum: "#e2e8f0", elite: "#6366f1" };

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>🤝</span>
        <div><div style={C.title}>Partner Network</div><div style={C.sub}>Affiliates, resellers, referrals — replaces PartnerStack, Impact</div></div>
      </div>

      <div style={C.grid}>
        <StatCard icon="🤝" label="Total Partners" value={s.totalPartners ?? 0} />
        <StatCard icon="📨" label="Referrals" value={s.totalReferrals ?? 0} />
        <StatCard icon="🏆" label="Won Referrals" value={s.wonReferrals ?? 0} sub={`${s.conversionRate ?? 0}% conversion`} />
        <StatCard icon="💰" label="Partner Revenue" value={s.totalRevenue ? `$${s.totalRevenue.toLocaleString()}` : "$0"} />
        <StatCard icon="💸" label="Commissions Paid" value={s.totalCommissions ? `$${s.totalCommissions.toLocaleString()}` : "$0"} />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <button style={C.btn} onClick={() => setShowForm(v => !v)}>{showForm ? "Cancel" : "+ Enroll Partner"}</button>
      </div>

      {showForm && (
        <div style={{ ...C.section, marginBottom: "20px" }}>
          <div style={C.sectionTitle}>Enroll New Partner</div>
          <div style={C.row}><div style={C.fld}><div style={C.lbl}>Name *</div><input style={C.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Partner name" /></div><div style={C.fld}><div style={C.lbl}>Email *</div><input style={C.inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="partner@email.com" /></div></div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>Type</div><select style={C.inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="affiliate">Affiliate</option><option value="reseller">Reseller</option><option value="referral">Referral</option><option value="integration">Integration</option><option value="strategic">Strategic</option></select></div>
            <div style={C.fld}><div style={C.lbl}>Tier</div><select style={C.inp} value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}><option value="bronze">Bronze</option><option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option><option value="elite">Elite</option></select></div>
            <div style={C.fld}><div style={C.lbl}>Commission Rate</div><input style={C.inp} type="number" step="0.01" value={form.commissionRate} onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))} placeholder="0.10" /></div>
          </div>
          <button style={C.btn} onClick={submit} disabled={!form.name || !form.email}>Enroll Partner</button>
        </div>
      )}

      <div style={C.section}>
        <div style={C.sectionTitle}>Partner Leaderboard</div>
        {!(s.partners?.length) ? <div style={C.empty}>No partners enrolled yet.</div> : (
          <table style={C.table}>
            <thead><tr><th style={C.th}>Partner</th><th style={C.th}>Type</th><th style={C.th}>Tier</th><th style={C.th}>Referrals</th><th style={C.th}>Revenue Generated</th><th style={C.th}>Commissions</th></tr></thead>
            <tbody>{s.partners.map((p: any) => (
              <tr key={p.id}>
                <td style={C.td}><div style={{ fontWeight: 600, color: "#f8fafc" }}>{p.name}</div><div style={{ fontSize: "11px", color: "#64748b" }}>{p.email}</div></td>
                <td style={C.td}><span style={C.badge("#6366f1")}>{p.type}</span></td>
                <td style={C.td}><span style={C.badge(tierColors[p.tier] ?? "#64748b")}>{p.tier}</span></td>
                <td style={C.td}>{p.totalReferrals}</td>
                <td style={C.td}>${(p.totalRevenue || 0).toLocaleString()}</td>
                <td style={C.td}>${(p.totalCommissions || 0).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── 3. Event & Booking App ───────────────────────────────────────────────────

export function EventBookingApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/events`, 15000);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", type: "webinar", description: "", startDate: "", location: "Online", maxAttendees: "100", price: "0" });

  const submit = async () => {
    await fetch(`${API}/api/events/event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, maxAttendees: Number(form.maxAttendees), price: Number(form.price) }) });
    reload(); setShowForm(false); setForm({ title: "", type: "webinar", description: "", startDate: "", location: "Online", maxAttendees: "100", price: "0" });
  };

  if (loading) return <div style={C.page}><Loading /></div>;
  const s = data ?? {};
  const statusColors: Record<string, string> = { open: "#10b981", "sold-out": "#f59e0b", draft: "#64748b", completed: "#6366f1", cancelled: "#ef4444" };

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>📅</span>
        <div><div style={C.title}>Events & Bookings</div><div style={C.sub}>Event management and ticketing — replaces Eventbrite, Hopin</div></div>
      </div>

      <div style={C.grid}>
        <StatCard icon="📅" label="Total Events" value={s.totalEvents ?? 0} />
        <StatCard icon="🎟️" label="Total Bookings" value={s.totalBookings ?? 0} />
        <StatCard icon="✅" label="Confirmed" value={s.confirmedBookings ?? 0} />
        <StatCard icon="👥" label="Attended" value={s.attendedBookings ?? 0} />
        <StatCard icon="💰" label="Event Revenue" value={s.totalRevenue ? `$${s.totalRevenue.toLocaleString()}` : "$0"} />
        <StatCard icon="🏟️" label="Total Capacity Used" value={s.totalAttendees ?? 0} />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <button style={C.btn} onClick={() => setShowForm(v => !v)}>{showForm ? "Cancel" : "+ Create Event"}</button>
      </div>

      {showForm && (
        <div style={{ ...C.section, marginBottom: "20px" }}>
          <div style={C.sectionTitle}>Create New Event</div>
          <div style={C.row}><div style={C.fld}><div style={C.lbl}>Event Title *</div><input style={C.inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event name" /></div><div style={C.fld}><div style={C.lbl}>Type</div><select style={C.inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="webinar">Webinar</option><option value="workshop">Workshop</option><option value="conference">Conference</option><option value="meetup">Meetup</option><option value="training">Training</option><option value="product-launch">Product Launch</option><option value="vip">VIP</option></select></div></div>
          <div style={C.fld}><div style={C.lbl}>Description</div><input style={C.inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Event description" /></div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>Start Date</div><input style={C.inp} type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div style={C.fld}><div style={C.lbl}>Max Attendees</div><input style={C.inp} type="number" value={form.maxAttendees} onChange={e => setForm(f => ({ ...f, maxAttendees: e.target.value }))} /></div>
            <div style={C.fld}><div style={C.lbl}>Ticket Price ($)</div><input style={C.inp} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
          </div>
          <button style={C.btn} onClick={submit} disabled={!form.title}>Create Event</button>
        </div>
      )}

      <div style={C.section}>
        <div style={C.sectionTitle}>All Events</div>
        {!(s.events?.length) ? <div style={C.empty}>No events created yet.</div> : (
          <table style={C.table}>
            <thead><tr><th style={C.th}>Event</th><th style={C.th}>Type</th><th style={C.th}>Status</th><th style={C.th}>Attendees</th><th style={C.th}>Price</th><th style={C.th}>Revenue</th></tr></thead>
            <tbody>{s.events.map((e: any) => (
              <tr key={e.id}>
                <td style={C.td}><div style={{ fontWeight: 600, color: "#f8fafc" }}>{e.title}</div><div style={{ fontSize: "11px", color: "#64748b" }}>{e.location}</div></td>
                <td style={C.td}><span style={C.badge("#6366f1")}>{e.type}</span></td>
                <td style={C.td}><span style={C.badge(statusColors[e.status] ?? "#64748b")}>{e.status}</span></td>
                <td style={C.td}>{e.currentAttendees}/{e.maxAttendees}</td>
                <td style={C.td}>${e.price || 0}</td>
                <td style={C.td}>${(e.revenue || 0).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── 4. Education Hub App ─────────────────────────────────────────────────────

export function EducationHubApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/education-hub`, 15000);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "", level: "beginner", instructor: "", price: "0", modules: "1", duration: "60" });

  const submit = async () => {
    await fetch(`${API}/api/education-hub/course`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: Number(form.price), modules: Number(form.modules), duration: Number(form.duration) }) });
    reload(); setShowForm(false);
  };

  if (loading) return <div style={C.page}><Loading /></div>;
  const s = data ?? {};
  const levelColors: Record<string, string> = { beginner: "#10b981", intermediate: "#f59e0b", advanced: "#f97316", expert: "#ef4444" };

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>🎓</span>
        <div><div style={C.title}>Education Hub</div><div style={C.sub}>Courses, enrollments, and certificates — replaces Teachable, Kajabi</div></div>
      </div>

      <div style={C.grid}>
        <StatCard icon="📚" label="Total Courses" value={s.totalCourses ?? 0} />
        <StatCard icon="👥" label="Enrollments" value={s.totalEnrollments ?? 0} />
        <StatCard icon="🏅" label="Completions" value={s.completions ?? 0} sub={`${s.completionRate ?? 0}% rate`} />
        <StatCard icon="📜" label="Certificates" value={s.certificates ?? 0} />
        <StatCard icon="💰" label="Course Revenue" value={s.totalRevenue ? `$${s.totalRevenue.toLocaleString()}` : "$0"} />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <button style={C.btn} onClick={() => setShowForm(v => !v)}>{showForm ? "Cancel" : "+ Create Course"}</button>
      </div>

      {showForm && (
        <div style={{ ...C.section, marginBottom: "20px" }}>
          <div style={C.sectionTitle}>Create New Course</div>
          <div style={C.row}><div style={C.fld}><div style={C.lbl}>Course Title *</div><input style={C.inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Course title" /></div><div style={C.fld}><div style={C.lbl}>Category</div><input style={C.inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="AI, Business, Design..." /></div></div>
          <div style={C.fld}><div style={C.lbl}>Description</div><input style={C.inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What will students learn?" /></div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>Level</div><select style={C.inp} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>
            <div style={C.fld}><div style={C.lbl}>Modules</div><input style={C.inp} type="number" value={form.modules} onChange={e => setForm(f => ({ ...f, modules: e.target.value }))} /></div>
            <div style={C.fld}><div style={C.lbl}>Price ($)</div><input style={C.inp} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
          </div>
          <button style={C.btn} onClick={submit} disabled={!form.title}>Create Course</button>
        </div>
      )}

      <div style={C.section}>
        <div style={C.sectionTitle}>Course Catalog</div>
        {!(s.courses?.length) ? <div style={C.empty}>No courses created yet.</div> : (
          <table style={C.table}>
            <thead><tr><th style={C.th}>Course</th><th style={C.th}>Level</th><th style={C.th}>Modules</th><th style={C.th}>Enrolled</th><th style={C.th}>Completions</th><th style={C.th}>Price</th></tr></thead>
            <tbody>{s.courses.map((c: any) => (
              <tr key={c.id}>
                <td style={C.td}><div style={{ fontWeight: 600, color: "#f8fafc" }}>{c.title}</div><div style={{ fontSize: "11px", color: "#64748b" }}>{c.category} · {c.instructor}</div></td>
                <td style={C.td}><span style={C.badge(levelColors[c.level] ?? "#64748b")}>{c.level}</span></td>
                <td style={C.td}>{c.modules}</td>
                <td style={C.td}>{c.enrolled}</td>
                <td style={C.td}>{c.completions}</td>
                <td style={C.td}>${c.price}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── 5. Social Command App ────────────────────────────────────────────────────

export function SocialCmdApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/social`, 15000);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ content: "", platform: "instagram", hashtags: "", scheduledAt: "" });

  const submit = async () => {
    await fetch(`${API}/api/social/post`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, hashtags: form.hashtags.split(",").map(h => h.trim()).filter(Boolean) }) });
    reload(); setShowForm(false); setForm({ content: "", platform: "instagram", hashtags: "", scheduledAt: "" });
  };

  if (loading) return <div style={C.page}><Loading /></div>;
  const s = data ?? {};
  const platformColors: Record<string, string> = { instagram: "#e1306c", tiktok: "#69c9d0", linkedin: "#0077b5", youtube: "#ff0000", twitter: "#1da1f2", facebook: "#1877f2", pinterest: "#e60023", threads: "#000" };
  const statusColors: Record<string, string> = { scheduled: "#f59e0b", published: "#10b981", draft: "#64748b", failed: "#ef4444" };

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>📣</span>
        <div><div style={C.title}>Social Command</div><div style={C.sub}>Cross-platform social media center — replaces Hootsuite, Buffer</div></div>
      </div>

      <div style={C.grid}>
        <StatCard icon="📝" label="Total Posts" value={s.totalPosts ?? 0} />
        <StatCard icon="📡" label="Published" value={s.publishedPosts ?? 0} />
        <StatCard icon="⏰" label="Scheduled" value={s.scheduledPosts ?? 0} />
        <StatCard icon="👁️" label="Impressions" value={(s.totalImpressions ?? 0).toLocaleString()} />
        <StatCard icon="🌐" label="Reach" value={(s.totalReach ?? 0).toLocaleString()} />
        <StatCard icon="❤️" label="Engagement" value={(s.totalEngagement ?? 0).toLocaleString()} />
      </div>

      <div style={C.section}>
        <div style={C.sectionTitle}>Connected Accounts</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
          {(s.accounts ?? []).map((a: any) => (
            <div key={a.platform} style={{ ...C.card, display: "flex", alignItems: "center", gap: "12px", padding: "14px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: a.connected ? "#10b981" : "#475569" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "#f8fafc" }}>{a.handle}</div>
                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "capitalize" }}>{a.platform} · {a.connected ? "Connected" : "Not connected"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <button style={C.btn} onClick={() => setShowForm(v => !v)}>{showForm ? "Cancel" : "+ Schedule Post"}</button>
      </div>

      {showForm && (
        <div style={{ ...C.section, marginBottom: "20px" }}>
          <div style={C.sectionTitle}>Schedule New Post</div>
          <div style={C.fld}><div style={C.lbl}>Content *</div><textarea style={{ ...C.inp, height: "80px", resize: "vertical" as const }} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="What do you want to share?" /></div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>Platform</div><select style={C.inp} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="linkedin">LinkedIn</option><option value="youtube">YouTube</option><option value="twitter">Twitter/X</option><option value="facebook">Facebook</option><option value="threads">Threads</option></select></div>
            <div style={C.fld}><div style={C.lbl}>Hashtags (comma-sep)</div><input style={C.inp} value={form.hashtags} onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))} placeholder="#createai, #ai" /></div>
            <div style={C.fld}><div style={C.lbl}>Schedule For</div><input style={C.inp} type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} /></div>
          </div>
          <button style={C.btn} onClick={submit} disabled={!form.content}>Schedule Post</button>
        </div>
      )}

      <div style={C.section}>
        <div style={C.sectionTitle}>Post Calendar</div>
        {!(s.posts?.length) ? <div style={C.empty}>No posts scheduled yet.</div> : (
          <table style={C.table}>
            <thead><tr><th style={C.th}>Content</th><th style={C.th}>Platform</th><th style={C.th}>Status</th><th style={C.th}>Scheduled</th><th style={C.th}>Impressions</th><th style={C.th}>Engagement</th></tr></thead>
            <tbody>{s.posts.map((p: any) => (
              <tr key={p.id}>
                <td style={C.td}><div style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#e2e8f0" }}>{p.content}</div></td>
                <td style={C.td}><span style={C.badge(platformColors[p.platform] ?? "#64748b")}>{p.platform}</span></td>
                <td style={C.td}><span style={C.badge(statusColors[p.status] ?? "#64748b")}>{p.status}</span></td>
                <td style={C.td}>{p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString() : "—"}</td>
                <td style={C.td}>{p.impressions.toLocaleString()}</td>
                <td style={C.td}>{p.engagement.toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── 6. Supply Chain Ops App ──────────────────────────────────────────────────

export function SupplyChainOpsApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/supply-chain`, 15000);
  const [tab, setTab] = useState<"vendors" | "pos" | "new">("vendors");
  const [vendorForm, setVendorForm] = useState({ name: "", category: "", email: "", leadTimeDays: "7" });
  const [poForm, setPoForm] = useState({ vendorId: "", expectedDate: "", sku: "", description: "", qty: "1", unitCost: "0" });

  const submitVendor = async () => {
    await fetch(`${API}/api/supply-chain/vendor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...vendorForm, leadTimeDays: Number(vendorForm.leadTimeDays) }) });
    reload(); setVendorForm({ name: "", category: "", email: "", leadTimeDays: "7" });
  };
  const submitPO = async () => {
    await fetch(`${API}/api/supply-chain/po`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendorId: poForm.vendorId, expectedDate: poForm.expectedDate, lineItems: [{ sku: poForm.sku, description: poForm.description, qty: Number(poForm.qty), unitCost: Number(poForm.unitCost) }] }) });
    reload();
  };

  if (loading) return <div style={C.page}><Loading /></div>;
  const s = data ?? {};
  const statusColors: Record<string, string> = { draft: "#64748b", sent: "#f59e0b", acknowledged: "#6366f1", partial: "#f97316", received: "#10b981", cancelled: "#ef4444" };

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>🚚</span>
        <div><div style={C.title}>Supply Chain</div><div style={C.sub}>Vendor and procurement management — replaces NetSuite, TradeGecko</div></div>
      </div>

      <div style={C.grid}>
        <StatCard icon="🏭" label="Total Vendors" value={s.totalVendors ?? 0} sub={`${s.activeVendors ?? 0} active`} />
        <StatCard icon="📋" label="Purchase Orders" value={s.totalPOs ?? 0} />
        <StatCard icon="⏳" label="Pending POs" value={s.pendingPOs ?? 0} sub={`$${(s.pendingValue ?? 0).toLocaleString()} value`} />
        <StatCard icon="💰" label="Total Spend" value={s.totalSpend ? `$${s.totalSpend.toLocaleString()}` : "$0"} />
        <StatCard icon="✅" label="Received POs" value={s.receivedPOs ?? 0} />
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        {(["vendors","pos","new"] as const).map(t => (
          <button key={t} style={{ ...C.btn, background: tab === t ? "#6366f1" : "#1e293b", fontSize: "13px", padding: "8px 16px" }} onClick={() => setTab(t)}>
            {t === "new" ? "+ Add Vendor" : t === "pos" ? "Purchase Orders" : "Vendors"}
          </button>
        ))}
      </div>

      {tab === "vendors" && (
        <div style={C.section}>
          <div style={C.sectionTitle}>Vendor Directory</div>
          {!(s.vendors?.length) ? <div style={C.empty}>No vendors added yet.</div> : (
            <table style={C.table}>
              <thead><tr><th style={C.th}>Vendor</th><th style={C.th}>Category</th><th style={C.th}>Lead Time</th><th style={C.th}>Reliability</th><th style={C.th}>Total Orders</th><th style={C.th}>Total Spend</th></tr></thead>
              <tbody>{s.vendors.map((v: any) => (
                <tr key={v.id}>
                  <td style={C.td}><div style={{ fontWeight: 600, color: "#f8fafc" }}>{v.name}</div><div style={{ fontSize: "11px", color: "#64748b" }}>{v.email}</div></td>
                  <td style={C.td}>{v.category}</td>
                  <td style={C.td}>{v.leadTimeDays}d</td>
                  <td style={C.td}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "60px", height: "6px", background: "#1e293b", borderRadius: "3px" }}><div style={{ width: `${v.reliabilityScore}%`, height: "100%", background: "#6366f1", borderRadius: "3px" }} /></div><span style={{ fontSize: "12px" }}>{v.reliabilityScore}%</span></div></td>
                  <td style={C.td}>{v.totalOrders}</td>
                  <td style={C.td}>${(v.totalSpend || 0).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === "pos" && (
        <div style={C.section}>
          <div style={C.sectionTitle}>Purchase Orders</div>
          <div style={{ marginBottom: "16px" }}>
            <div style={C.row3}>
              <div style={C.fld}><div style={C.lbl}>Vendor ID</div><input style={C.inp} value={poForm.vendorId} onChange={e => setPoForm(f => ({ ...f, vendorId: e.target.value }))} placeholder="Vendor ID" /></div>
              <div style={C.fld}><div style={C.lbl}>SKU</div><input style={C.inp} value={poForm.sku} onChange={e => setPoForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" /></div>
              <div style={C.fld}><div style={C.lbl}>Expected Date</div><input style={C.inp} type="date" value={poForm.expectedDate} onChange={e => setPoForm(f => ({ ...f, expectedDate: e.target.value }))} /></div>
            </div>
            <div style={C.row3}>
              <div style={C.fld}><div style={C.lbl}>Description</div><input style={C.inp} value={poForm.description} onChange={e => setPoForm(f => ({ ...f, description: e.target.value }))} placeholder="Item description" /></div>
              <div style={C.fld}><div style={C.lbl}>Quantity</div><input style={C.inp} type="number" value={poForm.qty} onChange={e => setPoForm(f => ({ ...f, qty: e.target.value }))} /></div>
              <div style={C.fld}><div style={C.lbl}>Unit Cost ($)</div><input style={C.inp} type="number" value={poForm.unitCost} onChange={e => setPoForm(f => ({ ...f, unitCost: e.target.value }))} /></div>
            </div>
            <button style={C.btn} onClick={submitPO} disabled={!poForm.vendorId}>Create PO</button>
          </div>
          {!(s.purchaseOrders?.length) ? <div style={C.empty}>No purchase orders yet.</div> : (
            <table style={C.table}>
              <thead><tr><th style={C.th}>PO</th><th style={C.th}>Vendor</th><th style={C.th}>Total</th><th style={C.th}>Status</th><th style={C.th}>Expected</th></tr></thead>
              <tbody>{s.purchaseOrders.map((po: any) => (
                <tr key={po.id}>
                  <td style={C.td}><div style={{ fontFamily: "monospace", fontSize: "11px", color: "#6366f1" }}>{po.id.slice(0, 8)}</div></td>
                  <td style={C.td}>{po.vendorName}</td>
                  <td style={C.td}>${(po.total || 0).toLocaleString()}</td>
                  <td style={C.td}><span style={C.badge(statusColors[po.status] ?? "#64748b")}>{po.status}</span></td>
                  <td style={C.td}>{po.expectedDate || "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === "new" && (
        <div style={C.section}>
          <div style={C.sectionTitle}>Add Vendor</div>
          <div style={C.row}><div style={C.fld}><div style={C.lbl}>Vendor Name *</div><input style={C.inp} value={vendorForm.name} onChange={e => setVendorForm(f => ({ ...f, name: e.target.value }))} placeholder="Vendor name" /></div><div style={C.fld}><div style={C.lbl}>Category</div><input style={C.inp} value={vendorForm.category} onChange={e => setVendorForm(f => ({ ...f, category: e.target.value }))} placeholder="Raw materials, SaaS, Logistics..." /></div></div>
          <div style={C.row}><div style={C.fld}><div style={C.lbl}>Email</div><input style={C.inp} value={vendorForm.email} onChange={e => setVendorForm(f => ({ ...f, email: e.target.value }))} placeholder="vendor@email.com" /></div><div style={C.fld}><div style={C.lbl}>Lead Time (days)</div><input style={C.inp} type="number" value={vendorForm.leadTimeDays} onChange={e => setVendorForm(f => ({ ...f, leadTimeDays: e.target.value }))} /></div></div>
          <button style={C.btn} onClick={submitVendor} disabled={!vendorForm.name}>Add Vendor</button>
        </div>
      )}
    </div>
  );
}

// ─── 7. Franchise Hub App ─────────────────────────────────────────────────────

export function FranchiseOpsApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/franchise`, 15000);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", operator: "", operatorEmail: "", territory: "", royaltyRate: "0.06", staff: "0" });

  const submit = async () => {
    await fetch(`${API}/api/franchise/location`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, royaltyRate: Number(form.royaltyRate), staff: Number(form.staff) }) });
    reload(); setShowForm(false);
  };

  if (loading) return <div style={C.page}><Loading /></div>;
  const s = data ?? {};
  const statusColors: Record<string, string> = { open: "#10b981", pending: "#f59e0b", suspended: "#ef4444", closed: "#64748b" };

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>🏪</span>
        <div><div style={C.title}>Franchise Hub</div><div style={C.sub}>Multi-location franchise operations — replaces FranConnect</div></div>
      </div>

      <div style={C.grid}>
        <StatCard icon="🏪" label="Total Locations" value={s.totalLocations ?? 0} sub={`${s.openLocations ?? 0} open`} />
        <StatCard icon="👥" label="Total Staff" value={s.totalStaff ?? 0} />
        <StatCard icon="💰" label="Monthly Revenue" value={s.totalMonthlyRevenue ? `$${s.totalMonthlyRevenue.toLocaleString()}` : "$0"} />
        <StatCard icon="💸" label="Royalties Collected" value={s.totalRoyalties ? `$${s.totalRoyalties.toLocaleString()}` : "$0"} />
        <StatCard icon="✅" label="Avg Compliance" value={`${s.avgComplianceScore ?? 0}%`} />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <button style={C.btn} onClick={() => setShowForm(v => !v)}>{showForm ? "Cancel" : "+ Add Location"}</button>
      </div>

      {showForm && (
        <div style={{ ...C.section, marginBottom: "20px" }}>
          <div style={C.sectionTitle}>Add Franchise Location</div>
          <div style={C.row}><div style={C.fld}><div style={C.lbl}>Location Name *</div><input style={C.inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Location name" /></div><div style={C.fld}><div style={C.lbl}>Operator Name</div><input style={C.inp} value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} placeholder="Franchise operator" /></div></div>
          <div style={C.row}><div style={C.fld}><div style={C.lbl}>City</div><input style={C.inp} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" /></div><div style={C.fld}><div style={C.lbl}>State</div><input style={C.inp} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State" /></div></div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>Territory</div><input style={C.inp} value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))} placeholder="Territory name" /></div>
            <div style={C.fld}><div style={C.lbl}>Royalty Rate</div><input style={C.inp} type="number" step="0.01" value={form.royaltyRate} onChange={e => setForm(f => ({ ...f, royaltyRate: e.target.value }))} /></div>
            <div style={C.fld}><div style={C.lbl}>Staff Count</div><input style={C.inp} type="number" value={form.staff} onChange={e => setForm(f => ({ ...f, staff: e.target.value }))} /></div>
          </div>
          <button style={C.btn} onClick={submit} disabled={!form.name}>Add Location</button>
        </div>
      )}

      <div style={C.section}>
        <div style={C.sectionTitle}>Location Network</div>
        {!(s.locations?.length) ? <div style={C.empty}>No franchise locations added yet.</div> : (
          <table style={C.table}>
            <thead><tr><th style={C.th}>Location</th><th style={C.th}>Operator</th><th style={C.th}>Territory</th><th style={C.th}>Status</th><th style={C.th}>Monthly Rev</th><th style={C.th}>Compliance</th></tr></thead>
            <tbody>{s.locations.map((l: any) => (
              <tr key={l.id}>
                <td style={C.td}><div style={{ fontWeight: 600, color: "#f8fafc" }}>{l.name}</div><div style={{ fontSize: "11px", color: "#64748b" }}>{l.city}, {l.state}</div></td>
                <td style={C.td}>{l.operator || "—"}</td>
                <td style={C.td}>{l.territory || "—"}</td>
                <td style={C.td}><span style={C.badge(statusColors[l.status] ?? "#64748b")}>{l.status}</span></td>
                <td style={C.td}>${(l.monthlyRevenue || 0).toLocaleString()}</td>
                <td style={C.td}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "50px", height: "6px", background: "#1e293b", borderRadius: "3px" }}><div style={{ width: `${l.complianceScore}%`, height: "100%", background: l.complianceScore > 80 ? "#10b981" : l.complianceScore > 50 ? "#f59e0b" : "#ef4444", borderRadius: "3px" }} /></div><span style={{ fontSize: "12px" }}>{l.complianceScore}%</span></div></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── 8. Brand Vault App ───────────────────────────────────────────────────────

export function BrandVaultApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/brand`, 15000);
  const [tab, setTab] = useState<"assets" | "guidelines" | "new">("assets");
  const [assetForm, setAssetForm] = useState({ name: "", type: "logo", description: "", fileUrl: "", license: "internal-only", version: "1.0" });
  const [guidelineForm, setGuidelineForm] = useState({ section: "", rule: "", rationale: "", example: "", priority: "must" });

  const submitAsset = async () => {
    await fetch(`${API}/api/brand/asset`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assetForm) });
    reload(); setAssetForm({ name: "", type: "logo", description: "", fileUrl: "", license: "internal-only", version: "1.0" });
  };
  const submitGuideline = async () => {
    await fetch(`${API}/api/brand/guideline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(guidelineForm) });
    reload();
  };

  if (loading) return <div style={C.page}><Loading /></div>;
  const s = data ?? {};
  const licenseColors: Record<string, string> = { "internal-only": "#64748b", partner: "#f59e0b", commercial: "#10b981", open: "#6366f1" };
  const priorityColors: Record<string, string> = { must: "#ef4444", should: "#f59e0b", may: "#10b981" };

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>💎</span>
        <div><div style={C.title}>Brand Vault</div><div style={C.sub}>Brand assets and guidelines — replaces Bynder, Brandfolder</div></div>
      </div>

      <div style={C.grid}>
        <StatCard icon="🖼️" label="Total Assets" value={s.totalAssets ?? 0} />
        <StatCard icon="📖" label="Guidelines" value={s.totalGuidelines ?? 0} />
        <StatCard icon="🔢" label="Total Usage" value={s.totalUsage ?? 0} />
        <StatCard icon="📂" label="Asset Types" value={Object.keys(s.byType ?? {}).length} />
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        {(["assets","guidelines","new"] as const).map(t => (
          <button key={t} style={{ ...C.btn, background: tab === t ? "#6366f1" : "#1e293b", fontSize: "13px", padding: "8px 16px" }} onClick={() => setTab(t)}>
            {t === "new" ? "+ Add Asset" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "assets" && (
        <div style={C.section}>
          <div style={C.sectionTitle}>Brand Asset Library</div>
          {!(s.assets?.length) ? <div style={C.empty}>No assets in vault yet.</div> : (
            <table style={C.table}>
              <thead><tr><th style={C.th}>Asset</th><th style={C.th}>Type</th><th style={C.th}>Version</th><th style={C.th}>License</th><th style={C.th}>Usage</th><th style={C.th}>Approved By</th></tr></thead>
              <tbody>{s.assets.map((a: any) => (
                <tr key={a.id}>
                  <td style={C.td}><div style={{ fontWeight: 600, color: "#f8fafc" }}>{a.name}</div><div style={{ fontSize: "11px", color: "#64748b" }}>{a.description}</div></td>
                  <td style={C.td}><span style={C.badge("#6366f1")}>{a.type}</span></td>
                  <td style={C.td}>v{a.version}</td>
                  <td style={C.td}><span style={C.badge(licenseColors[a.license] ?? "#64748b")}>{a.license}</span></td>
                  <td style={C.td}>{a.usageCount}x</td>
                  <td style={C.td}>{a.approvedBy}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === "guidelines" && (
        <div style={C.section}>
          <div style={C.sectionTitle}>Brand Guidelines</div>
          <div style={{ marginBottom: "16px" }}>
            <div style={C.row3}>
              <div style={C.fld}><div style={C.lbl}>Section</div><input style={C.inp} value={guidelineForm.section} onChange={e => setGuidelineForm(f => ({ ...f, section: e.target.value }))} placeholder="Color, Typography..." /></div>
              <div style={C.fld}><div style={C.lbl}>Priority</div><select style={C.inp} value={guidelineForm.priority} onChange={e => setGuidelineForm(f => ({ ...f, priority: e.target.value }))}><option value="must">Must</option><option value="should">Should</option><option value="may">May</option></select></div>
              <div style={C.fld}><div style={C.lbl}>Example</div><input style={C.inp} value={guidelineForm.example} onChange={e => setGuidelineForm(f => ({ ...f, example: e.target.value }))} placeholder="Usage example" /></div>
            </div>
            <div style={C.fld}><div style={C.lbl}>Rule *</div><input style={C.inp} value={guidelineForm.rule} onChange={e => setGuidelineForm(f => ({ ...f, rule: e.target.value }))} placeholder="The brand rule" /></div>
            <button style={C.btn} onClick={submitGuideline} disabled={!guidelineForm.rule}>Add Guideline</button>
          </div>
          {!(s.guidelines?.length) ? <div style={C.empty}>No guidelines yet.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {s.guidelines.map((g: any) => (
                <div key={g.id} style={{ ...C.card, borderLeft: `3px solid ${priorityColors[g.priority] ?? "#6366f1"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc" }}>{g.rule}</div>
                    <div style={{ display: "flex", gap: "8px" }}><span style={C.badge("#6366f1")}>{g.section}</span><span style={C.badge(priorityColors[g.priority] ?? "#64748b")}>{g.priority}</span></div>
                  </div>
                  {g.example && <div style={{ fontSize: "12px", color: "#64748b" }}>Example: {g.example}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "new" && (
        <div style={C.section}>
          <div style={C.sectionTitle}>Add Brand Asset</div>
          <div style={C.row}><div style={C.fld}><div style={C.lbl}>Asset Name *</div><input style={C.inp} value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} placeholder="Asset name" /></div><div style={C.fld}><div style={C.lbl}>Type</div><select style={C.inp} value={assetForm.type} onChange={e => setAssetForm(f => ({ ...f, type: e.target.value }))}><option value="logo">Logo</option><option value="icon">Icon</option><option value="banner">Banner</option><option value="template">Template</option><option value="font">Font</option><option value="color-palette">Color Palette</option><option value="guideline">Guideline</option><option value="photography">Photography</option></select></div></div>
          <div style={C.fld}><div style={C.lbl}>Description</div><input style={C.inp} value={assetForm.description} onChange={e => setAssetForm(f => ({ ...f, description: e.target.value }))} placeholder="Asset description" /></div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>File URL</div><input style={C.inp} value={assetForm.fileUrl} onChange={e => setAssetForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="/assets/..." /></div>
            <div style={C.fld}><div style={C.lbl}>License</div><select style={C.inp} value={assetForm.license} onChange={e => setAssetForm(f => ({ ...f, license: e.target.value }))}><option value="internal-only">Internal Only</option><option value="partner">Partner</option><option value="commercial">Commercial</option><option value="open">Open</option></select></div>
            <div style={C.fld}><div style={C.lbl}>Version</div><input style={C.inp} value={assetForm.version} onChange={e => setAssetForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0" /></div>
          </div>
          <button style={C.btn} onClick={submitAsset} disabled={!assetForm.name}>Add to Vault</button>
        </div>
      )}
    </div>
  );
}

// ─── 9. Revenue Intelligence App ─────────────────────────────────────────────

export function RevenueIntelApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/revenue-intel`, 15000);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", channel: "all", newCustomers: "", churned: "", mrr: "", ltv: "", cac: "", arpu: "", churnRate: "", netRevRetention: "100" });

  const submit = async () => {
    await fetch(`${API}/api/revenue-intel/snapshot`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, k === "channel" || k === "date" ? v : Number(v) || 0]))) });
    reload(); setShowForm(false);
  };

  if (loading) return <div style={C.page}><Loading /></div>;
  const s = data ?? {};
  const latest = s.latest;

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>📈</span>
        <div><div style={C.title}>Revenue Intelligence</div><div style={C.sub}>Cohort analysis, LTV, churn — replaces ChartMogul, Baremetrics</div></div>
      </div>

      <div style={C.grid}>
        <StatCard icon="💰" label="Latest MRR" value={s.latestMRR ? `$${s.latestMRR.toLocaleString()}` : "$0"} />
        <StatCard icon="📅" label="Latest ARR" value={s.latestARR ? `$${s.latestARR.toLocaleString()}` : "$0"} />
        <StatCard icon="♻️" label="Net Rev Retention" value={`${s.latestNRR ?? 0}%`} sub="NRR" />
        <StatCard icon="📉" label="Churn Rate" value={`${s.latestChurnRate ?? 0}%`} />
        <StatCard icon="💎" label="LTV" value={s.latestLTV ? `$${s.latestLTV.toLocaleString()}` : "$0"} />
        <StatCard icon="📊" label="Snapshots" value={s.totalSnapshots ?? 0} />
      </div>

      {latest && (
        <div style={C.section}>
          <div style={C.sectionTitle}>Latest Snapshot — {latest.date || new Date(latest.createdAt).toLocaleDateString()}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {[["New Customers", latest.newCustomers], ["Churned", latest.churned], ["ARPU", `$${latest.arpu}`], ["CAC", `$${latest.cac}`]].map(([label, val]) => (
              <div key={label as string} style={C.card}><div style={C.cardLabel}>{label as string}</div><div style={C.cardVal}>{val}</div></div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <button style={C.btn} onClick={() => setShowForm(v => !v)}>{showForm ? "Cancel" : "+ Add Revenue Snapshot"}</button>
      </div>

      {showForm && (
        <div style={{ ...C.section, marginBottom: "20px" }}>
          <div style={C.sectionTitle}>Add Revenue Snapshot</div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>Date</div><input style={C.inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div style={C.fld}><div style={C.lbl}>MRR ($)</div><input style={C.inp} type="number" value={form.mrr} onChange={e => setForm(f => ({ ...f, mrr: e.target.value }))} placeholder="0" /></div>
            <div style={C.fld}><div style={C.lbl}>New Customers</div><input style={C.inp} type="number" value={form.newCustomers} onChange={e => setForm(f => ({ ...f, newCustomers: e.target.value }))} placeholder="0" /></div>
          </div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>Churned</div><input style={C.inp} type="number" value={form.churned} onChange={e => setForm(f => ({ ...f, churned: e.target.value }))} placeholder="0" /></div>
            <div style={C.fld}><div style={C.lbl}>LTV ($)</div><input style={C.inp} type="number" value={form.ltv} onChange={e => setForm(f => ({ ...f, ltv: e.target.value }))} placeholder="0" /></div>
            <div style={C.fld}><div style={C.lbl}>CAC ($)</div><input style={C.inp} type="number" value={form.cac} onChange={e => setForm(f => ({ ...f, cac: e.target.value }))} placeholder="0" /></div>
          </div>
          <div style={C.row3}>
            <div style={C.fld}><div style={C.lbl}>ARPU ($)</div><input style={C.inp} type="number" value={form.arpu} onChange={e => setForm(f => ({ ...f, arpu: e.target.value }))} placeholder="0" /></div>
            <div style={C.fld}><div style={C.lbl}>Churn Rate (%)</div><input style={C.inp} type="number" step="0.1" value={form.churnRate} onChange={e => setForm(f => ({ ...f, churnRate: e.target.value }))} placeholder="0" /></div>
            <div style={C.fld}><div style={C.lbl}>NRR (%)</div><input style={C.inp} type="number" value={form.netRevRetention} onChange={e => setForm(f => ({ ...f, netRevRetention: e.target.value }))} placeholder="100" /></div>
          </div>
          <button style={C.btn} onClick={submit}>Save Snapshot</button>
        </div>
      )}

      <div style={C.section}>
        <div style={C.sectionTitle}>Cohort Analysis</div>
        {!(s.cohorts?.length) ? <div style={C.empty}>No cohorts recorded yet. Add revenue snapshots to begin analysis.</div> : (
          <table style={C.table}>
            <thead><tr><th style={C.th}>Cohort</th><th style={C.th}>Size</th><th style={C.th}>30d Retention</th><th style={C.th}>60d Retention</th><th style={C.th}>90d Retention</th><th style={C.th}>90d Revenue</th></tr></thead>
            <tbody>{s.cohorts.map((c: any) => (
              <tr key={c.id}>
                <td style={C.td}>{c.cohortMonth}</td>
                <td style={C.td}>{c.size}</td>
                <td style={C.td}>{c.size ? `${Math.round((c.retainedAt30 / c.size) * 100)}%` : "—"}</td>
                <td style={C.td}>{c.size ? `${Math.round((c.retainedAt60 / c.size) * 100)}%` : "—"}</td>
                <td style={C.td}>{c.size ? `${Math.round((c.retainedAt90 / c.size) * 100)}%` : "—"}</td>
                <td style={C.td}>${(c.revenueAt90 || 0).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── 10. AI Strategy Engine App ───────────────────────────────────────────────

export function AIStrategyApp() {
  const { data, loading, reload } = useFetch<any>(`${API}/api/ai-strategy`, 30000);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [form, setForm] = useState({ topic: "", context: "", industry: "General Business", mode: "analyze" });

  const generate = async () => {
    if (!form.topic) return;
    setGenerating(true); setResult(null);
    try {
      const r = await fetch(`${API}/api/ai-strategy/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      setResult(d.output ?? d.error ?? "No output");
      reload();
    } catch {
      setResult("Strategy generation failed. Please try again.");
    }
    setGenerating(false);
  };

  if (loading) return <div style={C.page}><Loading /></div>;
  const s = data ?? {};

  const modeDescriptions: Record<string, string> = {
    analyze: "Deep SWOT analysis of your current position",
    plan:    "Concrete 90-day action plan with milestones",
    compete: "Competitive landscape mapping + differentiation",
    grow:    "Top 5 highest-leverage growth levers",
    pivot:   "Pivot evaluation + strategic direction recommendation",
  };

  return (
    <div style={C.page}>
      <div style={C.hdr}>
        <span style={C.icon}>🧠</span>
        <div><div style={C.title}>AI Strategy Engine</div><div style={C.sub}>GPT-4o strategic intelligence — your on-demand McKinsey advisor</div></div>
      </div>

      <div style={C.grid}>
        <StatCard icon="🧠" label="Strategies Generated" value={s.totalRequests ?? 0} />
        <StatCard icon="🔢" label="Total Tokens Used" value={(s.totalTokens ?? 0).toLocaleString()} />
        <StatCard icon="🌐" label="Industries Covered" value={s.byIndustry ?? 0} />
      </div>

      <div style={C.section}>
        <div style={C.sectionTitle}>Generate Strategic Intelligence</div>

        <div style={C.fld}>
          <div style={C.lbl}>Strategic Topic *</div>
          <input style={C.inp} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Expand CreateAI Brain to serve the healthcare market" />
        </div>

        <div style={C.row}>
          <div style={C.fld}>
            <div style={C.lbl}>Industry / Market</div>
            <input style={C.inp} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="Healthcare, Legal, SaaS, E-commerce..." />
          </div>
          <div style={C.fld}>
            <div style={C.lbl}>Analysis Mode</div>
            <select style={C.inp} value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}>
              <option value="analyze">Analyze — SWOT + situation assessment</option>
              <option value="plan">Plan — 90-day action roadmap</option>
              <option value="compete">Compete — competitive mapping</option>
              <option value="grow">Grow — growth lever identification</option>
              <option value="pivot">Pivot — direction evaluation</option>
            </select>
          </div>
        </div>

        <div style={C.fld}>
          <div style={C.lbl}>Additional Context (optional)</div>
          <textarea style={{ ...C.inp, height: "80px", resize: "vertical" as const }} value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="Current MRR, team size, constraints, target market, competitive situation..." />
        </div>

        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px", color: "#94a3b8" }}>
          <strong style={{ color: "#6366f1" }}>Mode:</strong> {modeDescriptions[form.mode]}
        </div>

        <button style={{ ...C.btn, padding: "12px 28px", fontSize: "15px", opacity: generating ? 0.7 : 1 }} onClick={generate} disabled={!form.topic || generating}>
          {generating ? "⚡ Generating Strategy..." : "⚡ Generate Strategy"}
        </button>
      </div>

      {result && (
        <div style={{ ...C.section, borderColor: "#6366f1" }}>
          <div style={{ ...C.sectionTitle, color: "#6366f1" }}>Strategic Intelligence Output</div>
          <div style={{ fontSize: "14px", lineHeight: "1.8", color: "#e2e8f0", whiteSpace: "pre-wrap", maxHeight: "600px", overflowY: "auto", padding: "8px" }}>
            {result}
          </div>
        </div>
      )}

      {s.recent?.length > 0 && (
        <div style={C.section}>
          <div style={C.sectionTitle}>Recent Strategy Requests</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {s.recent.map((r: any) => (
              <div key={r.id} style={{ ...C.card, cursor: "pointer" }} onClick={() => setResult(r.output)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#f8fafc" }}>{r.topic}</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={C.badge("#6366f1")}>{r.mode}</span>
                    <span style={C.badge("#64748b")}>{r.industry}</span>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {new Date(r.createdAt).toLocaleDateString()} · {r.tokensUsed.toLocaleString()} tokens · Click to view output
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
