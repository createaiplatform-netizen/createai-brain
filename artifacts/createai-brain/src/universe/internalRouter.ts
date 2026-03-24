// ============================================================
// FILE: src/universe/internalRouter.ts
// Internal Router — resolves entity role to internal domain
// ============================================================

import { internalDomains } from "./internalDomainEngine";

export function resolveInternalDomain(ctx: { role?: string }): string {
  if (ctx.role === "child")                              return "kids.world";
  if (ctx.role === "parent" || ctx.role === "partner")  return "family.home";
  return "sara.core";
}

export { internalDomains };
