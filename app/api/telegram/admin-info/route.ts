import { NextResponse } from "next/server";
import { getAdminWebhookBot } from "@/src/server/telegram/create-admin-webhook-bot";

export const runtime = "nodejs";

export async function GET() {
  const bot = getAdminWebhookBot();
  if (!bot) {
    return NextResponse.json(
      { ok: false, error: "missing_admin_telegram_bot_token" },
      { status: 500 }
    );
  }

  try {
    const info = await bot.api.getMe();
    return NextResponse.json({ ok: true, bot: info.username });
  } catch (error) {
    console.error("Error fetching admin Telegram bot info:", error);
    return NextResponse.json(
      { ok: false, error: "admin_telegram_info_error" },
      { status: 500 }
    );
  }
}
