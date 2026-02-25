import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

// GET /api/orders/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;

    const {
      rows: [order],
    } = await query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [id, user.userId]
    );
    if (!order) return fail("Order not found", 404);

    const { rows: items } = await query(
      `SELECT oi.id, oi.quantity, oi.unit_price,
              pv.size, pv.color,
              p.id AS product_id, p.name AS product_name,
              (SELECT pi.url FROM product_images pi
               WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image_url
       FROM order_items oi
       JOIN product_variants pv ON pv.id = oi.variant_id
       JOIN products          p  ON p.id  = pv.product_id
       WHERE oi.order_id = $1`,
      [id]
    );

    return ok({ ...order, items });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}
