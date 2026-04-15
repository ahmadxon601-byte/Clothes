CREATE INDEX IF NOT EXISTS idx_products_active_created_at
ON products(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stores_active_id
ON stores(is_active, id);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_price
ON product_variants(product_id, price);

CREATE INDEX IF NOT EXISTS idx_product_images_product_sort
ON product_images(product_id, sort_order);
