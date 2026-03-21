import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, paginate } from "@/src/lib/auth";

// ── GET /api/stores ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const s = req.nextUrl.searchParams;
    const search = s.get("search")?.trim() || null;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const conditions = ["st.is_active = TRUE"];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(st.name ILIKE $${idx} OR st.description ILIKE $${idx})`);
    }

    const where = conditions.join(" AND ");

    const countResult = await query(
      `SELECT COUNT(*) FROM stores st WHERE ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT
         st.id, st.name, st.description, st.phone, st.address, st.image_url, st.created_at,
         u.id AS owner_id, u.name AS owner_name,
         (SELECT COUNT(*) FROM products p WHERE p.store_id = st.id AND p.is_active = TRUE) AS product_count
       FROM stores st
       JOIN users u ON u.id = st.owner_id
       WHERE ${where}
       ORDER BY st.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return ok({
      stores: dataResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[stores GET]", e);
    return fail("Internal server error", 500);
  }
}
