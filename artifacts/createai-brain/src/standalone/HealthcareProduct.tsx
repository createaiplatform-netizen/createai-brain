import React, { useState, useRef, useEffect } from "react";
import { StandaloneLayout, StandaloneMode } from "./StandaloneLayout";
import { streamEngine } from "@/controller";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const PATIENTS = [
  { id: "P-001", name: "Alex M.",   age: 47, gender: "M", room: "101-A", condition: "Hypertension (mock)",      status: "Stable",    bp: "138/88", hr: 78,  o2: 97, temp: "98.4°F", rr: 16, admitted: "Mar 14" },
  { id: "P-002", name: "Sarah K.",  age: 62, gender: "F", room: "103-B", condition: "Type 2 Diabetes (mock)",   status: "Monitoring",bp: "122/74", hr: 84,  o2: 95, temp: "99.1°F", rr: 18, admitted: "Mar 13" },
  { id: "P-003", name: "James T.",  age: 35, gender: "M", room: "105-A", condition: "Respiratory (mock)",       status: "Recovering",bp: "115/70", hr: 96,  o2: 93, temp: "100.2°F",rr: 22, admitted: "Mar 15" },
  { id: "P-004", name: "Linda R.",  age: 71, gender: "F", room: "108-C", condition: "Cardiac Monitoring (mock)",status: "Critical",  bp: "155/95", hr: 102, o2: 91, temp: "98.9°F", rr: 24, admitted: "Mar 16" },
  { id: "P-005", name: "Carlos D.", age: 28, gender: "M", room: "110-A", condition: "Post-Surgery (mock)",      status: "Stable",    bp: "118/72", hr: 68,  o2: 99, temp: "98.1°F", rr: 14, admitted: "Mar 15" },
];

const ORDERS = [
  { id: "O-001", patient: "Alex M.",   type: "Lab",      label: "Comprehensive Metabolic Panel", status: "Pending",  priority: "Routine" },
  { id: "O-002", patient: "Alex M.",   type: "Med",      label: "Lisinopril 10mg daily",          status: "Active",   priority: "Routine" },
  { id: "O-003", patient: "Sarah K.",  type: "Lab",      label: "HbA1c + Fasting Glucose",        status: "Complete", priority: "Routine" },
  { id: "O-004", patient: "James T.", type: "Imaging",  label: "Chest X-Ray AP",                  status: "Pending",  priority: "STAT" },
  { id: "O-005", patient: "James T.", type: "Med",      label: "Albuterol Nebulizer Q4H",         status: "Active",   priority: "Routine" },
  { id: "O-006", patient: "Linda R.",  type: "Lab",      label: "Troponin I + BNP Panel",         status: "Pending",  priority: "STAT" },
  { id: "O-007", patient: "Linda R.",  type: "Med",      label: "Nitroglycerin 0.4mg SL PRN",     status: "Active",   priority: "STAT" },
  { id: "O-008", patient: "Carlos D.", type: "Med",      label: "Morphine 2mg IV Q4H PRN",        status: "Active",   priority: "Routine" },
];

const DOCUMENTS = [
  { id: "d1", name: "Patient Intake Form",             type: "Form",      icon: "📝", pages: 2, desc: "Standard intake form for new patient registration. Captures demographics, insurance, and chief complaint." },
  { id: "d2", name: "Admission Workflow Overview",     type: "Procedure", icon: "📋", pages: 4, desc: "Step-by-step admission protocol from triage to room assignment. Mock structural content only." },
  { id: "d3", name: "Discharge Summary Template",      type: "Template",  icon: "📄", pages: 3, desc: "Structured discharge summary including diagnosis summary, medications, and follow-up instructions. All mock." },
  { id: "d4", name: "Medication Safety Checklist",     type: "Checklist", icon: "✅", pages: 2, desc: "Pre-administration medication safety verification checklist. Five rights. Mock structural only." },
  { id: "d5", name: "Patient Education Brochure",      type: "Brochure",  icon: "🗂️", pages: 4, desc: "Patient-facing education brochure covering general wellness and platform navigation. Non-clinical." },
  { id: "d6", name: "Staff Onboarding Guide",          type: "Guide",     icon: "📖", pages: 6, desc: "New staff orientation guide covering platform features, access levels, and workflow basics." },
  { id: "d7", name: "Privacy & Data Notice (Mock)",    type: "Policy",    icon: "🔒", pages: 3, desc: "Conceptual privacy notice describing data handling practices in DEMO mode. Not a real legal document." },
  { id: "d8", name: "Emergency Protocol Reference",    type: "Reference", icon: "🚨", pages: 2, desc: "Quick-reference emergency protocol card. All steps are mock and not for real clinical use." },
];

const WORKFLOWS = [
  {
    id: "admission", name: "Patient Admission", icon: "🏥", desc: "Full admission workflow from arrival to room assignment.",
    steps: [
      { title: "Patient Arrival & Registration",   desc: "Patient checks in at front desk. ID and insurance verified (mock). Paperwork initiated.",              action: "Register Patient" },
      { title: "Triage Assessment",                desc: "Nurse conducts initial triage. Vital signs recorded. Chief complaint documented. Severity assessed.",  action: "Complete Triage" },
      { title: "Physician Review",                 desc: "Attending physician reviews triage notes and vital signs. Initial orders placed (mock).",               action: "Physician Review" },
      { title: "Room Assignment",                  desc: "Patient assigned to appropriate room based on severity and availability.",                              action: "Assign Room" },
      { title: "Orders & Medications",             desc: "Medication orders entered. Lab and imaging orders placed if needed. Nursing staff alerted.",            action: "Enter Orders" },
      { title: "Admission Complete",               desc: "Patient admitted and care plan initiated. Family notified (mock). System records updated.",             action: "Confirm Admission" },
    ],
  },
  {
    id: "discharge", name: "Patient Discharge", icon: "🚪", desc: "Safe discharge workflow with documentation and follow-up.",
    steps: [
      { title: "Physician Discharge Order",        desc: "Attending physician signs discharge order. Final vitals reviewed. Condition assessed as stable.",       action: "Sign Discharge Order" },
      { title: "Discharge Summary",                desc: "Discharge summary drafted with diagnosis, treatment course, and medications. Patient reviewed.",        action: "Draft Summary" },
      { title: "Patient Education",                desc: "Care team reviews discharge instructions with patient. Questions answered. Brochure provided.",         action: "Educate Patient" },
      { title: "Prescription Reconciliation",      desc: "Medications reconciled. Prescriptions issued (mock). Pharmacy notified if needed.",                    action: "Reconcile Meds" },
      { title: "Discharge & Follow-Up",            desc: "Patient discharged. Follow-up appointment scheduled. Summary sent to primary care (mock).",            action: "Complete Discharge" },
    ],
  },
  {
    id: "medication", name: "Medication Review", icon: "💊", desc: "Safe medication administration and reconciliation flow.",
    steps: [
      { title: "Order Verification",               desc: "Pharmacist or nurse verifies medication order against patient record. Allergies checked.",              action: "Verify Order" },
      { title: "Five Rights Check",                desc: "Right patient, right drug, right dose, right route, right time — all confirmed (mock).",               action: "Confirm Five Rights" },
      { title: "Administration",                   desc: "Medication administered. Patient response monitored. Time and dose logged in system (mock).",           action: "Log Administration" },
      { title: "Documentation Complete",           desc: "Administration record updated. Next dose scheduled. Any adverse events documented (mock).",             action: "Complete Documentation" },
    ],
  },
  {
    id: "emergency", name: "Emergency Protocol", icon: "🚨", desc: "Rapid response and emergency escalation flow.",
    steps: [
      { title: "Alert Triggered",                  desc: "Emergency alert activated by staff or system detection. Code announced on floor.",                      action: "Activate Alert" },
      { title: "Rapid Response Team",              desc: "RRT summoned to bedside. Code cart positioned. Crash cart checked.",                                   action: "Summon Team" },
      { title: "Initial Assessment",               desc: "Airway, Breathing, Circulation assessed. GCS scored. Vital signs recorded.",                           action: "Assess Patient" },
      { title: "Interventions",                    desc: "Emergency interventions initiated per protocol (mock). IV access established. Monitoring attached.",    action: "Begin Interventions" },
      { title: "Physician Notification",           desc: "Attending and specialist notified. Orders received and implemented (mock).",                            action: "Notify Physician" },
      { title: "Stabilization",                    desc: "Patient condition stabilized. Continuous monitoring maintained. Family notified.",                      action: "Stabilize Patient" },
      { title: "Transfer Decision",                desc: "Team decides on ICU transfer, continued floor care, or other disposition (mock).",                     action: "Disposition Plan" },
      { title: "Documentation & Debrief",          desc: "Full event documented. Team debrief completed. Lessons captured (mock).",                              action: "Complete Documentation" },
    ],
  },
];

const MARKETING_PAGES = {
  landing: {
    hero: "ApexCare Nexus — The Future of Healthcare Operations",
    sub: "A fully simulated healthcare management platform — demonstrating what structured, AI-assisted care coordination could look like.",
    features: [
      "Complete patient management workflow simulation",
      "AI-assisted clinical documentation (structural only)",
      "Multi-mode operation: Demo, Test, and future Live",
      "Multilingual support: English, Tamil, Tamil–English",
      "Full document generation and export capability",
      "Integrated team communication (mock)",
    ],
  },
  features: [
    { icon: "🏥", title: "Patient Management", desc: "Manage mock patient records, vitals, orders, and clinical notes in one unified workspace." },
    { icon: "🤖", title: "AI Clinical Assistant", desc: "AI assistant provides structured explanations and workflow guidance. Clearly labeled as AI — not clinical advice." },
    { icon: "📋", title: "Workflow Engine", desc: "Step-by-step clinical workflows for admission, discharge, medication review, and emergency response." },
    { icon: "📄", title: "Document Suite", desc: "Generate and download forms, summaries, brochures, policies, and checklists instantly." },
    { icon: "🌐", title: "Multilingual Ready", desc: "Platform content available in English, Tamil, and Tamil–English for diverse teams." },
    { icon: "🔒", title: "Safe & Legal", desc: "All content is mock and non-clinical. No real patient data. Built for demonstration only." },
  ],
  pricing: [
    { name: "Demo Access",   price: "Free",     note: "For presentations and exploration", features: ["Full demo mode", "All mock data", "AI assistant", "Document downloads"] },
    { name: "Organization",  price: "$299/mo",  note: "Per location (mock)",               features: ["Unlimited users", "Custom branding", "Test mode", "Priority support", "Custom workflows"] },
    { name: "Enterprise",    price: "Custom",   note: "For health systems (mock)",          features: ["White-label", "Real integration ready", "Legal compliance support", "Dedicated team"] },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, string> = {
    Stable: "bg-green-100 text-green-700",
    Monitoring: "bg-blue-100 text-blue-700",
    Recovering: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
    Pending: "bg-orange-100 text-orange-700",
    Active: "bg-green-100 text-green-700",
    Complete: "bg-blue-100 text-blue-700",
    STAT: "bg-red-100 text-red-600",
    Routine: "bg-muted text-muted-foreground",
  };
  return map[status] ?? "bg-muted text-muted-foreground";
}

function downloadDoc(doc: typeof DOCUMENTS[0]) {
  const content = `${doc.name.toUpperCase()}
${"=".repeat(doc.name.length)}

Type: ${doc.type}
Pages: ${doc.pages}
Status: MOCK — Non-operational, structural only

DESCRIPTION:
${doc.desc}

—————————————————————————————————
SECTION 1 — PURPOSE & SCOPE
—————————————————————————————————
This document outlines the structural framework for ${doc.name}. All content
is mock and non-operational. It is intended as a scaffold for future
implementation by qualified professionals.

—————————————————————————————————
SECTION 2 — KEY COMPONENTS (MOCK)
—————————————————————————————————
• Component A — Primary structural element describing the core function
• Component B — Supporting structure enabling the primary workflow
• Component C — Quality and safety verification layer (conceptual)
• Component D — Documentation and audit trail (conceptual)

—————————————————————————————————
SECTION 3 — WORKFLOW OVERVIEW (MOCK)
—————————————————————————————————
Step 1: Initiation — action or trigger begins the process
Step 2: Verification — relevant parties review and confirm
Step 3: Execution — core action performed under proper oversight
Step 4: Documentation — outcome recorded in the system
Step 5: Review — periodic review ensures quality and compliance

—————————————————————————————————
SECTION 4 — NEXT STEPS
—————————————————————————————————
This document must be reviewed by qualified professionals before any
real-world implementation. Legal, clinical, and compliance review required.
All content is conceptual only.

—————————————————————————————————
DISCLAIMER
—————————————————————————————————
This document is generated by CreateAI Brain in DEMO mode.
It contains MOCK, STRUCTURAL, NON-OPERATIONAL content only.
It is NOT a real clinical, legal, or regulatory document.
Always consult qualified professionals for real decisions.

Generated: ${new Date().toLocaleString()}
Platform: ApexCare Nexus — Healthcare System (Legal Safe)
Mode: DEMO — Simulation Only
`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_MOCK.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Section: Dashboard ──────────────────────────────────────────────────────
function DashboardSection({ mode }: { mode: StandaloneMode }) {
  const stats = [
    { label: "Patients Today",  value: "12",  icon: "👤", color: "#007AFF" },
    { label: "Pending Orders",  value: "7",   icon: "📋", color: "#FF9500" },
    { label: "Critical Alerts", value: "1",   icon: "🚨", color: "#FF2D55" },
    { label: "Staff Active",    value: "8",   icon: "👩‍⚕️", color: "#34C759" },
  ];
  const activity = [
    { time: "9:41 AM", event: "Patient P-004 (Linda R.) flagged Critical — vitals alert" },
    { time: "9:38 AM", event: "STAT order placed: Troponin I + BNP for Linda R." },
    { time: "9:30 AM", event: "Patient P-003 (James T.) admitted — Respiratory" },
    { time: "9:22 AM", event: "Discharge complete: Marcus W. — Room 102-B" },
    { time: "9:10 AM", event: "Morning vitals recorded for all floor patients" },
    { time: "8:55 AM", event: "Staff shift change completed — 8 staff logged in" },
  ];

  return (
    <div className="p-5 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">{mode} Mode · All content is mock and non-clinical</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-background rounded-2xl border border-border/50 p-4 text-center shadow-sm">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-background rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-semibold text-[14px] text-foreground mb-3">Patient Status Overview</h3>
          <div className="space-y-2">
            {PATIENTS.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">{p.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground truncate">{p.name} <span className="text-muted-foreground font-normal">· {p.room}</span></p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.condition}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusBadge(p.status)}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background rounded-2xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-semibold text-[14px] text-foreground mb-3">Activity Feed</h3>
          <div className="space-y-2">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className="text-muted-foreground font-mono w-14 flex-shrink-0 pt-0.5">{a.time}</span>
                <p className="text-foreground">{a.event}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-4 border ${mode === "Demo" ? "bg-blue-50 border-blue-200" : mode === "Test" ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
        <p className="text-[12px] font-semibold" style={{ color: mode === "Demo" ? "#1D4ED8" : mode === "Test" ? "#92400E" : "#374151" }}>
          {mode === "Demo" ? "🧭 Demo Mode — Safe simulation. All data is fictional. Switch to Test Mode to explore freely." :
           mode === "Test" ? "🧪 Test Mode — Sandbox environment. Click anything. Nothing is real." :
           "🔒 Live Mode — Not yet active. Requires real integrations and legal agreements."}
        </p>
      </div>
    </div>
  );
}

// ─── Section: Patients ───────────────────────────────────────────────────────
function PatientsSection() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview"|"vitals"|"orders"|"notes">("overview");
  const [noteText, setNoteText] = useState<Record<string, string>>({});

  const filtered = PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.condition.toLowerCase().includes(search.toLowerCase())
  );
  const patient = selected ? PATIENTS.find(p => p.id === selected) : null;
  const patientOrders = patient ? ORDERS.filter(o => o.patient === patient.name) : [];

  if (patient) {
    return (
      <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
        <button onClick={() => { setSelected(null); setActiveTab("overview"); }} className="text-primary text-sm font-medium">‹ All Patients</button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
            {patient.name[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
            <p className="text-[12px] text-muted-foreground">{patient.id} · Age {patient.age} · {patient.gender} · Room {patient.room} · Admitted {patient.admitted}</p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusBadge(patient.status)}`}>{patient.status}</span>
        </div>

        <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto">
          {([
            { id: "overview", label: "Overview", icon: "📋" },
            { id: "vitals",   label: "Vitals",   icon: "📊" },
            { id: "orders",   label: "Orders",   icon: "🧾" },
            { id: "notes",    label: "Notes",    icon: "📝" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-3">
            <div className="bg-background rounded-2xl border border-border/50 p-4 space-y-2">
              <p className="font-semibold text-[13px] text-foreground">Chief Complaint / Condition (Mock)</p>
              <p className="text-[13px] text-muted-foreground">{patient.condition}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[["BP", patient.bp], ["HR", `${patient.hr} bpm`], ["O₂", `${patient.o2}%`], ["Temp", patient.temp], ["RR", `${patient.rr}/min`], ["Adm.", patient.admitted]].map(([k, v]) => (
                <div key={k} className="bg-background rounded-xl border border-border/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">{k}</p>
                  <p className="font-bold text-[13px] text-foreground">{v}</p>
                </div>
              ))}
            </div>
            <div className="bg-background rounded-2xl border border-border/50 p-4">
              <p className="font-semibold text-[13px] text-foreground mb-2">Care Team (Mock)</p>
              {[`Dr. Rivera — Attending Physician`, `Nurse Kim — Primary Nurse`, `Dr. Chen — Specialist Consult (mock)`].map(m => (
                <p key={m} className="text-[12px] text-muted-foreground flex items-center gap-2"><span>👤</span>{m}</p>
              ))}
            </div>
          </div>
        )}

        {activeTab === "vitals" && (
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Current Vitals — Mock Only</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { k: "Blood Pressure", v: patient.bp,        unit: "mmHg",    icon: "❤️", note: "Systolic/Diastolic" },
                { k: "Heart Rate",     v: `${patient.hr}`,   unit: "bpm",     icon: "💓", note: "Beats per minute" },
                { k: "O₂ Saturation", v: `${patient.o2}`,   unit: "%",       icon: "🫁", note: "Pulse oximetry" },
                { k: "Temperature",    v: patient.temp,       unit: "",        icon: "🌡️", note: "Oral measurement" },
                { k: "Resp. Rate",     v: `${patient.rr}`,   unit: "/min",    icon: "🌬️", note: "Breaths per minute" },
                { k: "Pain Score",     v: "3",                unit: "/10",     icon: "📉", note: "Patient-reported (mock)" },
              ].map(item => (
                <div key={item.k} className="bg-background rounded-2xl border border-border/50 p-4 text-center">
                  <p className="text-2xl mb-1">{item.icon}</p>
                  <p className="font-bold text-[18px] text-foreground">{item.v}<span className="text-[12px] font-normal text-muted-foreground"> {item.unit}</span></p>
                  <p className="text-[11px] font-semibold text-foreground">{item.k}</p>
                  <p className="text-[9px] text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">All vitals are mock and non-clinical. Not for real healthcare use.</p>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Orders for {patient.name} — Mock</p>
            {patientOrders.length === 0
              ? <p className="text-muted-foreground text-sm text-center py-8">No orders for this patient.</p>
              : patientOrders.map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">
                      {o.type === "Lab" ? "🧪" : o.type === "Med" ? "💊" : "🩻"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-foreground">{o.label}</p>
                      <p className="text-[11px] text-muted-foreground">{o.type} · {o.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge(o.status)}`}>{o.status}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge(o.priority)}`}>{o.priority}</span>
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Clinical Notes (Mock)</p>
            {[
              { type: "Admission Note", author: "Dr. Rivera (mock)", content: `Patient ${patient.name} presents with ${patient.condition}. Initial vitals recorded. No acute distress noted at time of assessment. Orders placed per standard protocol. All documentation is mock and non-clinical.` },
              { type: "Progress Note", author: "Nurse Kim (mock)", content: `Patient responding as expected in ${patient.status.toLowerCase()} condition. Vital signs stable per mock readings. Continuing current orders. Plan reviewed with attending (mock). All content is structural only.` },
            ].map((note, i) => {
              const key = `${patient.id}-${i}`;
              const isEditing = key in noteText;
              return (
                <div key={i} className="bg-background rounded-2xl border border-border/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[13px] text-foreground">{note.type}</p>
                      <p className="text-[11px] text-muted-foreground">{note.author}</p>
                    </div>
                    <button onClick={() => setNoteText(prev => isEditing ? (({ [key]: _, ...r }) => r)(prev) : { ...prev, [key]: note.content })}
                      className="text-[11px] text-primary font-semibold hover:underline">
                      {isEditing ? "Close" : "Edit"}
                    </button>
                  </div>
                  {isEditing
                    ? <textarea value={noteText[key]} onChange={e => setNoteText(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full bg-muted/40 border border-border/40 rounded-xl p-3 text-[12px] text-foreground font-mono resize-none outline-none focus:ring-2 focus:ring-primary/20" rows={5} />
                    : <p className="text-[12px] text-muted-foreground leading-relaxed">{note.content}</p>
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">Patients</h2>
        <span className="text-[12px] text-muted-foreground">{filtered.length} mock patients</span>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
        className="w-full bg-background border border-border/50 rounded-xl p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
      <div className="space-y-2">
        {filtered.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id)}
            className="w-full flex items-center gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${p.status === "Critical" ? "bg-red-500" : p.status === "Recovering" ? "bg-orange-400" : "bg-primary/80"}`}>
              {p.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] text-foreground">{p.name} <span className="text-muted-foreground font-normal text-[12px]">· {p.id}</span></p>
              <p className="text-[12px] text-muted-foreground">{p.condition}</p>
              <p className="text-[11px] text-muted-foreground">Room {p.room} · Age {p.age} · Admitted {p.admitted}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusBadge(p.status)}`}>{p.status}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">All patient data is fictional. Not for real clinical use.</p>
    </div>
  );
}

// ─── Section: Workflows ──────────────────────────────────────────────────────
function WorkflowsSection() {
  const [active, setActive] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const workflow = active ? WORKFLOWS.find(w => w.id === active) : null;

  if (workflow) {
    const isStepDone = (i: number) => completed.includes(i);
    return (
      <div className="p-5 md:p-6 space-y-5 max-w-2xl mx-auto">
        <button onClick={() => { setActive(null); setStep(0); setCompleted([]); }} className="text-primary text-sm font-medium">‹ Workflows</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{workflow.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-foreground">{workflow.name}</h2>
            <p className="text-[12px] text-muted-foreground">{workflow.desc}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1">
          {workflow.steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i < step || isStepDone(i) ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Step {Math.min(step + 1, workflow.steps.length)} of {workflow.steps.length}</p>

        {step < workflow.steps.length ? (
          <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {step + 1}
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-foreground">{workflow.steps[step].title}</h3>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{workflow.steps[step].desc}</p>
            <div className="flex gap-2">
              <button onClick={() => { setCompleted(prev => [...prev, step]); setStep(s => s + 1); }}
                className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                {workflow.steps[step].action} →
              </button>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="px-4 border border-border/50 rounded-xl text-muted-foreground hover:bg-muted transition-colors text-sm">
                  ← Back
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-3xl">✅</p>
            <h3 className="font-bold text-foreground text-lg">{workflow.name} Complete</h3>
            <p className="text-[13px] text-muted-foreground">All {workflow.steps.length} steps completed in simulation. All actions are mock — no real changes made.</p>
            <button onClick={() => { setStep(0); setCompleted([]); }} className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">
              Run Again
            </button>
          </div>
        )}

        {/* Steps overview */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">All Steps</p>
          {workflow.steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${i === step && step < workflow.steps.length ? "bg-primary/5 border-primary/20" : isStepDone(i) ? "bg-green-50 border-green-200" : "bg-muted/30 border-transparent"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isStepDone(i) ? "bg-green-500 text-white" : i === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                {isStepDone(i) ? "✓" : i + 1}
              </div>
              <p className={`text-[12px] font-medium ${i === step ? "text-foreground" : isStepDone(i) ? "text-green-700" : "text-muted-foreground"}`}>{s.title}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Workflows</h2>
        <p className="text-[13px] text-muted-foreground">Step-by-step clinical workflows. All simulated — no real actions taken.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {WORKFLOWS.map(w => (
          <button key={w.id} onClick={() => setActive(w.id)}
            className="flex items-start gap-4 p-5 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group">
            <span className="text-3xl group-hover:scale-110 transition-transform">{w.icon}</span>
            <div>
              <p className="font-bold text-[14px] text-foreground">{w.name}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{w.desc}</p>
              <p className="text-[11px] text-primary mt-2 font-semibold">{w.steps.length} steps → Start →</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Orders ─────────────────────────────────────────────────────────
function OrdersSection() {
  const [filter, setFilter] = useState<"All"|"Lab"|"Med"|"Imaging">("All");
  const filtered = filter === "All" ? ORDERS : ORDERS.filter(o => o.type === filter);

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Orders</h2>
        <span className="text-[11px] text-muted-foreground">{filtered.length} orders</span>
      </div>
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {(["All", "Lab", "Med", "Imaging"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(o => (
          <div key={o.id} className="flex items-center gap-3 p-4 bg-background rounded-2xl border border-border/50">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">
              {o.type === "Lab" ? "🧪" : o.type === "Med" ? "💊" : "🩻"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-foreground">{o.label}</p>
              <p className="text-[11px] text-muted-foreground">{o.patient} · {o.type} · {o.id}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge(o.status)}`}>{o.status}</span>
              {o.priority === "STAT" && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusBadge("STAT")}`}>STAT</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">All orders are mock and non-operational. Not for real clinical use.</p>
    </div>
  );
}

// ─── Section: Documents ──────────────────────────────────────────────────────
function DocumentsSection() {
  const [selected, setSelected] = useState<string | null>(null);
  const doc = selected ? DOCUMENTS.find(d => d.id === selected) : null;

  if (doc) {
    return (
      <div className="p-5 md:p-6 space-y-5 max-w-2xl mx-auto">
        <button onClick={() => setSelected(null)} className="text-primary text-sm font-medium">‹ Documents</button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{doc.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-foreground">{doc.name}</h2>
            <p className="text-[12px] text-muted-foreground">{doc.type} · {doc.pages} pages</p>
          </div>
        </div>
        <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-4">
          <div className="border-b border-border/30 pb-4">
            <h3 className="font-semibold text-[15px] text-foreground">Purpose & Scope</h3>
            <p className="text-[13px] text-muted-foreground mt-1">{doc.desc}</p>
          </div>
          <div className="border-b border-border/30 pb-4">
            <h3 className="font-semibold text-[15px] text-foreground">Key Components (Mock)</h3>
            <ul className="mt-1 space-y-1">
              {["Primary element — describes core function", "Supporting structure — enables primary workflow", "Verification layer — quality and safety (conceptual)", "Documentation trail — audit and compliance (conceptual)"].map(item => (
                <li key={item} className="text-[13px] text-muted-foreground flex items-start gap-2"><span>•</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[15px] text-foreground">Next Steps</h3>
            <p className="text-[13px] text-muted-foreground mt-1">Review with qualified professionals. Obtain legal and compliance approval. Engage domain experts before any real-world use. All content is structural only.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadDoc(doc)}
            className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
            ⬇ Download (.txt mock)
          </button>
          <button className="flex-1 bg-muted text-muted-foreground text-sm font-medium py-2.5 rounded-xl cursor-default">
            Export PDF (Future)
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">Downloaded file is mock content only. Not a real clinical or legal document.</p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Documents</h2>
        <p className="text-[13px] text-muted-foreground">All documents are mock and downloadable as plain text.</p>
      </div>
      <div className="space-y-2">
        {DOCUMENTS.map(doc => (
          <button key={doc.id} onClick={() => setSelected(doc.id)}
            className="w-full flex items-center gap-4 p-4 bg-background rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-sm transition-all text-left group">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
              {doc.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-foreground truncate">{doc.name}</p>
              <p className="text-[11px] text-muted-foreground">{doc.type} · {doc.pages} pages</p>
            </div>
            <button onClick={e => { e.stopPropagation(); downloadDoc(doc); }}
              className="text-[11px] bg-primary/10 text-primary font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex-shrink-0">
              ⬇
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Marketing ──────────────────────────────────────────────────────
function MarketingSection() {
  const [tab, setTab] = useState<"landing"|"features"|"pricing"|"contact">("landing");

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Marketing Pages</h2>
        <p className="text-[12px] text-muted-foreground">Conceptual marketing site — all content is mock and not for real promotion without expert review.</p>
      </div>
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {(["landing", "features", "pricing", "contact"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-colors ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "landing" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl p-8 text-center space-y-3 border border-primary/10">
            <p className="text-4xl">🏥</p>
            <h1 className="text-2xl font-bold text-foreground">{MARKETING_PAGES.landing.hero}</h1>
            <p className="text-[14px] text-muted-foreground max-w-md mx-auto">{MARKETING_PAGES.landing.sub}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90">Request Demo (Mock)</button>
              <button className="border border-primary/30 text-primary px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary/5">Learn More</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MARKETING_PAGES.landing.features.map(f => (
              <div key={f} className="flex items-start gap-2 p-3 bg-background rounded-xl border border-border/50">
                <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                <p className="text-[13px] text-foreground">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "features" && (
        <div className="grid md:grid-cols-2 gap-4">
          {MARKETING_PAGES.features.map(f => (
            <div key={f.title} className="bg-background rounded-2xl border border-border/50 p-5 space-y-2">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-bold text-[15px] text-foreground">{f.title}</h3>
              <p className="text-[13px] text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "pricing" && (
        <div className="grid md:grid-cols-3 gap-4">
          {MARKETING_PAGES.pricing.map((p, i) => (
            <div key={p.name} className={`bg-background rounded-2xl border p-5 space-y-3 ${i === 1 ? "border-primary/30 shadow-md" : "border-border/50"}`}>
              {i === 1 && <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full">Most Popular</span>}
              <div>
                <p className="font-bold text-[16px] text-foreground">{p.name}</p>
                <p className="text-2xl font-bold text-primary">{p.price}</p>
                <p className="text-[11px] text-muted-foreground">{p.note}</p>
              </div>
              <div className="space-y-1.5">
                {p.features.map(f => (
                  <p key={f} className="text-[12px] text-foreground flex items-center gap-2"><span className="text-green-500">✓</span>{f}</p>
                ))}
              </div>
              <button className="w-full py-2 rounded-xl text-[12px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                Get Started (Mock)
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "contact" && (
        <div className="space-y-4">
          <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-3">
            <h3 className="font-bold text-[15px] text-foreground">Contact Us (Mock)</h3>
            {[
              { label: "Name", placeholder: "Your full name" },
              { label: "Organization", placeholder: "Hospital or clinic name" },
              { label: "Email", placeholder: "your@email.com" },
            ].map(field => (
              <div key={field.label}>
                <label className="text-[12px] font-semibold text-foreground block mb-1">{field.label}</label>
                <input placeholder={field.placeholder} className="w-full bg-muted/40 border border-border/50 rounded-xl p-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
            ))}
            <div>
              <label className="text-[12px] font-semibold text-foreground block mb-1">Message</label>
              <textarea placeholder="Tell us about your organization and needs..." rows={3} className="w-full bg-muted/40 border border-border/50 rounded-xl p-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all" />
            </div>
            <button className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              Send Message (Mock — staged for review)
            </button>
            <p className="text-[10px] text-muted-foreground text-center">No real message is sent. All form submissions are staged for review only.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: AI Assistant ───────────────────────────────────────────────────
interface ChatMsg { role: "user" | "assistant" | "system"; content: string; }

function AIAssistantSection() {
  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: "system",
    content: "🤖 ApexCare Nexus AI Assistant (DEMO)\n\nI'm your clinical workflow assistant for this demonstration. I clearly identify as AI — not a physician. All my responses are mock and non-clinical. I'm here to help you navigate the platform, explain workflow steps, and demonstrate what AI-assisted documentation could look like.\n\nHow can I help you today?",
  }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuf, setStreamBuf] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamBuf]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setStreaming(true);
    setStreamBuf("");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await streamEngine({
        engineId: "BrainGen",
        topic:    `[ApexCare Nexus Healthcare AI Assistant — Demo Mode]\n\nUser question: "${q}"\n\nRespond as a healthcare platform AI assistant. Provide a helpful, clearly AI-labeled, mock/structural answer. Explain clinical concepts in plain language. Always clarify this is demonstration content and not real clinical advice. Keep response practical and focused.`,
        signal:   ctrl.signal,
        onChunk:  (t) => setStreamBuf(prev => prev + t),
        onDone:   (full) => setMessages(prev => [...prev, { role: "assistant", content: full }]),
        onError:  () => setMessages(prev => [...prev, { role: "assistant", content: "[Response error — please try again.]" }]),
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: "[Response error — please try again.]" }]);
      }
    } finally {
      setStreaming(false);
      setStreamBuf("");
      abortRef.current = null;
    }
  };

  const QUICK_PROMPTS = [
    "Explain the admission workflow",
    "What does O₂ saturation mean?",
    "How does discharge documentation work?",
    "What is a STAT order?",
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none px-5 py-3 border-b border-border/30">
        <p className="text-[13px] font-semibold text-foreground">AI Clinical Assistant <span className="text-[10px] text-muted-foreground font-normal ml-1">— Demo Mode · Not real clinical advice</span></p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {QUICK_PROMPTS.map(q => (
            <button key={q} onClick={() => send(q)} disabled={streaming}
              className="text-[10px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full hover:bg-muted/80 transition-colors disabled:opacity-40">
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mr-2 mt-0.5">🤖</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === "user" ? "bg-primary text-white rounded-br-sm" :
              msg.role === "system" ? "bg-muted/50 border border-border/40" :
              "bg-background border border-border/50"}`}>
              <pre className={`text-[12px] whitespace-pre-wrap font-${msg.role === "user" ? "medium" : "mono"} leading-relaxed`}>
                {msg.content}
              </pre>
            </div>
          </div>
        ))}
        {streaming && streamBuf && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mr-2 mt-0.5">🤖</div>
            <div className="max-w-[80%] bg-background border border-border/50 rounded-2xl px-4 py-3">
              <pre className="text-[12px] text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {streamBuf}<span className="inline-block w-2 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" />
              </pre>
            </div>
          </div>
        )}
        {streaming && !streamBuf && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold flex-shrink-0 mr-2">🤖</div>
            <div className="bg-background border border-border/50 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-none p-3 border-t border-border/50 bg-background/80">
        <form onSubmit={e => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-full pl-4 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask the AI assistant…"
            className="flex-1 bg-transparent border-none outline-none text-[14px] placeholder:text-muted-foreground"
            disabled={streaming} />
          <button type="submit" disabled={!input.trim() || streaming}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>
          </button>
        </form>
        <p className="text-[9px] text-muted-foreground text-center mt-1">AI responses are mock and non-clinical. Not for real healthcare decisions.</p>
      </div>
    </div>
  );
}

// ─── Toggle Setting Component ────────────────────────────────────────────────
function ToggleSetting({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50">
      <div>
        <p className="font-semibold text-[13px] text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <button onClick={() => setOn(v => !v)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

// ─── Section: Settings ───────────────────────────────────────────────────────
function SettingsSection({ mode, onModeChange }: { mode: StandaloneMode; onModeChange: (m: StandaloneMode) => void }) {
  const [lang, setLang] = useState("English");
  const [saved, setSaved] = useState(false);

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Settings</h2>

      <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-4">
        <h3 className="font-semibold text-[14px] text-foreground">System Mode</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["Demo", "Test", "Live"] as StandaloneMode[]).map(m => (
            <button key={m} onClick={() => m !== "Live" && onModeChange(m)}
              className={`py-2.5 rounded-xl text-[12px] font-bold transition-all ${mode === m
                ? { Demo: "bg-green-100 text-green-700", Test: "bg-orange-100 text-orange-700", Live: "bg-gray-100 text-gray-400" }[m]
                : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {m === "Live" ? "🔒 Live (Future)" : m}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Live Mode requires real integrations, legal agreements, and expert configuration.</p>
      </div>

      <div className="bg-background rounded-2xl border border-border/50 p-5 space-y-3">
        <h3 className="font-semibold text-[14px] text-foreground">Display Language</h3>
        <div className="flex flex-wrap gap-2">
          {["English", "Tamil", "Tamil–English", "Spanish"].map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${lang === l ? "bg-primary text-white border-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"}`}>
              {l}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Language setting is structural only — full multilingual content requires a LIVE mode integration.</p>
      </div>

      <ToggleSetting label="Zero Overwhelm Mode" desc="Reduce visible options to the essentials" defaultOn />
      <ToggleSetting label="Demo Guide Tooltips" desc="Show step-by-step guidance overlays" defaultOn />
      <ToggleSetting label="Audit Log (Mock)" desc="Log all actions for review" />
      <ToggleSetting label="Family View Enabled" desc="Allow simplified family-mode access" />

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
        className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
        {saved ? "✓ Settings Saved (Session)" : "Save Settings"}
      </button>
    </div>
  );
}

// ─── Main Healthcare Product ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",   icon: "🏠" },
  { id: "patients",   label: "Patients",    icon: "👤" },
  { id: "workflows",  label: "Workflows",   icon: "🔄" },
  { id: "orders",     label: "Orders",      icon: "📋" },
  { id: "documents",  label: "Documents",   icon: "📄" },
  { id: "marketing",  label: "Marketing",   icon: "📣" },
  { id: "ai",         label: "AI Assistant",icon: "🤖" },
  { id: "settings",   label: "Settings",    icon: "⚙️" },
];

export function HealthcareProduct() {
  const [section, setSection] = useState("dashboard");
  const [mode, setMode] = useState<StandaloneMode>("Demo");

  return (
    <StandaloneLayout
      productName="ApexCare Nexus"
      productIcon="🏥"
      productColor="#34C759"
      navItems={NAV_ITEMS}
      activeSection={section}
      onSectionChange={setSection}
      mode={mode}
      onModeChange={setMode}
      disclaimer="ApexCare Nexus — Healthcare System (Legal Safe) · All content is mock, non-clinical, and non-operational · Not for real healthcare use · Always consult qualified professionals"
    >
      <div className={section === "ai" ? "h-full flex flex-col" : ""}>
        {section === "dashboard"  && <DashboardSection mode={mode} />}
        {section === "patients"   && <PatientsSection />}
        {section === "workflows"  && <WorkflowsSection />}
        {section === "orders"     && <OrdersSection />}
        {section === "documents"  && <DocumentsSection />}
        {section === "marketing"  && <MarketingSection />}
        {section === "ai"         && <AIAssistantSection />}
        {section === "settings"   && <SettingsSection mode={mode} onModeChange={setMode} />}
      </div>
    </StandaloneLayout>
  );
}
