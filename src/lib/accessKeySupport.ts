import { query } from "@/src/lib/db";

let cachedAccessKeySupport: boolean | null = null;

export async function ensureAccessKeyColumn() {
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS access_key TEXT
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_access_key_unique
    ON users(access_key)
    WHERE access_key IS NOT NULL
  `);

  cachedAccessKeySupport = true;
  return true;
}

export async function hasAccessKeyColumn() {
  if (cachedAccessKeySupport !== null) return cachedAccessKeySupport;

  const result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name = 'access_key'
     ) AS exists`
  );

  cachedAccessKeySupport = Boolean(result.rows[0]?.exists);
  if (!cachedAccessKeySupport) {
    return ensureAccessKeyColumn();
  }
  return cachedAccessKeySupport;
}
