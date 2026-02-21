"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const grammy_1 = require("grammy");
const config_1 = require("./config");
// Initialize the bot with the token from config
const bot = new grammy_1.Bot(config_1.config.telegramBotToken);
// --- Bot Logic ---
// 1. Handle /start command - Ask for phone number
bot.command("start", async (ctx) => {
    console.log("DEBUG: /start command received from", ctx.from?.username);
    const keyboard = new grammy_1.Keyboard()
        .requestContact("Raqamni yuborish")
        .resized()
        .oneTime();
    await ctx.reply(`Assalomu alaykum ${ctx.from?.first_name || "foydalanuvchi"}! 👋\n\nRo'yxatdan o'tish uchun telefon raqamingizni yuboring.`, { reply_markup: keyboard });
});
// 2. Handle contact (phone number) sharing
bot.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact;
    // Placeholder: In a real app, you would save this to a database
    console.log("Received contact:", contact);
    const marketplaceUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://fast-candles-teach.loca.lt";
    const inlineKeyboard = new grammy_1.InlineKeyboard()
        .webApp("🛒 Open Marketplace", marketplaceUrl);
    await ctx.reply(`Xush kelibsiz, ${contact.first_name}! ✅\n\nMarketplace'ni ochish uchun pastdagi tugmani bosing:`, { reply_markup: inlineKeyboard });
});
async function telegramWebhook(app) {
    // Use grammy's built-in webhook handler with better error catching
    app.post("/telegram/webhook", async (req, reply) => {
        try {
            app.log.info({ body: req.body }, "Webhook hit!");
            return await (0, grammy_1.webhookCallback)(bot, "fastify")(req, reply);
        }
        catch (error) {
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
exports.default = (0, fastify_plugin_1.default)(telegramWebhook, {
    name: "telegram-webhook"
});
