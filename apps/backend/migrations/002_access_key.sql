-- Add access_key column to users table
-- Run: psql -U postgres -d pos -f migrations/002_access_key.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS access_key VARCHAR(8) UNIQUE;
