import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { Bot, Keyboard, InlineKeyboard, webhookCallback } from "grammy";
import { config } from "./config";

// Initialize the bot with the token from config
const bot = new Bot(config.telegramBotToken);

// --- Bot Logic ---

// 1. Handle /start command - Ask for phone number
bot.command("start", async (ctx) => {
  console.log("DEBUG: /start command received from", ctx.from?.username);
  const keyboard = new Keyboard()
    .requestContact("Raqamni yuborish")
    .resized()
    .oneTime();

  await ctx.reply(
    `Assalomu alaykum ${ctx.from?.first_name || "foydalanuvchi"}! 👋\n\nRo'yxatdan o'tish uchun telefon raqamingizni yuboring.`,
    { reply_markup: keyboard }
  );
});

// 2. Handle contact (phone number) sharing
bot.on("message:contact", async (ctx) => {
  const contact = ctx.message.contact;

  // Placeholder: In a real app, you would save this to a database
  console.log("Received contact:", contact);

  const marketplaceUrl = process.env.URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://clothesmarketplace.netlify.app");

  const inlineKeyboard = new InlineKeyboard()
    .webApp("🛒 Open Marketplace", marketplaceUrl);

  await ctx.reply(
    `Xush kelibsiz, ${contact.first_name}! ✅\n\nMarketplace'ni ochish uchun pastdagi tugmani bosing:`,
    { reply_markup: inlineKeyboard }
  );
});

async function telegramWebhook(app: FastifyInstance) {
  // Use grammy's built-in webhook handler with better error catching
  app.post("/telegram/webhook", async (req, reply) => {
    try {
      app.log.info({ body: req.body }, "Webhook hit!");
      return await webhookCallback(bot, "fastify")(req, reply);
    } catch (error) {
      app.log.error({ error }, "Error processing Telegram webhook");
      return reply.code(500).send({ ok: false, error: "webhook_error" });
    }
  });

  // Health check/Status for the bot
  app.get("/telegram/info", async () => {
    const info = await bot.api.getMe();
    return { ok: true, bot: info.username };
  });
}

export default fp(telegramWebhook, {
  name: "telegram-webhook"
});
