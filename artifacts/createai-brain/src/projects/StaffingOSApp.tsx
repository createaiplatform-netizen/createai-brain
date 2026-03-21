import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Briefcase, Award, TrendingUp,
  Calendar, Star, UserCheck, Plus, Search, X,
  ChevronRight, Loader2, RefreshCw, Phone, Mail,
  MapPin, Clock, DollarSign, Filter,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type View = "dashboard" | "candidates" | "clients" | "requisitions" | "interviews" | "placements";

interface Candidate {
  id: string; firstName: string; lastName: string; email?: string; phone?: string;
  title?: string; location?: string; skills?: string; status: string;
  experience?: number; availability?: string; source?: string; createdAt: string;
}
interface Client {
  id: string; name: string; email?: string; phone?: string; industry?: string;
  status: string; openReqs?: number; createdAt: string;
}
interface Requisition {
  id: string; title: string; clientName: string; location?: string; type?: string;
  status: string; salary?: string; openedAt: string; candidates?: number;
}
interface Interview {
  id: string; candidateName: string; clientName: string; role?: string;
  scheduledAt: string; type: string; status: string;
}
interface Placement {
  id: string; candidateName: string; clientName: string; role: string;
  startDate?: string; salary?: number; feeAmount?: number; status: string;
}
interface DashStats {
  totalCandidates: number; openRequisitions: number; activePlacements: number; placementRevenue: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch("/api" + path, { credentials: "include", ...opts });

function fmt(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function Badge({ s }: { s: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700", inactive: "bg-slate-100 text-slate-500",
    placed: "bg-amber-100 text-amber-700", open: "bg-blue-100 text-blue-700",
    closed: "bg-slate-100 text-slate-500", scheduled: "bg-indigo-100 text-indigo-700",
    completed: "bg-teal-100 text-teal-700", cancelled: "bg-red-100 text-red-700",
    hired: "bg-emerald-100 text-emerald-700", do_not_use: "bg-red-100 text-red-700",
  };
  const label = s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold " + (map[s] ?? "bg-slate-100 text-slate-600")}>{label}</span>;
}
function Empty({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4"><Icon className="w-7 h-7 text-violet-400" /></div>
      <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs">{desc}</p>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────
const NAV: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { id: "candidates",   label: "Candidates",   icon: Users },
  { id: "clients",      label: "Clients",      icon: Briefcase },
  { id: "requisitions", label: "Requisitions", icon: Star },
  { id: "interviews",   label: "Interviews",   icon: Calendar },
  { id: "placements",   label: "Placements",   icon: Award },
];

// ── Dashboard ──────────────────────────────────────────────────────────────────
function DashboardView({ stats, candidates, interviews }: { stats: DashStats; candidates: Candidate[]; interviews: Interview[] }) {
  const statCards = [
    { label: "Total Candidates",    value: stats.totalCandidates,           icon: Users,     c: "text-blue-600",   bg: "bg-blue-100"   },
    { label: "Open Requisitions",   value: stats.openRequisitions,          icon: Briefcase, c: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Active Placements",   value: stats.activePlacements,          icon: Award,     c: "text-emerald-600",bg: "bg-emerald-100" },
    { label: "Placement Revenue",   value: fmtMoney(stats.placementRevenue),icon: TrendingUp,c: "text-amber-600",  bg: "bg-amber-100"  },
  ];
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-slate-900">Dashboard</h1><p className="text-slate-500 mt-1">Here's your staffing pipeline today.</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={"w-12 h-12 rounded-xl " + s.bg + " flex items-center justify-center shrink-0"}><s.icon className={"w-6 h-6 " + s.c} /></div>
            <div>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-violet-500" /> Recent Candidates</h2>
          </div>
          {candidates.length === 0 ? <Empty icon={Users} title="No candidates" desc="Add candidates to start building your pipeline." /> :
            <ul className="divide-y divide-slate-50">
              {candidates.slice(0, 6).map(c => (
                <li key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs shrink-0">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{c.title || "—"}{c.location ? " · " + c.location : ""}</p>
                  </div>
                  <Badge s={c.status} />
                </li>
              ))}
            </ul>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-500" /> Upcoming Interviews</h2>
          </div>
          {interviews.length === 0 ? <Empty icon={Calendar} title="No interviews" desc="Schedule interviews to fill open positions." /> :
            <ul className="divide-y divide-slate-50">
              {interviews.slice(0, 6).map(i => (
                <li key={i.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{i.candidateName}</p>
                    <p className="text-xs text-slate-500">{i.clientName} · {i.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{fmt(i.scheduledAt)}</span>
                    <Badge s={i.status} />
                  </div>
                </li>
              ))}
            </ul>}
        </div>
      </div>
    </div>
  );
}

// ── Candidates View ────────────────────────────────────────────────────────────
function CandidatesView({ candidates, onAdd }: { candidates: Candidate[]; onAdd: (c: Partial<Candidate>) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const filtered = candidates.filter(c => {
    const q = (c.firstName + " " + c.lastName + " " + (c.email ?? "") + " " + (c.title ?? "")).toLowerCase().includes(search.toLowerCase());
    const s = statusFilter === "all" || c.status === statusFilter;
    return q && s;
  });
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onAdd({
      id: crypto.randomUUID(), firstName: fd.get("firstName") as string,
      lastName: fd.get("lastName") as string, email: fd.get("email") as string,
      phone: fd.get("phone") as string, title: fd.get("title") as string,
      location: fd.get("location") as string, skills: fd.get("skills") as string,
      status: "active", source: "Direct", createdAt: new Date().toISOString(),
    });
    setShowForm(false);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Candidates</h1><p className="text-sm text-slate-500">{filtered.length} in pool</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Add Candidate
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-200 outline-none" />
        </div>
        <div className="flex gap-2">
          {["all", "active", "placed", "inactive"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (statusFilter === s ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? <Empty icon={Users} title="No candidates found" desc="Add a candidate or adjust your search." /> :
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Candidate", "Role / Location", "Contact", "Experience", "Status", "Added"].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{c.firstName} {c.lastName}</div>
                        <div className="text-xs text-slate-400">#{c.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><div className="text-slate-700">{c.title || "—"}</div><div className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location || "—"}</div></td>
                  <td className="px-4 py-3.5"><div className="text-slate-700 text-xs">{c.email || "—"}</div><div className="text-xs text-slate-400">{c.phone || "—"}</div></td>
                  <td className="px-4 py-3.5 text-slate-600">{c.experience != null ? c.experience + " yrs" : "—"}</td>
                  <td className="px-4 py-3.5"><Badge s={c.status} /></td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{fmt(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900 text-lg">Add Candidate</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(["firstName", "lastName"] as const).map(f => (
                    <div key={f}><label className="text-xs font-medium text-slate-600 mb-1 block capitalize">{f.replace(/([A-Z])/g, " $1")}</label>
                      <input required name={f} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                  ))}
                </div>
                {[
                  { n: "email", l: "Email", t: "email" }, { n: "phone", l: "Phone", t: "tel" },
                  { n: "title", l: "Job Title", t: "text" }, { n: "location", l: "Location", t: "text" },
                  { n: "skills", l: "Key Skills (comma-separated)", t: "text" },
                ].map(({ n, l, t }) => (
                  <div key={n}><label className="text-xs font-medium text-slate-600 mb-1 block">{l}</label>
                    <input name={n} type={t} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                ))}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700">Add Candidate</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Clients View ───────────────────────────────────────────────────────────────
function ClientsView({ clients, onAdd }: { clients: Client[]; onAdd: (c: Partial<Client>) => void }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const filtered = clients.filter(c => (c.name + (c.industry ?? "") + (c.email ?? "")).toLowerCase().includes(search.toLowerCase()));
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onAdd({ id: crypto.randomUUID(), name: fd.get("name") as string, email: fd.get("email") as string, phone: fd.get("phone") as string, industry: fd.get("industry") as string, status: "active", createdAt: new Date().toISOString() });
    setShowForm(false);
  };
  const industries = ["Technology","Healthcare","Finance","Manufacturing","Retail","Legal","Education","Government","Nonprofit","Other"];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Clients</h1><p className="text-sm text-slate-500">{filtered.length} clients</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length === 0 ? <div className="col-span-3"><Empty icon={Briefcase} title="No clients" desc="Add a client to get started." /></div> :
          filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold">{c.name[0]}</div>
                  <div><h3 className="font-bold text-slate-900">{c.name}</h3>{c.industry && <p className="text-xs text-slate-500">{c.industry}</p>}</div>
                </div>
                <Badge s={c.status} />
              </div>
              <div className="space-y-1.5 mt-3">
                {c.email && <div className="flex items-center gap-2 text-xs text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" />{c.email}</div>}
                {c.phone && <div className="flex items-center gap-2 text-xs text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{c.phone}</div>}
                <div className="flex items-center gap-2 text-xs text-slate-600"><Star className="w-3.5 h-3.5 text-slate-400" />{c.openReqs ?? 0} open reqs</div>
              </div>
            </motion.div>
          ))}
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900 text-lg">Add Client</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Company Name</label>
                  <input required name="name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Industry</label>
                  <select name="industry" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none">
                    {industries.map(i => <option key={i} value={i}>{i}</option>)}
                  </select></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                  <input name="email" type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label>
                  <input name="phone" type="tel" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700">Add Client</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Requisitions View ──────────────────────────────────────────────────────────
function RequisitionsView({ reqs, clients, onAdd }: { reqs: Requisition[]; clients: Client[]; onAdd: (r: Partial<Requisition>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? reqs : reqs.filter(r => r.status === filter);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onAdd({ id: crypto.randomUUID(), title: fd.get("title") as string, clientName: fd.get("client") as string, location: fd.get("location") as string, type: fd.get("type") as string, status: "open", openedAt: new Date().toISOString() });
    setShowForm(false);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Requisitions</h1><p className="text-sm text-slate-500">{filtered.length} positions</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> New Requisition
        </button>
      </div>
      <div className="flex gap-2">
        {["all", "open", "closed"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (filter === s ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length === 0 ? <div className="col-span-3"><Empty icon={Star} title="No requisitions" desc="Create a job requisition to start sourcing candidates." /></div> :
          filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-base">{r.title}</h3>
                <Badge s={r.status} />
              </div>
              <p className="text-sm font-medium text-violet-600 mb-3">{r.clientName}</p>
              <div className="space-y-1.5">
                {r.location && <div className="flex items-center gap-2 text-xs text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400" />{r.location}</div>}
                {r.type && <div className="flex items-center gap-2 text-xs text-slate-600"><Briefcase className="w-3.5 h-3.5 text-slate-400" />{r.type}</div>}
                {r.salary && <div className="flex items-center gap-2 text-xs text-slate-600"><DollarSign className="w-3.5 h-3.5 text-slate-400" />{r.salary}</div>}
                <div className="flex items-center gap-2 text-xs text-slate-600"><Clock className="w-3.5 h-3.5 text-slate-400" />Opened {fmt(r.openedAt)}</div>
              </div>
            </motion.div>
          ))}
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900 text-lg">New Requisition</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Job Title</label>
                  <input required name="title" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Client</label>
                  {clients.length > 0
                    ? <select name="client" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none">
                      {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    : <input name="client" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" placeholder="Client name" />}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Location</label>
                    <input name="location" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Type</label>
                    <select name="type" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none">
                      {["Full-time","Part-time","Contract","Temporary","Internship"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Interviews View ────────────────────────────────────────────────────────────
function InterviewsView({ interviews, candidates, clients, onAdd }: {
  interviews: Interview[]; candidates: Candidate[]; clients: Client[]; onAdd: (i: Partial<Interview>) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? interviews : interviews.filter(i => i.status === filter);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onAdd({ id: crypto.randomUUID(), candidateName: fd.get("candidate") as string, clientName: fd.get("client") as string, type: fd.get("type") as string, scheduledAt: fd.get("date") as string, status: "scheduled" });
    setShowForm(false);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Interviews</h1><p className="text-sm text-slate-500">{filtered.length} interviews</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Schedule
        </button>
      </div>
      <div className="flex gap-2">
        {["all", "scheduled", "completed", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (filter === s ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? <Empty icon={Calendar} title="No interviews" desc="Schedule an interview to get started." /> :
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Candidate", "Client", "Type", "Date", "Status"].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(i => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-medium text-slate-900">{i.candidateName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{i.clientName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{i.type}</td>
                  <td className="px-4 py-3.5 text-slate-500">{fmt(i.scheduledAt)}</td>
                  <td className="px-4 py-3.5"><Badge s={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900 text-lg">Schedule Interview</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                {[
                  { n: "candidate", l: "Candidate Name", t: "text" },
                  { n: "client",    l: "Client / Company", t: "text" },
                  { n: "date",      l: "Date & Time", t: "datetime-local" },
                ].map(({ n, l, t }) => (
                  <div key={n}><label className="text-xs font-medium text-slate-600 mb-1 block">{l}</label>
                    <input required name={n} type={t} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                ))}
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Interview Type</label>
                  <select name="type" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none">
                    {["Phone Screen","Video Call","On-site","Technical","Panel","Final Round"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700">Schedule</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Placements View ────────────────────────────────────────────────────────────
function PlacementsView({ placements, onAdd }: { placements: Placement[]; onAdd: (p: Partial<Placement>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const totalFees = placements.reduce((s, p) => s + (p.feeAmount ?? 0), 0);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onAdd({ id: crypto.randomUUID(), candidateName: fd.get("candidate") as string, clientName: fd.get("client") as string, role: fd.get("role") as string, salary: parseFloat(fd.get("salary") as string || "0"), feeAmount: parseFloat(fd.get("fee") as string || "0"), status: "active", startDate: fd.get("start") as string });
    setShowForm(false);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Placements</h1><p className="text-sm text-slate-500">{placements.length} placed</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Record Placement
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Placements", value: placements.length,    c: "text-slate-900"   },
          { label: "Active Placements", value: placements.filter(p => p.status === "active").length, c: "text-emerald-600" },
          { label: "Total Fees",        value: fmtMoney(totalFees),  c: "text-violet-600"  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
            <p className={"text-2xl font-bold " + s.c}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {placements.length === 0 ? <Empty icon={Award} title="No placements yet" desc="Record a successful placement when a candidate gets hired." /> :
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Candidate", "Client", "Role", "Start Date", "Salary", "Fee", "Status"].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {placements.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-medium text-slate-900">{p.candidateName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{p.clientName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{p.role}</td>
                  <td className="px-4 py-3.5 text-slate-500">{fmt(p.startDate)}</td>
                  <td className="px-4 py-3.5 text-slate-900">{p.salary ? fmtMoney(p.salary) : "—"}</td>
                  <td className="px-4 py-3.5 font-semibold text-violet-600">{p.feeAmount ? fmtMoney(p.feeAmount) : "—"}</td>
                  <td className="px-4 py-3.5"><Badge s={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900 text-lg">Record Placement</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                {[
                  { n: "candidate", l: "Candidate Name" }, { n: "client", l: "Client / Employer" },
                  { n: "role", l: "Job Role / Title" },
                ].map(({ n, l }) => (
                  <div key={n}><label className="text-xs font-medium text-slate-600 mb-1 block">{l}</label>
                    <input required name={n} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Annual Salary ($)</label>
                    <input name="salary" type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Placement Fee ($)</label>
                    <input name="fee" type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                </div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Start Date</label>
                  <input name="start" type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-200 outline-none" /></div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700">Record</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export function StaffingOSApp() {
  const [view, setView] = useState<View>("dashboard");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, trackerRes, bookingsRes] = await Promise.allSettled([
        apiFetch("/ops/leads"),
        apiFetch("/ops/tracker"),
        apiFetch("/ops/bookings"),
      ]);
      if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
        const d = await leadsRes.value.json() as { leads?: { id: string; name: string; email?: string; phone?: string; status: string; source?: string; createdAt: string; notes?: string }[] };
        const leads = d.leads ?? [];
        const half = Math.ceil(leads.length / 2);
        setCandidates(leads.slice(0, half).map(l => ({
          id: l.id, firstName: l.name.split(" ")[0] || l.name,
          lastName: l.name.split(" ").slice(1).join(" ") || "—",
          email: l.email, phone: l.phone, status: l.status,
          source: l.source, createdAt: l.createdAt,
        })));
        setClients(leads.slice(half).map(l => ({
          id: l.id, name: l.name, email: l.email, phone: l.phone,
          status: "active", createdAt: l.createdAt,
        })));
      }
      if (trackerRes.status === "fulfilled" && trackerRes.value.ok) {
        const d = await trackerRes.value.json() as { items?: { id: string; name: string; category?: string; status: string; clientName?: string; createdAt: string; notes?: string }[] };
        const items = d.items ?? [];
        setRequisitions(items.filter(i => ["requisition","job","position","role"].includes((i.category ?? "requisition").toLowerCase())).map(i => ({
          id: i.id, title: i.name, clientName: i.clientName || "Client", status: i.status, openedAt: i.createdAt,
        })));
        setPlacements(items.filter(i => ["placement","hire","hired"].includes((i.category ?? "").toLowerCase())).map(i => ({
          id: i.id, candidateName: i.name, clientName: i.clientName || "Client",
          role: i.category || "Placement", status: i.status,
        })));
      }
      if (bookingsRes.status === "fulfilled" && bookingsRes.value.ok) {
        const d = await bookingsRes.value.json() as { bookings?: { id: string; customerName: string; staffName?: string; serviceName: string; scheduledAt: string; status: string }[] };
        setInterviews((d.bookings ?? []).map(b => ({
          id: b.id, candidateName: b.customerName,
          clientName: b.staffName || "Client", type: b.serviceName,
          scheduledAt: b.scheduledAt, status: b.status,
        })));
      }
    } catch (err) { console.warn("[StaffingOS] Data load error:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const stats: DashStats = {
    totalCandidates: candidates.length,
    openRequisitions: requisitions.filter(r => r.status === "open").length,
    activePlacements: placements.filter(p => p.status === "active").length,
    placementRevenue: placements.reduce((s, p) => s + (p.feeAmount ?? 0), 0),
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-2xl">
          <div className="p-5 flex items-center gap-2.5 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Staffing<span className="text-violet-400">OS</span></span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setView(n.id)}
                className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (view === n.id ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
                <n.icon className="w-4 h-4 shrink-0" />{n.label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-slate-800">
            <button onClick={loadData} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh Data
            </button>
          </div>
        </aside>
      )}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-13 bg-white border-b border-slate-200 flex items-center gap-3 px-5 shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-slate-800 text-sm">{NAV.find(n => n.id === view)?.label}</h2>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {loading
            ? <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>
            : <>
              {view === "dashboard" && <DashboardView stats={stats} candidates={candidates} interviews={interviews} />}
              {view === "candidates" && <CandidatesView candidates={candidates} onAdd={c => setCandidates(v => [c as Candidate, ...v])} />}
              {view === "clients" && <ClientsView clients={clients} onAdd={c => setClients(v => [c as Client, ...v])} />}
              {view === "requisitions" && <RequisitionsView reqs={requisitions} clients={clients} onAdd={r => setRequisitions(v => [r as Requisition, ...v])} />}
              {view === "interviews" && <InterviewsView interviews={interviews} candidates={candidates} clients={clients} onAdd={i => setInterviews(v => [i as Interview, ...v])} />}
              {view === "placements" && <PlacementsView placements={placements} onAdd={p => setPlacements(v => [p as Placement, ...v])} />}
            </>}
        </div>
      </main>
    </div>
  );
}
