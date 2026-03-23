import { randomUUID } from "crypto";
import { query } from "./db";

export async function ensureSupportTables(): Promise<void> {
  await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await query(`
    CREATE TABLE IF NOT EXISTS support_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed')),
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
      sender_role VARCHAR(20) NOT NULL
        CHECK (sender_role IN ('user', 'admin')),
      sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      body TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_support_conversations_last_message
    ON support_conversations(last_message_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_support_messages_conversation
    ON support_messages(conversation_id, created_at ASC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_support_messages_unread
    ON support_messages(conversation_id, is_read)
  `);
}

export async function getOrCreateSupportConversation(userId: string) {
  await ensureSupportTables();

  const existing = await query(
    `SELECT id, user_id, status, last_message_at, created_at, updated_at
     FROM support_conversations
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const created = await query(
    `INSERT INTO support_conversations (id, user_id)
     VALUES ($1, $2)
     RETURNING id, user_id, status, last_message_at, created_at, updated_at`,
    [randomUUID(), userId]
  );

  return created.rows[0];
}
