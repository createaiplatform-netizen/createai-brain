/**
 * nexusIdentityResolver.ts — NEXUS Platform Address (NPA) System
 * ─────────────────────────────────────────────────────────────────
 *
 * Invents a new identity layer that makes a purchased domain optional.
 *
 * CORE CONCEPT — The "NEXUS Platform Address" (NPA):
 *
 *   npa://CreateAIDigital
 *
 *   An NPA is a stable, human-readable platform handle that is INDEPENDENT
 *   of any internet domain. It anchors the platform's identity to the payment
 *   handles Sara already owns ($CreateAIDigital / @CreateAIDigital) rather
 *   than to a DNS registrar.
 *
 *   At runtime the NPA resolver maps the handle to the actual live URL by
 *   reading the Replit environment. No domain purchase is required because
 *   Replit already provides a publicly accessible URL for every running app.
 *
 * RESOLUTION CHAIN (first match wins):
 *
 *   1. BRAND_DOMAIN secret  — set this if a real domain is ever purchased
 *   2. REPLIT_DEV_DOMAIN    — auto-injected by Replit in all dev environments
 *   3. REPLIT_SLUG + owner  — used in published Replit apps (.replit.app)
 *   4. npa.createaidigital  — self-documenting fallback (offline / local)
 *
 * EMAIL WITHOUT A DOMAIN:
 *
 *   Outbound email uses Resend's shared sending domain (onboarding@resend.dev)
 *   which is pre-verified and works on all Resend accounts. The "From" display
 *   name is set to the brand name, so recipients see:
 *
 *     "CreateAI Brain | Sara Stadler" <onboarding@resend.dev>
 *
 *   When a real domain is purchased and DNS-verified in Resend, set
 *   RESEND_FROM_EMAIL=admin@yourdomain.com and the entire platform switches.
 *
 * WHAT THE NPA SYSTEM CANNOT DO (compared to a real domain):
 *
 *   - Cannot host a public website at a memorable URL like createai.com
 *   - Cannot send email FROM a custom address (e.g. admin@createai.com)
 *   - Cannot use Google Search Console (requires domain ownership proof)
 *   - Replit dev domains change between sessions — the published deployment
 *     URL is stable once the app is published
 *
 * WHAT IT CAN DO FULLY:
 *
 *   - Unify all platform identity under a stable canonical handle
 *   - Auto-resolve the real live URL with zero configuration
 *   - Generate fully functional invoices, security.txt, sitemaps
 *   - Send real transactional emails via Resend shared domain
 *   - Serve well-known files (/.well-known/platform-id.json, etc.)
 *   - Accept real payments via Cash App and Venmo
 *   - Operate every internal system and AI tool at full capacity
 */

export interface NexusPlatformIdentity {
  npa:              string;   // e.g. "npa://CreateAIDigital"
  handle:           string;   // e.g. "CreateAIDigital"
  platformName:     string;
  legalEntity:      string;
  ownerName:        string;
  liveDomain:       string;   // e.g. "abc123.worf.replit.dev"
  liveUrl:          string;   // e.g. "https://abc123.worf.replit.dev"
  domainSource:     "custom" | "replit-dev" | "replit-app" | "npa-fallback";
  contactEmail:     string;
  fromEmail:        string;
  fromHeader:       string;
  cashApp:          string;
  venmo:            string;
  shortBio:         string;
  mediumBio:        string;
  longBio:          string;
  linkedInBio:      string;
  founderBio:       string;
  resolvedAt:       string;
}

function resolveDomain(): { domain: string; source: NexusPlatformIdentity["domainSource"] } {
  const custom = process.env["BRAND_DOMAIN"];
  if (custom && custom !== "createaiplatform.com") {
    return { domain: custom.replace(/^https?:\/\//, "").replace(/\/$/, ""), source: "custom" };
  }

  const replitDev = process.env["REPLIT_DEV_DOMAIN"];
  if (replitDev) {
    return { domain: replitDev, source: "replit-dev" };
  }

  const slug  = process.env["REPLIT_SLUG"];
  const owner = process.env["REPLIT_OWNER"];
  if (slug && owner) {
    return { domain: `${slug}.${owner}.replit.app`, source: "replit-app" };
  }

  return { domain: "npa.createaidigital", source: "npa-fallback" };
}

function resolveEmail(): { contact: string; from: string; fromHeader: string } {
  const customContact = process.env["CONTACT_EMAIL"];
  const customFrom    = process.env["RESEND_FROM_EMAIL"];

  if (customContact && customFrom) {
    return {
      contact:    customContact,
      from:       customFrom,
      fromHeader: `CreateAI Brain <${customFrom}>`,
    };
  }

  const { domain, source } = resolveDomain();

  if (source === "custom" && customFrom) {
    return {
      contact:    customContact ?? `admin@${domain}`,
      from:       customFrom,
      fromHeader: `CreateAI Brain <${customFrom}>`,
    };
  }

  const resendShared = "onboarding@resend.dev";
  return {
    contact:    customContact ?? resendShared,
    from:       resendShared,
    fromHeader: "CreateAI Brain | Sara Stadler <onboarding@resend.dev>",
  };
}

let _resolved: NexusPlatformIdentity | null = null;

export function resolveNexusIdentity(): NexusPlatformIdentity {
  if (_resolved) return _resolved;

  const { domain, source } = resolveDomain();
  const { contact, from, fromHeader } = resolveEmail();
  const liveUrl = `https://${domain}`;

  const npa    = "npa://CreateAIDigital";
  const handle = "CreateAIDigital";

  _resolved = {
    npa,
    handle,
    platformName: "CreateAI Brain",
    legalEntity:  "Lakeside Trinity LLC",
    ownerName:    "Sara Stadler",
    liveDomain:   domain,
    liveUrl,
    domainSource: source,
    contactEmail: contact,
    fromEmail:    from,
    fromHeader,
    cashApp:  "$CreateAIDigital",
    venmo:    "@CreateAIDigital",

    shortBio:   `AI OS for everything 🤖⚡ 12 invention tools. Zero limits. Sara Stadler | Lakeside Trinity. ${domain}`,
    mediumBio:  `AI Operating System for entrepreneurs, healthcare, legal & enterprise teams. 12 AI invention tools. Replace expensive software with intelligence. Sara Stadler / Lakeside Trinity LLC.`,
    longBio:    [
      `CreateAI Brain is the AI Operating System built for entrepreneurs, healthcare operators, legal professionals, and enterprise teams.`,
      ``,
      `We built 12 AI invention tools that replace $500K+ in software licenses — no hardware, no external APIs, no specialist credentials required.`,
      ``,
      `✅ AI Clinical Scribe\n✅ AI Legal Research Engine\n✅ AI Fleet Intelligence\n✅ AI Risk Underwriter\n✅ AI Agronomist\n+ 7 more invention tools`,
      ``,
      `All inside a full AI OS: HealthOS, LegalPM, StaffingOS, NEXUS Semantic OS.`,
      ``,
      `Start free: ${liveUrl}`,
      `Contact: ${contact}`,
      `Platform ID: ${npa}`,
    ].join("\n"),
    linkedInBio: `Founder & CEO, CreateAI Brain | AI Operating System for Enterprise & Healthcare | Built 12 AI invention tools replacing $500K+ in software | Lakeside Trinity LLC`,
    founderBio:  [
      `Sara Stadler is the founder of CreateAI Brain, the first AI Operating System designed to replace expensive business software, hardware sensors, and professional consultants with pure AI intelligence.`,
      ``,
      `CreateAI Brain's 12 AI invention tools serve healthcare operators, legal professionals, staffing agencies, fleet operators, financial advisors, insurance underwriters, agricultural businesses, and more — all from a single platform.`,
      ``,
      `Platform: ${liveUrl}`,
      `Connect: ${contact}`,
      `Identity: ${npa}`,
    ].join("\n"),
    resolvedAt: new Date().toISOString(),
  };

  console.log(`[NPA] Identity resolved — handle:${handle} · domain:${domain} · source:${source} · email:${from}`);
  return _resolved;
}

export function refreshNexusIdentity(): NexusPlatformIdentity {
  _resolved = null;
  return resolveNexusIdentity();
}
