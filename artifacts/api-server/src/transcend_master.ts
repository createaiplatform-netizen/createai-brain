#!/usr/bin/env tsx
/**
 * transcend_master.ts — Full Transcend Master orchestrator
 * ---------------------------------------------------------
 * Validates credentials, runs all 9 modules, sends family notifications
 * per channel, simulates per-user monetary impact, and generates a full audit.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server transcend:master
 *   (or)  tsx ./src/transcend_master.ts
 */

import { transcendAll }                                       from "./transcendAll.js";
import {
  generateAuditSummary,
  credentialStatus,
  notifyFamily,
  FAMILY_EMAIL_LIST,
  FAMILY_SMS_LIST,
} from "./utils/notifications.js";

// ─── Monetary / impact simulation ─────────────────────────────────────────────

const IMPACT_CONFIG = {
  baseDailyUSD:    25,        // starting daily "earnings" per person
  perClickIncrement: 1.5,    // increase per click
  dailyLimit:      1,         // max clicks counted per person per day
  maxUsers:        1_000_000, // scaling cap for simulation
};

const userStats: Record<string, { clicksToday: number }> = {};

function calculateImpact(userId: string): number {
  if (!userStats[userId]) userStats[userId] = { clicksToday: 0 };
  const user = userStats[userId];
  if (user.clicksToday >= IMPACT_CONFIG.dailyLimit) return 0;
  user.clicksToday += 1;
  const impact = IMPACT_CONFIG.baseDailyUSD + (IMPACT_CONFIG.perClickIncrement * user.clicksToday);
  return Math.min(impact, IMPACT_CONFIG.baseDailyUSD * 2); // cap per user at 2× base
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n🚀 Starting FULL Transcend Master run…\n");

  // ── Step 1: Validate credentials ──────────────────────────────────────────
  console.log("🔑 Step 1/5 — Validating credentials…");
  const creds = credentialStatus();

  const issues: string[] = [
    ...creds.email.missing.map(k => `${k} (missing)`),
    ...creds.email.invalid,
    ...creds.sms.missing.map(k => `${k} (missing)`),
    ...creds.sms.invalid,
  ];

  if (issues.length > 0) {
    console.error("❌ Credential issues detected:");
    issues.forEach(issue => console.error(`   • ${issue}`));
    console.error("\n   → Update Replit Secrets with real keys and re-run.");
    console.error("   → RESEND_API_KEY starts with re_  |  TWILIO_SID starts with AC");
    console.warn("\n   ⚠️  Continuing run — notifications will be skipped until credentials are valid.");
  } else {
    console.log("   ✅ All credentials valid — email and SMS will fire");
  }

  // ── Step 2: Run all 9 modules (notifications disabled — handled separately) ─
  console.log("\n⚡ Step 2/5 — Running all 9 modules…");
  const result = await transcendAll({ sendNotifications: false });

  const modules = result["modules"] as Array<{
    name: string; source: string; score: number; overachievement_pct: number; live: boolean; task: string;
  }>;

  console.log("\n   Module results:");
  console.table(modules.map(m => ({
    Module:          m.name,
    Source:          m.source,
    Score:           m.score,
    "Live?":         m.live ? "✅" : "⚠️ ",
    "Overachieve %": `${m.overachievement_pct}%`,
  })));

  // ── Step 3: Send notifications per channel ────────────────────────────────
  console.log(`\n📧 Step 3/5 — Sending email to ${FAMILY_EMAIL_LIST.length} members…`);
  const emailResults = await notifyFamily({ channel: "email" });
  console.table(emailResults.map(r => ({
    To:       r.to,
    Success:  r.success ? "✅" : "❌",
    Reason:   r.reason ?? "OK",
    Provider: r.provider ?? "resend",
  })));

  console.log(`\n📱 Sending SMS to ${FAMILY_SMS_LIST.length} members…`);
  const smsResults = await notifyFamily({ channel: "sms" });
  console.table(smsResults.map(r => ({
    To:       r.to,
    Success:  r.success ? "✅" : "❌",
    Reason:   r.reason ?? "OK",
    Provider: r.provider ?? "twilio",
  })));

  // ── Step 4: Simulate per-user monetary impact ─────────────────────────────
  console.log("\n💰 Step 4/5 — Simulating daily impact per user…");
  const simulatedUsers = ["user1", "user2", "user3", "user4", "user5"];
  const earnings: Record<string, string> = {};
  let totalImpact = 0;

  simulatedUsers.forEach(uid => {
    const impact   = calculateImpact(uid);
    earnings[uid]  = `$${impact.toFixed(2)}/day`;
    totalImpact   += impact;
  });

  console.table(earnings);
  console.log(`   Total simulated impact: $${totalImpact.toFixed(2)}/day across ${simulatedUsers.length} users`);
  console.log(`   Scaled to ${IMPACT_CONFIG.maxUsers.toLocaleString()} users: $${(totalImpact / simulatedUsers.length * IMPACT_CONFIG.maxUsers).toLocaleString(undefined, { maximumFractionDigits: 0 })}/day`);

  // ── Step 5: Full audit summary ────────────────────────────────────────────
  console.log("\n📊 Step 5/5 — Generating full audit summary…");
  const audit = generateAuditSummary();

  const passed   = modules.filter(m => m.live).length;
  const emailOk  = emailResults.filter(r => r.success).length;
  const smsOk    = smsResults.filter(r => r.success).length;

  console.log("\n" + JSON.stringify({
    mode:                "💠 No Limits Mode / Transcend Master",
    generatedAt:         audit.generatedAt,
    report_saved:        audit.report_saved,
    modules:             { passed, total: modules.length, overachievement_pct: result["moduleOverachievement_pct"] },
    notifications: {
      email: { sent: emailOk, total: emailResults.length },
      sms:   { sent: smsOk,   total: smsResults.length },
    },
    credentials:         audit.credentials.summary,
    security:            result["securityAudit"],
    impact_simulation: {
      users:         simulatedUsers.length,
      totalUSD_day:  `$${totalImpact.toFixed(2)}`,
      scaledTo1M:    `$${(totalImpact / simulatedUsers.length * IMPACT_CONFIG.maxUsers).toLocaleString(undefined, { maximumFractionDigits: 0 })}/day`,
    },
    familyList:  audit.familyList,
    endpoints:   audit.endpoints,
    scripts:     audit.scripts,
  }, null, 2));

  console.log(`\n💾 Report saved → ${audit.report_saved}`);
  console.log(`\n💠 Transcend Master run complete — ${passed}/${modules.length} modules live · ${emailOk} emails · ${smsOk} SMS`);
}

main().catch(err => {
  console.error("❌ Transcend Master run failed:", err);
  process.exit(1);
});
