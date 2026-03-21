import { NextRequest } from "next/server";
import pool, { query } from "@/src/lib/db";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { emitAdminEvent } from "@/src/lib/events";
import { logAction } from "@/src/lib/audit";
import { getProductReviewSupport } from "@/src/lib/productReview";

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = requireRole(req, "admin");
    const { id } = await params;
    const body = await req.json();
    const reviewSupport = await getProductReviewSupport();
    const currentResult = await query(
      `SELECT id, is_active
              ${reviewSupport.hasReviewStatus ? ", review_status" : ""}
              ${reviewSupport.hasReviewNote ? ", review_note" : ""}
              ${reviewSupport.hasPendingUpdatePayload ? ", pending_update_payload" : ""}
       FROM products
       WHERE id = $1`,
      [id]
    );
    if (currentResult.rows.length === 0) return fail("Product not found", 404);

    const current = currentResult.rows[0] as {
      is_active: boolean;
      review_status?: string;
      review_note?: string | null;
      pending_update_payload?: {
        name?: string;
        description?: string | null;
        base_price?: number;
        category_id?: string | null;
        images?: Array<{ url: string; sort_order: number }>;
        variants?: Array<{ size?: string; color?: string; price: number; stock: number }>;
      } | null;
    };

    const fields = ["updated_at = NOW()"];
    const vals: unknown[] = [];

    if (
      body.review_status === "approved" &&
      reviewSupport.hasPendingUpdatePayload &&
      current.pending_update_payload
    ) {
      const pending = current.pending_update_payload;
      const db = await pool.connect();
      try {
        await db.query("BEGIN");

        const applyFields = ["updated_at = NOW()", "pending_update_payload = NULL", "is_active = TRUE"];
        const applyVals: unknown[] = [];

        if (reviewSupport.hasReviewStatus) {
          applyFields.push(`review_status = 'approved'`);
        }
        if (reviewSupport.hasReviewNote) {
          applyFields.push(`review_note = NULL`);
        }
        if (pending.name !== undefined) { applyVals.push(pending.name); applyFields.push(`name = $${applyVals.length}`); }
        if (pending.description !== undefined) { applyVals.push(pending.description); applyFields.push(`description = $${applyVals.length}`); }
        if (pending.base_price !== undefined) { applyVals.push(pending.base_price); applyFields.push(`base_price = $${applyVals.length}`); }
        if (pending.category_id !== undefined) { applyVals.push(pending.category_id); applyFields.push(`category_id = $${applyVals.length}`); }

        applyVals.push(id);
        const updated = await db.query(
          `UPDATE products
           SET ${applyFields.join(", ")}
           WHERE id = $${applyVals.length}
           RETURNING id, name, is_active${reviewSupport.hasReviewStatus ? ", review_status" : ""}${reviewSupport.hasReviewNote ? ", review_note" : ""}`,
          applyVals
        );

        if (pending.images !== undefined) {
          await db.query("DELETE FROM product_images WHERE product_id = $1", [id]);
          for (const img of pending.images) {
            await db.query(
              "INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, $3)",
              [id, img.url, img.sort_order]
            );
          }
        }

        if (pending.variants !== undefined) {
          const skuResult = await db.query("SELECT sku FROM products WHERE id = $1", [id]);
          const productSku = skuResult.rows[0]?.sku ?? "PRD";
          await db.query("DELETE FROM product_variants WHERE product_id = $1", [id]);
          for (const variant of pending.variants) {
            const sizeCode = (variant.size ?? "UNI").slice(0, 3).toUpperCase();
            const colorCode = (variant.color ?? "STD").slice(0, 3).toUpperCase();
            const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
            const sku = `${productSku}-${sizeCode}-${colorCode}-${rand}`;
            await db.query(
              `INSERT INTO product_variants (product_id, size, color, price, stock, sku)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [id, variant.size ?? null, variant.color ?? null, variant.price, variant.stock, sku]
            );
          }
        }

        await db.query("COMMIT");

        emitAdminEvent({ type: "products", action: "updated" });
        logAction({
          admin,
          action: "approve",
          entity: "product",
          entityId: id,
          details: { review_status: body.review_status, pending_update_applied: true },
        });
        return ok({ product: updated.rows[0] });
      } catch (e) {
        await db.query("ROLLBACK");
        throw e;
      } finally {
        db.release();
      }
    }

    if (typeof body.review_status === "string") {
      if (!reviewSupport.hasReviewStatus) {
        return fail("Product review migration is not applied yet", 503);
      }
      if (!["pending", "approved", "rejected"].includes(body.review_status)) {
        return fail("Invalid review_status", 422);
      }

      vals.push(body.review_status);
      fields.push(`review_status = $${vals.length}`);

      if (body.review_status === "approved") {
        fields.push("is_active = TRUE");
        if (reviewSupport.hasReviewNote) {
          fields.push("review_note = NULL");
        }
        if (reviewSupport.hasPendingUpdatePayload) {
          fields.push("pending_update_payload = NULL");
        }
      } else if (body.review_status === "rejected") {
        if (reviewSupport.hasPendingUpdatePayload && current.pending_update_payload) {
          fields.push("pending_update_payload = NULL");
          fields.push("is_active = TRUE");
          if (reviewSupport.hasReviewStatus) {
            fields.push("review_status = 'approved'");
          }
          if (reviewSupport.hasReviewNote) {
            fields.push("review_note = NULL");
          }
        } else {
          fields.push("is_active = FALSE");
          if (reviewSupport.hasReviewNote) {
            vals.push(typeof body.review_note === "string" ? body.review_note.trim() || null : null);
            fields.push(`review_note = $${vals.length}`);
          }
        }
      } else {
        fields.push("is_active = FALSE");
        if (reviewSupport.hasReviewNote) {
          fields.push("review_note = NULL");
        }
      }
    }

    if (typeof body.is_active === "boolean") {
      vals.push(body.is_active);
      fields.push(`is_active = $${vals.length}`);
    }

    if (reviewSupport.hasReviewNote && typeof body.review_note === "string" && !("review_status" in body)) {
      vals.push(body.review_note.trim() || null);
      fields.push(`review_note = $${vals.length}`);
    }

    if (fields.length === 1) {
      return fail("No valid fields to update", 422);
    }

    vals.push(id);
    const result = await query(
      `UPDATE products SET ${fields.join(", ")}
       WHERE id = $${vals.length}
       RETURNING id, name, is_active${reviewSupport.hasReviewStatus ? ", review_status" : ""}${reviewSupport.hasReviewNote ? ", review_note" : ""}`,
      vals
    );
    if (result.rows.length === 0) return fail("Product not found", 404);

    emitAdminEvent({ type: "products", action: "updated" });
    logAction({
      admin,
      action: body.review_status === "approved" ? "approve" : body.review_status === "rejected" ? "reject" : "update",
      entity: "product",
      entityId: id,
      details: {
        is_active: body.is_active,
        review_status: body.review_status,
        review_note: body.review_note,
      },
    });
    return ok({ product: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/products PATCH]", e);
    return fail("Internal server error", 500);
  }
}
