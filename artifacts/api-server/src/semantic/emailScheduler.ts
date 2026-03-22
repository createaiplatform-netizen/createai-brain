/**
 * semantic/emailScheduler.ts
 * --------------------------
 * Post-purchase email sequence engine.
 *
 * Schedules and fires T+0 (delivery), T+3 (follow-up), and T+7 (upsell) emails
 * for every semantic product purchase captured by the webhook CRM.
 *
 * Architecture: In-memory job queue with a 60-second background poller.
 * Upgrade path: replace _jobs array with a DB table (semantic_email_jobs) —
 * the interface and caller code do not change.
 *
 * Sequence:
 *   T+0  → Delivery email (fired immediately in webhook)
 *   T+3  → "How are you enjoying [product]?" + tip + cross-sell
 *   T+7  → "Based on [product], you might love..." + curated upsell picks
 */

import { sendEmailNotification } from "../utils/notifications.js";
import { PLATFORM } from "../services/platformIdentity.js";

export type JobStatus = "pending" | "sent" | "failed" | "skipped";
export type JobType   = "followup_3d" | "upsell_7d";

export interface EmailJob {
  id: string;
  type: JobType;
  customerEmail: string;
  customerName: string;
  productId: string;
  productTitle: string;
  productFormat: string;
  storeUrl: string;
  scheduledAt: Date;
  sentAt?: string;
  status: JobStatus;
  error?: string;
}

const _jobs: EmailJob[] = [];

let _pollerStarted = false;

// ── Job scheduling ─────────────────────────────────────────────────────────────

export function scheduleFollowups(opts: {
  customerEmail: string;
  customerName: string;
  productId: string;
  productTitle: string;
  productFormat: string;
  storeUrl: string;
}): void {
  const now = Date.now();

  _jobs.push({
    id: `fup-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type: "followup_3d",
    scheduledAt: new Date(now + 3 * 24 * 60 * 60 * 1000), // T+3 days
    status: "pending",
    ...opts,
  });

  _jobs.push({
    id: `upsell-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type: "upsell_7d",
    scheduledAt: new Date(now + 7 * 24 * 60 * 60 * 1000), // T+7 days
    status: "pending",
    ...opts,
  });

  console.log(`[EmailScheduler] Scheduled T+3 & T+7 sequence for ${opts.customerEmail} → "${opts.productTitle}"`);
  ensurePollerRunning();
}

export function getJobs(): EmailJob[] {
  return [..._jobs].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

export function getJobStats(): {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  nextJobAt?: string;
} {
  const pending = _jobs.filter(j => j.status === "pending");
  const sent    = _jobs.filter(j => j.status === "sent");
  const failed  = _jobs.filter(j => j.status === "failed");
  const sorted  = [...pending].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  return {
    total:      _jobs.length,
    pending:    pending.length,
    sent:       sent.length,
    failed:     failed.length,
    nextJobAt:  sorted[0]?.scheduledAt.toISOString(),
  };
}

// ── Email builders ─────────────────────────────────────────────────────────────

function buildFollowupEmail(job: EmailJob): { subject: string; html: string } {
  const name = job.customerName ? `, ${job.customerName}` : "";
  const tips: Record<string, string> = {
    ebook:      "Block 20 minutes today to read the first chapter — the insight-to-page ratio is highest at the start.",
    template:   "Customize the core color, font, and logo first — then every section adapts around your brand automatically.",
    course:     "Complete the first module before the week is out — early momentum is the strongest predictor of completion.",
    audiobook:  "Try listening at 1.25x speed on your next commute — retention stays high and you save 20% of the time.",
    video:      "Watch once for the overview, then re-watch section by section and pause to apply each concept.",
    plugin:     "Start with the preset configurations — they cover 80% of use cases and give you a working baseline instantly.",
    software:   "Run through the quick-start wizard first. It pre-configures the tool to your workflow in under 5 minutes.",
    graphic:    "Export in both PNG (for digital use) and SVG (for print and scaling) — you'll need both eventually.",
    music:      "Layer this track at 60–70% volume under your primary audio — it lifts the production value without competing.",
    photo:      "The RAW version unlocks non-destructive editing — use it as your master and export copies for each use case.",
    "3D":       "Import into your scene at 0.01 scale first, then adjust — most 3D assets export at massive real-world dimensions.",
    template_default: "Spend 10 minutes personalizing the key sections first — your audience will feel the difference.",
  };
  const tip = tips[job.productFormat] ?? tips["template_default"]!;

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
            You purchased <strong>${job.productTitle}</strong> a few days ago. Here's one thing most people miss about getting the best results from a ${job.productFormat} like this:
          </p>
          <div style="background:${PLATFORM.brandColorLight};border-left:4px solid ${SAGE};border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px;">
            <p style="margin:0;font-size:15px;color:${PLATFORM.textColor};font-weight:600;line-height:1.6;">💡 ${tip}</p>
          </div>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">
            Any questions? Reply to this email directly — our team is here to help.
          </p>
          <a href="${job.storeUrl}/api/semantic/store/${job.productId}"
             style="display:inline-block;background:${SAGE};color:white;text-decoration:none;border-radius:10px;padding:14px 28px;font-size:14px;font-weight:700;">
            Access Your Product →
          </a>
        </div>
        <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:20px;padding-bottom:24px;">
          ${PLATFORM.displayName} · <a href="${job.storeUrl}/api/semantic/store" style="color:#94a3b8;">Browse all products</a>
        </p>
      </div>
    `,
  };
}

function buildUpsellEmail(job: EmailJob): { subject: string; html: string } {
  const name = job.customerName ? `, ${job.customerName}` : "";
  const companions: Record<string, string> = {
    ebook:      "video course",
    course:     "template bundle",
    template:   "graphic pack",
    video:      "audiobook",
    audiobook:  "course",
    graphic:    "template",
    plugin:     "software",
    software:   "plugin",
    music:      "video",
    photo:      "graphic",
    "3D":       "software",
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
            Hey${name}. Now that you've had a full week with your ${job.productFormat}, the highest-leverage next move is usually a <strong>${companionFormat}</strong> that builds on the same skill set.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Here's why: the ${job.productFormat} gives you the knowledge or asset — the ${companionFormat} gives you the implementation layer on top of it. Together they compound instead of just adding.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Browse the full catalog</p>
            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Filter by "${companionFormat}" to see everything that pairs with what you already own.</p>
          </div>
          <a href="${job.storeUrl}/api/semantic/store?format=${encodeURIComponent(companionFormat)}"
             style="display:inline-block;background:${SAGE};color:white;text-decoration:none;border-radius:10px;padding:14px 28px;font-size:14px;font-weight:700;">
            Browse ${companionFormat} products →
          </a>
        </div>
        <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:20px;padding-bottom:24px;">
          ${PLATFORM.displayName} · You're receiving this because you purchased from our store.
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
        const { subject, html } = job.type === "followup_3d"
          ? buildFollowupEmail(job)
          : buildUpsellEmail(job);

        const result = await sendEmailNotification([job.customerEmail], subject, html);
        const success = result.successCount > 0;

        job.status  = success ? "sent" : "failed";
        job.sentAt  = new Date().toISOString();
        if (!success) job.error = result.results[0]?.reason ?? "unknown";

        console.log(`[EmailScheduler] Job ${job.id} (${job.type}) → ${success ? "✅ sent" : "❌ failed"} → ${job.customerEmail}`);
      } catch (err: unknown) {
        job.status = "failed";
        job.error  = err instanceof Error ? err.message : String(err);
        console.error(`[EmailScheduler] Job ${job.id} error:`, job.error);
      }
    }
  }, 60_000); // Check every 60 seconds

  console.log("[EmailScheduler] Background poller started — checking every 60s");
}
