import pool from "../db";

// ─── Schema ───────────────────────────────────────────────────────────────────
// SQL is inlined here (not read from a file) so it survives the TypeScript
// build process. `tsc` only copies .ts files into dist/ — any .sql file
// referenced via readFileSync would be missing in the Docker production image
// and crash the server on startup.
//
// Future: Replace with a versioned migration library (db-migrate, Flyway,
//   Drizzle migrate) that tracks which migrations have already been applied.

const SCHEMA_SQL = `
-- Enable UUID generation (idempotent, safe to run every time)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Organizations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  name            TEXT,
  role            TEXT NOT NULL DEFAULT 'member',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Projects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'general',
  status          TEXT NOT NULL DEFAULT 'active',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_org_id      ON projects(organization_id);
`;

// ─── migrate() ────────────────────────────────────────────────────────────────
// Applies the schema to the connected PostgreSQL database.
// All statements use IF NOT EXISTS — safe to run on every startup without
// destroying existing data.

export async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(SCHEMA_SQL);
    console.log("[migrate] Schema applied successfully.");
  } catch (err) {
    console.error("[migrate] Failed to apply schema:", err);
    throw err;
  } finally {
    client.release();
  }
}
