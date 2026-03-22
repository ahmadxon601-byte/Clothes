import { Bot, InlineKeyboard } from "grammy";
import { subscribeAdminTelegramChat } from "./admin-chat-subscriptions";
import { getMarketplaceUrl } from "./get-marketplace-url";

const adminPanelButton = () =>
  new InlineKeyboard().webApp("Admin panelni ochish", `${getMarketplaceUrl()}/admin/dashboard`);

export const registerAdminTelegramHandlers = (bot: Bot): void => {
  bot.command("start", async (ctx) => {
    if (ctx.chat?.id) {
      try {
        await subscribeAdminTelegramChat({
          chatId: ctx.chat.id,
          telegramUserId: ctx.from?.id,
          firstName: ctx.from?.first_name,
          username: ctx.from?.username,
        });
      } catch (error) {
        console.error("[admin-bot] failed to subscribe admin chat:", error);
      }
    }

    await ctx.reply(
      `Assalomu alaykum ${ctx.from?.first_name || "admin"}.\n\n` +
        `Bu alohida admin bot. Yangi arizalar va mahsulot ko'rib chiqish so'rovlari shu yerga keladi.\n\n` +
        `Pastdagi tugma orqali admin panelni ochishingiz mumkin.\n\n` +
        `Bu chat admin xabarlari uchun ro'yxatdan o'tkazildi.`,
      { reply_markup: adminPanelButton() }
    );
  });

  bot.command("panel", async (ctx) => {
    let text = "Admin panelni ochish uchun tugmani bosing.";

    if (ctx.chat?.id) {
      try {
        await subscribeAdminTelegramChat({
          chatId: ctx.chat.id,
          telegramUserId: ctx.from?.id,
          firstName: ctx.from?.first_name,
          username: ctx.from?.username,
        });
        text += "\n\nBu chat admin xabarlari uchun ro'yxatdan o'tkazildi.";
      } catch (error) {
        console.error("[admin-bot] failed to subscribe admin chat:", error);
      }
    }

    await ctx.reply(text, {
      reply_markup: adminPanelButton(),
    });
  });
};
