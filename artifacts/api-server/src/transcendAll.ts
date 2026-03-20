#!/usr/bin/env tsx
/**
 * transcendAll.ts — Full Beyond Infinity / No Limits Mode Executor
 * ----------------------------------------------------------------
 * Runs all 9 modules (live external APIs), triggers family notifications,
 * executes a real npm security audit, and saves a full timestamped report.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server transcend
 *   (or)  tsx ./src/transcendAll.ts
 *
 * Output: transcend_report.json in the api-server directory.
 */

import { execSync }      from "child_process";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import twilio            from "twilio";
import { notifyFamilyEvent } from "./utils/notifications.js";

// ─── ESM-safe __dirname ───────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ─── Config ───────────────────────────────────────────────────────────────────

const API_PORT      = process.env["PORT"]              ?? "8080";
const REPLIT_DOMAIN = process.env["REPLIT_DEV_DOMAIN"] ?? "";
const BASE_URL      = `http://localhost:${API_PORT}`;   // internal — always available

// ─── Modules to execute ───────────────────────────────────────────────────────
// Task names match both the original MODULE_TASKS and the new API-descriptive aliases

const MODULES = [
  { name: "energy",     task: "activateSolar"   },   // Open-Meteo live weather/solar
  { name: "internet",   task: "checkCloudflare" },   // Cloudflare trace
  { name: "telecom",    task: "checkTwilio"     },   // Twilio status + credential check
  { name: "finance",    task: "checkStripe"     },   // Stripe status
  { name: "media",      task: "checkTwitch"     },   // Twitch status
  { name: "water",      task: "checkOpenAQ"     },   // OpenAQ air quality
  { name: "healthcare", task: "checkFHIR"       },   // HAPI FHIR R4 public server
  { name: "transport",  task: "checkOSM"        },   // OpenStreetMap Nominatim
  { name: "custom",     task: "systemMetrics"   },   // Node.js system metrics
];

// Family members with SMS-capable phones
const SMS_LIST = [
  { name: "Dennis",   phone: "+17157914957" },
  { name: "Nathan",   phone: "+17157914114" },
  { name: "Carolina", phone: "+17157914050" },
  { name: "Nakyllah", phone: "+17157918085" },
  { name: "Jenny",    phone: "+17157914222" },
  { name: "Shawn",    phone: "+16514250505" },
  { name: "Shelly",   phone: "+17154165002" },
  { name: "Terri",    phone: "+17157910555" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function safeFetch(url: string, opts?: RequestInit, timeoutMs = 8000): Promise<Response> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Step 1: Run all modules ──────────────────────────────────────────────────

async function runModules(): Promise<Record<string, unknown>[]> {
  console.log("\n1️⃣  Running all 9 modules (live external APIs)…");
  const results: Record<string, unknown>[] = [];

  for (const m of MODULES) {
    try {
      const res  = await safeFetch(`${BASE_URL}/api/modules/${m.name}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ task: m.task }),
      });
      const data = await res.json() as Record<string, unknown>;
      const live = data["live"] ? " [LIVE]" : "";
      const ok   = data["success"] ? "✅" : "❌";
      console.log(`   ${ok} ${m.name}.${m.task}${live}  score=${data["score"] ?? "?"}`);
      results.push(data);
    } catch (err) {
      console.error(`   ❌ ${m.name}.${m.task} — ${(err as Error).message}`);
      results.push({ module: m.name, task: m.task, success: false, error: (err as Error).message });
    }
  }

  return results;
}

// ─── Step 2: Send email notifications ────────────────────────────────────────

async function sendEmailNotification(moduleResults: Record<string, unknown>[]): Promise<Record<string, unknown>> {
  console.log("\n2️⃣  Sending email notification to family…");

  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    console.warn("   ⚠️  RESEND_API_KEY not set — email skipped. Add it to Replit Secrets.");
    return { status: "skipped", reason: "RESEND_API_KEY not configured" };
  }

  const passed  = moduleResults.filter(r => r["success"]).length;
  const summary = moduleResults.map(r =>
    `${r["success"] ? "✅" : "❌"} ${r["module"]} · ${r["task"]} · score: ${r["score"] ?? "n/a"} — ${r["note"] ?? ""}`
  ).join("<br>");

  try {
    await notifyFamilyEvent({
      subject: "💠 Transcend All Complete — No Limits Mode",
      message: `
        <h3>💠 Beyond Infinity / No Limits Mode — Transcend All Complete</h3>
        <p><strong>${passed}/${moduleResults.length} modules passed</strong> with live external API data.</p>
        <hr/>
        <p>${summary}</p>
        <hr/>
        <p style="font-size:12px;color:#888;">Executed at ${new Date().toISOString()} · CreateAI Brain · Sara's System</p>
      `,
    });
    console.log("   ✅ Family email notification sent");
    return { status: "sent", recipients: "all family members" };
  } catch (err) {
    console.error("   ❌ Email notification failed:", (err as Error).message);
    return { status: "failed", error: (err as Error).message };
  }
}

// ─── Step 3: Send SMS notifications ──────────────────────────────────────────

async function sendSmsNotifications(moduleResults: Record<string, unknown>[]): Promise<Record<string, unknown>> {
  console.log("\n3️⃣  Sending SMS notifications…");

  const sid   = process.env["TWILIO_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  const from  = process.env["TWILIO_PHONE"];

  if (!sid || !token || !from) {
    const missing = ["TWILIO_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE"].filter(k => !process.env[k]);
    console.warn(`   ⚠️  SMS skipped — missing secrets: ${missing.join(", ")}. Add them to Replit Secrets.`);
    return { status: "skipped", reason: `Missing: ${missing.join(", ")}`, instructions: "Add Twilio secrets to Replit Secrets panel" };
  }

  const passed  = moduleResults.filter(r => r["success"]).length;
  const message = `💠 Transcend All complete. ${passed}/${moduleResults.length} modules live. Check your Brain dashboard.${REPLIT_DOMAIN ? ` https://${REPLIT_DOMAIN}/createai-brain` : ""}`;
  const client  = twilio(sid, token);
  const sent: string[] = [];
  const failed: string[] = [];

  await Promise.allSettled(SMS_LIST.map(async member => {
    try {
      await client.messages.create({ body: message, from, to: member.phone });
      console.log(`   ✅ SMS → ${member.name} (${member.phone})`);
      sent.push(member.name);
    } catch (err) {
      console.error(`   ❌ SMS failed → ${member.name}: ${(err as Error).message}`);
      failed.push(member.name);
    }
  }));

  return { status: "done", sent, failed };
}

// ─── Step 4: Real npm security audit ─────────────────────────────────────────

function runSecurityAudit(): Record<string, unknown> {
  console.log("\n4️⃣  Running npm security audit (real)…");
  try {
    const stdout = execSync("npm audit --json 2>/dev/null", {
      cwd:      "/home/runner/workspace",
      timeout:  30_000,
      encoding: "utf8",
    });
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    const meta   = (parsed["metadata"] ?? {}) as Record<string, unknown>;
    const vulns  = (meta["vulnerabilities"] ?? {}) as Record<string, number>;
    const result = {
      real:         true,
      total:        vulns["total"] ?? 0,
      critical:     vulns["critical"] ?? 0,
      high:         vulns["high"] ?? 0,
      moderate:     vulns["moderate"] ?? 0,
      low:          vulns["low"] ?? 0,
      dependencies: meta["totalDependencies"] ?? 0,
    };
    console.log(`   ${result.critical === 0 && result.high === 0 ? "✅" : "⚠️"} Vulns: ${result.total} (crit: ${result.critical}, high: ${result.high}), deps: ${result.dependencies}`);
    return result;
  } catch (e) {
    // npm audit exits non-zero when vulns found — parse stdout anyway
    const stdout = ((e as any).stdout ?? "") as string;
    try {
      const parsed = JSON.parse(stdout) as Record<string, unknown>;
      const meta   = (parsed["metadata"] ?? {}) as Record<string, unknown>;
      const vulns  = (meta["vulnerabilities"] ?? {}) as Record<string, number>;
      return {
        real:         true,
        total:        vulns["total"] ?? 0,
        critical:     vulns["critical"] ?? 0,
        high:         vulns["high"] ?? 0,
        moderate:     vulns["moderate"] ?? 0,
        low:          vulns["low"] ?? 0,
        dependencies: meta["totalDependencies"] ?? 0,
      };
    } catch {
      console.warn("   ⚠️  npm audit unavailable:", (e as Error).message);
      return { real: false, error: (e as Error).message };
    }
  }
}

// ─── Main executor ────────────────────────────────────────────────────────────

export async function transcendAll(): Promise<Record<string, unknown>> {
  console.log("💠 Starting Beyond Infinity / No Limits Mode transcend…");

  const moduleResults  = await runModules();
  const emailResult    = await sendEmailNotification(moduleResults);
  const smsResult      = await sendSmsNotifications(moduleResults);
  const auditResult    = runSecurityAudit();

  const passed  = moduleResults.filter(r => r["success"]).length;
  const allPass = passed === moduleResults.length;

  const report: Record<string, unknown> = {
    mode:          "💠 No Limits Mode / Beyond Infinity / Absolute Transcendence",
    timestamp:     new Date().toISOString(),
    allPass,
    passed,
    total:         moduleResults.length,
    moduleResults,
    auditResults:  auditResult,
    emailResult,
    smsResult,
    credentials: {
      email: { configured: !!process.env["RESEND_API_KEY"] && !!process.env["RESEND_FROM_EMAIL"] },
      sms:   { configured: !!process.env["TWILIO_SID"] && !!process.env["TWILIO_AUTH_TOKEN"] && !!process.env["TWILIO_PHONE"] },
    },
  };

  // Save report
  const reportPath = join(__dirname, "..", "transcend_report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💎 Full transcend report saved → ${reportPath}`);
  console.log(`   ${allPass ? "✅" : "⚠️"} ${passed}/${moduleResults.length} modules passed — all metrics live`);

  return report;
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

const isMain =
  process.argv[1]?.endsWith("transcendAll.ts") ||
  process.argv[1]?.endsWith("transcendAll.js");

if (isMain) {
  transcendAll()
    .then(r => {
      console.log("\n💠 Transcend completed:", JSON.stringify({
        passed:  r["passed"],
        total:   r["total"],
        allPass: r["allPass"],
        email:   (r["emailResult"] as any)?.status,
        sms:     (r["smsResult"] as any)?.status,
        vulns:   (r["auditResults"] as any)?.total,
      }, null, 2));
      process.exit(0);
    })
    .catch(e => {
      console.error("❌ Transcend failed:", e);
      process.exit(1);
    });
}
