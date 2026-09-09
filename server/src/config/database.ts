import "dotenv/config";
import { Pool, PoolClient, QueryResultRow } from "pg";
import { env } from "./env.js";

const connectionString = env.databaseUrl;

// A missing URL is allowed for local fallback mode; PostgreSQL-backed calls fail over at repository boundaries.
if (!connectionString) {
  console.warn(
    "DATABASE_URL is not set. Database-backed endpoints will be unavailable.",
  );
}

export const pool = new Pool({
  connectionString,
  max: env.databasePoolSize,
  connectionTimeoutMillis: 3000,
});

pool.on("error", (err) => {
  console.error("[PG Pool Error] Unexpected idle client error:", err.message);
});

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return pool.query<T>(text, values);
}

export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("[PG Transaction] Rollback failed:", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export function closeDatabase(): Promise<void> {
  return pool.end();
}
