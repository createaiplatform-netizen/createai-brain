/**
 * ElectricNetWay Engine — Service Layer
 * Unified job queue for energy, device, internet, and data routing tasks.
 */

import { rawSql } from "@workspace/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NetJobCategory = "energy" | "device" | "internet" | "data";
export type NetJobStatus   = "pending" | "executing" | "completed" | "failed";

export interface NetJob {
  id:          number;
  category:    NetJobCategory;
  type:        string;
  target:      string;
  payload:     Record<string, unknown> | null;
  status:      NetJobStatus;
  result:      string | null;
  created_at:  string;
  updated_at:  string;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initElectricNetWay(): Promise<void> {
  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_electric_net_way_queue (
      id         SERIAL PRIMARY KEY,
      category   TEXT    NOT NULL,
      type       TEXT    NOT NULL,
      target     TEXT    NOT NULL,
      payload    JSONB,
      status     TEXT    NOT NULL DEFAULT 'pending',
      result     TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("[ElectricNetWay] Queue table ready.");
}

// ─── Queue ────────────────────────────────────────────────────────────────────

export async function queueNetJob(job: {
  category: NetJobCategory;
  type:     string;
  target:   string;
  payload?: Record<string, unknown>;
}): Promise<NetJob> {
  const payload = job.payload ? JSON.stringify(job.payload) : null;
  const rows = (await rawSql`
    INSERT INTO platform_electric_net_way_queue (category, type, target, payload)
    VALUES (${job.category}, ${job.type}, ${job.target}, ${payload}::jsonb)
    RETURNING *
  `) as Array<Record<string, string>>;
  return rows[0] as unknown as NetJob;
}

// ─── Route & Execute ──────────────────────────────────────────────────────────

async function routeAndExecute(job: NetJob): Promise<void> {
  await rawSql`
    UPDATE platform_electric_net_way_queue
    SET status = 'executing', updated_at = NOW()
    WHERE id = ${job.id}
  `;

  try {
    let resultText = "";

    switch (job.category) {
      case "energy":
        console.log(`[ElectricNetWay] Energy: ${job.type} → ${job.target}`);
        resultText = `Energy command '${job.type}' dispatched to ${job.target}`;
        break;
      case "device":
        console.log(`[ElectricNetWay] Device: ${job.type} → ${job.target}`);
        resultText = `Device command '${job.type}' sent to ${job.target}`;
        break;
      case "internet":
        console.log(`[ElectricNetWay] Internet: ${job.type} → ${job.target}`);
        resultText = `Network command '${job.type}' applied to ${job.target}`;
        break;
      case "data":
        console.log(`[ElectricNetWay] Data: ${job.type} → ${job.target}`);
        resultText = `Data payload '${job.type}' routed to ${job.target}`;
        break;
      default:
        throw new Error(`Unknown category: ${String((job as NetJob).category)}`);
    }

    await rawSql`
      UPDATE platform_electric_net_way_queue
      SET status = 'completed', result = ${resultText}, updated_at = NOW()
      WHERE id = ${job.id}
    `;
  } catch (err) {
    const msg = (err as Error).message;
    await rawSql`
      UPDATE platform_electric_net_way_queue
      SET status = 'failed', result = ${`Error: ${msg}`}, updated_at = NOW()
      WHERE id = ${job.id}
    `;
    throw err;
  }
}

// ─── Process Queue ────────────────────────────────────────────────────────────

export async function processQueue(): Promise<{ processed: number; completed: number; failed: number }> {
  const rows = (await rawSql`
    SELECT * FROM platform_electric_net_way_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 50
  `) as Array<Record<string, unknown>>;

  let completed = 0;
  let failed    = 0;

  for (const row of rows) {
    try {
      await routeAndExecute(row as unknown as NetJob);
      completed++;
    } catch {
      failed++;
    }
  }

  return { processed: rows.length, completed, failed };
}

// ─── Retry ────────────────────────────────────────────────────────────────────

export async function retryJob(id: number): Promise<void> {
  await rawSql`
    UPDATE platform_electric_net_way_queue
    SET status = 'pending', result = NULL, updated_at = NOW()
    WHERE id = ${id}
  `;
}

// ─── Status & Logs ────────────────────────────────────────────────────────────

export interface CategoryStat {
  category: string;
  status:   string;
  count:    number;
}

export async function getStatus(): Promise<CategoryStat[]> {
  const rows = (await rawSql`
    SELECT category, status, COUNT(*)::int AS count
    FROM platform_electric_net_way_queue
    GROUP BY category, status
    ORDER BY category, status
  `) as Array<Record<string, string>>;
  return rows.map(r => ({
    category: r.category,
    status:   r.status,
    count:    Number(r.count),
  }));
}

export async function getLogs(limit = 50, offset = 0): Promise<NetJob[]> {
  const rows = (await rawSql`
    SELECT * FROM platform_electric_net_way_queue
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as Array<Record<string, unknown>>;
  return rows as unknown as NetJob[];
}
