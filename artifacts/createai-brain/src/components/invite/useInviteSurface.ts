/**
 * useInviteSurface — hook that returns a registry surface by id.
 * Has both a named export and a default export to support all import styles.
 *
 * Usage:
 *   import useInviteSurface from "./useInviteSurface";
 *   const surface = useInviteSurface("broadcast");
 */

import { getSurface, type InviteSurface } from "./registry";

export function useInviteSurface(id: string): InviteSurface | undefined {
  return getSurface(id);
}

export default useInviteSurface;
