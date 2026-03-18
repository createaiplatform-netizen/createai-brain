// ═══════════════════════════════════════════════════════════════════════════
// OutputVaultService — auto-saves every engine output with full metadata.
//
// Every call to contextStore.recordOutput() flows here automatically.
// Storage: localStorage under "cai_vault" — instant, zero-cost, local.
// Capacity: 200 entries max. Oldest unpinned entries are evicted first.
// ═══════════════════════════════════════════════════════════════════════════

const LS_KEY   = "cai_vault_entries";
const MAX_SIZE = 200;

export interface VaultEntry {
  id:          string;
  engineId:    string;
  engineName:  string;
  topic:       string;
  text:        string;
  wordCount:   number;
  pinned:      boolean;
  tags:        string[];
  projectId:   string | null;
  createdAt:   number;          // unix ms
}

// ── Persistence ───────────────────────────────────────────────────────────────

function readAll(): VaultEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as VaultEntry[]) : [];
  } catch { return []; }
}

function writeAll(entries: VaultEntry[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entries)); } catch { /* quota */ }
}

function generateId(): string {
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function vaultAdd(
  engineId: string,
  engineName: string,
  topic: string,
  text: string,
  meta?: { projectId?: string | null; tags?: string[] },
): VaultEntry {
  const entry: VaultEntry = {
    id:         generateId(),
    engineId,
    engineName,
    topic:      topic.trim(),
    text:       text.trim(),
    wordCount:  text.trim().split(/\s+/).filter(Boolean).length,
    pinned:     false,
    tags:       meta?.tags ?? [],
    projectId:  meta?.projectId ?? null,
    createdAt:  Date.now(),
  };

  let entries = readAll();
  entries.unshift(entry);

  // Evict oldest unpinned if over limit
  if (entries.length > MAX_SIZE) {
    const pinned   = entries.filter(e => e.pinned);
    const unpinned = entries.filter(e => !e.pinned);
    const trimmed  = unpinned.slice(0, MAX_SIZE - pinned.length);
    entries = [...pinned, ...trimmed].sort((a, b) => b.createdAt - a.createdAt);
  }

  writeAll(entries);
  return entry;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function vaultGetAll(): VaultEntry[] {
  return readAll();
}

export function vaultSearch(query: string): VaultEntry[] {
  if (!query.trim()) return readAll();
  const q = query.toLowerCase();
  return readAll().filter(e =>
    e.topic.toLowerCase().includes(q) ||
    e.engineName.toLowerCase().includes(q) ||
    e.text.toLowerCase().includes(q) ||
    e.tags.some(t => t.toLowerCase().includes(q)),
  );
}

export function vaultGetByEngine(engineId: string): VaultEntry[] {
  return readAll().filter(e => e.engineId === engineId);
}

export function vaultGetPinned(): VaultEntry[] {
  return readAll().filter(e => e.pinned);
}

export function vaultGetRecent(limit = 20): VaultEntry[] {
  return readAll().slice(0, limit);
}

export function vaultStats(): { total: number; pinned: number; engines: number; wordCount: number } {
  const all     = readAll();
  const engines = new Set(all.map(e => e.engineId)).size;
  const wc      = all.reduce((sum, e) => sum + e.wordCount, 0);
  return { total: all.length, pinned: all.filter(e => e.pinned).length, engines, wordCount: wc };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function vaultPin(id: string, pinned: boolean): void {
  const entries = readAll().map(e => e.id === id ? { ...e, pinned } : e);
  writeAll(entries);
}

export function vaultTag(id: string, tags: string[]): void {
  const entries = readAll().map(e => e.id === id ? { ...e, tags } : e);
  writeAll(entries);
}

export function vaultDelete(id: string): void {
  writeAll(readAll().filter(e => e.id !== id));
}

export function vaultClear(keepPinned = true): void {
  writeAll(keepPinned ? readAll().filter(e => e.pinned) : []);
}
