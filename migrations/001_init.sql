-- ─────────────────────────────────────────────────────────────────────────────
-- Clothes Marketplace — initial schema
-- Run once: psql -U postgres -d pos -f migrations/001_init.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'seller', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Categories ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Seller requests ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_name        VARCHAR(255) NOT NULL,
  store_description TEXT,
  owner_name        VARCHAR(255) NOT NULL,
  phone             VARCHAR(50),
  address           TEXT,
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note        TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Stores ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  phone       VARCHAR(50),
  address     TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Products ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID           NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID           REFERENCES categories(id) ON DELETE SET NULL,
  name        VARCHAR(255)   NOT NULL,
  description TEXT,
  base_price  NUMERIC(10, 2) NOT NULL,
  sku         VARCHAR(120)   NOT NULL UNIQUE,
  views       INTEGER        NOT NULL DEFAULT 0,
  is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Product variants (SKU per size/color combination) ─────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size       VARCHAR(20),
  color      VARCHAR(50),
  price      NUMERIC(10, 2) NOT NULL,
  stock      INTEGER        NOT NULL DEFAULT 0,
  sku        VARCHAR(150)   NOT NULL UNIQUE,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Product images ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Product location (one per product) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_locations (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID           NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  latitude   NUMERIC(10, 7) NOT NULL,
  longitude  NUMERIC(10, 7) NOT NULL,
  address    TEXT,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Comments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_store_id    ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at  ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_views       ON products(views DESC);
CREATE INDEX IF NOT EXISTS idx_comments_product_id  ON comments(product_id);
CREATE INDEX IF NOT EXISTS idx_seller_requests_user ON seller_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_requests_status ON seller_requests(status);

-- ── Seed: default categories ──────────────────────────────────────────────────
INSERT INTO categories (name, slug) VALUES
  ('Jackets',     'jackets'),
  ('Shirts',      'shirts'),
  ('Pants',       'pants'),
  ('Dresses',     'dresses'),
  ('Shoes',       'shoes'),
  ('Accessories', 'accessories'),
  ('Sportswear',  'sportswear'),
  ('Outerwear',   'outerwear')
ON CONFLICT (slug) DO NOTHING;

-- ── NOTE ──────────────────────────────────────────────────────────────────────
-- To create the initial admin user, run:
--   npx tsx scripts/seed.ts
-- (from the apps/web directory)
