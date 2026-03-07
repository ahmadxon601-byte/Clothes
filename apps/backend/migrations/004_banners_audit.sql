-- ── Banners ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  product_ids UUID[]       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Audit Logs (pre-existing table — just add indexes + admin_uuid column) ───
-- Existing columns: id, operation, tableName, entityId, oldData, newData,
--                   performedBy (int), performedByUsername, performedAt
-- We add admin_uuid (text) to store the UUID of the performing admin.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS admin_uuid VARCHAR(36);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs("performedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table        ON audit_logs("tableName");
