import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";
import { getProductReviewSupport } from "@/src/lib/productReview";

// ── GET /api/admin/products ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");

    const s = req.nextUrl.searchParams;
    const reviewSupport = await getProductReviewSupport();
    const search = s.get("search")?.trim() || null;
    const storeId = s.get("store_id") || null;
    const statusParam = s.get("status") || null;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(p.name ILIKE $${idx} OR p.sku ILIKE $${idx})`);
    }
    if (storeId) {
      params.push(storeId);
      conditions.push(`p.store_id = $${params.length}`);
    }
    if (statusParam === "active") {
      conditions.push(`p.is_active = TRUE`);
    } else if (statusParam === "inactive") {
      conditions.push(`p.is_active = FALSE`);
    } else if (statusParam && ["pending", "approved", "rejected"].includes(statusParam)) {
      if (statusParam === "pending" && reviewSupport.hasPendingUpdatePayload) {
        conditions.push(`(p.pending_update_payload IS NOT NULL${reviewSupport.hasReviewStatus ? " OR p.review_status = 'pending'" : ""})`);
      } else if (reviewSupport.hasReviewStatus) {
        params.push(statusParam);
        conditions.push(`p.review_status = $${params.length}`);
        if (statusParam === "approved" && reviewSupport.hasPendingUpdatePayload) {
          conditions.push(`p.pending_update_payload IS NULL`);
        }
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) FROM products p ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT
         p.id, p.name, p.description, p.base_price, p.sku, p.views, p.is_active, p.category_id,
         ${
           reviewSupport.hasPendingUpdatePayload
             ? `CASE
                  WHEN p.pending_update_payload IS NOT NULL THEN 'pending'::text
                  ${reviewSupport.hasReviewStatus ? "ELSE p.review_status" : "ELSE 'approved'::text"}
                END AS review_status`
             : reviewSupport.hasReviewStatus
               ? "p.review_status"
               : "'approved'::text AS review_status"
         },
         ${
           reviewSupport.hasPendingUpdatePayload
             ? `CASE
                  WHEN p.pending_update_payload IS NOT NULL THEN NULL::text
                  ${reviewSupport.hasReviewNote ? "ELSE p.review_note" : "ELSE NULL::text"}
                END AS review_note`
             : reviewSupport.hasReviewNote
               ? "p.review_note"
               : "NULL::text AS review_note"
         },
         ${reviewSupport.hasPendingUpdatePayload ? "p.pending_update_payload" : "NULL::jsonb AS pending_update_payload"},
         COALESCE(
           (
             SELECT jsonb_agg(
               jsonb_build_object('url', pi.url, 'sort_order', pi.sort_order)
               ORDER BY pi.sort_order, pi.id
             )
             FROM product_images pi
             WHERE pi.product_id = p.id
           ),
           '[]'::jsonb
         ) AS current_images,
         COALESCE(
           (
             SELECT jsonb_agg(
               jsonb_build_object('size', pv.size, 'color', pv.color, 'price', pv.price, 'stock', pv.stock)
               ORDER BY COALESCE(pv.size, ''), COALESCE(pv.color, ''), pv.price, pv.stock, pv.id
             )
             FROM product_variants pv
             WHERE pv.product_id = p.id
           ),
           '[]'::jsonb
         ) AS current_variants,
         p.created_at,
         c.name AS category_name,
         ${
           reviewSupport.hasPendingUpdatePayload
             ? `CASE
                  WHEN p.pending_update_payload ? 'category_id'
                   AND COALESCE(p.pending_update_payload->>'category_id', '') <> ''
                  THEN (
                    SELECT c2.name
                    FROM categories c2
                    WHERE c2.id = (p.pending_update_payload->>'category_id')::uuid
                  )
                  ELSE NULL::text
                END AS pending_category_name`
             : "NULL::text AS pending_category_name"
         },
         st.id AS store_id, st.name AS store_name,
         (SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN stores st    ON st.id = p.store_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return ok({
      products: dataResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/products GET]", e);
    return fail("Internal server error", 500);
  }
}
