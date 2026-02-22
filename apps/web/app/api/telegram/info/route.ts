import { NextResponse } from "next/server";
import { getWebhookBot } from "@/src/server/telegram/create-webhook-bot";

export const runtime = "nodejs";

export async function GET() {
  const bot = getWebhookBot();
  if (!bot) {
    return NextResponse.json(
      { ok: false, error: "missing_telegram_bot_token" },
      { status: 500 }
    );
  }

  try {
    const info = await bot.api.getMe();
    return NextResponse.json({ ok: true, bot: info.username });
  } catch (error) {
    console.error("Error fetching Telegram bot info:", error);
    return NextResponse.json(
      { ok: false, error: "telegram_info_error" },
      { status: 500 }
    );
  }
}
