import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { signToken } from "@/src/lib/jwt";
import { ok, fail } from "@/src/lib/auth";
import { generateAccessKey } from "@/src/lib/accessKey";

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
    const accessKey = generateAccessKey();
    const result = await query(
      `INSERT INTO users (name, email, password_hash, access_key)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, access_key`,
      [name, email, hash, accessKey]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return ok({ user, token }, 201);
  } catch (e) {
    console.error("[register]", e);
    const errCode =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: unknown }).code ?? "")
        : "";
    const msg = e instanceof Error ? e.message : "";
    if (
      msg.includes("password must be a string") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("connect ECONN") ||
      msg.includes("authentication failed") ||
      msg.includes("password authentication failed") ||
      msg.includes("getaddrinfo ENOTFOUND") ||
      msg.includes('database "pos" does not exist') ||
      msg.includes("no pg_hba.conf entry") ||
      ["ECONNREFUSED", "28P01", "3D000", "ENOTFOUND"].includes(errCode)
    ) {
      return fail("Database connection error. Backend DB sozlamalarini tekshiring.", 503);
    }
    return fail("Internal server error", 500);
  }
}
