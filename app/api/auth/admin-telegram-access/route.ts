import { NextRequest } from "next/server";
import { ok, fail } from "@/src/lib/auth";
import { requireAllowedAdminTelegramUser } from "@/src/server/telegram/admin-webapp-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const initData = typeof body?.initData === "string" ? body.initData : "";
    if (!initData) {
      return fail("initData talab qilinadi", 400);
    }

    const result = await requireAllowedAdminTelegramUser(initData);
    return ok({
      username: result.access.username,
      role: result.access.role,
      telegram_id: result.telegramUser.id,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Telegram admin access rad etildi", 403);
  }
}
