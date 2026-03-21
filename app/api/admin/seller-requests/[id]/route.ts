import { NextRequest } from "next/server";
import { z } from "zod";
import pool, { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { emitAdminEvent } from "@/src/lib/events";
import { logAction } from "@/src/lib/audit";
import { getSellerRequestSupport } from "@/src/lib/sellerRequestSupport";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
});

// ── PUT /api/admin/seller-requests/[id] ──────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;
    const support = await getSellerRequestSupport();

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const { action, note } = parsed.data;

    const reqResult = await query(
      "SELECT * FROM seller_requests WHERE id = $1",
      [id]
    );
    if (reqResult.rows.length === 0) return fail("Request not found", 404);

    const sellerReq = reqResult.rows[0];
    if (sellerReq.status !== "pending") {
      return fail("Request already processed", 409);
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update request status
      await client.query(
        `UPDATE seller_requests
         SET status = $1, admin_note = $2, updated_at = NOW()
         WHERE id = $3`,
        [newStatus, note ?? null, id]
      );

      if (action === "approve") {
        const isStoreUpdate =
          support.hasRequestType &&
          sellerReq.request_type === "store_update" &&
          support.hasTargetStoreId &&
          sellerReq.target_store_id;

        if (isStoreUpdate) {
          await client.query(
            `UPDATE stores
             SET name = $1, description = $2, phone = $3, address = $4, updated_at = NOW()
             WHERE id = $5 AND owner_id = $6`,
            [
              sellerReq.store_name,
              sellerReq.store_description,
              sellerReq.phone,
              sellerReq.address,
              sellerReq.target_store_id,
              sellerReq.user_id,
            ]
          );
        } else {
          await client.query(
            `INSERT INTO stores (owner_id, name, description, phone, address)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              sellerReq.user_id,
              sellerReq.store_name,
              sellerReq.store_description,
              sellerReq.phone,
              sellerReq.address,
            ]
          );

          await client.query(
            "UPDATE users SET role = 'seller', updated_at = NOW() WHERE id = $1",
            [sellerReq.user_id]
          );
        }
      }

      await client.query("COMMIT");
      emitAdminEvent({ type: "seller_requests", action: "updated" });
      emitAdminEvent({ type: "stores", action: "updated" });
      logAction({ admin, action, entity: "seller_request", entityId: id, details: { note, newStatus } });
      return ok({ message: `Request ${newStatus}` });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/seller-requests PUT]", e);
    return fail("Internal server error", 500);
  }
}
