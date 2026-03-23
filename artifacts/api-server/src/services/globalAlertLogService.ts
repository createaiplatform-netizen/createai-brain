/**
 * globalAlertLogService — Persist and retrieve GlobalPulse run reports.
 * Stores each orchestration run in platform_global_pulse_log.
 */

import { rawSql } from "@workspace/db";

export interface PulseReport {
  timestamp?:    string;
  nodesTested?:  number;
  alertResults?: Array<{ nodeId: string; success: boolean; durationMs?: number }>;
  taskResults?:  Array<{ task: string; success: boolean; error?: string }>;
  [key: string]: unknown;
}

export interface PulseLogEntry {
  id:          number;
  run_at:      string;
  nodes_tested: number;
  tasks_run:   number;
  success_rate: string;
}

async function ensureTable(): Promise<void> {
  await rawSql`
    CREATE TABLE IF NOT EXISTS platform_global_pulse_log (
      id           SERIAL PRIMARY KEY,
      run_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      nodes_tested INT         NOT NULL DEFAULT 0,
      tasks_run    INT         NOT NULL DEFAULT 0,
      success_rate NUMERIC(5,2),
      report       JSONB       NOT NULL DEFAULT '{}'::jsonb
    )
  `;
}

/** Persist a GlobalPulse run report. Returns the stored row ID. */
export async function saveGlobalAlertLog(report: PulseReport): Promise<{ id: number; successRate: string }> {
  await ensureTable();

  const nodesTested    = report.nodesTested  ?? report.alertResults?.length ?? 0;
  const tasksRun       = report.taskResults?.length ?? 0;
  const successNodes   = (report.alertResults ?? []).filter(r => r.success).length;
  const successTasks   = (report.taskResults  ?? []).filter(t => t.success).length;
  const totalItems     = nodesTested + tasksRun;
  const successRateNum = totalItems > 0
    ? (((successNodes + successTasks) / totalItems) * 100).toFixed(2)
    : "0.00";

  const rows = await rawSql`
    INSERT INTO platform_global_pulse_log (nodes_tested, tasks_run, success_rate, report)
    VALUES (
      ${nodesTested},
      ${tasksRun},
      ${successRateNum},
      ${JSON.stringify(report)}::jsonb
    )
    RETURNING id
  ` as Array<{ id: number }>;

  console.log(`[GlobalPulse] Run stored — id:${rows[0]!.id} · nodes:${nodesTested} · tasks:${tasksRun} · success:${successRateNum}%`);
  return { id: rows[0]!.id, successRate: `${successRateNum}%` };
}

/** Return the last N pulse run summaries (no full report JSON). */
export async function getPulseHistory(limit = 20): Promise<PulseLogEntry[]> {
  await ensureTable();
  return (await rawSql`
    SELECT id, run_at, nodes_tested, tasks_run, success_rate
    FROM platform_global_pulse_log
    ORDER BY run_at DESC
    LIMIT ${limit}
  `) as PulseLogEntry[];
}
