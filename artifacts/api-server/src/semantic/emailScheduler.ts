/**
 * semantic/emailScheduler.ts
 * --------------------------
 * Post-purchase email sequence engine with DB persistence.
 *
 * Jobs survive server restarts via platform_email_jobs (Postgres).
 * In-memory array is the hot cache; DB is the source of truth.
 *
 * Sequence:
 *   T+0  → Delivery email (fired immediately in webhook)
 *   T+3  → "How are you enjoying [product]?" + tip + cross-sell
 *   T+7  → "Based on [product], you might love..." + curated upsell picks
 */

import { sendEmailNotification }         from "../utils/notifications.js";
import { PLATFORM }                      from "../services/platformIdentity.js";
import { getLaunchFlag, LAUNCH_FLAG_KEYS } from "../utils/launchFlags.js";
import { sql }                           from "@workspace/db";

export type JobStatus = "pending" | "sent" | "failed" | "skipped";
export type JobType   = "followup_3d" | "upsell_7d";

export interface EmailJob {
  id:            string;
  type:          JobType;
  customerEmail: string;
  customerName:  string;
  productId:     string;
  productTitle:  string;
  productFormat: string;
  storeUrl:      string;
  scheduledAt:   Date;
  sentAt?:       string;
  status:        JobStatus;
  error?:        string;
}

// ── In-memory hot cache ────────────────────────────────────────────────────────
const _jobs: EmailJob[] = [];
let _pollerStarted = false;

// ── DB helpers (fire-and-forget) ───────────────────────────────────────────────

async function persistJobToDB(job: EmailJob): Promise<void> {
  try {
    await sql`
      INSERT INTO platform_email_jobs
        (id, type, customer_email, customer_name, product_id,
         product_title, product_format, store_url, scheduled_at, status)
      VALUES
        (${job.id}, ${job.type}, ${job.customerEmail}, ${job.customerName},
         ${job.productId}, ${job.productTitle}, ${job.productFormat},
         ${job.storeUrl}, ${job.scheduledAt.toISOString()}, ${job.status})
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (err) {
    console.error("[EmailScheduler] persistJobToDB failed:", err);
  }
}

async function updateJobInDB(
  id:     string,
  status: JobStatus,
  sentAt?: string,
  error?:  string,
): Promise<void> {
  try {
    await sql`
      UPDATE platform_email_jobs
      SET
        status   = ${status},
        sent_at  = ${sentAt ?? null},
        error    = ${error ?? null}
      WHERE id = ${id}
    `;
  } catch (err) {
    console.error("[EmailScheduler] updateJobInDB failed:", err);
  }
}

// ── Startup loader ─────────────────────────────────────────────────────────────

export async function initEmailScheduler(): Promise<void> {
  try {
    const rows = await sql<{
      id: string; type: string; customer_email: string; customer_name: string;
      product_id: string; product_title: string; product_format: string;
      store_url: string; scheduled_at: string; sent_at: string | null;
      status: string; error: string | null;
    }[]>`
      SELECT * FROM platform_email_jobs
      WHERE status = 'pending'
      ORDER BY scheduled_at ASC
    `;

    let loaded = 0;
    for (const r of rows) {
      const already = _jobs.find(j => j.id === r.id);
      if (!already) {
        _jobs.push({
          id:            r.id,
          type:          r.type          as JobType,
          customerEmail: r.customer_email,
          customerName:  r.customer_name,
          productId:     r.product_id,
          productTitle:  r.product_title,
          productFormat: r.product_format,
          storeUrl:      r.store_url,
          scheduledAt:   new Date(r.scheduled_at),
          sentAt:        r.sent_at ?? undefined,
          status:        r.status as JobStatus,
          error:         r.error ?? undefined,
        });
        loaded++;
      }
    }

    console.log(`[EmailScheduler] Loaded ${loaded} pending job(s) from DB`);
    ensurePollerRunning();
  } catch (err) {
    console.error("[EmailScheduler] initEmailScheduler failed:", err);
  }
}

// ── Job scheduling ─────────────────────────────────────────────────────────────

export function scheduleFollowups(opts: {
  customerEmail: string;
  customerName:  string;
  productId:     string;
  productTitle:  string;
  productFormat: string;
  storeUrl:      string;
}): void {
  const now = Date.now();

  const fupJob: EmailJob = {
    id:          `fup-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type:        "followup_3d",
    scheduledAt: new Date(now + 3 * 24 * 60 * 60 * 1000),
    status:      "pending",
    ...opts,
  };

  const upsellJob: EmailJob = {
    id:          `upsell-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type:        "upsell_7d",
    scheduledAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
    status:      "pending",
    ...opts,
  };

  _jobs.push(fupJob, upsellJob);

  // Fire-and-forget DB persistence
  void persistJobToDB(fupJob);
  void persistJobToDB(upsellJob);

  console.log(`[EmailScheduler] Scheduled T+3 & T+7 for ${opts.customerEmail} → "${opts.productTitle}"`);
  ensurePollerRunning();
}

export function getJobs(): EmailJob[] {
  return [..._jobs].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

export function getJobStats(): {
  total: number; pending: number; sent: number; failed: number; nextJobAt?: string;
} {
  const pending = _jobs.filter(j => j.status === "pending");
  const sent    = _jobs.filter(j => j.status === "sent");
  const failed  = _jobs.filter(j => j.status === "failed");
  const sorted  = [...pending].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  return {
    total:     _jobs.length,
    pending:   pending.length,
    sent:      sent.length,
    failed:    failed.length,
    nextJobAt: sorted[0]?.scheduledAt.toISOString(),
  };
}

// ── Email builders ─────────────────────────────────────────────────────────────

function buildFollowupEmail(job: EmailJob): { subject: string; html: string } {
  const name = job.customerName ? `, ${job.customerName}` : "";
  const tips: Record<string, string> = {
    ebook:            "Block 20 minutes today to read the first chapter — the insight-to-page ratio is highest at the start.",
    template:         "Customize the core color, font, and logo first — then every section adapts around your brand automatically.",
    course:           "Complete the first module before the week is out — early momentum is the strongest predictor of completion.",
    audiobook:        "Try listening at 1.25x speed on your next commute — retention stays high and you save 20% of the time.",
    video:            "Watch once for the overview, then re-watch section by section and pause to apply each concept.",
    plugin:           "Start with the preset configurations — they cover 80% of use cases and give you a working baseline instantly.",
    software:         "Run through the quick-start wizard first. It pre-configures the tool to your workflow in under 5 minutes.",
    graphic:          "Export in both PNG (for digital use) and SVG (for print and scaling) — you'll need both eventually.",
    music:            "Layer this track at 60–70% volume under your primary audio — it lifts the production value without competing.",
    photo:            "The RAW version unlocks non-destructive editing — use it as your master and export copies for each use case.",
    platform:         "Open the Brain Hub and run one engine end-to-end today — the first real output is the best onboarding.",
    template_default: "Spend 10 minutes personalizing the key sections first — your audience will feel the difference.",
  };
  const tip  = tips[job.productFormat] ?? tips["template_default"]!;
  const SAGE = PLATFORM.brandColor;

  return {
    subject: `Quick tip for getting the most from "${job.productTitle}"`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:${SAGE};padding:40px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;font-size:22px;font-weight:800;margin:0;">Hey${name} — 3 days in 👋</h1>
        </div>
        <div style="padding:36px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
            You purchased <strong>${job.productTitle}</strong> a few days ago. Here's one thing most people miss:
          </p>
          <div style="background:${PLATFORM.brandColorLight};border-left:4px solid ${SAGE};border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px;">
            <p style="margin:0;font-size:15px;color:${PLATFORM.textColor};font-weight:600;line-height:1.6;">💡 ${tip}</p>
          </div>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">
            Any questions? Reply directly — our team is here.
          </p>
          <a href="${job.storeUrl}/api/semantic/store/${job.productId}"
             style="display:inline-block;background:${SAGE};color:white;text-decoration:none;border-radius:10px;padding:14px 28px;font-size:14px;font-weight:700;">
            Access Your Product →
          </a>
        </div>
        <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:20px;padding-bottom:24px;">
          ${PLATFORM.displayName} ·
          <a href="mailto:${PLATFORM.supportEmail}?subject=Unsubscribe" style="color:#94a3b8;text-decoration:none;">Unsubscribe</a>
        </p>
      </div>
    `,
  };
}

function buildUpsellEmail(job: EmailJob): { subject: string; html: string } {
  const name = job.customerName ? `, ${job.customerName}` : "";
  const companions: Record<string, string> = {
    ebook: "video course", course: "template bundle", template: "graphic pack",
    video: "audiobook",    audiobook: "course",       graphic: "template",
    plugin: "software",    software: "plugin",        music: "video",
    photo: "graphic",      "3D": "software",          platform: "higher-tier plan",
  };
  const companionFormat = companions[job.productFormat] ?? "template";
  const SAGE = PLATFORM.brandColor;

  return {
    subject: `What to stack on top of "${job.productTitle}"`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:linear-gradient(135deg,#1e293b,#334155);padding:40px;border-radius:16px 16px 0 0;">
          <div style="color:${SAGE};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Week 1 Complete</div>
          <h1 style="color:white;font-size:22px;font-weight:800;margin:0;line-height:1.4;">What to stack on top of "${job.productTitle}"</h1>
        </div>
        <div style="padding:36px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Hey${name}. Now that you've had a full week, the highest-leverage next move is a <strong>${companionFormat}</strong> that builds on the same foundation.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Browse the full catalog</p>
            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Filter by "${companionFormat}" to see everything that pairs well.</p>
          </div>
          <a href="${job.storeUrl}/api/semantic/store?format=${encodeURIComponent(companionFormat)}"
             style="display:inline-block;background:${SAGE};color:white;text-decoration:none;border-radius:10px;padding:14px 28px;font-size:14px;font-weight:700;">
            Browse ${companionFormat} products →
          </a>
        </div>
        <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:20px;padding-bottom:24px;">
          ${PLATFORM.displayName} ·
          <a href="mailto:${PLATFORM.supportEmail}?subject=Unsubscribe" style="color:#94a3b8;text-decoration:none;">Unsubscribe</a>
        </p>
      </div>
    `,
  };
}

// ── Background poller ──────────────────────────────────────────────────────────

function ensurePollerRunning(): void {
  if (_pollerStarted) return;
  _pollerStarted = true;

  setInterval(async () => {
    const now = new Date();
    const due = _jobs.filter(j => j.status === "pending" && j.scheduledAt <= now);
    if (due.length === 0) return;

    console.log(`[EmailScheduler] Poller — ${due.length} job(s) due`);

    for (const job of due) {
      try {
        const flagKey = job.type === "followup_3d"
          ? LAUNCH_FLAG_KEYS.POST_PURCHASE_EMAILS
          : LAUNCH_FLAG_KEYS.NURTURE_SEQUENCES;
        const launchEnabled = await getLaunchFlag(flagKey);

        if (!launchEnabled) {
          job.status = "skipped";
          job.sentAt = new Date().toISOString();
          void updateJobInDB(job.id, "skipped", job.sentAt);
          console.log(`[EmailScheduler] Job ${job.id} skipped — flag '${flagKey}' OFF`);
          continue;
        }

        const { subject, html } = job.type === "followup_3d"
          ? buildFollowupEmail(job)
          : buildUpsellEmail(job);

        const result  = await sendEmailNotification([job.customerEmail], subject, html);
        const success = result.successCount > 0;

        job.status = success ? "sent" : "failed";
        job.sentAt = new Date().toISOString();
        if (!success) job.error = result.results[0]?.reason ?? "unknown";

        void updateJobInDB(job.id, job.status, job.sentAt, job.error);
        console.log(`[EmailScheduler] Job ${job.id} (${job.type}) → ${success ? "✅ sent" : "❌ failed"} → ${job.customerEmail}`);
      } catch (err: unknown) {
        job.status = "failed";
        job.error  = err instanceof Error ? err.message : String(err);
        void updateJobInDB(job.id, "failed", undefined, job.error);
        console.error(`[EmailScheduler] Job ${job.id} error:`, job.error);
      }
    }
  }, 60_000);

  console.log("[EmailScheduler] Background poller started — checking every 60s");
}
