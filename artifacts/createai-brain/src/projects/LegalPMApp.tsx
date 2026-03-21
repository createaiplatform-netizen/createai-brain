import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Briefcase, Users, Clock, FileText,
  CheckSquare, Scale, Plus, Search, X, ChevronRight,
  AlertCircle, ArrowRight, Loader2, RefreshCw,
  DollarSign, Calendar, CheckCircle2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type View = "dashboard" | "matters" | "clients" | "time" | "billing" | "tasks";

interface Matter {
  id: string; title: string; clientName: string; type: string;
  status: string; openedAt: string; billedAmount?: number; unbilledHours?: number;
}
interface Client {
  id: string; name: string; email?: string; phone?: string;
  company?: string; status: string; openMatters?: number; createdAt: string;
}
interface TimeEntry {
  id: string; description: string; matterName?: string; clientName?: string;
  hours: number; ratePerHour: number; status: string; date: string; billable: boolean;
}
interface Invoice {
  id: string; clientName: string; matterName?: string;
  amount: number; status: string; issuedAt: string; dueDate?: string;
}
interface Task {
  id: string; title: string; matterName?: string; priority: string;
  status: string; dueDate?: string; assignee?: string;
}
interface DashboardStats {
  openMatters: number; totalClients: number; unbilledAmount: number; overdueInvoices: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const API = "/api";
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(API + path, { credentials: "include", ...opts });

function fmt(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function Badge({ s }: { s: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700", open: "bg-blue-100 text-blue-700",
    closed: "bg-slate-100 text-slate-600", pending: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700", overdue: "bg-red-100 text-red-700",
    completed: "bg-teal-100 text-teal-700", high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700", low: "bg-slate-100 text-slate-500",
    billable: "bg-indigo-100 text-indigo-700",
  };
  return <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold " + (map[s] ?? "bg-slate-100 text-slate-600")}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
}

function Empty({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4"><Icon className="w-7 h-7 text-indigo-400" /></div>
      <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs">{desc}</p>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────
const NAV: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard",       icon: LayoutDashboard },
  { id: "matters",   label: "Matters",         icon: Briefcase },
  { id: "clients",   label: "Clients",         icon: Users },
  { id: "time",      label: "Time & Expenses", icon: Clock },
  { id: "billing",   label: "Billing",         icon: FileText },
  { id: "tasks",     label: "Tasks",           icon: CheckSquare },
];

// ── Dashboard ──────────────────────────────────────────────────────────────────
function DashboardView({ stats, matters, tasks }: { stats: DashboardStats; matters: Matter[]; tasks: Task[] }) {
  const statCards = [
    { label: "Open Matters",     value: stats.openMatters,             icon: Briefcase,    c: "text-blue-600",   bg: "bg-blue-100"   },
    { label: "Total Clients",    value: stats.totalClients,            icon: Users,        c: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Unbilled Amount",  value: fmtMoney(stats.unbilledAmount), icon: Clock,       c: "text-amber-600",  bg: "bg-amber-100"  },
    { label: "Overdue Invoices", value: stats.overdueInvoices,         icon: AlertCircle,  c: "text-red-600",    bg: "bg-red-100"    },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Georgia, serif" }}>Good morning, Counselor</h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your practice today.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">{s.label}</span>
              <div className={"p-2 rounded-xl " + s.bg}><s.icon className={"w-4 h-4 " + s.c} /></div>
            </div>
            <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Georgia, serif" }}>{s.value}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Recent Matters</h2>
            <span className="text-xs text-indigo-600 font-medium">{matters.length} total</span>
          </div>
          {matters.length === 0 ? <Empty icon={Briefcase} title="No matters" desc="Create your first matter." /> :
            <ul className="divide-y divide-slate-50">
              {matters.slice(0, 6).map(m => (
                <li key={m.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{m.title}</p>
                    <p className="text-xs text-slate-500">{m.clientName} · {m.type}</p>
                  </div>
                  <Badge s={m.status} />
                </li>
              ))}
            </ul>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Upcoming Tasks</h2>
            <span className="text-xs text-indigo-600 font-medium">{tasks.filter(t => t.status !== "completed").length} pending</span>
          </div>
          {tasks.length === 0 ? <Empty icon={CheckSquare} title="No tasks" desc="All caught up!" /> :
            <ul className="divide-y divide-slate-50">
              {tasks.filter(t => t.status !== "completed").slice(0, 6).map(t => (
                <li key={t.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.matterName ? t.matterName + " · " : ""}{fmt(t.dueDate)}</p>
                  </div>
                  <Badge s={t.priority} />
                </li>
              ))}
            </ul>}
        </div>
      </div>
    </div>
  );
}

// ── Matters View ───────────────────────────────────────────────────────────────
const MATTER_TYPES = ["Litigation", "Corporate", "Real Estate", "Family Law", "Criminal", "Employment", "IP", "Estate Planning", "Immigration", "Bankruptcy"];

function MattersView({ matters, clients, onAdd }: { matters: Matter[]; clients: Client[]; onAdd: (m: Partial<Matter>) => void }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", clientName: "", type: "Litigation", status: "open" });
  const filtered = matters.filter(m => (m.title + m.clientName + m.type).toLowerCase().includes(search.toLowerCase()));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, id: crypto.randomUUID(), openedAt: new Date().toISOString() });
    setShowForm(false);
    setForm({ title: "", clientName: "", type: "Litigation", status: "open" });
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Matters</h1><p className="text-sm text-slate-500">Active cases and advisory work</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> New Matter
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search matters…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? <Empty icon={Briefcase} title="No matters found" desc="Create a new matter to get started." /> :
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Matter", "Client", "Type", "Status", "Opened", ""].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{m.title}</td>
                  <td className="px-4 py-3.5 text-slate-600">{m.clientName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{m.type}</td>
                  <td className="px-4 py-3.5"><Badge s={m.status} /></td>
                  <td className="px-4 py-3.5 text-slate-500">{fmt(m.openedAt)}</td>
                  <td className="px-4 py-3.5 text-right"><ChevronRight className="w-4 h-4 text-slate-300 ml-auto" /></td>
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
                <h2 className="font-bold text-slate-900 text-lg">Create New Matter</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Matter Title</label>
                  <input required value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))}
                    placeholder="e.g. Smith v. Jones or Series A Financing"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Client</label>
                  {clients.length > 0
                    ? <select value={form.clientName} onChange={e => setForm(v => ({ ...v, clientName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none">
                      <option value="">Select client…</option>
                      {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    : <input required value={form.clientName} onChange={e => setForm(v => ({ ...v, clientName: e.target.value }))}
                      placeholder="Client name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />}
                </div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Matter Type</label>
                  <select value={form.type} onChange={e => setForm(v => ({ ...v, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none">
                    {MATTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Create Matter</button>
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
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const filtered = clients.filter(c => (c.name + (c.email ?? "") + (c.company ?? "")).toLowerCase().includes(search.toLowerCase()));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, id: crypto.randomUUID(), status: "active", createdAt: new Date().toISOString() });
    setShowForm(false);
    setForm({ name: "", email: "", phone: "", company: "" });
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Clients</h1><p className="text-sm text-slate-500">{filtered.length} clients</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? <Empty icon={Users} title="No clients" desc="Add a client to get started." /> :
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Client", "Company", "Contact", "Status", "Since", "Matters"].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">{c.name[0]}</div>
                      <span className="font-semibold text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{c.company || "—"}</td>
                  <td className="px-4 py-3.5"><div className="text-slate-700">{c.email || "—"}</div><div className="text-xs text-slate-400">{c.phone || "—"}</div></td>
                  <td className="px-4 py-3.5"><Badge s={c.status} /></td>
                  <td className="px-4 py-3.5 text-slate-500">{fmt(c.createdAt)}</td>
                  <td className="px-4 py-3.5 text-slate-600 font-semibold">{c.openMatters ?? 0}</td>
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
                <h2 className="font-bold text-slate-900 text-lg">Add Client</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                {[
                  { f: "name" as const, l: "Full Name / Business Name", req: true },
                  { f: "company" as const, l: "Company (optional)", req: false },
                  { f: "email" as const, l: "Email", req: false },
                  { f: "phone" as const, l: "Phone", req: false },
                ].map(({ f, l, req }) => (
                  <div key={f}><label className="text-xs font-medium text-slate-600 mb-1 block">{l}</label>
                    <input required={req} value={form[f]} onChange={e => setForm(v => ({ ...v, [f]: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                ))}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Add Client</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Time Tracking View ─────────────────────────────────────────────────────────
function TimeView({ entries, onAdd }: { entries: TimeEntry[]; onAdd: (e: Partial<TimeEntry>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const totalBillable = entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const totalUnbilled = entries.filter(e => e.billable && e.status !== "invoiced" && e.status !== "paid").reduce((s, e) => s + e.hours * e.ratePerHour, 0);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onAdd({
      id: crypto.randomUUID(), description: fd.get("description") as string,
      clientName: fd.get("client") as string, hours: parseFloat(fd.get("hours") as string || "0"),
      ratePerHour: parseFloat(fd.get("rate") as string || "0"),
      status: "unbilled", date: new Date().toISOString(), billable: true,
    });
    setShowForm(false);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Time & Expenses</h1><p className="text-sm text-slate-500">{entries.length} entries</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Log Time
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Billable Hours", value: totalBillable.toFixed(1) + "h" },
          { label: "Unbilled Amount",       value: fmtMoney(totalUnbilled) },
          { label: "Total Entries",         value: entries.length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {entries.length === 0 ? <Empty icon={Clock} title="No time entries" desc="Log your first time entry." /> :
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Description", "Client", "Hours", "Rate", "Amount", "Status", "Date"].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-medium text-slate-900 max-w-xs truncate">{e.description}</td>
                  <td className="px-4 py-3.5 text-slate-600">{e.clientName || "—"}</td>
                  <td className="px-4 py-3.5 text-slate-900 font-semibold">{e.hours}h</td>
                  <td className="px-4 py-3.5 text-slate-600">{fmtMoney(e.ratePerHour)}/h</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{fmtMoney(e.hours * e.ratePerHour)}</td>
                  <td className="px-4 py-3.5"><Badge s={e.status} /></td>
                  <td className="px-4 py-3.5 text-slate-500">{fmt(e.date)}</td>
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
                <h2 className="font-bold text-slate-900 text-lg">Log Time Entry</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                  <input required name="description" placeholder="What did you work on?"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Client Name</label>
                  <input name="client" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Hours</label>
                    <input required name="hours" type="number" step="0.25" min="0.25"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Hourly Rate ($)</label>
                    <input name="rate" type="number" step="5" defaultValue="350"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Log Entry</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Billing View ───────────────────────────────────────────────────────────────
function BillingView({ invoices }: { invoices: Invoice[] }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? invoices : invoices.filter(i => i.status === filter);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-slate-900">Billing</h1><p className="text-sm text-slate-500">Invoices and payment tracking</p></div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Collected",   value: fmtMoney(totalPaid),    c: "text-emerald-600" },
          { label: "Pending",     value: fmtMoney(totalPending), c: "text-amber-600"   },
          { label: "Total Items", value: invoices.length,        c: "text-slate-900"   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
            <p className={"text-2xl font-bold " + s.c}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {["all", "paid", "pending", "overdue"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (filter === s ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? <Empty icon={FileText} title="No invoices" desc="No invoices match this filter." /> :
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Client", "Matter", "Amount", "Status", "Issued", "Due"].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(i => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-medium text-slate-900">{i.clientName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{i.matterName || "—"}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{fmtMoney(i.amount)}</td>
                  <td className="px-4 py-3.5"><Badge s={i.status} /></td>
                  <td className="px-4 py-3.5 text-slate-500">{fmt(i.issuedAt)}</td>
                  <td className="px-4 py-3.5 text-slate-500">{fmt(i.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
    </div>
  );
}

// ── Tasks View ─────────────────────────────────────────────────────────────────
function TasksView({ tasks, matters, onAdd, onToggle }: {
  tasks: Task[]; matters: Matter[];
  onAdd: (t: Partial<Task>) => void; onToggle: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const filtered = filter === "all" ? tasks : filter === "completed"
    ? tasks.filter(t => t.status === "completed") : tasks.filter(t => t.status !== "completed");
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onAdd({ id: crypto.randomUUID(), title: fd.get("title") as string, priority: fd.get("priority") as string, status: "pending", dueDate: fd.get("due") as string, matterName: fd.get("matter") as string });
    setShowForm(false);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">{tasks.filter(t => t.status !== "completed").length} pending</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>
      <div className="flex gap-2">
        {(["all", "pending", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (filter === f ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? <Empty icon={CheckCircle2} title="No tasks here" desc="All caught up!" /> :
          filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all">
              <button onClick={() => onToggle(t.id)}
                className={"w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors " + (t.status === "completed" ? "bg-indigo-600 border-indigo-600" : "border-slate-300 hover:border-indigo-400")}>
                {t.status === "completed" && <CheckCircle2 className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={"font-medium text-slate-900 " + (t.status === "completed" ? "line-through text-slate-400" : "")}>{t.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.matterName ? t.matterName + " · " : ""}Due {fmt(t.dueDate)}</p>
              </div>
              <Badge s={t.priority} />
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
                <h2 className="font-bold text-slate-900 text-lg">Add Task</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Task Title</label>
                  <input required name="title" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Priority</label>
                    <select name="priority" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none">
                      {["high", "medium", "low"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select></div>
                  <div><label className="text-xs font-medium text-slate-600 mb-1 block">Due Date</label>
                    <input name="due" type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Add Task</button>
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
export function LegalPMApp() {
  const [view, setView] = useState<View>("dashboard");
  const [matters, setMatters] = useState<Matter[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [trackerRes, leadsRes, timeRes] = await Promise.allSettled([
        apiFetch("/ops/tracker"),
        apiFetch("/ops/leads"),
        apiFetch("/ops/time"),
      ]);
      if (trackerRes.status === "fulfilled" && trackerRes.value.ok) {
        const d = await trackerRes.value.json() as { items?: { id: string; name: string; category?: string; status: string; aiDescription?: string; clientName?: string; createdAt: string; notes?: string }[] };
        const items = d.items ?? [];
        const caseItems = items.filter(i => ["case", "matter", "legal"].includes((i.category ?? "matter").toLowerCase()));
        setMatters(caseItems.map(i => ({
          id: i.id, title: i.name, clientName: i.clientName || "Unknown",
          type: i.category || "Matter", status: i.status, openedAt: i.createdAt,
        })));
        setTasks(items.filter(i => ["task", "todo", "action"].includes((i.category ?? "task").toLowerCase())).map(i => ({
          id: i.id, title: i.name, priority: "medium", status: i.status, dueDate: undefined,
        })));
      }
      if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
        const d = await leadsRes.value.json() as { leads?: { id: string; name: string; email?: string; phone?: string; status: string; createdAt: string }[] };
        setClients((d.leads ?? []).map(l => ({
          id: l.id, name: l.name, email: l.email, phone: l.phone,
          status: l.status, createdAt: l.createdAt,
        })));
      }
      if (timeRes.status === "fulfilled" && timeRes.value.ok) {
        const d = await timeRes.value.json() as { entries?: { id: string; description: string; clientName?: string; hours: number; ratePerHour: number; status: string; createdAt: string; dueDate?: string }[] };
        const entries = d.entries ?? [];
        setTimeEntries(entries.map(e => ({
          id: e.id, description: e.description, clientName: e.clientName,
          hours: e.hours, ratePerHour: e.ratePerHour, status: e.status,
          date: e.createdAt, billable: true,
        })));
        setInvoices(entries.filter(e => e.status === "invoiced" || e.status === "paid").map(e => ({
          id: e.id, clientName: e.clientName || "Client",
          amount: e.hours * e.ratePerHour,
          status: e.status === "paid" ? "paid" : "pending",
          issuedAt: e.createdAt, dueDate: e.dueDate,
        })));
      }
    } catch (err) { console.warn("[LegalPM] Data load error:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const stats: DashboardStats = {
    openMatters: matters.filter(m => m.status === "open" || m.status === "active").length,
    totalClients: clients.length,
    unbilledAmount: timeEntries.filter(e => e.billable && e.status !== "invoiced" && e.status !== "paid").reduce((s, e) => s + e.hours * e.ratePerHour, 0),
    overdueInvoices: invoices.filter(i => i.status === "overdue").length,
  };

  const toggleTask = (id: string) => {
    setTasks(v => v.map(t => t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t));
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-2xl">
          <div className="p-5 flex items-center gap-2.5 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>Lex<span className="text-indigo-400">OS</span></span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setView(n.id)}
                className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (view === n.id ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
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
            ? <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
            : <>
              {view === "dashboard" && <DashboardView stats={stats} matters={matters} tasks={tasks} />}
              {view === "matters" && <MattersView matters={matters} clients={clients} onAdd={m => setMatters(v => [m as Matter, ...v])} />}
              {view === "clients" && <ClientsView clients={clients} onAdd={c => setClients(v => [c as Client, ...v])} />}
              {view === "time" && <TimeView entries={timeEntries} onAdd={e => setTimeEntries(v => [e as TimeEntry, ...v])} />}
              {view === "billing" && <BillingView invoices={invoices} />}
              {view === "tasks" && <TasksView tasks={tasks} matters={matters} onAdd={t => setTasks(v => [t as Task, ...v])} onToggle={toggleTask} />}
            </>}
        </div>
      </main>
    </div>
  );
}
