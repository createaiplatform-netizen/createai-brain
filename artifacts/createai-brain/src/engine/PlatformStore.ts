// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM STORE — Shared localStorage-backed state across all apps
// Holds: platform users, platform mode, recent activity
// ═══════════════════════════════════════════════════════════════════════════

export type PlatformMode = "DEMO" | "TEST" | "LIVE";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  tags: string[];
  status: "Active" | "Invited" | "Pending";
  addedAt: string;
  createdBy?: string;
}

export interface RecentActivity {
  id: string;
  appId: string;
  label: string;
  icon: string;
  at: string;
}

// ─── Keys ──────────────────────────────────────────────────────────────────
const MODE_KEY    = "cai_platform_mode_v1";
const USERS_KEY   = "cai_platform_users_v1";
const RECENT_KEY  = "cai_platform_recent_v1";

// ─── Helpers ───────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ─── Default seed users ────────────────────────────────────────────────────
const SEED_USERS: PlatformUser[] = [
  {
    id: "u1", name: "Sara Stadler", email: "sara@createai.app", phone: "555-0100",
    role: "Founder", tags: ["founder", "creator", "admin"], status: "Active",
    addedAt: new Date().toISOString(), createdBy: "system",
  },
  {
    id: "u2", name: "Jake S.", email: "jake@example.com", phone: "555-0101",
    role: "Creator", tags: ["funny", "outdoorsy", "fishing"], status: "Invited",
    addedAt: new Date().toISOString(), createdBy: "sara",
  },
  {
    id: "u3", name: "Maria L.", email: "maria@example.com", phone: "555-0102",
    role: "Viewer", tags: ["bilingual", "adventurous"], status: "Active",
    addedAt: new Date().toISOString(), createdBy: "sara",
  },
];

// ─── PlatformStore singleton ───────────────────────────────────────────────
class PlatformStoreClass {

  // ── Mode ──────────────────────────────────────────────────────────────────
  getMode(): PlatformMode {
    return load<PlatformMode>(MODE_KEY, "DEMO");
  }

  setMode(mode: PlatformMode) {
    save(MODE_KEY, mode);
    window.dispatchEvent(new CustomEvent("cai:mode-change", { detail: mode }));
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  getUsers(): PlatformUser[] {
    const stored = load<PlatformUser[]>(USERS_KEY, []);
    if (stored.length === 0) {
      save(USERS_KEY, SEED_USERS);
      return SEED_USERS;
    }
    return stored;
  }

  addUser(user: Omit<PlatformUser, "id" | "addedAt">): PlatformUser {
    const newUser: PlatformUser = {
      ...user,
      id: `u_${Date.now()}`,
      addedAt: new Date().toISOString(),
    };
    const users = this.getUsers();
    const updated = [...users, newUser];
    save(USERS_KEY, updated);
    window.dispatchEvent(new CustomEvent("cai:users-change"));
    return newUser;
  }

  updateUserStatus(id: string, status: PlatformUser["status"]) {
    const users = this.getUsers().map(u =>
      u.id === id ? { ...u, status } : u
    );
    save(USERS_KEY, users);
    window.dispatchEvent(new CustomEvent("cai:users-change"));
  }

  removeUser(id: string) {
    const users = this.getUsers().filter(u => u.id !== id && u.name !== "Sara Stadler");
    save(USERS_KEY, users);
    window.dispatchEvent(new CustomEvent("cai:users-change"));
  }

  // ── Recent Activity ───────────────────────────────────────────────────────
  getRecent(): RecentActivity[] {
    return load<RecentActivity[]>(RECENT_KEY, []);
  }

  pushRecent(activity: Omit<RecentActivity, "id" | "at">) {
    const existing = this.getRecent();
    const deduped = existing.filter(r => r.appId !== activity.appId);
    const updated = [
      { ...activity, id: `r_${Date.now()}`, at: new Date().toISOString() },
      ...deduped,
    ].slice(0, 8);
    save(RECENT_KEY, updated);
  }

  // ── Invite link generator ─────────────────────────────────────────────────
  generateInviteLink(forName: string): string {
    const base = window.location.origin + (window.location.pathname.replace(/\/$/, ""));
    const code = btoa(`invite:${forName}:${Date.now()}`).replace(/=/g, "");
    return `${base}?invite=${code}`;
  }

  generateInviteMessage(name: string, role: string, link: string): string {
    return `Hi ${name}! 👋

You've been personally invited to join CreateAI Brain — a full AI-powered platform built to help you create, collaborate, and grow.

What you'll have access to:
• Your own AI Chat (powered by the Brain)
• Project workspace — create anything
• Marketing + content tools
• Documents, forms, and more
• Your personalized profile and settings

Your invite link:
${link}

Your role: ${role}
This link is just for you — tap to open your dashboard and get started.

Excited to have you on the platform!
— Sara & the CreateAI Brain Team

⚠️ Platform is currently in ${this.getMode()} mode. No real financial transactions or clinical actions are enabled.`;
  }
}

export const PlatformStore = new PlatformStoreClass();
