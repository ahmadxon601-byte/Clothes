ALTER TABLE products
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) NOT NULL DEFAULT 'approved'
    CHECK (review_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS review_note TEXT;

UPDATE products
SET review_status = 'approved'
WHERE review_status IS DISTINCT FROM 'approved';

CREATE INDEX IF NOT EXISTS idx_products_review_status ON products(review_status);
