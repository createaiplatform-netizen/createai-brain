/**
 * utils/jobQueue.ts — Thin Job Queue Abstraction
 * ─────────────────────────────────────────────────
 * WHAT: A minimal abstraction layer over async background work (emails,
 *       notifications, webhook delivery, heavy processing). Currently runs
 *       all jobs INLINE (synchronous to the request), but the call sites are
 *       structured so they can be swapped to a real queue without change.
 *
 * WHY SAFE: No behavior changes today. This only wraps existing inline async
 *           calls in a consistent interface. If the enqueue call fails, the
 *           error is caught and logged — the main request path is never blocked.
 *
 * SCALE PATH:
 *   - Today:   jobs run inline using Promise (fire-and-forget with error catch).
 *   - Phase 2: replace `runInline` with a BullMQ `queue.add()` call.
 *              Import a Redis client here. No call site changes needed.
 *   - Phase 3: add retry logic, dead-letter queues, priority lanes — all
 *              behind this interface.
 *
 * USAGE:
 *   import { jobQueue } from "../utils/jobQueue.js";
 *
 *   // Fire-and-forget: does not delay response
 *   jobQueue.enqueue("send-welcome-email", async () => {
 *     await sendWelcomeEmail(userId, email);
 *   });
 *
 *   // Wait for result: use when the response depends on the job output
 *   const result = await jobQueue.run("generate-summary", async () => {
 *     return await generateSummary(data);
 *   });
 *
 * IN-MEMORY STATE WARNING:
 *   The current inline runner has no persistence. If the process restarts
 *   mid-job, the job is lost. This is acceptable for soft work (notifications,
 *   analytics pings). For hard work (financial records, delivery emails),
 *   use DB-backed state (platform_email_jobs, platform_outbound_log) in
 *   addition to enqueuing the job.
 */

type JobFn<T = void> = () => Promise<T>;

interface JobQueueInterface {
  /**
   * Fire-and-forget. The job runs async after the current request completes.
   * Errors are caught and logged — never thrown to the caller.
   */
  enqueue(name: string, fn: JobFn<void>): void;

  /**
   * Run and await the result. Use when the HTTP response depends on the output.
   * Errors propagate to the caller — handle them there.
   */
  run<T>(name: string, fn: JobFn<T>): Promise<T>;
}

// ── In-process inline runner (Phase 1) ───────────────────────────────────────
// TODO [Phase 2]: Replace this object with a BullMQ adapter that implements
//   the same JobQueueInterface. Import Redis client here. No call site changes.
const inlineRunner: JobQueueInterface = {
  enqueue(name: string, fn: JobFn<void>): void {
    // setImmediate defers to the next event loop tick — response is sent first.
    setImmediate(() => {
      fn().catch((err: unknown) => {
        console.error(JSON.stringify({
          level:  "ERROR",
          event:  "job_queue_error",
          job:    name,
          error:  err instanceof Error ? err.message : String(err),
          ts:     new Date().toISOString(),
        }));
      });
    });
  },

  async run<T>(name: string, fn: JobFn<T>): Promise<T> {
    // Inline run — no deferral. Awaited by the caller.
    try {
      return await fn();
    } catch (err: unknown) {
      console.error(JSON.stringify({
        level:  "ERROR",
        event:  "job_queue_error",
        job:    name,
        error:  err instanceof Error ? err.message : String(err),
        ts:     new Date().toISOString(),
      }));
      throw err;
    }
  },
};

// Export the single queue instance. Swap the implementation in one place.
export const jobQueue: JobQueueInterface = inlineRunner;

// ── Typed job helpers ─────────────────────────────────────────────────────────
// Add named wrappers for common job types so call sites are self-documenting
// and can carry typed payloads in Phase 2.

/**
 * Enqueue a transactional email job (fire-and-forget).
 * DB record should already be written to platform_email_jobs before calling this.
 */
export function enqueueEmailJob(jobName: string, fn: JobFn<void>): void {
  jobQueue.enqueue(`email:${jobName}`, fn);
}

/**
 * Enqueue an in-app notification delivery (fire-and-forget).
 */
export function enqueueNotificationJob(jobName: string, fn: JobFn<void>): void {
  jobQueue.enqueue(`notification:${jobName}`, fn);
}

/**
 * Enqueue an outbound webhook delivery (fire-and-forget).
 */
export function enqueueWebhookJob(jobName: string, fn: JobFn<void>): void {
  jobQueue.enqueue(`webhook:${jobName}`, fn);
}
