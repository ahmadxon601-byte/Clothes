ALTER TABLE seller_requests
  ADD COLUMN IF NOT EXISTS request_type VARCHAR(20) NOT NULL DEFAULT 'store_create'
    CHECK (request_type IN ('store_create', 'store_update'));

ALTER TABLE seller_requests
  ADD COLUMN IF NOT EXISTS target_store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seller_requests_request_type ON seller_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_seller_requests_target_store_id ON seller_requests(target_store_id);
