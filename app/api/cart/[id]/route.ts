import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

// DELETE /api/cart/[id] — remove item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    await query(
      `DELETE FROM cart_items WHERE id = $1 AND user_id = $2`,
      [id, user.userId]
    );
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}

// PATCH /api/cart/[id] — update quantity (body: { quantity })
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const { quantity } = await req.json();
    if (!quantity || quantity < 1) return fail("quantity must be >= 1");

    const {
      rows: [item],
    } = await query(
      `UPDATE cart_items SET quantity = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [quantity, id, user.userId]
    );
    if (!item) return fail("Cart item not found", 404);

    return ok(item);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}
