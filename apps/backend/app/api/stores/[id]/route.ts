import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/stores/[id] ──────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT
         st.id, st.name, st.description, st.phone, st.address, st.created_at,
         u.id AS owner_id, u.name AS owner_name,
         (SELECT COUNT(*) FROM products p
          WHERE p.store_id = st.id AND p.is_active = TRUE) AS product_count
       FROM stores st
       JOIN users u ON u.id = st.owner_id
       WHERE st.id = $1 AND st.is_active = TRUE`,
      [id]
    );

    if (result.rows.length === 0) return fail("Store not found", 404);
    return ok({ store: result.rows[0] });
  } catch (e) {
    console.error("[store GET]", e);
    return fail("Internal server error", 500);
  }
}

const updateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().optional(),
});

// ── PATCH /api/stores/[id] ────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const jwtUser = requireAuth(req);
    const { id } = await params;

    const storeResult = await query(
      "SELECT owner_id FROM stores WHERE id = $1 AND is_active = TRUE",
      [id]
    );
    if (storeResult.rows.length === 0) return fail("Store not found", 404);
    if (jwtUser.role !== "admin" && storeResult.rows[0].owner_id !== jwtUser.userId) {
      return fail("Forbidden", 403);
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (parsed.data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(parsed.data.name); }
    if (parsed.data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(parsed.data.description); }
    if (parsed.data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(parsed.data.phone); }
    if (parsed.data.address !== undefined) { fields.push(`address = $${idx++}`); values.push(parsed.data.address); }

    if (fields.length === 0) return fail("Nothing to update", 422);
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE stores SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, description, phone, address, created_at`,
      values
    );
    return ok({ store: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[store PATCH]", e);
    return fail("Internal server error", 500);
  }
}

// ── DELETE /api/stores/[id] ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const jwtUser = requireAuth(req);
    const { id } = await params;

    const storeResult = await query(
      "SELECT owner_id FROM stores WHERE id = $1 AND is_active = TRUE",
      [id]
    );
    if (storeResult.rows.length === 0) return fail("Store not found", 404);
    if (jwtUser.role !== "admin" && storeResult.rows[0].owner_id !== jwtUser.userId) {
      return fail("Forbidden", 403);
    }

    await query("UPDATE stores SET is_active = FALSE, updated_at = NOW() WHERE id = $1", [id]);
    if (jwtUser.role === "seller") {
      await query("UPDATE users SET role = 'user', updated_at = NOW() WHERE id = $1", [jwtUser.userId]);
    }
    return ok({ message: "Store deactivated" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[store DELETE]", e);
    return fail("Internal server error", 500);
  }
}
