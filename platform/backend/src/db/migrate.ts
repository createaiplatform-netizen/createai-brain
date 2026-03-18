import pool from "../db";

// ─── Schema ───────────────────────────────────────────────────────────────────
// All SQL is inlined — tsc doesn't copy .sql files so any readFileSync of a
// .sql file would throw ENOENT in the Docker production image.
//
// All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS, making this
// idempotent and safe to run on every startup without touching existing data.
//
// Future: Replace with a versioned migration library (Flyway, db-migrate,
//   Drizzle migrate) that tracks applied migrations and supports rollbacks.

const SCHEMA_SQL = `
-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Organizations ────────────────────────────────────────────────────────────
-- One row per tenant (one nursing home facility, one company, etc.).
CREATE TABLE IF NOT EXISTS organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  settings     JSONB DEFAULT '{}',
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
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MFA (TOTP) ───────────────────────────────────────────────────────────────
-- One row per user who has enrolled in MFA. totp_secret is the base32 TOTP
-- seed. In production this column should be encrypted at rest with pgcrypto.
CREATE TABLE IF NOT EXISTS user_mfa (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  totp_secret TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Temporary tokens issued during MFA login challenge (5-minute TTL).
CREATE TABLE IF NOT EXISTS pending_mfa (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
-- One row per active login session. The session ID travels as an HMAC-signed
-- HTTP-only cookie. last_active_at enables inactivity-based expiry.
CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at     TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- ─── Audit Log (append-only — never update or delete rows) ───────────────────
-- Every read, write, or delete of sensitive data is recorded here.
-- Required for HIPAA §164.312(b) audit controls.
-- The BIGSERIAL primary key gives a tamper-evident monotonic ordering.
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email  TEXT,
  org_id      UUID,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  metadata    JSONB
);

-- ─── CLINICAL SCHEMA SKELETON ─────────────────────────────────────────────────
-- IMPORTANT: These tables are schema scaffolding only.
-- No real PHI may be stored until:
--   1. A signed Business Associate Agreement (BAA) is in place.
--   2. A HIPAA Security Risk Analysis is complete.
--   3. Column-level encryption is implemented for PHI columns.
--   4. PostgreSQL Row-Level Security policies are in place.
--
-- Until those conditions are met, populate with SYNTHETIC TEST DATA ONLY.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mrn             TEXT NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  date_of_birth   DATE NOT NULL,
  sex             TEXT,
  admission_date  DATE,
  discharge_date  DATE,
  status          TEXT NOT NULL DEFAULT 'admitted',
  source_system   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, mrn)
);

-- Cross-system patient ID mapping (EHR MRN, pharmacy ID, lab accession, etc.)
CREATE TABLE IF NOT EXISTS patient_identifiers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  system     TEXT NOT NULL,
  value      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(system, value)
);

-- ADT events from EHR (HL7 ADT messages map here)
CREATE TABLE IF NOT EXISTS encounters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'inpatient',
  status          TEXT NOT NULL DEFAULT 'active',
  admitted_at     TIMESTAMPTZ,
  discharged_at   TIMESTAMPTZ,
  room_bed        TEXT,
  attending_name  TEXT,
  source_system   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medication formulary (reference data, not PHI)
CREATE TABLE IF NOT EXISTS medications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rxnorm_code TEXT,
  ndc_code    TEXT,
  name        TEXT NOT NULL,
  strength    TEXT,
  form        TEXT,
  route       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active medication orders (MAR source — maps to HL7 RDE/RDS messages)
CREATE TABLE IF NOT EXISTS medication_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id    UUID REFERENCES encounters(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  medication_id   UUID REFERENCES medications(id),
  ordered_by      UUID REFERENCES users(id),
  med_name        TEXT NOT NULL,
  dose            TEXT,
  route           TEXT,
  frequency       TEXT,
  prn             BOOLEAN NOT NULL DEFAULT false,
  start_date      DATE,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'active',
  source_system   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vitals + lab results (LOINC-coded, maps to HL7 OBX segments / FHIR Observation)
CREATE TABLE IF NOT EXISTS observations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id    UUID REFERENCES encounters(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  category        TEXT NOT NULL DEFAULT 'vital-signs',
  loinc_code      TEXT,
  display_name    TEXT NOT NULL,
  value_text      TEXT,
  value_numeric   NUMERIC,
  unit            TEXT,
  reference_range TEXT,
  abnormal_flag   TEXT,
  observed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by     UUID REFERENCES users(id),
  source_system   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clinical notes (nursing, physician, therapy — must be signed before final)
CREATE TABLE IF NOT EXISTS clinical_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id    UUID REFERENCES encounters(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  author_id       UUID NOT NULL REFERENCES users(id),
  note_type       TEXT NOT NULL DEFAULT 'progress',
  content         TEXT NOT NULL,
  signed_at       TIMESTAMPTZ,
  amended_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_user_id         ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at      ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active     ON sessions(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_email              ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_org_id          ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user           ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_occurred       ON audit_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource       ON audit_log(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_patients_org             ON patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_pat  ON patient_identifiers(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_patient       ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_med_orders_patient       ON medication_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_observations_patient     ON observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient   ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_pending_mfa_expires      ON pending_mfa(expires_at);
`;

// ─── migrate() ────────────────────────────────────────────────────────────────

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
