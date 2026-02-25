import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

// ── DELETE /api/comments/[id]  (own comment or admin) ────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const jwtUser = requireAuth(req);
    const { id } = await params;

    const commentResult = await query(
      "SELECT id, user_id FROM comments WHERE id = $1",
      [id]
    );
    if (commentResult.rows.length === 0) return fail("Comment not found", 404);

    const comment = commentResult.rows[0];
    if (jwtUser.role !== "admin" && comment.user_id !== jwtUser.userId) {
      return fail("Forbidden", 403);
    }

    await query("DELETE FROM comments WHERE id = $1", [id]);
    return ok({ message: "Comment deleted" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[comment DELETE]", e);
    return fail("Internal server error", 500);
  }
}
