import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";

// GET /api/admin/orders — all orders (admin only)
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");

    const s = req.nextUrl.searchParams;
    const status = s.get("status") || null;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      conditions.push(`o.status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) FROM orders o ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT
         o.id, o.status, o.total_price, o.address, o.created_at, o.updated_at,
         u.id AS user_id, u.name AS user_name, u.email AS user_email,
         (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id)::int AS items_count
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return ok({
      orders: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/orders GET]", e);
    return fail("Internal server error", 500);
  }
}

// PATCH /api/admin/orders — update order status
export async function PATCH(req: NextRequest) {
  try {
    requireRole(req, "admin");
    const { id, status } = await req.json();
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!id || !status || !validStatuses.includes(status)) {
      return fail("Invalid id or status");
    }
    const { rows } = await query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (rows.length === 0) return fail("Order not found", 404);
    return ok(rows[0]);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/orders PATCH]", e);
    return fail("Internal server error", 500);
  }
}
