import { Pool } from "pg";

// ─── Database connection pool ─────────────────────────────────────────────────
// Reads DATABASE_URL from environment. Set this in your .env file.
// In Docker, this will point to the postgres service defined in docker-compose.yml.
//
// Future: Add connection retry logic and health checks here.
// Future: Add Drizzle ORM or Prisma schema layer for type-safe queries.
// Future: Add read replica support for high-traffic facilities.

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error:", err);
});

export async function query<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function checkConnection(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export default pool;
