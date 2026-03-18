// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY MANAGER APP
// View and manage the internal identity package for every project.
// All identities are internal-only. Public subdomain is opt-in metadata only.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import {
  ProjectIdentity,
  SubdomainStatus,
  getAllIdentities,
  updateInternalDomain,
  updateInternalEmail,
  updateInternalPhoneId,
  proposePublicSubdomain,
  approvePublicSubdomain,
  declinePublicSubdomain,
  ensureIdentityForProject,
  getBestIdentity,
  normalizeSlug,
} from "@/engine/IdentityEngine";

type EditField = "domain" | "email" | "phone" | null;
type View      = "list" | "detail" | "create";

// ─── Badge ────────────────────────────────────────────────────────────────────

type Variant = "green" | "amber" | "red" | "slate" | "indigo" | "violet";

const BADGE: Record<Variant, string> = {
  green:  "bg-emerald-50  text-emerald-700  border-emerald-200",
  amber:  "bg-amber-50    text-amber-700    border-amber-200",
  red:    "bg-red-50      text-red-700      border-red-200",
  slate:  "bg-slate-100   text-slate-500    border-slate-200",
  indigo: "bg-indigo-50   text-indigo-700   border-indigo-200",
  violet: "bg-violet-50   text-violet-700   border-violet-200",
};

function Badge({ text, v }: { text: string; v: Variant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${BADGE[v]}`}>
      {text}
    </span>
  );
}

function subVariant(s: SubdomainStatus): Variant {
  if (s === "approved") return "green";
  if (s === "pending")  return "amber";
  if (s === "declined") return "red";
  return "slate";
}
function subLabel(s: SubdomainStatus): string {
  if (s === "approved") return "Public ✓";
  if (s === "pending")  return "Pending";
  if (s === "declined") return "Declined";
  return "Internal only";
}

// ─── Editable field row ───────────────────────────────────────────────────────

function FieldRow({
  icon, label, value, note, field, editing, onEdit, onSave, onCancel,
}: {
  icon: string; label: string; value: string; note: string;
  field: EditField; editing: EditField;
  onEdit: () => void; onSave: (v: string) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);
  const active = editing === field;

  return (
    <div className="group py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px]">{icon}</span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        {!active && (
          <button onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 text-[11px] font-semibold text-indigo-500
                       hover:text-indigo-700 transition-all px-2 py-0.5 rounded-lg hover:bg-indigo-50">
            Edit
          </button>
        )}
      </div>

      {active ? (
        <div className="flex gap-2 mt-1">
          <input
            value={val} autoFocus
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onSave(val); if (e.key === "Escape") onCancel(); }}
            className="flex-1 px-3 py-1.5 rounded-xl border border-indigo-300 text-[12px] font-mono
                       outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
          />
          <button onClick={() => onSave(val)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold
                       hover:bg-indigo-700 transition-colors shrink-0">
            Save
          </button>
          <button onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold
                       hover:bg-slate-200 transition-colors shrink-0">
            ✕
          </button>
        </div>
      ) : (
        <p className="font-mono text-[13px] text-slate-800">{value}</p>
      )}
      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{note}</p>
    </div>
  );
}

// ─── Identity detail ──────────────────────────────────────────────────────────

function IdentityDetail({
  identity, onBack, onRefresh,
}: { identity: ProjectIdentity; onBack: () => void; onRefresh: () => void }) {
  const [editing, setEditing] = useState<EditField>(null);
  const [saved,   setSaved]   = useState<string | null>(null);

  const save = useCallback((field: EditField, value: string) => {
    if (!value.trim()) return;
    if (field === "domain") updateInternalDomain(identity.projectId, value.trim());
    if (field === "email")  updateInternalEmail(identity.projectId, value.trim());
    if (field === "phone")  updateInternalPhoneId(identity.projectId, value.trim());
    setEditing(null);
    setSaved(field);
    setTimeout(() => setSaved(null), 2000);
    onRefresh();
  }, [identity.projectId, onRefresh]);

  const ss = identity.subdomainStatus;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0">
        <button onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100
                     hover:bg-slate-200 text-slate-600 transition-colors text-[13px] shrink-0">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-slate-900 truncate">{identity.projectName}</p>
          <p className="text-[11px] text-slate-400">Identity Package · {identity.id.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {saved && <span className="text-[10px] text-emerald-600 font-semibold">Saved ✓</span>}
          <Badge text={identity.status === "active" ? "Active" : "Archived"}
                 v={identity.status === "active" ? "green" : "slate"} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Internal identifiers */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Internal Identifiers — All private, never public
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 divide-y divide-slate-100">
            <FieldRow
              icon="🌐" label="Internal Domain" value={identity.internalDomain}
              note="Resolves only inside the CreateAI platform. Not registered in any DNS."
              field="domain" editing={editing}
              onEdit={() => setEditing("domain")} onSave={v => save("domain", v)} onCancel={() => setEditing(null)}
            />
            <FieldRow
              icon="✉️" label="Internal Email" value={identity.internalEmail}
              note="Used for AI interactions, notifications, and internal project messaging."
              field="email" editing={editing}
              onEdit={() => setEditing("email")} onSave={v => save("email", v)} onCancel={() => setEditing(null)}
            />
            <FieldRow
              icon="📞" label="Internal Phone ID" value={identity.internalPhoneId}
              note="Not a real phone number. Used for internal chat, SMS-style alerts, and project routing."
              field="phone" editing={editing}
              onEdit={() => setEditing("phone")} onSave={v => save("phone", v)} onCancel={() => setEditing(null)}
            />
          </div>
        </div>

        {/* Public subdomain */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Optional Public Subdomain
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-mono text-[13px] text-slate-700 truncate">{identity.publicSubdomain ?? "—"}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Preparatory metadata only — no DNS registration or public exposure until explicitly approved and deployed.
                </p>
              </div>
              <Badge text={subLabel(ss)} v={subVariant(ss)} />
            </div>

            {ss === "none" && (
              <button onClick={() => { proposePublicSubdomain(identity.projectId); onRefresh(); }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-[12px] font-semibold
                           hover:bg-slate-200 transition-colors border border-slate-200">
                Propose public subdomain
              </button>
            )}
            {ss === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => { approvePublicSubdomain(identity.projectId); onRefresh(); }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-bold
                             hover:bg-emerald-700 transition-colors">
                  Approve
                </button>
                <button onClick={() => { declinePublicSubdomain(identity.projectId); onRefresh(); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[12px] font-bold
                             hover:bg-slate-200 transition-colors">
                  Decline
                </button>
              </div>
            )}
            {(ss === "approved" || ss === "declined") && (
              <button onClick={() => { proposePublicSubdomain(identity.projectId); onRefresh(); }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-[12px] font-semibold
                           hover:bg-slate-200 transition-colors border border-slate-200">
                Re-propose
              </button>
            )}
          </div>
        </div>

        {/* Routing info */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Routing Reference
          </p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 font-mono text-[11px] text-slate-600">
            <div><span className="text-slate-400">resolve(</span><span className="text-indigo-600">"{identity.internalDomain}"</span><span className="text-slate-400">)</span> → projectId: {identity.projectId.slice(0, 8)}…</div>
            <div><span className="text-slate-400">resolve(</span><span className="text-indigo-600">"{identity.internalEmail}"</span><span className="text-slate-400">)</span> → projectId: {identity.projectId.slice(0, 8)}…</div>
            <div><span className="text-slate-400">resolve(</span><span className="text-indigo-600">"{identity.internalPhoneId}"</span><span className="text-slate-400">)</span> → projectId: {identity.projectId.slice(0, 8)}…</div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-center text-[10px] text-slate-300 pb-2">
          Created {new Date(identity.createdAt).toLocaleString()} ·
          Updated {new Date(identity.updatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// ─── Create identity form ─────────────────────────────────────────────────────

function CreateIdentityForm({
  onCreated, onCancel,
}: { onCreated: () => void; onCancel: () => void }) {
  const [name, setName]   = useState("");
  const [id,   setId]     = useState("");
  const preview = name.trim() ? getBestIdentity(name.trim()) : null;

  const create = () => {
    if (!name.trim()) return;
    ensureIdentityForProject({ id: id.trim() || crypto.randomUUID(), name: name.trim() });
    onCreated();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0">
        <button onClick={onCancel}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100
                     hover:bg-slate-200 text-slate-600 transition-colors text-[13px]">
          ←
        </button>
        <div>
          <p className="text-[15px] font-bold text-slate-900">New Identity Package</p>
          <p className="text-[11px] text-slate-400">Generate for an existing project</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Project Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. My SaaS Product"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[13px] outline-none
                         focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 bg-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
              Project ID <span className="font-normal text-slate-400">(optional — auto-generated if blank)</span>
            </label>
            <input value={id} onChange={e => setId(e.target.value)}
              placeholder="Leave blank for auto-generated ID"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-mono
                         outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 bg-white"
            />
          </div>
        </div>

        {preview && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 space-y-2">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Preview</p>
            {[
              { icon: "🌐", label: "Domain",   val: preview.internalDomain  },
              { icon: "✉️", label: "Email",    val: preview.internalEmail   },
              { icon: "📞", label: "Phone ID", val: preview.internalPhoneId },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="text-[12px] w-5 shrink-0">{r.icon}</span>
                <p className="font-mono text-[11px] text-indigo-800 truncate">{r.val}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={create} disabled={!name.trim()}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-bold
                     hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Generate Identity Package
        </button>
      </div>
    </div>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────

export function IdentityManagerApp() {
  const [identities, setIdentities] = useState<ProjectIdentity[]>([]);
  const [view,       setView]       = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState<"all" | "approved" | "pending">("all");

  const refresh = useCallback(() => {
    setIdentities(getAllIdentities());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const detail = identities.find(i => i.id === selectedId) ?? null;

  // Apply filter
  const filtered = identities.filter(i => {
    if (filter === "approved") return i.subdomainStatus === "approved";
    if (filter === "pending")  return i.subdomainStatus === "pending";
    return true;
  }).filter(i =>
    !search ||
    i.projectName.toLowerCase().includes(search.toLowerCase()) ||
    i.internalDomain.includes(search.toLowerCase()) ||
    i.internalPhoneId.toLowerCase().includes(search.toLowerCase())
  );

  const active   = identities.filter(i => i.status === "active").length;
  const approved = identities.filter(i => i.subdomainStatus === "approved").length;
  const pending  = identities.filter(i => i.subdomainStatus === "pending").length;

  if (view === "detail" && detail) {
    return (
      <div className="h-full bg-slate-50">
        <IdentityDetail
          identity={detail}
          onBack={() => setView("list")}
          onRefresh={refresh}
        />
      </div>
    );
  }

  if (view === "create") {
    return (
      <div className="h-full bg-slate-50">
        <CreateIdentityForm
          onCreated={() => { refresh(); setView("list"); }}
          onCancel={() => setView("list")}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">Identity Manager</h2>
            <p className="text-[12px] text-slate-500 mt-0.5 max-w-sm">
              Internal identity packages — every project gets a private domain, email address, and phone ID.
            </p>
          </div>
          <button onClick={() => setView("create")}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600
                       text-white text-[11px] font-bold hover:bg-indigo-700 transition-colors ml-3">
            <span>＋</span> New
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex gap-3 mb-3">
          {[
            { label: "Total",    val: identities.length, v: "slate"  as Variant },
            { label: "Active",   val: active,            v: "green"  as Variant },
            { label: "Approved", val: approved,          v: "indigo" as Variant },
            { label: "Pending",  val: pending,           v: "amber"  as Variant },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center">
              <p className={`text-[16px] font-bold ${s.v === "green" ? "text-emerald-600" : s.v === "indigo" ? "text-indigo-600" : s.v === "amber" ? "text-amber-600" : "text-slate-700"}`}>{s.val}</p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search projects, domains, or phone IDs…"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] outline-none
                     focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-colors bg-white mb-2"
        />

        {/* Filter pills */}
        <div className="flex gap-2">
          {(["all", "approved", "pending"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors capitalize
                ${filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🪪</div>
            <p className="text-[15px] font-bold text-slate-600">
              {identities.length === 0 ? "No identity packages yet" : "No results"}
            </p>
            <p className="text-[12px] text-slate-400 mt-1 max-w-xs mx-auto">
              {identities.length === 0
                ? "Identities auto-generate when projects are created. You can also create one manually."
                : "Try a different search or filter."}
            </p>
            {identities.length === 0 && (
              <button onClick={() => setView("create")}
                className="mt-4 px-5 py-2 rounded-xl bg-indigo-600 text-white text-[12px] font-bold
                           hover:bg-indigo-700 transition-colors">
                Generate Identity Package
              </button>
            )}
          </div>
        )}

        {filtered.map(id => (
          <button key={id.id}
            onClick={() => { setSelectedId(id.id); setView("detail"); }}
            className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4
                       hover:border-indigo-200 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-700
                                transition-colors truncate">
                    {id.projectName}
                  </p>
                  {id.status === "archived" && <Badge text="Archived" v="slate" />}
                </div>
                <p className="font-mono text-[11px] text-slate-500 truncate">🌐 {id.internalDomain}</p>
                <p className="font-mono text-[11px] text-slate-400 truncate">✉️ {id.internalEmail}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge text={id.internalPhoneId} v="indigo" />
                {id.subdomainStatus !== "none" && (
                  <Badge text={subLabel(id.subdomainStatus)} v={subVariant(id.subdomainStatus)} />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
