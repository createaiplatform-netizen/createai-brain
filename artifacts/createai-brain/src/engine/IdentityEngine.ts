// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY ENGINE
// Auto-generates and manages identity packages for every project.
// All identities are internal-only. Public subdomain is opt-in metadata only.
// ═══════════════════════════════════════════════════════════════════════════

export type SubdomainStatus = "pending" | "approved" | "declined" | "none";

export interface ProjectIdentity {
  id:               string;
  projectId:        string;
  projectName:      string;
  internalDomain:   string;   // {slug}.createai
  internalEmail:    string;   // {slug}@mail.createai
  internalPhoneId:  string;   // +CAI-{SHORT}
  publicSubdomain:  string | null; // {slug}.createai.digital — metadata only
  subdomainStatus:  SubdomainStatus;
  status:           "active" | "archived";
  createdAt:        number;
  updatedAt:        number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const LS_KEY = "createai:identity-packages-v1";

function loadAll(): ProjectIdentity[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveAll(items: ProjectIdentity[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

export function normalizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/ +/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) || "project";
}

function isSlugTaken(slug: string, excludeId?: string): boolean {
  const domain = `${slug}.createai`;
  return loadAll().some(i => i.internalDomain === domain && i.id !== excludeId);
}

function makeUniqueSlug(base: string, excludeId?: string): string {
  if (!isSlugTaken(base, excludeId)) return base;
  for (let n = 2; n <= 99; n++) {
    const v = `${base}-${n}`;
    if (!isSlugTaken(v, excludeId)) return v;
  }
  return `${base}-${Date.now().toString().slice(-6)}`;
}

// ─── Best-option selector ─────────────────────────────────────────────────────

export function getBestIdentity(
  projectName: string,
  projectId?: string,
): { internalDomain: string; internalEmail: string; internalPhoneId: string; publicSubdomain: string } {
  const slug  = normalizeSlug(projectName);
  const safe  = makeUniqueSlug(slug, projectId);
  const short = (projectId ?? crypto.randomUUID()).slice(0, 8).toUpperCase();
  return {
    internalDomain:  `${safe}.createai`,
    internalEmail:   `${safe}@mail.createai`,
    internalPhoneId: `+CAI-${short}`,
    publicSubdomain: `${safe}.createai.digital`,
  };
}

// ─── Core API ─────────────────────────────────────────────────────────────────

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
}
