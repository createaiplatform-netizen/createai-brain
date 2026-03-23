/**
 * VentonWay Custom SMTP Transport
 * ─────────────────────────────────
 * Delivers email directly via a server you control (no third-party API).
 * Points to any SMTP server: self-hosted Postal, mail.createai.digital,
 * a VPS mailserver, or any SMTP relay you own.
 *
 * Environment variables:
 *   SMTP_HOST     — your mail server hostname  (e.g. mail.createai.digital)
 *   SMTP_PORT     — port: 587 (STARTTLS) | 465 (SSL) | 25 (plain)
 *   SMTP_SECURE   — "true" for SSL/465, omit or "false" for STARTTLS
 *   SMTP_USER     — SMTP login username
 *   SMTP_PASS     — SMTP login password
 *   SMTP_FROM     — From address  (e.g. hello@createai.digital)
 *
 * DNS records required for createai.digital (set in your domain registrar):
 *   SPF:    TXT  createai.digital  "v=spf1 ip4:<YOUR_SERVER_IP> mx ~all"
 *   DKIM:   TXT  mail._domainkey.createai.digital  "v=DKIM1; k=rsa; p=<PUBLIC_KEY>"
 *   DMARC:  TXT  _dmarc.createai.digital  "v=DMARC1; p=quarantine; rua=mailto:postmaster@createai.digital"
 *   MX:     MX   createai.digital  10 mail.createai.digital
 *   A:      A    mail.createai.digital  <YOUR_SERVER_IP>
 */

import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions } from "nodemailer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SMTPConfig {
  host:   string;
  port:   number;
  secure: boolean;
  user:   string;
  pass:   string;
  from:   string;
}

export interface SMTPSendResult {
  success:   boolean;
  messageId: string;
  channel:   "smtp_custom";
  reason?:   string;
}

// ─── Detect SMTP configuration ────────────────────────────────────────────────

export function getSMTPConfig(): SMTPConfig | null {
  const host = process.env["SMTP_HOST"] ?? "";
  const user = process.env["SMTP_USER"] ?? "";
  const pass = process.env["SMTP_PASS"] ?? "";
  if (!host || !user || !pass) return null;

  return {
    host,
    port:   parseInt(process.env["SMTP_PORT"] ?? "587"),
    secure: process.env["SMTP_SECURE"] === "true",
    user,
    pass,
    from:   process.env["SMTP_FROM"] ?? `VentonWay <hello@createai.digital>`,
  };
}

export function isSMTPConfigured(): boolean {
  return getSMTPConfig() !== null;
}

// ─── Lazy transporter (cached per process) ───────────────────────────────────

let _transporter: Transporter | null = null;

function getTransporter(cfg: SMTPConfig): Transporter {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host:   cfg.host,
    port:   cfg.port,
    secure: cfg.secure,
    auth:   { user: cfg.user, pass: cfg.pass },
    pool:   true,
    maxConnections: 5,
    rateDelta:      1000,
    rateLimit:      10,
    tls:   { rejectUnauthorized: process.env["NODE_ENV"] === "production" },
  });
  return _transporter;
}

// ─── Send via custom SMTP ─────────────────────────────────────────────────────

export async function sendViaSMTP(opts: {
  to:       string;
  subject:  string;
  html:     string;
  text?:    string;
}): Promise<SMTPSendResult> {
  const cfg = getSMTPConfig();
  if (!cfg) {
    return { success: false, messageId: "", channel: "smtp_custom", reason: "SMTP not configured" };
  }

  const transporter = getTransporter(cfg);

  const mail: SendMailOptions = {
    from:    cfg.from,
    to:      opts.to,
    subject: opts.subject,
    html:    opts.html,
    text:    opts.text ?? opts.html.replace(/<[^>]+>/g, ""),
    headers: {
      "X-Mailer":           "VentonWay/1.0",
      "X-VentonWay":        "true",
      "List-Unsubscribe":   "<mailto:unsubscribe@createai.digital>",
    },
  };

  try {
    const info = await transporter.sendMail(mail);
    return {
      success:   true,
      messageId: info.messageId ?? "",
      channel:   "smtp_custom",
    };
  } catch (err) {
    _transporter = null; // reset on error so next attempt reinitialises
    return {
      success:   false,
      messageId: "",
      channel:   "smtp_custom",
      reason:    (err as Error).message,
    };
  }
}

// ─── SMTP infrastructure health check ────────────────────────────────────────

export async function checkSMTPHealth(): Promise<{
  configured: boolean;
  connected:  boolean;
  host:       string;
  reason?:    string;
}> {
  const cfg = getSMTPConfig();
  if (!cfg) return { configured: false, connected: false, host: "" };

  try {
    const t = getTransporter(cfg);
    await t.verify();
    return { configured: true, connected: true, host: cfg.host };
  } catch (err) {
    _transporter = null;
    return {
      configured: true,
      connected:  false,
      host:       cfg.host,
      reason:     (err as Error).message,
    };
  }
}
