import { createHmac, timingSafeEqual } from "crypto";
import { getTelegramAdminAccess } from "./admin-access";

type TelegramInitUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export function verifyTelegramWebAppInitData(initData: string, botToken: string): TelegramInitUser {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) throw new Error("hash topilmadi");

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const expected = Buffer.from(computedHash, "hex");
  const actual = Buffer.from(receivedHash, "hex");

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("initData signature yaroqsiz");
  }

  const authDate = Number(params.get("auth_date") ?? "0");
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate <= 0 || now - authDate > 3600) {
    throw new Error("initData muddati tugagan");
  }

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("user maydoni topilmadi");

  return JSON.parse(userRaw) as TelegramInitUser;
}

export async function requireAllowedAdminTelegramUser(initData: string) {
  const botToken = process.env.ADMIN_TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    throw new Error("ADMIN_TELEGRAM_BOT_TOKEN sozlanmagan");
  }

  const tgUser = verifyTelegramWebAppInitData(initData, botToken);
  const access = await getTelegramAdminAccess(tgUser.username);
  if (!access?.is_active) {
    throw new Error("Sizga admin panelga kirish ruxsati berilmagan");
  }

  return {
    telegramUser: tgUser,
    access,
  };
}
