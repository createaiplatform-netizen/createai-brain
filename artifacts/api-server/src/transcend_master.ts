#!/usr/bin/env tsx
/**
 * transcend_master.ts — Full Transcend Master Orchestrator
 * ---------------------------------------------------------
 * Replit-ready · all modules + notifications + monetary simulation
 *
 * Usage:
 *   pnpm --filter @workspace/api-server transcend:master
 *   (or)  tsx ./src/transcend_master.ts
 */

import { transcendAll }            from "./transcendAll.js";
import {
  generateAuditSummary,
  credentialStatus,
  notifyFamily,
  FAMILY_EMAIL_LIST,
  FAMILY_SMS_LIST,
}                                  from "./utils/notifications.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImpactResult {
  users:      number;
  dailyRate:  number;
  totalPerDay: number;
}

export interface MasterResult {
  modules:       Record<string, unknown>[];
  notifyResults: Awaited<ReturnType<typeof notifyFamily>>;
  impact:        ImpactResult;
  audit:         ReturnType<typeof generateAuditSummary>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Step 4: simple daily-rate monetary impact */
function calculateImpact(users: number, dailyRate = 26.50): ImpactResult {
  return {
    users,
    dailyRate,
    totalPerDay: parseFloat((users * dailyRate).toFixed(2)),
  };
}

// ─── Master orchestrator (exported + callable from API) ───────────────────────

export async function transcendMaster(users: number = 1000): Promise<MasterResult> {

  // ── Step 1: Validate Credentials ─────────────────────────────────────────
  console.log("🔹 Step 1: Validating Credentials…");
  const creds  = credentialStatus();
  const issues = [
    ...creds.email.missing.map(k => `${k} (missing)`),
    ...creds.email.invalid,
    ...creds.sms.missing.map(k => `${k} (missing)`),
    ...creds.sms.invalid,
  ];
  if (issues.length > 0) {
    console.warn("⚠️  Placeholders detected — replace with real secrets!");
    issues.forEach(i => console.warn(`   • ${i}`));
    console.warn("   → RESEND_API_KEY starts with re_  |  TWILIO_SID starts with AC");
  } else {
    console.log("✅ Secrets format validated.");
  }

  // ── Step 2: Run all modules ───────────────────────────────────────────────
  console.log("🔹 Step 2: Running all modules…");
  const transcendResult = await transcendAll({ sendNotifications: false });
  const modules = (transcendResult["modules"] as Record<string, unknown>[]) ?? [];

  console.log(`   ✅ ${modules.filter(m => m["live"]).length}/${modules.length} modules live`);

  // ── Step 3: Send notifications ────────────────────────────────────────────
  console.log(`🔹 Step 3: Sending notifications… (email: ${FAMILY_EMAIL_LIST.length}, SMS: ${FAMILY_SMS_LIST.length})`);
  const notifyResults = await notifyFamily({
    channel: "both",
    subject: "Transcend Complete",
    message: "All modules live!",
  });
  const ok = notifyResults.filter(r => r.success).length;
  console.log(`   ${ok}/${notifyResults.length} notifications delivered`);

  // ── Step 4: Simulate monetary impact ─────────────────────────────────────
  console.log(`🔹 Step 4: Simulating monetary impact… (${users.toLocaleString()} users × $26.50/day)`);
  const impact = calculateImpact(users);
  console.log(`   Total per day: $${impact.totalPerDay.toLocaleString()}`);

  // ── Step 5: Generate audit summary ────────────────────────────────────────
  console.log("🔹 Step 5: Generating audit summary…");
  const audit = generateAuditSummary();

  return { modules, notifyResults, impact, audit };
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

(async () => {
  const result = await transcendMaster(1000);
  console.log("\n" + JSON.stringify(result, null, 2));
})().catch(err => {
  console.error("❌ Transcend Master run failed:", err);
  process.exit(1);
});
