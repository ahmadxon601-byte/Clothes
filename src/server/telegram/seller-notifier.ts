import { InlineKeyboard } from "grammy";
import { getMarketplaceUrl } from "./get-marketplace-url";
import { getWebhookBot } from "./create-webhook-bot";

type SellerDecisionNotification = {
  telegramId: number;
  status: "approved" | "rejected";
  storeName: string;
  note?: string | null;
  isUpdate?: boolean;
};

export async function notifySellerDecisionViaTelegram({
  telegramId,
  status,
  storeName,
  note,
  isUpdate = false,
}: SellerDecisionNotification): Promise<void> {
  const bot = getWebhookBot();
  if (!bot) return;

  const cleanNote = note?.trim() || "";
  const webAppUrl = `${getMarketplaceUrl()}/tg-auth`;

  const text =
    status === "approved"
      ? isUpdate
        ? `Do'koningiz bo'yicha o'zgarishlar tasdiqlandi.\n\nDo'kon: ${storeName}\n\nMarketplace ichida yangilangan ma'lumotlarni ko'rishingiz mumkin.`
        : `Tabriklaymiz! Do'koningiz tasdiqlandi.\n\nDo'kon: ${storeName}\n\nIshlaringizga omad. Marketplace ichida do'koningizni ochishingiz mumkin.`
      : `Do'kon arizangiz rad etildi.\n\nDo'kon: ${storeName}\n${cleanNote ? `\nRad etish sababi: ${cleanNote}\n` : "\nRad etish sababi ko'rsatilmagan.\n"}\nTuzatib, qayta ariza yuborishingiz mumkin.`;

  const keyboard =
    status === "approved"
      ? new InlineKeyboard().webApp(
          isUpdate ? "Web Appni ochish" : "Do'konni ochish",
          webAppUrl
        )
      : undefined;

  try {
    await bot.api.sendMessage(telegramId, text, {
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.warn("[seller-bot notify] failed to send message", {
      telegramId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
