import { query } from "@/src/lib/db";
import { ok, fail } from "@/src/lib/auth";

// GET /api/banners — returns the first active banner with full product details
export async function GET() {
  try {
    const { rows } = await query(`
      SELECT
        b.id, b.title, b.product_ids,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'base_price', p.base_price,
              'thumbnail', (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1),
              'sale_price', (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id)
            )
            ORDER BY array_position(b.product_ids, p.id)
          )
          FROM products p
          WHERE p.id = ANY(b.product_ids) AND p.is_active = true),
          '[]'
        ) AS products
      FROM banners b
      WHERE b.is_active = true
      ORDER BY b.created_at DESC
      LIMIT 1
    `);

    if (rows.length === 0) return ok({ banner: null });
    return ok({ banner: rows[0] });
  } catch (e) {
    console.error("[banners GET]", e);
    return fail("Internal server error", 500);
  }
}
