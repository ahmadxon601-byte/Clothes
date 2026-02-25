import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);

    const result = await query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [jwtUser.userId]
    );

    if (result.rows.length === 0) {
      return fail("User not found", 404);
    }

    return ok({ user: result.rows[0] });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[me]", e);
    return fail("Internal server error", 500);
  }
}
