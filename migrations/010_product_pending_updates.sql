ALTER TABLE products
  ADD COLUMN IF NOT EXISTS pending_update_payload JSONB;
