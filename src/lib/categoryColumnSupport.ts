import { query } from "./db";

type CategoryColumnSupport = {
  hasParentId: boolean;
  hasSticker: boolean;
};

async function ensureCategoryParentColumn() {
  await query(
    `ALTER TABLE categories
     ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE`
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)`
  );
}

async function ensureCategoryStickerColumn() {
  await query(
    `ALTER TABLE categories
     ADD COLUMN IF NOT EXISTS sticker VARCHAR(16)`
  );
}

declare global {
  // eslint-disable-next-line no-var
  var _categoryColumnSupport:
    | { value: CategoryColumnSupport; expiresAt: number }
    | undefined;
}

export async function getCategoryColumnSupport(): Promise<CategoryColumnSupport> {
  const cached = globalThis._categoryColumnSupport;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'categories'
       AND column_name IN ('parent_id', 'sticker')`
  );

  const foundColumns = new Set(result.rows.map((row) => row.column_name));

  if (!foundColumns.has('parent_id')) {
    await ensureCategoryParentColumn();
  }

  if (!foundColumns.has('sticker')) {
    await ensureCategoryStickerColumn();
  }

  result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'categories'
       AND column_name IN ('parent_id', 'sticker')`
  );

  const currentColumns = new Set(result.rows.map((row) => row.column_name));

  const value = {
    hasParentId: currentColumns.has('parent_id'),
    hasSticker: currentColumns.has('sticker'),
  };

  globalThis._categoryColumnSupport = {
    value,
    expiresAt: Date.now() + 30_000,
  };

  return value;
}
