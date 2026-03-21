import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { getMarketplaceUrl } from "./get-marketplace-url";
import { query } from "../../lib/db";
import { emitAdminEvent } from "../../lib/events";
import { generateAccessKey } from "../../lib/accessKey";

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
        `Clothes Marketplace'ga xush kelibsiz!\n\n` +
        `Davom etish uchun:\n` +
        `• 📱 Telefon raqamingizni yuboring\n` +
        `• 🔑 Yoki desktop profilingizdagi kalit so'zni yuboring`,
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
      // Preserve existing access_key if user already exists
      const existing = await query(
        "SELECT access_key FROM users WHERE telegram_id = $1 OR email = $2 LIMIT 1",
        [telegramId, placeholderEmail]
      );
      const accessKey =
        existing.rows.length > 0 && existing.rows[0].access_key
          ? existing.rows[0].access_key
          : generateAccessKey();

      await query(
        `INSERT INTO users (name, email, password_hash, telegram_id, phone, access_key)
         VALUES ($1, $2, 'TELEGRAM_AUTH_ONLY', $3, $4, $5)
         ON CONFLICT (telegram_id) WHERE telegram_id IS NOT NULL
         DO UPDATE SET
           name       = EXCLUDED.name,
           phone      = EXCLUDED.phone,
           access_key = COALESCE(users.access_key, EXCLUDED.access_key),
           updated_at = NOW()`,
        [name, placeholderEmail, telegramId, phone, accessKey]
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

  // ── Text message: check if it's an access key ─────────────────────────────
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim().toUpperCase();
    const telegramId = ctx.from?.id;

    // Ignore commands
    if (text.startsWith("/")) return;

    // Access key: exactly 8 alphanumeric chars
    if (!/^[A-Z0-9]{8}$/.test(text)) {
      await ctx.reply(
        `Kalit so'z 8 ta belgidan iborat bo'lishi kerak.\n` +
          `Yoki telefon raqamingizni yuboring.`
      );
      return;
    }

    if (!telegramId) {
      await ctx.reply("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      return;
    }

    try {
      const result = await query(
        "SELECT id, name FROM users WHERE access_key = $1",
        [text]
      );

      if (result.rows.length === 0) {
        await ctx.reply(
          `❌ Kalit so'z topilmadi.\n` +
            `Iltimos, to'g'ri kalit so'zni kiriting yoki telefon raqamingizni yuboring.`
        );
        return;
      }

      const user = result.rows[0];

      // Remove telegram_id from any other user that currently holds it (unlink old account)
      await query(
        "UPDATE users SET telegram_id = NULL, updated_at = NOW() WHERE telegram_id = $1 AND id != $2",
        [telegramId, user.id]
      );

      // Link this telegram account to the found user
      await query(
        "UPDATE users SET telegram_id = $1, updated_at = NOW() WHERE id = $2",
        [telegramId, user.id]
      );

      await ctx.reply(
        `✅ Muvaffaqiyatli! ${user.name} akkountiga ulandingiz.\n\n` +
          `Endi pastdagi tugma orqali do'konni oching.`,
        { reply_markup: marketplaceButton() }
      );
    } catch (err) {
      console.error("[bot] key login error:", err);
      await ctx.reply("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  });
};
