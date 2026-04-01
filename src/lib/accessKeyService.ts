import { query } from "@/src/lib/db";
import { generateAccessKey } from "@/src/lib/accessKey";
import { hasAccessKeyColumn } from "@/src/lib/accessKeySupport";

export function normalizeAccessKey(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").trim().toUpperCase();
}

export async function ensureUserAccessKey(userId: string, existingKey?: string | null): Promise<string | null> {
  const accessKeySupported = await hasAccessKeyColumn();
  if (!accessKeySupported) return null;

  const normalizedExisting = existingKey ? normalizeAccessKey(existingKey) : "";
  if (normalizedExisting.length === 8) {
    return normalizedExisting;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const key = generateAccessKey();
    const result = await query(
      `UPDATE users
       SET access_key = $1
       WHERE id = $2
         AND (access_key IS NULL OR length(trim(access_key)) = 0)
       RETURNING access_key`,
      [key, userId]
    );

    if (result.rows.length > 0) {
      return String(result.rows[0].access_key);
    }

    const existingResult = await query(
      "SELECT access_key FROM users WHERE id = $1",
      [userId]
    );
    const currentKey = normalizeAccessKey(String(existingResult.rows[0]?.access_key ?? ""));
    if (currentKey.length === 8) {
      return currentKey;
    }
  }

  throw new Error("Access key generation failed");
}
