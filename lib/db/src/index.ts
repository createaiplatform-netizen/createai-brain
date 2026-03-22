import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";

/**
 * sql — tagged template literal for executing raw parameterized SQL via the pool.
 *
 * Usage:
 *   const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
 *   const [row] = await sql`SELECT COUNT(*) AS n FROM leads`;
 *   await sql`CREATE TABLE IF NOT EXISTS ...`;
 *
 * Returns the rows array. For DDL statements (CREATE, ALTER, etc.) returns [].
 */
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  let i = 0;
  const text = strings.reduce((acc: string, str: string) => {
    const placeholder = i < values.length ? `$${++i}` : "";
    return acc + str + placeholder;
  }, "");
  const result = await pool.query(text, values);
  return result.rows as Record<string, unknown>[];
}
