import { readFileSync } from "fs";
import { join } from "path";
import pool from "../db";

// ─── migrate() ────────────────────────────────────────────────────────────────
// Reads schema.sql and applies it to the connected PostgreSQL database.
// Uses CREATE TABLE IF NOT EXISTS so it is safe to run on every startup —
// it will not destroy existing data.
//
// Future: Replace with a proper versioned migration system (e.g., db-migrate,
//   Flyway, or Drizzle migrate) that tracks which migrations have already run.
// Future: Add a migration lock table to prevent concurrent runs in multi-replica
//   deployments.

export async function migrate(): Promise<void> {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("[migrate] Schema applied successfully.");
  } catch (err) {
    console.error("[migrate] Failed to apply schema:", err);
    throw err;
  } finally {
    client.release();
  }
}
