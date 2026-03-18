-- ─── Universal Platform — Database Schema ────────────────────────────────────
-- Run this once against your PostgreSQL database to set up the schema.
-- The server's migrate.ts runs this automatically on startup.
--
-- Future: Add Drizzle ORM or Prisma for type-safe, versioned migrations.
-- Future: Add pgcrypto extension for gen_random_uuid() if not available.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Organizations ────────────────────────────────────────────────────────────
-- One row per tenant. All users and projects belong to an organization.
-- In a nursing home deployment: one row per facility.

CREATE TABLE IF NOT EXISTS organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,          -- URL-safe identifier
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Future: plan (text), hipaa_mode (bool), ai_provider (text), logo_url (text)
);

-- ─── Users ────────────────────────────────────────────────────────────────────
-- Platform users. Scoped to an organization (organization_id nullable for
-- super-admins who span all organizations).

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  name            TEXT,
  role            TEXT NOT NULL DEFAULT 'member',   -- 'admin' | 'member' | 'viewer'
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Future: mfa_enabled (bool), mfa_secret (text, encrypted)
  -- Future: last_login_at (timestamptz)
  -- Future: is_active (bool default true) for deactivating accounts without deletion
  -- Future: invited_by (uuid, fk to users)
);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
-- One row per active login session. The session ID is stored in a signed
-- HTTP-only cookie on the client. Sessions expire after SESSION_TTL.
--
-- Future: Add ip_address and user_agent for security audit logging.
-- Future: Add a revoked_at column so admins can force-logout a user.
-- Future: For HIPAA compliance, auto-expire sessions after 30 minutes of
--   inactivity rather than a fixed TTL.

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  metadata    JSONB,                           -- ip, user_agent, device type, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Projects ─────────────────────────────────────────────────────────────────
-- Projects are scoped to an organization. Users only see their org's projects.

CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'general',
  status          TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'archived' | 'deleted'
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Future: description (text), ai_agent_context (jsonb), scaffold_type (text)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_user_id   ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_org_id     ON projects(organization_id);
