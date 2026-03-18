import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

// ── GET /api/products/my ──────────────────────────────────────────────────────
// Returns all products from the current user's stores
export async function GET(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);

    const result = await query(
      `SELECT
         p.id, p.name, p.description, p.base_price, p.category_id, p.sku, p.is_active, p.views, p.created_at,
         c.name AS category_name,
         st.id AS store_id, st.name AS store_name,
         (SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail,
         (SELECT MIN(pv.price) FROM product_variants pv
          WHERE pv.product_id = p.id) AS sale_price
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       JOIN stores st ON st.id = p.store_id
       WHERE st.owner_id = $1
       ORDER BY p.created_at DESC`,
      [jwtUser.userId]
    );

    return ok({ products: result.rows });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[products/my GET]", e);
    return fail("Internal server error", 500);
  }
}
