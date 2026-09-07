import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Check if PostgreSQL is actively configured with an external host
export const isSqlAvailable = Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME);

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = (): Pool | null => {
  if (!isSqlAvailable) {
    return null;
  }

  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 5000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('Unexpected error on idle SQL pool client:', err.message);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance only when configured.
const pool = createPool();

// Initialize Drizzle with the pool and schema if available.
export const db = pool ? drizzle(pool, { schema }) : (null as any);

