import { InlineKeyboard } from "grammy";
import { getMarketplaceUrl } from "./get-marketplace-url";
import { getWebhookBot } from "./create-webhook-bot";

type DailyDealInviteNotification = {
  telegramId: number;
  title: string;
  message: string;
  storeName: string;
  startsAt: string;
  endsAt: string;
};

export async function notifyDailyDealInviteViaTelegram({
  telegramId,
  title,
  message,
  storeName,
  startsAt,
  endsAt,
}: DailyDealInviteNotification): Promise<void> {
  const bot = getWebhookBot();
  if (!bot) return;

  const webAppUrl = `${getMarketplaceUrl()}/telegram/profile/products`;
  const text = [
    `Sizga yangi chegirma taklifi yuborildi.`,
    "",
    `Chegirma: ${title}`,
    `Do'kon: ${storeName}`,
    "",
    message.trim(),
    "",
    `Boshlanish: ${new Date(startsAt).toLocaleString()}`,
    `Tugash: ${new Date(endsAt).toLocaleString()}`,
    "",
    `Mahsulotlaringizni tanlash uchun tugmani bosing.`,
  ].join("\n");

  const keyboard = new InlineKeyboard().webApp("Mahsulot tanlash", webAppUrl);

  try {
    await bot.api.sendMessage(telegramId, text, {
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.warn("[daily-deal notify] failed to send message", {
      telegramId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
