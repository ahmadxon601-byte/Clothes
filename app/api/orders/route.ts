import { NextRequest } from "next/server";
import pool, { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError, paginate } from "@/src/lib/auth";
import { emitAdminEvent } from "@/src/lib/events";

// GET /api/orders — list user's orders
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const s = req.nextUrl.searchParams;
    const { limit, offset } = paginate(s.get("page"), s.get("limit"));

    const { rows } = await query(
      `SELECT o.id, o.status, o.total_price, o.address, o.created_at, o.updated_at,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::int AS items_count,
              (SELECT pi.url
               FROM order_items oi2
               JOIN product_variants pv ON pv.id = oi2.variant_id
               JOIN product_images   pi ON pi.product_id = pv.product_id
               WHERE oi2.order_id = o.id
               ORDER BY pi.sort_order LIMIT 1) AS first_image
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.userId, limit, offset]
    );

    return ok(rows);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}

// POST /api/orders — checkout (creates order from cart)
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { address } = await req.json();

    // Fetch cart
    const { rows: cartItems } = await query(
      `SELECT ci.quantity, ci.variant_id, pv.price, pv.stock
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       WHERE ci.user_id = $1`,
      [user.userId]
    );

    if (cartItems.length === 0) return fail("Cart is empty");

    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return fail(`Not enough stock for variant #${item.variant_id}`);
      }
    }

    const subtotal = cartItems.reduce(
      (sum, i) => sum + Number(i.price) * i.quantity,
      0
    );
    const total = subtotal + 15; // fixed delivery

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const {
        rows: [order],
      } = await client.query(
        `INSERT INTO orders (user_id, status, total_price, address)
         VALUES ($1, 'pending', $2, $3)
         RETURNING *`,
        [user.userId, total, address ?? null]
      );

      for (const item of cartItems) {
        await client.query(
          `INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.variant_id, item.quantity, item.price]
        );
        await client.query(
          `UPDATE product_variants SET stock = stock - $1 WHERE id = $2`,
          [item.quantity, item.variant_id]
        );
      }

      await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [
        user.userId,
      ]);

      await client.query("COMMIT");
      emitAdminEvent({ type: "orders", action: "created" });
      return ok(order, 201);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}
