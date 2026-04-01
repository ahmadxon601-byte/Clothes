import { query } from "./db";

type ProductViewSupport = {
  hasProductViewsTable: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var _productViewSupport:
    | { value: ProductViewSupport; expiresAt: number }
    | undefined;
}

export async function getProductViewSupport(): Promise<ProductViewSupport> {
  const cached = globalThis._productViewSupport;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let result = await query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'product_views'
     ) AS exists`
  );

  if (!result.rows[0]?.exists) {
    await query(
      `CREATE TABLE IF NOT EXISTS product_views (
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
       )`
    );
    await query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_product_views_unique_user
         ON product_views(product_id, user_id)
         WHERE user_id IS NOT NULL`
    );
    await query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_product_views_unique_viewer_key
         ON product_views(product_id, viewer_key)
         WHERE viewer_key IS NOT NULL`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_product_views_product_id
         ON product_views(product_id)`
    );

    result = await query(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name = 'product_views'
       ) AS exists`
    );
  }

  const value = {
    hasProductViewsTable: Boolean(result.rows[0]?.exists),
  };

  globalThis._productViewSupport = {
    value,
    expiresAt: Date.now() + 30_000,
  };

  return value;
}
