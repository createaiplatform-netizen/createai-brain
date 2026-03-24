// ============================================================
// FILE: src/universe/internalAddressing.ts
// Internal Addressing — domain lookup utilities
// ============================================================

import { internalDomains } from "./internalDomainEngine";

export function getDomainById(id: string) {
  return internalDomains.find(d => d.id === id) || null;
}

export function listDomains() {
  return internalDomains;
}
