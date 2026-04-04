import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "@/src/lib/db";
import { signToken } from "@/src/lib/jwt";
import { ok, fail, failWithHeaders } from "@/src/lib/auth";
import { requireAllowedAdminTelegramUser } from "@/src/server/telegram/admin-webapp-auth";
import { enforceRateLimit } from "@/src/lib/rateLimit";

const schema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
  initData: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    enforceRateLimit({ key: `admin-login:${ip}`, limit: 8, windowMs: 60_000 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0].message, 422);
    }

    const { login, password, initData } = parsed.data;

    if (initData) {
      try {
        await requireAllowedAdminTelegramUser(initData);
      } catch (error) {
        return fail(error instanceof Error ? error.message : "Telegram admin access rad etildi", 403);
      }
    }

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
    if (e instanceof Error && e.message.startsWith("RATE_LIMIT:")) {
      const retryAfter = e.message.split(":")[1] || "60";
      return failWithHeaders("Too many login attempts. Please try again later.", 429, {
        "Retry-After": retryAfter,
      });
    }
    console.error("[admin-login]", e);
    return fail("Server xatosi", 500);
  }
}
