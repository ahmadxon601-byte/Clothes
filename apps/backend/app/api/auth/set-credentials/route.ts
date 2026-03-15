import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { ok, fail, requireAuth, AuthError } from "@/src/lib/auth";

const schema = z.object({
  email: z.string().email("Noto'g'ri email format"),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
});

// PUT /api/auth/set-credentials
// Allows Telegram-only users to set a real email + password for web login
export async function PUT(req: NextRequest) {
  try {
    const jwtUser = requireAuth(req);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message, 422);

    const { email, password } = parsed.data;

    // Check email not already taken by another user
    const existing = await query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email.toLowerCase(), jwtUser.userId]
    );
    if (existing.rows.length > 0) return fail("Bu email allaqachon band", 409);

    const hash = await bcrypt.hash(password, 10);
    await query(
      "UPDATE users SET email = $1, password_hash = $2, updated_at = NOW() WHERE id = $3",
      [email.toLowerCase(), hash, jwtUser.userId]
    );

    return ok({ message: "Web kirish ma'lumotlari saqlandi" });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    console.error("[set-credentials]", e);
    return fail("Internal server error", 500);
  }
}
