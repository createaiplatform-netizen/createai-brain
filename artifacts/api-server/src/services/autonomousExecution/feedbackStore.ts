// ═══════════════════════════════════════════════════════════════════════════
// feedbackStore.ts
// Tracks engine and outcome success rates. Adjusts engine rankings over time.
// DB-backed via getSql(). All failures are silent — never crash the caller.
// ═══════════════════════════════════════════════════════════════════════════

import { getSql } from "../../lib/db";

const sql = (...args: Parameters<ReturnType<typeof getSql>>) => getSql()(...args);

// ── Bootstrap ──────────────────────────────────────────────────────────────

export async function bootstrapFeedbackTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS aes_engine_stats (
      engine_id   TEXT PRIMARY KEY,
      total_runs  BIGINT NOT NULL DEFAULT 0,
      successes   BIGINT NOT NULL DEFAULT 0,
      failures    BIGINT NOT NULL DEFAULT 0,
      avg_ms      NUMERIC(10,2) NOT NULL DEFAULT 0,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS aes_outcome_stats (
      goal_hash   TEXT PRIMARY KEY,
      goal_prefix TEXT NOT NULL DEFAULT '',
      total_runs  BIGINT NOT NULL DEFAULT 0,
      successes   BIGINT NOT NULL DEFAULT 0,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS aes_ai_cache (
      cache_key   TEXT PRIMARY KEY,
      prompt_hash TEXT NOT NULL DEFAULT '',
      result      TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      hit_count   BIGINT NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_aes_engine_stats_engine
      ON aes_engine_stats(engine_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_aes_ai_cache_key
      ON aes_ai_cache(cache_key)
  `;
}

// ── Engine Stats ──────────────────────────────────────────────────────────

export async function recordEngineResult(
  engineId: string,
  success: boolean,
  durationMs: number,
): Promise<void> {
  try {
    await sql`
      INSERT INTO aes_engine_stats (engine_id, total_runs, successes, failures, avg_ms, updated_at)
      VALUES (
        ${engineId}, 1,
        ${success ? 1 : 0},
        ${success ? 0 : 1},
        ${durationMs},
        NOW()
      )
      ON CONFLICT (engine_id) DO UPDATE
        SET total_runs = aes_engine_stats.total_runs + 1,
            successes  = aes_engine_stats.successes  + ${success ? 1 : 0},
            failures   = aes_engine_stats.failures   + ${success ? 0 : 1},
            avg_ms     = (aes_engine_stats.avg_ms * aes_engine_stats.total_runs + ${durationMs})
                          / (aes_engine_stats.total_runs + 1),
            updated_at = NOW()
    `;
  } catch {
    // Non-critical — never crash the execution path
  }
}

export async function getEngineSuccessRate(engineId: string): Promise<number> {
  try {
    const rows = await sql`
      SELECT successes, total_runs
      FROM aes_engine_stats
      WHERE engine_id = ${engineId}
    `;
    if (!rows.length) return 1.0; // Unknown → assume 100%
    const { successes, total_runs } = rows[0] as { successes: number; total_runs: number };
    return total_runs === 0 ? 1.0 : Number(successes) / Number(total_runs);
  } catch {
    return 1.0;
  }
}

export async function getAllEngineStats(): Promise<
  Array<{ engineId: string; successRate: number; totalRuns: number; avgMs: number }>
> {
  try {
    const rows = await sql`
      SELECT engine_id, successes, total_runs, avg_ms
      FROM aes_engine_stats
      ORDER BY total_runs DESC
    `;
    return (rows as Array<Record<string, unknown>>).map(r => ({
      engineId:    String(r.engine_id),
      successRate: Number(r.total_runs) === 0 ? 1.0 : Number(r.successes) / Number(r.total_runs),
      totalRuns:   Number(r.total_runs),
      avgMs:       Number(r.avg_ms),
    }));
  } catch {
    return [];
  }
}

// ── Outcome Stats ─────────────────────────────────────────────────────────

function hashGoal(goal: string): string {
  let hash = 0;
  for (let i = 0; i < goal.length; i++) {
    hash = ((hash << 5) - hash) + goal.charCodeAt(i);
    hash |= 0;
  }
  return `g_${Math.abs(hash).toString(36)}`;
}

export async function recordOutcomeResult(goal: string, success: boolean): Promise<void> {
  try {
    const key    = hashGoal(goal.toLowerCase().trim());
    const prefix = goal.slice(0, 80);
    await sql`
      INSERT INTO aes_outcome_stats (goal_hash, goal_prefix, total_runs, successes, updated_at)
      VALUES (${key}, ${prefix}, 1, ${success ? 1 : 0}, NOW())
      ON CONFLICT (goal_hash) DO UPDATE
        SET total_runs = aes_outcome_stats.total_runs + 1,
            successes  = aes_outcome_stats.successes + ${success ? 1 : 0},
            updated_at = NOW()
    `;
  } catch {
    // Non-critical
  }
}

// ── AI Cache ──────────────────────────────────────────────────────────────

export async function getCachedAIResult(cacheKey: string): Promise<string | null> {
  try {
    const rows = await sql`
      SELECT result FROM aes_ai_cache
      WHERE cache_key = ${cacheKey}
    `;
    if (!rows.length) return null;

    await sql`
      UPDATE aes_ai_cache
      SET hit_count = hit_count + 1
      WHERE cache_key = ${cacheKey}
    `.catch(() => {});

    return String((rows[0] as Record<string, unknown>).result);
  } catch {
    return null;
  }
}

export async function cacheAIResult(cacheKey: string, result: string): Promise<void> {
  try {
    await sql`
      INSERT INTO aes_ai_cache (cache_key, prompt_hash, result, created_at, hit_count)
      VALUES (${cacheKey}, ${cacheKey}, ${result}, NOW(), 0)
      ON CONFLICT (cache_key) DO UPDATE
        SET result    = ${result},
            hit_count = aes_ai_cache.hit_count + 1
    `;
  } catch {
    // Non-critical
  }
}
