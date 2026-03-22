// ─── Platform Identity ────────────────────────────────────────────────────────
// Single source of truth for all platform-facing identity strings.
// All outbound channels (email, in-app, notifications) use this — never a
// personal founder identity.
//
// Rule: NEVER hard-code platform names/emails anywhere else in the codebase.
//       Always import from here.

export const PLATFORM = {
  displayName:        "CreateAI Brain",
  companyName:        "Lakeside Trinity LLC",
  senderName:         "CreateAI Brain",
  domain:             "createai.digital",
  supportEmail:       "support@createai.digital",
  supportUrl:         "https://createai.digital/support",
  publicContact:      "hello@createai.digital",
  phonePlaceholder:   "1-800-CREATEAI",          // Future main line — no telephony yet
  brandColor:         "#7a9068",
  brandColorLight:    "rgba(122,144,104,0.12)",
  bgColor:            "#faf9f6",
  textColor:          "#1a1916",
  mutedColor:         "#6b6660",
  legalNotice:        "CreateAI Brain is a private platform operated by Lakeside Trinity LLC. All communications are platform-generated.",
} as const;

/** Resolved sender address — prefers env var over fallback. */
export function getSenderAddress(): string {
  return process.env["RESEND_FROM_EMAIL"] ?? "onboarding@resend.dev";
}

/** Resolved sender string for email headers, e.g. "CreateAI Brain <sender@domain.com>" */
export function getSenderFull(): string {
  const addr = getSenderAddress();
  return `${PLATFORM.senderName} <${addr}>`;
}

/** Canonical system user ID used for platform-generated in-app messages. */
export const SYSTEM_SENDER_ID = "SYSTEM_PLATFORM";

/** System user display name shown in in-app message inboxes. */
export const SYSTEM_DISPLAY_NAME = "CreateAI Brain";
