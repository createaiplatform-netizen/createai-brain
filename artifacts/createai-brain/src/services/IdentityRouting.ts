// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY ROUTING SERVICE
// Resolves internal identifiers (domain / email / phoneId) → projectId.
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
 * Smart resolver — detects format automatically:
 *   {name}.createai         → domain lookup
 *   {name}@mail.createai    → email lookup
 *   +CAI-{short}            → phone ID lookup
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
}
