import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { getSellerRequestSupport } from "@/src/lib/sellerRequestSupport";
import { getStoreColumnSupport } from "@/src/lib/storeColumnSupport";

// ── GET /api/stores/my/all ────────────────────────────────────────────────────
// Returns ALL active stores and ALL seller requests for the current user
export async function GET(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);
    const support = await getSellerRequestSupport();
    const storeSupport = await getStoreColumnSupport();

    const [storesResult, requestsResult] = await Promise.all([
      query(
        `SELECT id, name, description, phone, address,
                ${storeSupport.hasStoreImageUrl ? "image_url" : "NULL::text AS image_url"},
                created_at
         FROM stores
         WHERE owner_id = $1 AND is_active = TRUE
         ORDER BY created_at DESC`,
        [jwtUser.userId]
      ),
      query(
        `SELECT id, store_name,
                ${support.hasRequestType ? "request_type" : "'store_create'::text AS request_type"},
                ${support.hasTargetStoreId ? "target_store_id" : "NULL::uuid AS target_store_id"},
                status, created_at, admin_note
         FROM seller_requests
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [jwtUser.userId]
      ),
    ]);

    return ok({
      stores: storesResult.rows,
      requests: requestsResult.rows,
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[stores/my/all GET]", e);
    return fail("Internal server error", 500);
  }
}
