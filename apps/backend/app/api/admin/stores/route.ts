import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";

// ── GET /api/admin/stores ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");

    const s = req.nextUrl.searchParams;
    const search = s.get("search")?.trim() || null;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(st.name ILIKE $${idx} OR st.address ILIKE $${idx})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) FROM stores st ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataResult = await query(
      `SELECT
         st.id, st.name, st.description, st.phone, st.address,
         st.is_active, st.created_at,
         u.id AS owner_id, u.name AS owner_name, u.email AS owner_email,
         (SELECT COUNT(*) FROM products p
          WHERE p.store_id = st.id) AS product_count
       FROM stores st
       JOIN users u ON u.id = st.owner_id
       ${where}
       ORDER BY st.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return ok({
      stores: dataResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/stores GET]", e);
    return fail("Internal server error", 500);
  }
}
