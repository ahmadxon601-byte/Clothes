import { query } from "./db";

type ReviewSupport = {
  hasReviewStatus: boolean;
  hasReviewNote: boolean;
  hasPendingUpdatePayload: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var _productReviewSupport:
    | { value: ReviewSupport; expiresAt: number }
    | undefined;
}

export async function getProductReviewSupport(): Promise<ReviewSupport> {
  const cached = globalThis._productReviewSupport;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'products'
       AND column_name IN ('review_status', 'review_note', 'pending_update_payload')`
  );

  let columns = new Set(result.rows.map((row) => String(row.column_name)));

  if (!columns.has("review_status")) {
    await query(
      `ALTER TABLE products
         ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) NOT NULL DEFAULT 'approved'
           CHECK (review_status IN ('pending', 'approved', 'rejected'))`
    );
  }

  if (!columns.has("review_note")) {
    await query(
      `ALTER TABLE products
         ADD COLUMN IF NOT EXISTS review_note TEXT`
    );
  }

  if (!columns.has("pending_update_payload")) {
    await query(
      `ALTER TABLE products
         ADD COLUMN IF NOT EXISTS pending_update_payload JSONB`
    );
  }

  await query(
    `CREATE INDEX IF NOT EXISTS idx_products_review_status
       ON products(review_status)`
  );

  result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'products'
       AND column_name IN ('review_status', 'review_note', 'pending_update_payload')`
  );

  columns = new Set(result.rows.map((row) => String(row.column_name)));
  const value = {
    hasReviewStatus: columns.has("review_status"),
    hasReviewNote: columns.has("review_note"),
    hasPendingUpdatePayload: columns.has("pending_update_payload"),
  };

  globalThis._productReviewSupport = {
    value,
    expiresAt: Date.now() + 30_000,
  };

  return value;
}
