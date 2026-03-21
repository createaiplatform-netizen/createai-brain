/**
 * nexus/context.ts — Session Context
 * ────────────────────────────────────
 * Lightweight session state stored in a first-party cookie.
 * Not cryptographically signed — visit history is not security-sensitive.
 * The Presence token handles identity integrity.
 *
 * Cookie NX_CTX: base64(JSON({ h: string[], t: number }))
 *   h  — last 8 space IDs visited (most recent first)
 *   t  — unix timestamp of last update
 */

import { type Request, type Response } from "express";

export const CONTEXT_COOKIE  = "NX_CTX";
export const CONTEXT_MAX_SEC = 60 * 60 * 24 * 2;  // 2 days
const        MAX_HISTORY     = 8;

export interface NXContext {
  history:  string[];   // space IDs, most recent first
  lastSeen: number;     // unix timestamp
}

const EMPTY_CTX: NXContext = { history: [], lastSeen: 0 };

export function getContext(req: Request): NXContext {
  try {
    const raw = req.cookies?.[CONTEXT_COOKIE] as string | undefined;
    if (!raw) return { ...EMPTY_CTX };
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      h: string[]; t: number;
    };
    if (!Array.isArray(parsed.h)) return { ...EMPTY_CTX };
    return { history: parsed.h.slice(0, MAX_HISTORY), lastSeen: parsed.t ?? 0 };
  } catch {
    return { ...EMPTY_CTX };
  }
}

export function pushVisit(res: Response, ctx: NXContext, spaceId: string): NXContext {
  const history = [spaceId, ...ctx.history.filter(id => id !== spaceId)].slice(0, MAX_HISTORY);
  const next: NXContext = { history, lastSeen: Date.now() };
  const encoded = Buffer.from(JSON.stringify({ h: history, t: next.lastSeen })).toString("base64url");
  res.cookie(CONTEXT_COOKIE, encoded, { httpOnly: true, maxAge: CONTEXT_MAX_SEC * 1000, sameSite: "lax" });
  return next;
}

export function clearContext(res: Response): void {
  res.clearCookie(CONTEXT_COOKIE);
}
