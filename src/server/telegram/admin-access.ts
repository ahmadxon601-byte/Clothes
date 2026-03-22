import { query } from "../../lib/db";

export type AdminAccessRole = "admin" | "superadmin";

type AdminAccessRow = {
  username: string;
  role: AdminAccessRole;
  is_active: boolean;
};

const DEFAULT_ADMIN_ACCESS: Array<{ username: string; role: AdminAccessRole }> = [
  { username: "jahon1234", role: "admin" },
  { username: "nbn2000_bot", role: "admin" },
  { username: "ahmadxon_designer", role: "superadmin" },
  { username: "just_saidx", role: "admin" },
];

let ensurePromise: Promise<void> | null = null;

export function normalizeTelegramUsername(username?: string | null): string | null {
  if (!username) return null;
  const normalized = username.trim().replace(/^@+/, "").toLowerCase();
  return normalized || null;
}

export async function ensureAdminAccessTable(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await query(
        `CREATE TABLE IF NOT EXISTS admin_telegram_access (
           username TEXT PRIMARY KEY,
           role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')),
           is_active BOOLEAN NOT NULL DEFAULT TRUE,
           created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
           updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`
      );

      const existing = await query(
        "SELECT COUNT(*)::text AS count FROM admin_telegram_access"
      );

      if (Number((existing.rows[0] as { count?: string } | undefined)?.count ?? 0) === 0) {
        for (const admin of DEFAULT_ADMIN_ACCESS) {
          await query(
            `INSERT INTO admin_telegram_access (username, role, is_active)
             VALUES ($1, $2, TRUE)`,
            [admin.username, admin.role]
          );
        }
      }
    })().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}

export async function getTelegramAdminAccess(username?: string | null): Promise<AdminAccessRow | null> {
  await ensureAdminAccessTable();

  const normalized = normalizeTelegramUsername(username);
  if (!normalized) return null;

  const result = await query(
    `SELECT username, role, is_active
     FROM admin_telegram_access
     WHERE username = $1
     LIMIT 1`,
    [normalized]
  );

  return (result.rows[0] as AdminAccessRow | undefined) ?? null;
}

export async function isTelegramAdminAllowed(username?: string | null): Promise<boolean> {
  const access = await getTelegramAdminAccess(username);
  return Boolean(access?.is_active);
}

export async function listTelegramAdmins(): Promise<AdminAccessRow[]> {
  await ensureAdminAccessTable();

  const result = await query(
    `SELECT username, role, is_active
     FROM admin_telegram_access
     ORDER BY
       CASE role WHEN 'superadmin' THEN 0 ELSE 1 END,
       username ASC`
  );

  return result.rows as AdminAccessRow[];
}

export async function addTelegramAdmin(
  username: string,
  role: AdminAccessRole = "admin"
): Promise<AdminAccessRow> {
  await ensureAdminAccessTable();

  const normalized = normalizeTelegramUsername(username);
  if (!normalized) {
    throw new Error("Username kiritilmadi.");
  }

  const result = await query(
    `INSERT INTO admin_telegram_access (username, role, is_active)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (username) DO UPDATE
     SET role = EXCLUDED.role,
         is_active = TRUE,
         updated_at = NOW()
     RETURNING username, role, is_active`,
    [normalized, role]
  );

  return result.rows[0] as AdminAccessRow;
}

export async function removeTelegramAdmin(username: string): Promise<AdminAccessRow | null> {
  await ensureAdminAccessTable();

  const normalized = normalizeTelegramUsername(username);
  if (!normalized) {
    throw new Error("Username kiritilmadi.");
  }

  if (normalized === "ahmadxon_designer") {
    throw new Error("SuperAdmin foydalanuvchisini o'chirib bo'lmaydi.");
  }

  const result = await query(
    `UPDATE admin_telegram_access
     SET is_active = FALSE,
         updated_at = NOW()
     WHERE username = $1
     RETURNING username, role, is_active`,
    [normalized]
  );

  return (result.rows[0] as AdminAccessRow | undefined) ?? null;
}
