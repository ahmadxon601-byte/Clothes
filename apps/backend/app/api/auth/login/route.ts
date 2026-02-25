import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { signToken } from "@/src/lib/jwt";
import { ok, fail } from "@/src/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0].message, 422);
    }

    const { email, password } = parsed.data;

    const result = await query(
      "SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return fail("Invalid credentials", 401);
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return fail("Invalid credentials", 401);
    }

    const { password_hash: _, ...safeUser } = user;
    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });

    return ok({ user: safeUser, token });
  } catch (e) {
    console.error("[login]", e);
    return fail("Internal server error", 500);
  }
}
