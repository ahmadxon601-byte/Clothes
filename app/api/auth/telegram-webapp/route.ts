import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { query } from "@/src/lib/db";
import { signToken } from "@/src/lib/jwt";
import { ok, fail } from "@/src/lib/auth";

/**
 * Telegram Mini App initData ni verifikatsiya qiladi.
 * Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * secret_key = HMAC_SHA256("WebAppData", bot_token)
 * hash       = HMAC_SHA256(data_check_string, secret_key)
 */
function verifyInitData(initData: string, botToken: string): {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
} {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) throw new Error("hash topilmadi");

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== receivedHash) {
    throw new Error("initData signature yaroqsiz");
  }

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("user maydoni topilmadi");

  return JSON.parse(userRaw);
}

// ── POST /api/auth/telegram-webapp ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return fail("Bot token sozlanmagan", 500);

    const body = await req.json();
    const { initData } = body as { initData?: string };
    if (!initData) return fail("initData talab qilinadi", 400);

    // 1. initData ni verifikatsiya qilamiz
    let tgUser: { id: number; first_name?: string; username?: string };
    try {
      tgUser = verifyInitData(initData, botToken);
    } catch (e) {
      return fail(e instanceof Error ? e.message : "initData yaroqsiz", 401);
    }

    // 2. Foydalanuvchini DB dan topamiz
    const result = await query(
      `SELECT id, name, email, role, telegram_id, phone
       FROM users
       WHERE telegram_id = $1`,
      [tgUser.id]
    );

    if (result.rows.length === 0) {
      // Foydalanuvchi hali phone yuboribmagan — botda /start bosishi kerak
      return fail(
        "Avval botda telefon raqamingizni yuboring (@qulaymarketuzbot)",
        404
      );
    }

    const user = result.rows[0];

    // 3. JWT token yaratamiz
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return ok({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        telegram_id: user.telegram_id,
        phone: user.phone,
      },
    });
  } catch (e) {
    console.error("[telegram-webapp auth]", e);
    return fail("Internal server error", 500);
  }
}
