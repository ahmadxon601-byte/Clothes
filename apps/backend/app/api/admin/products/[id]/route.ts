import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { emitAdminEvent } from "@/src/lib/events";
import { logAction } from "@/src/lib/audit";

type Params = { params: Promise<{ id: string }> };

// ── DELETE /api/admin/products/[id] ──────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;

    const result = await query(
      "DELETE FROM products WHERE id = $1 RETURNING id, name",
      [id]
    );
    if (result.rows.length === 0) return fail("Product not found", 404);
    emitAdminEvent({ type: "products", action: "deleted" });
    logAction({ admin, action: "delete", entity: "product", entityId: id, details: { name: result.rows[0].name } });
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
    const admin = requireRole(req, "admin");
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
    emitAdminEvent({ type: "products", action: "updated" });
    logAction({ admin, action: "update", entity: "product", entityId: id, details: { is_active: body.is_active } });
    return ok({ product: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/products PATCH]", e);
    return fail("Internal server error", 500);
  }
}
