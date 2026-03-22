/**
 * virtualInternet/router.ts
 *
 * ─── WHAT THIS IS ────────────────────────────────────────────────────────────
 * Internal router for the Virtual Internet Layer. Accepts a virtual address
 * string like "family://home" and maps it to a real Wouter route like "/app/home".
 *
 * This is a pure TypeScript module — no network calls, no DNS, no browser
 * navigation. It only transforms strings and checks permission rules.
 *
 * ─── HOW TO ADD A NEW VIRTUAL ROUTE ─────────────────────────────────────────
 * Add an entry to VIRTUAL_ROUTES below. That's it. No other file changes needed.
 *
 * Example:
 *   {
 *     scheme:       "family",
 *     virtualPath:  "calendar",
 *     realPath:     "/app/family/calendar",
 *     requiresAuth: true,
 *     role:         "member",
 *     description:  "Family shared calendar",
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  VirtualAddress,
  VirtualRoute,
  RouteResolution,
  ResolveResult,
  VirtualScheme,
} from "./types";

// ── Virtual routing table ─────────────────────────────────────────────────────
// This is the single source of truth for all virtual → real path mappings.
// Add new routes here only. Do not create parallel tables elsewhere.
export const VIRTUAL_ROUTES: VirtualRoute[] = [
  // ── family:// scheme ──────────────────────────────────────────────────────
  { scheme: "family", virtualPath: "home",     realPath: "/app/home",             requiresAuth: true,  role: "member",  description: "Family home hub" },
  { scheme: "family", virtualPath: "bank",     realPath: "/app/family/bank",      requiresAuth: true,  role: "parent",  description: "Family virtual bank (VIRTUAL ONLY — not a real bank)" },
  { scheme: "family", virtualPath: "create",   realPath: "/app/family/create",    requiresAuth: true,  role: "member",  description: "Family creation studio" },
  { scheme: "family", virtualPath: "gallery",  realPath: "/app/family/gallery",   requiresAuth: true,  role: "member",  description: "Family media gallery" },
  { scheme: "family", virtualPath: "messages", realPath: "/app/family/messages",  requiresAuth: true,  role: "member",  description: "Family messaging" },
  { scheme: "family", virtualPath: "habits",   realPath: "/app/family/habits",    requiresAuth: true,  role: "member",  description: "Family habit tracker" },
  { scheme: "family", virtualPath: "journal",  realPath: "/app/family/journal",   requiresAuth: true,  role: "member",  description: "Family journal" },
  { scheme: "family", virtualPath: "events",   realPath: "/app/family/events",    requiresAuth: true,  role: "member",  description: "Family life events" },

  // ── universe:// scheme ────────────────────────────────────────────────────
  { scheme: "universe", virtualPath: "hub",      realPath: "/app/universe",          requiresAuth: true,  role: "member",  description: "Universe hub" },
  { scheme: "universe", virtualPath: "admin",    realPath: "/app/universe/admin",    requiresAuth: true,  role: "admin",   description: "Universe admin view" },
  { scheme: "universe", virtualPath: "family",   realPath: "/app/universe/family",   requiresAuth: true,  role: "member",  description: "Universe family view" },
  { scheme: "universe", virtualPath: "kids",     realPath: "/app/universe/kids",     requiresAuth: true,  role: "child",   description: "Universe kids zone" },
  { scheme: "universe", virtualPath: "customer", realPath: "/app/universe/customer", requiresAuth: true,  role: "guest",   description: "Universe customer view" },

  // ── work:// scheme ────────────────────────────────────────────────────────
  { scheme: "work", virtualPath: "dashboard", realPath: "/command-center",        requiresAuth: true,  role: "admin",   description: "Platform command center" },
  { scheme: "work", virtualPath: "analytics", realPath: "/analytics",             requiresAuth: true,  role: "admin",   description: "Platform analytics" },
  { scheme: "work", virtualPath: "team",      realPath: "/team",                  requiresAuth: true,  role: "admin",   description: "Team management" },
  { scheme: "work", virtualPath: "settings",  realPath: "/settings",              requiresAuth: true,  role: "founder", description: "Platform settings" },
  { scheme: "work", virtualPath: "billing",   realPath: "/billing",               requiresAuth: true,  role: "founder", description: "Billing & subscriptions" },

  // ── bank:// scheme ────────────────────────────────────────────────────────
  // NOTE: FamilyBank is VIRTUAL ONLY. No real money. No real bank account.
  { scheme: "bank", virtualPath: "home",         realPath: "/app/family/bank",           requiresAuth: true, role: "parent",  description: "FamilyBank home (VIRTUAL — no real money)" },
  { scheme: "bank", virtualPath: "transactions", realPath: "/app/family/bank/history",   requiresAuth: true, role: "parent",  description: "FamilyBank transaction history" },
  { scheme: "bank", virtualPath: "goals",        realPath: "/app/family/bank/goals",     requiresAuth: true, role: "member",  description: "FamilyBank savings goals" },

  // ── kids:// scheme ────────────────────────────────────────────────────────
  { scheme: "kids", virtualPath: "home",    realPath: "/kids",                  requiresAuth: true,  role: "child",   description: "Kids home zone" },
  { scheme: "kids", virtualPath: "habits",  realPath: "/kids/habits",           requiresAuth: true,  role: "child",   description: "Kids habit tracker" },
  { scheme: "kids", virtualPath: "create",  realPath: "/kids/create",           requiresAuth: true,  role: "child",   description: "Kids creation studio" },
];

// ── Role hierarchy — higher index = more privileged ──────────────────────────
const ROLE_LEVEL: Record<NonNullable<RouteResolution["role"]>, number> = {
  guest:   0,
  child:   1,
  member:  2,
  parent:  3,
  admin:   4,
  founder: 5,
};

/**
 * Returns true if the caller's role meets or exceeds the required role.
 * If no role is required, always returns true.
 */
function hasPermission(
  callerRole: RouteResolution["role"] | undefined,
  requiredRole: RouteResolution["role"] | undefined,
): boolean {
  if (!requiredRole) return true;
  if (!callerRole)   return false;
  return ROLE_LEVEL[callerRole] >= ROLE_LEVEL[requiredRole];
}

/**
 * parseVirtualAddress
 *
 * Splits "family://home" into { scheme: "family", path: "home" }.
 * Returns null if the string is not a valid virtual address format.
 *
 * This is NOT a URL parser. It does not validate hostnames, ports, or
 * query strings. It only handles the app's internal scheme://path format.
 */
export function parseVirtualAddress(
  address: string,
): { scheme: VirtualScheme; path: string } | null {
  const match = address.match(/^([a-z]+):\/\/([a-z0-9\-/]*)$/);
  if (!match) return null;
  const [, scheme, path] = match;
  const knownSchemes: VirtualScheme[] = ["family", "universe", "work", "bank", "kids"];
  if (!knownSchemes.includes(scheme as VirtualScheme)) return null;
  return { scheme: scheme as VirtualScheme, path: path || "" };
}

/**
 * resolveVirtualAddress
 *
 * Core router function. Accepts a virtual address and the caller's current role,
 * returns a RouteResolution (real Wouter path + auth/permission metadata)
 * or an error code.
 *
 * Usage:
 *   const result = resolveVirtualAddress("family://bank", "parent");
 *   if (result.ok) navigate(result.resolution.path);
 *
 * @param address    Virtual address, e.g. "family://home"
 * @param callerRole The authenticated user's role. Pass undefined for guests.
 */
export function resolveVirtualAddress(
  address: string,
  callerRole?: RouteResolution["role"],
): ResolveResult {
  const parsed = parseVirtualAddress(address);
  if (!parsed) {
    return { ok: false, error: "INVALID_ADDRESS" };
  }

  const { scheme, path } = parsed;

  const route = VIRTUAL_ROUTES.find(
    (r) => r.scheme === scheme && r.virtualPath === path,
  );

  if (!route) {
    return { ok: false, error: "UNKNOWN_PATH" };
  }

  if (!hasPermission(callerRole, route.role)) {
    return { ok: false, error: "PERMISSION_DENIED" };
  }

  return {
    ok: true,
    resolution: {
      path:           route.realPath,
      requiresAuth:   route.requiresAuth,
      role:           route.role,
      virtualAddress: address as VirtualAddress,
    },
  };
}

/**
 * listRoutes
 *
 * Returns all virtual routes, optionally filtered by scheme.
 * Useful for building nav menus or debug panels.
 */
export function listRoutes(scheme?: VirtualScheme): VirtualRoute[] {
  if (scheme) return VIRTUAL_ROUTES.filter((r) => r.scheme === scheme);
  return [...VIRTUAL_ROUTES];
}
