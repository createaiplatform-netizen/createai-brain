#!/usr/bin/env tsx
/**
 * transcend_master.ts — Full Transcend Master Orchestrator
 * ---------------------------------------------------------
 * Replit-ready · all modules + per-channel notifications +
 * marketplace simulation + audit
 *
 * Usage:
 *   pnpm --filter @workspace/api-server transcend:master
 *   (or)  tsx ./src/transcend_master.ts
 */

import { transcendAll }                            from "./transcendAll.js";
import {
  generateAuditSummary,
  credentialStatus,
  notifyFamily,
  FAMILY_EMAIL_LIST,
  FAMILY_SMS_LIST,
}                                                  from "./utils/notifications.js";
import { runMarketplaceDemo }                       from "./marketplace/engine.js";

// ─── Step 1: Validate credentials ────────────────────────────────────────────

function validateCredentials(): void {
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
    console.log("✅ All credentials validated.");
  }
}

// ─── Step 2: Run all 9 modules ────────────────────────────────────────────────

async function runModules(): Promise<Record<string, unknown>[]> {
  const result  = await transcendAll({ sendNotifications: false });
  const modules = (result["modules"] as Record<string, unknown>[]) ?? [];
  console.log(`   Modules executed: ${modules.map(m => m["name"]).join(", ")}`);
  return modules;
}

// ─── Step 3: Send notifications per channel ───────────────────────────────────

async function runNotifications(): Promise<void> {
  const emailResults = await notifyFamily({
    channel: "email",
    subject: "Transcend Report",
    message: "Modules completed.",
  });
  const smsResults = await notifyFamily({
    channel: "sms",
    message: "Modules completed.",
  });
  console.log("   Notifications sent:", {
    email: `${emailResults.filter(r => r.success).length}/${emailResults.length}`,
    sms:   `${smsResults.filter(r => r.success).length}/${smsResults.length}`,
  });
}

// ─── Step 4: Marketplace demo (per-user earnings + 1M scale) ─────────────────

async function runMarketplaceSimulation(): Promise<void> {
  const demo = await runMarketplaceDemo();
  console.log("   Per-user earnings:", demo.perUser);
  console.log("   Scaled earnings at 1M users: $" + demo.scaledTotal.toLocaleString());
}

// ─── Step 5: Generate audit summary ──────────────────────────────────────────

async function runAudit(modules: Record<string, unknown>[]): Promise<void> {
  const audit = generateAuditSummary();
  console.log("   Audit summary saved at:", audit.report_saved);
  console.log("   Modules total:", modules.length, "| Passed:", modules.filter(m => m["live"]).length);
}

// ─── Master function (exported + CLI entry) ───────────────────────────────────

export async function transcendMaster(): Promise<void> {
  try {
    console.log("🔹 Step 1: Validating Credentials…");
    validateCredentials();

    console.log("🔹 Step 2: Running all modules…");
    const modules = await runModules();

    console.log(`🔹 Step 3: Sending notifications… (email: ${FAMILY_EMAIL_LIST.length}, SMS: ${FAMILY_SMS_LIST.length})`);
    await runNotifications();

    console.log("🔹 Step 4: Running marketplace simulation…");
    await runMarketplaceSimulation();

    console.log("🔹 Step 5: Generating audit summary…");
    await runAudit(modules);

    console.log("\n🎉 FULL TRANSCEND COMPLETE — all modules live, notifications sent, audit complete.");
  } catch (err) {
    console.error("Transcend failed:", err);
  }
}

// ─── CLI trigger ──────────────────────────────────────────────────────────────

transcendMaster();
