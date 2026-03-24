// ═══════════════════════════════════════════════════════════════════════════
// systemMemory.ts
// Non-personal, non-sensitive platform memory.
// Stores generated project summaries, engine usage stats, domain usage stats.
// Backed by PostgreSQL. No personal data, no PII, no encryption needed.
// ═══════════════════════════════════════════════════════════════════════════

import { getSql } from "../lib/db";

// Lazily resolved sql client
const sql = (...args: Parameters<ReturnType<typeof getSql>>) => getSql()(...args);

// ── Types ────────────────────────────────────────────────────────────────────

export interface FullAutoProjectSummary {
  id:          string;
  title:       string;
  domains:     string[];
  enginesUsed: string[];
  createdAt:   string;
  sandbox:     boolean;
  userId?:     string;
}

export interface EngineUsageSummary {
  engine: string;
  count:  number;
}

export interface DomainUsageSummary {
  domain: string;
  count:  number;
}

// ── Bootstrap (called from bootstrapSchema if needed) ─────────────────────

export async function bootstrapSystemMemoryTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS platform_generated_projects (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL DEFAULT '',
      domains      JSONB NOT NULL DEFAULT '[]',
      engines_used JSONB NOT NULL DEFAULT '[]',
      sandbox      BOOLEAN NOT NULL DEFAULT false,
      user_id      TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_gen_proj_user
      ON platform_generated_projects(user_id, created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_gen_proj_created
      ON platform_generated_projects(created_at DESC)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS platform_engine_usage (
      engine     TEXT PRIMARY KEY,
      use_count  BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS platform_domain_usage (
      domain     TEXT PRIMARY KEY,
      use_count  BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// ── recordGeneratedProject ───────────────────────────────────────────────────

export async function recordGeneratedProject(
  project: FullAutoProjectSummary,
): Promise<void> {
  try {
    await sql`
      INSERT INTO platform_generated_projects
        (id, title, domains, engines_used, sandbox, user_id, created_at)
      VALUES (
        ${project.id},
        ${project.title},
        ${JSON.stringify(project.domains)}::jsonb,
        ${JSON.stringify(project.enginesUsed)}::jsonb,
        ${project.sandbox},
        ${project.userId ?? null},
        ${project.createdAt}::timestamptz
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // Update engine usage counters
    for (const engine of project.enginesUsed) {
      await sql`
        INSERT INTO platform_engine_usage (engine, use_count, updated_at)
        VALUES (${engine}, 1, NOW())
        ON CONFLICT (engine) DO UPDATE
          SET use_count  = platform_engine_usage.use_count + 1,
              updated_at = NOW()
      `.catch(() => { /* non-critical */ });
    }

    // Update domain usage counters
    for (const domain of project.domains) {
      await sql`
        INSERT INTO platform_domain_usage (domain, use_count, updated_at)
        VALUES (${domain}, 1, NOW())
        ON CONFLICT (domain) DO UPDATE
          SET use_count  = platform_domain_usage.use_count + 1,
              updated_at = NOW()
      `.catch(() => { /* non-critical */ });
    }
  } catch (err) {
    console.error("[SystemMemory] recordGeneratedProject error:", err);
  }
}

// ── getRecentProjects ────────────────────────────────────────────────────────

export async function getRecentProjects(
  userId?: string,
): Promise<FullAutoProjectSummary[]> {
  try {
    const rows = userId
      ? await sql`
          SELECT id, title, domains, engines_used, sandbox, user_id, created_at
          FROM platform_generated_projects
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT 50
        `
      : await sql`
          SELECT id, title, domains, engines_used, sandbox, user_id, created_at
          FROM platform_generated_projects
          ORDER BY created_at DESC
          LIMIT 50
        `;

    return rows.map((r: Record<string, unknown>) => ({
      id:          String(r.id),
      title:       String(r.title),
      domains:     Array.isArray(r.domains) ? (r.domains as string[]) : [],
      enginesUsed: Array.isArray(r.engines_used) ? (r.engines_used as string[]) : [],
      sandbox:     Boolean(r.sandbox),
      userId:      r.user_id ? String(r.user_id) : undefined,
      createdAt:   r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
    }));
  } catch {
    return [];
  }
}

// ── getEngineUsageStats ──────────────────────────────────────────────────────

export async function getEngineUsageStats(): Promise<EngineUsageSummary[]> {
  try {
    const rows = await sql`
      SELECT engine, use_count
      FROM platform_engine_usage
      ORDER BY use_count DESC
      LIMIT 20
    `;
    return rows.map((r: Record<string, unknown>) => ({
      engine: String(r.engine),
      count:  Number(r.use_count),
    }));
  } catch {
    return [];
  }
}

// ── getDomainUsageStats ──────────────────────────────────────────────────────

export async function getDomainUsageStats(): Promise<DomainUsageSummary[]> {
  try {
    const rows = await sql`
      SELECT domain, use_count
      FROM platform_domain_usage
      ORDER BY use_count DESC
      LIMIT 20
    `;
    return rows.map((r: Record<string, unknown>) => ({
      domain: String(r.domain),
      count:  Number(r.use_count),
    }));
  } catch {
    return [];
  }
}
