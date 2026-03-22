// ===============================
// VIRTUAL INTERNET LAYER
// One-file drop-in system
// Safe • Internal • Router-agnostic
// ===============================

// ---------------------------------------
// 1. Virtual URL parsing (family://home)
// ---------------------------------------
export type VirtualScheme = "family" | "universe";

export interface VirtualUrl {
  scheme: VirtualScheme;
  path: string;
}

export function parseVirtualUrl(input: string): VirtualUrl | null {
  const match = /^([a-zA-Z0-9_-]+):\/\/(.+)$/.exec(input.trim());
  if (!match) return null;

  const scheme = match[1] as VirtualScheme;
  const path = match[2];

  if (scheme !== "family" && scheme !== "universe") return null;

  return { scheme, path };
}

export function formatVirtualUrl(v: VirtualUrl): string {
  return `${v.scheme}://${v.path}`;
}

// ---------------------------------------
// 2. Virtual route table
// Maps virtual URLs → real app paths
// ---------------------------------------
export interface VirtualRouteResolution {
  path: string;
  requiresAuth: boolean;
  role?: string;
}

const virtualRouteTable: Record<string, VirtualRouteResolution> = {
  "family://home":     { path: "/app/home",    requiresAuth: true },
  "family://bank":     { path: "/app/bank",    requiresAuth: true, role: "parent" },
  "family://create":   { path: "/app/create",  requiresAuth: true },
  "family://gallery":  { path: "/app/gallery", requiresAuth: true },
  "family://messages": { path: "/app/messages",requiresAuth: true },

  "universe://hub":    { path: "/app/universe/hub",   requiresAuth: true },
  "universe://games":  { path: "/app/universe/games", requiresAuth: true },
};

export function resolveVirtualUrl(v: VirtualUrl): VirtualRouteResolution | null {
  const key = `${v.scheme}://${v.path}`;
  return virtualRouteTable[key] ?? null;
}

export function registerVirtualRoute(
  v: VirtualUrl,
  resolution: VirtualRouteResolution
) {
  const key = `${v.scheme}://${v.path}`;
  virtualRouteTable[key] = resolution;
}

// ---------------------------------------
// 3. Virtual domain registry
// sara.family → default virtual address
// kids.universe → default virtual address
// ---------------------------------------
export interface VirtualDomainConfig {
  id: string;
  defaultAddress: VirtualUrl;
  allowedRoles?: string[];
  theme?: "default" | "kids" | "parent" | "universe";
}

const domainRegistry = new Map<string, VirtualDomainConfig>();

domainRegistry.set("sara.family", {
  id: "sara.family",
  defaultAddress: { scheme: "family", path: "home" },
  allowedRoles: ["parent"],
  theme: "parent",
});

domainRegistry.set("kids.universe", {
  id: "kids.universe",
  defaultAddress: { scheme: "universe", path: "games" },
  allowedRoles: ["kid"],
  theme: "kids",
});

export function getVirtualDomain(id: string): VirtualDomainConfig | undefined {
  return domainRegistry.get(id);
}

export function registerVirtualDomain(config: VirtualDomainConfig) {
  domainRegistry.set(config.id, config);
}

// ---------------------------------------
// 4. Navigation API (router-agnostic)
// Returns the real path + auth info
// Your app plugs this into its router
// ---------------------------------------
export interface NavigationResult {
  success: boolean;
  reason?: string;
  path?: string;
  requiresAuth?: boolean;
  role?: string;
}

export function navigateToVirtualAddress(
  virtualAddress: string
): NavigationResult {
  const parsed = parseVirtualUrl(virtualAddress);
  if (!parsed) return { success: false, reason: "INVALID_VIRTUAL_URL" };

  const resolution = resolveVirtualUrl(parsed);
  if (!resolution) return { success: false, reason: "NO_ROUTE_FOUND" };

  return {
    success: true,
    path: resolution.path,
    requiresAuth: resolution.requiresAuth,
    role: resolution.role,
  };
}

// ---------------------------------------
// 5. Example usage (router-agnostic)
// ---------------------------------------
// const result = navigateToVirtualAddress("family://bank");
// if (result.success) {
//   // yourRouter.navigate(result.path);
// }
