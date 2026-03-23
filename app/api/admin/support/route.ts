import { NextRequest } from "next/server";
import { ok, fail, requireRole, AuthError } from "@/src/lib/auth";
import { query } from "@/src/lib/db";
import { ensureSupportTables } from "@/src/lib/support";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, "admin");
    await ensureSupportTables();

    const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
    const params: unknown[] = [];
    const filters: string[] = [];

    if (search) {
      params.push(`%${search}%`);
      filters.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const result = await query(
      `SELECT
         c.id,
         c.user_id,
         c.status,
         c.last_message_at,
         c.created_at,
         u.name AS user_name,
         u.email AS user_email,
         COALESCE(
           (
             SELECT sm.body
             FROM support_messages sm
             WHERE sm.conversation_id = c.id
             ORDER BY sm.created_at DESC
             LIMIT 1
           ),
           ''
         ) AS last_message,
         COALESCE(
           (
             SELECT COUNT(*)::int
             FROM support_messages sm
             WHERE sm.conversation_id = c.id
               AND sm.sender_role = 'user'
               AND sm.is_read = FALSE
           ),
           0
         ) AS unread_count
       FROM support_conversations c
       JOIN users u ON u.id = c.user_id
       ${where}
       ORDER BY c.last_message_at DESC, c.created_at DESC`,
      params
    );

    return ok({ conversations: result.rows });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[admin/support GET]", e);
    return fail("Internal server error", 500);
  }
}
