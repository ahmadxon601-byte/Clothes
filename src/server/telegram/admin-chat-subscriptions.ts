import { query } from "../../lib/db";
import { ensureAdminAccessTable, normalizeTelegramUsername } from "./admin-access";

type AdminTelegramChatRow = {
  chat_id: string | number;
};

let ensurePromise: Promise<void> | null = null;

async function ensureAdminTelegramChatsTable(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = query(
      `CREATE TABLE IF NOT EXISTS admin_telegram_chats (
         chat_id BIGINT PRIMARY KEY,
         telegram_user_id BIGINT,
         first_name TEXT,
         username TEXT,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    ).then(() => undefined).catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}

export async function subscribeAdminTelegramChat(input: {
  chatId: number;
  telegramUserId?: number;
  firstName?: string;
  username?: string;
}): Promise<void> {
  await ensureAdminTelegramChatsTable();

  await query(
    `INSERT INTO admin_telegram_chats (chat_id, telegram_user_id, first_name, username)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (chat_id) DO UPDATE
     SET telegram_user_id = EXCLUDED.telegram_user_id,
         first_name = EXCLUDED.first_name,
         username = EXCLUDED.username,
         updated_at = NOW()`,
    [
      input.chatId,
      input.telegramUserId ?? null,
      input.firstName ?? null,
      normalizeTelegramUsername(input.username),
    ]
  );
}

export async function listAdminTelegramChatIds(): Promise<number[]> {
  await ensureAdminTelegramChatsTable();
  await ensureAdminAccessTable();

  const result = await query(
    `SELECT chats.chat_id
     FROM admin_telegram_chats chats
     JOIN admin_telegram_access access
       ON access.username = chats.username
      AND access.is_active = TRUE
     ORDER BY chats.updated_at DESC`
  );

  return result.rows
    .map((row) => Number((row as AdminTelegramChatRow).chat_id))
    .filter((value) => Number.isFinite(value));
}
