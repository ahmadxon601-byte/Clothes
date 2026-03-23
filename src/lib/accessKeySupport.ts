import { query } from "@/src/lib/db";

let cachedAccessKeySupport: boolean | null = null;

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
  return cachedAccessKeySupport;
}
