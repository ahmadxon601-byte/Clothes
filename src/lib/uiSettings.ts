import { query } from "./db";

export async function ensureUiSettingsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS ui_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function getUiSetting(key: string): Promise<string | null> {
  await ensureUiSettingsTable();
  const result = await query(
    `SELECT value FROM ui_settings WHERE key = $1 LIMIT 1`,
    [key]
  );
  return result.rows[0]?.value ?? null;
}

export async function setUiSetting(key: string, value: string | null): Promise<void> {
  await ensureUiSettingsTable();
  await query(
    `INSERT INTO ui_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}
