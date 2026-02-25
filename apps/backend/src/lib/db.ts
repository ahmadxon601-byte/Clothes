import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const pool =
  globalThis._pgPool ??
  new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "pos",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 3_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._pgPool = pool;
}

export default pool;

/** Convenience wrapper for one-shot queries */
export const query = (text: string, params?: unknown[]) =>
  pool.query(text, params);
