import { query } from "./db";

type StoreColumnSupport = {
  hasStoreImageUrl: boolean;
  hasSellerRequestImageUrl: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var _storeColumnSupport:
    | { value: StoreColumnSupport; expiresAt: number }
    | undefined;
}

export async function getStoreColumnSupport(): Promise<StoreColumnSupport> {
  const cached = globalThis._storeColumnSupport;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const result = await query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND (
         (table_name = 'stores' AND column_name = 'image_url')
         OR
         (table_name = 'seller_requests' AND column_name = 'image_url')
       )`
  );

  const pairs = new Set(
    result.rows.map((row) => `${String(row.table_name)}.${String(row.column_name)}`)
  );

  const value = {
    hasStoreImageUrl: pairs.has("stores.image_url"),
    hasSellerRequestImageUrl: pairs.has("seller_requests.image_url"),
  };

  globalThis._storeColumnSupport = {
    value,
    expiresAt: Date.now() + 30_000,
  };

  return value;
}
