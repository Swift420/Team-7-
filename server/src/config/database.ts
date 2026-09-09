import 'dotenv/config';
import { Pool, PoolClient, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Database-backed endpoints will be unavailable.');
}

export const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_SIZE || 10),
  connectionTimeoutMillis: 3000,
});

pool.on('error', (err) => {
  console.error('[PG Pool Error] Unexpected idle client error:', err.message);
});

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return pool.query<T>(text, values);
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
