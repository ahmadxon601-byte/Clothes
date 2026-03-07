import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { getMarketplaceUrl } from "./get-marketplace-url";
import { query } from "../../lib/db";
import { emitAdminEvent } from "../../lib/events";

export const registerTelegramHandlers = (bot: Bot): void => {
  // ── Helper: marketplace WebApp button ────────────────────────────────────
  const marketplaceButton = () => {
    const url = `${getMarketplaceUrl()}/tg-auth`;
    return new InlineKeyboard().webApp("🛒 Do'konni ochish", url);
  };

  // ── /start ────────────────────────────────────────────────────────────────
  bot.command("start", async (ctx) => {
    const keyboard = new Keyboard()
      .requestContact("📱 Telefon raqamni yuborish")
      .resized()
      .oneTime();

    await ctx.reply(
      `Assalomu alaykum ${ctx.from?.first_name || "foydalanuvchi"}! 👋\n\n` +
        `Clothes Marketplace'ga xush kelibsiz!\n` +
        `Davom etish uchun telefon raqamingizni yuboring.`,
      { reply_markup: keyboard }
    );
  });

  // ── /shop — marketplace linkini qayta olish ───────────────────────────────
  bot.command("shop", async (ctx) => {
    await ctx.reply(
      `🛍️ Do'konni ochish uchun pastdagi tugmani bosing:`,
      { reply_markup: marketplaceButton() }
    );
  });

  // ── Phone contact ─────────────────────────────────────────────────────────
  bot.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact;
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      await ctx.reply("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      return;
    }

    const name =
      [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
      "Foydalanuvchi";
    const phone = contact.phone_number.replace(/\D/g, "");
    const placeholderEmail = `tg_${telegramId}@t.me`;

    try {
      await query(
        `INSERT INTO users (name, email, password_hash, telegram_id, phone)
         VALUES ($1, $2, 'TELEGRAM_AUTH_ONLY', $3, $4)
         ON CONFLICT (telegram_id) WHERE telegram_id IS NOT NULL
         DO UPDATE SET
           name       = EXCLUDED.name,
           phone      = EXCLUDED.phone,
           updated_at = NOW()`,
        [name, placeholderEmail, telegramId, phone]
      );
    } catch (err) {
      console.error("[bot] upsert user error:", err);
      await ctx.reply(
        "Akkount yaratishda xatolik. Iltimos bir oz kutib qayta urinib ko'ring."
      );
      return;
    }

    emitAdminEvent({ type: "users", action: "created" });

    await ctx.reply(
      `✅ Akkountingiz tayyor, ${contact.first_name}!\n\n` +
        `Endi pastdagi tugma orqali do'konni oching.\n` +
        `Siz avtomatik tarzda tizimga kirasiz.`,
      { reply_markup: marketplaceButton() }
    );
  });
};
