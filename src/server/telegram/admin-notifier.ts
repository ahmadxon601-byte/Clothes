import { InlineKeyboard } from "grammy";
import { getMarketplaceUrl } from "./get-marketplace-url";
import { getAdminWebhookBot } from "./create-admin-webhook-bot";
import { listAdminTelegramChatIds } from "./admin-chat-subscriptions";

type NotifyAdminsOptions = {
  text: string;
  route: string;
};

export async function notifyAdminsViaTelegram({ text, route }: NotifyAdminsOptions): Promise<void> {
  const bot = getAdminWebhookBot();
  if (!bot) {
    console.warn("[admin-bot notify] skipped: ADMIN_TELEGRAM_BOT_TOKEN is missing");
    return;
  }

  try {
    const chatIds = await listAdminTelegramChatIds();
    if (chatIds.length === 0) {
      console.warn("[admin-bot notify] skipped: no subscribed admin chats found");
      return;
    }

    const keyboard = new InlineKeyboard().webApp(
      "Admin panelni ochish",
      `${getMarketplaceUrl()}${route}`
    );

    await Promise.all(
      chatIds.map(async (chatId) => {
        try {
          await bot.api.sendMessage(chatId, text, {
            reply_markup: keyboard,
            link_preview_options: { is_disabled: true },
          });
        } catch (error) {
          console.warn("[admin-bot notify] failed to send message", {
            chatId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })
    );
  } catch (error) {
    console.error("[admin-bot notify]", error);
  }
}
