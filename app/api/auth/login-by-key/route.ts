import { NextRequest } from "next/server";
import { query } from "@/src/lib/db";
import { signToken } from "@/src/lib/jwt";
import { ok, fail } from "@/src/lib/auth";
import { hasAccessKeyColumn } from "@/src/lib/accessKeySupport";
import { normalizeAccessKey } from "@/src/lib/accessKeyService";

export async function POST(req: NextRequest) {
  try {
    await hasAccessKeyColumn();
    const { key } = await req.json();
    if (!key || typeof key !== "string") return fail("Kalit so'z kiritilmadi", 422);

    const normalized = normalizeAccessKey(key);
    if (normalized.length !== 8) return fail("Kalit so'z noto'g'ri", 422);

    const result = await query(
      `SELECT id, name, email, role, phone, telegram_id, created_at, access_key
       FROM users
       WHERE upper(regexp_replace(coalesce(access_key, ''), '[^A-Za-z0-9]', '', 'g')) = $1`,
      [normalized]
    );

    if (result.rows.length === 0) {
      return fail("Kalit so'z topilmadi", 401);
    }

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return ok({ user, token });
  } catch (e) {
    console.error("[login-by-key]", e);
    return fail("Internal server error", 500);
  }
}
