// ─── Role definitions for the Smart Safe Login System ─────────────────────────
// Roles: founder | admin | user | viewer | family_adult | family_child | customer
// role is a varchar in DB — no migration needed to add new values

export type AppRole =
  | "founder"
  | "admin"
  | "user"
  | "viewer"
  | "family_adult"
  | "family_child"
  | "customer";

// Where each role lands immediately after login + NDA
export const ROLE_HOME: Record<AppRole, string> = {
  founder:      "/",
  admin:        "/admin",
  user:         "/",
  viewer:       "/",
  family_adult: "/family",
  family_child: "/family/kids",
  customer:     "/dashboard",
};

// Path prefixes each role is EXPLICITLY blocked from accessing
// These checks run before the allowed list
export const ROLE_BLOCKED_PREFIXES: Record<AppRole, string[]> = {
  founder:      [],
  admin:        ["/dashboard", "/family", "/semantic-store", "/checkout"],
  user:         [],
  viewer:       [],
  family_adult: [
    "/admin", "/dashboard", "/semantic-store", "/checkout",
    "/billing", "/data", "/global-expansion", "/evolution",
    "/platform-score", "/metrics", "/above-transcend",
    "/integration-demo", "/live-sim", "/integration-live", "/integration-suite",
  ],
  family_child: [
    "/admin", "/dashboard", "/semantic-store", "/checkout",
    "/billing", "/data", "/global-expansion", "/evolution",
    "/platform-score", "/metrics", "/above-transcend",
    "/integration-demo", "/live-sim", "/integration-live", "/integration-suite",
  ],
  customer: [
    "/admin", "/family", "/semantic-store",
    "/billing", "/data", "/metrics",
  ],
};

// Return the home path for a given role (safe fallback to "/")
export function getRoleHome(role: AppRole | null | undefined): string {
  if (!role) return "/";
  return ROLE_HOME[role] ?? "/";
}

// Whether a role should auto-redirect away from "/" after login
// (founder/admin/user/viewer stay on the full OS)
export function needsRoleRedirect(role: AppRole | null | undefined): boolean {
  if (!role) return false;
  return role === "admin" || role === "family_adult" || role === "family_child" || role === "customer";
}

// Whether a role is blocked from a given path
export function isRoleBlocked(role: AppRole | null | undefined, path: string): boolean {
  if (!role) return false;
  const blocked = ROLE_BLOCKED_PREFIXES[role] ?? [];
  return blocked.some(b => path.startsWith(b));
}

// Human-readable display label per role
export const ROLE_LABEL: Record<AppRole, string> = {
  founder:      "Founder",
  admin:        "Admin",
  user:         "Team Member",
  viewer:       "Viewer",
  family_adult: "Family",
  family_child: "Kids",
  customer:     "Member",
};
