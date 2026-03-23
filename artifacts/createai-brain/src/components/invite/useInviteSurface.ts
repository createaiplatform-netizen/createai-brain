/**
 * useInviteSurface — hook that returns a registry surface by id
 * -------------------------------------------------------------
 * Usage:
 *   const surface = useInviteSurface("broadcast");
 *   if (!surface) return null;
 */

import { getSurface, type InviteSurface } from "./registry";

export function useInviteSurface(id: string): InviteSurface | undefined {
  // Registry is a pure synchronous module — no async fetch needed.
  // This hook exists to provide a consistent import pattern across the platform.
  return getSurface(id);
}
