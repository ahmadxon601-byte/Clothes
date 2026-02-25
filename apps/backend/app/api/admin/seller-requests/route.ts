import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";

// ── GET /api/admin/seller-requests ────────────────────────────────────────────
// Query params: status (pending|approved|rejected), page, limit
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");

    const s = req.nextUrl.searchParams;
    const status = s.get("status") || "pending";
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));

    const countResult = await query(
      "SELECT COUNT(*) FROM seller_requests WHERE status = $1",
      [status]
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT sr.*, u.name AS user_name, u.email AS user_email
       FROM seller_requests sr
       JOIN users u ON u.id = sr.user_id
       WHERE sr.status = $1
       ORDER BY sr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    return ok({
      requests: dataResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/seller-requests GET]", e);
    return fail("Internal server error", 500);
  }
}
