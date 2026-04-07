ALTER TABLE products
ADD COLUMN IF NOT EXISTS marketing_campaign_id TEXT;

CREATE INDEX IF NOT EXISTS idx_products_marketing_campaign_id
ON products(marketing_campaign_id);
