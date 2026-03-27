import { NextRequest } from "next/server";
import { z } from "zod";
import pool, { query } from "@/src/lib/db";
import { ok, fail, getUser, requireRole, AuthError } from "@/src/lib/auth";
import { emitAdminEvent } from "@/src/lib/events";
import { getProductReviewSupport } from "@/src/lib/productReview";
import { notifyAdminsViaTelegram } from "@/src/server/telegram/admin-notifier";

type Params = { params: Promise<{ id: string }> };

const PRODUCT_DETAIL_SQL = `
  SELECT
    p.*,
    c.id   AS category_id,   c.name AS category_name, c.slug AS category_slug,
    st.id  AS store_id,      st.name AS store_name,
    COALESCE(
      JSON_AGG(DISTINCT jsonb_build_object(
        'id', pi.id, 'url', pi.url, 'sort_order', pi.sort_order
      )) FILTER (WHERE pi.id IS NOT NULL),
      '[]'
    ) AS images,
    COALESCE(
      JSON_AGG(DISTINCT jsonb_build_object(
        'id', pv.id, 'size', pv.size, 'color', pv.color,
        'price', pv.price, 'stock', pv.stock, 'sku', pv.sku
      )) FILTER (WHERE pv.id IS NOT NULL),
      '[]'
    ) AS variants,
    CASE WHEN pl.id IS NOT NULL THEN
      jsonb_build_object(
        'latitude',  pl.latitude,
        'longitude', pl.longitude,
        'address',   pl.address
      )
    ELSE NULL END AS location
  FROM products p
  LEFT JOIN categories c       ON c.id  = p.category_id
  LEFT JOIN stores st           ON st.id = p.store_id
  LEFT JOIN product_images pi   ON pi.product_id = p.id
  LEFT JOIN product_variants pv ON pv.product_id = p.id
  LEFT JOIN product_locations pl ON pl.product_id = p.id
  WHERE p.id = $1
  GROUP BY p.id, c.id, c.name, c.slug, st.id, st.name,
           pl.id, pl.latitude, pl.longitude, pl.address
`;

// ── GET /api/products/[id] ────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const viewer = getUser(req);
    const reviewSupport = await getProductReviewSupport();

    if (!viewer) {
      const visibleResult = await query(
        `SELECT id FROM products
         WHERE id = $1
           AND is_active = TRUE
           ${reviewSupport.hasReviewStatus ? "AND review_status = 'approved'" : ""}`,
        [id]
      );
      if (visibleResult.rows.length === 0) return fail("Product not found", 404);
    } else if (viewer.role !== "admin") {
      const visibleResult = await query(
        `SELECT p.id
         FROM products p
         LEFT JOIN stores st ON st.id = p.store_id
         WHERE p.id = $1
           AND (
             (p.is_active = TRUE ${reviewSupport.hasReviewStatus ? "AND p.review_status = 'approved'" : ""})
             OR st.owner_id = $2
           )`,
        [id, viewer.userId]
      );
      if (visibleResult.rows.length === 0) return fail("Product not found", 404);
    }

    query(
      `UPDATE products SET views = views + 1
       WHERE id = $1
         AND is_active = TRUE
         ${reviewSupport.hasReviewStatus ? "AND review_status = 'approved'" : ""}`,
      [id]
    ).catch(() => {});

    const result = await query(PRODUCT_DETAIL_SQL, [id]);
    if (result.rows.length === 0) return fail("Product not found", 404);

    return ok({ product: result.rows[0] });
  } catch (e) {
    console.error("[product GET]", e);
    return fail("Internal server error", 500);
  }
}

// ── PUT /api/products/[id]  (seller — own products, or admin) ─────────────────
const updateVariantSchema = z.object({
  size: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
});

const updateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  base_price: z.number().positive().optional(),
  category_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  images: z
    .array(z.object({ url: z.string().min(1), sort_order: z.number().int().min(0) }))
    .max(20, "Ko'pi bilan 20 ta rasm yuklash mumkin")
    .optional(),
  variants: z.array(updateVariantSchema).optional(),
});

function genVariantSku(productSku: string, size?: string, color?: string): string {
  const s = (size ?? "UNI").slice(0, 3).toUpperCase();
  const c = (color ?? "STD").slice(0, 3).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${productSku}-${s}-${c}-${rand}`;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const jwtUser = requireRole(req, "seller", "admin");
    const { id } = await params;
    const reviewSupport = await getProductReviewSupport();
    if (jwtUser.role === "seller" && !reviewSupport.hasReviewStatus) {
      return fail("Database schema not ready. Run migrations/008_product_review.sql.", 503);
    }

    let existingProduct:
      | { id: string; sku: string; review_status?: string | null }
      | null = null;

    if (jwtUser.role === "seller") {
      const own = await query(
        `SELECT p.id, p.sku, p.name${reviewSupport.hasReviewStatus ? ", p.review_status" : ""}
         FROM products p
         JOIN stores st ON st.id = p.store_id
         WHERE p.id = $1 AND st.owner_id = $2`,
        [id, jwtUser.userId]
      );
      if (own.rows.length === 0) return fail("Forbidden", 403);
      existingProduct = own.rows[0] as { id: string; sku: string; name?: string; review_status?: string | null };
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const { images, variants, ...rest } = parsed.data;

    const sellerChangedData =
      images !== undefined ||
      variants !== undefined ||
      Object.entries(rest).some(([key, val]) => key !== "is_active" && val !== undefined);

    if (
      jwtUser.role === "seller" &&
      sellerChangedData &&
      reviewSupport.hasPendingUpdatePayload &&
      (existingProduct?.review_status ?? "approved") === "approved"
    ) {
      const pendingPayload: Record<string, unknown> & {
        name?: string;
        base_price?: number;
      } = {
        ...Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined && val !== null)),
        ...(Object.entries(rest).some(([, val]) => val === null) ? Object.fromEntries(Object.entries(rest).filter(([, val]) => val === null)) : {}),
        ...(images !== undefined ? { images } : {}),
        ...(variants !== undefined ? { variants } : {}),
      };

      await query(
        `UPDATE products
         SET pending_update_payload = $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(pendingPayload), id]
      );

      emitAdminEvent({ type: "products", action: "updated" });
      await notifyAdminsViaTelegram({
        text:
          `Mahsulot o'zgarishi ko'rib chiqishga yuborildi.\n\n` +
          `Mahsulot: ${(existingProduct as { name?: string } | null)?.name || id}\n` +
          `${pendingPayload.name ? `Yangi nom: ${String(pendingPayload.name)}\n` : ""}` +
          `${pendingPayload.base_price ? `Yangi narx: ${Number(pendingPayload.base_price).toLocaleString()} UZS\n` : ""}` +
          `Holat: Kutilmoqda`,
        route: "/admin/products",
      });
      return ok({ message: "Product update request submitted for admin approval" });
    }

    const fields: string[] = [];
    const vals: unknown[] = [];

    for (const [key, val] of Object.entries(rest)) {
      if (val === undefined) continue;
      if (jwtUser.role === "seller" && key === "is_active") continue;
      vals.push(val);
      fields.push(`${key} = $${vals.length}`);
    }

    if (
      jwtUser.role === "seller" &&
      sellerChangedData
    ) {
      if (reviewSupport.hasReviewStatus) {
        fields.push(`review_status = 'pending'`);
        fields.push(`is_active = FALSE`);
      }
      if (reviewSupport.hasReviewNote) {
        fields.push(`review_note = NULL`);
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let product: Record<string, unknown>;
      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        vals.push(id);
        const result = await client.query(
          `UPDATE products SET ${fields.join(", ")} WHERE id = $${vals.length} RETURNING *`,
          vals
        );
        if (result.rows.length === 0) { await client.query("ROLLBACK"); return fail("Product not found", 404); }
        product = result.rows[0];
      } else {
        const result = await client.query("SELECT * FROM products WHERE id = $1", [id]);
        if (result.rows.length === 0) { await client.query("ROLLBACK"); return fail("Product not found", 404); }
        product = result.rows[0];
      }

      if (images !== undefined) {
        await client.query("DELETE FROM product_images WHERE product_id = $1", [id]);
        for (const img of images) {
          await client.query(
            "INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, $3)",
            [id, img.url, img.sort_order]
          );
        }
      }

      if (variants !== undefined) {
        await client.query("DELETE FROM product_variants WHERE product_id = $1", [id]);
        const sku = (product as { sku?: string }).sku ?? existingProduct?.sku ?? "PRD";
        for (const v of variants) {
          const vSku = genVariantSku(sku, v.size, v.color);
          await client.query(
            `INSERT INTO product_variants (product_id, size, color, price, stock, sku) VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, v.size ?? null, v.color ?? null, v.price, v.stock, vSku]
          );
        }
      }

      await client.query("COMMIT");
      emitAdminEvent({ type: "products", action: "updated" });
      return ok({ product });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[product PUT]", e);
    return fail("Internal server error", 500);
  }
}

// ── DELETE /api/products/[id]  (seller — own, or admin) ──────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const jwtUser = requireRole(req, "seller", "admin");
    const { id } = await params;

    if (jwtUser.role === "seller") {
      const own = await query(
        `SELECT p.id FROM products p
         JOIN stores st ON st.id = p.store_id
         WHERE p.id = $1 AND st.owner_id = $2`,
        [id, jwtUser.userId]
      );
      if (own.rows.length === 0) return fail("Forbidden", 403);
    }

    const result = await query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) return fail("Product not found", 404);

    emitAdminEvent({ type: "products", action: "deleted" });
    return ok({ message: "Product deleted" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[product DELETE]", e);
    return fail("Internal server error", 500);
  }
}
