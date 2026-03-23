import { query } from "./db";

type SellerRequestSupport = {
  hasRequestType: boolean;
  hasTargetStoreId: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var _sellerRequestSupport:
    | { value: SellerRequestSupport; expiresAt: number }
    | undefined;
}

export async function getSellerRequestSupport(): Promise<SellerRequestSupport> {
  const cached = globalThis._sellerRequestSupport;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'seller_requests'
       AND column_name IN ('request_type', 'target_store_id')`
  );

  const columns = new Set(result.rows.map((row) => String(row.column_name)));
  const value = {
    hasRequestType: columns.has("request_type"),
    hasTargetStoreId: columns.has("target_store_id"),
  };

  globalThis._sellerRequestSupport = {
    value,
    expiresAt: Date.now() + 30_000,
  };

  return value;
}
