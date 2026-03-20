/**
 * FullLockdown — Family-only access control for CreateAI Brain.
 *
 * Authorized family members only. Access is checked via email address
 * on every protected API request. Workspace clone prevention is enforced
 * when BRAIN_WORKSPACE_ID env var is set.
 */

import type { Request, Response, NextFunction } from "express";
import { logEvent } from "./logging.js";

// ─── Authorized family list ───────────────────────────────────────────────────
// Each entry normalized to lowercase for case-insensitive comparison.

const FAMILY_LIST: string[] = [
  // Sara Stadler — primary account holder
  "sivh@mail.com",

  // Nathan Richard Stadler — oldest son (DOB 12/06/2001)
  "stadlernathan5499@gmail.com",

  // Nolan Ryan Stadler — son (DOB 11/28/2003)
  "stadlernolan29@icloud.com",

  // Carolina Stadler (Calixto) — daughter-in-law
  "caro.ixto5499@gmail.com",

  // Jenny — sister (DOB 10/05/1984)
  "jeepgirl20@yahoo.com",

  // Shawn Miller ("Deuce") — brother-in-law
  "shawnjennymiller@gmail.com",

  // Shelly Phelps — cousin & best friend
  "miphelps1121@gmail.com",

  // Dennis Stadler — husband (DOB 11/16/1981, Ann. 08/07/04)
  "stadlerdennis@yahoo.com",

  // Nakyllah Raine Stadler — daughter (DOB 07/31/2006)
  "nakyllahstadler0@gmail.com",

  // Terri Rossow — mom (DOB 10/05/1961) & dad (DOB 06/30/1958) — shared email
  "richandterri5861@gmail.com",
];

// ─── Workspace lock (optional) ───────────────────────────────────────────────
// Set BRAIN_WORKSPACE_ID env var to lock this Brain to a specific Replit
// workspace and block clone/fork attempts.

const AUTHORIZED_WORKSPACE_ID = process.env.BRAIN_WORKSPACE_ID ?? "";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRequestEmail(req: Request): string | null {
  const user = req.user as { id?: string; email?: string } | undefined;
  return user?.email?.toLowerCase() ?? null;
}

function isFamilyMember(email: string | null): boolean {
  if (!email) return false;
  return FAMILY_LIST.includes(email.toLowerCase());
}

function isAuthorizedWorkspace(): boolean {
  // If no workspace ID configured, skip the workspace check
  if (!AUTHORIZED_WORKSPACE_ID) return true;
  const current = process.env.REPLIT_ID ?? process.env.REPLIT_SLUG ?? "";
  return current === AUTHORIZED_WORKSPACE_ID;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Express middleware — attach to any router that should be family-only.
 * Must run AFTER authMiddleware so req.user is populated.
 */
export function accessMiddleware(req: Request, res: Response, next: NextFunction): void {
  const email = getRequestEmail(req);

  if (!email) {
    logEvent("ACCESS_DENIED", "Unauthenticated request — no user session");
    res.status(403).json({ error: "Access denied: you must be signed in to use CreateAI Brain." });
    return;
  }

  if (!isFamilyMember(email)) {
    logEvent("ACCESS_DENIED", `${email} is not on the authorized family list`);
    res.status(403).json({ error: "Access denied: this Brain is private — authorized users only." });
    return;
  }

  if (!isAuthorizedWorkspace()) {
    const ws = process.env.REPLIT_ID ?? "unknown";
    logEvent("CLONE_ATTEMPT_BLOCKED", `Unauthorized workspace: ${ws}`);
    res.status(403).json({ error: "Access denied: unauthorized workspace." });
    return;
  }

  logEvent("ACCESS_GRANTED", `${email} accessed CreateAI Brain`);
  next();
}

/**
 * Quick boolean check — useful for conditional logic outside middleware chains.
 */
export function hasFullAccess(req: Request): boolean {
  return isFamilyMember(getRequestEmail(req)) && isAuthorizedWorkspace();
}

/**
 * Clone / export prevention — throws if current workspace is not authorized.
 * Call during startup to detect unauthorized forks early.
 */
export function preventCloneAttempt(): void {
  if (!AUTHORIZED_WORKSPACE_ID) return; // no restriction configured
  const current = process.env.REPLIT_ID ?? process.env.REPLIT_SLUG ?? "";
  if (current !== AUTHORIZED_WORKSPACE_ID) {
    logEvent("CLONE_ATTEMPT_BLOCKED", `Startup blocked — unauthorized workspace: ${current}`);
    throw new Error("CreateAI Brain: clone or fork blocked — unauthorized workspace.");
  }
}

/**
 * Returns the full family list (emails redacted after first 3 chars for logs).
 * Safe to expose in admin endpoints.
 */
export function getFamilyListSummary(): { count: number; members: string[] } {
  return {
    count:   FAMILY_LIST.length,
    members: FAMILY_LIST.map(e => {
      const [name, domain] = e.split("@");
      return `${name.slice(0, 3)}***@${domain}`;
    }),
  };
}
