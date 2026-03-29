import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/admin/stores/[id] ─────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;
    const body = await req.json();

    const updates: string[] = [];
    const values: unknown[] = [];

    if (typeof body.is_active === "boolean") {
      values.push(body.is_active);
      updates.push(`is_active = $${values.length}`);
    }

    if (typeof body.image_url === "string" || body.image_url === null) {
      values.push(body.image_url ?? null);
      updates.push(`image_url = $${values.length}`);
    }

    if (updates.length === 0) {
      return fail("is_active (boolean) or image_url required", 422);
    }

    values.push(id);
    const result = await query(
      `UPDATE stores SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING id, name, is_active, image_url`,
      values
    );
    if (result.rows.length === 0) return fail("Store not found", 404);
    logAction({
      admin,
      action: "update",
      entity: "store",
      entityId: id,
      details: { is_active: body.is_active, image_url: body.image_url ?? undefined },
    });

    return ok({ store: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/stores PATCH]", e);
    return fail("Internal server error", 500);
  }
}

// ── DELETE /api/admin/stores/[id] ─────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;

    const result = await query(
      "DELETE FROM stores WHERE id = $1 RETURNING id, name",
      [id]
    );
    if (result.rows.length === 0) return fail("Store not found", 404);
    logAction({ admin, action: "delete", entity: "store", entityId: id, details: { name: result.rows[0].name } });

    return ok({ message: "Store deleted" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/stores DELETE]", e);
    return fail("Internal server error", 500);
  }
}
