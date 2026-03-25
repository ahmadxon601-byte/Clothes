import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

// PATCH /api/notifications/[id] — mark as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE id::text = $1 AND user_id = $2`,
      [id, user.userId]
    );
    return ok({ updated: true });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}
