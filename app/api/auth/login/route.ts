import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { signToken } from "@/src/lib/jwt";
import { ok, fail, failWithHeaders } from "@/src/lib/auth";
import { enforceRateLimit } from "@/src/lib/rateLimit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    enforceRateLimit({ key: `login:${ip}`, limit: 10, windowMs: 60_000 });

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
    if (e instanceof Error && e.message.startsWith("RATE_LIMIT:")) {
      const retryAfter = e.message.split(":")[1] || "60";
      return failWithHeaders("Too many login attempts. Please try again later.", 429, {
        "Retry-After": retryAfter,
      });
    }
    console.error("[login]", e);
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
