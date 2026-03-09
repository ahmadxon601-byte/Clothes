import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";

// ── GET /api/admin/products ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");

    const s = req.nextUrl.searchParams;
    const search = s.get("search")?.trim() || null;
    const storeId = s.get("store_id") || null;
    const statusParam = s.get("status") || null;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(p.name ILIKE $${idx} OR p.sku ILIKE $${idx})`);
    }
    if (storeId) {
      params.push(storeId);
      conditions.push(`p.store_id = $${params.length}`);
    }
    if (statusParam === "active") {
      conditions.push(`p.is_active = TRUE`);
    } else if (statusParam === "inactive") {
      conditions.push(`p.is_active = FALSE`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) FROM products p ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT
         p.id, p.name, p.base_price, p.sku, p.views, p.is_active, p.created_at,
         c.name AS category_name,
         st.id AS store_id, st.name AS store_name,
         (SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN stores st    ON st.id = p.store_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return ok({
      products: dataResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/products GET]", e);
    return fail("Internal server error", 500);
  }
}
