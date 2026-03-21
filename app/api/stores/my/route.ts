import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { getSellerRequestSupport } from "@/src/lib/sellerRequestSupport";

// ── GET /api/stores/my ────────────────────────────────────────────────────────
// Returns the current user's store (if seller) or their seller_request status
export async function GET(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);
    const support = await getSellerRequestSupport();

    // If user is a seller, return their store
    if (jwtUser.role === "seller" || jwtUser.role === "admin") {
      const result = await query(
        `SELECT st.id, st.name, st.description, st.phone, st.address, st.created_at, st.is_active,
                u.name AS owner_name
         FROM stores st
         JOIN users u ON u.id = st.owner_id
         WHERE st.owner_id = $1 AND st.is_active = TRUE
         ORDER BY st.created_at DESC
         LIMIT 1`,
        [jwtUser.userId]
      );

      if (result.rows.length > 0) {
        return ok({ status: "approved", store: result.rows[0] });
      }
    }

    // Check for a pending/rejected seller request
    const reqResult = await query(
      `SELECT id, store_name,
              ${support.hasRequestType ? "request_type" : "'store_create'::text AS request_type"},
              status, created_at, admin_note
       FROM seller_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [jwtUser.userId]
    );

    if (reqResult.rows.length > 0) {
      const req = reqResult.rows[0];
      if (req.status === "approved") {
        // Request approved but store not found via role check — look up the store directly
        const storeResult = await query(
          `SELECT id, name, description, phone, address, created_at
           FROM stores WHERE owner_id = $1 AND is_active = TRUE LIMIT 1`,
          [jwtUser.userId]
        );
        if (storeResult.rows.length > 0) {
          return ok({ status: "approved", store: storeResult.rows[0] });
        }
        return ok({ status: "none" });
      }
      return ok({ status: req.status, request: req });
    }

    return ok({ status: "none" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[stores/my GET]", e);
    return fail("Internal server error", 500);
  }
}
