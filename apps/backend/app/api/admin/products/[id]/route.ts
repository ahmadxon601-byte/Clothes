import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

// ── DELETE /api/admin/products/[id] ──────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    requireRole(req, "admin");
    const { id } = await params;

    const result = await query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) return fail("Product not found", 404);

    return ok({ message: "Product deleted" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/products DELETE]", e);
    return fail("Internal server error", 500);
  }
}

// ── PATCH /api/admin/products/[id]  (toggle is_active) ───────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    requireRole(req, "admin");
    const { id } = await params;
    const body = await req.json();

    if (typeof body.is_active !== "boolean") {
      return fail("is_active (boolean) required", 422);
    }

    const result = await query(
      `UPDATE products SET is_active = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, name, is_active`,
      [body.is_active, id]
    );
    if (result.rows.length === 0) return fail("Product not found", 404);

    return ok({ product: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/products PATCH]", e);
    return fail("Internal server error", 500);
  }
}
