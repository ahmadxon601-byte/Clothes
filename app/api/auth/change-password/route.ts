import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";
import { logAction } from "@/src/lib/audit";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const { currentPassword, newPassword } = parsed.data;

    const result = await query(
      "SELECT password_hash FROM users WHERE id = $1",
      [jwtUser.userId]
    );
    if (result.rows.length === 0) return fail("User not found", 404);

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return fail("Joriy parol noto'g'ri", 401);

    const hash = await bcrypt.hash(newPassword, 10);
    await query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hash, jwtUser.userId]
    );

    logAction({ admin: jwtUser, action: "change_password", entity: "user", entityId: jwtUser.userId });
    return ok({ message: "Parol muvaffaqiyatli o'zgartirildi" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[change-password]", e);
    return fail("Internal server error", 500);
  }
}
