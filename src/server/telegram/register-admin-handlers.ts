import { Bot, InlineKeyboard } from "grammy";
import { getMarketplaceUrl } from "./get-marketplace-url";

const adminPanelButton = () =>
  new InlineKeyboard().webApp("Admin panelni ochish", `${getMarketplaceUrl()}/admin/dashboard`);

export const registerAdminTelegramHandlers = (bot: Bot): void => {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      `Assalomu alaykum ${ctx.from?.first_name || "admin"}.\n\n` +
        `Bu alohida admin bot. Yangi arizalar va mahsulot ko'rib chiqish so'rovlari shu yerga keladi.\n\n` +
        `Pastdagi tugma orqali admin panelni ochishingiz mumkin.`,
      { reply_markup: adminPanelButton() }
    );
  });

  bot.command("panel", async (ctx) => {
    await ctx.reply("Admin panelni ochish uchun tugmani bosing.", {
      reply_markup: adminPanelButton(),
    });
  });
};
