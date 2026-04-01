CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  viewer_key VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_views_identity_check
    CHECK (
      (user_id IS NOT NULL AND viewer_key IS NULL)
      OR
      (user_id IS NULL AND viewer_key IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_views_unique_user
  ON product_views(product_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_views_unique_viewer_key
  ON product_views(product_id, viewer_key)
  WHERE viewer_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_views_product_id
  ON product_views(product_id);
