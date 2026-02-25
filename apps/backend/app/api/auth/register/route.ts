import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { signToken } from "@/src/lib/jwt";
import { ok, fail } from "@/src/lib/auth";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0].message, 422);
    }

    const { name, email, password } = parsed.data;

    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return fail("Email already in use", 409);
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, hash]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return ok({ user, token }, 201);
  } catch (e) {
    console.error("[register]", e);
    return fail("Internal server error", 500);
  }
}
