import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { emitAdminEvent } from "@/src/lib/events";
import { getSellerRequestSupport } from "@/src/lib/sellerRequestSupport";
import { getStoreColumnSupport } from "@/src/lib/storeColumnSupport";
import { saveStagedImages } from "@/src/lib/stagedImages";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/stores/[id] ──────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT
         st.id, st.name, st.description, st.phone, st.address, st.image_url, st.created_at,
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
  image_url: z.string().nullable().optional(),
});

// ── PATCH /api/stores/[id] ────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const jwtUser = requireAuth(req);
    const { id } = await params;
    const support = await getSellerRequestSupport();
    const storeSupport = await getStoreColumnSupport();

    const storeResult = await query(
      "SELECT st.owner_id, st.name, u.name AS owner_name FROM stores st JOIN users u ON u.id = st.owner_id WHERE st.id = $1 AND st.is_active = TRUE",
      [id]
    );
    if (storeResult.rows.length === 0) return fail("Store not found", 404);
    if (jwtUser.role !== "admin" && storeResult.rows[0].owner_id !== jwtUser.userId) {
      return fail("Forbidden", 403);
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const hasChanges =
      parsed.data.name !== undefined ||
      parsed.data.description !== undefined ||
      parsed.data.phone !== undefined ||
      parsed.data.address !== undefined ||
      parsed.data.image_url !== undefined;
    if (!hasChanges) return fail("Nothing to update", 422);

    if (jwtUser.role === "admin") {
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (parsed.data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(parsed.data.name); }
      if (parsed.data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(parsed.data.description); }
      if (parsed.data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(parsed.data.phone); }
      if (parsed.data.address !== undefined) { fields.push(`address = $${idx++}`); values.push(parsed.data.address); }
      if (parsed.data.image_url !== undefined) { fields.push(`image_url = $${idx++}`); values.push(parsed.data.image_url); }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await query(
        `UPDATE stores SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, description, phone, address, image_url, created_at`,
        values
      );
      emitAdminEvent({ type: "stores", action: "updated" });
      return ok({ store: result.rows[0] });
    }

    if (!support.hasRequestType || !support.hasTargetStoreId) {
      return fail("Store update review migration is not applied yet", 503);
    }

    const existingPending = await query(
      `SELECT id
       FROM seller_requests
       WHERE user_id = $1
         AND status = 'pending'
         AND request_type = 'store_update'
         AND target_store_id = $2
       LIMIT 1`,
      [jwtUser.userId, id]
    );
    if (existingPending.rows.length > 0) {
      return fail("Bu do'kon uchun pending tahrirlash arizasi allaqachon mavjud", 409);
    }

    if (storeSupport.hasSellerRequestImageUrl) {
      const insertResult = await query(
        `INSERT INTO seller_requests
           (user_id, store_name, store_description, owner_name, phone, address, image_url, request_type, target_store_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'store_update', $8)
         RETURNING id`,
        [
          jwtUser.userId,
          parsed.data.name ?? storeResult.rows[0].name,
          parsed.data.description ?? null,
          storeResult.rows[0].owner_name,
          parsed.data.phone ?? null,
          parsed.data.address ?? null,
          null,
          id,
        ]
      );
      if (insertResult.rows[0]?.id && parsed.data.image_url) {
        await saveStagedImages("seller-request", insertResult.rows[0].id, [parsed.data.image_url]);
      }
    } else {
      const insertResult = await query(
        `INSERT INTO seller_requests
           (user_id, store_name, store_description, owner_name, phone, address, request_type, target_store_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'store_update', $7)
         RETURNING id`,
        [
          jwtUser.userId,
          parsed.data.name ?? storeResult.rows[0].name,
          parsed.data.description ?? null,
          storeResult.rows[0].owner_name,
          parsed.data.phone ?? null,
          parsed.data.address ?? null,
          id,
        ]
      );
      if (insertResult.rows[0]?.id && parsed.data.image_url) {
        await saveStagedImages("seller-request", insertResult.rows[0].id, [parsed.data.image_url]);
      }
    }

    emitAdminEvent({ type: "seller_requests", action: "created" });
    return ok({ message: "Store update request submitted for admin approval" });
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
    emitAdminEvent({ type: "stores", action: "deleted" });
    return ok({ message: "Store deactivated" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[store DELETE]", e);
    return fail("Internal server error", 500);
  }
}
