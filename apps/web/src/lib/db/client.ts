import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Drizzle over node-postgres — works with LOCAL Postgres and Neon alike (plain TCP connection
 * string), not Neon-only. Returns null when DATABASE_URL is unset so History degrades gracefully
 * (the rest of the app runs fine without a DB). Pool is a global singleton to survive HMR.
 */
const store = globalThis as unknown as { _dbPool?: Pool; _db?: NodePgDatabase<typeof schema> };

export function getDb(): NodePgDatabase<typeof schema> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!store._db) {
    store._dbPool ??= new Pool({ connectionString: url, max: 5 });
    store._db = drizzle(store._dbPool, { schema });
  }
  return store._db;
}
