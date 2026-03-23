/**
 * shareableMessages.ts — Shareable family message pages
 * ───────────────────────────────────────────────────────
 * POST /api/shareable-messages/generate  (admin/founder only)
 *   → Generates a secure token per contact, stores in documents table,
 *     attempts SMS to verified numbers, emails full report to Sara.
 *
 * GET  /api/shareable-messages/:token    (public — no auth)
 *   → Returns message content for display on /msg/:token
 */

import { Router, type Request, type Response } from "express";
import { db, documents } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import {
  sendEmailNotification,
  sendSMSNotification,
} from "../utils/notifications.js";

const router = Router();

const DOCTYPE     = "shareable_msg";
const SYSTEM_USER = "system";
const BASE_URL    = process.env["PUBLIC_URL"] ?? "https://createai.digital";

// ─── Family contact definitions ───────────────────────────────────────────────
// Add new family members here — all other code handles them automatically.

interface FamilyContact {
  slug:         string;
  name:         string;
  firstName:    string;
  email?:       string | null;
  phone?:       string | null;
  smsVerified?: boolean;        // true = Twilio trial verified, safe to send SMS
  subject:      string;
  message:      string;
}

const FAMILY_CONTACTS: FamilyContact[] = [
  {
    slug:      "nathan-carolina",
    name:      "Nathan & Carolina",
    firstName: "Nathan",
    email:     "Stadlernathan5499@gmail.com",
    phone:     "+17157914114",
    smsVerified: false,
    subject:   "Proud of You & Excited for Family Adventures!",
    message: [
      "Hi Nathan and Carolina,",
      "",
      "I'm so proud of both of you! I can't wait to travel together and create amazing memories as a family.",
      "",
      "Wink wink 😄",
      "",
      "All my love,",
      "Mom (Sara)",
    ].join("\n"),
  },
  {
    slug:      "nolan",
    name:      "Nolan Ryan Stadler",
    firstName: "Nolan",
    email:     "Stadlernolan29@icloud.com",
    phone:     "+17157914050",
    smsVerified: false,
    subject:   "Excited for Family Fun!",
    message: [
      "Hi Nolan,",
      "",
      "You have such a brilliant heart and I can't wait to see all the wonderful things we do together.",
      "",
      "All my love,",
      "Mom (Sara)",
    ].join("\n"),
  },
  {
    slug:        "dennis",
    name:        "Dennis Stadler",
    firstName:   "Dennis",
    phone:       "+17157914957",
    smsVerified: true,
    subject:     "Family Love & Connection",
    message: [
      "Hi Dennis,",
      "",
      "Just wanted to reach out and tell you how much you mean to our family.",
      "I'm so excited for everything we're building together — so much good is ahead.",
      "",
      "With love,",
      "Sara",
    ].join("\n"),
  },
  // ── Add additional family members below ────────────────────────────────────
  // {
  //   slug:      "example",
  //   name:      "Full Name",
  //   firstName: "First",
  //   email:     "email@example.com",
  //   phone:     "+1...",
  //   smsVerified: false,
  //   subject:   "Subject line",
  //   message:   "Personal message...",
  // },
];

// ─── POST /api/shareable-messages/generate ───────────────────────────────────
// Admin/founder only. Idempotent — re-running reuses existing tokens.

router.post("/generate", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const role = (req.user as { role?: string }).role ?? "user";
  if (!["admin", "founder"].includes(role)) {
    res.status(403).json({ error: "Forbidden — admin or founder required" });
    return;
  }

  const results: Array<{
    name:         string;
    slug:         string;
    token:        string;
    link:         string;
    isNew:        boolean;
    smsStatus?:   string;
  }> = [];

  for (const contact of FAMILY_CONTACTS) {
    // ── Idempotency: reuse token if slug already stored ──────────────────────
    const existing = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.userId,  SYSTEM_USER),
        eq(documents.docType, DOCTYPE),
        eq(documents.tags,    contact.slug),
      ))
      .limit(1);

    let token: string;
    let isNew = false;

    if (existing.length > 0) {
      const parsed = JSON.parse(existing[0].body) as { token: string };
      token = parsed.token;
    } else {
      token = crypto.randomBytes(32).toString("hex");
      isNew = true;

      const payload = JSON.stringify({
        token,
        slug:      contact.slug,
        name:      contact.name,
        firstName: contact.firstName,
        email:     contact.email ?? null,
        phone:     contact.phone ?? null,
        subject:   contact.subject,
        message:   contact.message,
        createdAt: new Date().toISOString(),
      });

      await db.insert(documents).values({
        userId:    SYSTEM_USER,
        projectId: token,          // used for fast token lookup
        title:     contact.name,
        body:      payload,
        docType:   DOCTYPE,
        tags:      contact.slug,   // used for idempotency check
      });
    }

    const link = `${BASE_URL}/msg/${token}`;
    const entry: (typeof results)[0] = {
      name: contact.name,
      slug: contact.slug,
      token,
      link,
      isNew,
    };

    // ── SMS attempt for Twilio-verified numbers ──────────────────────────────
    if (contact.smsVerified && contact.phone) {
      const smsBody =
        `Hi ${contact.firstName}! Sara shared a personal message with you 💚\n${link}`;
      try {
        const smsRes = await sendSMSNotification([contact.phone], smsBody);
        const smsItem = smsRes.results[0];
        entry.smsStatus = smsItem?.success
          ? "✅ sent"
          : `❌ failed — ${smsItem?.reason ?? "unknown"}`;
      } catch (e) {
        entry.smsStatus = `❌ error — ${(e as Error).message}`;
      }
    } else if (contact.phone) {
      entry.smsStatus = "⏸ held — Twilio trial (number not verified)";
    }

    results.push(entry);
  }

  // ── Email full report to Sara ─────────────────────────────────────────────
  const reportRows = results
    .map(
      r => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f4ee;font-size:13px;font-weight:600;color:#1a1916">${r.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f4ee;font-size:12px">
            <a href="${r.link}" style="color:#7a9068;text-decoration:none;word-break:break-all">${r.link}</a>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f4ee;font-size:11px;color:#94a3b8;white-space:nowrap">
            ${r.smsStatus ?? "—"}
          </td>
        </tr>`,
    )
    .join("");

  const reportHtml = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;color:#1a1916">
      <div style="background:linear-gradient(135deg,#7a9068 0%,#5a6d50 100%);padding:28px 32px;border-radius:14px 14px 0 0">
        <div style="font-size:28px;margin-bottom:10px">📬</div>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em">Family Message Links</h1>
        <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:13px">
          Generated ${new Date().toLocaleDateString("en-US",{ weekday:"long", year:"numeric", month:"long", day:"numeric" })}
        </p>
      </div>
      <div style="background:#fff;padding:28px 32px;border:1px solid #e8ede4;border-top:none;border-radius:0 0 14px 14px">
        <p style="font-size:14px;color:#6b6660;line-height:1.6;margin:0 0 24px">
          Every link below opens a private, personal message page — no login required.
          Share them via iMessage, WhatsApp, or any channel you prefer.
        </p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e8ede4;border-radius:10px;overflow:hidden">
          <thead>
            <tr style="background:#f0f4ee">
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#5a6d50;text-transform:uppercase;letter-spacing:0.06em">Recipient</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#5a6d50;text-transform:uppercase;letter-spacing:0.06em">Link</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#5a6d50;text-transform:uppercase;letter-spacing:0.06em">SMS</th>
            </tr>
          </thead>
          <tbody>${reportRows}</tbody>
        </table>
        <div style="margin-top:24px;padding:16px 20px;background:#f0f4ee;border-radius:10px">
          <p style="font-size:12px;font-weight:700;color:#5a6d50;margin:0 0 6px">🌐 Master Share Page</p>
          <a href="${BASE_URL}/family-portal-intro" style="color:#7a9068;font-size:13px;text-decoration:none">
            ${BASE_URL}/family-portal-intro
          </a>
          <p style="font-size:11px;color:#94a3b8;margin:6px 0 0">Share this with anyone — it explains the platform and links to the family portal.</p>
        </div>
        <p style="font-size:12px;color:#94a3b8;margin:20px 0 0;text-align:center">
          CreateAI Brain · Lakeside Trinity LLC · createai.digital
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmailNotification(
      ["sivh@mail.com"],
      "📬 Family Message Links — Ready to Share",
      reportHtml,
    );
  } catch (_e) {
    // Non-fatal — report still returned in response
  }

  res.json({
    ok:              true,
    generated:       results.filter(r => r.isNew).length,
    reused:          results.filter(r => !r.isNew).length,
    total:           results.length,
    results,
    masterSharePage: `${BASE_URL}/family-portal-intro`,
    note:            "All links are live and public. No login required. Share via iMessage, WhatsApp, or email.",
    reportEmailedTo: "sivh@mail.com",
  });
});

// ─── GET /api/shareable-messages/:token — PUBLIC, no auth required ────────────

router.get("/:token", async (req: Request, res: Response) => {
  const { token } = req.params as { token: string };

  // Tokens are exactly 64 hex chars (32 bytes)
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    res.status(400).json({ error: "Invalid token format" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.userId,    SYSTEM_USER),
        eq(documents.docType,   DOCTYPE),
        eq(documents.projectId, token),
      ))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const data = JSON.parse(rows[0].body) as {
      name:      string;
      firstName: string;
      subject:   string;
      message:   string;
      createdAt: string;
    };

    res.json({
      ok:        true,
      name:      data.name,
      firstName: data.firstName,
      subject:   data.subject,
      message:   data.message,
      createdAt: data.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve message" });
  }
});

export default router;
