/**
 * virtualInternet/types.ts
 *
 * ─── WHAT THIS IS ────────────────────────────────────────────────────────────
 * Types for the Virtual Internet Layer — an internal addressing system that
 * lives entirely inside this app's runtime. Nothing here touches DNS, ICANN,
 * Namecheap, or any external network.
 *
 * ─── SEPARATION FROM THE REAL INTERNET ──────────────────────────────────────
 * REAL:    https://www.createai.digital   → handled by DNS + browser + server
 * VIRTUAL: family://home, sara.family     → handled only by this module
 *
 * Virtual addresses are strings parsed and resolved entirely in TypeScript.
 * They are never sent over the network. No fetch(), no XHR, no DNS lookup.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Supported virtual schemes ─────────────────────────────────────────────────
export type VirtualScheme = "family" | "universe" | "work" | "bank" | "kids";

// ── A virtual address, e.g. "family://home" or "universe://hub" ───────────────
export type VirtualAddress = `${VirtualScheme}://${string}`;

// ── What the router returns after resolving a virtual address ─────────────────
export interface RouteResolution {
  /** The real app path (Wouter route) this virtual address maps to. */
  path: string;
  /** Whether the target route requires the user to be authenticated. */
  requiresAuth: boolean;
  /** The minimum role required to access this route, if any. */
  role?: "founder" | "admin" | "parent" | "member" | "child" | "guest";
  /** The original virtual address that was resolved. */
  virtualAddress: VirtualAddress;
}

// ── Result type — either a successful resolution or an error ──────────────────
export type ResolveResult =
  | { ok: true;  resolution: RouteResolution }
  | { ok: false; error: "UNKNOWN_SCHEME" | "UNKNOWN_PATH" | "PERMISSION_DENIED" | "INVALID_ADDRESS" };

// ── A single route definition in the virtual routing table ───────────────────
export interface VirtualRoute {
  scheme:       VirtualScheme;
  virtualPath:  string;          // e.g. "home", "bank", "gallery"
  realPath:     string;          // e.g. "/app/home"
  requiresAuth: boolean;
  role?:        RouteResolution["role"];
  description?: string;
}

// ── A virtual domain registration ────────────────────────────────────────────
export interface VirtualDomain {
  /** The virtual domain label, e.g. "sara.family" or "kids.universe". */
  label: string;
  /** The default virtual address this domain navigates to. */
  defaultAddress: VirtualAddress;
  /** The role that owns this virtual domain. */
  role?: RouteResolution["role"];
  /** Optional display name for UI. */
  displayName?: string;
  /** Optional theme key for layout/color preferences. */
  theme?: string;
}
