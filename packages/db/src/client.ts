import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

function isServerlessEnv(): boolean {
  return process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

// For CLI tools (migrations, smoke tests) that need pool access - always use node-postgres
export function createLocalDb(): {
  db: NodePgDatabase<typeof schema>;
  pool: Pool;
} {
  const connectionString = getConnectionString();
  const pool = new Pool({ connectionString });
  const db = drizzlePg(pool, { schema });
  return { db, pool };
}

// Lazy initialization for serverless db
export type DbInstance = NeonHttpDatabase<typeof schema> | NodePgDatabase<typeof schema>;
let _db: DbInstance | null = null;
let _pool: Pool | null = null;

function getDb(): DbInstance {
  if (_db) return _db;

  const connectionString = getConnectionString();

  if (isServerlessEnv()) {
    _db = drizzleNeon(neon(connectionString), { schema });
  } else {
    _pool = new Pool({ connectionString });
    _db = drizzlePg(_pool, { schema });
  }

  return _db;
}

// Main db export - uses Proxy for lazy initialization
export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Legacy pool export - lazy initialization
export const pool = new Proxy({} as Pool, {
  get(_, prop) {
    if (isServerlessEnv()) {
      throw new Error('Pool is not available in serverless environment. Use db directly.');
    }
    if (!_pool) {
      _pool = new Pool({ connectionString: getConnectionString() });
    }
    return (_pool as unknown as Record<string | symbol, unknown>)[prop];
  },
});
