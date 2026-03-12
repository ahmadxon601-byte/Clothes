-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  product_ids UUID[]       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Audit logs table for admin activity
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  "tableName" TEXT,
  "entityId" TEXT,
  "oldData" JSONB,
  "newData" JSONB,
  "performedBy" INT,
  "performedByUsername" TEXT,
  "performedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_uuid VARCHAR(36)
);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS admin_uuid VARCHAR(36);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs("performedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table        ON audit_logs("tableName");
