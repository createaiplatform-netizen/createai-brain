/**
 * identity.ts — Single source of truth for all platform branding.
 *
 * To update the entire platform to a new domain, set ONE environment variable:
 *   BRAND_DOMAIN=yournewdomain.com
 *
 * Every email address, URL, sitemap, security.txt, invoice footer, and social bio
 * in this platform reads from this file.
 *
 * Required secrets (set in Replit → Secrets):
 *   BRAND_DOMAIN        — your purchased domain (e.g. createaiplatform.com)
 *   CONTACT_EMAIL       — your contact address (e.g. admin@createaiplatform.com)
 *   RESEND_FROM_EMAIL   — your verified sending address (same as CONTACT_EMAIL after DNS verification)
 */

const domain        = process.env["BRAND_DOMAIN"]      ?? "createaiplatform.com";
const contactEmail  = process.env["CONTACT_EMAIL"]      ?? `admin@${domain}`;
const fromEmail     = process.env["RESEND_FROM_EMAIL"]  ?? `admin@${domain}`;

export const IDENTITY = {
  platformName:    "CreateAI Brain",
  legalEntity:     "Lakeside Trinity LLC",
  ownerName:       "Sara Stadler",
  brandDomain:     domain,
  platformUrl:     `https://${domain}`,
  contactEmail,
  fromEmail,
  fromHeader:      `CreateAI Brain <${fromEmail}>`,
  cashApp:         "$CreateAIDigital",
  venmo:           "@CreateAIDigital",

  // Social bios and marketing copy — all reference the same domain
  shortBio:        `AI OS for everything 🤖⚡ 12 invention tools. Zero limits. Sara Stadler | Lakeside Trinity. ${domain}`,
  mediumBio:       `AI Operating System for entrepreneurs, healthcare, legal & enterprise teams. 12 AI invention tools. Replace expensive software with intelligence. Sara Stadler / Lakeside Trinity LLC.`,
  longBio:         `CreateAI Brain is the AI Operating System built for entrepreneurs, healthcare operators, legal professionals, and enterprise teams.\n\nWe built 12 AI invention tools that replace $500K+ in software licenses — no hardware, no external APIs, no specialist credentials required.\n\n✅ AI Clinical Scribe\n✅ AI Legal Research Engine\n✅ AI Fleet Intelligence\n✅ AI Risk Underwriter\n✅ AI Agronomist\n+ 7 more invention tools\n\nAll inside a full AI OS: HealthOS, LegalPM, StaffingOS, NEXUS Semantic OS.\n\nSubscribe for AI breakdowns, tool demos, business automation, and revenue strategies.\n\nStart free: ${domain}\nContact: ${contactEmail}`,
  linkedInBio:     `Founder & CEO, CreateAI Brain | AI Operating System for Enterprise & Healthcare | Built 12 AI invention tools replacing $500K+ in software | Lakeside Trinity LLC`,
  founderBio:      `Sara Stadler is the founder of CreateAI Brain, the first AI Operating System designed to replace expensive business software, hardware sensors, and professional consultants with pure AI intelligence.\n\nCreateAI Brain's 12 AI invention tools serve healthcare operators, legal professionals, staffing agencies, fleet operators, financial advisors, insurance underwriters, agricultural businesses, and more — all from a single platform.\n\nPreviously: [Enterprise background]\nNow: Building the AI OS that has no limits and no ceilings.\n\nConnect to discuss: AI platform architecture, enterprise AI adoption, healthcare AI, legal tech, and autonomous business systems.`,
} as const;
