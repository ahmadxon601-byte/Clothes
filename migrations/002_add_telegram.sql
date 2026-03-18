-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002 — Telegram bot integration
-- Run: psql -U postgres -d pos -f migrations/002_add_telegram.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Add telegram_id (Telegram user ID) and phone number to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone       VARCHAR(30);

-- Unique index on telegram_id (partial — only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id
  ON users(telegram_id)
  WHERE telegram_id IS NOT NULL;
