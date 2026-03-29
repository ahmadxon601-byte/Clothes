import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";
import { getSellerRequestSupport } from "@/src/lib/sellerRequestSupport";
import { readFirstStagedImage } from "@/src/lib/stagedImages";

// ── GET /api/admin/seller-requests ────────────────────────────────────────────
// Query params: status (pending|approved|rejected), page, limit
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");
    const support = await getSellerRequestSupport();

    const s = req.nextUrl.searchParams;
    const statusParam = s.get("status");
    const status = statusParam && statusParam !== "" ? statusParam : null;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const whereClause = status ? "WHERE sr.status = $1" : "";
    const countParams = status ? [status] : [];

    const countResult = await query(
      `SELECT COUNT(*) FROM seller_requests ${status ? "WHERE status = $1" : ""}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT sr.id, sr.store_name,
              ${support.hasRequestType ? "sr.request_type" : "'store_create'::text AS request_type"},
              ${support.hasTargetStoreId ? "sr.target_store_id" : "NULL::uuid AS target_store_id"},
              sr.store_description, sr.owner_name,
              sr.phone AS store_phone, sr.address AS store_address, sr.status,
              st.id AS store_id,
              st.is_active AS store_is_active,
              st.name AS current_store_name,
              st.description AS current_store_description,
              st.phone AS current_store_phone,
              st.address AS current_store_address,
              sr.admin_note, sr.created_at, sr.updated_at, sr.image_url,
              u.name AS user_name, u.email AS user_email
       FROM seller_requests sr
       JOIN users u ON u.id = sr.user_id
       LEFT JOIN stores st ON (
         ${support.hasTargetStoreId ? "(sr.target_store_id IS NOT NULL AND st.id = sr.target_store_id)" : "FALSE"}
         OR
         (
           ${support.hasRequestType ? "sr.request_type = 'store_create'" : "TRUE"}
           AND st.owner_id = sr.user_id
           AND LOWER(st.name) = LOWER(sr.store_name)
         )
       )
       ${whereClause}
       ORDER BY sr.created_at DESC
       LIMIT $${status ? 2 : 1} OFFSET $${status ? 3 : 2}`,
      status ? [status, limit, offset] : [limit, offset]
    );

    const requests = await Promise.all(
      dataResult.rows.map(async (row) => ({
        ...row,
        image_url:
          (await readFirstStagedImage("seller-request", String(row.id))) ??
          row.image_url ??
          null,
      }))
    );

    return ok({
      requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/seller-requests GET]", e);
    return fail("Internal server error", 500);
  }
}
