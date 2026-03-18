import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis._pgPool) {
    const connectionString = process.env.DATABASE_URL?.trim();
    globalThis._pgPool = connectionString
      ? new Pool({
          connectionString,
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 3_000,
        })
      : new Pool({
          host: process.env.DB_HOST || "127.0.0.1",
          port: Number(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || "pos",
          user: process.env.DB_USER || "postgres",
          // Keep empty password as valid local-dev value instead of undefined.
          password: process.env.DB_PASSWORD ?? "",
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 3_000,
        });
  }
  return globalThis._pgPool;
}

// Proxy object so `import pool from "@/src/lib/db"` still supports pool.connect()
const poolProxy = {
  query: (text: string, params?: unknown[]) => getPool().query(text, params),
  connect: () => getPool().connect(),
};

export default poolProxy;

/** Convenience wrapper for one-shot queries */
export const query = (text: string, params?: unknown[]) =>
  getPool().query(text, params);
