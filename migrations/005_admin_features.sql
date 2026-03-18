-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005: admin features — user banning + product rejection reason
-- Run: psql -U postgres -d pos -f migrations/005_admin_features.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Add is_banned column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Add rejection_reason column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
