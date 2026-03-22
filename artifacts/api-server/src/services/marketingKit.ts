// ─── Marketing Kit ────────────────────────────────────────────────────────────
// Brand tone helpers, key phrases, and outbound message templates.
// Used by outboundEngine and any code that generates platform-facing copy.
// Ensures consistent voice, warmth, and identity across all communications.
//
// Rules:
//   • Never use corporate jargon, hype, or FOMO language
//   • Warm, calm, grounded — like a trusted friend with deep capability
//   • No comparison language. No urgency tricks.
//   • Always honest about what the platform can and cannot do.

import { PLATFORM } from "./platformIdentity";

// ─── Brand tone vocabulary ────────────────────────────────────────────────────

export const BRAND_TONE = {
  greeting:     "Welcome",
  signoff:      "With care, the CreateAI Brain team",
  tagline:      "Your intelligent platform. Your rules.",
  voice:        "warm, clear, grounded",
  avoidWords:   ["amazing", "revolutionary", "game-changing", "FOMO", "limited time", "act now"],
  encourageWords: ["together", "your way", "whenever you're ready", "at your pace", "we're here"],
} as const;

// ─── Brand HTML wrapper ───────────────────────────────────────────────────────

const SAGE  = PLATFORM.brandColor;
const CREAM = PLATFORM.bgColor;
const TEXT  = PLATFORM.textColor;
const MUTED = PLATFORM.mutedColor;

export function brandHtmlWrapper(bodyHtml: string, options: {
  title?: string;
  preheader?: string;
} = {}): string {
  const { title = PLATFORM.displayName, preheader = "" } = options;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:white;border-radius:16px;overflow:hidden;border:1px solid rgba(122,144,104,0.15);">
          <!-- Header -->
          <tr>
            <td style="background:${SAGE};padding:24px 32px;">
              <p style="margin:0;font-size:20px;font-weight:900;color:white;letter-spacing:-0.3px;">${PLATFORM.displayName}</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.7);">${PLATFORM.companyName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:${TEXT};font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:${CREAM};padding:20px 32px;border-top:1px solid rgba(122,144,104,0.10);">
              <p style="margin:0;font-size:11px;color:${MUTED};line-height:1.6;">
                ${PLATFORM.legalNotice}<br/>
                Questions? <a href="mailto:${PLATFORM.supportEmail}" style="color:${SAGE};text-decoration:none;">${PLATFORM.supportEmail}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${PLATFORM.supportEmail}?subject=Unsubscribe" style="color:${MUTED};text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Message templates ────────────────────────────────────────────────────────

export interface OutboundTemplate {
  subject: string;
  html:    string;
  text:    string;
}

/** Generic announcement template. */
export function announcement(title: string, bodyText: string): OutboundTemplate {
  const bodyHtml = `
    <p style="font-size:22px;font-weight:900;margin:0 0 12px;color:${TEXT};">${title}</p>
    <p style="margin:0 0 24px;color:${MUTED};">${bodyText}</p>
    <p style="margin:0;font-size:13px;color:${MUTED};">${BRAND_TONE.signoff}</p>
  `;
  return {
    subject: `${PLATFORM.displayName} — ${title}`,
    html:    brandHtmlWrapper(bodyHtml, { title, preheader: bodyText.slice(0, 100) }),
    text:    `${title}\n\n${bodyText}\n\n${BRAND_TONE.signoff}`,
  };
}

/** Platform is live / launch announcement. */
export function platformLiveMessage(): OutboundTemplate {
  return announcement(
    "Your platform is live",
    `Everything is set up and ready. You can access all your tools, universes, and features from your dashboard. ${BRAND_TONE.encourageWords[2]}.`,
  );
}

/** Product/feature update template. */
export function productUpdate(feature: string, description: string): OutboundTemplate {
  return announcement(
    `New on ${PLATFORM.displayName}: ${feature}`,
    description,
  );
}

/** Receipt template for a transaction. */
export function receiptTemplate(params: {
  userName: string;
  amountFormatted: string;
  description: string;
  transactionId: string;
  date: string;
}): OutboundTemplate {
  const bodyHtml = `
    <p style="font-size:18px;font-weight:900;margin:0 0 8px;color:${TEXT};">Receipt</p>
    <p style="margin:0 0 20px;color:${MUTED};">Hi ${params.userName}, here's your transaction summary.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(122,144,104,0.15);border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:rgba(122,144,104,0.06);">
        <td style="padding:12px 16px;font-size:13px;font-weight:700;color:${TEXT};">Description</td>
        <td style="padding:12px 16px;font-size:13px;color:${MUTED};">${params.description}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;font-weight:700;color:${TEXT};">Amount</td>
        <td style="padding:12px 16px;font-size:15px;font-weight:900;color:${SAGE};">${params.amountFormatted}</td>
      </tr>
      <tr style="background:rgba(122,144,104,0.06);">
        <td style="padding:12px 16px;font-size:13px;font-weight:700;color:${TEXT};">Date</td>
        <td style="padding:12px 16px;font-size:13px;color:${MUTED};">${params.date}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;font-weight:700;color:${TEXT};">Reference</td>
        <td style="padding:12px 16px;font-size:11px;font-family:monospace;color:${MUTED};">${params.transactionId}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:${MUTED};">Questions? Contact <a href="mailto:${PLATFORM.supportEmail}" style="color:${SAGE};text-decoration:none;">${PLATFORM.supportEmail}</a></p>
  `;
  return {
    subject: `Receipt — ${params.description} (${params.amountFormatted})`,
    html:    brandHtmlWrapper(bodyHtml, { title: "Receipt", preheader: `Your receipt for ${params.amountFormatted}` }),
    text:    `Receipt\nDescription: ${params.description}\nAmount: ${params.amountFormatted}\nDate: ${params.date}\nRef: ${params.transactionId}`,
  };
}

/** Invoice/bill reminder template. */
export function billReminderTemplate(params: {
  userName: string;
  billName: string;
  amountFormatted: string;
  dueDate: string;
}): OutboundTemplate {
  return announcement(
    `Reminder: ${params.billName} is coming up`,
    `Hi ${params.userName}, just a gentle reminder that "${params.billName}" (${params.amountFormatted}) is due on ${params.dueDate}. You can review and approve it in your bills dashboard.`,
  );
}

/** Support confirmation template. */
export function supportConfirmationTemplate(params: {
  userName: string;
  ticketRef: string;
  message: string;
}): OutboundTemplate {
  return announcement(
    "We received your message",
    `Hi ${params.userName}, thank you for reaching out. We've noted your message and will follow up at ${PLATFORM.supportEmail}. Reference: ${params.ticketRef}.`,
  );
}
