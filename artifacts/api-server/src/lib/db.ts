/**
 * lib/db.ts — PostgreSQL client + schema bootstrap
 * -------------------------------------------------
 * Uses the `postgres` npm package (lightweight, no native deps).
 * Tables are created idempotently on first connection.
 * All semantic customer / subscription / event data persists here.
 */

import postgres from "postgres";
import crypto from "crypto";

let _sql: ReturnType<typeof postgres> | null = null;

export function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    const cleanUrl = url.replace(/[?&]sslmode=[^&]*/g, "").replace(/[?&]ssl=[^&]*/g, "");
    _sql = postgres(cleanUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: false,
    });
  }
  return _sql;
}

// ── Schema bootstrap ─────────────────────────────────────────────────────────

export async function bootstrapSchema(): Promise<void> {
  const sql = getSql();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS platform_customers (
        id                    TEXT PRIMARY KEY,
        email                 TEXT NOT NULL,
        name                  TEXT NOT NULL DEFAULT '',
        stripe_session_id     TEXT NOT NULL UNIQUE,
        stripe_payment_intent TEXT NOT NULL DEFAULT '',
        stripe_customer_id    TEXT NOT NULL DEFAULT '',
        product_id            TEXT NOT NULL DEFAULT '',
        product_title         TEXT NOT NULL DEFAULT '',
        product_format        TEXT NOT NULL DEFAULT '',
        price_cents           INTEGER NOT NULL DEFAULT 0,
        currency              TEXT NOT NULL DEFAULT 'usd',
        channel               TEXT NOT NULL DEFAULT 'store',
        is_subscription       BOOLEAN NOT NULL DEFAULT FALSE,
        subscription_tier     TEXT,
        delivery_email_sent   BOOLEAN NOT NULL DEFAULT FALSE,
        delivery_sent_at      TIMESTAMPTZ,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_subscriptions (
        id                 TEXT PRIMARY KEY,
        customer_id        TEXT NOT NULL,
        email              TEXT NOT NULL,
        name               TEXT NOT NULL DEFAULT '',
        tier               TEXT NOT NULL,
        stripe_sub_id      TEXT NOT NULL UNIQUE,
        stripe_price_id    TEXT NOT NULL,
        status             TEXT NOT NULL DEFAULT 'active',
        current_period_end TIMESTAMPTZ,
        cancel_at_period   BOOLEAN NOT NULL DEFAULT FALSE,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_webhook_events (
        id            TEXT PRIMARY KEY,
        stripe_event  TEXT NOT NULL UNIQUE,
        event_type    TEXT NOT NULL,
        payload       JSONB NOT NULL DEFAULT '{}',
        processed     BOOLEAN NOT NULL DEFAULT FALSE,
        processed_at  TIMESTAMPTZ,
        error         TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_email_jobs (
        id             TEXT PRIMARY KEY,
        type           TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_name  TEXT NOT NULL DEFAULT '',
        product_id     TEXT NOT NULL DEFAULT '',
        product_title  TEXT NOT NULL DEFAULT '',
        product_format TEXT NOT NULL DEFAULT '',
        store_url      TEXT NOT NULL DEFAULT '',
        scheduled_at   TIMESTAMPTZ NOT NULL,
        sent_at        TIMESTAMPTZ,
        status         TEXT NOT NULL DEFAULT 'pending',
        error          TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_stripe_prices (
        id          TEXT PRIMARY KEY,
        tier        TEXT NOT NULL UNIQUE,
        price_id    TEXT NOT NULL,
        product_id  TEXT NOT NULL,
        amount      INTEGER NOT NULL,
        currency    TEXT NOT NULL DEFAULT 'usd',
        interval    TEXT NOT NULL DEFAULT 'month',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_ai_generations (
        id           TEXT PRIMARY KEY,
        tool         TEXT NOT NULL,
        input_json   JSONB NOT NULL DEFAULT '{}',
        output_text  TEXT NOT NULL DEFAULT '',
        tokens_used  INTEGER NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_form_submissions (
        id           TEXT PRIMARY KEY,
        form_id      TEXT NOT NULL,
        form_title   TEXT NOT NULL DEFAULT '',
        data_json    JSONB NOT NULL DEFAULT '{}',
        ip_hash      TEXT NOT NULL DEFAULT '',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // ── NEW TABLES FOR 200% INDUSTRY UPGRADE ─────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS platform_trackers (
        id           TEXT PRIMARY KEY,
        type         TEXT NOT NULL DEFAULT 'project',
        title        TEXT NOT NULL,
        description  TEXT NOT NULL DEFAULT '',
        owner_email  TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'active',
        priority     TEXT NOT NULL DEFAULT 'medium',
        due_date     DATE,
        metadata     JSONB NOT NULL DEFAULT '{}',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_tracker_items (
        id           TEXT PRIMARY KEY,
        tracker_id   TEXT NOT NULL,
        title        TEXT NOT NULL,
        description  TEXT NOT NULL DEFAULT '',
        status       TEXT NOT NULL DEFAULT 'open',
        assignee     TEXT NOT NULL DEFAULT '',
        due_date     DATE,
        notes        TEXT NOT NULL DEFAULT '',
        completed_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_leads (
        id             TEXT PRIMARY KEY,
        name           TEXT NOT NULL,
        email          TEXT NOT NULL DEFAULT '',
        phone          TEXT NOT NULL DEFAULT '',
        company        TEXT NOT NULL DEFAULT '',
        source         TEXT NOT NULL DEFAULT 'manual',
        stage          TEXT NOT NULL DEFAULT 'new',
        value_cents    INTEGER NOT NULL DEFAULT 0,
        notes          TEXT NOT NULL DEFAULT '',
        follow_up_date DATE,
        assigned_to    TEXT NOT NULL DEFAULT '',
        ai_score       INTEGER,
        ai_summary     TEXT NOT NULL DEFAULT '',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_appointments (
        id             TEXT PRIMARY KEY,
        type           TEXT NOT NULL DEFAULT 'consultation',
        name           TEXT NOT NULL,
        email          TEXT NOT NULL,
        phone          TEXT NOT NULL DEFAULT '',
        preferred_date TEXT NOT NULL DEFAULT '',
        notes          TEXT NOT NULL DEFAULT '',
        status         TEXT NOT NULL DEFAULT 'pending',
        confirmed_at   TIMESTAMPTZ,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_time_entries (
        id             TEXT PRIMARY KEY,
        professional_email TEXT NOT NULL DEFAULT '',
        project        TEXT NOT NULL DEFAULT '',
        client_name    TEXT NOT NULL DEFAULT '',
        description    TEXT NOT NULL,
        hours_decimal  NUMERIC(6,2) NOT NULL DEFAULT 0,
        rate_cents     INTEGER NOT NULL DEFAULT 0,
        work_date      DATE NOT NULL DEFAULT CURRENT_DATE,
        billable       BOOLEAN NOT NULL DEFAULT TRUE,
        invoiced       BOOLEAN NOT NULL DEFAULT FALSE,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_loyalty_ledger (
        id               TEXT PRIMARY KEY,
        customer_email   TEXT NOT NULL,
        points           INTEGER NOT NULL DEFAULT 0,
        transaction_type TEXT NOT NULL DEFAULT 'earn',
        reference_id     TEXT NOT NULL DEFAULT '',
        notes            TEXT NOT NULL DEFAULT '',
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_reviews (
        id             TEXT PRIMARY KEY,
        product_id     TEXT NOT NULL,
        product_title  TEXT NOT NULL DEFAULT '',
        customer_email TEXT NOT NULL,
        customer_name  TEXT NOT NULL DEFAULT '',
        rating         INTEGER NOT NULL DEFAULT 5,
        review_text    TEXT NOT NULL DEFAULT '',
        status         TEXT NOT NULL DEFAULT 'pending',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // ── Indexes ───────────────────────────────────────────────────────────────
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_email      ON platform_customers(LOWER(email))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_created    ON platform_customers(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_stripe_cid ON platform_customers(stripe_customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_events_type  ON platform_webhook_events(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_gen_tool          ON platform_ai_generations(tool, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_form_subs_form_id    ON platform_form_submissions(form_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trackers_type_status ON platform_trackers(type, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tracker_items_tid    ON platform_tracker_items(tracker_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_stage          ON platform_leads(stage, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_status  ON platform_appointments(status, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_time_entries_project ON platform_time_entries(project, work_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_loyalty_email        ON platform_loyalty_ledger(customer_email, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_product      ON platform_reviews(product_id, status)`;

    // ── Identity & Auth Extension Tables ────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS platform_trusted_devices (
        id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id       TEXT NOT NULL,
        device_name   TEXT NOT NULL DEFAULT 'Unknown Device',
        device_token  TEXT NOT NULL UNIQUE,
        webauthn_credential_id TEXT,
        webauthn_public_key    TEXT,
        webauthn_counter       BIGINT DEFAULT 0,
        phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
        last_used_at  TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON platform_trusted_devices(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trusted_devices_token ON platform_trusted_devices(device_token)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_phone_verifications (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id      TEXT NOT NULL,
        phone        TEXT NOT NULL,
        otp_hash     TEXT NOT NULL,
        expires_at   TIMESTAMPTZ NOT NULL,
        verified_at  TIMESTAMPTZ,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_phone_verif_user ON platform_phone_verifications(user_id, created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_family_identities (
        id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id       TEXT NOT NULL UNIQUE,
        display_name  TEXT NOT NULL,
        avatar_emoji  TEXT NOT NULL DEFAULT '🌱',
        avatar_color  TEXT NOT NULL DEFAULT '#7a9068',
        member_type   TEXT NOT NULL DEFAULT 'adult',
        bio           TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_family_invites (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        email       TEXT NOT NULL,
        role        TEXT NOT NULL DEFAULT 'family_adult',
        token       TEXT NOT NULL UNIQUE,
        invited_by  TEXT NOT NULL,
        accepted_by TEXT,
        expires_at  TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_family_invites_token ON platform_family_invites(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_family_invites_email ON platform_family_invites(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_family_invites_by   ON platform_family_invites(invited_by)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_bills (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id         TEXT NOT NULL,
        name            TEXT NOT NULL,
        payee           TEXT NOT NULL DEFAULT '',
        amount_cents    INTEGER NOT NULL DEFAULT 0,
        due_date        DATE,
        payment_method  TEXT NOT NULL DEFAULT 'manual',
        status          TEXT NOT NULL DEFAULT 'pending',
        notes           TEXT,
        approved_at     TIMESTAMPTZ,
        paid_at         TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_user ON platform_bills(user_id, due_date ASC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_status ON platform_bills(status)`;

    // ── Life OS Extension Tables ─────────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS platform_audit_logs (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        actor_id    TEXT NOT NULL,
        event_type  TEXT NOT NULL,
        target_id   TEXT,
        target_type TEXT,
        details     JSONB NOT NULL DEFAULT '{}',
        ip_address  TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_actor   ON platform_audit_logs(actor_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_type    ON platform_audit_logs(event_type, created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_family_bank_accounts (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id      TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL DEFAULT 'My Account',
        balance_cents INTEGER NOT NULL DEFAULT 0,
        currency     TEXT NOT NULL DEFAULT 'USD',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_fbank_user ON platform_family_bank_accounts(user_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_family_bank_transactions (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        account_id   TEXT NOT NULL,
        user_id      TEXT NOT NULL,
        type         TEXT NOT NULL DEFAULT 'earn',
        amount_cents INTEGER NOT NULL,
        reason       TEXT NOT NULL DEFAULT '',
        notes        TEXT,
        approved_by  TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_fbank_txn_acct ON platform_family_bank_transactions(account_id, created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_family_bank_goals (
        id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id       TEXT NOT NULL,
        name          TEXT NOT NULL,
        emoji         TEXT NOT NULL DEFAULT '🎯',
        target_cents  INTEGER NOT NULL DEFAULT 0,
        current_cents INTEGER NOT NULL DEFAULT 0,
        deadline      DATE,
        completed     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_fbank_goals_user ON platform_family_bank_goals(user_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_family_conversations (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        name         TEXT,
        type         TEXT NOT NULL DEFAULT 'direct',
        participant_ids TEXT[] NOT NULL DEFAULT '{}',
        created_by   TEXT NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_family_messages (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        conversation_id TEXT NOT NULL,
        sender_id       TEXT NOT NULL,
        content         TEXT NOT NULL,
        content_type    TEXT NOT NULL DEFAULT 'text',
        read_by         TEXT[] NOT NULL DEFAULT '{}',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_fmsg_conv ON platform_family_messages(conversation_id, created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_life_events (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id     TEXT NOT NULL,
        category    TEXT NOT NULL DEFAULT 'civic',
        title       TEXT NOT NULL,
        description TEXT,
        event_date  DATE,
        reminder_at TIMESTAMPTZ,
        official_url TEXT,
        completed   BOOLEAN NOT NULL DEFAULT FALSE,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_life_events_user ON platform_life_events(user_id, event_date ASC NULLS LAST)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_habits (
        id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id        TEXT NOT NULL,
        name           TEXT NOT NULL,
        emoji          TEXT NOT NULL DEFAULT '🌱',
        frequency      TEXT NOT NULL DEFAULT 'daily',
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_done_at   DATE,
        paused         BOOLEAN NOT NULL DEFAULT FALSE,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_habits_user ON platform_habits(user_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_habit_completions (
        id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        habit_id   TEXT NOT NULL,
        user_id    TEXT NOT NULL,
        done_on    DATE NOT NULL,
        note       TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(habit_id, done_on)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_habit_comp_habit ON platform_habit_completions(habit_id, done_on DESC)`;

    // Guardian approval columns — safe to run repeatedly (IF NOT EXISTS)
    await sql`ALTER TABLE platform_habit_completions ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'`;
    await sql`ALTER TABLE platform_habit_completions ADD COLUMN IF NOT EXISTS parent_note    TEXT`;
    await sql`ALTER TABLE platform_habit_completions ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMPTZ`;
    await sql`ALTER TABLE platform_habit_completions ADD COLUMN IF NOT EXISTS reviewed_by    TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_contributions (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id     TEXT NOT NULL,
        type        TEXT NOT NULL DEFAULT 'participation',
        points      INTEGER NOT NULL DEFAULT 1,
        reason      TEXT NOT NULL DEFAULT '',
        awarded_by  TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_contrib_user ON platform_contributions(user_id, created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_journal_entries (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id      TEXT NOT NULL,
        title        TEXT NOT NULL DEFAULT '',
        content      TEXT NOT NULL DEFAULT '',
        mood         TEXT,
        entry_date   DATE NOT NULL DEFAULT CURRENT_DATE,
        is_private   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_journal_user ON platform_journal_entries(user_id, entry_date DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_notifications (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id      TEXT NOT NULL,
        type         TEXT NOT NULL DEFAULT 'reminder',
        title        TEXT NOT NULL,
        body         TEXT,
        link_path    TEXT,
        read_at      TIMESTAMPTZ,
        dismissed_at TIMESTAMPTZ,
        scheduled_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifs_user ON platform_notifications(user_id, created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_welcome_log (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id      TEXT NOT NULL UNIQUE,
        role_at_time TEXT NOT NULL DEFAULT 'user',
        email_sent   BOOLEAN NOT NULL DEFAULT FALSE,
        message_sent BOOLEAN NOT NULL DEFAULT FALSE,
        sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_welcome_log_user ON platform_welcome_log(user_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_outbound_log (
        id            TEXT PRIMARY KEY,
        timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id       TEXT,
        role          TEXT,
        universe      TEXT,
        type          TEXT NOT NULL,
        channel       TEXT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'pending',
        subject       TEXT,
        recipient     TEXT,
        metadata      JSONB NOT NULL DEFAULT '{}',
        error_message TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_outbound_log_user      ON platform_outbound_log(user_id, timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outbound_log_type      ON platform_outbound_log(type, timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outbound_log_channel   ON platform_outbound_log(channel, timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_outbound_log_timestamp ON platform_outbound_log(timestamp DESC)`;

    // ── SCALABILITY INDEXES (additive, idempotent, safe to re-run) ─────────────
    // WHAT: Missing indexes on high-read tables identified during scalability audit.
    // WHY SAFE: All use CREATE INDEX IF NOT EXISTS — no-op on repeat runs.
    //           No columns changed, no constraints modified, no data affected.
    // SCALE PATH: At higher query volume, consider partial indexes or covering
    //   indexes here. Add them as new IF NOT EXISTS statements — never modify these.

    // platform_subscriptions — queried by email on lookup; by created_at on admin views.
    await sql`CREATE INDEX IF NOT EXISTS idx_subs_email      ON platform_subscriptions(LOWER(email))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_subs_created    ON platform_subscriptions(created_at DESC)`;

    // platform_email_jobs — job worker polls by status; admin views by created_at.
    await sql`CREATE INDEX IF NOT EXISTS idx_email_jobs_status   ON platform_email_jobs(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_jobs_created  ON platform_email_jobs(created_at DESC)`;

    // platform_family_conversations — queried with: WHERE userId = ANY(participant_ids)
    // GIN index on array column is the correct index type for = ANY() queries.
    await sql`CREATE INDEX IF NOT EXISTS idx_family_conv_participants ON platform_family_conversations USING GIN(participant_ids)`;

    // platform_stripe_prices — queried by product_id when resolving product→price mappings
    // (SELECT tier, price_id, product_id, amount FROM platform_stripe_prices).
    // tier already has an implicit UNIQUE index. product_id is the external join key.
    await sql`CREATE INDEX IF NOT EXISTS idx_stripe_prices_product ON platform_stripe_prices(product_id)`;

    // platform_webhook_events — existing idx_webhook_events_type covers event_type filters.
    // Adding created_at DESC covers chronological admin/audit queries and idempotency checks.
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON platform_webhook_events(created_at DESC)`;

    // platform_family_bank_transactions — queried by user via account join; also by created_at.
    // account_id index already exists (idx_fbank_txn_acct). Adding user-level if needed.
    // TODO: if direct user_id queries are added to this table, add idx_fbank_txn_user here.

    // platform_habit_completions — completion queries filter by user_id via habit join.
    // habit_id index already exists (idx_habit_comp_habit). The user→habit join path is covered.
    // Direct user_id queries on completions would benefit from a covering index, but none
    // currently exist in the query layer — leaving a TODO rather than guessing.
    // TODO: if direct user_id queries are added to habit_completions, add:
    //   CREATE INDEX IF NOT EXISTS idx_habit_comp_user ON platform_habit_completions(user_id, done_on DESC)

    await sql`
      CREATE TABLE IF NOT EXISTS platform_push_subscriptions (
        id          TEXT PRIMARY KEY DEFAULT ('psub_' || gen_random_uuid()::text),
        user_id     TEXT NOT NULL,
        endpoint    TEXT NOT NULL UNIQUE,
        p256dh      TEXT NOT NULL,
        auth_key    TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_push_sub_user ON platform_push_subscriptions(user_id)`;

    // ── EBS: Event Bus System tables ─────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS platform_ebs_event_store (
        id              SERIAL PRIMARY KEY,
        event_id        TEXT        NOT NULL UNIQUE,
        topic           TEXT        NOT NULL,
        event_type      TEXT        NOT NULL,
        source          TEXT        NOT NULL DEFAULT 'platform',
        correlation_id  TEXT,
        idempotency_key TEXT        UNIQUE,
        payload         JSONB       NOT NULL DEFAULT '{}',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_topic      ON platform_ebs_event_store (topic)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_event_type ON platform_ebs_event_store (event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_source     ON platform_ebs_event_store (source)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_created    ON platform_ebs_event_store (created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_store_corr       ON platform_ebs_event_store (correlation_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_ebs_idempotency (
        id           SERIAL PRIMARY KEY,
        idem_key     TEXT        NOT NULL UNIQUE,
        event_type   TEXT        NOT NULL,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        result_hash  TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_idem_key  ON platform_ebs_idempotency (idem_key)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_idem_type ON platform_ebs_idempotency (event_type)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_ebs_dlq (
        id            SERIAL PRIMARY KEY,
        dlq_id        TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
        queue_source  TEXT        NOT NULL,
        event_id      TEXT,
        message_type  TEXT        NOT NULL,
        payload       JSONB       NOT NULL DEFAULT '{}',
        error_message TEXT        NOT NULL DEFAULT '',
        attempts      INTEGER     NOT NULL DEFAULT 1,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at   TIMESTAMPTZ,
        resolved_by   TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_dlq_source   ON platform_ebs_dlq (queue_source)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_dlq_resolved ON platform_ebs_dlq (resolved_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_dlq_created  ON platform_ebs_dlq (created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS platform_ebs_outbound_webhooks (
        id              SERIAL PRIMARY KEY,
        hook_id         TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
        url             TEXT        NOT NULL,
        event_type      TEXT        NOT NULL,
        payload         JSONB       NOT NULL DEFAULT '{}',
        secret          TEXT,
        status          TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','sent','retrying','failed')),
        attempts        INTEGER     NOT NULL DEFAULT 0,
        max_attempts    INTEGER     NOT NULL DEFAULT 5,
        next_retry_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_error      TEXT,
        response_code   INTEGER,
        correlation_id  TEXT,
        idempotency_key TEXT        UNIQUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sent_at         TIMESTAMPTZ
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_ohook_status  ON platform_ebs_outbound_webhooks (status, next_retry_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ebs_ohook_created ON platform_ebs_outbound_webhooks (created_at DESC)`;

    // ── Magic link tokens (DB-backed, survives restarts) ─────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS platform_magic_tokens (
        token_hash   TEXT PRIMARY KEY,
        email        TEXT NOT NULL,
        expires_at   TIMESTAMPTZ NOT NULL,
        used         BOOLEAN NOT NULL DEFAULT FALSE,
        device_fingerprint TEXT NOT NULL DEFAULT '',
        ip_address   TEXT NOT NULL DEFAULT '',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_magic_tokens_email   ON platform_magic_tokens(LOWER(email))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_magic_tokens_expires ON platform_magic_tokens(expires_at)`;

    // ── Invoices (DB-backed, survives restarts) ───────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS platform_invoices (
        id             TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        client_email   TEXT NOT NULL DEFAULT '',
        client_name    TEXT NOT NULL DEFAULT '',
        client_company TEXT NOT NULL DEFAULT '',
        status         TEXT NOT NULL DEFAULT 'draft',
        currency       TEXT NOT NULL DEFAULT 'USD',
        subtotal       NUMERIC(12,2) NOT NULL DEFAULT 0,
        tax_rate       NUMERIC(5,2) NOT NULL DEFAULT 0,
        tax_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
        total          NUMERIC(12,2) NOT NULL DEFAULT 0,
        issue_date     TEXT NOT NULL DEFAULT '',
        due_date       TEXT NOT NULL DEFAULT '',
        notes          TEXT NOT NULL DEFAULT '',
        line_items     JSONB NOT NULL DEFAULT '[]',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status  ON platform_invoices(status, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_client  ON platform_invoices(LOWER(client_email))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_number  ON platform_invoices(invoice_number)`;

    // ── System Memory — generated projects, engine/domain usage stats ─────────
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
    await sql`CREATE INDEX IF NOT EXISTS idx_gen_proj_user    ON platform_generated_projects(user_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gen_proj_created ON platform_generated_projects(created_at DESC)`;
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

    // ── Autonomous Execution System tables ─────────────────────────────────
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
      CREATE INDEX IF NOT EXISTS idx_aes_engine_stats_engine ON aes_engine_stats(engine_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_aes_ai_cache_key ON aes_ai_cache(cache_key)
    `;

    // ── Idempotent column additions (ALTER TABLE IF NOT EXISTS ... ADD COLUMN IF NOT EXISTS) ──
    await sql`ALTER TABLE platform_trusted_devices ADD COLUMN IF NOT EXISTS user_agent TEXT NOT NULL DEFAULT ''`.catch(() => {});
    await sql`ALTER TABLE platform_trusted_devices ADD COLUMN IF NOT EXISTS fingerprint TEXT NOT NULL DEFAULT ''`.catch(() => {});

    console.log("[DB] Schema bootstrap complete");
  } catch (err) {
    console.error("[DB] Schema bootstrap failed:", err instanceof Error ? err.message : String(err));
  }
}

// ── Customer operations ───────────────────────────────────────────────────────

export interface DBCustomer {
  id: string;
  email: string;
  name: string;
  stripeSessionId: string;
  stripePaymentIntent: string;
  stripeCustomerId: string;
  productId: string;
  productTitle: string;
  productFormat: string;
  priceCents: number;
  currency: string;
  channel: string;
  isSubscription: boolean;
  subscriptionTier?: string;
  deliveryEmailSent: boolean;
  deliverySentAt?: string;
  createdAt: string;
}

export async function insertCustomer(c: DBCustomer): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO platform_customers
      (id, email, name, stripe_session_id, stripe_payment_intent, stripe_customer_id,
       product_id, product_title, product_format, price_cents, currency, channel,
       is_subscription, subscription_tier, delivery_email_sent, created_at)
    VALUES
      (${c.id}, ${c.email}, ${c.name}, ${c.stripeSessionId}, ${c.stripePaymentIntent},
       ${c.stripeCustomerId}, ${c.productId}, ${c.productTitle}, ${c.productFormat},
       ${c.priceCents}, ${c.currency}, ${c.channel}, ${c.isSubscription},
       ${c.subscriptionTier ?? null}, ${c.deliveryEmailSent}, NOW())
    ON CONFLICT (stripe_session_id) DO NOTHING
  `;
}

export async function getCustomers(): Promise<DBCustomer[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM platform_customers ORDER BY created_at DESC LIMIT 500
  `;
  return rows.map(mapCustomer);
}

export async function getCustomerStats() {
  const sql = getSql();
  const [stats] = await sql`
    SELECT
      COUNT(*)::int                                    AS total_customers,
      COUNT(DISTINCT email)::int                        AS unique_emails,
      COALESCE(SUM(price_cents)::int, 0)               AS total_revenue,
      COALESCE(AVG(price_cents)::int, 0)               AS avg_order
    FROM platform_customers
  `;
  const topProducts = await sql`
    SELECT product_id, product_title, COUNT(*)::int AS cnt
    FROM platform_customers
    GROUP BY product_id, product_title
    ORDER BY cnt DESC LIMIT 5
  `;
  const topFormats = await sql`
    SELECT product_format, COUNT(*)::int AS cnt
    FROM platform_customers
    GROUP BY product_format
    ORDER BY cnt DESC LIMIT 5
  `;
  return {
    totalCustomers:    stats?.["total_customers"]  ?? 0,
    uniqueEmails:      stats?.["unique_emails"]     ?? 0,
    totalRevenueCents: stats?.["total_revenue"]    ?? 0,
    averageOrderCents: stats?.["avg_order"]         ?? 0,
    topProducts:       topProducts.map(r => ({ productId: String(r["product_id"]), productTitle: String(r["product_title"]), count: Number(r["cnt"]) })),
    topFormats:        topFormats.map(r => ({ format: String(r["product_format"]), count: Number(r["cnt"]) })),
  };
}

function mapCustomer(r: Record<string, unknown>): DBCustomer {
  return {
    id:                  String(r["id"] ?? ""),
    email:               String(r["email"] ?? ""),
    name:                String(r["name"] ?? ""),
    stripeSessionId:     String(r["stripe_session_id"] ?? ""),
    stripePaymentIntent: String(r["stripe_payment_intent"] ?? ""),
    stripeCustomerId:    String(r["stripe_customer_id"] ?? ""),
    productId:           String(r["product_id"] ?? ""),
    productTitle:        String(r["product_title"] ?? ""),
    productFormat:       String(r["product_format"] ?? ""),
    priceCents:          Number(r["price_cents"] ?? 0),
    currency:            String(r["currency"] ?? "usd"),
    channel:             String(r["channel"] ?? ""),
    isSubscription:      Boolean(r["is_subscription"]),
    subscriptionTier:    r["subscription_tier"] ? String(r["subscription_tier"]) : undefined,
    deliveryEmailSent:   Boolean(r["delivery_email_sent"]),
    deliverySentAt:      r["delivery_sent_at"] ? String(r["delivery_sent_at"]) : undefined,
    createdAt:           String(r["created_at"] ?? ""),
  };
}

export async function markWebhookProcessed(eventId: string, eventType: string, payload: unknown): Promise<boolean> {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO platform_webhook_events (id, stripe_event, event_type, payload, processed, processed_at)
    VALUES (${eventId}, ${eventId}, ${eventType}, ${JSON.stringify(payload)}, TRUE, NOW())
    ON CONFLICT (stripe_event) DO NOTHING
    RETURNING id
  `;
  return !!row;
}

export async function saveStripePrice(tier: string, priceId: string, productId: string, amount: number): Promise<void> {
  const sql = getSql();
  const id = "sp_" + tier + "_" + Date.now();
  await sql`
    INSERT INTO platform_stripe_prices (id, tier, price_id, product_id, amount)
    VALUES (${id}, ${tier}, ${priceId}, ${productId}, ${amount})
    ON CONFLICT (tier) DO UPDATE SET price_id = EXCLUDED.price_id, product_id = EXCLUDED.product_id
  `;
}

export async function getStripePrices(): Promise<Record<string, { priceId: string; productId: string; amount: number }>> {
  const sql = getSql();
  const rows = await sql`SELECT tier, price_id, product_id, amount FROM platform_stripe_prices`;
  const result: Record<string, { priceId: string; productId: string; amount: number }> = {};
  for (const r of rows) {
    result[String(r["tier"])] = {
      priceId:   String(r["price_id"]),
      productId: String(r["product_id"]),
      amount:    Number(r["amount"]),
    };
  }
  return result;
}

export async function markDeliveryEmailSent(sessionId: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE platform_customers SET delivery_email_sent = TRUE, delivery_sent_at = NOW()
    WHERE stripe_session_id = ${sessionId}
  `;
}

export async function findCustomersByEmail(email: string): Promise<DBCustomer[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM platform_customers
    WHERE LOWER(email) = LOWER(${email})
    ORDER BY created_at DESC
  `;
  return rows.map(mapCustomer);
}

export async function getRecentCustomers(limit = 20): Promise<DBCustomer[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM platform_customers ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map(mapCustomer);
}

export async function getRevenueTimeline(): Promise<Array<{ date: string; revenue: number; orders: number }>> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      DATE(created_at)::text   AS date,
      SUM(price_cents)::int    AS revenue,
      COUNT(*)::int            AS orders
    FROM platform_customers
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;
  return rows.map(r => ({
    date:    String(r["date"] ?? ""),
    revenue: Number(r["revenue"] ?? 0),
    orders:  Number(r["orders"] ?? 0),
  }));
}

export async function saveAiGeneration(tool: string, input: unknown, output: string, tokensUsed = 0): Promise<void> {
  const sql = getSql();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO platform_ai_generations (id, tool, input_json, output_text, tokens_used)
    VALUES (${id}, ${tool}, ${JSON.stringify(input)}, ${output}, ${tokensUsed})
  `.catch(e => console.warn("[DB] saveAiGeneration failed:", e instanceof Error ? e.message : String(e)));
}

export async function getRecentAiGenerations(tool?: string, limit = 20): Promise<Array<{ id: string; tool: string; outputText: string; createdAt: string }>> {
  const sql = getSql();
  const rows = tool
    ? await sql`SELECT id, tool, output_text, created_at FROM platform_ai_generations WHERE tool = ${tool} ORDER BY created_at DESC LIMIT ${limit}`
    : await sql`SELECT id, tool, output_text, created_at FROM platform_ai_generations ORDER BY created_at DESC LIMIT ${limit}`;
  return rows.map(r => ({
    id:         String(r["id"] ?? ""),
    tool:       String(r["tool"] ?? ""),
    outputText: String(r["output_text"] ?? ""),
    createdAt:  String(r["created_at"] ?? ""),
  }));
}

export async function saveFormSubmission(formId: string, formTitle: string, data: unknown, ipHash = ""): Promise<void> {
  const sql = getSql();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO platform_form_submissions (id, form_id, form_title, data_json, ip_hash)
    VALUES (${id}, ${formId}, ${formTitle}, ${JSON.stringify(data)}, ${ipHash})
  `.catch(e => console.warn("[DB] saveFormSubmission failed:", e instanceof Error ? e.message : String(e)));
}

export async function getRecentWebhookEvents(limit = 10): Promise<Array<{ id: string; eventType: string; processedAt: string | null; createdAt: string }>> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, event_type, processed_at, created_at
    FROM platform_webhook_events
    ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rows.map(r => ({
    id:          String(r["id"] ?? ""),
    eventType:   String(r["event_type"] ?? ""),
    processedAt: r["processed_at"] ? String(r["processed_at"]) : null,
    createdAt:   String(r["created_at"] ?? ""),
  }));
}

// ── Tracker operations ────────────────────────────────────────────────────────

export async function createTracker(type: string, title: string, description: string, ownerEmail: string, priority: string, dueDate?: string): Promise<string> {
  const sql = getSql();
  const id = "trk_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await sql`
    INSERT INTO platform_trackers (id, type, title, description, owner_email, priority, due_date)
    VALUES (${id}, ${type}, ${title}, ${description}, ${ownerEmail}, ${priority}, ${dueDate ?? null})
  `;
  return id;
}

export async function getTrackers(type?: string): Promise<Array<Record<string, unknown>>> {
  const sql = getSql();
  const rows = type
    ? await sql`SELECT * FROM platform_trackers WHERE type = ${type} ORDER BY created_at DESC LIMIT 200`
    : await sql`SELECT * FROM platform_trackers ORDER BY created_at DESC LIMIT 200`;
  return rows as unknown as Array<Record<string, unknown>>;
}

export async function getTrackerById(id: string): Promise<Record<string, unknown> | null> {
  const sql = getSql();
  const [row] = await sql`SELECT * FROM platform_trackers WHERE id = ${id}`;
  return row ?? null;
}

export async function updateTrackerStatus(id: string, status: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE platform_trackers SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
}

export async function addTrackerItem(trackerId: string, title: string, description: string, assignee: string, dueDate?: string): Promise<string> {
  const sql = getSql();
  const id = "ti_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await sql`
    INSERT INTO platform_tracker_items (id, tracker_id, title, description, assignee, due_date)
    VALUES (${id}, ${trackerId}, ${title}, ${description}, ${assignee}, ${dueDate ?? null})
  `;
  return id;
}

export async function getTrackerItems(trackerId: string): Promise<Array<Record<string, unknown>>> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM platform_tracker_items WHERE tracker_id = ${trackerId} ORDER BY created_at ASC`;
  return rows as unknown as Array<Record<string, unknown>>;
}

export async function updateTrackerItemStatus(itemId: string, status: string): Promise<void> {
  const sql = getSql();
  const completedAt = status === "done" ? "NOW()" : null;
  if (status === "done") {
    await sql`UPDATE platform_tracker_items SET status = ${status}, completed_at = NOW() WHERE id = ${itemId}`;
  } else {
    await sql`UPDATE platform_tracker_items SET status = ${status}, completed_at = NULL WHERE id = ${itemId}`;
  }
}

// ── Lead operations ───────────────────────────────────────────────────────────

export async function createLead(data: { name: string; email: string; phone: string; company: string; source: string; valueCents: number; notes: string; followUpDate?: string }): Promise<string> {
  const sql = getSql();
  const id = "ld_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await sql`
    INSERT INTO platform_leads (id, name, email, phone, company, source, value_cents, notes, follow_up_date)
    VALUES (${id}, ${data.name}, ${data.email}, ${data.phone}, ${data.company}, ${data.source}, ${data.valueCents}, ${data.notes}, ${data.followUpDate ?? null})
  `;
  return id;
}

export async function getLeads(stage?: string): Promise<Array<Record<string, unknown>>> {
  const sql = getSql();
  const rows = stage
    ? await sql`SELECT * FROM platform_leads WHERE stage = ${stage} ORDER BY created_at DESC LIMIT 200`
    : await sql`SELECT * FROM platform_leads ORDER BY created_at DESC LIMIT 200`;
  return rows as unknown as Array<Record<string, unknown>>;
}

export async function updateLeadStage(id: string, stage: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE platform_leads SET stage = ${stage}, updated_at = NOW() WHERE id = ${id}`;
}

export async function updateLeadAiScore(id: string, score: number, summary: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE platform_leads SET ai_score = ${score}, ai_summary = ${summary}, updated_at = NOW() WHERE id = ${id}`;
}

// ── Appointment operations ────────────────────────────────────────────────────

export async function createAppointment(data: { type: string; name: string; email: string; phone: string; preferredDate: string; notes: string }): Promise<string> {
  const sql = getSql();
  const id = "apt_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await sql`
    INSERT INTO platform_appointments (id, type, name, email, phone, preferred_date, notes)
    VALUES (${id}, ${data.type}, ${data.name}, ${data.email}, ${data.phone}, ${data.preferredDate}, ${data.notes})
  `;
  return id;
}

export async function getAppointments(status?: string): Promise<Array<Record<string, unknown>>> {
  const sql = getSql();
  const rows = status
    ? await sql`SELECT * FROM platform_appointments WHERE status = ${status} ORDER BY created_at DESC LIMIT 200`
    : await sql`SELECT * FROM platform_appointments ORDER BY created_at DESC LIMIT 200`;
  return rows as unknown as Array<Record<string, unknown>>;
}

export async function updateAppointmentStatus(id: string, status: string): Promise<void> {
  const sql = getSql();
  if (status === "confirmed") {
    await sql`UPDATE platform_appointments SET status = ${status}, confirmed_at = NOW() WHERE id = ${id}`;
  } else {
    await sql`UPDATE platform_appointments SET status = ${status} WHERE id = ${id}`;
  }
}

// ── Time entry operations ─────────────────────────────────────────────────────

export async function logTimeEntry(data: { professionalEmail: string; project: string; clientName: string; description: string; hoursDecimal: number; rateCents: number; workDate: string; billable: boolean }): Promise<string> {
  const sql = getSql();
  const id = "te_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await sql`
    INSERT INTO platform_time_entries (id, professional_email, project, client_name, description, hours_decimal, rate_cents, work_date, billable)
    VALUES (${id}, ${data.professionalEmail}, ${data.project}, ${data.clientName}, ${data.description}, ${data.hoursDecimal}, ${data.rateCents}, ${data.workDate}, ${data.billable})
  `;
  return id;
}

export async function getTimeEntries(project?: string): Promise<Array<Record<string, unknown>>> {
  const sql = getSql();
  const rows = project
    ? await sql`SELECT * FROM platform_time_entries WHERE project = ${project} ORDER BY work_date DESC LIMIT 200`
    : await sql`SELECT * FROM platform_time_entries ORDER BY work_date DESC LIMIT 200`;
  return rows as unknown as Array<Record<string, unknown>>;
}

export async function getTimeSummary(): Promise<{ totalHours: number; billableHours: number; totalValueCents: number }> {
  const sql = getSql();
  const [row] = await sql`
    SELECT
      COALESCE(SUM(hours_decimal), 0)::float                                        AS total_hours,
      COALESCE(SUM(CASE WHEN billable THEN hours_decimal ELSE 0 END), 0)::float     AS billable_hours,
      COALESCE(SUM(CASE WHEN billable THEN hours_decimal * rate_cents ELSE 0 END), 0)::int AS total_value
    FROM platform_time_entries
  `;
  return {
    totalHours:      Number(row?.["total_hours"] ?? 0),
    billableHours:   Number(row?.["billable_hours"] ?? 0),
    totalValueCents: Number(row?.["total_value"] ?? 0),
  };
}

// ── Loyalty operations ────────────────────────────────────────────────────────

export async function awardLoyaltyPoints(email: string, points: number, transactionType: string, referenceId: string, notes: string): Promise<void> {
  const sql = getSql();
  const id = "loy_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await sql`
    INSERT INTO platform_loyalty_ledger (id, customer_email, points, transaction_type, reference_id, notes)
    VALUES (${id}, ${email.toLowerCase()}, ${points}, ${transactionType}, ${referenceId}, ${notes})
  `.catch(e => console.warn("[DB] awardLoyaltyPoints failed:", e instanceof Error ? e.message : String(e)));
}

export async function getLoyaltyBalance(email: string): Promise<number> {
  const sql = getSql();
  const [row] = await sql`
    SELECT COALESCE(SUM(CASE WHEN transaction_type = 'redeem' THEN -points ELSE points END), 0)::int AS balance
    FROM platform_loyalty_ledger WHERE LOWER(customer_email) = LOWER(${email})
  `;
  return Number(row?.["balance"] ?? 0);
}

export async function getLoyaltyLeaderboard(limit = 20): Promise<Array<{ email: string; balance: number }>> {
  const sql = getSql();
  const rows = await sql`
    SELECT customer_email AS email,
      SUM(CASE WHEN transaction_type = 'redeem' THEN -points ELSE points END)::int AS balance
    FROM platform_loyalty_ledger
    GROUP BY customer_email
    ORDER BY balance DESC
    LIMIT ${limit}
  `;
  return rows.map(r => ({ email: String(r["email"] ?? ""), balance: Number(r["balance"] ?? 0) }));
}

// ── Review operations ─────────────────────────────────────────────────────────

export async function submitReview(data: { productId: string; productTitle: string; customerEmail: string; customerName: string; rating: number; reviewText: string }): Promise<string> {
  const sql = getSql();
  const id = "rev_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await sql`
    INSERT INTO platform_reviews (id, product_id, product_title, customer_email, customer_name, rating, review_text)
    VALUES (${id}, ${data.productId}, ${data.productTitle}, ${data.customerEmail}, ${data.customerName}, ${data.rating}, ${data.reviewText})
  `;
  return id;
}

export async function getReviews(status?: string): Promise<Array<Record<string, unknown>>> {
  const sql = getSql();
  const rows = status
    ? await sql`SELECT * FROM platform_reviews WHERE status = ${status} ORDER BY created_at DESC LIMIT 200`
    : await sql`SELECT * FROM platform_reviews ORDER BY created_at DESC LIMIT 200`;
  return rows as unknown as Array<Record<string, unknown>>;
}

export async function updateReviewStatus(id: string, status: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE platform_reviews SET status = ${status} WHERE id = ${id}`;
}

export async function getApprovedReviews(productId?: string): Promise<Array<Record<string, unknown>>> {
  const sql = getSql();
  const rows = productId
    ? await sql`SELECT * FROM platform_reviews WHERE status = 'approved' AND product_id = ${productId} ORDER BY created_at DESC LIMIT 20`
    : await sql`SELECT * FROM platform_reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 50`;
  return rows as unknown as Array<Record<string, unknown>>;
}

// ── Magic token operations ────────────────────────────────────────────────────

export async function saveMagicToken(data: {
  tokenHash: string;
  email: string;
  expiresAt: Date;
  deviceFingerprint: string;
  ipAddress: string;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO platform_magic_tokens (token_hash, email, expires_at, device_fingerprint, ip_address)
    VALUES (${data.tokenHash}, ${data.email.toLowerCase().trim()}, ${data.expiresAt.toISOString()}, ${data.deviceFingerprint}, ${data.ipAddress})
    ON CONFLICT (token_hash) DO NOTHING
  `.catch(e => console.warn("[DB] saveMagicToken failed:", e instanceof Error ? e.message : String(e)));
}

export async function getMagicToken(tokenHash: string): Promise<{
  email: string; expiresAt: Date; used: boolean;
  deviceFingerprint: string; ipAddress: string;
} | null> {
  const sql = getSql();
  const [row] = await sql`
    SELECT email, expires_at, used, device_fingerprint, ip_address
    FROM platform_magic_tokens WHERE token_hash = ${tokenHash}
  `;
  if (!row) return null;
  return {
    email: String(row["email"] ?? ""),
    expiresAt: new Date(String(row["expires_at"])),
    used: Boolean(row["used"]),
    deviceFingerprint: String(row["device_fingerprint"] ?? ""),
    ipAddress: String(row["ip_address"] ?? ""),
  };
}

export async function markMagicTokenUsed(tokenHash: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE platform_magic_tokens SET used = TRUE WHERE token_hash = ${tokenHash}`;
}

export async function deleteExpiredMagicTokens(): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM platform_magic_tokens WHERE expires_at < NOW() OR used = TRUE`.catch(() => {});
}

export async function countActiveMagicTokens(): Promise<number> {
  const sql = getSql();
  const [row] = await sql`SELECT COUNT(*)::int AS n FROM platform_magic_tokens WHERE used = FALSE AND expires_at > NOW()`;
  return Number(row?.["n"] ?? 0);
}

// ── Invoice operations ────────────────────────────────────────────────────────

export interface DBInvoice {
  id: string;
  invoiceNumber: string;
  clientEmail: string;
  clientName: string;
  clientCompany: string;
  status: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  issueDate: string;
  dueDate: string;
  notes: string;
  lineItems: unknown[];
  createdAt: number;
  updatedAt: number;
}

export async function upsertInvoice(inv: DBInvoice): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO platform_invoices
      (id, invoice_number, client_email, client_name, client_company, status,
       currency, subtotal, tax_rate, tax_amount, total, issue_date, due_date,
       notes, line_items, updated_at)
    VALUES
      (${inv.id}, ${inv.invoiceNumber}, ${inv.clientEmail.toLowerCase()},
       ${inv.clientName}, ${inv.clientCompany}, ${inv.status},
       ${inv.currency}, ${inv.subtotal}, ${inv.taxRate}, ${inv.taxAmount},
       ${inv.total}, ${inv.issueDate}, ${inv.dueDate}, ${inv.notes},
       ${JSON.stringify(inv.lineItems)}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      subtotal = EXCLUDED.subtotal,
      tax_rate = EXCLUDED.tax_rate,
      tax_amount = EXCLUDED.tax_amount,
      total = EXCLUDED.total,
      line_items = EXCLUDED.line_items,
      notes = EXCLUDED.notes,
      updated_at = NOW()
  `.catch(e => console.warn("[DB] upsertInvoice failed:", e instanceof Error ? e.message : String(e)));
}

export async function getInvoiceFromDB(id: string): Promise<DBInvoice | null> {
  const sql = getSql();
  const [row] = await sql`SELECT * FROM platform_invoices WHERE id = ${id}`;
  if (!row) return null;
  return mapDBInvoice(row);
}

export async function getAllInvoicesFromDB(): Promise<DBInvoice[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM platform_invoices ORDER BY created_at DESC LIMIT 500`;
  return rows.map(mapDBInvoice);
}

export async function getMaxInvoiceNumber(): Promise<number> {
  const sql = getSql();
  const [row] = await sql`
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(invoice_number, '[^0-9]', '', 'g') AS INTEGER)), 1000)::int AS max_num
    FROM platform_invoices WHERE invoice_number ~ '^LTL-[0-9]+'
  `;
  return Number(row?.["max_num"] ?? 1000);
}

function mapDBInvoice(row: Record<string, unknown>): DBInvoice {
  return {
    id: String(row["id"] ?? ""),
    invoiceNumber: String(row["invoice_number"] ?? ""),
    clientEmail: String(row["client_email"] ?? ""),
    clientName: String(row["client_name"] ?? ""),
    clientCompany: String(row["client_company"] ?? ""),
    status: String(row["status"] ?? "draft"),
    currency: String(row["currency"] ?? "USD"),
    subtotal: Number(row["subtotal"] ?? 0),
    taxRate: Number(row["tax_rate"] ?? 0),
    taxAmount: Number(row["tax_amount"] ?? 0),
    total: Number(row["total"] ?? 0),
    issueDate: String(row["issue_date"] ?? ""),
    dueDate: String(row["due_date"] ?? ""),
    notes: String(row["notes"] ?? ""),
    lineItems: Array.isArray(row["line_items"]) ? row["line_items"] as unknown[] : [],
    createdAt: row["created_at"] ? new Date(String(row["created_at"])).getTime() : Date.now(),
    updatedAt: row["updated_at"] ? new Date(String(row["updated_at"])).getTime() : Date.now(),
  };
}

// ── Trusted Device helpers (DB-backed — survives restarts) ────────────────────

export interface DBTrustedDevice {
  id: string;
  email: string;
  label: string;
  fingerprint: string;
  userAgent: string;
  registeredAt: number;
  lastUsedAt: number;
}

/**
 * Upsert a trusted device for a given email address.
 * ON CONFLICT on device_token (fingerprint) → updates label + last_used_at.
 * Returns the device id.
 */
export async function saveTrustedDevice(data: {
  email: string;
  fingerprint: string;
  label: string;
  userAgent: string;
}): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO platform_trusted_devices (user_id, device_name, device_token, fingerprint, user_agent, last_used_at)
    VALUES (
      ${data.email.toLowerCase()},
      ${data.label},
      ${data.fingerprint},
      ${data.fingerprint},
      ${data.userAgent.slice(0, 512)},
      NOW()
    )
    ON CONFLICT (device_token) DO UPDATE SET
      device_name  = EXCLUDED.device_name,
      user_agent   = EXCLUDED.user_agent,
      last_used_at = NOW()
    RETURNING id
  `;
  return String(rows[0]?.["id"] ?? "");
}

/** List all trusted devices for an email address. */
export async function getTrustedDevicesByEmail(email: string): Promise<DBTrustedDevice[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, user_id, device_name, device_token, fingerprint, user_agent, last_used_at, created_at
    FROM platform_trusted_devices
    WHERE user_id = ${email.toLowerCase()}
    ORDER BY created_at DESC
  `;
  return rows.map(r => ({
    id:           String(r["id"] ?? ""),
    email:        String(r["user_id"] ?? ""),
    label:        String(r["device_name"] ?? "Unknown Device"),
    fingerprint:  String(r["fingerprint"] ?? r["device_token"] ?? ""),
    userAgent:    String(r["user_agent"] ?? ""),
    registeredAt: r["created_at"]   ? new Date(String(r["created_at"])).getTime()   : Date.now(),
    lastUsedAt:   r["last_used_at"] ? new Date(String(r["last_used_at"])).getTime() : Date.now(),
  }));
}

/**
 * Revoke (delete) a trusted device by id.
 * Scoped to email — prevents cross-user deletion.
 * Returns true if a row was deleted.
 */
export async function revokeTrustedDevice(deviceId: string, email: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM platform_trusted_devices
    WHERE id = ${deviceId} AND user_id = ${email.toLowerCase()}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Update last_used_at timestamp for a trusted device.
 * Fire-and-forget — errors are suppressed.
 */
export async function touchTrustedDevice(deviceId: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE platform_trusted_devices SET last_used_at = NOW() WHERE id = ${deviceId}`.catch(() => {});
}

/**
 * Count how many magic-link tokens were sent for an email within a rolling window.
 * Used for DB-backed rate limiting — survives process restarts.
 */
export async function countMagicTokensSentInWindow(email: string, windowMs: number): Promise<number> {
  const sql = getSql();
  const since = new Date(Date.now() - windowMs);
  const [row] = await sql`
    SELECT COUNT(*)::int AS n
    FROM platform_magic_tokens
    WHERE LOWER(email) = ${email.toLowerCase()} AND created_at > ${since}
  `;
  return Number(row?.["n"] ?? 0);
}
