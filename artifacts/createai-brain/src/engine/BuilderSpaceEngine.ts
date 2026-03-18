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
