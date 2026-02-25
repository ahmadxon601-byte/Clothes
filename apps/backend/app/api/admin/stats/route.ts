import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");

    const [users, products, stores, pendingRequests] = await Promise.all([
      query("SELECT COUNT(*) FROM users"),
      query("SELECT COUNT(*) FROM products WHERE is_active = TRUE"),
      query("SELECT COUNT(*) FROM stores WHERE is_active = TRUE"),
      query("SELECT COUNT(*) FROM seller_requests WHERE status = 'pending'"),
    ]);

    return ok({
      users_count: parseInt(users.rows[0].count),
      products_count: parseInt(products.rows[0].count),
      stores_count: parseInt(stores.rows[0].count),
      pending_seller_requests: parseInt(pendingRequests.rows[0].count),
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/stats]", e);
    return fail("Internal server error", 500);
  }
}
