import { NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";

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

    return ok(result.rows[0]);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[me GET]", e);
    return fail("Internal server error", 500);
  }
}

const updateSchema = z.object({
  name: z.string().min(2).max(255),
});

export async function PATCH(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const result = await query(
      `UPDATE users SET name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, created_at`,
      [parsed.data.name, jwtUser.userId]
    );

    if (result.rows.length === 0) return fail("User not found", 404);
    logAction({ admin: jwtUser, action: "update_profile", entity: "user", entityId: jwtUser.userId, details: { name: parsed.data.name } });
    return ok(result.rows[0]);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[me PATCH]", e);
    return fail("Internal server error", 500);
  }
}
