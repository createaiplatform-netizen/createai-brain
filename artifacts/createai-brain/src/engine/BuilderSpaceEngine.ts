// ═══════════════════════════════════════════════════════════════════════════
// BUILDER SPACE ENGINE
// Stores, versions, and serves code proposals for in-platform review.
// Nothing is ever applied automatically — the user reviews and confirms first.
// ═══════════════════════════════════════════════════════════════════════════

export type FileStatus     = "new" | "modified" | "deleted";
export type ProposalStatus = "pending" | "applied" | "discarded";

export interface BuilderFile {
  path:            string;
  language:        string;
  originalContent: string;
  proposedContent: string;
  status:          FileStatus;
}

export interface BuilderProposal {
  id:          string;
  title:       string;
  description: string;
  source:      "ai" | "manual";
  tags:        string[];
  files:       BuilderFile[];
  createdAt:   number;
  status:      ProposalStatus;
}

export interface DiffHunk {
  type:    "context" | "added" | "removed";
  content: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const LS_KEY = "createai:builder-proposals-v1";

function load(): BuilderProposal[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as BuilderProposal[]) : [];
  } catch { return []; }
}

function persist(proposals: BuilderProposal[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(proposals)); } catch {}
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getProposals(): BuilderProposal[] {
  return load();
}

export function getPendingProposals(): BuilderProposal[] {
  return load().filter(p => p.status === "pending");
}

export function getAppliedProposals(): BuilderProposal[] {
  return load().filter(p => p.status === "applied");
}

export function getProposalById(id: string): BuilderProposal | null {
  return load().find(p => p.id === id) ?? null;
}

export function addProposal(
  draft: Omit<BuilderProposal, "id" | "createdAt" | "status">,
): BuilderProposal {
  const proposal: BuilderProposal = {
    ...draft,
    id:        crypto.randomUUID(),
    createdAt: Date.now(),
    status:    "pending",
  };
  const all = load();
  all.unshift(proposal);
  persist(all);
  return proposal;
}

export function updateProposalFile(
  proposalId: string,
  filePath:   string,
  newContent: string,
): void {
  const all = load();
  const p   = all.find(x => x.id === proposalId);
  if (!p) return;
  const f   = p.files.find(x => x.path === filePath);
  if (!f) return;
  f.proposedContent = newContent;
  persist(all);
}

export function applyProposal(id: string): void {
  const all = load();
  const p   = all.find(x => x.id === id);
  if (p) { p.status = "applied"; persist(all); }
}

export function discardProposal(id: string): void {
  const all = load();
  const p   = all.find(x => x.id === id);
  if (p) { p.status = "discarded"; persist(all); }
}

export function deleteProposal(id: string): void {
  persist(load().filter(x => x.id !== id));
}

export function clearAll(): void {
  persist([]);
}

export function getStats() {
  const all     = load();
  const pending = all.filter(p => p.status === "pending").length;
  const applied = all.filter(p => p.status === "applied").length;
  const files   = all.filter(p => p.status === "pending").reduce((s, p) => s + p.files.length, 0);
  return { total: all.length, pending, applied, files };
}

// ─── Diff computation ─────────────────────────────────────────────────────────
// Simple lookahead diff — good enough for most code change proposals.

export function computeDiff(before: string, after: string): DiffHunk[] {
  if (!before) return after.split("\n").map(c => ({ type: "added"   as const, content: c }));
  if (!after)  return before.split("\n").map(c => ({ type: "removed" as const, content: c }));

  const bLines = before.split("\n");
  const aLines = after.split("\n");
  const result: DiffHunk[] = [];
  let i = 0, j = 0;

  while (i < bLines.length || j < aLines.length) {
    if      (i >= bLines.length) { result.push({ type: "added",   content: aLines[j++] }); }
    else if (j >= aLines.length) { result.push({ type: "removed", content: bLines[i++] }); }
    else if (bLines[i] === aLines[j]) { result.push({ type: "context", content: bLines[i] }); i++; j++; }
    else {
      const WINDOW = 5;
      let matched = false;
      for (let di = 1; di <= WINDOW && i + di < bLines.length; di++) {
        if (bLines[i + di] === aLines[j]) {
          for (let k = 0; k < di; k++) result.push({ type: "removed", content: bLines[i++] });
          matched = true;
          break;
        }
      }
      for (let dj = 1; !matched && dj <= WINDOW && j + dj < aLines.length; dj++) {
        if (aLines[j + dj] === bLines[i]) {
          for (let k = 0; k < dj; k++) result.push({ type: "added", content: aLines[j++] });
          matched = true;
          break;
        }
      }
      if (!matched) {
        result.push({ type: "removed", content: bLines[i++] });
        result.push({ type: "added",   content: aLines[j++] });
      }
    }
  }
  return result;
}

// ─── Identity Engine proposal ─────────────────────────────────────────────────
// Creates the full Identity Engine proposal inside the Builder Space.
// Nothing is written to disk until the user reviews and presses "Apply".

export function seedIdentityEngineProposal(): void {
  const all = load();
  if (all.some(p => p.id === "identity-engine-v1")) return;

  // ── File 1: IdentityEngine.ts ──────────────────────────────────────────────
  const identityEngineTs =
`// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY ENGINE
// Auto-generates and manages identity packages for every project.
// All identities are internal-only. Public subdomain is opt-in only.
// ═══════════════════════════════════════════════════════════════════════════

export type SubdomainStatus = "pending" | "approved" | "declined" | "none";

export interface ProjectIdentity {
  id:               string;
  projectId:        string;
  projectName:      string;
  internalDomain:   string;
  internalEmail:    string;
  internalPhoneId:  string;
  publicSubdomain:  string | null;
  subdomainStatus:  SubdomainStatus;
  status:           "active" | "archived";
  createdAt:        number;
  updatedAt:        number;
}

const LS_KEY = "createai:identity-packages-v1";

function loadAll(): ProjectIdentity[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveAll(items: ProjectIdentity[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

export function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/ +/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

function isSlugTaken(slug: string, excludeId?: string): boolean {
  const domain = slug + ".createai";
  return loadAll().some(i => i.internalDomain === domain && i.id !== excludeId);
}

function makeUniqueSlug(base: string, excludeId?: string): string {
  if (!isSlugTaken(base, excludeId)) return base;
  for (let n = 2; n <= 99; n++) {
    const v = base + "-" + n;
    if (!isSlugTaken(v, excludeId)) return v;
  }
  return base + "-" + Date.now().toString().slice(-6);
}

export function getBestIdentity(
  projectName: string,
  projectId?: string,
): { internalDomain: string; internalEmail: string; internalPhoneId: string; publicSubdomain: string } {
  const slug  = normalizeSlug(projectName);
  const safe  = makeUniqueSlug(slug, projectId);
  const short = (projectId || crypto.randomUUID()).slice(0, 8).toUpperCase();
  return {
    internalDomain:  safe + ".createai",
    internalEmail:   safe + "@mail.createai",
    internalPhoneId: "+CAI-" + short,
    publicSubdomain: safe + ".createai.digital",
  };
}

export function getAllIdentities(): ProjectIdentity[] { return loadAll(); }

export function getIdentityByProjectId(projectId: string): ProjectIdentity | null {
  return loadAll().find(i => i.projectId === projectId) ?? null;
}

export function ensureIdentityForProject(project: { id: string; name: string }): ProjectIdentity {
  const existing = getIdentityByProjectId(project.id);
  if (existing) return existing;
  const best = getBestIdentity(project.name, project.id);
  const identity: ProjectIdentity = {
    id:              crypto.randomUUID(),
    projectId:       project.id,
    projectName:     project.name,
    internalDomain:  best.internalDomain,
    internalEmail:   best.internalEmail,
    internalPhoneId: best.internalPhoneId,
    publicSubdomain: best.publicSubdomain,
    subdomainStatus: "none",
    status:          "active",
    createdAt:       Date.now(),
    updatedAt:       Date.now(),
  };
  const all = loadAll();
  all.unshift(identity);
  saveAll(all);
  return identity;
}

function patch(projectId: string, updates: Partial<ProjectIdentity>): ProjectIdentity | null {
  const all = loadAll();
  const idx = all.findIndex(i => i.projectId === projectId);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, updatedAt: Date.now() };
  saveAll(all);
  return all[idx];
}

export function updateInternalDomain(projectId: string, newDomain: string): ProjectIdentity | null {
  return patch(projectId, { internalDomain: newDomain });
}
export function updateInternalEmail(projectId: string, newEmail: string): ProjectIdentity | null {
  return patch(projectId, { internalEmail: newEmail });
}
export function updateInternalPhoneId(projectId: string, newId: string): ProjectIdentity | null {
  return patch(projectId, { internalPhoneId: newId });
}
export function proposePublicSubdomain(projectId: string): ProjectIdentity | null {
  return patch(projectId, { subdomainStatus: "pending" });
}
export function approvePublicSubdomain(projectId: string): ProjectIdentity | null {
  return patch(projectId, { subdomainStatus: "approved" });
}
export function declinePublicSubdomain(projectId: string): ProjectIdentity | null {
  return patch(projectId, { subdomainStatus: "declined" });
}
export function archiveIdentity(projectId: string): ProjectIdentity | null {
  return patch(projectId, { status: "archived" });
}
export function deleteIdentity(projectId: string): void {
  saveAll(loadAll().filter(i => i.projectId !== projectId));
}`;

  // ── File 2: IdentityRouting.ts ─────────────────────────────────────────────
  const identityRoutingTs =
`// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY ROUTING SERVICE
// Resolves internal identifiers (domain, email, phoneId) to projectId.
// Used by messaging, notifications, and AI interactions.
// ═══════════════════════════════════════════════════════════════════════════

import type { ProjectIdentity } from "@/engine/IdentityEngine";
import { getAllIdentities }      from "@/engine/IdentityEngine";

export interface RouteTarget {
  projectId: string;
  identity:  ProjectIdentity;
}

function active(): ProjectIdentity[] {
  return getAllIdentities().filter(i => i.status === "active");
}

export function resolveByDomain(domain: string): RouteTarget | null {
  const id = active().find(i => i.internalDomain === domain);
  return id ? { projectId: id.projectId, identity: id } : null;
}

export function resolveByEmail(email: string): RouteTarget | null {
  const id = active().find(i => i.internalEmail === email);
  return id ? { projectId: id.projectId, identity: id } : null;
}

export function resolveByPhoneId(phoneId: string): RouteTarget | null {
  const id = active().find(i => i.internalPhoneId === phoneId);
  return id ? { projectId: id.projectId, identity: id } : null;
}

/**
 * Smart resolver — detects identifier format automatically.
 *   {name}.createai         -> domain lookup
 *   {name}@mail.createai    -> email lookup
 *   +CAI-{short}            -> phone ID lookup
 */
export function resolve(identifier: string): RouteTarget | null {
  const s = identifier.trim();
  if (s.endsWith(".createai") && !s.includes("@")) return resolveByDomain(s);
  if (s.includes("@mail.createai"))                 return resolveByEmail(s);
  if (s.startsWith("+CAI-"))                        return resolveByPhoneId(s);
  return null;
}

export function resolveAll(): RouteTarget[] {
  return active().map(i => ({ projectId: i.projectId, identity: i }));
}`;

  // ── File 3: IdentityManagerApp.tsx ────────────────────────────────────────
  const identityManagerAppTsx =
`import React, { useState, useEffect, useCallback } from "react";
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
} from "@/engine/IdentityEngine";

type EditField = "domain" | "email" | "phone" | null;

// ── Badge ─────────────────────────────────────────────────────────────────────

const BADGE_CLS: Record<string, string> = {
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  slate:  "bg-slate-100 text-slate-500 border-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function Badge({ text, variant }: { text: string; variant: keyof typeof BADGE_CLS }) {
  return (
    <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border " + (BADGE_CLS[variant] || BADGE_CLS.slate)}>
      {text}
    </span>
  );
}

function subVariant(s: SubdomainStatus): keyof typeof BADGE_CLS {
  if (s === "approved") return "green";
  if (s === "pending")  return "amber";
  if (s === "declined") return "red";
  return "slate";
}

function subLabel(s: SubdomainStatus): string {
  if (s === "approved") return "Public: Approved";
  if (s === "pending")  return "Public: Pending";
  if (s === "declined") return "Public: Declined";
  return "Public: Off";
}

// ── Editable field row ────────────────────────────────────────────────────────

function FieldRow({
  label, value, note, editKey, editing, onEdit, onSave, onCancel,
}: {
  label: string; value: string; note: string;
  editKey: EditField; editing: EditField;
  onEdit: () => void; onSave: (v: string) => void; onCancel: () => void;
}) {
  const [val, setVal] = React.useState(value);
  React.useEffect(() => { setVal(value); }, [value]);
  const active = editing === editKey;
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        {!active && (
          <button onClick={onEdit} className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
            Edit
          </button>
        )}
      </div>
      {active ? (
        <div className="flex gap-2 items-center mt-1">
          <input
            value={val} autoFocus
            onChange={e => setVal(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl border border-indigo-300 text-[12px] outline-none focus:ring-2 focus:ring-indigo-100 bg-white font-mono"
          />
          <button onClick={() => onSave(val)} className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition-colors">Save</button>
          <button onClick={onCancel} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition-colors">Cancel</button>
        </div>
      ) : (
        <p className="font-mono text-[13px] text-slate-800 mt-1">{value}</p>
      )}
      <p className="text-[10px] text-slate-400 mt-1">{note}</p>
    </div>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────

function IdentityDetail({
  identity, onBack, onRefresh,
}: { identity: ProjectIdentity; onBack: () => void; onRefresh: () => void }) {
  const [editing, setEditing] = useState<EditField>(null);

  const save = useCallback((field: EditField, value: string) => {
    if (!value.trim()) return;
    if (field === "domain") updateInternalDomain(identity.projectId, value.trim());
    if (field === "email")  updateInternalEmail(identity.projectId, value.trim());
    if (field === "phone")  updateInternalPhoneId(identity.projectId, value.trim());
    setEditing(null);
    onRefresh();
  }, [identity.projectId, onRefresh]);

  const ss = identity.subdomainStatus;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100 bg-white">
        <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors text-[13px]">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-slate-900 truncate">{identity.projectName}</p>
          <p className="text-[11px] text-slate-400">Identity Package</p>
        </div>
        <Badge text={identity.status === "active" ? "Active" : "Archived"} variant={identity.status === "active" ? "green" : "slate"} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <FieldRow label="Internal Domain"   value={identity.internalDomain}  note="Internal only — not reachable via public DNS."  editKey="domain" editing={editing} onEdit={() => setEditing("domain")} onSave={v => save("domain", v)} onCancel={() => setEditing(null)} />
          <FieldRow label="Internal Email"    value={identity.internalEmail}   note="Used for AI interactions, notifications, and internal messaging."  editKey="email"  editing={editing} onEdit={() => setEditing("email")}  onSave={v => save("email", v)}  onCancel={() => setEditing(null)} />
          <FieldRow label="Internal Phone ID" value={identity.internalPhoneId} note="Not a real phone number. Used for internal chat and project alerts." editKey="phone"  editing={editing} onEdit={() => setEditing("phone")}  onSave={v => save("phone", v)}  onCancel={() => setEditing(null)} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[13px] font-bold text-slate-900">Public Subdomain</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Optional. Requires explicit approval — purely preparatory metadata until then.</p>
            </div>
            <Badge text={subLabel(ss)} variant={subVariant(ss)} />
          </div>
          <p className="font-mono text-[12px] text-slate-600 mb-3">{identity.publicSubdomain || "-"}</p>
          {ss === "none" && (
            <button onClick={() => { proposePublicSubdomain(identity.projectId); onRefresh(); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-[12px] font-semibold hover:bg-slate-200 transition-colors border border-slate-200">
              Propose public subdomain
            </button>
          )}
          {ss === "pending" && (
            <div className="flex gap-2">
              <button onClick={() => { approvePublicSubdomain(identity.projectId); onRefresh(); }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 transition-colors">
                Approve
              </button>
              <button onClick={() => { declinePublicSubdomain(identity.projectId); onRefresh(); }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[12px] font-bold hover:bg-slate-200 transition-colors">
                Decline
              </button>
            </div>
          )}
          {(ss === "approved" || ss === "declined") && (
            <button onClick={() => { proposePublicSubdomain(identity.projectId); onRefresh(); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-[12px] font-semibold hover:bg-slate-200 transition-colors border border-slate-200 mt-1">
              Re-propose
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main list view ────────────────────────────────────────────────────────────

export function IdentityManagerApp() {
  const [identities, setIdentities] = useState<ProjectIdentity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch]         = useState("");

  const refresh = useCallback(() => {
    setIdentities(getAllIdentities().filter(i => i.status === "active"));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const detail   = identities.find(i => i.id === selectedId) ?? null;
  const filtered = identities.filter(i =>
    !search ||
    i.projectName.toLowerCase().includes(search.toLowerCase()) ||
    i.internalDomain.includes(search)
  );

  if (detail) {
    return (
      <div className="h-full bg-slate-50">
        <IdentityDetail identity={detail} onBack={() => setSelectedId(null)} onRefresh={() => { refresh(); setSelectedId(null); }} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">Identity Manager</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">Internal identity packages — domain, email, and phone ID for every project.</p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {identities.length} {identities.length === 1 ? "package" : "packages"}
          </span>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects or domains…"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-colors bg-white"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🪪</div>
            <p className="text-[14px] font-semibold text-slate-600">No identity packages yet</p>
            <p className="text-[12px] mt-1 text-slate-400 max-w-xs mx-auto">
              Identities auto-generate when projects are created via ensureIdentityForProject().
            </p>
          </div>
        )}
        {filtered.map(id => (
          <button key={id.id} onClick={() => setSelectedId(id.id)}
            className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">{id.projectName}</p>
                <p className="font-mono text-[11px] text-slate-500 mt-1 truncate">{id.internalDomain}</p>
                <p className="font-mono text-[11px] text-slate-400 truncate">{id.internalEmail}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge text={id.internalPhoneId} variant="indigo" />
                {id.subdomainStatus !== "none" && (
                  <Badge text={subLabel(id.subdomainStatus)} variant={subVariant(id.subdomainStatus)} />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}`;

  // ── File 4: OSContext.tsx (4 change sites, shown as focused snippets) ──────
  const osContextBefore =
`// ── CHANGE 1 OF 4: AppId union — add "identityManager" after "builder" ───────
  | "metricsPanel" | "integrationDashboard"
  | "builder";

// ── CHANGE 2 OF 4: DEFAULT_APPS — add identityManager entry after builder ─────
  { id: "builder",         label: "Builder Space",    icon: "🔧", color: "#4f46e5", description: "In-platform code review IDE — every proposed change is shown here for review before anything applies", category: "system" },
];

// ── CHANGE 3 OF 4: INTENT_MAP — add identityManager route after builder ────────
  { keywords: ["builder", "builder space", "code review", "review change", "apply proposal", "diff", "file tree", "preview change", "pending proposal", "code proposal"], target: "builder" },

// ── CHANGE 4 OF 4: APP_META — add identityManager entry after builder ──────────
  builder:                { icon: "🔧", label: "Builder Space" },`;

  const osContextAfter =
`// ── CHANGE 1 OF 4: AppId union — "identityManager" added ────────────────────
  | "metricsPanel" | "integrationDashboard"
  | "builder"
  | "identityManager";

// ── CHANGE 2 OF 4: DEFAULT_APPS — identityManager entry added ────────────────
  { id: "builder",         label: "Builder Space",    icon: "🔧", color: "#4f46e5", description: "In-platform code review IDE — every proposed change is shown here for review before anything applies", category: "system" },
  { id: "identityManager", label: "Identity Manager", icon: "🪪", color: "#4f46e5", description: "View and manage internal identity packages — internal domain, email, and phone ID for every project", category: "system" },
];

// ── CHANGE 3 OF 4: INTENT_MAP — identityManager route added ──────────────────
  { keywords: ["builder", "builder space", "code review", "review change", "apply proposal", "diff", "file tree", "preview change", "pending proposal", "code proposal"], target: "builder" },
  { keywords: ["identity", "identity manager", "internal domain", "internal email", "phone id", "project identity", "cai domain", "mail createai", "createai domain"], target: "identityManager" },

// ── CHANGE 4 OF 4: APP_META — identityManager entry added ────────────────────
  builder:                { icon: "🔧", label: "Builder Space" },
  identityManager:        { icon: "🪪", label: "Identity Manager" },`;

  // ── File 5: AppWindow.tsx (2 change sites) ─────────────────────────────────
  const appWindowBefore =
`// ── CHANGE 1 OF 2: lazy import — add IdentityManagerApp after BuilderSpaceApp ─
const BuilderSpaceApp    = React.lazy(() => import("@/Apps/BuilderSpaceApp").then(m => ({ default: m.BuilderSpaceApp })));

// ── CHANGE 2 OF 2: registry — add identityManager after builder ───────────────
  builder:           BuilderSpaceApp,
};`;

  const appWindowAfter =
`// ── CHANGE 1 OF 2: lazy import — IdentityManagerApp added ───────────────────
const BuilderSpaceApp    = React.lazy(() => import("@/Apps/BuilderSpaceApp").then(m => ({ default: m.BuilderSpaceApp })));
const IdentityManagerApp = React.lazy(() => import("@/Apps/IdentityManagerApp").then(m => ({ default: m.IdentityManagerApp })));

// ── CHANGE 2 OF 2: registry — identityManager added ──────────────────────────
  builder:           BuilderSpaceApp,
  identityManager:   IdentityManagerApp,
};`;

  // ── Assemble proposal ──────────────────────────────────────────────────────
  const proposal: BuilderProposal = {
    id:          "identity-engine-v1",
    title:       "Internal Identity Engine",
    description: "Auto-generates an internal identity package (domain, email, phone ID) for every project. Fully internal — public subdomain is opt-in only and never auto-deployed. 3 new files + OS wiring for review.",
    source:      "ai",
    tags:        ["Identity", "Routing", "Platform", "Internal"],
    status:      "pending",
    createdAt:   Date.now(),
    files: [
      {
        path:            "src/engine/IdentityEngine.ts",
        language:        "ts",
        status:          "new",
        originalContent: "",
        proposedContent: identityEngineTs,
      },
      {
        path:            "src/services/IdentityRouting.ts",
        language:        "ts",
        status:          "new",
        originalContent: "",
        proposedContent: identityRoutingTs,
      },
      {
        path:            "src/Apps/IdentityManagerApp.tsx",
        language:        "tsx",
        status:          "new",
        originalContent: "",
        proposedContent: identityManagerAppTsx,
      },
      {
        path:            "src/os/OSContext.tsx",
        language:        "tsx",
        status:          "modified",
        originalContent: osContextBefore,
        proposedContent: osContextAfter,
      },
      {
        path:            "src/os/AppWindow.tsx",
        language:        "tsx",
        status:          "modified",
        originalContent: appWindowBefore,
        proposedContent: appWindowAfter,
      },
    ],
  };

  all.unshift(proposal);
  persist(all);
}

// ─── Demo proposal ────────────────────────────────────────────────────────────
// Seeds one sample proposal so the Builder Space is never empty on first visit.

export function seedDemoProposal(): void {
  const all = load();
  if (all.some(p => p.id === "demo-builder-shortcuts")) return;

  const sample: BuilderProposal = {
    id:          "demo-builder-shortcuts",
    title:       "Keyboard Shortcuts Reference Panel",
    description: "Adds a ⌘K-style shortcuts reference panel inside Settings. Shows all platform shortcuts with search and category filter. Zero impact on any existing functionality.",
    source:      "ai",
    status:      "pending",
    createdAt:   Date.now(),
    tags:        ["UX", "Accessibility", "Settings"],
    files: [
      {
        path:     "src/components/ShortcutsPanel.tsx",
        language: "tsx",
        status:   "new",
        originalContent: "",
        proposedContent:
`import React, { useState } from "react";

const SHORTCUTS = [
  { cat: "Navigation", key: "⌘ K",   label: "Open Command Palette" },
  { cat: "Navigation", key: "⌘ /",   label: "Search All Apps" },
  { cat: "Navigation", key: "⌘ ←",   label: "Back" },
  { cat: "Editor",     key: "⌘ S",   label: "Save Current Output" },
  { cat: "Editor",     key: "⌘ ↵",   label: "Run Engine" },
  { cat: "Editor",     key: "⌘ Z",   label: "Undo Last Change" },
  { cat: "System",     key: "⌘ ,",   label: "Open Settings" },
  { cat: "System",     key: "⌘ W",   label: "Close Active App" },
  { cat: "System",     key: "Esc",   label: "Dismiss Modal / Panel" },
];

export function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = SHORTCUTS.filter(s =>
    s.label.toLowerCase().includes(query.toLowerCase()) ||
    s.key.toLowerCase().includes(query.toLowerCase())
  );
  const categories = [...new Set(filtered.map(s => s.cat))];

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-[13px] font-bold text-slate-900">Keyboard Shortcuts</h3>
        <button onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400
                     hover:text-slate-700 hover:bg-slate-100 transition-colors text-sm">
          ✕
        </button>
      </div>
      <div className="px-4 pb-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search shortcuts…"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-[12px] outline-none
                     focus:border-indigo-400 transition-colors"
        />
      </div>
      <div className="px-2 pb-4 space-y-3">
        {categories.map(cat => (
          <div key={cat}>
            <p className="px-2 mb-1 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">{cat}</p>
            {filtered.filter(s => s.cat === cat).map((s, i) => (
              <div key={i}
                className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-[12px] text-slate-700">{s.label}</span>
                <kbd className="px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-mono font-bold text-slate-700
                                border border-slate-200">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}`,
      },
      {
        path:     "src/Apps/AdminApp.tsx",
        language: "tsx",
        status:   "modified",
        originalContent:
`// AdminApp — platform settings & control
export function AdminApp() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-500 mt-1">Platform configuration and control.</p>
      {/* Settings panels */}
    </div>
  );
}`,
        proposedContent:
`// AdminApp — platform settings & control
import { useState } from "react";
import { ShortcutsPanel } from "@/components/ShortcutsPanel";

export function AdminApp() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <button
          onClick={() => setShowShortcuts(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold
                     bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200">
          <span>⌘</span>
          <span>Shortcuts</span>
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-3">Platform configuration and control.</p>
      {showShortcuts && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}
      {/* Settings panels */}
    </div>
  );
}`,
      },
    ],
  };

  all.unshift(sample);
  persist(all);
}
