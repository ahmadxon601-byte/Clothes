import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Bot } from "grammy";
import { getAdminTelegramToken } from "../src/server/telegram/create-admin-webhook-bot";
import { registerAdminTelegramHandlers } from "../src/server/telegram/register-admin-handlers";

if (process.env.NODE_ENV && process.env.NODE_ENV !== "development") {
  console.warn("admin-telegram-polling script is intended for local development usage.");
}

const localEnvPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}
dotenv.config();

const token = getAdminTelegramToken();
if (!token) {
  console.error("CRITICAL ERROR: ADMIN_TELEGRAM_BOT_TOKEN is missing.");
  process.exit(1);
}

const bot = new Bot(token);
registerAdminTelegramHandlers(bot);

bot.catch((err) => {
  console.error("[admin-bot] unhandled error:", err.message);
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Admin bot @${botInfo.username} is running locally via Long Polling.`);
  },
}).catch((error) => {
  console.error("Failed to start admin bot polling:", error);
  process.exit(1);
});
