import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Bot } from "grammy";
import { getTelegramToken } from "../src/server/telegram/create-webhook-bot";
import { registerTelegramHandlers } from "../src/server/telegram/register-handlers";

if (process.env.NODE_ENV && process.env.NODE_ENV !== "development") {
  console.warn("telegram-polling script is intended for local development usage.");
}

const localEnvPath = path.resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}
dotenv.config();

const token = getTelegramToken();
if (!token) {
  console.error("CRITICAL ERROR: TELEGRAM_BOT_TOKEN is missing.");
  process.exit(1);
}

const bot = new Bot(token);
registerTelegramHandlers(bot);

bot.catch((err) => {
  console.error("[bot] unhandled error:", err.message);
});

bot.start({
  onStart: (botInfo) => {
    console.log(`Bot @${botInfo.username} is running locally via Long Polling.`);
  }
}).catch((error) => {
  console.error("Failed to start bot polling:", error);
  process.exit(1);
});
