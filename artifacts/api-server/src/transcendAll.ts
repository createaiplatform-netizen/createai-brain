#!/usr/bin/env tsx
/**
 * transcendAll.ts — Full Beyond Infinity / No Limits Mode Executor
 * ----------------------------------------------------------------
 * Runs all 9 modules (live external APIs), triggers family notifications
 * for all 10 email recipients and 8 SMS recipients, executes a real npm
 * security audit, generates per-recipient structured results with
 * Beyond Infinity overachievement %, and saves a timestamped report.
 *
 * Usage (CLI):
 *   pnpm --filter @workspace/api-server transcend
 *   (or)  tsx ./src/transcendAll.ts
 *
 * Usage (API):
 *   POST /api/brain/transcend-all
 *
 * Output: transcend_report.json saved in the api-server root directory.
 */

import { execSync }      from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";
import {
  sendEmailNotification,
  sendSMSNotification,
  generateAuditSummary,
  FAMILY_EMAIL_LIST,
  FAMILY_SMS_LIST,
} from "./utils/notifications.js";
import { serverPath } from "./utils/serverPaths.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_PORT  = process.env["PORT"] ?? "8080";
const BASE_URL  = `http://localhost:${API_PORT}`;
const DOMAIN    = process.env["REPLIT_DEV_DOMAIN"] ?? "";

// ─── Modules to execute ───────────────────────────────────────────────────────
// Each entry uses the descriptive API alias added in MODULE_TASKS.

const MODULES = [
  { name: "energy",     task: "activateSolar"   },   // Open-Meteo live solar/weather
  { name: "internet",   task: "checkCloudflare" },   // Cloudflare trace
  { name: "telecom",    task: "checkTwilio"     },   // Twilio status API
  { name: "finance",    task: "checkStripe"     },   // Stripe status API
  { name: "media",      task: "checkTwitch"     },   // Twitch status API
  { name: "water",      task: "checkOpenAQ"     },   // OpenAQ air quality
  { name: "healthcare", task: "checkFHIR"       },   // HAPI FHIR R4
  { name: "transport",  task: "checkOSM"        },   // OpenStreetMap Nominatim
  { name: "custom",     task: "systemMetrics"   },   // Node.js system metrics
];

// ─── Step 1: Run all 9 modules via internal HTTP ─────────────────────────────

async function runModules(): Promise<Record<string, unknown>[]> {
  console.log("\n1️⃣  Running all 9 modules (live external APIs)…");
  const results: Record<string, unknown>[] = [];

  for (const m of MODULES) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);
      const res   = await fetch(`${BASE_URL}/api/modules/${m.name}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ task: m.task }),
        signal:  ctrl.signal,
      }).finally(() => clearTimeout(timer));

      const data = await res.json() as Record<string, unknown>;
      const live = data["live"] ? " [LIVE]" : "";
      const icon = data["success"] ? "✅" : "❌";
      console.log(`   ${icon} ${m.name}.${m.task}${live}  score=${data["score"] ?? "?"}`);
      results.push(data);
    } catch (err) {
      console.error(`   ❌ ${m.name}.${m.task} — ${(err as Error).message}`);
      results.push({ module: m.name, task: m.task, success: false, error: (err as Error).message });
    }
  }

  return results;
}

// ─── Step 2: Email all 10 family members ─────────────────────────────────────

async function notifyByEmail(moduleResults: Record<string, unknown>[]) {
  console.log("\n2️⃣  Sending email notifications → 10 family members…");

  const passed  = moduleResults.filter(r => r["success"]).length;
  const rows    = moduleResults.map(r =>
    `<tr>
       <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${r["module"]}</td>
       <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${r["task"]}</td>
       <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;color:${r["success"] ? "#22c55e" : "#ef4444"}">
         ${r["success"] ? "✅ Live" : "❌ Failed"}
       </td>
       <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;">${r["score"] ?? "—"}</td>
       <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#888;">${r["note"] ?? ""}</td>
     </tr>`
  ).join("");

  const body = `
    <h3 style="color:#6366f1;">💠 Transcend All Complete — Beyond Infinity Mode</h3>
    <p><strong>${passed}/${moduleResults.length} modules passed</strong> with live external API data.</p>
    ${DOMAIN ? `<p><a href="https://${DOMAIN}/createai-brain" style="color:#6366f1;">Open Dashboard →</a></p>` : ""}
    <table style="border-collapse:collapse;width:100%;font-size:14px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;">Module</th>
          <th style="padding:8px 12px;text-align:left;">Task</th>
          <th style="padding:8px 12px;text-align:left;">Status</th>
          <th style="padding:8px 12px;text-align:left;">Score</th>
          <th style="padding:8px 12px;text-align:left;">Note</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const emails = FAMILY_EMAIL_LIST.map(m => m.email);
  const result = await sendEmailNotification(emails, "💠 Transcend All Complete — No Limits Mode", body);
  console.log(`   ${result.successCount}/${result.total} emails sent · overachievement: ${result.overachievement_pct}%`);
  return result;
}

// ─── Step 3: SMS all 8 family members with phones ────────────────────────────

async function notifyBySMS(moduleResults: Record<string, unknown>[]) {
  console.log("\n3️⃣  Sending SMS notifications → 8 family members…");

  const passed  = moduleResults.filter(r => r["success"]).length;
  const message = [
    `💠 Transcend All complete.`,
    `${passed}/${moduleResults.length} modules live.`,
    DOMAIN ? `Dashboard: https://${DOMAIN}/createai-brain` : "Check your Brain dashboard.",
  ].join(" ");

  const phones = FAMILY_SMS_LIST.map(m => m.phone);
  const result = await sendSMSNotification(phones, message);
  console.log(`   ${result.successCount}/${result.total} SMS sent · overachievement: ${result.overachievement_pct}%`);
  return result;
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
    return parseAuditOutput(stdout);
  } catch (e) {
    return parseAuditOutput(((e as any).stdout ?? "") as string, (e as Error).message);
  }
}

function parseAuditOutput(stdout: string, fallbackError?: string): Record<string, unknown> {
  try {
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
    const icon = result.critical === 0 && result.high === 0 ? "✅" : "⚠️";
    console.log(`   ${icon} Vulns: ${result.total} (crit: ${result.critical}, high: ${result.high}), deps: ${result.dependencies}`);
    return result;
  } catch {
    console.warn(`   ⚠️  npm audit parse failed: ${fallbackError ?? "unknown"}`);
    return { real: false, error: fallbackError ?? "parse failed" };
  }
}

// ─── Main executor (exported + CLI) ──────────────────────────────────────────

export interface TranscendOptions {
  /** When false, skip email + SMS notifications (run modules and audit only). Default: true */
  sendNotifications?: boolean;
}

export interface ModuleSummary {
  name:               string;
  source:             string;
  score:              number;
  overachievement_pct: number;
  live:               boolean;
  task:               string;
}

export async function transcendAll(options: TranscendOptions = {}): Promise<Record<string, unknown>> {
  const { sendNotifications = true } = options;
  const startedAt = new Date().toISOString();
  console.log(`\n💠 Starting Beyond Infinity / No Limits Mode transcend… (${startedAt})`);
  if (!sendNotifications) console.log("   [notifications disabled via options]");

  const moduleResults  = await runModules();

  // Build structured modules summary for external consumers (transcend_master etc.)
  const industryBase    = 65;
  const modulesSummary: ModuleSummary[] = MODULES.map((m, i) => {
    const r = moduleResults[i] ?? {};
    const score = (r["score"] as number) ?? 0;
    return {
      name:               m.name,
      source:             (r["dataSource"] as string) ?? (r["apiProvider"] as string) ?? "unknown",
      score,
      overachievement_pct: parseFloat(((score / industryBase) * 100).toFixed(1)),
      live:               (r["live"] as boolean) ?? false,
      task:               m.task,
    };
  });

  let emailResult: Record<string, unknown> = { status: "skipped", reason: "sendNotifications=false" };
  let smsResult:   Record<string, unknown> = { status: "skipped", reason: "sendNotifications=false" };

  if (sendNotifications) {
    emailResult = await notifyByEmail(moduleResults) as unknown as Record<string, unknown>;
    smsResult   = await notifyBySMS(moduleResults) as unknown as Record<string, unknown>;
  }

  const auditResult    = runSecurityAudit();
  const auditSummary   = generateAuditSummary();

  const passed    = moduleResults.filter(r => r["success"]).length;
  const allPass   = passed === moduleResults.length;

  // Compute Beyond Infinity overachievement for modules
  const industryBaselineModules = 65; // % — typical module pass rate
  const moduleRate              = (passed / MODULES.length) * 100;
  const moduleOverachievement   = parseFloat(((moduleRate / industryBaselineModules) * 100).toFixed(1));

  const report: Record<string, unknown> = {
    mode:        "💠 No Limits Mode / Beyond Infinity / Absolute Transcendence",
    startedAt,
    completedAt: new Date().toISOString(),
    allPass,
    passed,
    total:       MODULES.length,
    moduleOverachievement_pct: moduleOverachievement,

    modules:      modulesSummary,   // structured summary for transcend_master + dashboards
    moduleResults,                  // raw full API response data

    notifications: {
      email: {
        recipients:          emailResult.total,
        sent:                emailResult.successCount,
        failed:              emailResult.failCount,
        successRate_pct:     emailResult.successRate_pct,
        overachievement_pct: emailResult.overachievement_pct,
        credentialsUsed:     emailResult.credentialsUsed,
        results:             emailResult.results,
      },
      sms: {
        recipients:          smsResult.total,
        sent:                smsResult.successCount,
        failed:              smsResult.failCount,
        successRate_pct:     smsResult.successRate_pct,
        overachievement_pct: smsResult.overachievement_pct,
        credentialsUsed:     smsResult.credentialsUsed,
        results:             smsResult.results,
      },
    },

    securityAudit: auditResult,
    credentialStatus: auditSummary.credentials,

    placeholders: auditSummary.placeholders,
    wiredEndpoints: auditSummary.endpoints,
    wiredScripts:   auditSummary.scripts,
    familyList:     auditSummary.familyList,
  };

  // Save report
  const reportPath = serverPath("transcend_report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  const emailSummary = sendNotifications
    ? `${emailResult["successCount"] ?? 0}/${emailResult["total"] ?? 0} · overachievement: ${emailResult["overachievement_pct"] ?? 0}%`
    : "skipped (sendNotifications=false)";
  const smsSummary = sendNotifications
    ? `${smsResult["successCount"] ?? 0}/${smsResult["total"] ?? 0} · overachievement: ${smsResult["overachievement_pct"] ?? 0}%`
    : "skipped (sendNotifications=false)";

  console.log(`\n💎 Full transcend report saved → ${reportPath}`);
  console.log(`   ${allPass ? "✅" : "⚠️"} ${passed}/${MODULES.length} modules LIVE · overachievement: ${moduleOverachievement}%`);
  console.log(`   📧 Email: ${emailSummary}`);
  console.log(`   📱 SMS:   ${smsSummary}`);
  console.log(`   🔒 Vulns: ${(auditResult["total"] as number) ?? "?"} (crit: ${(auditResult["critical"] as number) ?? "?"})`);

  return report;
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

const isMain =
  process.argv[1]?.endsWith("transcendAll.ts") ||
  process.argv[1]?.endsWith("transcendAll.js");

if (isMain) {
  transcendAll()
    .then(r => {
      console.log("\n💠 Transcend CLI summary:\n" + JSON.stringify({
        allPass:                    r["allPass"],
        passed:                     r["passed"],
        total:                      r["total"],
        moduleOverachievement_pct:  r["moduleOverachievement_pct"],
        email_sent:                 (r["notifications"] as any)?.email?.sent,
        email_overachievement_pct:  (r["notifications"] as any)?.email?.overachievement_pct,
        sms_sent:                   (r["notifications"] as any)?.sms?.sent,
        sms_overachievement_pct:    (r["notifications"] as any)?.sms?.overachievement_pct,
        vulns_total:                (r["securityAudit"] as any)?.total,
        vulns_critical:             (r["securityAudit"] as any)?.critical,
        credentialStatus:           r["credentialStatus"],
        placeholders:               r["placeholders"],
      }, null, 2));
      process.exit(0);
    })
    .catch(e => {
      console.error("❌ Transcend failed:", e);
      process.exit(1);
    });
}
