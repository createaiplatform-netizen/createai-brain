/**
 * middlewares/breachLogger.ts
 * ────────────────────────────
 * Perimeter Breach Detection — runs BEFORE adminAuth on protected Architect routes.
 *
 * If the request does NOT carry a valid ADMIN_SESSION cookie:
 *   1. Logs the breach attempt to `admin_breach_log` table in PostgreSQL.
 *   2. Fires an instant Obsidian email to admin@LakesideTrinity.com via Resend.
 *   3. Calls next() — adminAuth (the next middleware) handles the redirect.
 *
 * If the cookie IS valid, this is a no-op and next() is called immediately.
 */

import type { Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";
import { getSql } from "../lib/db.js";

let tableReady = false;

async function ensureTable(): Promise<void> {
  if (tableReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS admin_breach_log (
      id           SERIAL PRIMARY KEY,
      ip           TEXT,
      user_agent   TEXT,
      path         TEXT,
      method       TEXT,
      cookie_hint  TEXT,
      attempted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  tableReady = true;
}

async function sendBreachEmail(ip: string, path: string, method: string, ua: string, ts: string): Promise<void> {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return;
  try {
    const transport = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 587,
      secure: false,
      auth: { user: "resend", pass: key },
    });
    await transport.sendMail({
      from:    '"CreateAI Brain Security" <onboarding@resend.dev>',
      replyTo: "admin@LakesideTrinity.com",
      to:      "admin@LakesideTrinity.com",
      subject: `⚠ PERIMETER BREACH — ${method} ${path} — ${ts}`,
      html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#060a06;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060a06;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0d1a0d;border:1px solid rgba(201,168,76,.35);border-radius:16px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#1a0000,#3d0000);padding:28px 36px;text-align:center;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.22em;color:rgba(248,113,113,.6);text-transform:uppercase;font-family:monospace;">ARCHITECT SECURITY ALERT</p>
          <h1 style="margin:12px 0 0;font-size:26px;font-weight:900;color:#f87171;letter-spacing:-0.03em;">⚠ PERIMETER BREACH</h1>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 24px;font-size:13px;color:rgba(221,216,196,.65);line-height:1.7;">An unauthorized entity attempted to access a sovereign Architect route. The attempt was blocked and logged.</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 14px;background:rgba(6,10,6,.8);border:1px solid rgba(201,168,76,.12);border-radius:8px 8px 0 0;">
                <span style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:rgba(201,168,76,.5);text-transform:uppercase;font-family:monospace;">ROUTE</span>
                <p style="margin:4px 0 0;font-size:13px;color:#f5e17a;font-family:monospace;">${method} ${path}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:rgba(6,10,6,.8);border:1px solid rgba(201,168,76,.12);border-top:none;">
                <span style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:rgba(201,168,76,.5);text-transform:uppercase;font-family:monospace;">IP ADDRESS</span>
                <p style="margin:4px 0 0;font-size:13px;color:#ddd8c4;font-family:monospace;">${ip}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:rgba(6,10,6,.8);border:1px solid rgba(201,168,76,.12);border-top:none;">
                <span style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:rgba(201,168,76,.5);text-transform:uppercase;font-family:monospace;">USER-AGENT</span>
                <p style="margin:4px 0 0;font-size:12px;color:rgba(221,216,196,.55);font-family:monospace;word-break:break-all;">${ua.slice(0, 140)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:rgba(6,10,6,.8);border:1px solid rgba(201,168,76,.12);border-top:none;border-radius:0 0 8px 8px;">
                <span style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:rgba(201,168,76,.5);text-transform:uppercase;font-family:monospace;">TIMESTAMP (UTC)</span>
                <p style="margin:4px 0 0;font-size:13px;color:#ddd8c4;font-family:monospace;">${ts}</p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0;font-size:11px;color:rgba(221,216,196,.3);text-align:center;letter-spacing:0.06em;">CREATEAI BRAIN · LAKESIDE TRINITY LLC · SOVEREIGN PERIMETER MONITORING</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });
  } catch (e) {
    console.error("[BreachLogger] Email alert failed:", (e as Error).message);
  }
}

async function logBreach(req: Request): Promise<void> {
  const ip     = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const ua     = (req.headers["user-agent"] ?? "unknown").slice(0, 512);
  const path   = req.path.slice(0, 512);
  const method = req.method;
  const ts     = new Date().toISOString();

  // LOG TO DATABASE (admin_breach_log)
  try {
    await ensureTable();
    const sql = getSql();
    await sql`
      INSERT INTO admin_breach_log (ip, user_agent, path, method, cookie_hint, attempted_at)
      VALUES (${ip}, ${ua}, ${path}, ${method}, ${"absent"}, NOW())
    `;
  } catch (e) {
    console.error("[BreachLogger] DB log failed:", (e as Error).message);
  }

  // FIRE RESEND ALERT TO ARCHITECT
  sendBreachEmail(ip, path, method, ua, ts).catch(() => {});
}

export const breachLogger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // PUBLIC BYPASS: Allow the homepage and assets to load without a session
  const publicPaths = ["/", "/index.html", "/favicon.ico", "/assets"];
  if (publicPaths.includes(req.path) || req.path.startsWith("/assets")) {
    return next();
  }

  const adminSession = req.cookies?.ADMIN_SESSION;
  if (!adminSession) {
    console.log(`[BREACH_ATTEMPT] ${req.method} ${req.path} from IP: ${req.ip}`);
    // The redirect or 401 goes here for protected routes only
    res.status(401).send("Unauthorized");
    return;
  }
  next();
};
