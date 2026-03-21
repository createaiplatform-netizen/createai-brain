import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, Stethoscope,
  Building2, Receipt, Plus, Search, Loader2,
  Activity, Clock, ArrowRight, X, ChevronRight,
  Phone, Mail, Heart, FileText, RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type View = "dashboard" | "patients" | "appointments" | "doctors" | "departments" | "billing";

interface Patient {
  id: string; firstName: string; lastName: string; email?: string;
  phone?: string; gender?: string; dateOfBirth?: string;
  status: string; primaryDoctorName?: string; createdAt: string;
}
interface Appointment {
  id: string; patientName: string; doctorName: string;
  scheduledAt: string; type: string; status: string; durationMinutes?: number;
}
interface Doctor {
  id: string; name: string; specialty: string; email?: string;
  phone?: string; status: string; patientCount?: number; department?: string;
}
interface Department {
  id: string; name: string; head?: string; beds?: number;
  doctorCount?: number; status: string;
}
interface BillingRecord {
  id: string; patientName: string; service: string; amount: number;
  status: string; dueDate?: string; issuedAt: string;
}
interface DashboardStats {
  totalPatients: number; todayAppointments: number;
  activeDoctors: number; pendingBillAmount: number;
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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n / 100);
}

function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-teal-100 text-teal-700",
    cancelled: "bg-red-100 text-red-700",
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    overdue: "bg-red-100 text-red-700",
  };
  return (
    <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold " + (map[s] ?? "bg-slate-100 text-slate-600")}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-teal-400" />
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs">{desc}</p>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────
const NAV: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { id: "patients",     label: "Patients",     icon: Users },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "doctors",      label: "Doctors",      icon: Stethoscope },
  { id: "departments",  label: "Departments",  icon: Building2 },
  { id: "billing",      label: "Billing",      icon: Receipt },
];

// ── Dashboard View ─────────────────────────────────────────────────────────────
function DashboardView({ stats, appointments, patients }: {
  stats: DashboardStats; appointments: Appointment[]; patients: Patient[];
}) {
  const statCards = [
    { label: "Total Patients",       value: stats.totalPatients,                      icon: Users,     color: "teal"   },
    { label: "Appointments Today",   value: stats.todayAppointments,                  icon: Calendar,  color: "blue"   },
    { label: "Active Doctors",       value: stats.activeDoctors,                      icon: Activity,  color: "indigo" },
    { label: "Pending Billing",      value: fmtMoney(stats.pendingBillAmount),        icon: Receipt,   color: "amber"  },
  ];
  const colorMap: Record<string, string> = {
    teal: "bg-teal-50 text-teal-600", blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600", amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good morning, Dr. Jenkins</h1>
        <p className="text-slate-500 mt-1">Here is what's happening at HealthOS today.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">{s.label}</span>
              <div className={"p-2 rounded-xl " + colorMap[s.color]}><s.icon className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4 text-teal-600" /> Today's Appointments</h2>
          </div>
          {appointments.length === 0
            ? <EmptyState icon={Calendar} title="No appointments" desc="No appointments scheduled today." />
            : <ul className="divide-y divide-slate-50">
              {appointments.slice(0, 6).map(a => (
                <li key={a.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{a.patientName}</p>
                    <p className="text-xs text-slate-500">with Dr. {a.doctorName} · {a.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">{fmt(a.scheduledAt)}</span>
                    <StatusPill s={a.status} />
                  </div>
                </li>
              ))}
            </ul>}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-teal-600" /> Recent Patients</h2>
          </div>
          {patients.length === 0
            ? <EmptyState icon={Users} title="No patients" desc="No patients registered yet." />
            : <ul className="divide-y divide-slate-50">
              {patients.slice(0, 6).map(p => (
                <li key={p.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-slate-500">Added {fmt(p.createdAt)}</p>
                    </div>
                  </div>
                  <StatusPill s={p.status} />
                </li>
              ))}
            </ul>}
        </div>
      </div>
    </div>
  );
}

// ── Patients View ──────────────────────────────────────────────────────────────
function PatientsView({ patients, onAdd }: { patients: Patient[]; onAdd: (p: Partial<Patient>) => void }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", gender: "other", status: "active" });

  const filtered = patients.filter(p =>
    (p.firstName + " " + p.lastName + " " + (p.email ?? "")).toLowerCase().includes(search.toLowerCase())
  );
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    setShowForm(false);
    setForm({ firstName: "", lastName: "", email: "", phone: "", gender: "other", status: "active" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500">{filtered.length} records</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0
          ? <EmptyState icon={Users} title="No patients found" desc="Add a patient or adjust your search." />
          : <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Patient", "Contact", "DOB / Gender", "Doctor", "Status", ""].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{p.firstName} {p.lastName}</div>
                        <div className="text-xs text-slate-400">#{p.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><div className="text-slate-700">{p.phone || "—"}</div><div className="text-xs text-slate-400">{p.email || "—"}</div></td>
                  <td className="px-4 py-4"><div className="text-slate-700">{fmt(p.dateOfBirth)}</div><div className="text-xs text-slate-400 capitalize">{p.gender || "—"}</div></td>
                  <td className="px-4 py-4 text-slate-600">{p.primaryDoctorName ? "Dr. " + p.primaryDoctorName : "—"}</td>
                  <td className="px-4 py-4"><StatusPill s={p.status} /></td>
                  <td className="px-4 py-4 text-right"><ChevronRight className="w-4 h-4 text-slate-300 ml-auto" /></td>
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
                <h2 className="font-bold text-slate-900 text-lg">Register New Patient</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(["firstName", "lastName"] as const).map(f => (
                    <div key={f}>
                      <label className="text-xs font-medium text-slate-600 mb-1 block capitalize">{f.replace(/([A-Z])/g, " $1")}</label>
                      <input required value={form[f]} onChange={e => setForm(v => ({ ...v, [f]: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    </div>
                  ))}
                </div>
                {(["email", "phone"] as const).map(f => (
                  <div key={f}>
                    <label className="text-xs font-medium text-slate-600 mb-1 block capitalize">{f}</label>
                    <input type={f === "email" ? "email" : "tel"} value={form[f]} onChange={e => setForm(v => ({ ...v, [f]: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Gender</label>
                    <select value={form.gender} onChange={e => setForm(v => ({ ...v, gender: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none">
                      {["male", "female", "other"].map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                    <select value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none">
                      {["active", "inactive", "discharged"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit"
                    className="px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700">Register Patient</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Appointments View ──────────────────────────────────────────────────────────
function AppointmentsView({ appointments, patients, doctors, onAdd }: {
  appointments: Appointment[]; patients: Patient[]; doctors: Doctor[];
  onAdd: (a: Partial<Appointment>) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? appointments : appointments.filter(a => a.status === filter);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onAdd({
      id: crypto.randomUUID(), patientName: fd.get("patient") as string,
      doctorName: fd.get("doctor") as string, type: fd.get("type") as string,
      scheduledAt: fd.get("date") as string, status: "scheduled", durationMinutes: 30,
    });
    setShowForm(false);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Appointments</h1><p className="text-sm text-slate-500">{filtered.length} appointments</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Schedule
        </button>
      </div>
      <div className="flex gap-2">
        {["all", "scheduled", "completed", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (filter === s ? "bg-teal-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0
          ? <EmptyState icon={Calendar} title="No appointments" desc="Schedule an appointment to get started." />
          : <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Patient", "Doctor", "Type", "Date", "Duration", "Status"].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-medium text-slate-900">{a.patientName}</td>
                  <td className="px-4 py-3.5 text-slate-600">Dr. {a.doctorName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{a.type}</td>
                  <td className="px-4 py-3.5 text-slate-600">{fmt(a.scheduledAt)}</td>
                  <td className="px-4 py-3.5 text-slate-600">{a.durationMinutes || 30} min</td>
                  <td className="px-4 py-3.5"><StatusPill s={a.status} /></td>
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
                <h2 className="font-bold text-slate-900 text-lg">Schedule Appointment</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                {[
                  { n: "patient", l: "Patient Name", t: "text" },
                  { n: "doctor", l: "Doctor Name", t: "text" },
                  { n: "type", l: "Visit Type", t: "text" },
                  { n: "date", l: "Date & Time", t: "datetime-local" },
                ].map(f => (
                  <div key={f.n}>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">{f.l}</label>
                    <input required name={f.n} type={f.t}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700">Schedule</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Doctors View ───────────────────────────────────────────────────────────────
function DoctorsView({ doctors, onAdd }: { doctors: Doctor[]; onAdd: (d: Partial<Doctor>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const specialties = ["Cardiology","Neurology","Pediatrics","Orthopedics","General Practice","Oncology","Radiology","Emergency Medicine"];
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onAdd({ id: crypto.randomUUID(), name: fd.get("name") as string, specialty: fd.get("specialty") as string, email: fd.get("email") as string, status: "active" });
    setShowForm(false);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Doctors</h1><p className="text-sm text-slate-500">{doctors.length} physicians</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>
      {doctors.length === 0
        ? <EmptyState icon={Stethoscope} title="No doctors" desc="Add doctors to the system to get started." />
        : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {doctors.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-base border-2 border-white shadow-sm">
                    {d.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Dr. {d.name}</h3>
                    <p className="text-sm text-teal-600 font-medium">{d.specialty}</p>
                  </div>
                </div>
                <StatusPill s={d.status} />
              </div>
              <div className="p-5 space-y-2.5">
                {d.email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-4 h-4 text-slate-400" />{d.email}</div>}
                {d.phone && <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-4 h-4 text-slate-400" />{d.phone}</div>}
                {d.department && <div className="flex items-center gap-2 text-sm text-slate-600"><Building2 className="w-4 h-4 text-slate-400" />{d.department}</div>}
              </div>
            </motion.div>
          ))}
        </div>}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900 text-lg">Add Doctor</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Full Name</label>
                  <input required name="name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" /></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Specialty</label>
                  <select required name="specialty" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none">
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div><label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                  <input name="email" type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" /></div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700">Add Doctor</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Departments View ───────────────────────────────────────────────────────────
const DEFAULT_DEPTS: Department[] = [
  { id: "1", name: "Emergency Medicine",  head: "Dr. Sarah Collins",   beds: 40, doctorCount: 8,  status: "active" },
  { id: "2", name: "Cardiology",          head: "Dr. Michael Hayes",   beds: 30, doctorCount: 6,  status: "active" },
  { id: "3", name: "Neurology",           head: "Dr. Emily Rhodes",    beds: 25, doctorCount: 5,  status: "active" },
  { id: "4", name: "Pediatrics",          head: "Dr. James Park",      beds: 35, doctorCount: 7,  status: "active" },
  { id: "5", name: "Orthopedics",         head: "Dr. Linda Foster",    beds: 20, doctorCount: 4,  status: "active" },
  { id: "6", name: "Oncology",            head: "Dr. Robert Singh",    beds: 45, doctorCount: 9,  status: "active" },
];
function DepartmentsView() {
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-slate-900">Departments</h1><p className="text-sm text-slate-500">{DEFAULT_DEPTS.length} departments</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {DEFAULT_DEPTS.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-slate-900">{d.name}</h3>
              <StatusPill s={d.status} />
            </div>
            <p className="text-sm text-slate-500 mb-4">Head: {d.head}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-teal-600">{d.beds}</div>
                <div className="text-xs text-slate-500 mt-0.5">Beds</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-indigo-600">{d.doctorCount}</div>
                <div className="text-xs text-slate-500 mt-0.5">Doctors</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Billing View ───────────────────────────────────────────────────────────────
function BillingView({ billing }: { billing: BillingRecord[] }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? billing : billing.filter(b => b.status === filter);
  const totalPending = billing.filter(b => b.status === "pending").reduce((s, b) => s + b.amount, 0);
  const totalOverdue = billing.filter(b => b.status === "overdue").reduce((s, b) => s + b.amount, 0);
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-slate-900">Billing</h1><p className="text-sm text-slate-500">Patient invoices and payments</p></div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Records", value: billing.length, color: "text-slate-900" },
          { label: "Pending Amount", value: fmtMoney(totalPending), color: "text-amber-600" },
          { label: "Overdue Amount", value: fmtMoney(totalOverdue), color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
            <p className={"text-2xl font-bold " + s.color}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {["all", "paid", "pending", "overdue"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (filter === s ? "bg-teal-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0
          ? <EmptyState icon={Receipt} title="No billing records" desc="No records match the selected filter." />
          : <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Patient", "Service", "Amount", "Status", "Issued", "Due"].map(h =>
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-medium text-slate-900">{b.patientName}</td>
                  <td className="px-4 py-3.5 text-slate-600">{b.service}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{fmtMoney(b.amount)}</td>
                  <td className="px-4 py-3.5"><StatusPill s={b.status} /></td>
                  <td className="px-4 py-3.5 text-slate-500">{fmt(b.issuedAt)}</td>
                  <td className="px-4 py-3.5 text-slate-500">{fmt(b.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export function HealthOSApp() {
  const [view, setView] = useState<View>("dashboard");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, bookingsRes, timeRes] = await Promise.allSettled([
        apiFetch("/ops/leads"),
        apiFetch("/ops/bookings"),
        apiFetch("/ops/time"),
      ]);
      if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
        const d = await leadsRes.value.json() as { leads?: { id: string; name: string; email?: string; phone?: string; status: string; score?: number; source?: string; createdAt: string }[] };
        const leads = d.leads ?? [];
        setPatients(leads.map(l => ({
          id: l.id, firstName: l.name.split(" ")[0] || l.name,
          lastName: l.name.split(" ").slice(1).join(" ") || "—",
          email: l.email, phone: l.phone, status: l.status, createdAt: l.createdAt,
        })));
      }
      if (bookingsRes.status === "fulfilled" && bookingsRes.value.ok) {
        const d = await bookingsRes.value.json() as { bookings?: { id: string; customerName: string; serviceName: string; staffName?: string; scheduledAt: string; status: string; durationMinutes?: number }[] };
        setAppointments((d.bookings ?? []).map(b => ({
          id: b.id, patientName: b.customerName,
          doctorName: b.staffName || "Unassigned",
          type: b.serviceName, scheduledAt: b.scheduledAt,
          status: b.status, durationMinutes: b.durationMinutes,
        })));
      }
      if (timeRes.status === "fulfilled" && timeRes.value.ok) {
        const d = await timeRes.value.json() as { entries?: { id: string; description: string; clientName?: string; hours: number; ratePerHour: number; status: string; createdAt: string; dueDate?: string }[] };
        setBilling((d.entries ?? []).map(e => ({
          id: e.id, patientName: e.clientName || "Patient",
          service: e.description, amount: Math.round(e.hours * e.ratePerHour * 100),
          status: e.status === "invoiced" ? "pending" : e.status === "paid" ? "paid" : "pending",
          issuedAt: e.createdAt, dueDate: e.dueDate,
        })));
      }
    } catch (err) {
      console.warn("[HealthOS] Data load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const stats: DashboardStats = {
    totalPatients: patients.length,
    todayAppointments: appointments.filter(a => {
      const d = new Date(a.scheduledAt); const t = new Date();
      return d.toDateString() === t.toDateString();
    }).length,
    activeDoctors: doctors.filter(d => d.status === "active").length,
    pendingBillAmount: billing.filter(b => b.status === "pending").reduce((s, b) => s + b.amount, 0),
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col shrink-0 shadow-2xl">
          <div className="p-5 flex items-center gap-2.5 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Health<span className="text-teal-400">OS</span></span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setView(n.id)}
                className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + (view === n.id ? "bg-teal-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
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
      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-13 bg-white border-b border-slate-200 flex items-center gap-3 px-5 shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-slate-800 text-sm">{NAV.find(n => n.id === view)?.label}</h2>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            </div>
          ) : (
            <>
              {view === "dashboard" && <DashboardView stats={stats} appointments={appointments} patients={patients} />}
              {view === "patients" && <PatientsView patients={patients} onAdd={p => setPatients(v => [p as Patient, ...v])} />}
              {view === "appointments" && <AppointmentsView appointments={appointments} patients={patients} doctors={doctors} onAdd={a => setAppointments(v => [a as Appointment, ...v])} />}
              {view === "doctors" && <DoctorsView doctors={doctors} onAdd={d => setDoctors(v => [d as Doctor, ...v])} />}
              {view === "departments" && <DepartmentsView />}
              {view === "billing" && <BillingView billing={billing} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
