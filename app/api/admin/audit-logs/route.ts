import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireRole, paginate, AuthError } from "@/src/lib/auth";

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");

    const s = req.nextUrl.searchParams;
    const { page, limit, offset } = paginate(s.get("page"), s.get("limit"));
    const entity = s.get("entity") || null;
    const action = s.get("action") || null;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (entity) {
      params.push(entity);
      conditions.push(`"tableName" = $${params.length}`);
    }
    if (action) {
      params.push(action);
      conditions.push(`operation = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*) FROM audit_logs ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT
         id,
         admin_uuid AS admin_id,
         "performedByUsername" AS admin_name,
         operation AS action,
         "tableName" AS entity,
         "entityId" AS entity_id,
         "newData" AS details,
         "performedAt" AS created_at
       FROM audit_logs
       ${where}
       ORDER BY "performedAt" DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return ok({
      logs: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/audit-logs GET]", e);
    return fail("Internal server error", 500);
  }
}
