import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('http','tcp')),
      target TEXT NOT NULL,
      is_up BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS checks (
      id BIGSERIAL PRIMARY KEY,
      service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      up BOOLEAN NOT NULL,
      latency_ms INT NOT NULL,
      error TEXT,
      checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS checks_service_time ON checks (service_id, checked_at DESC);
  `);
}
