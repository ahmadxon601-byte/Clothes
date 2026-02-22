import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { getMarketplaceUrl } from "./get-marketplace-url";

export const registerTelegramHandlers = (bot: Bot): void => {
  bot.command("start", async (ctx) => {
    const keyboard = new Keyboard().requestContact("Raqamni yuborish").resized().oneTime();

    await ctx.reply(
      `Assalomu alaykum ${ctx.from?.first_name || "foydalanuvchi"}! 👋\n\nRo'yxatdan o'tish uchun telefon raqamingizni yuboring.`,
      { reply_markup: keyboard }
    );
  });

  bot.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact;
    const marketplaceUrl = getMarketplaceUrl();

    const inlineKeyboard = new InlineKeyboard().webApp("🛒 Open Marketplace", marketplaceUrl);

    await ctx.reply(
      `Xush kelibsiz, ${contact.first_name}! ✅\n\nMarketplace'ni ochish uchun pastdagi tugmani bosing:`,
      { reply_markup: inlineKeyboard }
    );
  });
};
