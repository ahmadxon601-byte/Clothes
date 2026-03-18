import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { rows } = await query(
      `SELECT id, title, body, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.userId]
    );
    return ok(rows);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}
