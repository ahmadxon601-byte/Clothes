import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

// DELETE /api/favorites/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    await query(
      `DELETE FROM favorites WHERE id = $1 AND user_id = $2`,
      [id, user.userId]
    );
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Server error", 500);
  }
}
