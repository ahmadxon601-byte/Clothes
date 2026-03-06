import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { signToken } from "@/src/lib/jwt";
import { ok, fail } from "@/src/lib/auth";

const schema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0].message, 422);
    }

    const { login, password } = parsed.data;

    // login orqali faqat admin roleli foydalanuvchilarni topish
    const result = await query(
      `SELECT id, name, email, password_hash, role, created_at
       FROM users
       WHERE (name = $1 OR email = $1) AND role = 'admin'
       LIMIT 1`,
      [login]
    );

    if (result.rows.length === 0) {
      return fail("Login yoki parol noto'g'ri", 401);
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return fail("Login yoki parol noto'g'ri", 401);
    }

    const { password_hash: _, ...safeUser } = user;
    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });

    return ok({ user: safeUser, token });
  } catch (e) {
    console.error("[admin-login]", e);
    return fail("Server xatosi", 500);
  }
}
