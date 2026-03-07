import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis._pgPool) {
    globalThis._pgPool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "pos",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
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
