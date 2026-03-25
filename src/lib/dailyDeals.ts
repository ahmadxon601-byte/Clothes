import { randomUUID } from "crypto";
import { query } from "@/src/lib/db";

export async function ensureNotificationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      source_type TEXT,
      source_id TEXT,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS source_type TEXT`);
  await query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS source_id TEXT`);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications(user_id, created_at DESC)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_source
    ON notifications(source_type, source_id)
  `);
}

export async function ensureDailyDealTables() {
  await ensureNotificationsTable();

  await query(`
    CREATE TABLE IF NOT EXISTS daily_deal_campaigns (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS daily_deal_invites (
      id UUID PRIMARY KEY,
      campaign_id UUID NOT NULL REFERENCES daily_deal_campaigns(id) ON DELETE CASCADE,
      store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      responded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (campaign_id, store_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS daily_deal_items (
      id UUID PRIMARY KEY,
      invite_id UUID NOT NULL REFERENCES daily_deal_invites(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (invite_id, product_id)
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_daily_deal_campaigns_status
    ON daily_deal_campaigns(status, starts_at DESC)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_daily_deal_invites_user_status
    ON daily_deal_invites(user_id, status, created_at DESC)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_daily_deal_items_invite
    ON daily_deal_items(invite_id)
  `);
}

async function getNotificationIdType(): Promise<string | null> {
  const result = await query(
    `SELECT data_type
     FROM information_schema.columns
     WHERE table_name = 'notifications' AND column_name = 'id'
     LIMIT 1`
  );
  return (result.rows[0]?.data_type as string | undefined) ?? null;
}

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  sourceType?: string | null;
  sourceId?: string | null;
}) {
  await ensureNotificationsTable();
  const idType = await getNotificationIdType();

  if (idType === "uuid") {
    return query(
      `
      INSERT INTO notifications (id, user_id, title, body, source_type, source_id, is_read)
      VALUES ($1, $2, $3, $4, $5, $6, FALSE)
      `,
      [randomUUID(), input.userId, input.title, input.body, input.sourceType ?? null, input.sourceId ?? null]
    );
  }

  return query(
    `
    INSERT INTO notifications (user_id, title, body, source_type, source_id, is_read)
    VALUES ($1, $2, $3, $4, $5, FALSE)
    `,
    [input.userId, input.title, input.body, input.sourceType ?? null, input.sourceId ?? null]
  );
}
