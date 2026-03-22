/**
 * virtualInternet/domainRegistry.ts
 *
 * ─── WHAT THIS IS ────────────────────────────────────────────────────────────
 * A registry of virtual domain labels — short, human-readable names like
 * "sara.family" or "kids.universe" that map to a default virtual address,
 * a role, and optional theme preferences.
 *
 * These labels are NOT DNS records. They are never registered with ICANN,
 * Namecheap, or any external authority. They exist only inside this app.
 *
 * ─── HOW TO REGISTER A NEW VIRTUAL DOMAIN ───────────────────────────────────
 * Call registerVirtualDomain() at startup or in your component:
 *
 *   registerVirtualDomain({
 *     label:          "dad.family",
 *     defaultAddress: "family://home",
 *     role:           "parent",
 *     displayName:    "Dad's Space",
 *     theme:          "oak",
 *   });
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { VirtualAddress, VirtualDomain } from "./types";

// ── Built-in virtual domains ──────────────────────────────────────────────────
// These are the default registrations that ship with the platform.
// Add family-specific domains at runtime using registerVirtualDomain().
const registry = new Map<string, VirtualDomain>([
  [
    "sara.family",
    {
      label:          "sara.family",
      defaultAddress: "family://home" as VirtualAddress,
      role:           "founder",
      displayName:    "Sara's Space",
      theme:          "sage",
    },
  ],
  [
    "kids.universe",
    {
      label:          "kids.universe",
      defaultAddress: "kids://home" as VirtualAddress,
      role:           "child",
      displayName:    "Kids Universe",
      theme:          "sky",
    },
  ],
  [
    "malcolm.bank",
    {
      label:          "malcolm.bank",
      // NOTE: FamilyBank is VIRTUAL ONLY. No real money. No real bank.
      defaultAddress: "bank://home" as VirtualAddress,
      role:           "child",
      displayName:    "Malcolm's Bank",
      theme:          "mint",
    },
  ],
  [
    "family.home",
    {
      label:          "family.home",
      defaultAddress: "family://home" as VirtualAddress,
      role:           "member",
      displayName:    "Family Home",
      theme:          "sage",
    },
  ],
  [
    "admin.work",
    {
      label:          "admin.work",
      defaultAddress: "work://dashboard" as VirtualAddress,
      role:           "admin",
      displayName:    "Command Center",
      theme:          "slate",
    },
  ],
]);

/**
 * registerVirtualDomain
 *
 * Add or overwrite a virtual domain in the registry.
 * Call this at app startup or when a new family member is onboarded.
 *
 * Example:
 *   registerVirtualDomain({
 *     label:          "nova.family",
 *     defaultAddress: "family://home",
 *     role:           "child",
 *     displayName:    "Nova's Space",
 *     theme:          "lavender",
 *   });
 */
export function registerVirtualDomain(domain: VirtualDomain): void {
  registry.set(domain.label, domain);
}

/**
 * lookupVirtualDomain
 *
 * Returns the VirtualDomain registered under the given label, or null.
 *
 * Example:
 *   const domain = lookupVirtualDomain("sara.family");
 *   // → { label: "sara.family", defaultAddress: "family://home", role: "founder", ... }
 */
export function lookupVirtualDomain(label: string): VirtualDomain | null {
  return registry.get(label) ?? null;
}

/**
 * listVirtualDomains
 *
 * Returns all registered virtual domains.
 * Useful for building a virtual address book or family directory UI.
 */
export function listVirtualDomains(): VirtualDomain[] {
  return [...registry.values()];
}

/**
 * unregisterVirtualDomain
 *
 * Removes a virtual domain from the registry.
 * Returns true if it existed and was removed.
 */
export function unregisterVirtualDomain(label: string): boolean {
  return registry.delete(label);
}
