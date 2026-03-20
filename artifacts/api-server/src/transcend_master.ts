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
import { MarketplaceEngine, runDemoSession }                   from "./marketplace/engine.js";

// ─── Scale-up projection ──────────────────────────────────────────────────────

const MAX_USERS = 1_000_000;

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

  // ── Step 4: Dynamic Marketplace Demo Session (exact spec demoSession) ────
  console.log("\n💰 Step 4/5 — Running Dynamic Marketplace Demo Session…");

  const demoEngine = new MarketplaceEngine([
    { id: 1, name: "FamilyMember1", earnings: 0 },
    { id: 2, name: "FamilyMember2", earnings: 0 },
    { id: 3, name: "DemoUser1",     earnings: 0 },
  ]);
  const demoResult = runDemoSession(demoEngine);

  console.log("\n   Earnings events:");
  console.table(demoResult.events.map(e => ({
    User:          e.userName,
    Action:        e.action,
    Base:          `$${e.baseValue.toFixed(2)}`,
    Scaled:        `$${e.scaledValue.toFixed(2)}`,
    UserShare:     `$${e.userShare.toFixed(2)}`,
    PlatformShare: `$${e.platformShare.toFixed(2)}`,
  })));

  console.log("\n   Final earnings per user:");
  console.table(demoResult.finalEarnings.map(u => ({ Name: u.name, Earnings: `$${u.earnings.toFixed(2)}` })));

  const totalImpact = demoResult.finalEarnings.reduce((a, u) => a + u.earnings, 0);
  const avgPerUser  = totalImpact / demoResult.finalEarnings.length;

  console.log(`   Platform share: $${demoResult.platformTotal.toFixed(2)}`);
  console.log(`   Items created: ${demoResult.totalItems} | Units sold: ${demoResult.totalSold}`);
  console.log(`   Avg earnings/user: $${avgPerUser.toFixed(2)}`);
  console.log(`   Scaled to ${MAX_USERS.toLocaleString()} users: $${(avgPerUser * MAX_USERS).toLocaleString(undefined, { maximumFractionDigits: 0 })}/day`);

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
    marketplace_simulation: {
      users:              demoResult.finalEarnings.length,
      items_created:      demoResult.totalItems,
      units_sold:         demoResult.totalSold,
      totalEarnings_day:  `$${totalImpact.toFixed(2)}`,
      platform_share:     `$${demoResult.platformTotal.toFixed(2)}`,
      scaledTo1M:         `$${(avgPerUser * MAX_USERS).toLocaleString(undefined, { maximumFractionDigits: 0 })}/day`,
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
