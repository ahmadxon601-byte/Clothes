import { InlineKeyboard } from "grammy";
import { query } from "../../lib/db";
import { getMarketplaceUrl } from "./get-marketplace-url";
import { getAdminWebhookBot } from "./create-admin-webhook-bot";

type NotifyAdminsOptions = {
  text: string;
  route: string;
};

export async function notifyAdminsViaTelegram({ text, route }: NotifyAdminsOptions): Promise<void> {
  const bot = getAdminWebhookBot();
  if (!bot) return;

  try {
    const admins = await query(
      "SELECT id, telegram_id FROM users WHERE role = 'admin' AND telegram_id IS NOT NULL"
    );
    if (admins.rows.length === 0) return;

    const keyboard = new InlineKeyboard().webApp(
      "Admin panelni ochish",
      `${getMarketplaceUrl()}${route}`
    );

    await Promise.all(
      admins.rows.map(async (row) => {
        const chatId = Number(row.telegram_id);
        if (!Number.isFinite(chatId)) return;
        try {
          await bot.api.sendMessage(chatId, text, {
            reply_markup: keyboard,
            link_preview_options: { is_disabled: true },
          });
        } catch (error) {
          console.warn("[admin-bot notify] failed to send message", {
            adminId: row.id,
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
