import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

// GET /api/cart — list current user's cart
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const { rows } = await query(
      `SELECT ci.id, ci.quantity, ci.variant_id,
              pv.size, pv.color, pv.price AS unit_price,
              p.id AS product_id, p.name AS title,
              (SELECT pi.url FROM product_images pi
               WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS image_url,
              s.name AS store_name
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       JOIN products          p  ON p.id  = pv.product_id
       JOIN stores            s  ON s.id  = p.store_id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [user.userId]
    );

    const subtotal = rows.reduce(
      (sum, r) => sum + Number(r.unit_price) * r.quantity,
      0
    );
    const delivery = rows.length > 0 ? 15 : 0;

    return ok({ items: rows, subtotal, delivery, total: subtotal + delivery });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}

// POST /api/cart — add item (body: { variant_id, quantity? })
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { variant_id, quantity = 1 } = await req.json();
    if (!variant_id) return fail("variant_id is required");

    const {
      rows: [variant],
    } = await query(
      `SELECT id, stock FROM product_variants WHERE id = $1`,
      [variant_id]
    );
    if (!variant) return fail("Variant not found", 404);
    if (variant.stock < quantity) return fail("Not enough stock");

    const {
      rows: [item],
    } = await query(
      `INSERT INTO cart_items (user_id, variant_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, variant_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [user.userId, variant_id, quantity]
    );

    return ok(item, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}
