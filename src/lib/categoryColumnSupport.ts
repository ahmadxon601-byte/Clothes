import { query } from "./db";

type CategoryColumnSupport = {
  hasParentId: boolean;
};

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

  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'categories'
       AND column_name = 'parent_id'`
  );

  const value = {
    hasParentId: result.rows.length > 0,
  };

  globalThis._categoryColumnSupport = {
    value,
    expiresAt: Date.now() + 30_000,
  };

  return value;
}
