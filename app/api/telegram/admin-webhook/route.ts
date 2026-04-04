import { webhookCallback } from "grammy";
import { NextResponse } from "next/server";
import { getAdminWebhookBot } from "@/src/server/telegram/create-admin-webhook-bot";

export const runtime = "nodejs";

type WebhookHandler = (request: Request) => Promise<Response>;

let cachedWebhookHandler: WebhookHandler | null = null;

const getWebhookHandler = (): WebhookHandler | null => {
  if (cachedWebhookHandler) {
    return cachedWebhookHandler;
  }

  const secretToken = process.env.ADMIN_TELEGRAM_WEBHOOK_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !secretToken) {
    throw new Error("ADMIN_TELEGRAM_WEBHOOK_SECRET is required in production");
  }

  const bot = getAdminWebhookBot();
  if (!bot) {
    return null;
  }

  cachedWebhookHandler = webhookCallback(bot, "std/http", {
    secretToken: secretToken || undefined,
  });

  return cachedWebhookHandler;
};

export async function POST(request: Request) {
  const handler = getWebhookHandler();
  if (!handler) {
    return NextResponse.json(
      { ok: false, error: "missing_admin_telegram_bot_token" },
      { status: 500 }
    );
  }

  try {
    return await handler(request);
  } catch (error) {
    console.error("Error processing admin Telegram webhook:", error);
    return NextResponse.json(
      { ok: false, error: "admin_webhook_error" },
      { status: 500 }
    );
  }
}
